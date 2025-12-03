/**
 * Script para extraer contenido de un Google Sheet
 */

import { DriveService } from '../../../services/google/drive';
import { credentials } from '../../../utils/credentials';
import { createLogger } from '../../../utils/logger';
import { generateScrapeSignature, insertSignature } from '../../../utils/wikilink-signature';
import { trackFileModification } from '../../../utils/file-tracking';
import { updateBacklinksFromContent } from '../../../utils/backlinks';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('ExtractGSheetContent');

async function extractGSheetContent(fileId: string, outputPath: string) {
  try {
    if (!credentials.hasGoogleWorkspace()) {
      logger.error('Google Workspace no está configurado');
      return;
    }

    const drive = new DriveService();
    await drive.authenticate();
    
    // Obtener access token del drive service
    const accessToken = (drive as any).accessToken;
    
    if (!accessToken) {
      logger.error('No se pudo obtener access token');
      return;
    }

    // Usar Google Sheets API para extraer contenido
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${fileId}/values/A1:Z1000`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Sheets API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Convertir a texto
    let text = '';
    if (data.values && Array.isArray(data.values)) {
      for (const row of data.values) {
        if (Array.isArray(row)) {
          text += row.join('\t') + '\n';
        }
      }
    }

    // Crear directorio si no existe
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Si el archivo de salida es markdown, agregar firma
    if (outputPath.endsWith('.md')) {
      const sourceId = `Google Sheet: ${fileId}`;
      const signature = generateScrapeSignature(sourceId, 'google-sheet');
      text = insertSignature(text, signature, 'end');
      
      // Trackear modificación antes de escribir
      const scriptPath = __filename;
      const sourceFiles: string[] = [sourceId];
      trackFileModification(scriptPath, outputPath, sourceFiles, 'extract-gsheet-content', {
        source: `Google Sheet: ${fileId}`,
      });
    }

    // Guardar contenido
    fs.writeFileSync(outputPath, text, 'utf-8');
    logger.info(`Contenido extraído y guardado en: ${outputPath}`);
    logger.info(`Tamaño: ${text.length} caracteres`);

    // Si es markdown, actualizar backlinks
    if (outputPath.endsWith('.md')) {
      await updateBacklinksFromContent(outputPath);
    }

    return text;
  } catch (error: any) {
    logger.error('Error al extraer contenido del Google Sheet', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const fileId = process.argv[2];
  const outputPath = process.argv[3];

  if (!fileId || !outputPath) {
    console.error('Uso: ts-node extract-gsheet-content.ts <fileId> <outputPath>');
    process.exit(1);
  }

  extractGSheetContent(fileId, outputPath)
    .then(() => {
      logger.info('Extracción completada');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Error fatal', error);
      process.exit(1);
    });
}

export { extractGSheetContent };
