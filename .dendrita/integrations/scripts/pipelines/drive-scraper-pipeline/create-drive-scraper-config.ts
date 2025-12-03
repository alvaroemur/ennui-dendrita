#!/usr/bin/env npx ts-node
/**
 * Script para crear configuración de scraping de Drive para un workspace
 * 
 * Uso:
 *   ts-node .dendrita/integrations/scripts/create-drive-scraper-config.ts <workspace-path> <user-id>
 */

import { DriveScraper } from '../../services/google/drive-scraper';
import { createLogger } from '../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('CreateDriveScraperConfig');

interface DriveFolderConfig {
  folderId?: string;
  folderName?: string;
  parentFolderId?: string;
  parentFolderName?: string;
  output?: {
    workspaceName?: string;
  };
}

function loadWorkspaceConfig(workspacePath: string): DriveFolderConfig {
  const configPath = path.join(workspacePath, 'drive-folder-config.json');
  
  if (!fs.existsSync(configPath)) {
    throw new Error(`Archivo de configuración no encontrado: ${configPath}`);
  }

  const configContent = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(configContent);
}

function extractWorkspaceName(workspacePath: string): string {
  const parts = workspacePath.split(path.sep);
  const workspaceIndex = parts.indexOf('workspaces');
  
  if (workspaceIndex >= 0 && workspaceIndex < parts.length - 1) {
    return parts[workspaceIndex + 1];
  }
  
  return path.basename(workspacePath);
}

async function main(workspacePath: string, userId: string): Promise<void> {
  try {
    const projectRoot = path.resolve(__dirname, '../../..');
    const fullWorkspacePath = path.isAbsolute(workspacePath) 
      ? workspacePath 
      : path.join(projectRoot, workspacePath);

    logger.info(`=== Creando configuración de scraping de Drive ===\n`);
    logger.info(`Workspace path: ${fullWorkspacePath}`);
    logger.info(`User ID: ${userId}\n`);

    const config = loadWorkspaceConfig(fullWorkspacePath);
    
    if (!config.folderId) {
      throw new Error('No se encontró folderId en la configuración.');
    }

    const workspaceName = extractWorkspaceName(workspacePath);
    const configName = `${workspaceName}-drive-scraper`;

    logger.info(`Workspace: ${workspaceName}`);
    logger.info(`Carpeta ID: ${config.folderId}`);
    logger.info(`Nombre de carpeta: ${config.folderName || 'N/A'}\n`);

    const scraper = new DriveScraper();
    await scraper.initialize();

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

    logger.info('✅ Configuración creada/actualizada exitosamente');
  } catch (error: any) {
    logger.error('Error', error);
    process.exit(1);
  }
}

if (require.main === module) {
  const workspacePath = process.argv[2];
  const userId = process.argv[3];
  
  if (!workspacePath || !userId) {
    logger.error('Uso: ts-node create-drive-scraper-config.ts <workspace-path> <user-id>');
    logger.error('Ejemplo: ts-node create-drive-scraper-config.ts workspaces/[workspace-name]/company-management [user-id]');
    process.exit(1);
  }

  main(workspacePath, userId).catch(error => {
    logger.error('Error no manejado', error);
    process.exit(1);
  });
}

export { main };

