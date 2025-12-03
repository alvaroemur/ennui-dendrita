#!/usr/bin/env ts-node
/**
 * Script para sincronizar cambios del servidor de vuelta a Google Drive
 * Actualiza archivos en Google Drive cuando se modifican en el servidor
 */

import * as fs from 'fs';
import * as path from 'path';
import { DriveService } from '../services/google/drive';
import { createLogger } from '../utils/logger';

const logger = createLogger('SyncToDrive');

interface SyncConfig {
  sourcePath: string;
  driveFolderId: string;
  fileName: string;
}

class SyncToDrive {
  private driveService: DriveService;
  private repoRoot: string;

  constructor(repoRoot: string = '/app/dendrita') {
    this.repoRoot = repoRoot;
    this.driveService = new DriveService();
  }

  async authenticate(): Promise<void> {
    try {
      await this.driveService.authenticate();
      logger.info('Authenticated with Google Drive');
    } catch (error) {
      logger.error('Failed to authenticate with Google Drive', error);
      throw error;
    }
  }

  async findDendritaFolder(): Promise<string | null> {
    try {
      // Buscar carpeta "ennui-dendrita" en Google Drive (raíz)
      const folders = await this.driveService.listFolders();
      const dendritaFolder = folders.find((folder: any) => 
        folder.name === 'ennui-dendrita' || folder.name?.includes('dendrita')
      );
      
      if (dendritaFolder) {
        logger.info(`Found dendrita folder: ${dendritaFolder.id}`);
        return dendritaFolder.id;
      }
      
      logger.warn('Dendrita folder not found in Google Drive');
      return null;
    } catch (error) {
      logger.error('Failed to find dendrita folder', error);
      return null;
    }
  }

  async findFileInFolder(folderId: string, fileName: string): Promise<string | null> {
    try {
      const files = await this.driveService.listFilesInFolder(folderId);
      const file = files.find((f: any) => f.name === fileName);
      
      if (file) {
        logger.info(`Found file: ${file.id}`);
        return file.id;
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to find file in folder', error);
      return null;
    }
  }

  async uploadFile(localPath: string, folderId: string, fileName: string): Promise<boolean> {
    try {
      if (!fs.existsSync(localPath)) {
        logger.error(`File not found: ${localPath}`);
        return false;
      }

      // Buscar si el archivo ya existe
      const existingFileId = await this.findFileInFolder(folderId, fileName);
      
      if (existingFileId) {
        // Actualizar archivo existente
        logger.info(`Updating existing file: ${fileName}`);
        await this.driveService.updateFile(existingFileId, localPath);
      } else {
        // Crear nuevo archivo
        logger.info(`Creating new file: ${fileName}`);
        await this.driveService.uploadFile(localPath, folderId, fileName);
      }

      logger.info(`File synced to Google Drive: ${fileName}`);
      return true;
    } catch (error) {
      logger.error(`Failed to upload file ${fileName}`, error);
      return false;
    }
  }

  async syncManifest(): Promise<boolean> {
    try {
      await this.authenticate();
      
      const manifestPath = path.join(this.repoRoot, '.dendrita', 'deployment-manifest.json');
      if (!fs.existsSync(manifestPath)) {
        logger.warn('Manifest not found on server');
        return false;
      }

      const folderId = await this.findDendritaFolder();
      if (!folderId) {
        logger.error('Could not find dendrita folder in Google Drive');
        return false;
      }

      // Construir ruta relativa en Drive
      const relativePath = '.dendrita/deployment-manifest.json';
      const fileName = 'deployment-manifest.json';
      
      // Buscar o crear carpeta .dendrita en Drive
      const dendritaFolderId = await this.findOrCreateFolder(folderId, '.dendrita');
      if (!dendritaFolderId) {
        logger.error('Could not find or create .dendrita folder');
        return false;
      }

      // Buscar o crear carpeta integrations en .dendrita
      const integrationsFolderId = await this.findOrCreateFolder(dendritaFolderId, 'integrations');
      if (!integrationsFolderId) {
        logger.error('Could not find or create integrations folder');
        return false;
      }

      // El manifest va en .dendrita, no en integrations
      return await this.uploadFile(manifestPath, dendritaFolderId, fileName);
    } catch (error) {
      logger.error('Failed to sync manifest', error);
      return false;
    }
  }

  async findOrCreateFolder(parentFolderId: string, folderName: string): Promise<string | null> {
    try {
      // Buscar carpeta
      const folders = await this.driveService.listFolders(parentFolderId);
      const folder = folders.find((f: any) => f.name === folderName);
      
      if (folder) {
        logger.info(`Found existing folder: ${folderName}`);
        return folder.id;
      }

      // Crear carpeta si no existe
      logger.info(`Creating folder: ${folderName}`);
      const newFolder = await this.driveService.createFolder(folderName, parentFolderId);
      return newFolder.id;
    } catch (error) {
      logger.error(`Failed to find or create folder ${folderName}`, error);
      return null;
    }
  }
}

async function main(): Promise<void> {
  const repoRoot = process.env.DENDRITA_REPO_ROOT || '/app/dendrita';
  const sync = new SyncToDrive(repoRoot);

  try {
    const success = await sync.syncManifest();
    if (success) {
      logger.info('Manifest synced to Google Drive successfully');
      process.exit(0);
    } else {
      logger.error('Failed to sync manifest');
      process.exit(1);
    }
  } catch (error) {
    logger.error('Sync process failed', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    logger.error('Unhandled error', error);
    process.exit(1);
  });
}

export { SyncToDrive };

