#!/usr/bin/env npx ts-node
/**
 * Script para listar archivos en la carpeta de Hedy Transcription
 */

import { DriveService } from '../../../services/google/drive';
import { createLogger } from '../../../utils/logger';

const logger = createLogger('ListHedyFolder');

async function listHedyFolder() {
  try {
    const drive = new DriveService();
    await drive.authenticate();

    const hedyFolderId = '1XbLjLJfme9RIIS9A9eapQuT31ACCbZ0a';

    logger.info(`📁 Listando archivos en carpeta Hedy Transcription...\n`);

    const query = `'${hedyFolderId}' in parents and trashed = false`;
    const result = await drive.listFiles({
      q: query,
      pageSize: 100,
      orderBy: 'modifiedTime desc',
    });

    logger.info(`📄 Archivos encontrados: ${result.files?.length || 0}\n`);

    if (result.files && result.files.length > 0) {
      result.files.forEach((file: any) => {
        logger.info(`  - ${file.name}`);
        logger.info(`    ID: ${file.id}`);
        logger.info(`    Tipo: ${file.mimeType}`);
        logger.info(`    Modificado: ${file.modifiedTime}`);
        if (file.webViewLink) {
          logger.info(`    Link: ${file.webViewLink}`);
        }
        logger.info('');
      });

      // Buscar específicamente transcripciones del 6 de noviembre
      logger.info('\n🔍 Buscando transcripciones del 6 de noviembre de 2025...\n');
      const nov6Files = result.files.filter((file: any) => {
        const modified = new Date(file.modifiedTime);
        const nov6 = new Date('2025-11-06');
        return modified.toISOString().split('T')[0] === nov6.toISOString().split('T')[0] ||
               file.name.toLowerCase().includes('2025-11-06') ||
               file.name.toLowerCase().includes('nov 06') ||
               file.name.toLowerCase().includes('nov06') ||
               file.name.toLowerCase().includes('norsac');
      });

      if (nov6Files.length > 0) {
        logger.info(`✅ Transcripciones del 6 de noviembre encontradas: ${nov6Files.length}\n`);
        nov6Files.forEach((file: any) => {
          logger.info(`  📄 ${file.name}`);
          logger.info(`     ID: ${file.id}`);
          logger.info(`     Link: ${file.webViewLink || 'N/A'}`);
          logger.info('');
        });
      } else {
        logger.warn('⚠️  No se encontraron transcripciones específicas del 6 de noviembre');
      }
    } else {
      logger.warn('⚠️  No se encontraron archivos en la carpeta de Hedy');
    }
  } catch (error: any) {
    logger.error('Error al listar carpeta de Hedy', error);
    throw error;
  }
}

if (require.main === module) {
  listHedyFolder().catch((error) => {
    logger.error('Error fatal', error);
    process.exit(1);
  });
}

export { listHedyFolder };

