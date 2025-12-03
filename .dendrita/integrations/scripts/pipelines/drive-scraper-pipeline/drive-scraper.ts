#!/usr/bin/env npx ts-node
/**
 * Drive Scraper Pipeline - Script principal
 * 
 * Uso:
 *   ts-node pipelines/drive-scraper-pipeline/drive-scraper.ts [workspace]
 */

import { DriveScraper } from '../../services/google/drive-scraper';
import { createLogger } from '../../utils/logger';
import { dendritaLogger } from '../../../utils/dendrita-logger';
import * as path from 'path';
import { getUserId, getWorkspace, loadConfig } from './utils';

const logger = createLogger('DriveScraperPipeline');

/**
 * Función principal
 */
async function main(workspaceOverride?: string): Promise<void> {
  const startTime = Date.now();
  const scriptPath = __filename;
  const scriptName = path.basename(scriptPath, path.extname(scriptPath));
  
  let scriptId: string | undefined;
  let userId: string | undefined;
  let workspace: string | undefined;

  try {
    logger.info('Starting Drive scraper...');

    // Cargar configuración del pipeline
    const pipelineConfig = loadConfig();

    // Obtener user_id
    userId = getUserId();
    logger.info(`Using user ID: ${userId}`);

    // Obtener workspace (opcional)
    workspace = workspaceOverride || getWorkspace(userId);
    if (workspace) {
      logger.info(`Using workspace: ${workspace}`);
    } else {
      logger.info('No workspace specified, will process all enabled configs');
    }

    // Registrar inicio de ejecución
    scriptId = dendritaLogger.logScriptExecution(
      scriptName,
      scriptPath,
      {
        user_id: userId,
        workspace: workspace,
        status: 'success',
      }
    );

    // Crear scraper
    const scraper = new DriveScraper();
    await scraper.initialize();

    // Ejecutar scraping
    logger.info('Executing scrape...');
    const results = await scraper.scrapeForUser(
      userId,
      undefined, // profile_id (opcional)
      workspace // workspace (opcional)
    );

    // Mostrar resultados
    logger.info(`Scraping completed: ${results.length} configs processed`);
    
    for (const result of results) {
      logger.info(`
Config: ${result.config.config_name}
  Workspace: ${result.config.workspace || 'default'}
  Files processed: ${result.files_processed}
  Files created: ${result.files_created}
  Files updated: ${result.files_updated}
  Folders created: ${result.folders_created}
  Folders updated: ${result.folders_updated}
  Permissions: ${result.permissions_created}
  Revisions: ${result.revisions_created}
  Errors: ${result.errors.length}
  Duration: ${result.duration_ms}ms
      `);

      if (result.errors.length > 0) {
        logger.warn(`Errors in config ${result.config.config_name}: ${JSON.stringify(result.errors)}`);
      }
    }

    // Calcular totales
    const totalFilesProcessed = results.reduce((sum, r) => sum + r.files_processed, 0);
    const totalFilesCreated = results.reduce((sum, r) => sum + r.files_created, 0);
    const totalFilesUpdated = results.reduce((sum, r) => sum + r.files_updated, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    // Registrar éxito
    dendritaLogger.log({
      level: 'info',
      component_type: 'script',
      component_name: scriptName,
      component_path: scriptPath,
      user_id: userId,
      workspace: workspace,
      event_type: 'execute',
      event_description: 'Drive scraper completed successfully',
      status: totalErrors > 0 ? 'warning' : 'success',
      duration: Date.now() - startTime,
      triggered_by: scriptId,
      metadata: {
        total_files_processed: totalFilesProcessed,
        total_files_created: totalFilesCreated,
        total_files_updated: totalFilesUpdated,
        total_errors: totalErrors,
        configs_processed: results.length,
      },
    });

    logger.info('Drive scraper completed successfully');
  } catch (error: any) {
    // Registrar error
    dendritaLogger.log({
      level: 'error',
      component_type: 'script',
      component_name: scriptName,
      component_path: scriptPath,
      user_id: userId,
      workspace: workspace,
      event_type: 'execute',
      event_description: 'Drive scraper failed',
      status: 'error',
      duration: Date.now() - startTime,
      error: error.message,
      triggered_by: scriptId,
    });

    logger.error('Drive scraper failed', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const workspaceOverride = process.argv[2]; // Opcional: workspace como primer argumento
  main(workspaceOverride).catch(error => {
    logger.error('Unhandled error', error);
    process.exit(1);
  });
}

export { main };

