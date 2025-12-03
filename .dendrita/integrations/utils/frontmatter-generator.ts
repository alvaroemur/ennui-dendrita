/**
 * Utilidad para generar frontmatter YAML para archivos extraídos de Google Workspace
 */

import { DriveService } from '../services/google/drive';
import { createLogger } from './logger';

const logger = createLogger('FrontmatterGenerator');

export interface FrontmatterMetadata {
  title: string;
  fileId: string;
  fileType: 'google-doc' | 'google-slides' | 'google-sheet' | 'drive-file';
  webViewLink?: string;
  webContentLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  extractedAt: string;
  drivePath?: string;
  owners?: Array<{ displayName?: string; emailAddress?: string }>;
  shared?: boolean;
  size?: string;
  mimeType?: string;
  description?: string;
  parents?: string[];
}

/**
 * Construye la ruta completa de un archivo en Google Drive
 */
async function buildDrivePath(
  drive: DriveService,
  fileId: string,
  parents: string[] | undefined
): Promise<string> {
  if (!parents || parents.length === 0) {
    return '/';
  }

  try {
    const pathParts: string[] = [];
    let currentParentId = parents[parents.length - 1];

    // Construir la ruta desde el padre más cercano hasta la raíz
    while (currentParentId && currentParentId !== 'root') {
      try {
        const parentFile = await drive.getFile(currentParentId);
        pathParts.unshift(parentFile.name || currentParentId);
        
        if (parentFile.parents && parentFile.parents.length > 0) {
          currentParentId = parentFile.parents[parentFile.parents.length - 1];
        } else {
          break;
        }
      } catch (error: any) {
        logger.warn(`No se pudo obtener información de la carpeta padre ${currentParentId}: ${error?.message || error}`);
        break;
      }
    }

    // Agregar el nombre del archivo al final
    try {
      const file = await drive.getFile(fileId);
      pathParts.push(file.name || fileId);
    } catch (error: any) {
      logger.warn(`No se pudo obtener el nombre del archivo ${fileId}: ${error?.message || error}`);
    }

    return '/' + pathParts.join('/');
  } catch (error) {
    logger.error(`Error al construir la ruta de Drive para ${fileId}`, error);
    return '/';
  }
}

/**
 * Genera el frontmatter YAML para un archivo extraído
 */
export async function generateFrontmatter(
  metadata: FrontmatterMetadata,
  drive?: DriveService
): Promise<string> {
  const frontmatter: Record<string, any> = {
    title: metadata.title,
    source: {
      type: metadata.fileType,
      fileId: metadata.fileId,
      link: metadata.webViewLink || '',
    },
    extraction: {
      extractedAt: metadata.extractedAt,
    },
  };

  // Construir ruta de Drive si tenemos acceso al servicio
  if (drive && metadata.parents) {
    try {
      const drivePath = await buildDrivePath(drive, metadata.fileId, metadata.parents);
      frontmatter.source.drivePath = drivePath;
    } catch (error: any) {
      logger.warn(`No se pudo construir la ruta de Drive: ${error?.message || error}`);
    }
  }

  // Metadatos del archivo
  if (metadata.createdTime) {
    frontmatter.metadata = {
      ...(frontmatter.metadata || {}),
      createdTime: metadata.createdTime,
    };
  }

  if (metadata.modifiedTime) {
    frontmatter.metadata = {
      ...(frontmatter.metadata || {}),
      modifiedTime: metadata.modifiedTime,
    };
  }

  if (metadata.size) {
    frontmatter.metadata = {
      ...(frontmatter.metadata || {}),
      size: metadata.size,
    };
  }

  if (metadata.mimeType) {
    frontmatter.metadata = {
      ...(frontmatter.metadata || {}),
      mimeType: metadata.mimeType,
    };
  }

  if (metadata.description) {
    frontmatter.metadata = {
      ...(frontmatter.metadata || {}),
      description: metadata.description,
    };
  }

  if (metadata.owners && metadata.owners.length > 0) {
    frontmatter.metadata = {
      ...(frontmatter.metadata || {}),
      owners: metadata.owners.map(owner => ({
        name: owner.displayName,
        email: owner.emailAddress,
      })),
    };
  }

  if (metadata.shared !== undefined) {
    frontmatter.metadata = {
      ...(frontmatter.metadata || {}),
      shared: metadata.shared,
    };
  }

  // Convertir a YAML
  const yamlLines: string[] = ['---'];
  
  // Función helper para agregar valores al YAML
  const addYamlValue = (key: string, value: any, indent: number = 0): void => {
    const indentStr = '  '.repeat(indent);
    
    if (value === null || value === undefined) {
      return;
    }
    
    if (typeof value === 'string') {
      // Escapar comillas y caracteres especiales
      const escaped = value.replace(/"/g, '\\"');
      yamlLines.push(`${indentStr}${key}: "${escaped}"`);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      yamlLines.push(`${indentStr}${key}: ${value}`);
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        yamlLines.push(`${indentStr}${key}: []`);
      } else {
        yamlLines.push(`${indentStr}${key}:`);
        value.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            yamlLines.push(`${indentStr}  -`);
            Object.entries(item).forEach(([k, v]) => {
              addYamlValue(k, v, indent + 2);
            });
          } else {
            yamlLines.push(`${indentStr}  - ${item}`);
          }
        });
      }
    } else if (typeof value === 'object') {
      yamlLines.push(`${indentStr}${key}:`);
      Object.entries(value).forEach(([k, v]) => {
        addYamlValue(k, v, indent + 1);
      });
    }
  };

  // Agregar todos los campos al YAML
  Object.entries(frontmatter).forEach(([key, value]) => {
    addYamlValue(key, value, 0);
  });

  yamlLines.push('---');
  
  return yamlLines.join('\n');
}

