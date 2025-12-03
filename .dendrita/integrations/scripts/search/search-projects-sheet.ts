/**
 * Script para buscar el Sheets de proyectos de carrera en Google Drive
 */

import { DriveService } from '../services/google/drive';
import { credentials } from '../utils/credentials';
import { createLogger } from '../utils/logger';

const logger = createLogger('SearchProjectsSheet');

async function searchProjectsSheet() {
  try {
    // Verificar que Google está configurado
    if (!credentials.hasGoogleWorkspace()) {
      logger.error('Google Workspace no está configurado. Ver: .dendrita/docs/integrations/SETUP.md');
      return;
    }

    const drive = new DriveService();
    
    if (!drive.isConfigured()) {
      logger.error('Google Drive no está configurado');
      return;
    }

    await drive.authenticate();
    logger.info('Autenticado con Google Drive');

    // Buscar Sheets que contengan palabras relacionadas con proyectos y carrera
    const searchTerms = [
      'proyectos',
      'carrera',
      'histórico',
      'relación',
      'portafolio',
      'experiencia'
    ];

    const queries = [
      // Buscar Sheets con "proyectos" y "carrera"
      `mimeType = 'application/vnd.google-apps.spreadsheet' and (name contains 'proyectos' or name contains 'carrera' or name contains 'histórico' or name contains 'relación' or name contains 'portafolio' or name contains 'experiencia')`,
      // Buscar Sheets con "proyectos"
      `mimeType = 'application/vnd.google-apps.spreadsheet' and name contains 'proyectos'`,
      // Buscar Sheets con "carrera"
      `mimeType = 'application/vnd.google-apps.spreadsheet' and name contains 'carrera'`,
      // Buscar Sheets con "histórico"
      `mimeType = 'application/vnd.google-apps.spreadsheet' and name contains 'histórico'`,
      // Buscar Sheets con "portafolio"
      `mimeType = 'application/vnd.google-apps.spreadsheet' and name contains 'portafolio'`,
    ];

    const allResults: any[] = [];
    const seenIds = new Set<string>();

    for (const query of queries) {
      logger.info(`Buscando con query: "${query}"`);
      
      try {
        const results = await drive.searchFiles(query, { pageSize: 50 });
        
        for (const file of results.files) {
          if (!seenIds.has(file.id)) {
            seenIds.add(file.id);
            allResults.push(file);
          }
        }
      } catch (error) {
        logger.warn(`Error en query "${query}":`, error);
      }
    }

    logger.info(`\n=== RESULTADOS ENCONTRADOS: ${allResults.length} ===\n`);

    if (allResults.length === 0) {
      logger.info('No se encontraron Sheets que coincidan con los criterios de búsqueda.');
      logger.info('Intenta buscar manualmente en Google Drive o verifica los nombres de los archivos.');
      return;
    }

    // Ordenar por fecha de modificación (más recientes primero)
    allResults.sort((a, b) => {
      const dateA = new Date(a.modifiedTime).getTime();
      const dateB = new Date(b.modifiedTime).getTime();
      return dateB - dateA;
    });

    // Mostrar resultados
    allResults.forEach((file, index) => {
      console.log(`\n${index + 1}. ${file.name}`);
      console.log(`   ID: ${file.id}`);
      console.log(`   Enlace: ${file.webViewLink || 'N/A'}`);
      console.log(`   Modificado: ${new Date(file.modifiedTime).toLocaleString('es-ES')}`);
      console.log(`   Creado: ${new Date(file.createdTime).toLocaleString('es-ES')}`);
      if (file.size) {
        console.log(`   Tamaño: ${file.size} bytes`);
      }
    });

    // Mostrar el más probable
    if (allResults.length > 0) {
      const mostLikely = allResults[0];
      console.log(`\n\n=== MÁS PROBABLE ===`);
      console.log(`Nombre: ${mostLikely.name}`);
      console.log(`Enlace: ${mostLikely.webViewLink}`);
      console.log(`ID: ${mostLikely.id}`);
    }

  } catch (error) {
    logger.error('Error al buscar Sheets de proyectos', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  searchProjectsSheet()
    .then(() => {
      logger.info('Búsqueda completada');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Error fatal', error);
      process.exit(1);
    });
}

export { searchProjectsSheet };

