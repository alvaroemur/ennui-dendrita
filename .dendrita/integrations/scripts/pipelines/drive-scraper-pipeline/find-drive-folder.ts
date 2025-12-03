/**
 * Script genérico para buscar carpetas en Google Drive
 * 
 * Este script es genérico y reutilizable. No contiene información
 * específica de ninguna empresa o proyecto.
 * 
 * Para usar este script con datos específicos, crear un script en el
 * workspace que lea la configuración y llame a estas funciones.
 */

import { DriveService } from '../../services/google/drive';
import { credentials } from '../../utils/credentials';
import { createLogger } from '../../utils/logger';

const logger = createLogger('FindDriveFolder');

export interface FolderReference {
  id: string;
  name: string;
  webViewLink?: string;
  createdTime: string;
  modifiedTime: string;
  owners?: Array<{
    displayName?: string;
    emailAddress: string;
  }>;
}

export interface SearchConfig {
  folderName: string;
  exactMatch?: boolean;
  pageSize?: number;
  ownerEmail?: string;
}

/**
 * Busca carpetas en Google Drive según la configuración proporcionada
 */
export async function findDriveFolder(config: SearchConfig): Promise<FolderReference[]> {
  try {
    // Verificar que Google está configurado
    if (!credentials.hasGoogleWorkspace()) {
      logger.error('Google Workspace no está configurado. Ver: .dendrita/docs/integrations/SETUP.md');
      return [];
    }

    const drive = new DriveService();
    
    if (!drive.isConfigured()) {
      logger.error('Google Drive no está configurado');
      return [];
    }

    await drive.authenticate();
    logger.info('Autenticado con Google Drive');

    // Construir query de búsqueda
    const folderName = config.folderName.replace(/'/g, "\\'");
    let query = `name contains '${folderName}' and mimeType = 'application/vnd.google-apps.folder'`;
    
    if (config.ownerEmail) {
      query += ` and '${config.ownerEmail}' in owners`;
    }

    logger.info(`Buscando carpetas con query: "${query}"`);
    
    const searchResults = await drive.searchFiles(
      query,
      { pageSize: config.pageSize || 20 }
    );

    logger.info(`Encontradas ${searchResults.files.length} carpetas`);

    // Convertir a FolderReference
    const folders: FolderReference[] = searchResults.files.map(file => ({
      id: file.id,
      name: file.name,
      webViewLink: file.webViewLink,
      createdTime: file.createdTime,
      modifiedTime: file.modifiedTime,
      owners: file.owners,
    }));

    // Si se requiere coincidencia exacta, filtrar
    if (config.exactMatch) {
      const exactFolders = folders.filter(f => 
        f.name.toLowerCase() === config.folderName.toLowerCase()
      );
      return exactFolders.length > 0 ? exactFolders : folders;
    }

    return folders;
  } catch (error) {
    logger.error('Error al buscar carpeta en Google Drive', error);
    return [];
  }
}

/**
 * Selecciona la mejor carpeta de una lista de resultados
 * Prioriza coincidencia exacta por nombre
 */
export function selectBestMatch(
  folders: FolderReference[],
  preferredName?: string
): FolderReference | null {
  if (folders.length === 0) {
    return null;
  }

  if (folders.length === 1) {
    return folders[0];
  }

  // Si hay un nombre preferido, buscar coincidencia exacta
  if (preferredName) {
    const exactMatch = folders.find(f => 
      f.name.toLowerCase() === preferredName.toLowerCase()
    );
    if (exactMatch) {
      return exactMatch;
    }
  }

  // Devolver la primera (más reciente por defecto)
  return folders[0];
}

/**
 * Genera un documento de referencia en formato Markdown
 */
export function generateReferenceDocument(
  folder: FolderReference,
  workspaceName: string
): string {
  const date = new Date().toISOString().split('T')[0];
  
  return `# Referencia: Carpeta de Google Drive - ${workspaceName}

**Última actualización:** ${date}

## Información de la Carpeta

- **Nombre:** ${folder.name}
- **ID de Google Drive:** \`${folder.id}\`
- **Enlace web:** ${folder.webViewLink || 'N/A'}
- **Creada:** ${new Date(folder.createdTime).toLocaleString('es-PE')}
- **Última modificación:** ${new Date(folder.modifiedTime).toLocaleString('es-PE')}
${folder.owners && folder.owners.length > 0 ? `- **Propietario:** ${folder.owners[0].emailAddress}` : ''}

## Acceso

### Enlace directo
${folder.webViewLink ? `[Abrir carpeta en Google Drive](${folder.webViewLink})` : 'Enlace no disponible'}

### Uso programático
Para acceder a esta carpeta usando el servicio de Google Drive:

\`\`\`typescript
import { DriveService } from '../../../.dendrita/integrations/services/google/drive';

const drive = new DriveService();
await drive.authenticate();

// Listar archivos en la carpeta
const files = await drive.listFilesInFolder('${folder.id}');

// Buscar archivos específicos
const searchResults = await drive.searchFiles(
  "'${folder.id}' in parents and name contains 'documento'"
);
\`\`\`

## Notas

- Esta referencia se actualiza automáticamente cuando se ejecuta el script de búsqueda del workspace
- Ver: \`.dendrita/docs/integrations/README.md\` para más información sobre el servicio de Google Drive

---
**Generado automáticamente por dendrita**
`;
}

