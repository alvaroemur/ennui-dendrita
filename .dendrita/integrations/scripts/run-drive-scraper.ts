#!/usr/bin/env npx ts-node
/**
 * Script simple para ejecutar el scraper de Drive
 * 
 * Uso:
 *   ts-node .dendrita/integrations/scripts/run-drive-scraper.ts [workspace]
 */

import { DriveScraper } from '../services/google/drive-scraper';
import { createLogger } from '../utils/logger';
import * as path from 'path';
import * as fs from 'fs';

const logger = createLogger('RunDriveScraper');

async function main(workspace?: string): Promise<void> {
  try {
    logger.info('Starting Drive scraper...');

    // Obtener user_id del perfil
    // Resolver el directorio raíz del proyecto (subir desde .dendrita/integrations/scripts)
    const projectRoot = path.resolve(__dirname, '../../..');
    const usersDir = path.join(projectRoot, '.dendrita', 'users');
    if (!fs.existsSync(usersDir)) {
      throw new Error(`No users directory found at ${usersDir}`);
    }

    const userDirs = fs.readdirSync(usersDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    if (userDirs.length === 0) {
      throw new Error('No user directories found');
    }

    const userId = process.env.USER_ID || userDirs[0];
    logger.info(`Using user ID: ${userId}`);

    if (workspace) {
      logger.info(`Using workspace: ${workspace}`);
    } else {
      logger.info('No workspace specified, will process all enabled configs');
    }

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
    const totalFilesProcessed = results.reduce((sum: number, r) => sum + r.files_processed, 0);
    const totalFilesCreated = results.reduce((sum: number, r) => sum + r.files_created, 0);
    const totalFilesUpdated = results.reduce((sum: number, r) => sum + r.files_updated, 0);
    const totalErrors = results.reduce((sum: number, r) => sum + r.errors.length, 0);

    logger.info(`
=== Summary ===
Total configs: ${results.length}
Total files processed: ${totalFilesProcessed}
Total files created: ${totalFilesCreated}
Total files updated: ${totalFilesUpdated}
Total errors: ${totalErrors}
    `);

    logger.info('Drive scraper completed successfully');
  } catch (error: any) {
    logger.error('Drive scraper failed', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const workspace = process.argv[2];
  main(workspace).catch((error) => {
    logger.error('Error no manejado', error);
    process.exit(1);
  });
}

export { main };

