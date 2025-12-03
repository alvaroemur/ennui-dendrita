#!/usr/bin/env npx ts-node
/**
 * Script para buscar reuniones recientes con participantes específicos
 * y extraer transcripciones de Google Drive (Tactiq) usando la lógica de Neuron
 */

import { SupabaseService } from '../../../services/supabase/client';
import { DriveService } from '../../../services/google/drive';
import { credentials } from '../../../utils/credentials';
import { createLogger } from '../../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('ExtractTranscriptsFromDrive');

interface MeetingWithTranscript {
  event_id: string;
  google_event_id: string;
  summary: string;
  start_date_time: string;
  end_date_time: string;
  attendees: string[];
  transcript_url?: string;
  transcript_file_id?: string;
  transcript_text?: string;
  transcript_match_score?: number;
}

/**
 * Busca la carpeta de Tactiq en Google Drive
 */
async function findTactiqFolder(drive: DriveService): Promise<string | null> {
  try {
    // Buscar carpeta "📂 Registros"
    const registrosQuery = "mimeType='application/vnd.google-apps.folder' and name = '📂 Registros' and 'root' in parents and trashed = false";
    const registrosResult = await drive.listFiles({ q: registrosQuery, pageSize: 10 });
    
    if (!registrosResult.files || registrosResult.files.length === 0) {
      logger.warn('No se encontró la carpeta "📂 Registros"');
      return null;
    }
    
    const registrosFolderId = registrosResult.files[0].id;
    logger.info(`Encontrada carpeta "📂 Registros": ${registrosFolderId}`);
    
    // Buscar carpeta "Tactiq Transcription" dentro de Registros
    const tactiqQuery = `mimeType='application/vnd.google-apps.folder' and name = 'Tactiq Transcription' and '${registrosFolderId}' in parents and trashed = false`;
    const tactiqResult = await drive.listFiles({ q: tactiqQuery, pageSize: 10 });
    
    if (!tactiqResult.files || tactiqResult.files.length === 0) {
      logger.warn('No se encontró la carpeta "Tactiq Transcription"');
      return null;
    }
    
    const tactiqFolderId = tactiqResult.files[0].id;
    logger.info(`Encontrada carpeta "Tactiq Transcription": ${tactiqFolderId}`);
    
    return tactiqFolderId;
  } catch (error: any) {
    logger.error('Error al buscar carpeta de Tactiq', error);
    return null;
  }
}

/**
 * Lista todos los documentos de Google Docs en la carpeta de Tactiq
 */
async function listTactiqTranscripts(drive: DriveService, folderId: string): Promise<any[]> {
  const transcripts: any[] = [];
  let pageToken: string | undefined;
  
  try {
    do {
      const query = `mimeType='application/vnd.google-apps.document' and '${folderId}' in parents and trashed = false`;
      const result = await drive.listFiles({ 
        q: query, 
        pageSize: 200,
        pageToken,
        orderBy: 'modifiedTime desc'
      });
      
      if (result.files) {
        transcripts.push(...result.files);
      }
      
      pageToken = result.nextPageToken;
    } while (pageToken);
    
    logger.info(`Encontrados ${transcripts.length} documentos de transcripción en Tactiq`);
    
    return transcripts;
  } catch (error: any) {
    logger.error('Error al listar transcripciones', error);
    return [];
  }
}

/**
 * Extrae el texto de un Google Doc
 */
async function extractDocText(drive: DriveService, fileId: string): Promise<string | null> {
  try {
    // Usar Google Docs API para extraer contenido
    const accessToken = (drive as any).accessToken;
    if (!accessToken) {
      await drive.authenticate();
      const token = (drive as any).accessToken;
      if (!token) {
        throw new Error('No se pudo obtener access token');
      }
    }
    
    const url = `https://docs.googleapis.com/v1/documents/${fileId}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${(drive as any).accessToken}`,
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
 * Calcula similitud simple entre dos strings
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1.0;
  
  // Similitud simple basada en palabras comunes
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  
  const commonWords = words1.filter(w => words2.includes(w));
  const totalWords = new Set([...words1, ...words2]).size;
  
  return commonWords.length / totalWords;
}

/**
 * Busca transcripciones para reuniones recientes
 */
async function findTranscriptsForMeetings(
  participantNames: string[],
  hoursBack: number = 48
): Promise<MeetingWithTranscript[]> {
  const supa = new SupabaseService();
  
  if (!supa.isConfigured()) {
    throw new Error('Supabase not configured');
  }
  
  if (!credentials.hasGoogleWorkspace()) {
    throw new Error('Google Workspace not configured');
  }
  
  let db;
  try {
    db = supa.db(true);
  } catch {
    db = supa.db(false);
  }
  
  const drive = new DriveService();
  await drive.authenticate();
  
  // Buscar carpeta de Tactiq
  const tactiqFolderId = await findTactiqFolder(drive);
  if (!tactiqFolderId) {
    logger.warn('No se encontró la carpeta de Tactiq, buscando transcripciones en eventos...');
  }
  
  // Listar transcripciones disponibles
  let availableTranscripts: any[] = [];
  if (tactiqFolderId) {
    availableTranscripts = await listTactiqTranscripts(drive, tactiqFolderId);
  }
  
  // Buscar eventos recientes
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - hoursBack);
  
  logger.info(`Buscando reuniones desde ${cutoffTime.toISOString()} con participantes: ${participantNames.join(', ')}`);
  
  const { data: events, error: eventsError } = await db
    .from('calendar_events')
    .select(`
      id,
      google_event_id,
      summary,
      start_date_time,
      end_date_time,
      description,
      location,
      html_link,
      organizer_email,
      organizer_display_name,
      full_metadata,
      calendar_event_attendees (
        email,
        display_name
      )
    `)
    .gte('start_date_time', cutoffTime.toISOString())
    .order('start_date_time', { ascending: false })
    .limit(100);
  
  if (eventsError) {
    logger.error('Error al buscar eventos', eventsError);
    throw eventsError;
  }
  
  if (!events || events.length === 0) {
    logger.info('No se encontraron eventos recientes');
    return [];
  }
  
  logger.info(`Encontrados ${events.length} eventos recientes`);
  
  // Normalizar nombres de participantes
  const participantNamesLower = participantNames.map(n => n.toLowerCase().trim());
  
  // Filtrar eventos con los participantes
  const matchingMeetings: MeetingWithTranscript[] = [];
  
  for (const event of events) {
    const attendees = event.calendar_event_attendees || [];
    const allEmails: string[] = [];
    const allNames: string[] = [];
    
    for (const attendee of attendees) {
      if (attendee.email) allEmails.push(attendee.email.toLowerCase());
      if (attendee.display_name) allNames.push(attendee.display_name.toLowerCase());
    }
    
    if (event.organizer_email) allEmails.push(event.organizer_email.toLowerCase());
    if (event.organizer_display_name) allNames.push(event.organizer_display_name.toLowerCase());
    
    const summary = (event.summary || '').toLowerCase();
    const description = (event.description || '').toLowerCase();
    
    const hasParticipant = participantNamesLower.some(participant => {
      const participantLower = participant.toLowerCase();
      return allNames.some(name => name.includes(participantLower)) ||
             allEmails.some(email => email.includes(participantLower) || email.split('@')[0].includes(participantLower)) ||
             summary.includes(participantLower) ||
             description.includes(participantLower);
    });
    
    if (!hasParticipant) continue;
    
    const meeting: MeetingWithTranscript = {
      event_id: event.id,
      google_event_id: event.google_event_id || '',
      summary: event.summary || 'Sin título',
      start_date_time: event.start_date_time || '',
      end_date_time: event.end_date_time || '',
      attendees: attendees.map((a: any) => `${a.display_name || a.email?.split('@')[0] || 'Sin nombre'} <${a.email || 'sin email'}>`)
    };
    
    // Buscar transcripción en full_metadata
    if (event.full_metadata) {
      const metadata = event.full_metadata;
      const transcriptUrl = metadata.transcript_url || 
                            metadata.transcriptUrl || 
                            metadata.transcript_link ||
                            metadata.tactiq_transcript_url ||
                            metadata.tactiqTranscriptUrl;
      
      if (transcriptUrl) {
        meeting.transcript_url = transcriptUrl;
        // Extraer file ID de la URL
        const match = transcriptUrl.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
        if (match) {
          meeting.transcript_file_id = match[1];
        }
      }
    }
    
    // Buscar transcripción en description
    if (!meeting.transcript_file_id && event.description) {
      const desc = String(event.description);
      const docMatch = desc.match(/https?:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
      if (docMatch) {
        meeting.transcript_url = docMatch[0];
        meeting.transcript_file_id = docMatch[1];
      }
    }
    
    // Buscar transcripción en carpeta de Tactiq por matching
    if (!meeting.transcript_file_id && availableTranscripts.length > 0) {
      const eventDate = new Date(event.start_date_time);
      const eventTitle = event.summary || '';
      
      // Buscar transcripción más similar
      let bestMatch: any = null;
      let bestScore = 0;
      
      for (const transcript of availableTranscripts) {
        const transcriptDate = transcript.createdTime ? new Date(transcript.createdTime) : null;
        const transcriptName = transcript.name || '';
        
        // Calcular score de matching
        let score = 0;
        
        // Score por similitud de nombre
        const nameScore = calculateSimilarity(eventTitle, transcriptName);
        score += nameScore * 0.5;
        
        // Score por proximidad temporal (dentro de 2 horas)
        if (transcriptDate) {
          const timeDiff = Math.abs(eventDate.getTime() - transcriptDate.getTime());
          const hoursDiff = timeDiff / (1000 * 60 * 60);
          if (hoursDiff <= 2) {
            score += (1 - hoursDiff / 2) * 0.5;
          }
        }
        
        if (score > bestScore && score > 0.3) {
          bestScore = score;
          bestMatch = transcript;
        }
      }
      
      if (bestMatch) {
        meeting.transcript_file_id = bestMatch.id;
        meeting.transcript_url = bestMatch.webViewLink || `https://docs.google.com/document/d/${bestMatch.id}`;
        meeting.transcript_match_score = bestScore;
      }
    }
    
    // Extraer texto de la transcripción si se encontró
    if (meeting.transcript_file_id) {
      logger.info(`Extrayendo transcripción para: ${meeting.summary}`);
      const transcriptText = await extractDocText(drive, meeting.transcript_file_id);
      if (transcriptText) {
        meeting.transcript_text = transcriptText;
        logger.info(`Transcripción extraída: ${transcriptText.length} caracteres`);
      }
    }
    
    matchingMeetings.push(meeting);
  }
  
  return matchingMeetings;
}

/**
 * Guarda las transcripciones encontradas
 */
function saveTranscripts(meetings: MeetingWithTranscript[], outputDir?: string): void {
  // Default to temp directory - transcripts should be saved to workspace-specific locations
  // Use --output-dir to specify workspace path: workspaces/[workspace]/⚙️ company-management/data/transcripts/
  const defaultDir = path.join(process.cwd(), '_temp', 'transcripts');
  const dir = outputDir || defaultDir;
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().split('T')[0];
  const jsonPath = path.join(dir, `transcripts-${timestamp}.json`);
  const summaryPath = path.join(dir, `transcripts-${timestamp}-summary.txt`);
  
  // Guardar JSON
  fs.writeFileSync(jsonPath, JSON.stringify(meetings, null, 2), 'utf-8');
  logger.info(`Transcripciones guardadas en: ${jsonPath}`);
  
  // Guardar resumen
  const summary = [
    `=== Transcripciones de Reuniones ===`,
    `Fecha de extracción: ${new Date().toISOString()}`,
    `Total de reuniones con transcripciones: ${meetings.filter(m => m.transcript_text).length}`,
    `Total de reuniones encontradas: ${meetings.length}`,
    ``,
    `=== Reuniones con Transcripciones ===`,
    ``,
    ...meetings
      .filter(m => m.transcript_text)
      .map((m, i) => [
        `${i + 1}. ${m.summary}`,
        `   Fecha: ${new Date(m.start_date_time).toLocaleString('es-ES')}`,
        `   Asistentes: ${m.attendees.join(', ')}`,
        m.transcript_url ? `   URL: ${m.transcript_url}` : '',
        m.transcript_match_score ? `   Score de matching: ${m.transcript_match_score.toFixed(2)}` : '',
        `   Transcripción (${m.transcript_text?.length || 0} caracteres):`,
        `   ${(m.transcript_text || '').substring(0, 500)}...`,
        ``
      ].filter(Boolean).join('\n'))
  ].join('\n');
  
  fs.writeFileSync(summaryPath, summary, 'utf-8');
  logger.info(`Resumen guardado en: ${summaryPath}`);
  
  // Guardar transcripciones individuales
  meetings.forEach((meeting, i) => {
    if (meeting.transcript_text) {
      const safeName = meeting.summary.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
      const transcriptPath = path.join(dir, `${i + 1}-${safeName}-transcript.txt`);
      fs.writeFileSync(transcriptPath, meeting.transcript_text, 'utf-8');
    }
  });
}

/**
 * Función principal
 */
async function main(): Promise<void> {
  const participantNames = process.argv.slice(2);
  
  if (participantNames.length === 0) {
    console.error('\n❌ Error: Debes especificar al menos un nombre de participante');
    console.log('\n📖 Uso:');
    console.log('   npx ts-node .dendrita/integrations/scripts/extract-transcripts-from-drive.ts <nombre1> [nombre2] ...');
    console.log('\n📝 Ejemplo:');
    console.log('   npx ts-node .dendrita/integrations/scripts/extract-transcripts-from-drive.ts rodrigo arturo');
    process.exit(1);
  }
  
  logger.info(`=== Buscando Transcripciones de Reuniones ===\n`);
  logger.info(`Participantes: ${participantNames.join(', ')}`);
  logger.info(`Horas hacia atrás: 48\n`);
  
  try {
    const meetings = await findTranscriptsForMeetings(participantNames, 48);
    
    console.log('\n📊 Resultados:');
    console.log('─'.repeat(80));
    console.log(`\n✅ Total de reuniones encontradas: ${meetings.length}`);
    console.log(`📄 Reuniones con transcripciones: ${meetings.filter(m => m.transcript_text).length}\n`);
    
    if (meetings.length > 0) {
      meetings.forEach((meeting, i) => {
        const hasTranscript = !!meeting.transcript_text;
        const icon = hasTranscript ? '📄' : '❌';
        
        console.log(`${i + 1}. ${icon} ${meeting.summary}`);
        console.log(`   📅 Fecha: ${new Date(meeting.start_date_time).toLocaleString('es-ES', { timeZone: 'America/Lima' })}`);
        console.log(`   👥 Asistentes: ${meeting.attendees.join(', ')}`);
        
        if (meeting.transcript_url) {
          console.log(`   🔗 URL: ${meeting.transcript_url}`);
        }
        
        if (meeting.transcript_text) {
          const preview = meeting.transcript_text.substring(0, 200);
          console.log(`   📄 Transcripción (${meeting.transcript_text.length} caracteres): ${preview}...`);
        } else {
          console.log(`   ⚠️  No se encontró transcripción`);
        }
        
        if (meeting.transcript_match_score) {
          console.log(`   🎯 Score de matching: ${meeting.transcript_match_score.toFixed(2)}`);
        }
        
        console.log('');
      });
      
      // Guardar resultados
      saveTranscripts(meetings);
      
    } else {
      console.log('⚠️  No se encontraron reuniones con los participantes especificados');
    }
    
    console.log('─'.repeat(80));
    
  } catch (error: any) {
    logger.error('Error al buscar transcripciones', error);
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch((error) => {
    logger.error('Fatal error', error);
    process.exit(1);
  });
}

export { findTranscriptsForMeetings, extractDocText };

