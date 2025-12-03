/**
 * Script genérico para buscar carpetas en Google Drive y generar referencias
 * 
 * Este script lee la configuración desde un workspace y genera el documento
 * de referencia automáticamente.
 * 
 * Uso:
 *   ts-node .dendrita/integrations/scripts/sync-drive-folder-reference.ts <workspace-path>
 * 
 * Ejemplo:
 *   ts-node .dendrita/integrations/scripts/sync-drive-folder-reference.ts workspaces/[workspace-name]/company-management
 */

import * as fs from 'fs';
import * as path from 'path';
import { 
  findDriveFolder, 
  selectBestMatch, 
  generateReferenceDocument,
  FolderReference 
} from './find-drive-folder';
import { DriveService } from '../services/google/drive';
import { createLogger } from '../utils/logger';

const logger = createLogger('SyncDriveFolderReference');

interface SearchConfig {
  folderName: string;
  exactMatch?: boolean;
  pageSize?: number;
  ownerEmail?: string;
}

interface OutputConfig {
  referenceFile: string;
  workspaceName: string;
}

interface DriveFolderConfig {
  folderId?: string;
  folderName?: string;
  parentFolderId?: string;
  parentFolderName?: string;
  search: SearchConfig;
  output: OutputConfig;
}

/**
 * Carga la configuración desde el archivo JSON del workspace
 */
function loadConfig(workspacePath: string): DriveFolderConfig {
  const configPath = path.join(workspacePath, 'drive-folder-config.json');
  
  if (!fs.existsSync(configPath)) {
    throw new Error(`Archivo de configuración no encontrado: ${configPath}`);
  }

  const configContent = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(configContent);
}

/**
 * Guarda el documento de referencia en el workspace
 */
function saveReferenceDocument(
  workspacePath: string,
  content: string,
  filename: string
): void {
  const outputPath = path.join(workspacePath, filename);
  fs.writeFileSync(outputPath, content, 'utf-8');
  logger.info(`Referencia guardada en: ${outputPath}`);
}

/**
 * Función principal
 */
async function main(workspacePath: string): Promise<void> {
  try {
    // Resolver path absoluto
    const projectRoot = path.resolve(__dirname, '../../..');
    const fullWorkspacePath = path.isAbsolute(workspacePath) 
      ? workspacePath 
      : path.join(projectRoot, workspacePath);

    logger.info(`=== Sincronizando referencia de Google Drive ===\n`);
    logger.info(`Workspace: ${fullWorkspacePath}\n`);

    // Cargar configuración
    const config = loadConfig(fullWorkspacePath);
    
    let selectedFolder: FolderReference | null = null;

    // Si hay folderId en la configuración, usar directamente
    if (config.folderId) {
      logger.info(`Configuración cargada: usando carpeta ID "${config.folderId}"`);
      
      const drive = new DriveService();
      await drive.authenticate();
      
      const folder = await drive.getFile(config.folderId);
      selectedFolder = {
        id: folder.id,
        name: folder.name,
        webViewLink: folder.webViewLink,
        createdTime: folder.createdTime,
        modifiedTime: folder.modifiedTime,
        owners: folder.owners,
      };
      
      logger.info(`✅ Carpeta encontrada: ${selectedFolder.name} (${selectedFolder.id})`);
    } else {
      // Buscar carpetas usando la configuración de búsqueda
      logger.info(`Configuración cargada: buscando carpeta "${config.search.folderName}"`);
      
      const folders = await findDriveFolder(config.search);

      if (folders.length === 0) {
        logger.error('\n❌ No se encontraron carpetas');
        logger.info('Verifica que:');
        logger.info('1. Las credenciales de Google Workspace estén configuradas en .dendrita/.env.local');
        logger.info('2. La carpeta existe en tu Google Drive');
        logger.info('3. Tienes permisos para acceder a la carpeta');
        process.exit(1);
      }

      // Mostrar todas las carpetas encontradas
      logger.info(`\n📁 Encontradas ${folders.length} carpetas:`);
      folders.forEach((folder, index) => {
        logger.info(`\n${index + 1}. ${folder.name}`);
        logger.info(`   ID: ${folder.id}`);
        logger.info(`   Enlace: ${folder.webViewLink || 'N/A'}`);
        logger.info(`   Creada: ${new Date(folder.createdTime).toLocaleDateString()}`);
        if (folder.owners && folder.owners.length > 0) {
          logger.info(`   Propietario: ${folder.owners[0].emailAddress}`);
        }
      });

      // Seleccionar la mejor coincidencia
      selectedFolder = selectBestMatch(folders, config.search.folderName);
    }

    if (!selectedFolder) {
      logger.error('No se pudo seleccionar ninguna carpeta');
      process.exit(1);
    }

    logger.info(`\n✅ Carpeta seleccionada: ${selectedFolder.name} (${selectedFolder.id})`);

    // Generar y guardar documento de referencia
    const referenceContent = generateReferenceDocument(
      selectedFolder,
      config.output.workspaceName
    );

    saveReferenceDocument(fullWorkspacePath, referenceContent, config.output.referenceFile);

    logger.info(`\n📄 Referencia generada exitosamente`);
  } catch (error) {
    logger.error('Error fatal', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const workspacePath = process.argv[2];
  
  if (!workspacePath) {
    logger.error('Uso: ts-node sync-drive-folder-reference.ts <workspace-path>');
    logger.error('Ejemplo: ts-node sync-drive-folder-reference.ts workspaces/[workspace-name]/company-management');
    process.exit(1);
  }

  main(workspacePath).catch((error) => {
    logger.error('Error no manejado', error);
    process.exit(1);
  });
}

export { main as syncDriveFolderReference };

