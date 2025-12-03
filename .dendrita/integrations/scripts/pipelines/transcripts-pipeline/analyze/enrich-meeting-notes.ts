#!/usr/bin/env npx ts-node
/**
 * Script wrapper: Enriquecer meeting notes con transcripción
 * 
 * Ejecuta el pipeline completo:
 * 1. Analiza la transcripción y genera JSON estructurado
 * 2. Determina cómo integrar el análisis en las meeting notes
 * 3. (Opcional) Aplica la integración automáticamente
 */

import { analyzeTranscript } from './analyze-transcript';
import { determineIntegration } from './integrate-transcript-analysis';
import { createLogger } from '../../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('EnrichMeetingNotes');

/**
 * Pipeline completo para enriquecer meeting notes
 */
async function enrichMeetingNotes(
  transcriptPath: string,
  meetingNotesPath: string,
  options: {
    model?: string;
    autoApply?: boolean;
    outputDir?: string;
  } = {}
): Promise<void> {
  try {
    const outputDir = options.outputDir || path.dirname(meetingNotesPath);
    const analysisPath = path.join(outputDir, 'transcript-analysis.json');
    const recommendationPath = path.join(outputDir, 'integration-recommendation.json');

    logger.info('=== PIPELINE DE ENRIQUECIMIENTO DE MEETING NOTES ===\n');

    // Paso 1: Analizar transcripción
    // Usa modelo Tier 1 (gpt-4-turbo) para análisis complejo si no se especifica modelo
    logger.info('📝 Paso 1: Analizando transcripción...');
    const analysis = await analyzeTranscript(transcriptPath, {
      model: options.model, // Si no se especifica, analyze-transcript usa Tier 1 (complex-analysis)
      outputPath: analysisPath,
    });

    logger.info('✅ Análisis completado\n');

    // Paso 2: Determinar integración
    // Usa modelo Tier 1 (gpt-4-turbo) para unificación de múltiples fuentes si no se especifica modelo
    logger.info('🔍 Paso 2: Determinando estrategia de integración...');
    const recommendation = await determineIntegration(
      analysis,
      meetingNotesPath,
      {
        model: options.model, // Si no se especifica, integrate-transcript-analysis usa Tier 1 (multi-source-unification)
        outputPath: recommendationPath,
      }
    );

    logger.info('✅ Recomendación generada\n');

    // Paso 3: Mostrar resumen
    logger.info('=== RESUMEN ===\n');
    logger.info(`Estrategia: ${recommendation.strategy}`);
    logger.info(`Secciones a actualizar: ${recommendation.sections_to_update.length}`);
    if (recommendation.new_sections) {
      logger.info(`Nuevas secciones: ${recommendation.new_sections.length}`);
    }
    if (recommendation.conflicts && recommendation.conflicts.length > 0) {
      logger.warn(`⚠️  Conflictos detectados: ${recommendation.conflicts.length}`);
    }

    logger.info(`\n📄 Archivos generados:`);
    logger.info(`  - Análisis: ${analysisPath}`);
    logger.info(`  - Recomendación: ${recommendationPath}`);

    if (options.autoApply) {
      logger.info('\n🔄 Aplicando integración automáticamente...');
      // TODO: Implementar aplicación automática
      logger.warn('⚠️  Aplicación automática aún no implementada');
      logger.info('   Revisa la recomendación y aplica manualmente');
    } else {
      logger.info('\n💡 Siguiente paso:');
      logger.info('   Revisa la recomendación y aplica los cambios manualmente');
      logger.info(`   Archivo: ${recommendationPath}`);
    }

    logger.info('\n✅ Pipeline completado');
  } catch (error) {
    logger.error('Error en pipeline', error);
    throw error;
  }
}

/**
 * Función principal
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    logger.error('Uso: ts-node enrich-meeting-notes.ts <transcript-file> <meeting-notes-file> [options]');
    logger.error('');
    logger.error('Opciones:');
    logger.error('  --model <model>        Modelo de OpenAI (default: gpt-4o-mini)');
    logger.error('  --auto-apply          Aplicar integración automáticamente (próximamente)');
    logger.error('  --output-dir <dir>    Directorio para archivos de salida');
    logger.error('');
    logger.error('Ejemplo:');
    logger.error('  ts-node enrich-meeting-notes.ts transcript.txt meeting-notes.md');
    logger.error('  ts-node enrich-meeting-notes.ts transcript.txt meeting-notes.md --model gpt-4-turbo');
    process.exit(1);
  }

  const transcriptPath = args[0];
  const meetingNotesPath = args[1];

  // Parsear opciones
  const options: {
    model?: string;
    autoApply?: boolean;
    outputDir?: string;
  } = {};

  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--model' && i + 1 < args.length) {
      options.model = args[i + 1];
      i++;
    } else if (args[i] === '--auto-apply') {
      options.autoApply = true;
    } else if (args[i] === '--output-dir' && i + 1 < args.length) {
      options.outputDir = args[i + 1];
      i++;
    }
  }

  if (!fs.existsSync(transcriptPath)) {
    logger.error(`Archivo de transcripción no encontrado: ${transcriptPath}`);
    process.exit(1);
  }

  try {
    await enrichMeetingNotes(transcriptPath, meetingNotesPath, options);
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

export { enrichMeetingNotes };

