#!/usr/bin/env npx ts-node
/**
 * Script para extraer transcripciones de reuniones desde Supabase
 * 
 * Busca transcripciones en:
 * 1. Tabla calendar_events (en full_metadata o campos específicos)
 * 2. Tabla calendar_event_instances (en full_metadata)
 * 3. Otras tablas relacionadas con transcripciones
 * 
 * Esta funcionalidad en el futuro será proporcionada por Neuron por API
 */

import { SupabaseService } from '../../../services/supabase/client';
import { createLogger } from '../../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('ExtractMeetingTranscripts');

interface TranscriptInfo {
  event_id: string;
  google_event_id: string;
  summary: string;
  start_date_time: string;
  transcript_url?: string;
  transcript_text?: string;
  transcript_source?: string;
  source_type: 'calendar_event' | 'calendar_instance' | 'other';
}

/**
 * Busca transcripciones en la tabla calendar_events
 */
async function findTranscriptsInCalendarEvents(db: any): Promise<TranscriptInfo[]> {
  const transcripts: TranscriptInfo[] = [];
  
  try {
    // Buscar eventos que puedan tener transcripciones
    // Las transcripciones pueden estar en:
    // 1. full_metadata (JSONB) con campos como transcript, transcription, tactiq_transcript
    // 2. Campos específicos si existen (transcript_url, transcript_text)
    
    logger.info('Buscando transcripciones en calendar_events...');
    
    // Primero, intentar obtener una muestra para ver la estructura
    const { data: sample, error: sampleError } = await db
      .from('calendar_events')
      .select('id, google_event_id, summary, start_date_time, full_metadata')
      .limit(10);
    
    if (sampleError) {
      logger.warn(`Error al acceder a calendar_events: ${sampleError.message}`);
      return transcripts;
    }
    
    if (!sample || sample.length === 0) {
      logger.info('No se encontraron eventos en calendar_events');
      return transcripts;
    }
    
    // Buscar eventos con transcripciones en full_metadata
    // Necesitamos hacer una búsqueda más amplia
    const { data: events, error: eventsError } = await db
      .from('calendar_events')
      .select('id, google_event_id, summary, start_date_time, full_metadata, description')
      .not('full_metadata', 'eq', '{}')
      .limit(1000); // Limitar para no sobrecargar
    
    if (eventsError) {
      logger.warn(`Error al buscar eventos: ${eventsError.message}`);
      return transcripts;
    }
    
    if (!events || events.length === 0) {
      logger.info('No se encontraron eventos con metadatos');
      return transcripts;
    }
    
    logger.info(`Analizando ${events.length} eventos...`);
    
    // Analizar cada evento buscando transcripciones
    for (const event of events) {
      const transcriptInfo = extractTranscriptFromEvent(event);
      if (transcriptInfo) {
        transcripts.push(transcriptInfo);
      }
    }
    
    logger.info(`Encontradas ${transcripts.length} transcripciones en calendar_events`);
    
  } catch (error: any) {
    logger.error('Error al buscar transcripciones en calendar_events', error);
  }
  
  return transcripts;
}

/**
 * Extrae información de transcripción de un evento
 */
function extractTranscriptFromEvent(event: any): TranscriptInfo | null {
  if (!event) return null;
  
  // Buscar transcripción en full_metadata
  let transcriptUrl: string | undefined;
  let transcriptText: string | undefined;
  let transcriptSource: string | undefined;
  
  if (event.full_metadata && typeof event.full_metadata === 'object') {
    const metadata = event.full_metadata;
    
    // Buscar en varios campos posibles
    transcriptUrl = metadata.transcript_url || 
                   metadata.transcriptUrl || 
                   metadata.transcript_link ||
                   metadata.tactiq_transcript_url ||
                   metadata.tactiqTranscriptUrl ||
                   metadata.meeting_transcript_url;
    
    transcriptText = metadata.transcript_text ||
                    metadata.transcriptText ||
                    metadata.transcript ||
                    metadata.transcription ||
                    metadata.tactiq_transcript ||
                    metadata.meeting_transcript;
    
    transcriptSource = metadata.transcript_source ||
                      metadata.transcriptSource ||
                      (transcriptUrl ? 'url' : transcriptText ? 'text' : undefined);
  }
  
  // También buscar en description (puede contener links a transcripciones)
  if (!transcriptUrl && event.description) {
    const desc = String(event.description);
    // Buscar URLs de Google Docs (transcripciones de Tactiq)
    const docMatch = desc.match(/https?:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
    if (docMatch) {
      transcriptUrl = docMatch[0];
      transcriptSource = 'description_link';
    }
  }
  
  // Si encontramos transcripción, retornar info
  if (transcriptUrl || transcriptText) {
    return {
      event_id: event.id,
      google_event_id: event.google_event_id || '',
      summary: event.summary || 'Sin título',
      start_date_time: event.start_date_time || '',
      transcript_url: transcriptUrl,
      transcript_text: transcriptText,
      transcript_source: transcriptSource || 'unknown',
      source_type: 'calendar_event'
    };
  }
  
  return null;
}

/**
 * Busca transcripciones en la tabla calendar_event_instances
 */
async function findTranscriptsInCalendarInstances(db: any): Promise<TranscriptInfo[]> {
  const transcripts: TranscriptInfo[] = [];
  
  try {
    logger.info('Buscando transcripciones en calendar_event_instances...');
    
    const { data: instances, error: instancesError } = await db
      .from('calendar_event_instances')
      .select('id, google_event_id, summary, instance_start, full_metadata, description')
      .not('full_metadata', 'eq', '{}')
      .limit(1000);
    
    if (instancesError) {
      logger.warn(`Error al buscar instancias: ${instancesError.message}`);
      return transcripts;
    }
    
    if (!instances || instances.length === 0) {
      logger.info('No se encontraron instancias con metadatos');
      return transcripts;
    }
    
    logger.info(`Analizando ${instances.length} instancias...`);
    
    for (const instance of instances) {
      const transcriptInfo = extractTranscriptFromEvent(instance);
      if (transcriptInfo) {
        transcripts.push({
          ...transcriptInfo,
          source_type: 'calendar_instance',
          start_date_time: instance.instance_start || transcriptInfo.start_date_time
        });
      }
    }
    
    logger.info(`Encontradas ${transcripts.length} transcripciones en calendar_event_instances`);
    
  } catch (error: any) {
    logger.error('Error al buscar transcripciones en calendar_instances', error);
  }
  
  return transcripts;
}

/**
 * Guarda las transcripciones encontradas en un archivo JSON
 */
function saveTranscriptsToFile(transcripts: TranscriptInfo[], outputPath?: string): void {
  // Default to temp directory - transcripts should be saved to workspace-specific locations
  // Use outputPath parameter to specify workspace path: workspaces/[workspace]/⚙️ company-management/data/transcripts/
  const defaultPath = path.join(
    process.cwd(),
    '_temp',
    'transcripts',
    `meeting-transcripts-${new Date().toISOString().split('T')[0]}.json`
  );
  
  const filePath = outputPath || defaultPath;
  const dir = path.dirname(filePath);
  
  // Crear directorio si no existe
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Guardar JSON
  fs.writeFileSync(filePath, JSON.stringify(transcripts, null, 2), 'utf-8');
  logger.info(`Transcripciones guardadas en: ${filePath}`);
  
  // También crear un resumen en texto
  const summaryPath = filePath.replace('.json', '-summary.txt');
  const summary = [
    `=== Resumen de Transcripciones de Reuniones ===`,
    `Fecha de extracción: ${new Date().toISOString()}`,
    `Total de transcripciones encontradas: ${transcripts.length}`,
    ``,
    `Desglose por fuente:`,
    `- calendar_events: ${transcripts.filter(t => t.source_type === 'calendar_event').length}`,
    `- calendar_instances: ${transcripts.filter(t => t.source_type === 'calendar_instance').length}`,
    ``,
    `Transcripciones con URL: ${transcripts.filter(t => t.transcript_url).length}`,
    `Transcripciones con texto: ${transcripts.filter(t => t.transcript_text).length}`,
    ``,
    `=== Lista de Transcripciones ===`,
    ``,
    ...transcripts.map((t, i) => [
      `${i + 1}. ${t.summary}`,
      `   Event ID: ${t.event_id}`,
      `   Google Event ID: ${t.google_event_id}`,
      `   Fecha: ${t.start_date_time}`,
      `   Fuente: ${t.source_type}`,
      t.transcript_url ? `   URL: ${t.transcript_url}` : '',
      t.transcript_text ? `   Texto: ${t.transcript_text.substring(0, 100)}...` : '',
      `   Origen: ${t.transcript_source || 'unknown'}`,
      ``
    ].filter(Boolean).join('\n'))
  ].join('\n');
  
  fs.writeFileSync(summaryPath, summary, 'utf-8');
  logger.info(`Resumen guardado en: ${summaryPath}`);
}

/**
 * Función principal
 */
async function main(): Promise<void> {
  logger.info('=== Extracción de Transcripciones de Reuniones ===\n');
  
  const supa = new SupabaseService();
  
  if (!supa.isConfigured()) {
    throw new Error('Supabase not configured. Set SUPABASE_URL and keys in .env.local');
  }
  
  // Intentar usar service role, si no está disponible usar anon key
  let db;
  try {
    db = supa.db(true); // Intentar service role primero
  } catch {
    logger.warn('Service role key not available, using anon key');
    db = supa.db(false); // Fallback a anon key
  }
  
  try {
    const allTranscripts: TranscriptInfo[] = [];
    
    // Buscar en calendar_events
    const eventTranscripts = await findTranscriptsInCalendarEvents(db);
    allTranscripts.push(...eventTranscripts);
    
    // Buscar en calendar_event_instances
    const instanceTranscripts = await findTranscriptsInCalendarInstances(db);
    allTranscripts.push(...instanceTranscripts);
    
    // Eliminar duplicados (mismo google_event_id)
    const uniqueTranscripts = Array.from(
      new Map(allTranscripts.map(t => [t.google_event_id, t])).values()
    );
    
    // Mostrar resultados
    console.log('\n📊 Resultados:');
    console.log('─'.repeat(80));
    console.log(`\n✅ Total de transcripciones encontradas: ${uniqueTranscripts.length}`);
    console.log(`   - En calendar_events: ${eventTranscripts.length}`);
    console.log(`   - En calendar_instances: ${instanceTranscripts.length}`);
    console.log(`   - Únicas (sin duplicados): ${uniqueTranscripts.length}`);
    
    if (uniqueTranscripts.length > 0) {
      console.log(`\n📋 Transcripciones encontradas:`);
      console.log('─'.repeat(80));
      
      uniqueTranscripts.slice(0, 10).forEach((t, i) => {
        console.log(`\n${i + 1}. ${t.summary}`);
        console.log(`   Fecha: ${t.start_date_time}`);
        console.log(`   Fuente: ${t.source_type}`);
        if (t.transcript_url) {
          console.log(`   URL: ${t.transcript_url}`);
        }
        if (t.transcript_text) {
          console.log(`   Texto: ${t.transcript_text.substring(0, 100)}...`);
        }
      });
      
      if (uniqueTranscripts.length > 10) {
        console.log(`\n... y ${uniqueTranscripts.length - 10} más`);
      }
      
      // Guardar en archivo
      const outputPath = process.argv[2]; // Opcional: ruta de salida
      saveTranscriptsToFile(uniqueTranscripts, outputPath);
      
    } else {
      console.log('\n⚠️  No se encontraron transcripciones en la base de datos');
      console.log('\n💡 Posibles razones:');
      console.log('   1. Las transcripciones aún no se han sincronizado a Supabase');
      console.log('   2. Las transcripciones están almacenadas en Google Drive (Tactiq)');
      console.log('   3. Las transcripciones están en otra tabla o estructura');
      console.log('\n💡 En el futuro, esta funcionalidad será proporcionada por Neuron por API');
    }
    
    console.log('\n─'.repeat(80));
    
  } catch (error: any) {
    logger.error('Error al extraer transcripciones', error);
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

export { findTranscriptsInCalendarEvents, findTranscriptsInCalendarInstances, extractTranscriptFromEvent };

