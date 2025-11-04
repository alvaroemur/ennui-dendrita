/**
 * Cliente API para Asana
 * Proporciona métodos para interactuar con la API de Asana
 */

import { BaseService } from '../base/service.interface';
import { AsanaAuth } from './auth';
import { createLogger } from '../../utils/logger';
import { handleApiError, RateLimitError } from '../../utils/error-handler';

const logger = createLogger('AsanaClient');

export interface AsanaWorkspace {
  gid: string;
  name: string;
  resource_type: string;
}

export interface AsanaProject {
  gid: string;
  name: string;
  resource_type: string;
  notes?: string;
  color?: string;
  archived: boolean;
  created_at: string;
  modified_at: string;
  due_date?: string;
  due_on?: string;
  start_on?: string;
  current_status?: {
    gid: string;
    color: string;
    title: string;
  };
  public: boolean;
  owner?: {
    gid: string;
    name: string;
    email: string;
  };
  workspace: {
    gid: string;
    name: string;
  };
  team?: {
    gid: string;
    name: string;
  };
}

export interface AsanaTask {
  gid: string;
  name: string;
  resource_type: string;
  notes?: string;
  completed: boolean;
  due_on?: string;
  due_at?: string;
  start_on?: string;
  start_at?: string;
  created_at: string;
  modified_at: string;
  assignee?: {
    gid: string;
    name: string;
    email: string;
  };
  assignee_status?: string;
  completed_at?: string;
  created_by?: {
    gid: string;
    name: string;
    email: string;
  };
  followers: Array<{
    gid: string;
    name: string;
    email: string;
  }>;
  tags: Array<{
    gid: string;
    name: string;
    color?: string;
  }>;
  projects: Array<{
    gid: string;
    name: string;
  }>;
  parent?: {
    gid: string;
    name: string;
  };
  custom_fields?: Array<{
    gid: string;
    name: string;
    type: string;
    value?: any;
  }>;
  dependencies?: Array<{
    gid: string;
    name: string;
  }>;
  dependents?: Array<{
    gid: string;
    name: string;
  }>;
}

export interface AsanaStatus {
  gid: string;
  color: string;
  enabled: boolean;
  resource_type: string;
  text: string;
}

export class AsanaClient extends BaseService {
  name = 'Asana';
  private baseUrl = 'https://app.asana.com/api/1.0';

  isConfigured(): boolean {
    return AsanaAuth.isConfigured();
  }

  async authenticate(): Promise<void> {
    try {
      logger.info('Authenticating with Asana...');

      if (!AsanaAuth.isConfigured()) {
        throw new Error('Asana credentials not configured');
      }

      // Verificar que el token funciona haciendo una request simple
      await this.getWorkspaces();
      logger.info('Asana authentication successful');
    } catch (error) {
      logger.error('Asana authentication failed', error);
      throw error;
    }
  }

  /**
   * Realiza una request a la API de Asana con manejo de errores
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const headers = {
        ...AsanaAuth.getAuthHeaders(),
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
        const rateLimitInfo = response.headers.get('X-RateLimit-Info');
        throw new RateLimitError(
          'Asana',
          retryAfter ? parseInt(retryAfter) : undefined
        );
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Asana API error: ${response.status} - ${JSON.stringify(errorData)}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      handleApiError('Asana', endpoint, error);
      throw error;
    }
  }

  /**
   * Obtiene todos los workspaces del usuario
   */
  async getWorkspaces(): Promise<AsanaWorkspace[]> {
    try {
      logger.info('Fetching Asana workspaces...');
      const data = await this.request<{ data: AsanaWorkspace[] }>('/workspaces');
      return data.data || [];
    } catch (error) {
      logger.error('Failed to fetch workspaces', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los proyectos de un workspace
   */
  async getProjects(workspaceId: string, archived = false): Promise<AsanaProject[]> {
    try {
      logger.info(`Fetching projects for workspace: ${workspaceId}`);
      const params = new URLSearchParams({
        workspace: workspaceId,
        archived: archived.toString(),
        opt_fields: 'gid,name,notes,color,archived,created_at,modified_at,due_date,due_on,start_on,current_status,public,owner,workspace,team',
      });
      const data = await this.request<{ data: AsanaProject[] }>(
        `/projects?${params.toString()}`
      );
      return data.data || [];
    } catch (error) {
      logger.error('Failed to fetch projects', error);
      throw error;
    }
  }

  /**
   * Obtiene un proyecto específico por ID
   */
  async getProject(projectId: string): Promise<AsanaProject> {
    try {
      logger.info(`Fetching project: ${projectId}`);
      const params = new URLSearchParams({
        opt_fields: 'gid,name,notes,color,archived,created_at,modified_at,due_date,due_on,start_on,current_status,public,owner,workspace,team',
      });
      const data = await this.request<{ data: AsanaProject }>(
        `/projects/${projectId}?${params.toString()}`
      );
      return data.data;
    } catch (error) {
      logger.error('Failed to fetch project', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las tareas de un proyecto
   */
  async getTasks(projectId: string, completed = false): Promise<AsanaTask[]> {
    try {
      logger.info(`Fetching tasks for project: ${projectId}`);
      const params = new URLSearchParams({
        project: projectId,
        completed: completed.toString(),
        opt_fields: 'gid,name,notes,completed,due_on,due_at,start_on,start_at,created_at,modified_at,assignee,assignee_status,completed_at,created_by,followers,tags,projects,parent,custom_fields',
      });
      const data = await this.request<{ data: AsanaTask[] }>(
        `/tasks?${params.toString()}`
      );
      return data.data || [];
    } catch (error) {
      logger.error('Failed to fetch tasks', error);
      throw error;
    }
  }

  /**
   * Obtiene una tarea específica por ID
   */
  async getTask(taskId: string): Promise<AsanaTask> {
    try {
      logger.info(`Fetching task: ${taskId}`);
      const params = new URLSearchParams({
        opt_fields: 'gid,name,notes,completed,due_on,due_at,start_on,start_at,created_at,modified_at,assignee,assignee_status,completed_at,created_by,followers,tags,projects,parent,custom_fields',
      });
      const data = await this.request<{ data: AsanaTask }>(
        `/tasks/${taskId}?${params.toString()}`
      );
      return data.data;
    } catch (error) {
      logger.error('Failed to fetch task', error);
      throw error;
    }
  }

  /**
   * Crea una nueva tarea
   */
  async createTask(task: {
    name: string;
    notes?: string;
    workspace: string;
    projects?: string[];
    assignee?: string;
    due_on?: string;
    due_at?: string;
    start_on?: string;
    start_at?: string;
    tags?: string[];
    parent?: string;
  }): Promise<AsanaTask> {
    try {
      logger.info('Creating task...');
      const data = await this.request<{ data: AsanaTask }>('/tasks', {
        method: 'POST',
        body: JSON.stringify({ data: task }),
      });
      return data.data;
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
    notes?: string;
    completed?: boolean;
    assignee?: string;
    due_on?: string;
    due_at?: string;
    start_on?: string;
    start_at?: string;
    tags?: string[];
    parent?: string;
  }): Promise<AsanaTask> {
    try {
      logger.info(`Updating task: ${taskId}`);
      const data = await this.request<{ data: AsanaTask }>(`/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ data: updates }),
      });
      return data.data;
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
      await this.request(`/tasks/${taskId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      logger.error('Failed to delete task', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo proyecto
   */
  async createProject(project: {
    name: string;
    workspace: string;
    notes?: string;
    color?: string;
    due_on?: string;
    start_on?: string;
    public?: boolean;
  }): Promise<AsanaProject> {
    try {
      logger.info('Creating project...');
      const data = await this.request<{ data: AsanaProject }>('/projects', {
        method: 'POST',
        body: JSON.stringify({ data: project }),
      });
      return data.data;
    } catch (error) {
      logger.error('Failed to create project', error);
      throw error;
    }
  }

  /**
   * Actualiza un proyecto existente
   */
  async updateProject(projectId: string, updates: {
    name?: string;
    notes?: string;
    color?: string;
    archived?: boolean;
    due_on?: string;
    start_on?: string;
    public?: boolean;
  }): Promise<AsanaProject> {
    try {
      logger.info(`Updating project: ${projectId}`);
      const data = await this.request<{ data: AsanaProject }>(`/projects/${projectId}`, {
        method: 'PUT',
        body: JSON.stringify({ data: updates }),
      });
      return data.data;
    } catch (error) {
      logger.error('Failed to update project', error);
      throw error;
    }
  }
}

