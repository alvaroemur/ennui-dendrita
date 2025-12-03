#!/usr/bin/env ts-node
/**
 * Procesa el log de enriquecimiento y genera datos JSON para el dashboard
 */

import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from '../../utils/logger';

const logger = createLogger('ProcessEnrichmentLog');

interface EnrichmentStats {
  totalDocuments: number;
  processedDocuments: number;
  skippedDocuments: number;
  totalBacklinks: number;
  totalRelationships: number;
  tokenUsage: {
    total: number;
    prompt: number;
    completion: number;
    estimatedCost: number;
  };
  apiCalls: {
    semanticAnalysis: number;
    relationshipDetection: number;
    embeddings: number;
  };
  documentsByStatus: {
    processed: number;
    skipped: number;
  };
  backlinksByDocument: Array<{
    document: string;
    backlinks: number;
  }>;
  relationshipsByDocument: Array<{
    document: string;
    relationships: number;
  }>;
  tokenUsageByDocument: Array<{
    document: string;
    tokens: number;
  }>;
  processingTimeline: Array<{
    timestamp: string;
    document: string;
    status: string;
  }>;
}

function processLogFile(logPath: string): EnrichmentStats {
  const stats: EnrichmentStats = {
    totalDocuments: 0,
    processedDocuments: 0,
    skippedDocuments: 0,
    totalBacklinks: 0,
    totalRelationships: 0,
    tokenUsage: {
      total: 0,
      prompt: 0,
      completion: 0,
      estimatedCost: 0,
    },
    apiCalls: {
      semanticAnalysis: 0,
      relationshipDetection: 0,
      embeddings: 0,
    },
    documentsByStatus: {
      processed: 0,
      skipped: 0,
    },
    backlinksByDocument: [],
    relationshipsByDocument: [],
    tokenUsageByDocument: [],
    processingTimeline: [],
  };

  if (!fs.existsSync(logPath)) {
    logger.warn(`Log file not found: ${logPath}`);
    return stats;
  }

  const logContent = fs.readFileSync(logPath, 'utf-8');
  const lines = logContent.split('\n');

  const documents = new Set<string>();
  const backlinksByDoc = new Map<string, number>();
  const relationshipsByDoc = new Map<string, number>();
  const tokensByDoc = new Map<string, number>();
  const processedDocs = new Set<string>();

  let currentDocument = '';
  let currentTimestamp = '';

  for (const line of lines) {
    // Extraer documentos procesados
    const processingMatch = line.match(/Processing (.+?)\.\.\./);
    if (processingMatch) {
      currentDocument = processingMatch[1];
      documents.add(currentDocument);
      const timestampMatch = line.match(/\[(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2})\]/);
      if (timestampMatch) {
        currentTimestamp = timestampMatch[1];
      }
    }

    // Contar documentos completados
    const completeMatch = line.match(/Processing complete for (.+)/);
    if (completeMatch) {
      stats.processedDocuments++;
      processedDocs.add(completeMatch[1]);
      if (currentDocument && currentTimestamp) {
        stats.processingTimeline.push({
          timestamp: currentTimestamp,
          document: path.basename(currentDocument),
          status: 'completed',
        });
      }
    }

    // Contar documentos saltados
    if (line.includes('Skipping') && line.includes('already processed')) {
      stats.skippedDocuments++;
    }

    // Contar backlinks agregados
    const backlinkMatch = line.match(/Added backlink in (.+?) for (.+)/);
    if (backlinkMatch) {
      stats.totalBacklinks++;
      const targetDoc = backlinkMatch[1];
      backlinksByDoc.set(targetDoc, (backlinksByDoc.get(targetDoc) || 0) + 1);
    }

    // Contar relaciones encontradas
    const relationshipMatch = line.match(/Found (\d+) potential relationships/);
    if (relationshipMatch) {
      const count = parseInt(relationshipMatch[1], 10);
      stats.totalRelationships += count;
      if (currentDocument) {
        relationshipsByDoc.set(currentDocument, count);
      }
    }

    // Extraer uso de tokens
    const tokenMatch = line.match(/Token usage: (\d+) total \((\d+) prompt \+ (\d+) completion\)/);
    if (tokenMatch) {
      const total = parseInt(tokenMatch[1], 10);
      const prompt = parseInt(tokenMatch[2], 10);
      const completion = parseInt(tokenMatch[3], 10);

      stats.tokenUsage.total += total;
      stats.tokenUsage.prompt += prompt;
      stats.tokenUsage.completion += completion;

      if (currentDocument) {
        tokensByDoc.set(currentDocument, (tokensByDoc.get(currentDocument) || 0) + total);
      }
    }

    // Contar llamadas a la API
    if (line.includes('Sending message to gpt-4o')) {
      stats.apiCalls.semanticAnalysis++;
    }
    if (line.includes('Sending message to gpt-4o-mini')) {
      stats.apiCalls.relationshipDetection++;
    }
    if (line.includes('Creating embedding')) {
      stats.apiCalls.embeddings++;
    }
  }

  // Calcular costo estimado (gpt-4o: $2.50/1M input, $10/1M output)
  stats.tokenUsage.estimatedCost =
    (stats.tokenUsage.prompt / 1_000_000) * 2.5 + (stats.tokenUsage.completion / 1_000_000) * 10.0;

  stats.totalDocuments = documents.size;
  stats.documentsByStatus.processed = stats.processedDocuments;
  stats.documentsByStatus.skipped = stats.skippedDocuments;

  // Convertir mapas a arrays
  stats.backlinksByDocument = Array.from(backlinksByDoc.entries())
    .map(([doc, count]) => ({
      document: path.basename(doc),
      backlinks: count,
    }))
    .sort((a, b) => b.backlinks - a.backlinks)
    .slice(0, 20); // Top 20

  stats.relationshipsByDocument = Array.from(relationshipsByDoc.entries())
    .map(([doc, count]) => ({
      document: path.basename(doc),
      relationships: count,
    }))
    .sort((a, b) => b.relationships - a.relationships)
    .slice(0, 20); // Top 20

  stats.tokenUsageByDocument = Array.from(tokensByDoc.entries())
    .map(([doc, count]) => ({
      document: path.basename(doc),
      tokens: count,
    }))
    .sort((a, b) => b.tokens - a.tokens)
    .slice(0, 20); // Top 20

  return stats;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const logPath = args[0] || '/tmp/enrichment-relationships.log';
  const outputPath = args[1] || path.join(process.cwd(), '.dendrita', 'integrations', 'dashboards', 'enrichment-stats.json');

  logger.info(`Processing log file: ${logPath}`);
  logger.info(`Output path: ${outputPath}`);

  const stats = processLogFile(logPath);

  // Crear directorio si no existe
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Guardar estadísticas
  fs.writeFileSync(outputPath, JSON.stringify(stats, null, 2), 'utf-8');

  logger.info('✅ Statistics processed and saved');
  logger.info(`   Total documents: ${stats.totalDocuments}`);
  logger.info(`   Processed: ${stats.processedDocuments}`);
  logger.info(`   Skipped: ${stats.skippedDocuments}`);
  logger.info(`   Total backlinks: ${stats.totalBacklinks}`);
  logger.info(`   Total relationships: ${stats.totalRelationships}`);
  logger.info(`   Total tokens: ${stats.tokenUsage.total.toLocaleString()}`);
  logger.info(`   Estimated cost: $${stats.tokenUsage.estimatedCost.toFixed(4)} USD`);
}

if (require.main === module) {
  main().catch((error) => {
    logger.error('Fatal error', error);
    process.exit(1);
  });
}

export { processLogFile, EnrichmentStats };

