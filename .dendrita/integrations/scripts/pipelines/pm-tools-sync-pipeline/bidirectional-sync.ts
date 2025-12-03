/**
 * Motor de sincronización bidireccional genérico
 * Funciona con ClickUp, Asana y Notion
 */

import { SyncConfig, SyncResult, SyncDirection, ProjectManagementTool } from './types';
import { resolveConflict, detectConflict } from './conflict-resolution';
import { createLogger } from '../../../utils/logger';

// Importar clientes
import { ClickUpClient } from '../../../services/clickup/client';
import { AsanaClient } from '../../../services/asana/client';
import { NotionClient } from '../../../services/notion/client';

// Importar mappers
import {
  mapClickUpWorkspaceToDendrita,
  mapClickUpSpaceToDendritaProject,
  mapClickUpTaskToDendrita,
  mapDendritaTaskToClickUp,
  DendritaTask,
} from '../../../services/clickup/mapper';

import {
  mapAsanaWorkspaceToDendrita,
  mapAsanaProjectToDendritaProject,
  mapAsanaTaskToDendrita,
  mapDendritaTaskToAsanaTask,
} from '../../../services/asana/mapper';

import {
  mapNotionDatabaseToDendritaProject,
  mapNotionPageToDendritaTask,
  mapDendritaTaskToNotionPage,
} from '../../../services/notion/mapper';

const logger = createLogger('BidirectionalSync');

/**
 * Motor de sincronización bidireccional
 */
export class BidirectionalSync {
  private config: SyncConfig;

  constructor(config: SyncConfig) {
    this.config = config;
  }

  /**
   * Ejecuta la sincronización según la configuración
   */
  async sync(): Promise<SyncResult> {
    try {
      logger.info(`Starting sync: ${this.config.tool} - ${this.config.direction}`);

      const result: SyncResult = {
        success: true,
        tool: this.config.tool,
        direction: this.config.direction,
        synced: {
          projects: 0,
          tasks: 0,
        },
        errors: [],
        warnings: [],
      };

      switch (this.config.direction) {
        case 'dendrita_to_tool':
          await this.syncDendritaToTool(result);
          break;
        case 'tool_to_dendrita':
          await this.syncToolToDendrita(result);
          break;
        case 'bidirectional':
          await this.syncBidirectional(result);
          break;
      }

      logger.info(`Sync completed: ${result.synced.projects} projects, ${result.synced.tasks} tasks`);
      return result;
    } catch (error) {
      logger.error('Sync failed', error);
      return {
        success: false,
        tool: this.config.tool,
        direction: this.config.direction,
        synced: { projects: 0, tasks: 0 },
        errors: [{ type: 'sync_error', message: String(error) }],
        warnings: [],
      };
    }
  }

  /**
   * Sincroniza desde dendrita hacia la herramienta externa
   */
  private async syncDendritaToTool(result: SyncResult): Promise<void> {
    logger.info('Syncing dendrita → tool');
    // TODO: Implementar sincronización dendrita → tool
    // Esto requiere leer archivos de dendrita y crear/actualizar en la herramienta
    result.warnings.push({
      type: 'not_implemented',
      message: 'dendrita_to_tool sync not yet implemented',
    });
  }

  /**
   * Sincroniza desde la herramienta externa hacia dendrita
   */
  private async syncToolToDendrita(result: SyncResult): Promise<void> {
    logger.info('Syncing tool → dendrita');

    switch (this.config.tool) {
      case 'clickup':
        await this.syncClickUpToDendrita(result);
        break;
      case 'asana':
        await this.syncAsanaToDendrita(result);
        break;
      case 'notion':
        await this.syncNotionToDendrita(result);
        break;
    }
  }

  /**
   * Sincronización bidireccional
   */
  private async syncBidirectional(result: SyncResult): Promise<void> {
    logger.info('Syncing bidirectional');

    // Primero sincronizar desde tool → dendrita
    await this.syncToolToDendrita(result);

    // Luego sincronizar desde dendrita → tool (si hay cambios)
    await this.syncDendritaToTool(result);
  }

  /**
   * Sincroniza desde ClickUp hacia dendrita
   */
  private async syncClickUpToDendrita(result: SyncResult): Promise<void> {
    try {
      const client = new ClickUpClient();
      await client.authenticate();

      const workspaces = await client.getWorkspaces();
      logger.info(`Found ${workspaces.length} ClickUp workspace(s)`);

      for (const workspace of workspaces) {
        const dendritaWorkspace = mapClickUpWorkspaceToDendrita(workspace);

        if (this.config.workspace && dendritaWorkspace !== this.config.workspace) {
          continue; // Filtrar por workspace si está configurado
        }

        const spaces = await client.getSpaces(workspace.id);
        logger.info(`Found ${spaces.length} space(s) in workspace: ${workspace.name}`);

        for (const space of spaces) {
          const lists = await client.getLists(space.id);

          for (const list of lists) {
            const tasks = await client.getTasks(list.id, false);
            const dendritaTasks = tasks.map(mapClickUpTaskToDendrita);

            logger.info(
              `Mapped ${dendritaTasks.length} tasks from space: ${space.name}, list: ${list.name}`
            );

            result.synced.tasks += dendritaTasks.length;
          }

          result.synced.projects += 1;
        }
      }
    } catch (error) {
      logger.error('ClickUp sync failed', error);
      result.errors.push({
        type: 'clickup_sync_error',
        message: String(error),
      });
      result.success = false;
    }
  }

  /**
   * Sincroniza desde Asana hacia dendrita
   */
  private async syncAsanaToDendrita(result: SyncResult): Promise<void> {
    try {
      const client = new AsanaClient();
      await client.authenticate();

      const workspaces = await client.getWorkspaces();
      logger.info(`Found ${workspaces.length} Asana workspace(s)`);

      for (const workspace of workspaces) {
        const dendritaWorkspace = mapAsanaWorkspaceToDendrita(workspace);

        if (this.config.workspace && dendritaWorkspace !== this.config.workspace) {
          continue; // Filtrar por workspace si está configurado
        }

        const projects = await client.getProjects(workspace.gid);
        logger.info(`Found ${projects.length} project(s) in workspace: ${workspace.name}`);

        for (const project of projects) {
          const tasks = await client.getTasks(project.gid, false);
          const dendritaTasks = tasks.map(mapAsanaTaskToDendrita);

          logger.info(`Mapped ${dendritaTasks.length} tasks from project: ${project.name}`);

          result.synced.tasks += dendritaTasks.length;
          result.synced.projects += 1;
        }
      }
    } catch (error) {
      logger.error('Asana sync failed', error);
      result.errors.push({
        type: 'asana_sync_error',
        message: String(error),
      });
      result.success = false;
    }
  }

  /**
   * Sincroniza desde Notion hacia dendrita
   */
  private async syncNotionToDendrita(result: SyncResult): Promise<void> {
    try {
      const client = new NotionClient();
      await client.authenticate();

      const databases = await client.listDatabases();
      logger.info(`Found ${databases.length} Notion database(s)`);

      for (const database of databases) {
        const pages = await client.queryDatabase(database.id);
        const dendritaTasks = pages.map(mapNotionPageToDendritaTask);

        logger.info(
          `Mapped ${dendritaTasks.length} tasks from database: ${database.title.map((t) => t.plain_text).join('')}`
        );

        result.synced.tasks += dendritaTasks.length;
        result.synced.projects += 1;
      }
    } catch (error) {
      logger.error('Notion sync failed', error);
      result.errors.push({
        type: 'notion_sync_error',
        message: String(error),
      });
      result.success = false;
    }
  }
}

/**
 * Crea una instancia de sincronización con la configuración dada
 */
export function createSync(config: SyncConfig): BidirectionalSync {
  return new BidirectionalSync(config);
}

/**
 * Ejecuta una sincronización con la configuración dada
 */
export async function sync(config: SyncConfig): Promise<SyncResult> {
  const sync = createSync(config);
  return await sync.sync();
}

