/**
 * Script de prueba para conectar con Google Drive
 */

import { DriveService } from '../../services/google/drive';
import { credentials } from '../../utils/credentials';
import { createLogger } from '../../utils/logger';

const logger = createLogger('TestDrive');

async function testDriveConnection(): Promise<void> {
  try {
    logger.info('🔍 Verificando configuración de Google Workspace...');

    if (!credentials.hasGoogleWorkspace()) {
      logger.error('❌ Google Workspace no está configurado');
      logger.info('📖 Por favor, sigue la guía en: .dendrita/integrations/hooks/google-auth-flow.md');
      process.exit(1);
    }

    logger.info('✅ Google Workspace está configurado');
    logger.info('🔗 Conectando con Google Drive...');

    const drive = new DriveService();
    await drive.authenticate();
    logger.info('✅ Autenticación exitosa');

    // Listar archivos
    logger.info('\n📁 Listando archivos recientes (últimos 10)...');
    const files = await drive.listFiles({ pageSize: 10 });

    if (files.files.length === 0) {
      logger.info('ℹ️ No se encontraron archivos en Drive');
    } else {
      logger.info(`✅ Se encontraron ${files.files.length} archivo(s):`);
      files.files.forEach((file, index) => {
        logger.info(`   ${index + 1}. ${file.name}`);
        logger.info(`      Tipo: ${file.mimeType}`);
        if (file.size) {
          logger.info(`      Tamaño: ${file.size} bytes`);
        }
        logger.info(`      Modificado: ${new Date(file.modifiedTime).toLocaleString()}`);
        if (file.shared) {
          logger.info(`      Compartido: Sí`);
        }
      });
    }

    // Listar carpetas
    logger.info('\n📁 Listando carpetas...');
    const folders = await drive.listFolders({ pageSize: 10 });
    logger.info(`✅ Se encontraron ${folders.files.length} carpeta(s)`);
    folders.files.forEach((folder, index) => {
      logger.info(`   ${index + 1}. ${folder.name}`);
    });

    // Buscar archivos PDF
    logger.info('\n📄 Buscando archivos PDF...');
    const pdfFiles = await drive.searchFiles("mimeType = 'application/pdf'", { pageSize: 5 });
    logger.info(`✅ Se encontraron ${pdfFiles.files.length} archivo(s) PDF`);

    logger.info('\n✅ Conexión con Google Drive exitosa!');
  } catch (error) {
    logger.error('❌ Error al conectar con Google Drive', error);
    if (error instanceof Error) {
      logger.error(`   Mensaje: ${error.message}`);
    }
    process.exit(1);
  }
}

// Ejecutar
testDriveConnection();

