/**
 * Cliente API para Notion
 * Proporciona métodos para interactuar con la API de Notion
 */

import { BaseService } from '../base/service.interface';
import { NotionAuth } from './auth';
import { createLogger } from '../../utils/logger';
import { handleApiError, RateLimitError } from '../../utils/error-handler';

const logger = createLogger('NotionClient');

export interface NotionDatabase {
  id: string;
  object: 'database';
  created_time: string;
  last_edited_time: string;
  title: Array<{
    type: string;
    text: {
      content: string;
      link?: string;
    };
    plain_text: string;
    href?: string;
  }>;
  properties: Record<string, any>;
  url: string;
}

export interface NotionPage {
  id: string;
  object: 'page';
  created_time: string;
  last_edited_time: string;
  archived: boolean;
  icon?: {
    type: string;
    emoji?: string;
    file?: { url: string };
    external?: { url: string };
  };
  cover?: {
    type: string;
    file?: { url: string };
    external?: { url: string };
  };
  properties: Record<string, any>;
  parent: {
    type: 'database_id' | 'page_id' | 'workspace' | 'block_id';
    database_id?: string;
    page_id?: string;
    workspace?: boolean;
    block_id?: string;
  };
  url: string;
}

export interface NotionBlock {
  id: string;
  object: 'block';
  type: string;
  created_time: string;
  last_edited_time: string;
  archived: boolean;
  has_children: boolean;
  [key: string]: any; // Different block types have different structures
}

export interface NotionUser {
  object: 'user';
  id: string;
  name?: string;
  avatar_url?: string;
  type?: 'person' | 'bot';
  person?: {
    email?: string;
  };
  bot?: {
    owner?: {
      type: 'user' | 'workspace';
      user?: NotionUser;
    };
    workspace_name?: string;
  };
}

export class NotionClient extends BaseService {
  name = 'Notion';
  private baseUrl = 'https://api.notion.com/v1';

  isConfigured(): boolean {
    return NotionAuth.isConfigured();
  }

  async authenticate(): Promise<void> {
    try {
      logger.info('Authenticating with Notion...');

      if (!NotionAuth.isConfigured()) {
        throw new Error('Notion credentials not configured');
      }

      // Verificar que el token funciona haciendo una request simple
      await this.listDatabases();
      logger.info('Notion authentication successful');
    } catch (error) {
      logger.error('Notion authentication failed', error);
      throw error;
    }
  }

  /**
   * Realiza una request a la API de Notion con manejo de errores
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const headers = {
        ...NotionAuth.getAuthHeaders(),
        ...options.headers,
      };

      const url = `${this.baseUrl}${endpoint}`;
      logger.debug(`Making request to: ${url}`);

      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Manejar rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        throw new RateLimitError(
          'Notion',
          retryAfter ? parseInt(retryAfter) : undefined
        );
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Notion API error: ${response.status} - ${JSON.stringify(errorData)}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      handleApiError('Notion', endpoint, error);
      throw error;
    }
  }

  /**
   * Lista todas las databases accesibles
   */
  async listDatabases(): Promise<NotionDatabase[]> {
    try {
      logger.info('Fetching Notion databases...');
      const data = await this.request<{ results: NotionDatabase[] }>('/search', {
        method: 'POST',
        body: JSON.stringify({
          filter: {
            property: 'object',
            value: 'database',
          },
        }),
      });
      return data.results || [];
    } catch (error) {
      logger.error('Failed to fetch databases', error);
      throw error;
    }
  }

  /**
   * Obtiene una database específica por ID
   */
  async getDatabase(databaseId: string): Promise<NotionDatabase> {
    try {
      logger.info(`Fetching database: ${databaseId}`);
      const data = await this.request<NotionDatabase>(`/databases/${databaseId}`);
      return data;
    } catch (error) {
      logger.error('Failed to fetch database', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las páginas de una database
   */
  async queryDatabase(
    databaseId: string,
    filter?: any,
    sorts?: any[]
  ): Promise<NotionPage[]> {
    try {
      logger.info(`Querying database: ${databaseId}`);
      const body: any = {};
      if (filter) body.filter = filter;
      if (sorts) body.sorts = sorts;

      const data = await this.request<{ results: NotionPage[] }>(
        `/databases/${databaseId}/query`,
        {
          method: 'POST',
          body: JSON.stringify(body),
        }
      );
      return data.results || [];
    } catch (error) {
      logger.error('Failed to query database', error);
      throw error;
    }
  }

  /**
   * Obtiene una página específica por ID
   */
  async getPage(pageId: string): Promise<NotionPage> {
    try {
      logger.info(`Fetching page: ${pageId}`);
      const data = await this.request<NotionPage>(`/pages/${pageId}`);
      return data;
    } catch (error) {
      logger.error('Failed to fetch page', error);
      throw error;
    }
  }

  /**
   * Obtiene los bloques de una página
   */
  async getPageBlocks(pageId: string): Promise<NotionBlock[]> {
    try {
      logger.info(`Fetching blocks for page: ${pageId}`);
      const blocks: NotionBlock[] = [];
      let cursor: string | undefined;

      do {
        const params = cursor ? `?start_cursor=${cursor}` : '';
        const data = await this.request<{
          results: NotionBlock[];
          next_cursor: string | null;
          has_more: boolean;
        }>(`/blocks/${pageId}/children${params}`);

        blocks.push(...(data.results || []));
        cursor = data.next_cursor || undefined;
      } while (cursor);

      return blocks;
    } catch (error) {
      logger.error('Failed to fetch blocks', error);
      throw error;
    }
  }

  /**
   * Crea una nueva página en una database
   */
  async createPage(databaseId: string, page: {
    properties: Record<string, any>;
    children?: NotionBlock[];
  }): Promise<NotionPage> {
    try {
      logger.info(`Creating page in database: ${databaseId}`);
      const data = await this.request<NotionPage>('/pages', {
        method: 'POST',
        body: JSON.stringify({
          parent: {
            database_id: databaseId,
          },
          ...page,
        }),
      });
      return data;
    } catch (error) {
      logger.error('Failed to create page', error);
      throw error;
    }
  }

  /**
   * Actualiza una página existente
   */
  async updatePage(pageId: string, updates: {
    properties?: Record<string, any>;
    archived?: boolean;
  }): Promise<NotionPage> {
    try {
      logger.info(`Updating page: ${pageId}`);
      const data = await this.request<NotionPage>(`/pages/${pageId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      return data;
    } catch (error) {
      logger.error('Failed to update page', error);
      throw error;
    }
  }

  /**
   * Archiva una página
   */
  async archivePage(pageId: string): Promise<NotionPage> {
    try {
      logger.info(`Archiving page: ${pageId}`);
      return await this.updatePage(pageId, { archived: true });
    } catch (error) {
      logger.error('Failed to archive page', error);
      throw error;
    }
  }

  /**
   * Obtiene el contenido de texto de un bloque
   */
  getBlockText(block: NotionBlock): string {
    const type = block.type;
    if (block[type]?.rich_text) {
      return block[type].rich_text
        .map((text: any) => text.plain_text)
        .join('');
    }
    return '';
  }

  /**
   * Obtiene el contenido de texto de una página desde sus bloques
   */
  async getPageContent(pageId: string): Promise<string> {
    try {
      const blocks = await this.getPageBlocks(pageId);
      return blocks.map((block) => this.getBlockText(block)).join('\n');
    } catch (error) {
      logger.error('Failed to get page content', error);
      throw error;
    }
  }
}

