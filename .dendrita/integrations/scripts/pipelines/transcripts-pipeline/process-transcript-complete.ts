#!/usr/bin/env npx ts-node
/**
 * Pipeline completo para procesar transcripciones
 * 
 * Orquesta:
 * 1. Normalización de transcripción
 * 2. Identificación de contexto
 * 3. Análisis contextual
 * 4. Guardado de archivos generados
 */

import { createLogger } from '../../../utils/logger';
import { normalizeTranscript } from './normalize/normalize-transcript';
import { identifyTranscriptContext, TranscriptContext } from './context/identify-transcript-context';
import { analyzeTranscriptContextual, ContextualAnalysis } from './analyze/analyze-transcript-contextual';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('ProcessTranscriptComplete');

export interface ProcessOptions {
  eventInfo?: any;
  autoApply?: boolean;
  model?: string;
  skipNormalization?: boolean;
  skipAnalysis?: boolean;
}

export interface ProcessResult {
  success: boolean;
  transcriptPath: string;
  normalizedPath?: string;
  context?: TranscriptContext;
  analysis?: ContextualAnalysis;
  analysisPath?: string;
  error?: string;
}

/**
 * Procesa una transcripción completa
 */
async function processTranscriptComplete(
  transcriptPath: string,
  options: ProcessOptions = {}
): Promise<ProcessResult> {
  try {
    logger.info(`=== Procesando transcripción: ${transcriptPath} ===\n`);

    // 1. Leer transcripción
    if (!fs.existsSync(transcriptPath)) {
      throw new Error(`Transcripción no encontrada: ${transcriptPath}`);
    }

    const transcriptContent = fs.readFileSync(transcriptPath, 'utf-8');
    
    // Extraer texto del frontmatter si existe
    let transcriptText = transcriptContent;
    const frontmatterMatch = transcriptContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (frontmatterMatch) {
      transcriptText = frontmatterMatch[2];
    }

    logger.info(`📄 Transcripción leída (${transcriptText.length} caracteres)`);

    // 2. Normalizar transcripción
    let normalizedText = transcriptText;
    let normalizedPath: string | undefined;
    
    if (!options.skipNormalization) {
      logger.info('\n📝 Paso 1/3: Normalizando transcripción...');
      
      const transcriptDir = path.dirname(transcriptPath);
      const transcriptName = path.basename(transcriptPath, path.extname(transcriptPath));
      normalizedPath = path.join(transcriptDir, `${transcriptName}-normalizada.md`);
      
      normalizedText = await normalizeTranscript(transcriptText, {
        model: options.model,
        outputPath: normalizedPath,
        originalPath: transcriptPath,
      });
      
      logger.info(`✅ Transcripción normalizada guardada en: ${normalizedPath}`);
    } else {
      logger.info('⏭️  Normalización omitida');
    }

    // 3. Identificar contexto
    logger.info('\n📊 Paso 2/3: Identificando contexto...');
    
    const context = await identifyTranscriptContext(
      transcriptPath,
      normalizedText,
      options.eventInfo
    );
    
    logger.info(`✅ Contexto identificado: ${context.type} (confianza: ${context.confidence})`);
    logger.info(`📂 Carpeta destino: ${context.destinationPath}`);

    // 4. Análisis contextual
    let analysis: ContextualAnalysis | undefined;
    let analysisPath: string | undefined;
    
    if (!options.skipAnalysis) {
      logger.info('\n🔍 Paso 3/3: Analizando contextualmente...');
      
      analysis = await analyzeTranscriptContextual(normalizedText, context, {
        model: options.model,
        loadContext: true,
      });
      
      // Guardar análisis
      const transcriptDir = path.dirname(transcriptPath);
      const transcriptName = path.basename(transcriptPath, path.extname(transcriptPath));
      analysisPath = path.join(transcriptDir, `${transcriptName}-analisis.json`);
      
      fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2), 'utf-8');
      
      logger.info(`✅ Análisis contextual completado`);
      logger.info(`💾 Análisis guardado en: ${analysisPath}`);
    } else {
      logger.info('⏭️  Análisis omitido');
    }

    // Resumen
    logger.info('\n✅ Procesamiento completado');
    logger.info(`📄 Archivos generados:`);
    if (normalizedPath) {
      logger.info(`   1. Transcripción normalizada: ${normalizedPath}`);
    }
    if (analysisPath) {
      logger.info(`   2. Análisis: ${analysisPath}`);
    }

    return {
      success: true,
      transcriptPath,
      normalizedPath,
      context,
      analysis,
      analysisPath,
    };
  } catch (error: any) {
    logger.error('Error en el procesamiento', error);
    return {
      success: false,
      transcriptPath,
      error: error.message,
    };
  }
}

/**
 * Función principal para uso desde línea de comandos
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Uso: ts-node process-transcript-complete.ts <transcript-file> [options]');
    console.error('\nOpciones:');
    console.error('  --skip-normalization  Omitir normalización');
    console.error('  --skip-analysis       Omitir análisis');
    console.error('  --model <model>       Modelo de OpenAI a usar');
    process.exit(1);
  }

  const transcriptPath = args[0];
  const options: ProcessOptions = {};

  // Parsear opciones
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--skip-normalization') {
      options.skipNormalization = true;
    } else if (args[i] === '--skip-analysis') {
      options.skipAnalysis = true;
    } else if (args[i] === '--model' && i + 1 < args.length) {
      options.model = args[++i];
    }
  }

  try {
    const result = await processTranscriptComplete(transcriptPath, options);

    if (result.success) {
      console.log('\n✅ Procesamiento completado exitosamente');
      if (result.normalizedPath) {
        console.log(`📄 Transcripción normalizada: ${result.normalizedPath}`);
      }
      if (result.analysisPath) {
        console.log(`📊 Análisis: ${result.analysisPath}`);
      }
      if (result.context) {
        console.log(`\n📊 Resumen:`);
        console.log(`   - Tipo: ${result.context.type}`);
        console.log(`   - Workspace: ${result.context.workspace}`);
        if (result.context.project) {
          console.log(`   - Proyecto: ${result.context.project}`);
        }
        console.log(`   - Confianza: ${result.context.confidence}`);
      }
    } else {
      console.error('\n❌ Error en el procesamiento:', result.error);
      process.exit(1);
    }
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { processTranscriptComplete, ProcessResult, ProcessOptions };

