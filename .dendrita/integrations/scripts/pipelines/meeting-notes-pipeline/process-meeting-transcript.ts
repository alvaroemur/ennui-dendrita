#!/usr/bin/env npx ts-node
/**
 * Pipeline principal para procesar transcripciones de reuniones
 * Orquesta: obtener evento, buscar transcripción, analizar, gestionar entrada, actualizar metadatos, integrar
 */

import { SupabaseService } from '../../../services/supabase/client';
import { DriveService } from '../../../services/google/drive';
import { findTranscriptForEventId, EventInfo, TranscriptResult } from './find-transcript-for-event';
import { analyzeTranscript, MeetingAnalysis } from '../transcripts-pipeline/analyze/analyze-transcript';
import { determineIntegration, IntegrationRecommendation } from '../transcripts-pipeline/analyze/integrate-transcript-analysis';
import { findEntryByDate, createNewEntry, getMeetingNotesInfo } from './manage-meeting-notes-entry';
import { updateMetadataFromAnalysis } from './update-meeting-metadata';
import { createLogger } from '../../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('ProcessMeetingTranscript');

interface ProcessOptions {
  autoApply?: boolean;
  workspace?: string;
  outputDir?: string;
  model?: string;
}

interface ProcessResult {
  success: boolean;
  event?: EventInfo;
  transcript?: TranscriptResult;
  analysis?: MeetingAnalysis;
  entryInfo?: any;
  metadata?: any;
  integration?: IntegrationRecommendation;
  error?: string;
}

/**
 * Procesa un evento individual
 */
export async function processEvent(
  eventId: string,
  meetingNotesPath: string,
  metadataPath: string,
  options: ProcessOptions = {}
): Promise<ProcessResult> {
  try {
    logger.info(`=== Procesando evento: ${eventId} ===\n`);

    // 1. Inicializar servicios
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

    const drive = new DriveService();
    await drive.authenticate();

    // 2. Obtener evento y buscar transcripción
    logger.info('📅 Paso 1: Obteniendo evento y buscando transcripción...');
    const { event, transcript } = await findTranscriptForEventId(eventId, drive, db);

    if (!event) {
      throw new Error(`Evento no encontrado: ${eventId}`);
    }

    if (!transcript || transcript.source === 'none' || !transcript.transcript_text) {
      logger.warn('⚠️  No se encontró transcripción para el evento');
      return {
        success: false,
        event,
        transcript,
        error: 'No transcript found',
      };
    }

    logger.info(`✅ Transcripción encontrada desde: ${transcript.source}`);

    // 3. Analizar transcripción con LLM
    logger.info('\n📝 Paso 2: Analizando transcripción con LLM...');
    const analysis = await analyzeTranscript(transcript.transcript_text, {
      model: options.model,
      outputPath: options.outputDir
        ? path.join(options.outputDir, `transcript-analysis-${eventId}.json`)
        : undefined,
    });

    logger.info('✅ Análisis completado');

    // 4. Gestionar entrada en meeting-notes.md
    logger.info('\n📄 Paso 3: Gestionando entrada en meeting-notes.md...');
    const eventDate = new Date(event.start_date_time).toISOString().split('T')[0];
    let entryInfo = findEntryByDate(meetingNotesPath, eventDate);

    if (!entryInfo.entry_exists) {
      logger.info(`Creando nueva entrada para ${eventDate}`);
      const participants =
        event.attendees?.map((a) => a.display_name || a.email || '').filter(Boolean) || [];
      createNewEntry(meetingNotesPath, eventDate, event.title, participants);
      entryInfo = findEntryByDate(meetingNotesPath, eventDate);
    } else {
      logger.info(`Entrada existente encontrada para ${eventDate}`);
    }

    // 5. Actualizar JSON de metadatos
    logger.info('\n💾 Paso 4: Actualizando metadatos...');
    const metadata = updateMetadataFromAnalysis(
      metadataPath,
      eventDate,
      event.title,
      event.attendees?.map((a) => a.display_name || a.email || '').filter(Boolean) || [],
      transcript.transcript_url,
      transcript.source,
      undefined, // tags - no disponible en MeetingAnalysis
      undefined  // variables - no disponible en MeetingAnalysis
    );

    logger.info('✅ Metadatos actualizados');

    // 6. Determinar estrategia de integración
    logger.info('\n🔍 Paso 5: Determinando estrategia de integración...');
    const integration = await determineIntegration(analysis, meetingNotesPath, {
      model: options.model,
      outputPath: options.outputDir
        ? path.join(options.outputDir, `integration-recommendation-${eventId}.json`)
        : undefined,
    });

    logger.info(`✅ Estrategia: ${integration.strategy}`);
    logger.info(`   Secciones a actualizar: ${integration.sections_to_update.length}`);

    // 7. Aplicar integración si auto-apply está habilitado
    if (options.autoApply) {
      logger.info('\n🔄 Paso 6: Aplicando integración automáticamente...');
      logger.warn('⚠️  Auto-apply aún no implementado completamente');
      logger.info('   Revisa la recomendación y aplica manualmente');
    } else {
      logger.info('\n💡 Paso 6: Revisión manual requerida');
      logger.info('   Revisa la recomendación y aplica los cambios manualmente');
    }

    logger.info('\n✅ Pipeline completado');

    return {
      success: true,
      event,
      transcript,
      analysis,
      entryInfo,
      metadata,
      integration,
    };
  } catch (error: any) {
    logger.error('Error en pipeline', error);
    return {
      success: false,
      error: error.message || String(error),
    };
  }
}

/**
 * Procesa múltiples eventos (batch)
 */
export async function processBatch(
  dateRange: { start: string; end: string } | null,
  meetingNotesPath: string,
  metadataPath: string,
  options: ProcessOptions = {}
): Promise<ProcessResult[]> {
  try {
    logger.info('=== Procesamiento masivo de eventos ===\n');

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

    // Construir query
    let query = db.from('calendar_events').select('id, google_event_id, summary, start_date_time, end_date_time');

    if (dateRange) {
      query = query
        .gte('start_date_time', dateRange.start)
        .lte('start_date_time', dateRange.end);
    } else {
      // Por defecto, últimos 7 días
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      query = query.gte('start_date_time', sevenDaysAgo.toISOString());
    }

    query = query.order('start_date_time', { ascending: false }).limit(100);

    const { data: events, error } = await query;

    if (error) {
      throw error;
    }

    if (!events || events.length === 0) {
      logger.warn('No se encontraron eventos en el rango especificado');
      return [];
    }

    logger.info(`Encontrados ${events.length} eventos para procesar\n`);

    const results: ProcessResult[] = [];

    for (const event of events) {
      logger.info(`\n--- Procesando evento: ${event.summary} (${event.id}) ---`);
      const result = await processEvent(event.id, meetingNotesPath, metadataPath, options);
      results.push(result);

      if (!result.success) {
        logger.warn(`⚠️  Evento falló: ${result.error}`);
      }

      // Pequeña pausa para no sobrecargar APIs
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const successCount = results.filter((r) => r.success).length;
    logger.info(`\n=== Resumen ===`);
    logger.info(`Total procesados: ${results.length}`);
    logger.info(`Exitosos: ${successCount}`);
    logger.info(`Fallidos: ${results.length - successCount}`);

    return results;
  } catch (error: any) {
    logger.error('Error en procesamiento masivo', error);
    throw error;
  }
}

/**
 * Función principal
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    logger.error('Uso: ts-node process-meeting-transcript.ts [opciones]');
    logger.error('');
    logger.error('Opciones:');
    logger.error('  --event-id <id>          Procesar evento específico');
    logger.error('  --batch                  Procesamiento masivo');
    logger.error('  --date-range <start:end> Rango de fechas (YYYY-MM-DD:YYYY-MM-DD)');
    logger.error('  --workspace <name>       Workspace (required)');
    logger.error('  --auto-apply             Aplicar integración automáticamente');
    logger.error('  --model <model>          Modelo de OpenAI');
    logger.error('  --output-dir <dir>       Directorio para archivos de salida');
    logger.error('');
    logger.error('Ejemplos:');
    logger.error('  # Procesar evento individual');
    logger.error('  ts-node process-meeting-transcript.ts --event-id <event-id>');
    logger.error('');
    logger.error('  # Procesamiento masivo de últimos 7 días');
    logger.error('  ts-node process-meeting-transcript.ts --batch');
    logger.error('');
    logger.error('  # Procesamiento masivo con rango de fechas');
    logger.error('  ts-node process-meeting-transcript.ts --batch --date-range 2025-01-01:2025-01-31');
    process.exit(1);
  }

  // Parsear opciones
  const options: ProcessOptions = {};
  let eventId: string | null = null;
  let batch = false;
  let dateRange: { start: string; end: string } | null = null;
  let workspace: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--event-id' && i + 1 < args.length) {
      eventId = args[i + 1];
      i++;
    } else if (args[i] === '--batch') {
      batch = true;
    } else if (args[i] === '--date-range' && i + 1 < args.length) {
      const range = args[i + 1].split(':');
      if (range.length === 2) {
        dateRange = { start: range[0], end: range[1] };
      }
      i++;
    } else if (args[i] === '--workspace' && i + 1 < args.length) {
      workspace = args[i + 1];
      i++;
    } else if (args[i] === '--auto-apply') {
      options.autoApply = true;
    } else if (args[i] === '--model' && i + 1 < args.length) {
      options.model = args[i + 1];
      i++;
    } else if (args[i] === '--output-dir' && i + 1 < args.length) {
      options.outputDir = args[i + 1];
      i++;
    }
  }

  // Validar workspace
  if (!workspace) {
    logger.error('❌ Error: --workspace es requerido');
    logger.error('');
    logger.error('Ejemplo:');
    logger.error('  ts-node process-meeting-transcript.ts --workspace inspiro --event-id <id>');
    process.exit(1);
  }

  // Encontrar directorio del workspace (puede tener emojis)
  const projectRoot = path.resolve(__dirname, '../../../../..');
  const workspacesDir = path.join(projectRoot, 'workspaces');
  if (!fs.existsSync(workspacesDir)) {
    logger.error(`❌ Directorio de workspaces no encontrado: ${workspacesDir}`);
    process.exit(1);
  }

  const entries = fs.readdirSync(workspacesDir, { withFileTypes: true });
  let workspaceDir: string | null = null;
  
  // Buscar coincidencia exacta primero
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name === workspace) {
      workspaceDir = entry.name;
      break;
    }
  }

  // Buscar coincidencia parcial (sin emojis)
  if (!workspaceDir) {
    const normalizedName = workspace.toLowerCase().replace(/[^\w\s]/g, '').trim();
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const normalizedEntry = entry.name.toLowerCase().replace(/[^\w\s]/g, '').trim();
        if (normalizedEntry === normalizedName || normalizedEntry.includes(normalizedName) || normalizedName.includes(normalizedEntry)) {
          workspaceDir = entry.name;
          break;
        }
      }
    }
  }

  if (!workspaceDir) {
    logger.error(`❌ Workspace "${workspace}" no encontrado en ${workspacesDir}`);
    logger.error('');
    logger.error('Workspaces disponibles:');
    for (const entry of entries) {
      if (entry.isDirectory()) {
        logger.error(`  - ${entry.name}`);
      }
    }
    process.exit(1);
  }

  // Determinar rutas
  const meetingNotesPath = path.join(
    projectRoot,
    'workspaces',
    workspaceDir,
    '⚙️ company-management',
    '📝 meeting-notes.md'
  );
  const metadataPath = path.join(
    projectRoot,
    'workspaces',
    workspaceDir,
    '⚙️ company-management',
    'data',
    'meeting-notes-metadata.json'
  );

  // Crear directorio de salida si se especifica
  if (options.outputDir) {
    const outputDir = path.resolve(options.outputDir);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    options.outputDir = outputDir;
  }

  try {
    if (batch) {
      // Procesamiento masivo
      const results = await processBatch(dateRange, meetingNotesPath, metadataPath, options);
      process.exit(results.every((r) => r.success) ? 0 : 1);
    } else if (eventId) {
      // Procesamiento individual
      const result = await processEvent(eventId, meetingNotesPath, metadataPath, options);
      process.exit(result.success ? 0 : 1);
    } else {
      logger.error('Debe especificar --event-id o --batch');
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

// Exportaciones ya están en las funciones arriba

