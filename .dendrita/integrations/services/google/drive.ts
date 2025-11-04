/**
 * Servicio de Google Drive para listar, buscar, compartir y descargar archivos
 */

import { BaseService } from '../base/service.interface';
import { GoogleAuth } from './auth';
import { createLogger } from '../../utils/logger';

const logger = createLogger('GoogleDrive');

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink?: string;
  webContentLink?: string;
  shared?: boolean;
  owners?: Array<{
    displayName?: string;
    emailAddress: string;
  }>;
  parents?: string[];
  permissions?: Array<{
    id: string;
    type: 'user' | 'group' | 'domain' | 'anyone';
    role: 'owner' | 'organizer' | 'fileOrganizer' | 'writer' | 'commenter' | 'reader';
    emailAddress?: string;
  }>;
}

export interface DriveFileList {
  files: DriveFile[];
  nextPageToken?: string;
}

export interface FileShareOptions {
  role: 'reader' | 'writer' | 'commenter';
  type: 'user' | 'group' | 'domain' | 'anyone';
  emailAddress?: string;
  domain?: string;
  sendNotificationEmail?: boolean;
}

export class DriveService extends BaseService {
  name = 'Google Drive';
  private accessToken?: string;

  async authenticate(): Promise<void> {
    try {
      logger.info('Authenticating with Google Drive...');

      if (!GoogleAuth.isConfigured()) {
        throw new Error('Google Workspace credentials not configured');
      }

      this.accessToken = await GoogleAuth.refreshAccessToken();
      logger.info('Google Drive authentication successful');
    } catch (error) {
      logger.error('Google Drive authentication failed', error);
      throw error;
    }
  }

  isConfigured(): boolean {
    return GoogleAuth.isConfigured();
  }

  /**
   * Lista archivos en Google Drive
   */
  async listFiles(options: {
    pageSize?: number;
    pageToken?: string;
    q?: string;
    orderBy?: string;
    fields?: string;
  } = {}): Promise<DriveFileList> {
    try {
      if (!this.accessToken) {
        await this.authenticate();
      }

      const {
        pageSize = 10,
        pageToken,
        q,
        orderBy = 'modifiedTime desc',
        fields = 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, shared, owners, parents)',
      } = options;

      logger.info('Listing files...');

      const params = new URLSearchParams();
      params.append('pageSize', pageSize.toString());
      if (pageToken) params.append('pageToken', pageToken);
      if (q) params.append('q', q);
      params.append('orderBy', orderBy);
      params.append('fields', fields);

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
      const files: DriveFile[] = (data.files || []).map((file: any) => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink,
        shared: file.shared,
        owners: file.owners,
        parents: file.parents,
      }));

      logger.info(`Found ${files.length} files`);

      return {
        files,
        nextPageToken: data.nextPageToken,
      };
    } catch (error) {
      logger.error('Failed to list files', error);
      throw error;
    }
  }

  /**
   * Busca archivos usando la sintaxis de consulta de Google Drive
   * Ej: "name contains 'report'", "mimeType = 'application/pdf'"
   */
  async searchFiles(query: string, options: {
    pageSize?: number;
    pageToken?: string;
    orderBy?: string;
  } = {}): Promise<DriveFileList> {
    try {
      if (!this.accessToken) {
        await this.authenticate();
      }

      logger.info(`Searching files with query: "${query}"`);

      return this.listFiles({
        ...options,
        q: query,
      });
    } catch (error) {
      logger.error('Failed to search files', error);
      throw error;
    }
  }

  /**
   * Obtiene un archivo específico por ID
   */
  async getFile(fileId: string, fields?: string): Promise<DriveFile> {
    try {
      if (!this.accessToken) {
        await this.authenticate();
      }

      logger.debug(`Getting file: ${fileId}`);

      const params = new URLSearchParams();
      if (fields) {
        params.append('fields', fields);
      } else {
        params.append('fields', 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, shared, owners, parents, permissions');
      }

      const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?${params.toString()}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Drive API error: ${response.status} - ${errorText}`);
      }

      const file = await response.json();
      return {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink,
        shared: file.shared,
        owners: file.owners,
        parents: file.parents,
        permissions: file.permissions,
      };
    } catch (error) {
      logger.error('Failed to get file', error);
      throw error;
    }
  }

  /**
   * Descarga el contenido de un archivo
   */
  async downloadFile(fileId: string): Promise<Buffer> {
    try {
      if (!this.accessToken) {
        await this.authenticate();
      }

      logger.info(`Downloading file: ${fileId}`);

      const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Drive API error: ${response.status} - ${errorText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      logger.info(`Downloaded ${buffer.length} bytes`);
      return buffer;
    } catch (error) {
      logger.error('Failed to download file', error);
      throw error;
    }
  }

  /**
   * Comparte un archivo con un usuario, grupo o dominio
   */
  async shareFile(fileId: string, options: FileShareOptions): Promise<void> {
    try {
      if (!this.accessToken) {
        await this.authenticate();
      }

      logger.info(`Sharing file: ${fileId} with ${options.type}: ${options.emailAddress || options.domain || 'anyone'}`);

      const permission: any = {
        role: options.role,
        type: options.type,
      };

      if (options.emailAddress) {
        permission.emailAddress = options.emailAddress;
      }

      if (options.domain) {
        permission.domain = options.domain;
      }

      const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/permissions`;
      const params = new URLSearchParams();
      if (options.sendNotificationEmail !== undefined) {
        params.append('sendNotificationEmail', options.sendNotificationEmail.toString());
      }

      const response = await fetch(`${url}?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(permission),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Drive API error: ${response.status} - ${errorText}`);
      }

      logger.info('File shared successfully');
    } catch (error) {
      logger.error('Failed to share file', error);
      throw error;
    }
  }

  /**
   * Obtiene los permisos de un archivo
   */
  async getFilePermissions(fileId: string): Promise<DriveFile['permissions']> {
    try {
      if (!this.accessToken) {
        await this.authenticate();
      }

      logger.debug(`Getting permissions for file: ${fileId}`);

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
      return (data.permissions || []).map((perm: any) => ({
        id: perm.id,
        type: perm.type,
        role: perm.role,
        emailAddress: perm.emailAddress,
      }));
    } catch (error) {
      logger.error('Failed to get file permissions', error);
      throw error;
    }
  }

  /**
   * Elimina un permiso de un archivo
   */
  async deleteFilePermission(fileId: string, permissionId: string): Promise<void> {
    try {
      if (!this.accessToken) {
        await this.authenticate();
      }

      logger.info(`Deleting permission ${permissionId} from file: ${fileId}`);

      const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/permissions/${encodeURIComponent(permissionId)}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok && response.status !== 204) {
        const errorText = await response.text();
        throw new Error(`Drive API error: ${response.status} - ${errorText}`);
      }

      logger.info('Permission deleted successfully');
    } catch (error) {
      logger.error('Failed to delete file permission', error);
      throw error;
    }
  }

  /**
   * Obtiene archivos en una carpeta específica
   */
  async listFilesInFolder(folderId: string, options: {
    pageSize?: number;
    pageToken?: string;
    orderBy?: string;
  } = {}): Promise<DriveFileList> {
    try {
      logger.info(`Listing files in folder: ${folderId}`);

      return this.searchFiles(`'${folderId}' in parents`, options);
    } catch (error) {
      logger.error('Failed to list files in folder', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las carpetas del usuario
   */
  async listFolders(options: {
    pageSize?: number;
    pageToken?: string;
  } = {}): Promise<DriveFileList> {
    try {
      logger.info('Listing folders...');

      return this.searchFiles("mimeType = 'application/vnd.google-apps.folder'", options);
    } catch (error) {
      logger.error('Failed to list folders', error);
      throw error;
    }
  }
}

