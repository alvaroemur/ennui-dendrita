#!/usr/bin/env npx ts-node
/**
 * Script para extraer transcripciones de Google Docs para el proyecto ennui-x-NOSxOTROS
 * 
 * Extrae transcripciones desde URLs de Google Drive y las guarda en el directorio del proyecto
 */

import { DriveService } from '../../services/google/drive';
import { credentials } from '../../utils/credentials';
import { createLogger } from '../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('ExtractNOSxOTROSTranscripts');

/**
 * Extrae el ID de un archivo desde una URL de Google Drive
 */
function extractFileIdFromUrl(url: string): string | null {
  // Formato: https://drive.google.com/open?id=FILE_ID&usp=drive_copy
  const match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match) {
    return match[1];
  }
  
  // Formato alternativo: https://docs.google.com/document/d/FILE_ID/edit
  const docMatch = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (docMatch) {
    return docMatch[1];
  }
  
  // Si ya es un ID directo
  if (/^[a-zA-Z0-9_-]+$/.test(url)) {
    return url;
  }
  
  return null;
}

/**
 * Extrae el texto de un Google Doc usando Google Docs API
 */
async function extractDocText(drive: DriveService, fileId: string): Promise<{ text: string | null; metadata: any }> {
  try {
    await drive.authenticate();
    const accessToken = (drive as any).accessToken;

    if (!accessToken) {
      throw new Error('No se pudo obtener access token');
    }

    // Primero obtener metadatos del archivo
    const metadataUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType,createdTime,modifiedTime,webViewLink`;
    const metadataResponse = await fetch(metadataUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    let metadata: any = null;
    if (metadataResponse.ok) {
      metadata = await metadataResponse.json();
    }

    // Extraer contenido usando Google Docs API
    const url = `https://docs.googleapis.com/v1/documents/${fileId}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      logger.warn(`Error al obtener documento ${fileId}: ${response.status}`);
      return { text: null, metadata };
    }

    const doc = await response.json();

    // Extraer texto del documento
    let text = '';
    if (doc.body && doc.body.content) {
      for (const element of doc.body.content) {
        if (element.paragraph) {
          for (const paraElement of element.paragraph.elements || []) {
            if (paraElement.textRun) {
              text += paraElement.textRun.content;
            }
          }
        }
        // También extraer texto de tablas si existen
        if (element.table) {
          for (const row of element.table.tableRows || []) {
            for (const cell of row.tableCells || []) {
              for (const cellElement of cell.content || []) {
                if (cellElement.paragraph) {
                  for (const paraElement of cellElement.paragraph.elements || []) {
                    if (paraElement.textRun) {
                      text += paraElement.textRun.content + '\t';
                    }
                  }
                }
              }
              text += '\n';
            }
          }
        }
      }
    }

    return { text, metadata };
  } catch (error: any) {
    logger.error(`Error al extraer texto del documento ${fileId}`, error);
    return { text: null, metadata: null };
  }
}

/**
 * Sanitiza un nombre de archivo
 */
function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 100);
}

/**
 * Función principal
 */
async function main(): Promise<void> {
  // URLs de las transcripciones proporcionadas
  const transcriptUrls = [
    'https://drive.google.com/open?id=1-4IShkA62lhGJUQX-4KBGaOzFh1bVWDdyDPkOEG_TFI&usp=drive_copy',
    'https://drive.google.com/open?id=1QJPEWWJ4rwG-O7jPGMaAHylL0mcE0QZHfj8MqpdItm4&usp=drive_copy',
    'https://drive.google.com/open?id=1pwnphHIFot_zefCGyWjfeHkAalHRP_zL5vIp78ds6js&usp=drive_copy',
    'https://drive.google.com/open?id=1C-kJqO5ecrVFWRdwskF_U9jGoLAyTAY61-m0RgxotBg&usp=drive_copy',
    'https://drive.google.com/open?id=1VV2dXZLrvuvDYRa9KHzhbxfpChbRDEBzd88HZjL-D_Y&usp=drive_copy',
    'https://drive.google.com/open?id=1P5fB7t30ZYUY7aXj7GQD12v0bnCjD1Edd_fOrMDiKMg&usp=drive_copy',
  ];

  if (!credentials.hasGoogleWorkspace()) {
    logger.error('Google Workspace no está configurado');
    process.exit(1);
  }

  // Directorio de salida: proyecto ennui-x-NOSxOTROS
  const projectRoot = path.resolve(__dirname, '../../../..');
  const outputDir = path.join(
    projectRoot,
    'workspaces',
    '🌱 ennui',
    '🚀 active-projects',
    'ennui-x-NOSxOTROS',
    'transcripciones'
  );

  // Crear directorio si no existe
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    logger.info(`📁 Directorio creado: ${outputDir}`);
  }

  const drive = new DriveService();
  await drive.authenticate();

  logger.info(`\n📋 Iniciando extracción de ${transcriptUrls.length} transcripciones\n`);
  logger.info(`📂 Directorio de salida: ${outputDir}\n`);

  const results: Array<{ url: string; fileId: string | null; success: boolean; filename?: string; error?: string }> = [];

  for (let i = 0; i < transcriptUrls.length; i++) {
    const url = transcriptUrls[i];
    logger.info(`[${i + 1}/${transcriptUrls.length}] Procesando: ${url}`);

    const fileId = extractFileIdFromUrl(url);
    
    if (!fileId) {
      logger.error(`   ❌ No se pudo extraer el ID del archivo de la URL`);
      results.push({ url, fileId: null, success: false, error: 'No se pudo extraer ID de la URL' });
      continue;
    }

    logger.info(`   📄 ID del archivo: ${fileId}`);

    try {
      const { text, metadata } = await extractDocText(drive, fileId);

      if (!text) {
        logger.warn(`   ⚠️  No se pudo extraer el contenido del documento`);
        results.push({ url, fileId, success: false, error: 'No se pudo extraer contenido' });
        continue;
      }

      // Generar nombre de archivo
      let filename: string;
      if (metadata && metadata.name) {
        const sanitizedName = sanitizeFileName(metadata.name);
        filename = `${i + 1}-${sanitizedName}.txt`;
      } else {
        const date = new Date().toISOString().split('T')[0];
        filename = `${i + 1}-transcript-${fileId.substring(0, 8)}-${date}.txt`;
      }

      const filepath = path.join(outputDir, filename);

      // Guardar transcripción
      fs.writeFileSync(filepath, text, 'utf-8');
      
      logger.info(`   ✅ Transcripción guardada: ${filename}`);
      logger.info(`      Tamaño: ${text.length} caracteres`);
      if (metadata && metadata.name) {
        logger.info(`      Nombre original: ${metadata.name}`);
      }
      logger.info('');

      results.push({ url, fileId, success: true, filename });
    } catch (error: any) {
      logger.error(`   ❌ Error al procesar: ${error.message}`);
      results.push({ url, fileId, success: false, error: error.message });
    }
  }

  // Generar resumen
  const summaryPath = path.join(outputDir, 'README-transcripciones.md');
  const summary = [
    '# Transcripciones - ennui-x-NOSxOTROS',
    '',
    `**Fecha de extracción:** ${new Date().toISOString()}`,
    `**Total procesadas:** ${transcriptUrls.length}`,
    `**Exitosas:** ${results.filter(r => r.success).length}`,
    `**Fallidas:** ${results.filter(r => !r.success).length}`,
    '',
    '## Transcripciones',
    '',
    ...results.map((result, index) => {
      if (result.success) {
        return `### ${index + 1}. ${result.filename}\n\n- **URL:** ${result.url}\n- **ID:** ${result.fileId}\n- **Estado:** ✅ Extraída exitosamente\n`;
      } else {
        return `### ${index + 1}. Error\n\n- **URL:** ${result.url}\n- **ID:** ${result.fileId || 'N/A'}\n- **Estado:** ❌ Error\n- **Error:** ${result.error}\n`;
      }
    }),
    '',
    '---',
    '',
    '**Nota:** Estas transcripciones fueron extraídas automáticamente desde Google Drive.',
  ].join('\n');

  fs.writeFileSync(summaryPath, summary, 'utf-8');
  logger.info(`\n📄 Resumen guardado en: ${summaryPath}`);

  // Mostrar resumen final
  logger.info('\n' + '='.repeat(80));
  logger.info('📊 RESUMEN FINAL');
  logger.info('='.repeat(80));
  logger.info(`✅ Transcripciones exitosas: ${results.filter(r => r.success).length}/${transcriptUrls.length}`);
  logger.info(`❌ Transcripciones fallidas: ${results.filter(r => !r.success).length}/${transcriptUrls.length}`);
  logger.info(`📂 Directorio: ${outputDir}`);
  logger.info('='.repeat(80) + '\n');

  if (results.some(r => !r.success)) {
    logger.warn('⚠️  Algunas transcripciones no se pudieron extraer. Revisa el resumen para más detalles.');
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch((error) => {
    logger.error('Error fatal', error);
    process.exit(1);
  });
}

export { extractDocText, extractFileIdFromUrl };

