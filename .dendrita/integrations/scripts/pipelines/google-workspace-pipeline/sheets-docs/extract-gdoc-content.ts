/**
 * Script para extraer contenido de un Google Doc en formato Markdown
 * Utiliza la exportación nativa de Google Drive API (mimeType=text/markdown)
 * que fue introducida en julio 2024
 */

import { DriveService } from '../../../services/google/drive';
import { credentials } from '../../../utils/credentials';
import { createLogger } from '../../../utils/logger';
import { generateScrapeSignature, insertSignature } from '../../../utils/wikilink-signature';
import { trackFileModification } from '../../../utils/file-tracking';
import { updateBacklinksFromContent } from '../../../utils/backlinks';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('ExtractGDocContent');

async function extractGDocContent(fileId: string, outputPath: string) {
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

    // Usar Google Drive API para exportar directamente a Markdown
    // Google Docs soporta exportación nativa a Markdown desde julio 2024
    const exportUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export?mimeType=text/markdown`;
    const response = await fetch(exportUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Drive API export error: ${response.status} - ${errorText}`);
    }

    // El contenido ya viene en formato Markdown
    const text = await response.text();

    // Asegurar que el archivo tenga extensión .md (si no la tiene, agregarla)
    let finalOutputPath = outputPath;
    if (!finalOutputPath.endsWith('.md')) {
      finalOutputPath = finalOutputPath + '.md';
      logger.info(`Extensión .md agregada al archivo de salida: ${finalOutputPath}`);
    }

    // Crear directorio si no existe
    const dir = path.dirname(finalOutputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Agregar firma de scraping (siempre es markdown ahora)
    const sourceId = `Google Doc: ${fileId}`;
    const signature = generateScrapeSignature(sourceId, 'google-doc');
    const textWithSignature = insertSignature(text, signature, 'end');
    
    // Trackear modificación antes de escribir
    const scriptPath = __filename;
    const sourceFiles: string[] = [sourceId];
    trackFileModification(scriptPath, finalOutputPath, sourceFiles, 'extract-gdoc-content', {
      source: `Google Doc: ${fileId}`,
    });

    // Guardar contenido en formato Markdown
    fs.writeFileSync(finalOutputPath, textWithSignature, 'utf-8');
    logger.info(`Contenido extraído y guardado en formato Markdown: ${finalOutputPath}`);
    logger.info(`Tamaño: ${textWithSignature.length} caracteres`);

    // Actualizar backlinks
    await updateBacklinksFromContent(finalOutputPath);

    return textWithSignature;
  } catch (error: any) {
    logger.error('Error al extraer contenido del Google Doc', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const fileId = process.argv[2];
  const outputPath = process.argv[3];

  if (!fileId || !outputPath) {
    console.error('Uso: ts-node extract-gdoc-content.ts <fileId> <outputPath>');
    process.exit(1);
  }

  extractGDocContent(fileId, outputPath)
    .then(() => {
      logger.info('Extracción completada');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Error fatal', error);
      process.exit(1);
    });
}

export { extractGDocContent };
