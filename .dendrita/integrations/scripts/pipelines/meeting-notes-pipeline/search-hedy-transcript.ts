#!/usr/bin/env npx ts-node
/**
 * Script para buscar transcripciones de Hedy en Google Drive
 */

import { DriveService } from '../../../services/google/drive';
import { createLogger } from '../../../utils/logger';

const logger = createLogger('SearchHedyTranscript');

async function searchHedyTranscripts() {
  try {
    const drive = new DriveService();
    await drive.authenticate();

    // Búsquedas posibles
    const searchTerms = [
      'hedy',
      'Hedy',
      'HEDY',
      'norsac',
      'NORSAC',
      '2025-11-06',
      'nov 06',
      'Nov 06',
      '06 nov',
      '06 Nov'
    ];

    logger.info('🔍 Buscando transcripciones de Hedy en Google Drive...\n');

    for (const term of searchTerms) {
      try {
        // Buscar por nombre que contenga el término
        const query = `name contains '${term}' and trashed = false`;
        const result = await drive.listFiles({
          q: query,
          pageSize: 50,
          orderBy: 'modifiedTime desc',
        });

        if (result.files && result.files.length > 0) {
          logger.info(`📄 Resultados para "${term}": ${result.files.length} archivos\n`);
          
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
        }
      } catch (error: any) {
        logger.warn(`Error en búsqueda "${term}": ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Buscar también documentos modificados el 6 de noviembre
    logger.info('\n📅 Buscando documentos modificados el 6 de noviembre de 2025...\n');
    const nov6Start = new Date('2025-11-06T00:00:00Z').toISOString();
    const nov6End = new Date('2025-11-06T23:59:59Z').toISOString();
    
    const dateQuery = `modifiedTime >= '${nov6Start}' and modifiedTime <= '${nov6End}' and trashed = false`;
    const dateResult = await drive.listFiles({
      q: dateQuery,
      pageSize: 100,
      orderBy: 'modifiedTime desc',
    });

    if (dateResult.files && dateResult.files.length > 0) {
      logger.info(`📄 Documentos modificados el 6 de noviembre: ${dateResult.files.length}\n`);
      
      // Filtrar solo documentos (no carpetas)
      const docs = dateResult.files.filter((file: any) => 
        file.mimeType === 'application/vnd.google-apps.document' || 
        file.mimeType === 'text/plain' ||
        file.mimeType === 'application/pdf'
      );

      docs.forEach((file: any) => {
        logger.info(`  - ${file.name}`);
        logger.info(`    ID: ${file.id}`);
        logger.info(`    Tipo: ${file.mimeType}`);
        logger.info(`    Modificado: ${file.modifiedTime}`);
        if (file.webViewLink) {
          logger.info(`    Link: ${file.webViewLink}`);
        }
        logger.info('');
      });
    }

  } catch (error: any) {
    logger.error('Error al buscar transcripciones', error);
    throw error;
  }
}

if (require.main === module) {
  searchHedyTranscripts().catch((error) => {
    logger.error('Error fatal', error);
    process.exit(1);
  });
}

export { searchHedyTranscripts };

