/**
 * Servicio de scraping de Google Drive
 * Extrae archivos con todos los metadatos y los guarda en Supabase
 * Configurable por workspace, idempotente y detecta nuevos documentos y cambios
 */

import { DriveService } from './drive';
import { SupabaseService } from '../supabase/client';
import { createLogger } from '../../utils/logger';
import { credentials } from '../../utils/credentials';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('DriveScraper');

export interface DriveScrapingConfig {
  user_id: string;
  profile_id?: string;
  workspace?: string; // Nombre del workspace (ej: ennui, inspiro, etc.)
  config_name: string; // Nombre descriptivo de la configuración
  enabled?: boolean;
  folder_ids: string[]; // IDs de carpetas de Google Drive a monitorear
  include_subfolders?: boolean; // Incluir subcarpetas recursivamente
  max_results?: number;
  page_token?: string; // Token de paginación para continuar desde donde se quedó
  extract_permissions?: boolean; // Extraer permisos y compartidos
  extract_revisions?: boolean; // Extraer historial de revisiones
  extract_content?: boolean; // Extraer contenido de archivos (solo texto)
  extract_metadata?: boolean; // Extraer todos los metadatos
  extract_thumbnail?: boolean; // Extraer miniatura si está disponible
  mime_type_filter?: string[]; // Filtrar por tipos MIME
  date_min?: string; // Solo archivos modificados después de esta fecha
  date_max?: string; // Solo archivos modificados antes de esta fecha
  root_files_metadata_only?: boolean; // Si true, archivos sueltos en root solo se scrapean con metadata (sin contenido). Las carpetas en root siempre se scrapean recursivamente.
}

export interface DriveScrapingResult {
  config: DriveScrapingConfig;
  files_processed: number;
  files_created: number;
  files_updated: number;
  folders_created: number;
  folders_updated: number;
  permissions_created: number;
  permissions_updated: number;
  revisions_created: number;
  revisions_updated: number;
  errors: string[];
  duration_ms: number;
}

interface DriveFileMetadata {
  id: string;
  name: string;
  mimeType: string;
  kind?: string;
  size?: string;
  quotaBytesUsed?: string;
  createdTime?: string;
  modifiedTime?: string;
  viewedByMeTime?: string;
  sharedWithMeTime?: string;
  webViewLink?: string;
  webContentLink?: string;
  owners?: Array<{
    displayName?: string;
    emailAddress: string;
    photoLink?: string;
    me?: boolean;
  }>;
  shared?: boolean;
  permissions?: Array<{
    id: string;
    type: 'user' | 'group' | 'domain' | 'anyone';
    role: 'owner' | 'organizer' | 'fileOrganizer' | 'writer' | 'commenter' | 'reader';
    emailAddress?: string;
    domain?: string;
    displayName?: string;
    photoLink?: string;
    deleted?: boolean;
    allowFileDiscovery?: boolean;
    expirationTime?: string;
  }>;
  parents?: string[];
  starred?: boolean;
  trashed?: boolean;
  explicitlyTrashed?: boolean;
  description?: string;
  originalFilename?: string;
  md5Checksum?: string;
  headRevisionId?: string;
  hasThumbnail?: boolean;
  thumbnailLink?: string;
  thumbnailVersion?: string;
  iconLink?: string;
  hasAugmentedPermissions?: boolean;
  isAppAuthorized?: boolean;
  copyRequiresWriterPermission?: boolean;
  writersCanShare?: boolean;
  canShare?: boolean;
  canEdit?: boolean;
  canComment?: boolean;
  canReadRevisions?: boolean;
  capabilities?: {
    canAddChildren?: boolean;
    canChangeCopyRequiresWriterPermission?: boolean;
    canComment?: boolean;
    canCopy?: boolean;
    canDelete?: boolean;
    canDownload?: boolean;
    canEdit?: boolean;
    canListChildren?: boolean;
    canModifyContent?: boolean;
    canMoveChildrenWithinDrive?: boolean;
    canMoveItemIntoTeamDrive?: boolean;
    canMoveItemOutOfDrive?: boolean;
    canMoveItemWithinDrive?: boolean;
    canReadRevisions?: boolean;
    canRemoveChildren?: boolean;
    canRename?: boolean;
    canShare?: boolean;
    canTrash?: boolean;
    canUntrash?: boolean;
  };
  spaces?: string[];
  driveId?: string;
  teamDriveId?: string;
  [key: string]: any; // Para otros campos que puedan existir
}

export class DriveScraper {
  private driveService: DriveService;
  private supabaseService: SupabaseService;
  private db: ReturnType<SupabaseService['db']>;
  private accessToken?: string;

  constructor() {
    this.driveService = new DriveService();
    this.supabaseService = new SupabaseService();
    // Prefer service role if available; fallback to anon
    const useServiceRole = (() => {
      try {
        return !!credentials.getSupabase().serviceRoleKey;
      } catch {
        return false;
      }
    })();
    this.db = this.supabaseService.db(useServiceRole);
    if (useServiceRole) {
      logger.debug('Using Supabase service role key for writes');
    } else {
      logger.debug('Using Supabase anon key (service role not available)');
    }
  }

  /**
   * Inicializa el scraper verificando configuraciones
   */
  async initialize(): Promise<void> {
    if (!this.driveService.isConfigured()) {
      throw new Error('Google Drive credentials not configured');
    }
    if (!this.supabaseService.isConfigured()) {
      throw new Error('Supabase credentials not configured');
    }

    await this.driveService.authenticate();
    // Obtener access token para llamadas directas a la API
    this.accessToken = (this.driveService as any).accessToken;
    if (!this.accessToken) {
      // Si no está disponible, autenticamos de nuevo
      await this.driveService.authenticate();
      this.accessToken = (this.driveService as any).accessToken;
    }
    logger.info('Drive scraper initialized');
  }

  /**
   * Carga configuración de scraping desde archivo local del workspace
   * Paradigma de .dendrita: configuración en workspaces/[workspace]/scrapers-config.json
   */
  async loadConfigFromWorkspace(workspace: string, userId?: string): Promise<DriveScrapingConfig[]> {
    try {
      const projectRoot = path.resolve(__dirname, '../../../..');
      
      // Buscar el directorio del workspace (puede tener emojis)
      const workspacesDir = path.join(projectRoot, 'workspaces');
      let workspaceDir = workspace;
      
      if (!fs.existsSync(path.join(workspacesDir, workspace))) {
        // Buscar coincidencia sin emojis
        const normalizedName = workspace.toLowerCase().replace(/[^\w\s]/g, '').trim();
        const entries = fs.readdirSync(workspacesDir, { withFileTypes: true });
        
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const normalizedEntry = entry.name.toLowerCase().replace(/[^\w\s]/g, '').trim();
            if (normalizedEntry === normalizedName || normalizedEntry.includes(normalizedName) || normalizedName.includes(normalizedEntry)) {
              workspaceDir = entry.name;
              logger.info(`Found workspace directory: ${workspaceDir} (searched for: ${workspace})`);
              break;
            }
          }
        }
      }
      
      const configPath = path.join(workspacesDir, workspaceDir, 'scrapers-config.json');
      
      if (!fs.existsSync(configPath)) {
        logger.warn(`No scrapers-config.json found for workspace ${workspace} (searched in: ${workspaceDir})`);
        return [];
      }
      
      const configContent = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configContent);
      
      if (!config.drive || !config.drive.configs) {
        logger.warn(`No drive configuration found in scrapers-config.json for workspace ${workspace}`);
        return [];
      }
      
      return config.drive.configs.map((cfg: any) => ({
        user_id: userId || 'unknown',
        profile_id: undefined,
        workspace: workspace,
        config_name: cfg.config_name,
        enabled: cfg.enabled ?? true,
        folder_ids: cfg.folder_ids || [],
        include_subfolders: cfg.include_subfolders ?? true,
        max_results: cfg.max_results ?? 1000,
        page_token: cfg.page_token || undefined,
        extract_permissions: cfg.extract_permissions ?? true,
        extract_revisions: cfg.extract_revisions ?? false,
        extract_content: cfg.extract_content ?? false,
        extract_metadata: cfg.extract_metadata ?? true,
        extract_thumbnail: cfg.extract_thumbnail ?? false,
        root_files_metadata_only: cfg.root_files_metadata_only ?? false,
        mime_type_filter: cfg.mime_type_filter || undefined,
        date_min: cfg.date_min || undefined,
        date_max: cfg.date_max || undefined,
      }));
    } catch (error) {
      logger.error('Failed to load config from workspace', error);
      throw error;
    }
  }

  /**
   * Carga configuración de scraping desde archivo local del usuario
   * Paradigma de .dendrita: configuración en .dendrita/users/[user-id]/scrapers-config.json
   */
  async loadConfigFromUser(userId: string): Promise<DriveScrapingConfig[]> {
    try {
      const projectRoot = path.resolve(__dirname, '../../../..');
      const configPath = path.join(projectRoot, '.dendrita', 'users', userId, 'scrapers-config.json');
      
      if (!fs.existsSync(configPath)) {
        logger.warn(`No scrapers-config.json found for user ${userId}`);
        return [];
      }
      
      const configContent = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configContent);
      
      if (!config.drive || !config.drive.configs) {
        logger.warn(`No drive configuration found in scrapers-config.json for user ${userId}`);
        return [];
      }
      
      return config.drive.configs.map((cfg: any) => ({
        user_id: userId,
        profile_id: undefined,
        workspace: undefined, // Configs a nivel de usuario no tienen workspace
        config_name: cfg.config_name,
        enabled: cfg.enabled ?? true,
        folder_ids: cfg.folder_ids || [],
        include_subfolders: cfg.include_subfolders ?? true,
        max_results: cfg.max_results ?? 1000,
        page_token: cfg.page_token || undefined,
        extract_permissions: cfg.extract_permissions ?? true,
        extract_revisions: cfg.extract_revisions ?? false,
        extract_content: cfg.extract_content ?? false,
        extract_metadata: cfg.extract_metadata ?? true,
        extract_thumbnail: cfg.extract_thumbnail ?? false,
        root_files_metadata_only: cfg.root_files_metadata_only ?? false,
        mime_type_filter: cfg.mime_type_filter || undefined,
        date_min: cfg.date_min || undefined,
        date_max: cfg.date_max || undefined,
      }));
    } catch (error) {
      logger.error('Failed to load config from user', error);
      throw error;
    }
  }

  /**
   * @deprecated Use loadConfigFromWorkspace() instead. Kept for backward compatibility.
   * Carga configuración de scraping desde perfil de usuario
   */
  async loadConfigFromProfile(userId: string, profileId?: string, workspace?: string): Promise<DriveScrapingConfig[]> {
    if (workspace) {
      return this.loadConfigFromWorkspace(workspace, userId);
    }
    logger.warn(`loadConfigFromProfile called without workspace. Use loadConfigFromWorkspace() instead.`);
    return [];
  }

  /**
   * Guarda o actualiza configuración de scraping en archivo local del workspace
   * Paradigma de .dendrita: configuración en workspaces/[workspace]/scrapers-config.json
   */
  async saveConfig(workspace: string, configs: DriveScrapingConfig[]): Promise<void> {
    try {
      const projectRoot = path.resolve(__dirname, '../../../..');
      const configPath = path.join(projectRoot, 'workspaces', workspace, 'scrapers-config.json');
      const workspaceDir = path.dirname(configPath);
      
      // Crear directorio si no existe
      if (!fs.existsSync(workspaceDir)) {
        fs.mkdirSync(workspaceDir, { recursive: true });
      }
      
      // Cargar configuración existente o crear nueva
      let config: any = {};
      if (fs.existsSync(configPath)) {
        const configContent = fs.readFileSync(configPath, 'utf-8');
        config = JSON.parse(configContent);
      } else {
        config.workspace = workspace;
        config.drive = { configs: [] };
        config.gmail = { configs: [] };
      }
      
      // Actualizar sección de drive
      if (!config.drive) {
        config.drive = { configs: [] };
      }
      
      // Actualizar configuraciones de drive
      config.drive.configs = configs.map(cfg => ({
        config_name: cfg.config_name,
        enabled: cfg.enabled ?? true,
        folder_ids: cfg.folder_ids || [],
        include_subfolders: cfg.include_subfolders ?? true,
        max_results: cfg.max_results ?? 1000,
        page_token: cfg.page_token || undefined,
        extract_permissions: cfg.extract_permissions ?? true,
        extract_revisions: cfg.extract_revisions ?? false,
        extract_content: cfg.extract_content ?? false,
        extract_metadata: cfg.extract_metadata ?? true,
        extract_thumbnail: cfg.extract_thumbnail ?? false,
        root_files_metadata_only: cfg.root_files_metadata_only ?? false,
        mime_type_filter: cfg.mime_type_filter || undefined,
        date_min: cfg.date_min || undefined,
        date_max: cfg.date_max || undefined,
      }));
      
      // Actualizar metadata
      config.metadata = {
        ...config.metadata,
        last_updated: new Date().toISOString(),
      };
      
      // Guardar archivo
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
      logger.info(`Config saved for workspace ${workspace} in ${configPath}`);
    } catch (error) {
      logger.error('Failed to save config', error);
      throw error;
    }
  }

  /**
   * Guarda o actualiza configuración de scraping en archivo local del usuario
   * Paradigma de .dendrita: configuración en .dendrita/users/[user-id]/scrapers-config.json
   */
  async saveUserConfig(userId: string, configs: DriveScrapingConfig[]): Promise<void> {
    try {
      const projectRoot = path.resolve(__dirname, '../../../..');
      const configPath = path.join(projectRoot, '.dendrita', 'users', userId, 'scrapers-config.json');
      const userDir = path.dirname(configPath);
      
      // Crear directorio si no existe
      if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
      }
      
      // Cargar configuración existente o crear nueva
      let config: any = {};
      if (fs.existsSync(configPath)) {
        const configContent = fs.readFileSync(configPath, 'utf-8');
        config = JSON.parse(configContent);
      } else {
        config.user_id = userId;
        config.drive = { configs: [] };
      }
      
      // Actualizar sección de drive
      if (!config.drive) {
        config.drive = { configs: [] };
      }
      
      // Actualizar configuraciones de drive
      config.drive.configs = configs.map(cfg => ({
        config_name: cfg.config_name,
        enabled: cfg.enabled ?? true,
        folder_ids: cfg.folder_ids || [],
        include_subfolders: cfg.include_subfolders ?? true,
        max_results: cfg.max_results ?? 1000,
        page_token: cfg.page_token || undefined,
        extract_permissions: cfg.extract_permissions ?? true,
        extract_revisions: cfg.extract_revisions ?? false,
        extract_content: cfg.extract_content ?? false,
        extract_metadata: cfg.extract_metadata ?? true,
        extract_thumbnail: cfg.extract_thumbnail ?? false,
        root_files_metadata_only: cfg.root_files_metadata_only ?? false,
        mime_type_filter: cfg.mime_type_filter || undefined,
        date_min: cfg.date_min || undefined,
        date_max: cfg.date_max || undefined,
      }));
      
      // Actualizar metadata
      config.metadata = {
        ...config.metadata,
        last_updated: new Date().toISOString(),
      };
      
      // Guardar archivo
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
      logger.info(`Config saved for user ${userId} in ${configPath}`);
    } catch (error) {
      logger.error('Failed to save user config', error);
      throw error;
    }
  }

  /**
   * @deprecated Use saveConfig() instead. Kept for backward compatibility.
   * Crea o actualiza configuración de scraping
   */
  async upsertConfig(config: DriveScrapingConfig): Promise<void> {
    if (config.workspace) {
      await this.saveConfig(config.workspace, [config]);
    } else {
      // Si no tiene workspace, es una config a nivel de usuario
      await this.saveUserConfig(config.user_id, [config]);
    }
  }

  /**
   * Obtiene todos los metadatos de un archivo desde Drive API
   */
  private async getFullFileMetadata(fileId: string): Promise<DriveFileMetadata> {
    try {
      if (!this.accessToken) {
        await this.initialize();
      }

      // Campos válidos de Drive API v3
      // Usar solo campos básicos y conocidos para evitar errores
      const fields = [
        'id', 'name', 'mimeType', 'kind', 'size', 'quotaBytesUsed',
        'createdTime', 'modifiedTime', 'viewedByMeTime', 'sharedWithMeTime',
        'webViewLink', 'webContentLink',
        'owners', 'shared', 'permissions', 'parents',
        'starred', 'trashed', 'explicitlyTrashed', 'description', 'originalFilename',
        'md5Checksum', 'headRevisionId', 'hasThumbnail', 'thumbnailLink', 'thumbnailVersion',
        'iconLink', 'hasAugmentedPermissions', 'isAppAuthorized',
        'copyRequiresWriterPermission', 'writersCanShare',
        'capabilities', 'spaces',
        'driveId', 'teamDriveId'
      ].join(',');

      const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=${encodeURIComponent(fields)}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Drive API error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error(`Failed to get full metadata for file ${fileId}`, error);
      throw error;
    }
  }

  /**
   * Obtiene permisos de un archivo
   */
  private async getFilePermissions(fileId: string): Promise<any[]> {
    try {
      if (!this.accessToken) {
        await this.initialize();
      }

      const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/permissions`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Drive API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.permissions || [];
    } catch (error) {
      logger.error(`Failed to get permissions for file ${fileId}`, error);
      throw error;
    }
  }

  /**
   * Obtiene revisiones de un archivo
   */
  private async getFileRevisions(fileId: string): Promise<any[]> {
    try {
      if (!this.accessToken) {
        await this.initialize();
      }

      const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/revisions`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Drive API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.revisions || [];
    } catch (error) {
      logger.error(`Failed to get revisions for file ${fileId}`, error);
      throw error;
    }
  }

  /**
   * Obtiene contenido de un archivo como texto (si es posible)
   */
  private async getFileContent(fileId: string, mimeType: string): Promise<string | null> {
    try {
      if (!this.accessToken) {
        await this.initialize();
      }

      // Solo extraer contenido de archivos de texto
      const textMimeTypes = [
        'text/plain',
        'text/html',
        'text/css',
        'text/javascript',
        'text/markdown',
        'application/json',
        'application/xml',
        'text/xml',
      ];

      const isTextFile = textMimeTypes.some(mt => mimeType.includes(mt.split('/')[1]));

      if (!isTextFile) {
        // Para Google Docs, Sheets, etc., usar export
        if (mimeType === 'application/vnd.google-apps.document') {
          const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export?mimeType=text/plain`;
          const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
            },
          });

          if (response.ok) {
            return await response.text();
          }
        } else if (mimeType === 'application/vnd.google-apps.spreadsheet') {
          // Para Sheets, exportar como CSV
          const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export?mimeType=text/csv`;
          const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
            },
          });

          if (response.ok) {
            return await response.text();
          }
        }
        return null;
      }

      // Para archivos de texto normales, descargar directamente
      const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      return await response.text();
    } catch (error) {
      logger.error(`Failed to extract content for file ${fileId}`, error);
      return null;
    }
  }

  /**
   * Calcula hash de un archivo para detectar cambios
   */
  private calculateFileHash(file: DriveFileMetadata): string {
    const hashable = {
      name: file.name || '',
      mimeType: file.mimeType || '',
      size: file.size || '',
      modifiedTime: file.modifiedTime || '',
      md5Checksum: file.md5Checksum || '',
      parents: JSON.stringify(file.parents || []),
      shared: file.shared || false,
      trashed: file.trashed || false,
      description: file.description || '',
      permissions: JSON.stringify((file.permissions || []).map((p: any) => ({
        id: p.id,
        type: p.type,
        role: p.role,
        emailAddress: p.emailAddress,
      }))),
    };

    const hashInput = JSON.stringify(hashable);
    return crypto.createHash('sha256').update(hashInput).digest('hex');
  }

  /**
   * Construye la ruta de carpetas de un archivo
   */
  private async buildFolderPath(fileId: string, parents: string[]): Promise<string> {
    if (!parents || parents.length === 0) {
      return '/';
    }

    try {
      // Obtener el nombre de la carpeta padre
      const parentId = parents[parents.length - 1];
      if (parentId === 'root') {
        return '/';
      }

      const parentFile = await this.getFullFileMetadata(parentId);
      const parentPath = parentFile.name || parentId;

      // Si hay más padres, construir recursivamente
      if (parentFile.parents && parentFile.parents.length > 0) {
        const grandParentPath = await this.buildFolderPath(parentId, parentFile.parents);
        return `${grandParentPath}/${parentPath}`;
      }

      return `/${parentPath}`;
    } catch (error) {
      logger.error(`Failed to build folder path for file ${fileId}`, error);
      return '/';
    }
  }

  /**
   * Procesa un archivo y lo guarda en Supabase
   */
  private async processFile(
    config: DriveScrapingConfig,
    fileMetadata: DriveFileMetadata,
    configId?: string
  ): Promise<{
    fileId: string;
    created: boolean;
    updated: boolean;
    isFolder: boolean;
  }> {
    try {
      const syncHash = this.calculateFileHash(fileMetadata);
      const isFolder = fileMetadata.mimeType === 'application/vnd.google-apps.folder';

      // Buscar archivo existente
      const { data: existingFile, error: findError } = await this.db
        .from('drive_files')
        .select('id, sync_hash, deleted_at')
        .eq('user_id', config.user_id)
        .eq('google_file_id', fileMetadata.id)
        .maybeSingle();

      if (findError && findError.code !== 'PGRST116') {
        throw findError;
      }

      // Construir ruta de carpetas
      const folderPath = await this.buildFolderPath(fileMetadata.id, fileMetadata.parents || []);
      const parentFolderId = (fileMetadata.parents || []).length > 0
        ? (fileMetadata.parents || [])[(fileMetadata.parents || []).length - 1]
        : null;

      // Obtener permisos si está configurado
      let permissions: any[] = [];
      if (config.extract_permissions) {
        try {
          permissions = await this.getFilePermissions(fileMetadata.id);
        } catch (error) {
          logger.error(`Failed to get permissions for file ${fileMetadata.id}`, error);
        }
      }

      // Obtener contenido si está configurado
      let contentText: string | null = null;
      let contentExtracted = false;
      let contentExtractionError: string | null = null;

      // Verificar si el archivo está en root y si root_files_metadata_only está habilitado
      const isInRoot = (fileMetadata.parents || []).includes('root');
      const shouldExtractContent = config.extract_content && !isFolder && 
        !(config.root_files_metadata_only && isInRoot);

      if (shouldExtractContent) {
        try {
          contentText = await this.getFileContent(fileMetadata.id, fileMetadata.mimeType);
          contentExtracted = contentText !== null;
        } catch (error: any) {
          contentExtractionError = error.message;
          logger.error(`Failed to extract content for file ${fileMetadata.id}`, error);
        }
      } else if (config.root_files_metadata_only && isInRoot && !isFolder) {
        logger.info(`Skipping content extraction for root file ${fileMetadata.name} (root_files_metadata_only enabled)`);
      }

      const fileData: any = {
        user_id: config.user_id,
        profile_id: config.profile_id || null,
        workspace: config.workspace || null,
        config_id: configId || null,
        google_file_id: fileMetadata.id,
        google_drive_id: fileMetadata.driveId || fileMetadata.teamDriveId || null,
        name: fileMetadata.name || null,
        mime_type: fileMetadata.mimeType || null,
        kind: fileMetadata.kind || null,
        size_bytes: fileMetadata.size ? parseInt(fileMetadata.size) : null,
        quota_bytes_used: fileMetadata.quotaBytesUsed ? parseInt(fileMetadata.quotaBytesUsed) : null,
        created_time: fileMetadata.createdTime || null,
        modified_time: fileMetadata.modifiedTime || null,
        viewed_by_me_time: fileMetadata.viewedByMeTime || null,
        shared_with_me_time: fileMetadata.sharedWithMeTime || null,
        web_view_link: fileMetadata.webViewLink || null,
        web_content_link: fileMetadata.webContentLink || null,
        alternate_link: null, // Deprecated in Drive API v3
        embed_link: null, // Deprecated in Drive API v3
        owners: fileMetadata.owners || null,
        shared: fileMetadata.shared ?? false,
        permissions_summary: permissions.map((p: any) => ({
          id: p.id,
          type: p.type,
          role: p.role,
          emailAddress: p.emailAddress,
        })),
        permission_ids: permissions.map((p: any) => p.id),
        parents: fileMetadata.parents || [],
        parent_folder_id: parentFolderId,
        folder_path: folderPath,
        starred: fileMetadata.starred ?? false,
        trashed: fileMetadata.trashed ?? false,
        explicitly_trashed: fileMetadata.explicitlyTrashed ?? false,
        description: fileMetadata.description || null,
        original_filename: fileMetadata.originalFilename || null,
        md5_checksum: fileMetadata.md5Checksum || null,
        head_revision_id: fileMetadata.headRevisionId || null,
        has_thumbnail: fileMetadata.hasThumbnail ?? false,
        thumbnail_link: fileMetadata.thumbnailLink || null,
        thumbnail_version: fileMetadata.thumbnailVersion || null,
        icon_link: fileMetadata.iconLink || null,
        has_augmented_permissions: fileMetadata.hasAugmentedPermissions || null,
        is_app_authorized: fileMetadata.isAppAuthorized || null,
        copy_requires_writer_permission: fileMetadata.copyRequiresWriterPermission || null,
        writers_can_share: fileMetadata.writersCanShare || null,
        can_share: fileMetadata.canShare || null,
        can_edit: fileMetadata.canEdit || null,
        can_comment: fileMetadata.canComment || null,
        can_read_revisions: fileMetadata.canReadRevisions || null,
        capabilities: fileMetadata.capabilities || null,
        spaces: fileMetadata.spaces || null,
        drive_id: fileMetadata.driveId || null,
        team_drive_id: fileMetadata.teamDriveId || null,
        full_metadata: fileMetadata,
        content_text: contentText,
        content_extracted: contentExtracted,
        content_extraction_error: contentExtractionError,
        sync_hash: syncHash,
        last_synced_at: new Date().toISOString(),
        deleted_at: null, // Restaurar si estaba eliminado
        updated_at: new Date().toISOString(),
      };

      let fileId: string;
      let created = false;
      let updated = false;

      if (existingFile) {
        // Verificar si hay cambios
        if (existingFile.sync_hash !== syncHash) {
          // Actualizar archivo existente
          const { data: updatedFile, error: updateError } = await this.db
            .from('drive_files')
            .update(fileData)
            .eq('id', existingFile.id)
            .select('id')
            .single();

          if (updateError) throw updateError;
          fileId = updatedFile.id;
          updated = true;
          logger.debug(`File updated: ${fileMetadata.id}`);
        } else {
          // Sin cambios, solo actualizar last_synced_at
          fileId = existingFile.id;
          await this.db
            .from('drive_files')
            .update({ last_synced_at: new Date().toISOString() })
            .eq('id', existingFile.id);
        }
      } else {
        // Crear nuevo archivo
        const { data: newFile, error: insertError } = await this.db
          .from('drive_files')
          .insert(fileData)
          .select('id')
          .single();

        if (insertError) throw insertError;
        fileId = newFile.id;
        created = true;
        logger.debug(`File created: ${fileMetadata.id}`);
      }

      // Procesar permisos si está configurado
      if (config.extract_permissions && permissions.length > 0) {
        await this.processPermissions(fileId, permissions);
      }

      // Procesar revisiones si está configurado
      if (config.extract_revisions && !isFolder) {
        try {
          const revisions = await this.getFileRevisions(fileMetadata.id);
          await this.processRevisions(fileId, revisions);
        } catch (error) {
          logger.error(`Failed to process revisions for file ${fileMetadata.id}`, error);
        }
      }

      return { fileId, created, updated, isFolder };
    } catch (error) {
      logger.error(`Failed to process file ${fileMetadata.id}`, error);
      throw error;
    }
  }

  /**
   * Procesa permisos de un archivo
   */
  private async processPermissions(fileId: string, permissions: any[]): Promise<void> {
    try {
      for (const permission of permissions) {
        const permissionData: any = {
          file_id: fileId,
          google_permission_id: permission.id,
          type: permission.type,
          role: permission.role,
          email_address: permission.emailAddress || null,
          domain: permission.domain || null,
          display_name: permission.displayName || null,
          photo_link: permission.photoLink || null,
          deleted: permission.deleted ?? false,
          allow_file_discovery: permission.allowFileDiscovery || null,
          expiration_time: permission.expirationTime || null,
          full_metadata: permission,
          updated_at: new Date().toISOString(),
        };

        await this.db
          .from('drive_file_permissions')
          .upsert(permissionData, {
            onConflict: 'file_id,google_permission_id',
          });
      }
    } catch (error) {
      logger.error(`Failed to process permissions for file ${fileId}`, error);
      throw error;
    }
  }

  /**
   * Procesa revisiones de un archivo
   */
  private async processRevisions(fileId: string, revisions: any[]): Promise<void> {
    try {
      for (const revision of revisions) {
        const revisionData: any = {
          file_id: fileId,
          google_revision_id: revision.id,
          mime_type: revision.mimeType || null,
          size_bytes: revision.size ? parseInt(revision.size) : null,
          md5_checksum: revision.md5Checksum || null,
          created_time: revision.created || null,
          modified_time: revision.modified || null,
          keep_forever: revision.keepForever ?? false,
          published: revision.published ?? false,
          published_outside_domain: revision.publishedOutsideDomain ?? false,
          publish_auto: revision.publishAuto ?? false,
          export_links: revision.exportLinks || null,
          full_metadata: revision,
          updated_at: new Date().toISOString(),
        };

        await this.db
          .from('drive_file_revisions')
          .upsert(revisionData, {
            onConflict: 'file_id,google_revision_id',
          });
      }
    } catch (error) {
      logger.error(`Failed to process revisions for file ${fileId}`, error);
      throw error;
    }
  }

  /**
   * Obtiene todos los archivos de una carpeta recursivamente
   */
  private async getAllFilesInFolder(
    folderId: string,
    config: DriveScrapingConfig,
    processedFiles: Set<string> = new Set()
  ): Promise<DriveFileMetadata[]> {
    const allFiles: DriveFileMetadata[] = [];
    let pageToken: string | undefined = undefined;

    do {
      try {
        // Construir query de búsqueda
        let query = `'${folderId}' in parents and trashed = false`;
        
        // Aplicar filtros de fecha si están configurados
        if (config.date_min) {
          const dateMin = new Date(config.date_min).toISOString();
          query += ` and modifiedTime >= '${dateMin}'`;
        }
        if (config.date_max) {
          const dateMax = new Date(config.date_max).toISOString();
          query += ` and modifiedTime <= '${dateMax}'`;
        }

        // Aplicar filtro de MIME type si está configurado
        if (config.mime_type_filter && config.mime_type_filter.length > 0) {
          const mimeFilter = config.mime_type_filter.map(mt => `mimeType = '${mt}'`).join(' or ');
          query += ` and (${mimeFilter})`;
        }

        const params = new URLSearchParams();
        params.append('q', query);
        params.append('pageSize', '1000'); // Máximo permitido por Drive API
        params.append('fields', 'nextPageToken, files(id, name, mimeType, parents)');
        if (pageToken) {
          params.append('pageToken', pageToken);
        }

        const url = `https://www.googleapis.com/drive/v3/files?${params.toString()}`;
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Drive API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const files = data.files || [];
        pageToken = data.nextPageToken;

        // Obtener metadatos completos de cada archivo
        for (const file of files) {
          if (processedFiles.has(file.id)) {
            continue; // Ya procesado
          }
          processedFiles.add(file.id);

          try {
            const fullMetadata = await this.getFullFileMetadata(file.id);
            allFiles.push(fullMetadata);

            // Si es una carpeta y include_subfolders está habilitado, procesar recursivamente
            if (
              fullMetadata.mimeType === 'application/vnd.google-apps.folder' &&
              config.include_subfolders
            ) {
              const subfolderFiles = await this.getAllFilesInFolder(file.id, config, processedFiles);
            allFiles.push(...subfolderFiles);
          }
        } catch (error) {
          logger.error(`Failed to get full metadata for file ${file.id}`, error);
        }
        }
      } catch (error) {
        logger.error(`Failed to list files in folder ${folderId}`, error);
        throw error;
      }
    } while (pageToken && allFiles.length < (config.max_results || 1000));

    return allFiles;
  }

  /**
   * Ejecuta scraping para una configuración específica
   */
  async scrape(config: DriveScrapingConfig): Promise<DriveScrapingResult> {
    const startTime = Date.now();
    const result: DriveScrapingResult = {
      config,
      files_processed: 0,
      files_created: 0,
      files_updated: 0,
      folders_created: 0,
      folders_updated: 0,
      permissions_created: 0,
      permissions_updated: 0,
      revisions_created: 0,
      revisions_updated: 0,
      errors: [],
      duration_ms: 0,
    };

    try {
      logger.info(`Starting scrape for user ${config.user_id}, workspace ${config.workspace || 'default'}, config ${config.config_name}`);

      // Obtener configuración de Supabase para obtener el config_id y last_sync_at
      const { data: configData } = await this.db
        .from('drive_scraping_configs')
        .select('id, last_sync_at')
        .eq('user_id', config.user_id)
        .eq('profile_id', config.profile_id || null)
        .eq('workspace', config.workspace || null)
        .eq('config_name', config.config_name)
        .maybeSingle();

      const configId = configData?.id;
      
      // Optimización incremental: Si hay una última sincronización y no hay date_min explícito,
      // usar last_sync_at como date_min para solo obtener archivos modificados desde la última sincronización.
      // Esto evita procesar archivos que no han cambiado, mejorando significativamente el rendimiento
      // en carpetas grandes con muchos archivos (como carpetas de fotos).
      // Si no hay last_sync_at (primera ejecución), se indexará todo.
      let effectiveDateMin = config.date_min;
      if (!effectiveDateMin && configData?.last_sync_at) {
        effectiveDateMin = configData.last_sync_at;
        logger.info(`Using last_sync_at (${effectiveDateMin}) as date_min for incremental sync`);
      } else if (!configData?.last_sync_at) {
        logger.info('No previous sync found - will index all files (first run)');
      }
      
      // Crear una copia de la configuración con el date_min efectivo
      const effectiveConfig: DriveScrapingConfig = {
        ...config,
        date_min: effectiveDateMin,
      };

      // Procesar cada carpeta configurada
      const processedFiles = new Set<string>();

      for (const folderId of config.folder_ids) {
        try {
          logger.info(`Processing folder: ${folderId}`);
          const files = await this.getAllFilesInFolder(folderId, effectiveConfig, processedFiles);

          logger.info(`Found ${files.length} files in folder ${folderId}`);

          // Procesar cada archivo
          for (const file of files) {
            try {
              if (result.files_processed >= (config.max_results || 1000)) {
                logger.info(`Reached max results limit: ${config.max_results}`);
                break;
              }

              result.files_processed++;

              const { created, updated, isFolder } = await this.processFile(
                config,
                file,
                configId
              );

              if (isFolder) {
                if (created) {
                  result.folders_created++;
                } else if (updated) {
                  result.folders_updated++;
                }
              } else {
                if (created) {
                  result.files_created++;
                } else if (updated) {
                  result.files_updated++;
                }
              }

              // Contar permisos y revisiones (aproximado)
              if (config.extract_permissions && file.permissions) {
                result.permissions_created += file.permissions.length;
              }
            } catch (error: any) {
              const errorMsg = `Error processing file ${file.id}: ${error.message}`;
              logger.error(errorMsg, error);
              result.errors.push(errorMsg);
            }
          }

          if (result.files_processed >= (config.max_results || 1000)) {
            break;
          }
        } catch (error: any) {
          const errorMsg = `Error processing folder ${folderId}: ${error.message}`;
          logger.error(errorMsg, error);
          result.errors.push(errorMsg);
        }
      }

      // Actualizar estado de sincronización
      await this.updateSyncStatus(config, 'success', null, result.files_processed);

      result.duration_ms = Date.now() - startTime;
      logger.info(
        `Scrape completed: ${result.files_processed} processed, ${result.files_created} created, ${result.files_updated} updated`
      );

      return result;
    } catch (error: any) {
      const errorMsg = `Scrape failed: ${error.message}`;
      logger.error(errorMsg, error);
      result.errors.push(errorMsg);
      result.duration_ms = Date.now() - startTime;

      await this.updateSyncStatus(config, 'error', errorMsg, result.files_processed);
      throw error;
    }
  }

  /**
   * Actualiza estado de sincronización
   */
  private async updateSyncStatus(
    config: DriveScrapingConfig,
    status: string,
    error: string | null,
    fileCount: number
  ): Promise<void> {
    try {
      await this.db
        .from('drive_scraping_configs')
        .update({
          last_sync_at: new Date().toISOString(),
          last_sync_status: status,
          last_sync_error: error,
          last_sync_file_count: fileCount,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', config.user_id)
        .eq('profile_id', config.profile_id || null)
        .eq('workspace', config.workspace || null)
        .eq('config_name', config.config_name);
    } catch (error) {
      logger.error('Failed to update sync status', error);
    }
  }

  /**
   * Ejecuta scraping para un usuario, perfil y workspace específicos
   * Si no se especifica workspace, carga configs a nivel de usuario
   */
  async scrapeForUser(userId: string, profileId?: string, workspace?: string): Promise<DriveScrapingResult[]> {
    let configs: DriveScrapingConfig[] = [];

    if (workspace) {
      // Cargar configs del workspace
      configs = await this.loadConfigFromWorkspace(workspace, userId);
    } else {
      // Cargar configs a nivel de usuario
      configs = await this.loadConfigFromUser(userId);
    }

    if (configs.length === 0) {
      logger.warn(`No scraping configs found for user ${userId}${profileId ? ` with profile ${profileId}` : ''}${workspace ? ` in workspace ${workspace}` : ' (user-level)'}`);
      return [];
    }

    const results: DriveScrapingResult[] = [];

    for (const config of configs) {
      if (!config.enabled) {
        logger.info(`Skipping disabled config ${config.config_name}`);
        continue;
      }

      try {
        const result = await this.scrape(config);
        results.push(result);
      } catch (error: any) {
        logger.error(`Failed to scrape config ${config.config_name}`, error);
        results.push({
          config,
          files_processed: 0,
          files_created: 0,
          files_updated: 0,
          folders_created: 0,
          folders_updated: 0,
          permissions_created: 0,
          permissions_updated: 0,
          revisions_created: 0,
          revisions_updated: 0,
          errors: [error.message],
          duration_ms: 0,
        });
      }
    }

    return results;
  }
}

