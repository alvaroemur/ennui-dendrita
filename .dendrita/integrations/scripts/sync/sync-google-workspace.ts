/**
 * Script general de sincronización de Google Workspace
 * Sincroniza Sheets, Docs, Drive y otros archivos de Google
 * Configurable para diferentes fuentes y destinos
 */

import { GoogleAuth } from '../services/google/auth';
import { DriveService } from '../services/google/drive';
import { credentials } from '../utils/credentials';
import { createLogger } from '../utils/logger';
import { generateScrapeSignature, insertSignature } from '../utils/wikilink-signature';
import { trackFileModification } from '../utils/file-tracking';
import { updateBacklinksFromContent } from '../utils/backlinks';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('SyncGoogleWorkspace');

// Tipos de sincronización
export type SyncType = 'sheets' | 'docs' | 'drive' | 'all';
export type OutputFormat = 'markdown' | 'json' | 'both';

// Configuración de sincronización
export interface SyncConfig {
  type: SyncType;
  source: {
    fileId?: string; // ID específico de archivo
    folderId?: string; // ID de carpeta
    query?: string; // Query de búsqueda
    name?: string; // Nombre del archivo
    sheetName?: string; // Nombre de la hoja (para Sheets)
  };
  destination: {
    path: string; // Ruta de destino
    format?: OutputFormat; // Formato de salida
    filename?: string; // Nombre del archivo de salida
  };
  options?: {
    extractContent?: boolean; // Extraer contenido
    extractMetadata?: boolean; // Extraer metadatos
    updateExisting?: boolean; // Actualizar archivos existentes
    customProcessor?: string; // Nombre del procesador personalizado
  };
}

// Cargar configuraciones desde archivo
function loadSyncConfigs(): Record<string, SyncConfig> {
  const configPath = path.join(process.cwd(), '.dendrita', 'integrations', 'config', 'sync-config.json');
  
  if (fs.existsSync(configPath)) {
    try {
      const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const configs: Record<string, SyncConfig> = {};
      
      if (configData.syncs && Array.isArray(configData.syncs)) {
        for (const sync of configData.syncs) {
          if (sync.enabled !== false) {
            configs[sync.name] = {
              type: sync.type as SyncType,
              source: {
                fileId: sync.source?.fileId,
                folderId: sync.source?.folderId,
                query: sync.source?.query,
                name: sync.source?.name,
                sheetName: sync.source?.sheetName,
              },
              destination: {
                path: sync.destination?.path || 'workspaces/personal/sync',
                format: (sync.destination?.format as OutputFormat) || configData.defaults?.format || 'markdown',
                filename: sync.destination?.filename,
              },
              options: {
                extractContent: sync.options?.extractContent ?? configData.defaults?.extractContent ?? true,
                extractMetadata: sync.options?.extractMetadata ?? configData.defaults?.extractMetadata ?? true,
                updateExisting: sync.options?.updateExisting ?? configData.defaults?.updateExisting ?? true,
                ...sync.options,
              },
            };
          }
        }
      }
      
      return configs;
    } catch (error) {
      logger.error('Error cargando configuraciones', error);
      return {};
    }
  }
  
  return {};
}

const PREDEFINED_CONFIGS = loadSyncConfigs();

/**
 * Sincronizar un Google Sheet
 */
async function syncSheet(config: SyncConfig, accessToken: string): Promise<void> {
  if (!config.source.fileId) {
    throw new Error('fileId es requerido para sincronizar Sheets');
  }

  logger.info(`Sincronizando Sheet: ${config.source.name || config.source.fileId}`);

  // Verificar si hay un procesador personalizado
  if (config.options?.customProcessor === 'sync-experience-from-sheets') {
    // Usar el script específico de experiencia
    const { syncExperienceFromSheets } = await import('./sync-experience-from-sheets');
    await syncExperienceFromSheets();
    return;
  }

  // Obtener datos del Sheet
  const sheetName = (config.source as any).sheetName || 'Sheet1'; // Por defecto
  const valuesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.source.fileId}/values/${sheetName}?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`;
  const response = await fetch(valuesUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Sheets API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const values = data.values || [];

  if (values.length === 0) {
    logger.warn('No se encontraron datos en el Sheet');
    return;
  }

  const headers = values[0];
  const rows = values.slice(1);

  logger.info(`Headers: ${headers.length}, Filas: ${rows.length}`);

  // Procesar datos
  const projects = rows.map((row: any[]) => {
    const project: any = {};
    headers.forEach((header: string, colIndex: number) => {
      project[header] = row[colIndex] || null;
    });
    return project;
  });

  // Generar contenido según formato
  if (config.destination.format === 'markdown' || config.destination.format === 'both') {
    await generateSheetMarkdown(projects, headers, config);
  }

  if (config.destination.format === 'json' || config.destination.format === 'both') {
    await generateSheetJSON(projects, config);
  }
}

/**
 * Sincronizar un Google Doc
 */
async function syncDoc(config: SyncConfig, accessToken: string): Promise<void> {
  if (!config.source.fileId) {
    throw new Error('fileId es requerido para sincronizar Docs');
  }

  logger.info(`Sincronizando Doc: ${config.source.name || config.source.fileId}`);

  // Exportar como texto plano
  const exportUrl = `https://www.googleapis.com/drive/v3/files/${config.source.fileId}/export?mimeType=text/plain`;
  const response = await fetch(exportUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Docs API error: ${response.status} - ${errorText}`);
  }

  const content = await response.text();

  // Guardar contenido
  const outputPath = path.join(process.cwd(), config.destination.path);
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  const filename = config.destination.filename || `${config.source.name || 'doc'}.md`;
  const filePath = path.join(outputPath, filename);
  fs.writeFileSync(filePath, content, 'utf-8');

  logger.info(`Doc guardado: ${filePath}`);
}

/**
 * Sincronizar archivos de Drive
 */
async function syncDrive(config: SyncConfig, accessToken: string): Promise<void> {
  const drive = new DriveService();
  await drive.authenticate();

  logger.info(`Sincronizando Drive: ${config.source.folderId || config.source.query || 'root'}`);

  let files: any[] = [];

  if (config.source.folderId) {
    // Listar archivos en carpeta
    const folderFiles = await drive.listFiles({
      q: `'${config.source.folderId}' in parents and trashed=false`,
      pageSize: 1000,
    });
    files = folderFiles.files || [];
  } else if (config.source.query) {
    // Buscar archivos con query
    const searchFiles = await drive.listFiles({
      q: config.source.query,
      pageSize: 1000,
    });
    files = searchFiles.files || [];
  } else {
    throw new Error('folderId o query es requerido para sincronizar Drive');
  }

  logger.info(`Encontrados ${files.length} archivos`);

  // Procesar cada archivo
  for (const file of files) {
    await processDriveFile(file, config, accessToken);
  }
}

/**
 * Procesar un archivo de Drive
 */
async function processDriveFile(file: any, config: SyncConfig, accessToken: string): Promise<void> {
  const mimeType = file.mimeType;

  // Determinar tipo de archivo
  if (mimeType === 'application/vnd.google-apps.spreadsheet') {
    // Es un Sheet
    const sheetConfig: SyncConfig = {
      ...config,
      source: { fileId: file.id, name: file.name },
      destination: {
        ...config.destination,
        filename: `${file.name}.md`,
      },
    };
    await syncSheet(sheetConfig, accessToken);
  } else if (mimeType === 'application/vnd.google-apps.document') {
    // Es un Doc
    const docConfig: SyncConfig = {
      ...config,
      source: { fileId: file.id, name: file.name },
      destination: {
        ...config.destination,
        filename: `${file.name}.md`,
      },
    };
    await syncDoc(docConfig, accessToken);
  } else {
    // Otro tipo de archivo
    logger.info(`Tipo de archivo no soportado: ${mimeType} - ${file.name}`);
  }
}

/**
 * Generar Markdown desde Sheet
 */
async function generateSheetMarkdown(projects: any[], headers: string[], config: SyncConfig): Promise<void> {
  // Usar la lógica del script sync-experience-from-sheets.ts
  // Por ahora, simplificamos
  const outputPath = path.join(process.cwd(), config.destination.path);
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  const filename = config.destination.filename || 'sheet-data.md';
  const filePath = path.join(outputPath, filename);

  let content = `# ${config.source.name || 'Sheet Data'}\n\n`;
  content += `**Última actualización:** ${new Date().toLocaleDateString('es-PE')}\n\n`;
  content += `**Total de filas:** ${projects.length}\n\n`;
  content += `## Datos\n\n`;

  // Generar tabla simple
  content += `| ${headers.join(' | ')} |\n`;
  content += `| ${headers.map(() => '---').join(' | ')} |\n`;
  
  projects.slice(0, 10).forEach((project: any) => {
    const row = headers.map((h: string) => project[h] || '').join(' | ');
    content += `| ${row} |\n`;
  });

  if (projects.length > 10) {
    content += `\n*... y ${projects.length - 10} filas más*\n`;
  }

  // Agregar firma indicando que fue extraído desde Google Sheets
  const sourceId = config.source.fileId || config.source.name || 'unknown';
  const signature = generateScrapeSignature(sourceId, 'google-sheet');
  content = insertSignature(content, signature, 'end');

  // Trackear modificación antes de escribir
  const scriptPath = __filename;
  const sourceFiles: string[] = [sourceId];
  trackFileModification(scriptPath, filePath, sourceFiles, 'sync-sheet-markdown', {
    source: config.source.name || config.source.fileId,
    totalRows: projects.length,
  });

  fs.writeFileSync(filePath, content, 'utf-8');
  logger.info(`Markdown generado: ${filePath}`);

  // Actualizar backlinks después de escribir
  await updateBacklinksFromContent(filePath);
}

/**
 * Generar JSON desde Sheet
 */
async function generateSheetJSON(projects: any[], config: SyncConfig): Promise<void> {
  const outputPath = path.join(process.cwd(), config.destination.path);
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  const filename = config.destination.filename?.replace('.md', '.json') || 'sheet-data.json';
  const filePath = path.join(outputPath, filename);

  const data = {
    source: config.source.name || config.source.fileId,
    lastSync: new Date().toISOString(),
    totalRows: projects.length,
    data: projects,
  };

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  logger.info(`JSON generado: ${filePath}`);
}

/**
 * Sincronizar según configuración
 */
async function sync(config: SyncConfig): Promise<void> {
  try {
    if (!credentials.hasGoogleWorkspace()) {
      throw new Error('Google Workspace no está configurado');
    }

    const accessToken = await GoogleAuth.refreshAccessToken();
    logger.info('Autenticado con Google Workspace API');

    switch (config.type) {
      case 'sheets':
        await syncSheet(config, accessToken);
        break;
      case 'docs':
        await syncDoc(config, accessToken);
        break;
      case 'drive':
        await syncDrive(config, accessToken);
        break;
      case 'all':
        // Sincronizar todo
        if (config.source.fileId) {
          // Determinar tipo por MIME type
          const drive = new DriveService();
          await drive.authenticate();
          const file = await drive.getFile(config.source.fileId);
          
          if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
            await syncSheet(config, accessToken);
          } else if (file.mimeType === 'application/vnd.google-apps.document') {
            await syncDoc(config, accessToken);
          } else {
            throw new Error(`Tipo de archivo no soportado: ${file.mimeType}`);
          }
        } else {
          throw new Error('fileId es requerido para sincronización "all"');
        }
        break;
      default:
        throw new Error(`Tipo de sincronización no soportado: ${config.type}`);
    }

    logger.info('Sincronización completada');
  } catch (error) {
    logger.error('Error en sincronización', error);
    throw error;
  }
}

/**
 * Sincronizar configuración predefinida
 */
async function syncPredefined(configName: string): Promise<void> {
  const config = PREDEFINED_CONFIGS[configName];
  if (!config) {
    throw new Error(`Configuración predefinida no encontrada: ${configName}`);
  }
  await sync(config);
}

/**
 * Sincronizar todas las configuraciones predefinidas
 */
async function syncAllPredefined(): Promise<void> {
  logger.info('Sincronizando todas las configuraciones predefinidas...');
  
  for (const [name, config] of Object.entries(PREDEFINED_CONFIGS)) {
    try {
      logger.info(`Sincronizando: ${name}`);
      await sync(config);
    } catch (error) {
      logger.error(`Error sincronizando ${name}:`, error);
    }
  }
  
  logger.info('Sincronización completa');
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Uso: npx tsx .dendrita/integrations/scripts/sync-google-workspace.ts [opciones]

Opciones:
  --all                    Sincronizar todas las configuraciones predefinidas
  --config <nombre>         Sincronizar configuración predefinida específica
  --type <tipo>            Tipo de sincronización (sheets|docs|drive|all)
  --file-id <id>           ID del archivo de Google
  --folder-id <id>         ID de la carpeta de Google Drive
  --query <query>         Query de búsqueda de Google Drive
  --output <path>          Ruta de destino
  --format <formato>       Formato de salida (markdown|json|both)

Ejemplos:
  # Sincronizar todas las configuraciones predefinidas
  npx tsx .dendrita/integrations/scripts/sync-google-workspace.ts --all

  # Sincronizar configuración específica
  npx tsx .dendrita/integrations/scripts/sync-google-workspace.ts --config experiencia-carrera

  # Sincronizar Sheet específico
  npx tsx .dendrita/integrations/scripts/sync-google-workspace.ts \\
    --type sheets \\
    --file-id 1r-yIuqjZ6FKjDzo4wxakJkoLnpA-lwFYTC6P-P6NwOE \\
    --output workspaces/personal/data \\
    --format markdown

  # Sincronizar carpeta de Drive
  npx tsx .dendrita/integrations/scripts/sync-google-workspace.ts \\
    --type drive \\
    --folder-id <folder-id> \\
    --output workspaces/personal/drive-sync \\
    --format both
`);
    process.exit(0);
  }

  // Parsear argumentos
  const options: any = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg?.startsWith('--')) {
      const key = arg.replace('--', '');
      // Verificar si es un flag booleano (sin valor)
      if (key === 'all') {
        options[key] = true;
      } else {
        // Tiene un valor
        const value = args[i + 1];
        if (value && !value.startsWith('--')) {
          options[key] = value;
          i++; // Saltar el siguiente argumento ya que es el valor
        }
      }
    }
  }

  // Ejecutar sincronización
  (async () => {
    try {
      if (options.all) {
        await syncAllPredefined();
      } else if (options.config) {
        await syncPredefined(options.config);
      } else {
        // Construir configuración desde argumentos
        const configType = (options.type as SyncType) || 'all';
        
        if (configType === 'all' && !options['file-id']) {
          logger.error('fileId es requerido para sincronización "all" o especifica un tipo (sheets|docs|drive)');
          process.exit(1);
        }
        
        const config: SyncConfig = {
          type: configType,
          source: {
            fileId: options['file-id'],
            folderId: options['folder-id'],
            query: options.query,
            name: options.name,
          },
          destination: {
            path: options.output || 'workspaces/personal/sync',
            format: (options.format as OutputFormat) || 'markdown',
            filename: options.filename,
          },
          options: {
            extractContent: true,
            extractMetadata: true,
            updateExisting: true,
          },
        };

        await sync(config);
      }
    } catch (error) {
      logger.error('Error fatal', error);
      process.exit(1);
    }
  })();
}

export { sync, syncPredefined, syncAllPredefined };

