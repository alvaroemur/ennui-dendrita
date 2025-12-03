#!/usr/bin/env npx ts-node
/**
 * Script de prueba paso a paso del pipeline
 * Prueba cada componente individualmente
 */

import { SupabaseService } from '../../../services/supabase/client';
import { DriveService } from '../../../services/google/drive';
import { findTranscriptForEventId } from './find-transcript-for-event';
import { analyzeTranscript } from '../transcripts-pipeline/analyze/analyze-transcript';
import { findEntryByDate, createNewEntry } from './manage-meeting-notes-entry';
import { updateMetadataFromAnalysis } from './update-meeting-metadata';
import { createLogger } from '../../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('TestStepByStep');

/**
 * Paso 1: Verificar conexión con Supabase y listar eventos recientes
 */
async function step1_ListEvents(): Promise<void> {
  logger.info('=== PASO 1: Listar eventos recientes ===\n');

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

    // Buscar eventos de hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    logger.info(`Buscando eventos de hoy (${today.toISOString().split('T')[0]})...\n`);

    const { data: events, error } = await db
      .from('calendar_events')
      .select('id, google_event_id, summary, start_date_time, end_date_time, calendar_event_attendees (email, display_name)')
      .gte('start_date_time', today.toISOString())
      .lt('start_date_time', tomorrow.toISOString())
      .order('start_date_time', { ascending: true });

    if (error) {
      throw error;
    }

    if (!events || events.length === 0) {
      logger.warn('⚠️  No se encontraron eventos en los últimos 7 días');
      return;
    }

    logger.info(`✅ Encontrados ${events.length} eventos recientes:\n`);
    events.forEach((event: any, index: number) => {
      logger.info(`${index + 1}. ${event.summary}`);
      logger.info(`   ID: ${event.id}`);
      logger.info(`   Fecha: ${event.start_date_time}`);
      logger.info('');
    });

    logger.info('💡 Usa uno de estos IDs para probar el siguiente paso');
  } catch (error: any) {
    logger.error('❌ Error en Paso 1', error);
    throw error;
  }
}

/**
 * Paso 2: Buscar transcripción para un evento
 */
async function step2_FindTranscript(eventId: string): Promise<void> {
  logger.info(`=== PASO 2: Buscar transcripción para evento ${eventId} ===\n`);

  try {
    const drive = new DriveService();
    await drive.authenticate();

    const { event, transcript } = await findTranscriptForEventId(eventId, drive);

    if (!event) {
      logger.error(`❌ Evento no encontrado: ${eventId}`);
      return;
    }

    logger.info(`✅ Evento encontrado: ${event.title}`);
    logger.info(`   Fecha: ${event.start_date_time}`);
    logger.info(`   Participantes: ${event.attendees?.length || 0}\n`);

    if (!transcript || transcript.source === 'none' || !transcript.transcript_text) {
      logger.warn('⚠️  No se encontró transcripción para este evento');
      logger.info('   Fuentes probadas:');
      logger.info('   - Google Meet captions (no disponible)');
      logger.info('   - Supabase (full_metadata, description)');
      logger.info('   - Tactiq folder');
      return;
    }

    logger.info(`✅ Transcripción encontrada desde: ${transcript.source}`);
    logger.info(`   Longitud: ${transcript.transcript_text.length} caracteres`);
    if (transcript.transcript_url) {
      logger.info(`   URL: ${transcript.transcript_url}`);
    }
    if (transcript.match_score) {
      logger.info(`   Match score: ${transcript.match_score}`);
    }

    logger.info(`\n📄 Primeros 200 caracteres de la transcripción:`);
    logger.info(transcript.transcript_text.substring(0, 200) + '...\n');
  } catch (error: any) {
    logger.error('❌ Error en Paso 2', error);
    throw error;
  }
}

/**
 * Paso 3: Analizar transcripción con LLM
 */
async function step3_AnalyzeTranscript(eventId: string): Promise<void> {
  logger.info(`=== PASO 3: Analizar transcripción para evento ${eventId} ===\n`);

  try {
    const drive = new DriveService();
    await drive.authenticate();

    const { transcript } = await findTranscriptForEventId(eventId, drive);

    if (!transcript || !transcript.transcript_text) {
      logger.error('❌ No hay transcripción para analizar');
      return;
    }

    logger.info('📝 Analizando transcripción con LLM...\n');

    const analysis = await analyzeTranscript(transcript.transcript_text, {
      outputPath: path.join(__dirname, `test-analysis-${eventId}.json`),
    });

    logger.info('✅ Análisis completado:\n');
    logger.info(`   Participantes: ${analysis.meeting_info.participants.length}`);
    logger.info(`   Temas: ${analysis.topics_discussed.length}`);
    logger.info(`   Decisiones: ${analysis.decisions.length}`);
    logger.info(`   Tareas: ${analysis.tasks.length}`);
    logger.info(`   Clientes/Proyectos: ${analysis.clients_projects.length}`);
    if (analysis.tags) {
      logger.info(`   Tags: ${analysis.tags.join(', ')}`);
    }
    if (analysis.variables) {
      logger.info(`   Variables: ${Object.keys(analysis.variables).join(', ')}`);
    }

    logger.info(`\n💾 Análisis guardado en: test-analysis-${eventId}.json`);
  } catch (error: any) {
    logger.error('❌ Error en Paso 3', error);
    throw error;
  }
}

/**
 * Paso 4: Gestionar entrada en meeting-notes.md
 */
async function step4_ManageEntry(eventId: string, workspace: string = 'inspiro'): Promise<void> {
  logger.info(`=== PASO 4: Gestionar entrada en meeting-notes.md ===\n`);

  try {
    const supa = new SupabaseService();
    let db;
    try {
      db = supa.db(true);
    } catch {
      db = supa.db(false);
    }

    const { data: event } = await db
      .from('calendar_events')
      .select('id, summary, start_date_time, calendar_event_attendees (email, display_name)')
      .eq('id', eventId)
      .single();

    if (!event) {
      logger.error(`❌ Evento no encontrado: ${eventId}`);
      return;
    }

    const projectRoot = path.resolve(__dirname, '../../../../..');
    const meetingNotesPath = path.join(
      projectRoot,
      'workspaces',
      `🌸 ${workspace}`,
      '⚙️ company-management',
      '📝 meeting-notes.md'
    );

    const eventDate = new Date(event.start_date_time).toISOString().split('T')[0];
    logger.info(`📅 Fecha del evento: ${eventDate}\n`);

    const entryInfo = findEntryByDate(meetingNotesPath, eventDate);

    if (entryInfo.entry_exists) {
      logger.info('✅ Entrada existente encontrada');
      logger.info(`   Índice: ${entryInfo.entry_index}`);
      logger.info(`   Contenido (primeros 200 caracteres):`);
      logger.info(entryInfo.entry_content?.substring(0, 200) + '...\n');
    } else {
      logger.info('⚠️  No existe entrada para esta fecha');
      logger.info('   Creando nueva entrada...\n');

      const participants =
        event.calendar_event_attendees?.map((a: any) => a.display_name || a.email || '').filter(Boolean) || [];

      createNewEntry(meetingNotesPath, eventDate, event.summary, participants);
      logger.info('✅ Nueva entrada creada');
    }
  } catch (error: any) {
    logger.error('❌ Error en Paso 4', error);
    throw error;
  }
}

/**
 * Función principal
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    logger.error('Uso: ts-node test-step-by-step.ts [paso] [opciones]');
    logger.error('');
    logger.error('Pasos:');
    logger.error('  1 - Listar eventos recientes');
    logger.error('  2 <event-id> - Buscar transcripción para evento');
    logger.error('  3 <event-id> - Analizar transcripción');
    logger.error('  4 <event-id> [workspace] - Gestionar entrada en meeting-notes.md');
    logger.error('');
    logger.error('Ejemplo:');
    logger.error('  ts-node test-step-by-step.ts 1');
    logger.error('  ts-node test-step-by-step.ts 2 <event-id>');
    process.exit(1);
  }

  const step = args[0];
  const eventId = args[1];
  const workspace = args[2] || 'inspiro';

  try {
    switch (step) {
      case '1':
        await step1_ListEvents();
        break;
      case '2':
        if (!eventId) {
          logger.error('Debe proporcionar event-id para el paso 2');
          process.exit(1);
        }
        await step2_FindTranscript(eventId);
        break;
      case '3':
        if (!eventId) {
          logger.error('Debe proporcionar event-id para el paso 3');
          process.exit(1);
        }
        await step3_AnalyzeTranscript(eventId);
        break;
      case '4':
        if (!eventId) {
          logger.error('Debe proporcionar event-id para el paso 4');
          process.exit(1);
        }
        await step4_ManageEntry(eventId, workspace);
        break;
      default:
        logger.error(`Paso desconocido: ${step}`);
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

