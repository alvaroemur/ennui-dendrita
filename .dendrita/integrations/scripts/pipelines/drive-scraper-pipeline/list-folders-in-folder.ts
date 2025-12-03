/**
 * Script genérico para listar carpetas dentro de una carpeta específica en Google Drive
 * 
 * Uso:
 *   ts-node .dendrita/integrations/scripts/list-folders-in-folder.ts <parent-folder-id> <folder-name>
 * 
 * Ejemplo:
 *   ts-node .dendrita/integrations/scripts/list-folders-in-folder.ts 0B5MZCWjdw2uaZXVhX3lBTnc5RjQ inspiro
 */

import { DriveService } from '../../services/google/drive';
import { credentials } from '../../utils/credentials';
import { createLogger } from '../../utils/logger';

const logger = createLogger('ListFoldersInFolder');

async function main(parentFolderId: string, folderName?: string): Promise<void> {
  try {
    if (!credentials.hasGoogleWorkspace()) {
      logger.error('Google Workspace no está configurado');
      process.exit(1);
    }

    const drive = new DriveService();
    await drive.authenticate();

    logger.info(`=== Buscando carpetas dentro de la carpeta ${parentFolderId} ===\n`);

    // Construir query
    let query = `'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder'`;
    
    if (folderName) {
      const safeName = folderName.replace(/'/g, "\\'");
      query += ` and name contains '${safeName}'`;
      logger.info(`Buscando carpetas con nombre "${folderName}"`);
    }

    const searchResults = await drive.searchFiles(query, { pageSize: 50 });

    if (searchResults.files.length === 0) {
      logger.info('No se encontraron carpetas');
      return;
    }

    logger.info(`\n📁 Encontradas ${searchResults.files.length} carpetas:\n`);

    searchResults.files.forEach((folder, index) => {
      console.log(`${index + 1}. ${folder.name}`);
      console.log(`   ID: ${folder.id}`);
      console.log(`   Enlace: ${folder.webViewLink || 'N/A'}`);
      if (folder.createdTime) {
        console.log(`   Creada: ${new Date(folder.createdTime).toLocaleDateString()}`);
      }
      if (folder.modifiedTime) {
        console.log(`   Modificada: ${new Date(folder.modifiedTime).toLocaleDateString()}`);
      }
      if (folder.owners && folder.owners.length > 0) {
        console.log(`   Propietario: ${folder.owners[0].emailAddress}`);
      }
      console.log('');
    });
  } catch (error) {
    logger.error('Error al buscar carpetas', error);
    process.exit(1);
  }
}

if (require.main === module) {
  const parentFolderId = process.argv[2];
  const folderName = process.argv[3];

  if (!parentFolderId) {
    logger.error('Uso: ts-node list-folders-in-folder.ts <parent-folder-id> [folder-name]');
    logger.error('Ejemplo: ts-node list-folders-in-folder.ts 0B5MZCWjdw2uaZXVhX3lBTnc5RjQ inspiro');
    process.exit(1);
  }

  main(parentFolderId, folderName).catch((error) => {
    logger.error('Error no manejado', error);
    process.exit(1);
  });
}

export { main };

