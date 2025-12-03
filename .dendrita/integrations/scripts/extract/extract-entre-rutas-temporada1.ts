#!/usr/bin/env npx ts-node
/**
 * Script para extraer todas las transcripciones de la Temporada 1 de Entre Rutas y Horizontes
 * desde Google Drive y guardarlas en scraped-content
 */

import { DriveService } from '../../services/google/drive';
import { extractGDocContent } from './extract-gdoc-content';
import { credentials } from '../../utils/credentials';
import { createLogger } from '../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('ExtractEntreRutasTemporada1');

// Folder ID de la carpeta de transcripciones
const FOLDER_ID = '1S_jrNwAmWThD1KCccNY8LCYfSnb0EEMq';

// Directorio de salida
const OUTPUT_DIR = path.join(
  process.cwd(),
  'workspaces/🧭 entre-rutas/⚙️ company-management/data/scraped-content/temporada-1'
);

/**
 * Sanitiza el nombre del archivo para que sea válido en el sistema de archivos
 */
function sanitizeFileName(fileName: string): string {
  // Remover caracteres especiales y espacios, reemplazar con guiones
  return fileName
    .replace(/[^a-zA-Z0-9\s\-_]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .trim();
}

/**
 * Extrae todas las transcripciones de la carpeta
 */
async function extractAllTranscripts() {
  try {
    if (!credentials.hasGoogleWorkspace()) {
      logger.error('Google Workspace no está configurado');
      process.exit(1);
    }

    // Crear directorio de salida si no existe
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      logger.info(`Directorio creado: ${OUTPUT_DIR}`);
    }

    const drive = new DriveService();
    await drive.authenticate();

    logger.info(`📁 Listando archivos en carpeta: ${FOLDER_ID}\n`);

    // Listar todos los archivos en la carpeta
    const result = await drive.listFilesInFolder(FOLDER_ID, {
      pageSize: 100,
      orderBy: 'name',
    });

    const files = result.files || [];
    logger.info(`📄 Archivos encontrados: ${files.length}\n`);

    if (files.length === 0) {
      logger.warn('No se encontraron archivos en la carpeta');
      return;
    }

    // Filtrar solo Google Docs
    const docs = files.filter(
      (file: any) => file.mimeType === 'application/vnd.google-apps.document'
    );

    logger.info(`📝 Google Docs encontrados: ${docs.length}\n`);

    // Extraer cada documento
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      logger.info(`[${i + 1}/${docs.length}] Procesando: ${doc.name}`);

      try {
        // Sanitizar nombre del archivo
        const sanitizedName = sanitizeFileName(doc.name);
        const outputPath = path.join(OUTPUT_DIR, `${sanitizedName}.md`);

        // Extraer contenido
        await extractGDocContent(doc.id, outputPath);
        logger.info(`✅ Guardado: ${outputPath}\n`);
      } catch (error: any) {
        logger.error(`❌ Error al procesar ${doc.name}:`, error.message);
      }
    }

    logger.info(`\n✨ Extracción completada. Archivos guardados en: ${OUTPUT_DIR}`);
  } catch (error: any) {
    logger.error('Error fatal', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  extractAllTranscripts()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Error fatal', error);
      process.exit(1);
    });
}

export { extractAllTranscripts };

