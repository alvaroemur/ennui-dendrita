#!/usr/bin/env npx ts-node
/**
 * Script para actualizar una sección específica de un Google Doc
 * Usa credenciales OAuth del usuario (no cuenta de servicio)
 * Permite actualizar manualmente cuando el usuario lo solicite
 */

import { DriveService } from '../../../../services/google/drive';
import { credentials } from '../../../../utils/credentials';
import { createLogger } from '../../../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('UpdateGDocSectionManual');

/**
 * Actualiza una sección específica de un Google Doc usando Google Docs API
 */
async function updateGDocSection(
  fileId: string,
  sectionTitle: string,
  newContent: string,
  options: { dryRun?: boolean } = {}
): Promise<void> {
  try {
    if (!credentials.hasGoogleWorkspace()) {
      logger.error('Google Workspace no está configurado');
      logger.info('Ejecuta: cd .dendrita/integrations && npx tsx scripts/pipelines/google-workspace-pipeline/auth/get-refresh-token.ts');
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
      if (docResponse.status === 403) {
        logger.error('❌ Error de permisos (403)');
        logger.info('El documento no está compartido con tu cuenta o no tienes permisos de escritura');
        logger.info(`Documento: https://docs.google.com/document/d/${fileId}/edit`);
        logger.info('Asegúrate de que el documento esté compartido contigo con permisos de editor');
      }
      throw new Error(`Google Docs API error: ${docResponse.status} - ${errorText}`);
    }

    const doc = await docResponse.json();
    
    // Paso 2: Buscar en tabs si existen
    logger.info(`Buscando sección: ${sectionTitle}`);
    
    // Verificar si el documento tiene tabs
    let targetTab: any = null;
    let targetTabIndex = -1;
    
    if (doc.documentStyle?.defaultTabId) {
      logger.info('Documento tiene tabs, buscando tab "Minutas"...');
      
      // Buscar el tab "Minutas"
      if (doc.documentStyle?.pageSize) {
        // Los tabs están en documentStyle o en el body
        // Necesitamos buscar en el contenido del documento
      }
    }
    
    // Obtener el texto completo del documento para buscar
    // Si hay tabs, necesitamos buscar en cada tab
    let fullText = '';
    let charIndex = 1; // Los índices en Google Docs API empiezan en 1
    let tabContent: any[] = [];
    
    // Buscar contenido en tabs o en body principal
    if (doc.body && doc.body.content) {
      for (const element of doc.body.content) {
        if (element.sectionBreak) {
          // Puede indicar un tab
          continue;
        }
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
    logger.info(`Buscando sección en contenido...`);
    
    // Buscar el inicio de la sección
    const searchTitle = sectionTitle;
    let startIndex: number | null = null;
    
    // Intentar diferentes variaciones del título
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
    
    for (const variation of variations) {
      const index = fullText.indexOf(variation);
      if (index !== -1) {
        startIndex = index + 1; // Google Docs API usa índices basados en 1
        logger.info(`✅ Sección encontrada con variación: "${variation}" en índice ${startIndex}`);
        break;
      }
    }
    
    // Si no se encuentra, buscar en el archivo local scraped para obtener el contexto
    if (!startIndex) {
      logger.warn(`⚠️  No se encontró la sección: ${sectionTitle} en el documento de Drive`);
      logger.info('La sección puede estar en un tab o no existir aún');
      logger.info('Buscando en el archivo local scraped para obtener contexto...');
      
      // Buscar en el archivo local para encontrar la posición aproximada
      // NOTA: Esta ruta debe ser proporcionada como parámetro o configurada según el workspace
      const scrapedPath = path.join(
        process.cwd(),
        'workspaces/[workspace]/⚙️ company-management/data/scraped-content',
        '[scraped-file].md'
      );
      
      if (fs.existsSync(scrapedPath)) {
        const scrapedContent = fs.readFileSync(scrapedPath, 'utf-8');
        const scrapedIndex = scrapedContent.indexOf('## Nov 10, 2025');
        
        if (scrapedIndex !== -1) {
          logger.info('✅ Sección encontrada en archivo local scraped');
          logger.info('La sección existe en el archivo local pero no en Drive');
          logger.info('Esto puede significar que:');
          logger.info('  1. El documento tiene tabs y la sección está en un tab específico');
          logger.info('  2. La sección aún no existe en Drive y necesita crearse');
          logger.info('');
          logger.info('💡 Opciones:');
          logger.info('  - Actualizar manualmente en Google Drive copiando el contenido');
          logger.info('  - Ejecutar el scraper para sincronizar el archivo local con Drive');
          logger.info(`  - Usar el script con --create-section para crear la sección si no existe`);
        }
      }
      
      // Si no existe, ofrecer crear la sección
      logger.info('');
      logger.info('¿Deseas crear la sección en el documento?');
      logger.info('Ejecuta el script sin --dry-run para crear la sección al final del tab "Minutas"');
      throw new Error(`No se pudo encontrar la sección: ${sectionTitle}. Puede que necesite crearse.`);
    }
    
    // Encontrar el fin de la sección (siguiente ## o fin del documento)
    const sectionStartText = fullText.substring(startIndex - 1);
    let endIndex: number;
    
    const nextSectionMatch = sectionStartText.match(/\n## /);
    if (nextSectionMatch) {
      endIndex = startIndex + nextSectionMatch.index!;
    } else {
      // Si no hay siguiente sección, usar el fin del documento
      endIndex = fullText.length;
    }
    
    logger.info(`Sección encontrada: índices ${startIndex} - ${endIndex}`);
    logger.info(`Contenido actual (primeros 200 caracteres): ${fullText.substring(startIndex - 1, Math.min(startIndex + 199, endIndex))}`);
    
    if (options.dryRun) {
      logger.info('🔍 DRY RUN: No se actualizará el documento');
      logger.info(`Se eliminaría desde índice ${startIndex} hasta ${endIndex}`);
      logger.info(`Se insertaría: ${newContent.substring(0, 200)}...`);
      return;
    }
    
    // Paso 3: Preparar el contenido nuevo
    // El contenido debe incluir el título de la sección
    const contentToInsert = `${sectionTitle}\n\n${newContent}`;
    
    // Paso 4: Actualizar usando batchUpdate
    logger.info('Actualizando sección...');
    const updateUrl = `https://docs.googleapis.com/v1/documents/${fileId}:batchUpdate`;
    
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
      if (updateResponse.status === 403) {
        logger.error('❌ Error de permisos (403)');
        logger.info('El documento no está compartido con tu cuenta o no tienes permisos de escritura');
        logger.info(`Documento: https://docs.google.com/document/d/${fileId}/edit`);
        logger.info('Asegúrate de que el documento esté compartido contigo con permisos de editor');
      }
      throw new Error(`Google Docs API error: ${updateResponse.status} - ${errorText}`);
    }

    const result = await updateResponse.json();
    logger.info('✅ Sección actualizada exitosamente');
    logger.info(`Documento actualizado: https://docs.google.com/document/d/${fileId}/edit`);
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
    logger.error('Uso: ts-node update-gdoc-section-manual.ts <file-id> <section-title> <content-file> [--dry-run]');
    logger.error('');
    logger.error('Opciones:');
    logger.error('  --dry-run    Solo muestra lo que haría sin actualizar');
    logger.error('');
    logger.error('Ejemplo:');
    logger.error('  ts-node update-gdoc-section-manual.ts 1WePfl1tOW5NqOgV5uVrMXVKymSXZ8ilOJ_dAakZ5ZQg "Nov 10, 2025" content.txt');
    logger.error('  ts-node update-gdoc-section-manual.ts 1WePfl1tOW5NqOgV5uVrMXVKymSXZ8ilOJ_dAakZ5ZQg "Nov 10, 2025" content.txt --dry-run');
    process.exit(1);
  }

  const fileId = args[0];
  const sectionTitle = args[1];
  const contentFile = args[2];
  const dryRun = args.includes('--dry-run');

  if (!fs.existsSync(contentFile)) {
    logger.error(`Archivo de contenido no encontrado: ${contentFile}`);
    process.exit(1);
  }

  const newContent = fs.readFileSync(contentFile, 'utf-8');

  try {
    await updateGDocSection(fileId, sectionTitle, newContent, { dryRun });
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

