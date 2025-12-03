/**
 * Script para obtener información de una carpeta específica en Google Drive
 * 
 * Uso:
 *   ts-node check-folder-info.ts <folder-id>
 */

import { DriveService } from '../services/google/drive';
import { credentials } from '../utils/credentials';
import { createLogger } from '../utils/logger';

const logger = createLogger('CheckFolderInfo');

async function main(folderId: string): Promise<void> {
  try {
    if (!credentials.hasGoogleWorkspace()) {
      logger.error('Google Workspace no está configurado');
      process.exit(1);
    }

    const drive = new DriveService();
    await drive.authenticate();

    logger.info(`=== Obteniendo información de la carpeta ${folderId} ===\n`);

    const file = await drive.getFile(folderId, 'id, name, mimeType, createdTime, modifiedTime, webViewLink, parents, owners, shared');

    console.log('📁 Información de la carpeta:');
    console.log(`   Nombre: ${file.name}`);
    console.log(`   ID: ${file.id}`);
    console.log(`   Tipo: ${file.mimeType}`);
    console.log(`   Enlace: ${file.webViewLink || 'N/A'}`);
    if (file.createdTime) {
      console.log(`   Creada: ${new Date(file.createdTime).toLocaleString()}`);
    }
    if (file.modifiedTime) {
      console.log(`   Modificada: ${new Date(file.modifiedTime).toLocaleString()}`);
    }
    if (file.owners && file.owners.length > 0) {
      console.log(`   Propietario: ${file.owners[0].emailAddress}`);
    }
    console.log(`   Compartida: ${file.shared ? 'Sí' : 'No'}`);
    
    if (file.parents && file.parents.length > 0) {
      console.log(`\n📂 Carpeta(s) padre:`);
      for (const parentId of file.parents) {
        try {
          const parent = await drive.getFile(parentId, 'id, name, webViewLink');
          console.log(`   - ${parent.name} (ID: ${parent.id})`);
          console.log(`     ${parent.webViewLink || 'N/A'}`);
        } catch (error) {
          console.log(`   - ID: ${parentId} (no se pudo obtener nombre)`);
        }
      }
    } else {
      console.log(`\n📂 Carpeta raíz (sin padre)`);
    }

    // Listar contenido de la carpeta
    console.log(`\n📋 Contenido de la carpeta:`);
    const files = await drive.listFilesInFolder(folderId, { pageSize: 10 });
    console.log(`   Total de items: ${files.files.length}${files.nextPageToken ? ' (hay más...)' : ''}`);
    
    if (files.files.length > 0) {
      console.log(`\n   Primeros items:`);
      files.files.slice(0, 10).forEach((item, index) => {
        const isFolder = item.mimeType === 'application/vnd.google-apps.folder';
        console.log(`   ${index + 1}. ${isFolder ? '📁' : '📄'} ${item.name}`);
        if (item.size) {
          const sizeMB = (parseInt(item.size) / (1024 * 1024)).toFixed(2);
          console.log(`      Tamaño: ${sizeMB} MB`);
        }
      });
    }

  } catch (error) {
    logger.error('Error al obtener información de la carpeta', error);
    process.exit(1);
  }
}

if (require.main === module) {
  const folderId = process.argv[2];

  if (!folderId) {
    logger.error('Uso: ts-node check-folder-info.ts <folder-id>');
    logger.error('Ejemplo: ts-node check-folder-info.ts 15uOoZyMwqILOCMOcqN4ZOsjvO14wLqic');
    process.exit(1);
  }

  main(folderId).catch((error) => {
    logger.error('Error no manejado', error);
    process.exit(1);
  });
}

export { main };

