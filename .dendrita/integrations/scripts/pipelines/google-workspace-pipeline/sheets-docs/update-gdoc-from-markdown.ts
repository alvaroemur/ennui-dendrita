#!/usr/bin/env npx ts-node
/**
 * Script para actualizar un Google Doc desde un archivo markdown local
 * Reemplaza el contenido completo del documento
 */

import { DriveService } from '../../../../services/google/drive';
import { credentials } from '../../../../utils/credentials';
import { createLogger } from '../../../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('UpdateGDocFromMarkdown');

/**
 * Convierte markdown a texto plano para Google Docs
 */
function markdownToPlainText(markdown: string): string {
  // Remover frontmatter si existe
  let text = markdown;
  if (text.startsWith('---')) {
    const frontmatterEnd = text.indexOf('---', 3);
    if (frontmatterEnd !== -1) {
      text = text.substring(frontmatterEnd + 3).trim();
    }
  }
  
  // Convertir markdown básico a texto plano
  // Remover enlaces pero mantener el texto
  text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
  
  // Remover encabezados markdown pero mantener el texto
  text = text.replace(/^#+\s+/gm, '');
  
  // Remover listas markdown pero mantener el texto
  text = text.replace(/^[-*+]\s+/gm, '');
  text = text.replace(/^\d+\.\s+/gm, '');
  
  // Remover checkboxes pero mantener el texto
  text = text.replace(/^-\s+\[[x\s]\]\s+/gm, '- ');
  
  // Limpiar espacios múltiples
  text = text.replace(/\n{3,}/g, '\n\n');
  
  return text.trim();
}

/**
 * Actualiza un Google Doc desde un archivo markdown local
 */
async function updateGDocFromMarkdown(
  fileId: string,
  markdownPath: string
): Promise<void> {
  try {
    if (!credentials.hasGoogleWorkspace()) {
      logger.error('Google Workspace no está configurado');
      return;
    }

    if (!fs.existsSync(markdownPath)) {
      throw new Error(`Archivo markdown no encontrado: ${markdownPath}`);
    }

    const drive = new DriveService();
    await drive.authenticate();
    
    const accessToken = (drive as any).accessToken;
    
    if (!accessToken) {
      logger.error('No se pudo obtener access token');
      return;
    }

    // Leer archivo markdown
    logger.info(`Leyendo archivo markdown: ${markdownPath}`);
    const markdown = fs.readFileSync(markdownPath, 'utf-8');
    
    // Convertir markdown a texto plano
    const plainText = markdownToPlainText(markdown);
    
    logger.info(`Contenido preparado: ${plainText.length} caracteres`);

    // Obtener el documento actual para obtener su estructura
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
    
    // Obtener el índice del final del documento
    // Google Docs API usa índices basados en 0, pero el documento siempre empieza con un elemento vacío
    // Necesitamos encontrar el índice real del contenido
    let endIndex = 1; // Empezar en 1 (después del primer elemento)
    if (doc.body && doc.body.content) {
      for (const element of doc.body.content) {
        if (element.paragraph) {
          for (const paraElement of element.paragraph.elements || []) {
            if (paraElement.textRun) {
              endIndex += (paraElement.textRun.content || '').length;
            }
          }
        }
      }
    }
    
    logger.info(`Documento actual tiene ${endIndex} caracteres`);
    
    // Actualizar usando batchUpdate: eliminar todo y reemplazar
    logger.info('Actualizando documento...');
    const updateUrl = `https://docs.googleapis.com/v1/documents/${fileId}:batchUpdate`;
    
    // Google Docs API: los índices son basados en 0, pero el documento tiene un elemento inicial
    // startIndex debe ser 1 (después del primer elemento) y endIndex debe ser endIndex - 1
    const requests: any[] = [
      {
        deleteContentRange: {
          range: {
            startIndex: 1, // Después del primer elemento
            endIndex: endIndex - 1, // Hasta el final (ajustado para índice basado en 0)
          },
        },
      },
      {
        insertText: {
          location: {
            index: 1, // Insertar después del primer elemento
          },
          text: plainText,
        },
      },
    ];
    
    // Validar estructura de requests
    logger.info(`Requests preparados: ${requests.length} operaciones`);
    
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

    logger.info('✅ Documento actualizado exitosamente');
  } catch (error: any) {
    logger.error('Error al actualizar Google Doc desde markdown', error);
    throw error;
  }
}

/**
 * Función principal
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    logger.error('Uso: ts-node update-gdoc-from-markdown.ts <file-id> <markdown-file>');
    logger.error('');
    logger.error('Ejemplo:');
    logger.error('  ts-node update-gdoc-from-markdown.ts 1WePfl1tOW5NqOgV5uVrMXVKymSXZ8ilOJ_dAakZ5ZQg file.md');
    process.exit(1);
  }

  const fileId = args[0];
  const markdownPath = args[1];

  try {
    await updateGDocFromMarkdown(fileId, markdownPath);
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

export { updateGDocFromMarkdown };

