#!/usr/bin/env npx ts-node
/**
 * Script para actualizar una sección específica de un Google Doc
 * basándose en el archivo local scraped
 * 
 * Este script:
 * 1. Lee el archivo local scraped
 * 2. Extrae la sección específica
 * 3. Busca la sección en el documento de Drive (incluyendo tabs)
 * 4. Actualiza o crea la sección en el documento
 */

import { DriveService } from '../../../../services/google/drive';
import { credentials } from '../../../../utils/credentials';
import { createLogger } from '../../../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('UpdateGDocFromScrapedSection');

/**
 * Extrae una sección específica del archivo local scraped
 */
function extractSectionFromScraped(
  scrapedPath: string,
  sectionTitle: string
): string | null {
  if (!fs.existsSync(scrapedPath)) {
    logger.error(`Archivo scraped no encontrado: ${scrapedPath}`);
    return null;
  }

  const content = fs.readFileSync(scrapedPath, 'utf-8');
  
  // Buscar la sección con diferentes variaciones
  const variations = [
    `## ${sectionTitle}`,
    `## ${sectionTitle.replace('Nov 10', '10 nov')}`,
    `## ${sectionTitle.replace('10 nov', 'Nov 10')}`,
    '## Nov 10, 2025',
    '## 10 nov 2025',
    '## Nov 10',
    '## 10 nov',
  ];

  let sectionStart = -1;
  let sectionTitleFound = '';

  for (const variation of variations) {
    const index = content.indexOf(variation);
    if (index !== -1) {
      sectionStart = index;
      sectionTitleFound = variation.replace('## ', '');
      logger.info(`✅ Sección encontrada en archivo local: "${sectionTitleFound}"`);
      break;
    }
  }

  if (sectionStart === -1) {
    logger.warn(`⚠️  No se encontró la sección en el archivo local`);
    return null;
  }

  // Encontrar el fin de la sección (siguiente ## o fin del documento)
  const sectionContent = content.substring(sectionStart);
  const nextSectionMatch = sectionContent.match(/\n## /);
  
  let sectionEnd: number;
  if (nextSectionMatch) {
    sectionEnd = sectionStart + nextSectionMatch.index!;
  } else {
    sectionEnd = content.length;
  }

  const sectionText = content.substring(sectionStart, sectionEnd).trim();
  
  logger.info(`Sección extraída: ${sectionText.length} caracteres`);
  logger.info(`Primeros 200 caracteres: ${sectionText.substring(0, 200)}...`);

  return sectionText;
}

/**
 * Actualiza una sección específica de un Google Doc
 */
async function updateGDocSectionFromScraped(
  fileId: string,
  scrapedPath: string,
  sectionTitle: string,
  options: { dryRun?: boolean; createIfMissing?: boolean } = {}
): Promise<void> {
  try {
    if (!credentials.hasGoogleWorkspace()) {
      logger.error('Google Workspace no está configurado');
      logger.info('Ejecuta: cd .dendrita/integrations && npx tsx scripts/pipelines/google-workspace-pipeline/auth/get-refresh-token.ts');
      return;
    }

    // Paso 1: Extraer la sección del archivo local
    logger.info(`Extrayendo sección del archivo local: ${scrapedPath}`);
    const sectionContent = extractSectionFromScraped(scrapedPath, sectionTitle);
    
    if (!sectionContent) {
      throw new Error(`No se pudo extraer la sección del archivo local`);
    }

    // Paso 2: Autenticar con Google Drive
    const drive = new DriveService();
    await drive.authenticate();
    
    const accessToken = (drive as any).accessToken;
    
    if (!accessToken) {
      logger.error('No se pudo obtener access token');
      return;
    }

    // Paso 3: Obtener el documento completo
    logger.info(`Obteniendo documento: ${fileId}`);
    const docUrl = `https://docs.googleapis.com/v1/documents/${fileId}`;
    const docResponse = await fetch(docUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!docResponse.ok) {
      const errorText = await docResponse.text();
      if (docResponse.status === 403) {
        logger.error('❌ Error de permisos (403)');
        logger.info('El documento no está compartido con tu cuenta o no tienes permisos de escritura');
        logger.info(`Documento: https://docs.google.com/document/d/${fileId}/edit`);
        logger.info('Asegúrate de que el documento esté compartido contigo con permisos de editor');
        logger.info('');
        logger.info('💡 Solución:');
        logger.info('  1. Abre el documento en Google Drive');
        logger.info('  2. Haz clic en "Compartir"');
        logger.info('  3. Asegúrate de que tu cuenta tenga permisos de "Editor"');
        throw new Error('Permisos insuficientes para actualizar el documento');
      }
      throw new Error(`Google Docs API error: ${docResponse.status} - ${errorText}`);
    }

    const doc = await docResponse.json();
    
    // Paso 4: Buscar la sección en el documento
    logger.info(`Buscando sección en el documento de Drive...`);
    
    // Obtener el texto completo del documento
    let fullText = '';
    let charIndex = 1;
    
    if (doc.body && doc.body.content) {
      for (const element of doc.body.content) {
        if (element.paragraph) {
          for (const paraElement of element.paragraph.elements || []) {
            if (paraElement.textRun) {
              const text = paraElement.textRun.content || '';
              fullText += text;
              charIndex += text.length;
            }
          }
        }
      }
    }
    
    logger.info(`Documento completo: ${fullText.length} caracteres`);
    
    // Buscar la sección
    const variations = [
      sectionTitle,
      sectionTitle.replace('Nov 10', '10 nov'),
      sectionTitle.replace('10 nov', 'Nov 10'),
      'Nov 10, 2025',
      '10 nov 2025',
      'Nov 10',
      '10 nov',
      'Inspiro check-in',
    ];
    
    let startIndex: number | null = null;
    let foundVariation = '';

    for (const variation of variations) {
      const index = fullText.indexOf(variation);
      if (index !== -1) {
        startIndex = index + 1; // Google Docs API usa índices basados en 1
        foundVariation = variation;
        logger.info(`✅ Sección encontrada con variación: "${variation}" en índice ${startIndex}`);
        break;
      }
    }
    
    // Si no se encuentra y createIfMissing está activado, crear la sección
    if (!startIndex && options.createIfMissing) {
      logger.info('⚠️  Sección no encontrada, se creará al final del documento');
      startIndex = fullText.length + 1;
    } else if (!startIndex) {
      logger.warn(`⚠️  No se encontró la sección: ${sectionTitle}`);
      logger.info('');
      logger.info('💡 Opciones:');
      logger.info('  1. Usar --create-if-missing para crear la sección al final');
      logger.info('  2. Verificar que el documento tenga la sección en el tab correcto');
      logger.info('  3. Actualizar manualmente en Google Drive');
      throw new Error(`No se pudo encontrar la sección: ${sectionTitle}`);
    }
    
    // Encontrar el fin de la sección
    let endIndex: number;
    
    if (startIndex) {
      const sectionStartText = fullText.substring(startIndex - 1);
      const nextSectionMatch = sectionStartText.match(/\n## /);
      
      if (nextSectionMatch) {
        endIndex = startIndex + nextSectionMatch.index!;
      } else {
        endIndex = fullText.length;
      }
      
      logger.info(`Sección encontrada: índices ${startIndex} - ${endIndex}`);
      
      if (options.dryRun) {
        logger.info('🔍 DRY RUN: No se actualizará el documento');
        logger.info(`Se eliminaría desde índice ${startIndex} hasta ${endIndex}`);
        logger.info(`Se insertaría: ${sectionContent.substring(0, 200)}...`);
        return;
      }
      
      // Paso 5: Actualizar usando batchUpdate
      logger.info('Actualizando sección...');
      const updateUrl = `https://docs.googleapis.com/v1/documents/${fileId}:batchUpdate`;
      
      // Preparar el contenido (sin el ## del título si ya existe)
      let contentToInsert = sectionContent;
      if (contentToInsert.startsWith('## ')) {
        contentToInsert = contentToInsert.substring(3);
      }
      
      const requests = [
        {
          deleteContentRange: {
            range: {
              startIndex: startIndex - 1, // Google Docs API usa índices basados en 0 para startIndex
              endIndex: endIndex,
            },
          },
        },
        {
          insertText: {
            location: {
              index: startIndex - 1,
            },
            text: contentToInsert + '\n\n',
          },
        },
      ];
      
      const updateResponse = await fetch(updateUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests }),
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        if (updateResponse.status === 403) {
          logger.error('❌ Error de permisos (403)');
          logger.info('El documento no está compartido con tu cuenta o no tienes permisos de escritura');
          logger.info(`Documento: https://docs.google.com/document/d/${fileId}/edit`);
          logger.info('Asegúrate de que el documento esté compartido contigo con permisos de editor');
        }
        throw new Error(`Google Docs API error: ${updateResponse.status} - ${errorText}`);
      }

      logger.info('✅ Sección actualizada exitosamente');
      logger.info(`Documento actualizado: https://docs.google.com/document/d/${fileId}/edit`);
    }
  } catch (error: any) {
    logger.error('Error al actualizar sección del Google Doc', error);
    throw error;
  }
}

/**
 * Función principal
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    logger.error('Uso: ts-node update-gdoc-from-scraped-section.ts <file-id> <scraped-file> <section-title> [--dry-run] [--create-if-missing]');
    logger.error('');
    logger.error('Opciones:');
    logger.error('  --dry-run           Solo muestra lo que haría sin actualizar');
    logger.error('  --create-if-missing Crea la sección al final si no existe');
    logger.error('');
    logger.error('Ejemplo:');
    logger.error('  ts-node update-gdoc-from-scraped-section.ts 1WePfl1tOW5NqOgV5uVrMXVKymSXZ8ilOJ_dAakZ5ZQg "../../workspaces/🌸 inspiro/⚙️ company-management/data/scraped-content/inspiro-2025-hub-interno-2025-11-10T19-44-42-429Z.md" "Nov 10, 2025"');
    logger.error('  ts-node update-gdoc-from-scraped-section.ts 1WePfl1tOW5NqOgV5uVrMXVKymSXZ8ilOJ_dAakZ5ZQg "../../workspaces/🌸 inspiro/⚙️ company-management/data/scraped-content/inspiro-2025-hub-interno-2025-11-10T19-44-42-429Z.md" "Nov 10, 2025" --dry-run');
    process.exit(1);
  }

  const fileId = args[0];
  const scrapedFile = args[1];
  const sectionTitle = args[2];
  const dryRun = args.includes('--dry-run');
  const createIfMissing = args.includes('--create-if-missing');

  if (!fs.existsSync(scrapedFile)) {
    logger.error(`Archivo scraped no encontrado: ${scrapedFile}`);
    process.exit(1);
  }

  try {
    await updateGDocSectionFromScraped(
      fileId,
      scrapedFile,
      sectionTitle,
      { dryRun, createIfMissing }
    );
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

export { updateGDocSectionFromScraped };


