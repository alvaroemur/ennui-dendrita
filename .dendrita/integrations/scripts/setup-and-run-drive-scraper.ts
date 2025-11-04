#!/usr/bin/env npx ts-node
/**
 * Script genérico para configurar y ejecutar scraping de Google Drive para un workspace
 * 
 * Lee la configuración del workspace y crea/actualiza la configuración de scraping,
 * luego ejecuta el scraping.
 * 
 * Uso:
 *   ts-node .dendrita/integrations/scripts/setup-and-run-drive-scraper.ts <workspace-path> <user-id>
 * 
 * Ejemplo:
 *   ts-node .dendrita/integrations/scripts/setup-and-run-drive-scraper.ts workspaces/[workspace-name]/company-management [user-id]
 */

import { DriveScraper } from '../services/google/drive-scraper';
import { createLogger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('SetupAndRunDriveScraper');

interface DriveFolderConfig {
  folderId?: string;
  folderName?: string;
  parentFolderId?: string;
  parentFolderName?: string;
  search?: {
    folderName?: string;
  };
  output?: {
    workspaceName?: string;
  };
}

/**
 * Carga la configuración del workspace
 */
function loadWorkspaceConfig(workspacePath: string): DriveFolderConfig {
  const configPath = path.join(workspacePath, 'drive-folder-config.json');
  
  if (!fs.existsSync(configPath)) {
    throw new Error(`Archivo de configuración no encontrado: ${configPath}`);
  }

  const configContent = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(configContent);
}

/**
 * Extrae el nombre del workspace del path
 */
function extractWorkspaceName(workspacePath: string): string {
  const parts = workspacePath.split(path.sep);
  const workspaceIndex = parts.indexOf('workspaces');
  
  if (workspaceIndex >= 0 && workspaceIndex < parts.length - 1) {
    return parts[workspaceIndex + 1];
  }
  
  // Fallback: usar el nombre de la carpeta
  return path.basename(workspacePath);
}

/**
 * Función principal
 */
async function main(workspacePath: string, userId: string): Promise<void> {
  try {
    // Resolver path absoluto
    const projectRoot = path.resolve(__dirname, '../../..');
    const fullWorkspacePath = path.isAbsolute(workspacePath) 
      ? workspacePath 
      : path.join(projectRoot, workspacePath);

    logger.info(`=== Configurando y ejecutando scraping de Drive ===\n`);
    logger.info(`Workspace path: ${fullWorkspacePath}`);
    logger.info(`User ID: ${userId}\n`);

    // Cargar configuración del workspace
    const config = loadWorkspaceConfig(fullWorkspacePath);
    
    if (!config.folderId) {
      throw new Error('No se encontró folderId en la configuración. Ejecuta primero el script de sincronización de referencia.');
    }

    // Extraer nombre del workspace
    const workspaceName = extractWorkspaceName(workspacePath);
    const configName = `${workspaceName}-drive-scraper`;

    logger.info(`Workspace: ${workspaceName}`);
    logger.info(`Carpeta ID: ${config.folderId}`);
    logger.info(`Nombre de carpeta: ${config.folderName || 'N/A'}\n`);

    // Inicializar scraper
    const scraper = new DriveScraper();
    await scraper.initialize();

    // Crear o actualizar configuración
    logger.info('Creando/actualizando configuración de scraping...');
    await scraper.upsertConfig({
      user_id: userId,
      workspace: workspaceName,
      config_name: configName,
      enabled: true,
      folder_ids: [config.folderId],
      include_subfolders: true,
      max_results: 1000,
      extract_permissions: true,
      extract_revisions: false,
      extract_content: false,
      extract_metadata: true,
      extract_thumbnail: false,
    });

    logger.info('✅ Configuración creada/actualizada\n');

    // Ejecutar scraping
    logger.info('Ejecutando scraping...\n');
    const results = await scraper.scrapeForUser(
      userId,
      undefined, // profile_id (opcional)
      workspaceName // workspace
    );

    // Mostrar resultados
    logger.info(`\n📊 Scraping completado: ${results.length} configuración(es) procesada(s)\n`);
    
    for (const result of results) {
      logger.info(`
Config: ${result.config.config_name}
  Workspace: ${result.config.workspace || 'default'}
  Archivos procesados: ${result.files_processed}
  Archivos creados: ${result.files_created}
  Archivos actualizados: ${result.files_updated}
  Carpetas creadas: ${result.folders_created}
  Carpetas actualizadas: ${result.folders_updated}
  Permisos creados: ${result.permissions_created}
  Revisiones creadas: ${result.revisions_created}
  Errores: ${result.errors.length}
  Duración: ${result.duration_ms}ms
      `);

      if (result.errors.length > 0) {
        logger.warn(`Errores en config ${result.config.config_name}:`);
        result.errors.forEach((error, index) => {
          logger.warn(`  ${index + 1}. ${error}`);
        });
      }
    }

    logger.info('\n✅ Scraping completado exitosamente');
  } catch (error: any) {
    logger.error('Error en scraping', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const workspacePath = process.argv[2];
  const userId = process.argv[3];
  
  if (!workspacePath || !userId) {
    logger.error('Uso: ts-node setup-and-run-drive-scraper.ts <workspace-path> <user-id>');
    logger.error('Ejemplo: ts-node setup-and-run-drive-scraper.ts workspaces/[workspace-name]/company-management [user-id]');
    process.exit(1);
  }

  main(workspacePath, userId).catch(error => {
    logger.error('Error no manejado', error);
    process.exit(1);
  });
}

export { main };

