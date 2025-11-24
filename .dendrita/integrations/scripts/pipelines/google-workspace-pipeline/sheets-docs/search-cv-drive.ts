/**
 * Script para buscar archivos de CV o experiencia detallada en Google Drive
 */

import { DriveService } from '../../../services/google/drive';
import { credentials } from '../../../utils/credentials';
import { createLogger } from '../../../utils/logger';

const logger = createLogger('SearchCVDrive');

async function searchCVFiles(workspace?: string) {
  try {
    // Verificar que Google está configurado
    if (!credentials.hasGoogleWorkspace()) {
      logger.error('Google Workspace no está configurado. Ver: .dendrita/integrations/docs/SETUP.md');
      return;
    }

    const drive = new DriveService();
    
    if (!drive.isConfigured()) {
      logger.error('Google Drive no está configurado');
      return;
    }

    await drive.authenticate();
    logger.info('Autenticado con Google Drive');

    // Términos de búsqueda relacionados con CV y experiencia
    const searchTerms = [
      'CV',
      'curriculum',
      'experiencia',
      'consultoría',
      'historia',
      'proyectos',
      'portafolio',
      'álvaro',
      'alvaro'
    ];

    // Queries para buscar diferentes tipos de archivos
    const queries = [
      // Google Docs con términos relacionados
      `(name contains 'CV' or name contains 'curriculum' or name contains 'experiencia' or name contains 'consultoría' or name contains 'historia' or name contains 'proyectos' or name contains 'portafolio') and (mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/vnd.google-apps.spreadsheet')`,
      // PDFs con términos relacionados
      `(name contains 'CV' or name contains 'curriculum' or name contains 'experiencia' or name contains 'consultoría' or name contains 'historia' or name contains 'proyectos' or name contains 'portafolio') and mimeType = 'application/pdf'`,
      // Archivos que contengan "álvaro" o "alvaro" en el nombre
      `(name contains 'álvaro' or name contains 'alvaro') and (mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType = 'application/pdf')`,
    ];

    const allResults: any[] = [];
    const seenIds = new Set<string>();

    for (const query of queries) {
      logger.info(`Buscando con query: ${query}`);
      
      try {
        const results = await drive.searchFiles(query, { pageSize: 50 });
        
        for (const file of results.files) {
          if (!seenIds.has(file.id)) {
            seenIds.add(file.id);
            allResults.push(file);
          }
        }
      } catch (error: any) {
        logger.error(`Error en query "${query}":`, error.message);
      }
    }

    logger.info(`\n=== RESULTADOS ENCONTRADOS: ${allResults.length} archivos ===\n`);

    // Mostrar resultados
    for (const file of allResults) {
      console.log(`📄 ${file.name}`);
      console.log(`   ID: ${file.id}`);
      console.log(`   Tipo: ${file.mimeType}`);
      console.log(`   Enlace: ${file.webViewLink || 'N/A'}`);
      console.log(`   Modificado: ${file.modifiedTime || 'N/A'}`);
      console.log(`   Propietarios: ${file.owners?.map((o: any) => o.displayName || o.emailAddress).join(', ') || 'N/A'}`);
      console.log('');
    }

    // Guardar resultados en un archivo JSON
    const fs = require('fs');
    const path = require('path');
    
    if (!workspace) {
      logger.warn('⚠️  No se especificó workspace, guardando en directorio actual');
      const outputPath = path.join(process.cwd(), 'cv-search-results.json');
      fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2));
      logger.info(`\n✅ Resultados guardados en: ${outputPath}`);
    } else {
      // Encontrar directorio del workspace (puede tener emojis)
      const projectRoot = path.resolve(__dirname, '../../../../..');
      const workspacesDir = path.join(projectRoot, 'workspaces');
      
      if (!fs.existsSync(workspacesDir)) {
        logger.warn(`⚠️  Directorio de workspaces no encontrado, guardando en directorio actual`);
        const outputPath = path.join(process.cwd(), 'cv-search-results.json');
        fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2));
        logger.info(`\n✅ Resultados guardados en: ${outputPath}`);
      } else {
        const entries = fs.readdirSync(workspacesDir, { withFileTypes: true });
        let workspaceDir: string | null = null;
        
        // Buscar coincidencia exacta primero
        for (const entry of entries) {
          if (entry.isDirectory() && entry.name === workspace) {
            workspaceDir = entry.name;
            break;
          }
        }

        // Buscar coincidencia parcial (sin emojis)
        if (!workspaceDir) {
          const normalizedName = workspace.toLowerCase().replace(/[^\w\s]/g, '').trim();
          for (const entry of entries) {
            if (entry.isDirectory()) {
              const normalizedEntry = entry.name.toLowerCase().replace(/[^\w\s]/g, '').trim();
              if (normalizedEntry === normalizedName || normalizedEntry.includes(normalizedName) || normalizedName.includes(normalizedEntry)) {
                workspaceDir = entry.name;
                break;
              }
            }
          }
        }

        if (workspaceDir) {
          const outputPath = path.join(projectRoot, 'workspaces', workspaceDir, '⚙️ company-management', 'data', 'cv-search-results.json');
          // Crear directorio si no existe
          const outputDir = path.dirname(outputPath);
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }
          fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2));
          logger.info(`\n✅ Resultados guardados en: ${outputPath}`);
        } else {
          logger.warn(`⚠️  Workspace "${workspace}" no encontrado, guardando en directorio actual`);
          const outputPath = path.join(process.cwd(), 'cv-search-results.json');
          fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2));
          logger.info(`\n✅ Resultados guardados en: ${outputPath}`);
        }
      }
    }

    return allResults;
  } catch (error: any) {
    logger.error('Error al buscar archivos de CV en Google Drive', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const args = process.argv.slice(2);
  let workspace: string | undefined;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--workspace' && i + 1 < args.length) {
      workspace = args[i + 1];
      break;
    }
  }
  
  searchCVFiles(workspace)
    .then(() => {
      logger.info('Búsqueda completada');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Error fatal', error);
      process.exit(1);
    });
}

export { searchCVFiles };
