#!/usr/bin/env npx ts-node
/**
 * Script para actualizar una sección específica de un Google Doc
 * Busca la sección por título y reemplaza su contenido
 */

import { DriveService } from '../../../../services/google/drive';
import { credentials } from '../../../../utils/credentials';
import { createLogger } from '../../../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('UpdateGDocSection');

/**
 * Encuentra el índice de inicio de una sección en el documento
 */
function findSectionIndex(doc: any, sectionTitle: string): number | null {
  if (!doc.body || !doc.body.content) {
    return null;
  }

  let currentIndex = 1; // Empezar después del primer elemento (índice 0)
  
  for (const element of doc.body.content) {
    if (element.paragraph) {
      let text = '';
      for (const paraElement of element.paragraph.elements || []) {
        if (paraElement.textRun) {
          text += paraElement.textRun.content || '';
        }
      }
      
      // Buscar el título de la sección
      if (text.includes(sectionTitle)) {
        return currentIndex;
      }
    }
    
    // Incrementar índice basado en el tamaño del elemento
    if (element.paragraph) {
      for (const paraElement of element.paragraph.elements || []) {
        if (paraElement.textRun) {
          currentIndex += (paraElement.textRun.content || '').length;
        }
      }
    }
  }
  
  return null;
}

/**
 * Encuentra el índice de fin de una sección (hasta la siguiente sección o fin del documento)
 */
function findSectionEndIndex(doc: any, startIndex: number): number {
  if (!doc.body || !doc.body.content) {
    return startIndex;
  }

  let currentIndex = 1;
  let foundStart = false;
  
  for (const element of doc.body.content) {
    if (element.paragraph) {
      let text = '';
      for (const paraElement of element.paragraph.elements || []) {
        if (paraElement.textRun) {
          text += paraElement.textRun.content || '';
        }
      }
      
      // Si encontramos el inicio, buscar el siguiente título de sección (##)
      if (foundStart && text.trim().startsWith('##')) {
        return currentIndex;
      }
      
      if (currentIndex >= startIndex && !foundStart) {
        foundStart = true;
      }
    }
    
    // Incrementar índice
    if (element.paragraph) {
      for (const paraElement of element.paragraph.elements || []) {
        if (paraElement.textRun) {
          currentIndex += (paraElement.textRun.content || '').length;
        }
      }
    }
  }
  
  return currentIndex;
}

/**
 * Actualiza una sección específica de un Google Doc
 */
async function updateGDocSection(
  fileId: string,
  sectionTitle: string,
  newContent: string
): Promise<void> {
  try {
    if (!credentials.hasGoogleWorkspace()) {
      logger.error('Google Workspace no está configurado');
      return;
    }

    const drive = new DriveService();
    await drive.authenticate();
    
    const accessToken = (drive as any).accessToken;
    
    if (!accessToken) {
      logger.error('No se pudo obtener access token');
      return;
    }

    // Paso 1: Obtener el documento completo
    logger.info(`Obteniendo documento: ${fileId}`);
    const docUrl = `https://docs.googleapis.com/v1/documents/${fileId}`;
    const docResponse = await fetch(docUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!docResponse.ok) {
      const errorText = await docResponse.text();
      throw new Error(`Google Docs API error: ${docResponse.status} - ${errorText}`);
    }

    const doc = await docResponse.json();
    
    // Paso 2: Encontrar la sección
    logger.info(`Buscando sección: ${sectionTitle}`);
    
    // Buscar la sección usando el contenido del documento
    let startIndex: number | null = null;
    let endIndex: number | null = null;
    
    // Obtener el texto completo del documento para buscar
    let fullText = '';
    let charIndex = 1; // Los índices en Google Docs API empiezan en 1
    
    // Mapear índices de caracteres a elementos del documento
    const charToElementMap: Array<{ index: number; element: any }> = [];
    
    for (const element of doc.body.content) {
      if (element.paragraph) {
        for (const paraElement of element.paragraph.elements || []) {
          if (paraElement.textRun) {
            const text = paraElement.textRun.content || '';
            fullText += text;
            
            // Guardar mapeo de índices
            for (let i = 0; i < text.length; i++) {
              charToElementMap.push({ index: charIndex + i, element });
            }
            
            charIndex += text.length;
          }
        }
      }
    }
    
    logger.info(`Documento completo: ${fullText.length} caracteres`);
    logger.info(`Primeros 500 caracteres: ${fullText.substring(0, 500)}`);
    
    // Buscar el inicio de la sección
    const searchTitle = sectionTitle;
    const titleIndex = fullText.indexOf(searchTitle);
    
    if (titleIndex !== -1) {
      startIndex = titleIndex + 1; // Google Docs API usa índices basados en 1
      logger.info(`Sección encontrada en índice: ${startIndex}`);
    }
    
    if (!startIndex) {
      logger.warn(`No se encontró la sección: ${sectionTitle}`);
      logger.info('Intentando buscar variaciones...');
      
      // Intentar variaciones
      const variations = [
        sectionTitle.replace('Nov 10', '10 nov'),
        sectionTitle.replace('10 nov', 'Nov 10'),
        sectionTitle.toLowerCase(),
        sectionTitle.toUpperCase(),
        'Nov 10, 2025',
        '10 nov 2025',
        'Nov 10',
        '10 nov',
        'Inspiro check-in',
      ];
      
      for (const variation of variations) {
        const index = fullText.indexOf(variation);
        if (index !== -1) {
          startIndex = index + 1;
          logger.info(`Sección encontrada con variación: ${variation}`);
          break;
        }
      }
    }
    
    if (!startIndex) {
      throw new Error(`No se pudo encontrar la sección: ${sectionTitle}`);
    }
    
    // Encontrar el fin de la sección (siguiente ## o fin del documento)
    const sectionStartText = fullText.substring(startIndex - 1);
    const nextSectionMatch = sectionStartText.match(/\n## /);
    if (nextSectionMatch) {
      endIndex = startIndex + nextSectionMatch.index!;
    } else {
      // Si no hay siguiente sección, usar el fin del documento
      endIndex = fullText.length;
    }
    
    logger.info(`Sección encontrada: índices ${startIndex} - ${endIndex}`);
    
    // Paso 3: Preparar el contenido nuevo
    // El contenido debe incluir el título de la sección
    const contentToInsert = `${sectionTitle}\n\n${newContent}`;
    
    // Paso 4: Actualizar usando batchUpdate
    logger.info('Actualizando sección...');
    const updateUrl = `https://docs.googleapis.com/v1/documents/${fileId}:batchUpdate`;
    
    const requests = [
      {
        deleteContent: {
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
          text: contentToInsert,
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
      throw new Error(`Google Docs API error: ${updateResponse.status} - ${errorText}`);
    }

    logger.info('✅ Sección actualizada exitosamente');
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
    logger.error('Uso: ts-node update-gdoc-section.ts <file-id> <section-title> <content-file>');
    logger.error('');
    logger.error('Ejemplo:');
    logger.error('  ts-node update-gdoc-section.ts 1WePfl1tOW5NqOgV5uVrMXVKymSXZ8ilOJ_dAakZ5ZQg "Nov 10, 2025" content.txt');
    process.exit(1);
  }

  const fileId = args[0];
  const sectionTitle = args[1];
  const contentFile = args[2];

  if (!fs.existsSync(contentFile)) {
    logger.error(`Archivo de contenido no encontrado: ${contentFile}`);
    process.exit(1);
  }

  const newContent = fs.readFileSync(contentFile, 'utf-8');

  try {
    await updateGDocSection(fileId, sectionTitle, newContent);
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

export { updateGDocSection };

