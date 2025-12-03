#!/usr/bin/env npx ts-node
/**
 * Búsqueda unificada de transcripciones para eventos de calendario
 * Prioridad: Google Meet captions → Tactiq folder
 */

import { DriveService } from '../../../services/google/drive';
import { SupabaseService } from '../../../services/supabase/client';
import { findTactiqTranscriptForEvent } from './match-tactiq-transcript';
import { findExistingMatch, saveMatch } from './manage-transcript-matches';
import { createLogger } from '../../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('FindTranscriptForEvent');

export interface TranscriptResult {
  transcript_text: string;
  transcript_url?: string;
  source: 'google_meet' | 'tactiq' | 'supabase' | 'none';
  file_id?: string;
  match_score?: number;
}

export interface EventInfo {
  event_id?: string;
  google_event_id: string;
  title: string;
  start_date_time: string;
  end_date_time: string;
  description?: string;
  full_metadata?: any;
  attendees?: Array<{ email: string; display_name?: string }>;
}

/**
 * Intenta obtener transcripción desde Google Meet captions
 * NOTA: Actualmente no disponible vía API, documentado para implementación futura
 */
async function findGoogleMeetCaptions(
  event: EventInfo
): Promise<TranscriptResult | null> {
  // TODO: Implementar cuando Google proporcione API para captions de Meet
  // Por ahora, retornar null para usar fallback a Tactiq
  logger.debug('Google Meet captions not available via API (feature future)');
  return null;
}

/**
 * Busca transcripción en Supabase (full_metadata o description)
 */
async function findTranscriptInSupabase(
  event: EventInfo
): Promise<TranscriptResult | null> {
  try {
    // Buscar en full_metadata
    if (event.full_metadata && typeof event.full_metadata === 'object') {
      const metadata = event.full_metadata;

      // Buscar transcripción en varios campos posibles
      const transcriptUrl =
        metadata.transcript_url ||
        metadata.transcriptUrl ||
        metadata.transcript_link ||
        metadata.tactiq_transcript_url ||
        metadata.tactiqTranscriptUrl ||
        metadata.meeting_transcript_url;

      const transcriptText =
        metadata.transcript_text ||
        metadata.transcriptText ||
        metadata.transcript ||
        metadata.transcription ||
        metadata.tactiq_transcript ||
        metadata.meeting_transcript;

      if (transcriptText) {
        logger.info('Transcripción encontrada en full_metadata');
        return {
          transcript_text: transcriptText,
          transcript_url: transcriptUrl,
          source: 'supabase',
        };
      }

      if (transcriptUrl) {
        // Si solo tenemos URL, intentar extraer desde Drive
        const driveId = extractDriveId(transcriptUrl);
        if (driveId) {
          logger.info(`Transcripción URL encontrada en full_metadata: ${transcriptUrl}`);
          // Retornar con URL para que se extraiga después
          return {
            transcript_text: '', // Se extraerá después
            transcript_url: transcriptUrl,
            source: 'supabase',
            file_id: driveId,
          };
        }
      }
    }

    // Buscar en description (puede contener links a transcripciones)
    if (event.description) {
      const desc = String(event.description);
      const docMatch = desc.match(/https?:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
      if (docMatch) {
        const fileId = docMatch[1];
        logger.info(`Link de transcripción encontrado en description: ${docMatch[0]}`);
        return {
          transcript_text: '', // Se extraerá después
          transcript_url: docMatch[0],
          source: 'supabase',
          file_id: fileId,
        };
      }
    }

    return null;
  } catch (error: any) {
    logger.error('Error al buscar transcripción en Supabase', error);
    return null;
  }
}

/**
 * Extrae el ID de Google Drive desde una URL
 */
function extractDriveId(urlOrId: string): string | null {
  if (!urlOrId) return null;

  const s = String(urlOrId);

  // Docs URL
  const m1 = s.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (m1) return m1[1];

  // File URL
  const m2 = s.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m2) return m2[1];

  // open?id=ID
  const m3 = s.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m3) return m3[1];

  // Asumir que es ID directo
  if (/^[a-zA-Z0-9_-]{20,}$/.test(s)) return s;

  return null;
}

/**
 * Extrae el texto de un Google Doc usando Google Docs API
 */
async function extractDocText(drive: DriveService, fileId: string): Promise<string | null> {
  try {
    await drive.authenticate();
    const accessToken = (drive as any).accessToken;

    if (!accessToken) {
      throw new Error('No se pudo obtener access token');
    }

    const url = `https://docs.googleapis.com/v1/documents/${fileId}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      logger.warn(`Error al obtener documento ${fileId}: ${response.status}`);
      return null;
    }

    const doc = await response.json();

    // Extraer texto del documento
    let text = '';
    if (doc.body && doc.body.content) {
      for (const element of doc.body.content) {
        if (element.paragraph) {
          for (const paraElement of element.paragraph.elements || []) {
            if (paraElement.textRun) {
              text += paraElement.textRun.content;
            }
          }
        }
      }
    }

    return text;
  } catch (error: any) {
    logger.error(`Error al extraer texto del documento ${fileId}`, error);
    return null;
  }
}

/**
 * Busca transcripción para un evento específico
 * Prioridad: Base de datos (matches guardados) → Google Meet → Supabase → Tactiq
 */
export async function findTranscriptForEvent(
  event: EventInfo,
  drive: DriveService,
  db?: any
): Promise<TranscriptResult> {
  logger.info(`Buscando transcripción para evento: ${event.title}`);

  // Prioridad 0: Verificar si hay un match guardado en la base de datos
  if (event.event_id) {
    try {
      const existingMatch = await findExistingMatch(event.event_id);
      if (existingMatch && existingMatch.match_status !== 'rejected') {
        logger.info(`Match encontrado en base de datos (score: ${existingMatch.match_score}, status: ${existingMatch.match_status})`);
        
        // Extraer texto del documento
        const text = await extractDocText(drive, existingMatch.transcript_file_id);
        if (text) {
          return {
            transcript_text: text,
            transcript_url: existingMatch.transcript_url,
            source: existingMatch.match_method === 'supabase' ? 'supabase' : 'tactiq',
            file_id: existingMatch.transcript_file_id,
            match_score: existingMatch.match_score,
          };
        }
      }
    } catch (error: any) {
      logger.warn(`Error al buscar match existente, continuando con búsqueda normal: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Prioridad 1: Google Meet captions (futuro)
  const meetResult = await findGoogleMeetCaptions(event);
  if (meetResult && meetResult.transcript_text) {
    logger.info('Transcripción encontrada desde Google Meet captions');
    return meetResult;
  }

  // Prioridad 2: Supabase (full_metadata o description)
  const supabaseResult = await findTranscriptInSupabase(event);
  if (supabaseResult) {
    // Si tenemos texto directamente, retornar
    if (supabaseResult.transcript_text) {
      logger.info('Transcripción encontrada en Supabase');
      
      // Guardar match si tenemos event_id
      if (event.event_id && supabaseResult.file_id) {
        await saveMatch({
          event_id: event.event_id,
          transcript_file_id: supabaseResult.file_id,
          transcript_url: supabaseResult.transcript_url,
          match_score: 1.0, // Match directo desde Supabase
          match_method: 'supabase',
          match_status: 'confirmed', // Ya está en Supabase, considerarlo confirmado
        });
      }
      
      return supabaseResult;
    }

    // Si tenemos URL/file_id, extraer texto
    if (supabaseResult.file_id) {
      logger.info(`Extrayendo transcripción desde Google Doc: ${supabaseResult.file_id}`);
      const text = await extractDocText(drive, supabaseResult.file_id);
      if (text) {
        // Guardar match si tenemos event_id
        if (event.event_id) {
          await saveMatch({
            event_id: event.event_id,
            transcript_file_id: supabaseResult.file_id,
            transcript_url: supabaseResult.transcript_url,
            match_score: 1.0,
            match_method: 'supabase',
            match_status: 'confirmed',
          });
        }
        
        return {
          transcript_text: text,
          transcript_url: supabaseResult.transcript_url,
          source: supabaseResult.source,
          file_id: supabaseResult.file_id,
        };
      }
    }
  }

  // Prioridad 3: Tactiq folder (matching jerárquico)
  try {
    const endTime = new Date(event.end_date_time);
    const startTime = event.start_date_time ? new Date(event.start_date_time) : undefined;
    const guestList =
      event.attendees?.map((a) => a.email || a.display_name || '').filter(Boolean) || [];

    const tactiqResult = await findTactiqTranscriptForEvent(
      {
        title: event.title,
        endTime,
        startTime,
        guestList,
      },
      drive
    );

    if (tactiqResult.transcript) {
      logger.info(`Transcripción encontrada en Tactiq: ${tactiqResult.transcript.name}`);
      
      // Extraer texto del documento
      const text = await extractDocText(drive, tactiqResult.transcript.id);
      if (text) {
        // Guardar match si tenemos event_id
        if (event.event_id) {
          await saveMatch({
            event_id: event.event_id,
            transcript_file_id: tactiqResult.transcript.id,
            transcript_url: tactiqResult.transcript.webViewLink,
            match_score: tactiqResult.match.finalScore || 0,
            match_method: 'tactiq_matching',
            match_status: 'pending', // Requiere confirmación manual
          });
        }
        
        return {
          transcript_text: text,
          transcript_url: tactiqResult.transcript.webViewLink,
          source: 'tactiq',
          file_id: tactiqResult.transcript.id,
          match_score: tactiqResult.match.finalScore,
        };
      }
    }
  } catch (error: any) {
    logger.error('Error al buscar transcripción en Tactiq', error);
  }

  // No se encontró transcripción
  logger.warn('No se encontró transcripción para el evento');
  return {
    transcript_text: '',
    source: 'none',
  };
}

/**
 * Obtiene evento desde Supabase y busca su transcripción
 */
export async function findTranscriptForEventId(
  eventId: string,
  drive: DriveService,
  db?: any
): Promise<{ event: EventInfo | null; transcript: TranscriptResult }> {
  try {
    // Si no se proporciona db, crear servicio de Supabase
    if (!db) {
      const supa = new SupabaseService();
      if (!supa.isConfigured()) {
        throw new Error('Supabase not configured');
      }

      let supabaseDb;
      try {
        supabaseDb = supa.db(true);
      } catch {
        supabaseDb = supa.db(false);
      }
      db = supabaseDb;
    }

    // Buscar evento en Supabase
    const { data: event, error } = await db
      .from('calendar_events')
      .select(`
        id,
        google_event_id,
        summary,
        start_date_time,
        end_date_time,
        description,
        full_metadata,
        calendar_event_attendees (
          email,
          display_name
        )
      `)
      .eq('id', eventId)
      .single();

    if (error) {
      logger.error('Error al buscar evento en Supabase', error);
      return { event: null, transcript: { transcript_text: '', source: 'none' } };
    }

    if (!event) {
      logger.warn(`Evento no encontrado: ${eventId}`);
      return { event: null, transcript: { transcript_text: '', source: 'none' } };
    }

    // Preparar información del evento
    const eventInfo: EventInfo = {
      event_id: event.id,
      google_event_id: event.google_event_id,
      title: event.summary || '',
      start_date_time: event.start_date_time,
      end_date_time: event.end_date_time,
      description: event.description,
      full_metadata: event.full_metadata,
      attendees: event.calendar_event_attendees || [],
    };

    // Buscar transcripción (pasar db para que pueda usar matches guardados)
    const transcript = await findTranscriptForEvent(eventInfo, drive, db);

    return { event: eventInfo, transcript };
  } catch (error: any) {
    logger.error('Error al buscar transcripción para evento', error);
    return { event: null, transcript: { transcript_text: '', source: 'none' } };
  }
}

