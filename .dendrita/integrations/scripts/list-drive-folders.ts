/**
 * Script genérico para listar carpetas en Google Drive (solo lectura)
 * 
 * Este script busca y muestra todas las carpetas que coinciden con el nombre
 * especificado, sin guardar ninguna referencia.
 * 
 * Uso:
 *   ts-node .dendrita/integrations/scripts/list-drive-folders.ts <folder-name> [page-size]
 * 
 * Ejemplos:
 *   ts-node .dendrita/integrations/scripts/list-drive-folders.ts [folder-name]
 *   ts-node .dendrita/integrations/scripts/list-drive-folders.ts [folder-name] 50
 */

import { findDriveFolder, FolderReference } from './find-drive-folder';
import { createLogger } from '../utils/logger';

const logger = createLogger('ListDriveFolders');

/**
 * Formatea y muestra las carpetas encontradas
 */
function displayFolders(folders: FolderReference[]): void {
  if (folders.length === 0) {
    logger.info('No se encontraron carpetas');
    return;
  }

  logger.info(`\n📁 Encontradas ${folders.length} carpetas:\n`);
  
  folders.forEach((folder, index) => {
    console.log(`${index + 1}. ${folder.name}`);
    console.log(`   ID: ${folder.id}`);
    console.log(`   Enlace: ${folder.webViewLink || 'N/A'}`);
    console.log(`   Creada: ${new Date(folder.createdTime).toLocaleDateString()}`);
    console.log(`   Modificada: ${new Date(folder.modifiedTime).toLocaleDateString()}`);
    if (folder.owners && folder.owners.length > 0) {
      console.log(`   Propietario: ${folder.owners[0].emailAddress}`);
    }
    console.log('');
  });
}

/**
 * Función principal
 */
async function main(folderName: string, pageSize: number = 50): Promise<void> {
  try {
    logger.info(`=== Buscando carpetas con nombre "${folderName}" ===\n`);

    const folders = await findDriveFolder({
      folderName,
      exactMatch: false,
      pageSize,
    });

    displayFolders(folders);
  } catch (error) {
    logger.error('Error al buscar carpetas', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const folderName = process.argv[2];
  const pageSize = parseInt(process.argv[3] || '50', 10);
  
  if (!folderName) {
    logger.error('Uso: ts-node list-drive-folders.ts <folder-name> [page-size]');
    logger.error('Ejemplo: ts-node list-drive-folders.ts [folder-name]');
    logger.error('Ejemplo: ts-node list-drive-folders.ts [folder-name] 50');
    process.exit(1);
  }
  
  main(folderName, pageSize).catch((error) => {
    logger.error('Error no manejado', error);
    process.exit(1);
  });
}

export { main as listDriveFolders };

