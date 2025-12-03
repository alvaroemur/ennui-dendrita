#!/usr/bin/env npx ts-node
/**
 * Script para listar transcripciones disponibles en Tactiq
 */

import { DriveService } from '../../../services/google/drive';
import { findTactiqFolder, findBestCandidate } from './match-tactiq-transcript';
import { createLogger } from '../../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('ListTranscripts');

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
      .filter(dirent => dirent.isDirectory() && dirent.name !== 'example-user')
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
 * Lista transcripciones recientes de Tactiq
 */
async function listRecentTranscripts(days: number = 30): Promise<void> {
  try {
    const drive = new DriveService();
    await drive.authenticate();

    // Cargar configuración desde ubicación del usuario
    let config;
    try {
      const userId = getUserId();
      const configPath = path.join(
        process.cwd(),
        '.dendrita',
        'users',
        userId,
        'config',
        'transcript-matching.json'
      );
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch {
      config = {
        tactiq_folder: {
          path: ['📂 Registros', 'Tactiq Transcription'],
          folder_id: null,
        },
      };
    }

    // Buscar carpeta de Tactiq
    const tactiqFolderId = await findTactiqFolder(drive, config);
    if (!tactiqFolderId) {
      logger.error('No se encontró la carpeta de Tactiq');
      return;
    }

    logger.info(`📁 Carpeta de Tactiq: ${tactiqFolderId}\n`);

    // Listar documentos
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    let pageToken: string | undefined;
    const transcripts: Array<{ id: string; name: string; created: Date; webViewLink?: string }> = [];

    do {
      const query = `mimeType='application/vnd.google-apps.document' and '${tactiqFolderId}' in parents and trashed = false`;
      const result = await drive.listFiles({
        q: query,
        pageSize: 200,
        pageToken,
        orderBy: 'modifiedTime desc',
      });

      if (result.files) {
        for (const file of result.files) {
          const created = new Date(file.createdTime);
          if (created >= cutoffDate) {
            transcripts.push({
              id: file.id,
              name: file.name,
              created,
              webViewLink: file.webViewLink,
            });
          }
        }
      }

      pageToken = result.nextPageToken;
    } while (pageToken);

    logger.info(`📄 Transcripciones encontradas (últimos ${days} días): ${transcripts.length}\n`);

    if (transcripts.length === 0) {
      logger.warn('No se encontraron transcripciones recientes');
      return;
    }

    // Mostrar transcripciones
    transcripts.forEach((transcript, index) => {
      logger.info(`${index + 1}. ${transcript.name}`);
      logger.info(`   Fecha: ${transcript.created.toLocaleDateString('es-PE', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`);
      logger.info(`   ID: ${transcript.id}`);
      if (transcript.webViewLink) {
        logger.info(`   Link: ${transcript.webViewLink}`);
      }
      logger.info('');
    });

    logger.info(`\n💡 Total: ${transcripts.length} transcripciones`);
  } catch (error: any) {
    logger.error('Error al listar transcripciones', error);
    throw error;
  }
}

/**
 * Función principal
 */
async function main() {
  const args = process.argv.slice(2);
  const days = args[0] ? parseInt(args[0], 10) : 30;

  try {
    await listRecentTranscripts(days);
  } catch (error) {
    logger.error('Error fatal', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    logger.error('Error fatal', error);
    process.exit(1);
  });
}

