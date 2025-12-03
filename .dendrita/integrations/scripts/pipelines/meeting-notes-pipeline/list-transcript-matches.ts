#!/usr/bin/env npx ts-node
/**
 * Script para listar y gestionar matches de transcripciones guardados en Supabase
 */

import { SupabaseService } from '../../../services/supabase/client';
import { getMatchesForEvent, confirmMatch, rejectMatch } from './manage-transcript-matches';
import { createLogger } from '../../../utils/logger';

const logger = createLogger('ListTranscriptMatches');

/**
 * Lista todos los matches para un evento
 */
async function listMatchesForEvent(eventId: string): Promise<void> {
  try {
    const supa = new SupabaseService();
    if (!supa.isConfigured()) {
      throw new Error('Supabase not configured');
    }

    let db;
    try {
      db = supa.db(true);
    } catch {
      db = supa.db(false);
    }

    // Obtener información del evento
    const { data: event, error: eventError } = await db
      .from('calendar_events')
      .select('id, summary, start_date_time')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      logger.error(`Evento no encontrado: ${eventId}`);
      return;
    }

    logger.info(`\n📅 Evento: ${event.summary}`);
    logger.info(`   Fecha: ${event.start_date_time}`);
    logger.info(`   ID: ${eventId}\n`);

    // Obtener matches
    const matches = await getMatchesForEvent(eventId);

    if (matches.length === 0) {
      logger.info('⚠️  No se encontraron matches para este evento');
      return;
    }

    logger.info(`✅ Encontrados ${matches.length} matches:\n`);

    matches.forEach((match, index) => {
      const statusEmoji = {
        confirmed: '✅',
        pending: '⏳',
        rejected: '❌',
      };

      logger.info(`${index + 1}. ${statusEmoji[match.match_status || 'pending']} ${match.match_status || 'pending'}`);
      logger.info(`   Método: ${match.match_method}`);
      logger.info(`   Score: ${match.match_score}`);
      logger.info(`   File ID: ${match.transcript_file_id}`);
      if (match.transcript_url) {
        logger.info(`   URL: ${match.transcript_url}`);
      }
      logger.info(`   Match ID: ${match.id}`);
      logger.info('');
    });
  } catch (error: any) {
    logger.error('Error al listar matches', error);
    throw error;
  }
}

/**
 * Lista todos los matches pendientes
 */
async function listPendingMatches(): Promise<void> {
  try {
    const supa = new SupabaseService();
    if (!supa.isConfigured()) {
      throw new Error('Supabase not configured');
    }

    let db;
    try {
      db = supa.db(true);
    } catch {
      db = supa.db(false);
    }

    const { data: matches, error } = await db
      .from('event_transcript_matches')
      .select(`
        *,
        calendar_events (
          id,
          summary,
          start_date_time
        )
      `)
      .eq('match_status', 'pending')
      .order('match_score', { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    if (!matches || matches.length === 0) {
      logger.info('✅ No hay matches pendientes');
      return;
    }

    logger.info(`\n⏳ Encontrados ${matches.length} matches pendientes:\n`);

    matches.forEach((match: any, index: number) => {
      const event = match.calendar_events;
      logger.info(`${index + 1}. ${event?.summary || 'Evento desconocido'}`);
      logger.info(`   Fecha: ${event?.start_date_time || 'N/A'}`);
      logger.info(`   Score: ${match.match_score}`);
      logger.info(`   Método: ${match.match_method}`);
      logger.info(`   File ID: ${match.transcript_file_id}`);
      if (match.transcript_url) {
        logger.info(`   URL: ${match.transcript_url}`);
      }
      logger.info(`   Match ID: ${match.id}`);
      logger.info(`   Event ID: ${match.event_id}`);
      logger.info('');
    });
  } catch (error: any) {
    logger.error('Error al listar matches pendientes', error);
    throw error;
  }
}

/**
 * Función principal
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const eventId = args[1];
  const matchId = args[2];

  try {
    switch (command) {
      case 'list':
        if (!eventId) {
          logger.error('Uso: ts-node list-transcript-matches.ts list <event-id>');
          process.exit(1);
        }
        await listMatchesForEvent(eventId);
        break;

      case 'pending':
        await listPendingMatches();
        break;

      case 'confirm':
        if (!matchId) {
          logger.error('Uso: ts-node list-transcript-matches.ts confirm <match-id>');
          process.exit(1);
        }
        const confirmed = await confirmMatch(matchId);
        if (confirmed) {
          logger.info(`✅ Match confirmado: ${matchId}`);
        } else {
          logger.error(`❌ Error al confirmar match: ${matchId}`);
        }
        break;

      case 'reject':
        if (!matchId) {
          logger.error('Uso: ts-node list-transcript-matches.ts reject <match-id>');
          process.exit(1);
        }
        const rejected = await rejectMatch(matchId);
        if (rejected) {
          logger.info(`✅ Match rechazado: ${matchId}`);
        } else {
          logger.error(`❌ Error al rechazar match: ${matchId}`);
        }
        break;

      default:
        logger.error('Uso: ts-node list-transcript-matches.ts <command> [args]');
        logger.error('');
        logger.error('Comandos:');
        logger.error('  list <event-id>     - Lista matches para un evento');
        logger.error('  pending             - Lista todos los matches pendientes');
        logger.error('  confirm <match-id>  - Confirma un match');
        logger.error('  reject <match-id>   - Rechaza un match');
        process.exit(1);
    }
  } catch (error) {
    logger.error('Error fatal', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    logger.error('Error fatal', error);
    process.exit(1);
  });
}

