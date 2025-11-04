/**
 * Cliente API para ClickUp
 * Proporciona métodos para interactuar con la API de ClickUp
 */

import { BaseService } from '../base/service.interface';
import { ClickUpAuth } from './auth';
import { createLogger } from '../../utils/logger';
import { handleApiError, RateLimitError } from '../../utils/error-handler';

const logger = createLogger('ClickUpClient');

export interface ClickUpWorkspace {
  id: string;
  name: string;
  color?: string;
  avatar?: string;
}

export interface ClickUpSpace {
  id: string;
  name: string;
  private: boolean;
  color?: string;
  avatar?: string;
  statuses?: ClickUpStatus[];
}

export interface ClickUpStatus {
  id: string;
  status: string;
  type: string;
  orderindex: number;
  color: string;
}

export interface ClickUpList {
  id: string;
  name: string;
  orderindex: number;
  status?: ClickUpStatus;
  priority?: {
    id: string;
    priority: string;
    color: string;
    orderindex: string;
  };
  assignee?: {
    id: string;
    username: string;
    email: string;
  };
  task_count?: number;
  due_date?: string;
  due_date_time?: boolean;
  start_date?: string;
  start_date_time?: boolean;
  folder?: {
    id: string;
    name: string;
    hidden: boolean;
    access: boolean;
  };
  space?: {
    id: string;
    name: string;
    access: boolean;
  };
}

export interface ClickUpTask {
  id: string;
  name: string;
  description?: string;
  status: ClickUpStatus;
  orderindex: string;
  date_created: string;
  date_updated: string;
  date_closed?: string;
  date_done?: string;
  archived: boolean;
  creator: {
    id: string;
    username: string;
    email: string;
  };
  assignees: Array<{
    id: string;
    username: string;
    email: string;
  }>;
  watchers: Array<{
    id: string;
    username: string;
    email: string;
  }>;
  checklists?: Array<{
    id: string;
    task_id: string;
    name: string;
    date_created: string;
    items: Array<{
      id: string;
      name: string;
      orderindex: number;
      assignee?: any;
      resolved: boolean;
    }>;
  }>;
  tags: Array<{
    name: string;
    tag_fg: string;
    tag_bg: string;
  }>;
  parent?: string;
  priority?: {
    id: string;
    priority: string;
    color: string;
    orderindex: string;
  };
  due_date?: string;
  due_date_time?: boolean;
  start_date?: string;
  start_date_time?: boolean;
  points?: number;
  time_estimate?: number;
  time_spent?: number;
  custom_fields?: Array<{
    id: string;
    name: string;
    type: string;
    value?: any;
  }>;
  list?: {
    id: string;
    name: string;
    access: boolean;
  };
  folder?: {
    id: string;
    name: string;
    hidden: boolean;
    access: boolean;
  };
  space?: {
    id: string;
    name: string;
    access: boolean;
  };
  url: string;
}

export class ClickUpClient extends BaseService {
  name = 'ClickUp';
  private baseUrl = 'https://api.clickup.com/api/v2';

  isConfigured(): boolean {
    return ClickUpAuth.isConfigured();
  }

  async authenticate(): Promise<void> {
    try {
      logger.info('Authenticating with ClickUp...');

      if (!ClickUpAuth.isConfigured()) {
        throw new Error('ClickUp credentials not configured');
      }

      // Verificar que el token funciona haciendo una request simple
      await this.getWorkspaces();
      logger.info('ClickUp authentication successful');
    } catch (error) {
      logger.error('ClickUp authentication failed', error);
      throw error;
    }
  }

  /**
   * Realiza una request a la API de ClickUp con manejo de errores
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const headers = {
        ...ClickUpAuth.getAuthHeaders(),
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
          'ClickUp',
          retryAfter ? parseInt(retryAfter) : undefined
        );
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `ClickUp API error: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      handleApiError('ClickUp', endpoint, error);
      throw error;
    }
  }

  /**
   * Obtiene todos los workspaces del usuario
   */
  async getWorkspaces(): Promise<ClickUpWorkspace[]> {
    try {
      logger.info('Fetching ClickUp workspaces...');
      const data = await this.request<{ teams: ClickUpWorkspace[] }>('/team');
      return data.teams || [];
    } catch (error) {
      logger.error('Failed to fetch workspaces', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los spaces de un workspace
   */
  async getSpaces(workspaceId: string): Promise<ClickUpSpace[]> {
    try {
      logger.info(`Fetching spaces for workspace: ${workspaceId}`);
      const data = await this.request<{ spaces: ClickUpSpace[] }>(
        `/team/${workspaceId}/space`
      );
      return data.spaces || [];
    } catch (error) {
      logger.error('Failed to fetch spaces', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las listas de un space
   */
  async getLists(spaceId: string): Promise<ClickUpList[]> {
    try {
      logger.info(`Fetching lists for space: ${spaceId}`);
      const data = await this.request<{ lists: ClickUpList[] }>(
        `/space/${spaceId}/list`
      );
      return data.lists || [];
    } catch (error) {
      logger.error('Failed to fetch lists', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las tareas de una lista
   */
  async getTasks(listId: string, includeClosed = false): Promise<ClickUpTask[]> {
    try {
      logger.info(`Fetching tasks for list: ${listId}`);
      const params = new URLSearchParams({
        include_closed: includeClosed.toString(),
      });
      const data = await this.request<{ tasks: ClickUpTask[] }>(
        `/list/${listId}/task?${params.toString()}`
      );
      return data.tasks || [];
    } catch (error) {
      logger.error('Failed to fetch tasks', error);
      throw error;
    }
  }

  /**
   * Obtiene una tarea específica por ID
   */
  async getTask(taskId: string): Promise<ClickUpTask> {
    try {
      logger.info(`Fetching task: ${taskId}`);
      const data = await this.request<ClickUpTask>(`/task/${taskId}`);
      return data;
    } catch (error) {
      logger.error('Failed to fetch task', error);
      throw error;
    }
  }

  /**
   * Crea una nueva tarea
   */
  async createTask(listId: string, task: {
    name: string;
    description?: string;
    status?: string;
    priority?: number;
    due_date?: number;
    due_date_time?: boolean;
    assignees?: string[];
    tags?: string[];
    parent?: string;
  }): Promise<ClickUpTask> {
    try {
      logger.info(`Creating task in list: ${listId}`);
      const data = await this.request<ClickUpTask>(`/list/${listId}/task`, {
        method: 'POST',
        body: JSON.stringify(task),
      });
      return data;
    } catch (error) {
      logger.error('Failed to create task', error);
      throw error;
    }
  }

  /**
   * Actualiza una tarea existente
   */
  async updateTask(taskId: string, updates: {
    name?: string;
    description?: string;
    status?: string;
    priority?: number;
    due_date?: number;
    due_date_time?: boolean;
    assignees?: { add?: string[]; rem?: string[] };
    tags?: { add?: string[]; rem?: string[] };
  }): Promise<ClickUpTask> {
    try {
      logger.info(`Updating task: ${taskId}`);
      const data = await this.request<ClickUpTask>(`/task/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return data;
    } catch (error) {
      logger.error('Failed to update task', error);
      throw error;
    }
  }

  /**
   * Elimina una tarea
   */
  async deleteTask(taskId: string): Promise<void> {
    try {
      logger.info(`Deleting task: ${taskId}`);
      await this.request(`/task/${taskId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      logger.error('Failed to delete task', error);
      throw error;
    }
  }
}

