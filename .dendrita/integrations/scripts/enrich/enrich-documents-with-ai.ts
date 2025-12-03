#!/usr/bin/env npx ts-node
/**
 * Script base para enriquecer documentos con IA
 * 
 * Analiza documentos semánticamente, detecta relaciones,
 * genera tags y crea backlinks inteligentes.
 * 
 * Es idempotente: no reprocesa documentos ya procesados
 * a menos que se especifique --force.
 * 
 * Uso:
 *   ts-node enrich-documents-with-ai.ts
 *   ts-node enrich-documents-with-ai.ts --workspace ennui
 *   ts-node enrich-documents-with-ai.ts --file path/to/file.md
 *   ts-node enrich-documents-with-ai.ts --force
 *   ts-node enrich-documents-with-ai.ts --adapter sheets
 */

import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from '../../utils/logger';
import { dendritaLogger } from '../../../utils/dendrita-logger';
import { analyzeDocument } from '../../utils/semantic-analyzer';
import { detectRelationships } from '../../utils/relationship-detector';
import { generateSmartContext } from '../../utils/smart-context-generator';
import { addBacklink, extractWikilinks, updateBacklinksFromContent } from '../../utils/backlinks';
import { trackProcessing, isFileProcessed, getContentHash, ProcessingRecord } from '../../utils/file-tracking';
import { DocumentAdapter, Document } from './adapters/base-adapter';
import { FilesAdapter } from './adapters/files-adapter';
import { usageStats } from '../../utils/usage-stats';
import { usageLogger } from '../../utils/usage-logger';

const logger = createLogger('EnrichDocumentsWithAI');

const PROCESSOR_NAME = 'enrich-documents-with-ai';

interface EnrichmentOptions {
  force?: boolean;
  useSmartContext?: boolean;
  detectRelationships?: boolean;
  maxRelationships?: number;
  minSimilarity?: number;
  model?: string;
}

/**
 * Procesa un documento: analiza, detecta relaciones y actualiza backlinks
 */
async function processDocument(
  doc: Document,
  allDocuments: Document[],
  options: EnrichmentOptions,
  projectRoot: string = process.cwd()
): Promise<void> {
  try {
    const filePath = doc.path;
    const content = doc.content;

    // Verificar si ya fue procesado (idempotencia)
    const contentHash = getContentHash(filePath);
    if (!options.force && contentHash && isFileProcessed(filePath, PROCESSOR_NAME, contentHash)) {
      logger.info(`⏭️  Skipping ${filePath} (already processed)`);
      return;
    }

    logger.info(`📄 Processing ${filePath}...`);

    // 1. Análisis semántico
    logger.info(`  🔍 Analyzing semantically...`);
    const analysis = await analyzeDocument(content, filePath, {
      model: options.model,
      includeRelationships: options.detectRelationships,
    });

    logger.info(`  ✅ Analysis complete: ${analysis.topics.length} topics, ${analysis.tags.length} tags`);

    // 2. Detectar relaciones semánticas (opcional)
    let relationships: Array<{ targetDocument: string; relationshipType: string; strength: number; context: string; suggestedTags: string[]; reason: string }> = [];
    if (options.detectRelationships && allDocuments.length > 1) {
      logger.info(`  🔗 Detecting relationships...`);
      const candidateDocs = allDocuments
        .filter(d => d.path !== filePath)
        .map(d => ({ path: d.path, content: d.content }));
      
      relationships = await detectRelationships(
        content,
        filePath,
        candidateDocs,
        {
          minSimilarity: options.minSimilarity || 0.3,
          maxRelationships: options.maxRelationships || 10,
        }
      );
      logger.info(`  ✅ Found ${relationships.length} relationships`);
    }

    // 3. Actualizar backlinks desde wikilinks explícitos
    logger.info(`  🔗 Updating backlinks from wikilinks...`);
    await updateBacklinksFromContent(filePath, projectRoot, {
      useSmartContext: options.useSmartContext !== false, // Por defecto true
    });

    // 4. Agregar backlinks desde relaciones semánticas detectadas
    if (relationships.length > 0) {
      logger.info(`  🔗 Adding backlinks from semantic relationships...`);
      for (const relationship of relationships) {
        try {
          // Solo agregar si la similitud es alta
          if (relationship.strength >= (options.minSimilarity || 0.3)) {
            const context = relationship.context || relationship.reason;
            await addBacklink(
              relationship.targetDocument,
              filePath,
              context,
              'section',
              projectRoot,
              {
                useSmartContext: options.useSmartContext !== false,
                sourceContent: content,
              }
            );
          }
        } catch (error) {
          logger.warn(`  ⚠️  Error adding backlink to ${relationship.targetDocument}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    // 5. Actualizar tags en frontmatter (si existe)
    if (analysis.tags.length > 0) {
      await updateTagsInFrontmatter(filePath, analysis.tags, projectRoot);
    }

    // 6. Registrar procesamiento
    const analysisHash = JSON.stringify(analysis).substring(0, 100);
    trackProcessing(
      filePath,
      PROCESSOR_NAME,
      contentHash || '',
      analysisHash,
      {
        topics: analysis.topics,
        tags: analysis.tags,
        relationships: relationships.length,
      },
      projectRoot
    );

    logger.info(`  ✅ Processing complete for ${filePath}`);
  } catch (error) {
    logger.error(`Error processing document ${doc.path}`, error);
  }
}

/**
 * Actualiza tags en el frontmatter del documento
 */
async function updateTagsInFrontmatter(
  filePath: string,
  newTags: string[],
  projectRoot: string = process.cwd()
): Promise<void> {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Buscar frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
    if (!frontmatterMatch) {
      return; // No hay frontmatter, no hacer nada
    }

    const frontmatterContent = frontmatterMatch[1];
    const rest = content.slice(frontmatterMatch[0].length);

    // Extraer tags existentes
    const tagsMatch = frontmatterContent.match(/^tags:\s*(.+)$/m);
    const existingTags = tagsMatch 
      ? tagsMatch[1].replace(/[\[\]]/g, '').split(',').map(t => t.trim().replace(/['"]/g, ''))
      : [];

    // Combinar tags (sin duplicados)
    const allTags = Array.from(new Set([...existingTags, ...newTags]));

    // Actualizar frontmatter
    let updatedFrontmatter = frontmatterContent;
    if (tagsMatch) {
      // Reemplazar tags existentes
      updatedFrontmatter = updatedFrontmatter.replace(
        /^tags:\s*.+$/m,
        `tags: [${allTags.map(t => `"${t}"`).join(', ')}]`
      );
    } else {
      // Agregar tags al final del frontmatter
      updatedFrontmatter = updatedFrontmatter + `\ntags: [${allTags.map(t => `"${t}"`).join(', ')}]`;
    }

    const newContent = `---\n${updatedFrontmatter}\n---\n${rest}`;
    fs.writeFileSync(filePath, newContent, 'utf-8');
    logger.debug(`Updated tags in ${filePath}`);
  } catch (error) {
    logger.warn(`Error updating tags in ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Función principal
 */
async function main(): Promise<void> {
  const startTime = Date.now();
  const scriptPath = __filename;
  const scriptName = path.basename(scriptPath, path.extname(scriptPath));
  
  let scriptId: string | undefined;
  let workspaceFilter: string | undefined;

  try {
    const args = process.argv.slice(2);
    const workspaceIndex = args.indexOf('--workspace');
    const fileIndex = args.indexOf('--file');
    const forceIndex = args.indexOf('--force');
    const adapterIndex = args.indexOf('--adapter');
    const noSmartContextIndex = args.indexOf('--no-smart-context');
    const noRelationshipsIndex = args.indexOf('--no-relationships');

    workspaceFilter = workspaceIndex >= 0 && args[workspaceIndex + 1] 
      ? args[workspaceIndex + 1] 
      : undefined;
    
    const fileFilter = fileIndex >= 0 && args[fileIndex + 1]
      ? args[fileIndex + 1]
      : undefined;

    const force = forceIndex >= 0;
    const adapterName = adapterIndex >= 0 && args[adapterIndex + 1]
      ? args[adapterIndex + 1]
      : 'files';

    const options: EnrichmentOptions = {
      force,
      useSmartContext: noSmartContextIndex < 0, // Por defecto true
      detectRelationships: noRelationshipsIndex < 0, // Por defecto true
      maxRelationships: 10,
      minSimilarity: 0.3,
    };

    // Registrar inicio de ejecución
    scriptId = dendritaLogger.logScriptExecution(
      scriptName,
      scriptPath,
      {
        workspace: workspaceFilter,
        status: 'success',
        metadata: {
          adapter: adapterName,
          force,
          use_smart_context: options.useSmartContext,
          detect_relationships: options.detectRelationships,
        },
      }
    );

    const projectRoot = process.cwd();
    const workspacesDir = path.join(projectRoot, 'workspaces');

    logger.info('=== ENRICHMENT WITH AI ===\n');
    logger.info(`Options: ${JSON.stringify(options, null, 2)}\n`);

    // Seleccionar adapter
    let adapter: DocumentAdapter;
    if (adapterName === 'files') {
      adapter = new FilesAdapter(workspacesDir, workspaceFilter, fileFilter);
    } else {
      logger.error(`Unknown adapter: ${adapterName}`);
      logger.info('Available adapters: files');
      process.exit(1);
    }

    // Extraer documentos
    logger.info(`📚 Extracting documents using ${adapter.getName()}...`);
    const documents = await adapter.extractDocuments();
    logger.info(`✅ Found ${documents.length} documents\n`);

    if (documents.length === 0) {
      logger.info('No documents to process');
      
      // Registrar skip
      dendritaLogger.log({
        level: 'info',
        component_type: 'script',
        component_name: scriptName,
        component_path: scriptPath,
        workspace: workspaceFilter,
        event_type: 'execute',
        event_description: 'No documents to process',
        status: 'skipped',
        duration: Date.now() - startTime,
        triggered_by: scriptId,
      });
      
      return;
    }

    // Procesar documentos
    logger.info(`🔄 Processing ${documents.length} document(s)...\n`);
    let processed = 0;
    let skipped = 0;

    for (const doc of documents) {
      const contentHash = getContentHash(doc.path);
      if (!options.force && contentHash && isFileProcessed(doc.path, PROCESSOR_NAME, contentHash)) {
        skipped++;
        continue;
      }

      await processDocument(doc, documents, options, projectRoot);
      processed++;
    }

    logger.info(`\n📊 Summary:`);
    logger.info(`   Total documents: ${documents.length}`);
    logger.info(`   Processed: ${processed}`);
    logger.info(`   Skipped (already processed): ${skipped}`);
    
    // Mostrar estadísticas de uso de tokens
    try {
    const report = usageStats.getOverallReport(1); // Últimas 24 horas
    const openaiStats = report.services['OpenAI'];
    if (openaiStats) {
      logger.info(`\n💰 Token Usage (OpenAI):`);
      logger.info(`   Total calls: ${openaiStats.totalCalls}`);
      logger.info(`   Successful: ${openaiStats.successCalls}`);
      logger.info(`   Errors: ${openaiStats.errorCalls}`);
      
      // Calcular tokens totales si están en metadata
      let totalTokens = 0;
      let promptTokens = 0;
      let completionTokens = 0;
      
      // Leer todos los logs de OpenAI de las últimas 24 horas
      const allLogs = usageLogger.readServiceLogs('OpenAI'); // Sin límite
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      for (const log of allLogs) {
        const logDate = new Date(log.timestamp);
        if (logDate >= oneDayAgo && log.metadata) {
          if (typeof log.metadata.total_tokens === 'number') {
            totalTokens += log.metadata.total_tokens;
          }
          if (typeof log.metadata.prompt_tokens === 'number') {
            promptTokens += log.metadata.prompt_tokens;
          }
          if (typeof log.metadata.completion_tokens === 'number') {
            completionTokens += log.metadata.completion_tokens;
          }
        }
      }
      
      if (totalTokens > 0) {
        logger.info(`   Total tokens: ${totalTokens.toLocaleString()}`);
        logger.info(`   Prompt tokens: ${promptTokens.toLocaleString()}`);
        logger.info(`   Completion tokens: ${completionTokens.toLocaleString()}`);
        
        // Estimación de costo (gpt-4o: $2.50/1M input, $10/1M output)
        const inputCost = (promptTokens / 1_000_000) * 2.50;
        const outputCost = (completionTokens / 1_000_000) * 10.00;
        const estimatedCost = inputCost + outputCost;
        logger.info(`   Estimated cost: ~$${estimatedCost.toFixed(4)} USD (input: $${inputCost.toFixed(4)}, output: $${outputCost.toFixed(4)})`);
      }
    }
    } catch (error) {
      logger.warn(`Could not retrieve usage statistics: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    logger.info(`\n✅ Enrichment complete`);

    // Registrar éxito
    dendritaLogger.log({
      level: 'info',
      component_type: 'script',
      component_name: scriptName,
      component_path: scriptPath,
      workspace: workspaceFilter,
      event_type: 'execute',
      event_description: 'Document enrichment completed successfully',
      status: 'success',
      duration: Date.now() - startTime,
      triggered_by: scriptId,
      metadata: {
        total_documents: documents.length,
        processed,
        skipped,
        adapter: adapterName,
        force,
      },
    });
  } catch (error: any) {
    // Registrar error
    dendritaLogger.log({
      level: 'error',
      component_type: 'script',
      component_name: scriptName,
      component_path: scriptPath,
      workspace: workspaceFilter,
      event_type: 'execute',
      event_description: 'Document enrichment failed',
      status: 'error',
      duration: Date.now() - startTime,
      error: error.message,
      triggered_by: scriptId,
    });

    logger.error('Fatal error', error);
    throw error;
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch((error) => {
    logger.error('Fatal error', error);
    process.exit(1);
  });
}

export { processDocument, main, EnrichmentOptions };

