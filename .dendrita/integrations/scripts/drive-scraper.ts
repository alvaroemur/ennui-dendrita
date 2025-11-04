#!/usr/bin/env npx ts-node
/**
 * Script de scraping de Google Drive
 * Ejecuta scraping para todas las configuraciones habilitadas
 */

import { DriveScraper } from '../services/google/drive-scraper';
import { createLogger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('DriveScraperScript');

/**
 * Obtiene el user_id del perfil del usuario
 */
function getUserId(): string {
  try {
    // Buscar archivos de perfil en .dendrita/users/
    const usersDir = path.join(process.cwd(), '.dendrita', 'users');
    if (!fs.existsSync(usersDir)) {
      throw new Error('No users directory found');
    }

    const userDirs = fs.readdirSync(usersDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    if (userDirs.length === 0) {
      throw new Error('No user directories found');
    }

    // Usar el primer usuario encontrado (o el especificado en env)
    const userId = process.env.USER_ID || userDirs[0];
    
    // Verificar que existe el perfil
    const profilePath = path.join(usersDir, userId, 'profile.json');
    if (!fs.existsSync(profilePath)) {
      throw new Error(`Profile not found for user: ${userId}`);
    }

    return userId;
  } catch (error: any) {
    logger.error('Failed to get user ID', error);
    throw error;
  }
}

/**
 * Obtiene el workspace del perfil del usuario
 */
function getWorkspace(userId: string): string | undefined {
  try {
    const profilePath = path.join(process.cwd(), '.dendrita', 'users', userId, 'profile.json');
    if (!fs.existsSync(profilePath)) {
      return undefined;
    }

    const profileContent = fs.readFileSync(profilePath, 'utf-8');
    const profile = JSON.parse(profileContent);
    
    return profile.workspace || profile.primary_workspace || undefined;
  } catch (error) {
    logger.error('Failed to get workspace from profile', error);
    return undefined;
  }
}

/**
 * Función principal
 */
async function main(workspaceOverride?: string): Promise<void> {
  try {
    logger.info('Starting Drive scraper...');

    // Obtener user_id
    const userId = getUserId();
    logger.info(`Using user ID: ${userId}`);

    // Obtener workspace (opcional)
    // Si se pasa como parámetro, usar ese; si no, usar el del perfil
    const workspace = workspaceOverride || getWorkspace(userId);
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

    logger.info('Drive scraper completed successfully');
  } catch (error: any) {
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

