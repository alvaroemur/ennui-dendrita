#!/usr/bin/env npx ts-node
/**
 * Script de configuración de Drive Scraper
 * Permite crear configuraciones de scraping para carpetas específicas por workspace
 */

import { DriveScraper } from '../../services/google/drive-scraper';
import { DriveService } from '../../services/google/drive';
import { createLogger } from '../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const logger = createLogger('DriveScraperSetup');

/**
 * Obtiene el user_id del perfil del usuario
 */
function getUserId(): string {
  try {
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

    const userId = process.env.USER_ID || userDirs[0];
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
 * Crea interfaz de línea de comandos
 */
function createReadlineInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

/**
 * Pregunta al usuario
 */
function question(rl: readline.Interface, query: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(query, resolve);
  });
}

/**
 * Lista carpetas disponibles en Drive
 */
async function listFolders(driveService: DriveService): Promise<any[]> {
  try {
    await driveService.authenticate();
    const folders = await driveService.listFolders({ pageSize: 100 });
    return folders.files;
  } catch (error) {
    logger.error('Failed to list folders', error);
    return [];
  }
}

/**
 * Busca carpetas por nombre
 */
async function searchFolders(driveService: DriveService, query: string): Promise<any[]> {
  try {
    await driveService.authenticate();
    const results = await driveService.searchFiles(
      `mimeType = 'application/vnd.google-apps.folder' and name contains '${query}'`,
      { pageSize: 50 }
    );
    return results.files;
  } catch (error) {
    logger.error('Failed to search folders', error);
    return [];
  }
}

/**
 * Función principal
 */
async function main(): Promise<void> {
  const rl = createReadlineInterface();

  try {
    logger.info('=== Drive Scraper Setup ===\n');

    // Obtener user_id
    const userId = getUserId();
    logger.info(`Using user ID: ${userId}\n`);

    // Inicializar servicios
    const scraper = new DriveScraper();
    await scraper.initialize();

    const driveService = new DriveService();
    await driveService.authenticate();

    // Preguntar por workspace
    const workspace = await question(rl, 'Workspace name (ej: example-workspace): ');
    if (!workspace.trim()) {
      logger.error('Workspace name is required');
      process.exit(1);
    }

    // Preguntar por nombre de configuración
    const configName = await question(rl, 'Config name (ej: workspace-projects): ');
    if (!configName.trim()) {
      logger.error('Config name is required');
      process.exit(1);
    }

    // Buscar carpetas
    logger.info('\nBuscando carpetas en Drive...');
    const searchQuery = await question(rl, 'Buscar carpeta por nombre (dejar vacío para listar todas): ');
    
    let folders: any[] = [];
    if (searchQuery.trim()) {
      folders = await searchFolders(driveService, searchQuery.trim());
    } else {
      folders = await listFolders(driveService);
    }

    if (folders.length === 0) {
      logger.error('No se encontraron carpetas');
      process.exit(1);
    }

    // Mostrar carpetas encontradas
    logger.info(`\n📁 Encontradas ${folders.length} carpetas:\n`);
    folders.forEach((folder, index) => {
      logger.info(`${index + 1}. ${folder.name}`);
      logger.info(`   ID: ${folder.id}`);
      logger.info(`   Enlace: ${folder.webViewLink || 'N/A'}`);
      logger.info('');
    });

    // Seleccionar carpetas
    const folderSelection = await question(
      rl,
      `Seleccionar carpetas (números separados por comas, ej: 1,3,5): `
    );

    const selectedIndices = folderSelection
      .split(',')
      .map(s => parseInt(s.trim()) - 1)
      .filter(i => i >= 0 && i < folders.length);

    if (selectedIndices.length === 0) {
      logger.error('No se seleccionaron carpetas válidas');
      process.exit(1);
    }

    const selectedFolders = selectedIndices.map(i => folders[i]);
    const folderIds = selectedFolders.map(f => f.id);

    logger.info(`\n✅ Carpetas seleccionadas: ${selectedFolders.map(f => f.name).join(', ')}`);

    // Opciones adicionales
    const includeSubfolders = (await question(rl, 'Incluir subcarpetas recursivamente? (s/n) [s]: ')).toLowerCase() !== 'n';
    const extractPermissions = (await question(rl, 'Extraer permisos? (s/n) [s]: ')).toLowerCase() !== 'n';
    const extractRevisions = (await question(rl, 'Extraer revisiones? (s/n) [n]: ')).toLowerCase() === 's';
    const extractContent = (await question(rl, 'Extraer contenido de archivos? (s/n) [n]: ')).toLowerCase() === 's';
    const extractMetadata = (await question(rl, 'Extraer todos los metadatos? (s/n) [s]: ')).toLowerCase() !== 'n';

    // Crear configuración
    logger.info('\n📝 Creando configuración...');
    await scraper.upsertConfig({
      user_id: userId,
      workspace: workspace.trim(),
      config_name: configName.trim(),
      enabled: true,
      folder_ids: folderIds,
      include_subfolders: includeSubfolders,
      max_results: 1000,
      extract_permissions: extractPermissions,
      extract_revisions: extractRevisions,
      extract_content: extractContent,
      extract_metadata: extractMetadata,
      extract_thumbnail: false,
    });

    logger.info(`\n✅ Configuración creada exitosamente!`);
    logger.info(`\nConfiguración:`);
    logger.info(`  Workspace: ${workspace.trim()}`);
    logger.info(`  Config name: ${configName.trim()}`);
    logger.info(`  Carpetas: ${folderIds.length}`);
    logger.info(`  Incluir subcarpetas: ${includeSubfolders ? 'Sí' : 'No'}`);
    logger.info(`  Extraer permisos: ${extractPermissions ? 'Sí' : 'No'}`);
    logger.info(`  Extraer revisiones: ${extractRevisions ? 'Sí' : 'No'}`);
    logger.info(`  Extraer contenido: ${extractContent ? 'Sí' : 'No'}`);
    logger.info(`  Extraer metadatos: ${extractMetadata ? 'Sí' : 'No'}`);
    logger.info(`\nPara ejecutar el scraping:`);
    logger.info(`  npx ts-node .dendrita/integrations/scripts/drive-scraper.ts`);

  } catch (error: any) {
    logger.error('Setup failed', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(error => {
    logger.error('Unhandled error', error);
    process.exit(1);
  });
}

export { main };

