/**
 * Mapper para convertir entre estructura Asana y dendrita
 * Proporciona funciones bidireccionales para mapear datos
 */

import {
  AsanaWorkspace,
  AsanaProject,
  AsanaTask,
} from './client';
import { createLogger } from '../../utils/logger';
import { DendritaProject, DendritaTask } from '../clickup/mapper';

const logger = createLogger('AsanaMapper');

/**
 * Mapea un workspace de Asana a un workspace de dendrita
 */
export function mapAsanaWorkspaceToDendrita(
  workspace: AsanaWorkspace
): string {
  return workspace.name;
}

/**
 * Mapea un proyecto de Asana a un proyecto de dendrita
 */
export function mapAsanaProjectToDendritaProject(
  workspace: AsanaWorkspace,
  project: AsanaProject,
  tasks: AsanaTask[] = []
): DendritaProject {
  const dendritaTasks = tasks.map(mapAsanaTaskToDendrita);

  return {
    workspace: workspace.name,
    projectName: project.name,
    masterPlan: project.notes ? {
      summary: project.notes,
    } : undefined,
    tasks: dendritaTasks,
  };
}

/**
 * Mapea una tarea de Asana a una tarea de dendrita
 */
export function mapAsanaTaskToDendrita(task: AsanaTask): DendritaTask {
  // Mapear estado
  let status: 'pending' | 'in_progress' | 'completed' | 'cancelled' = 'pending';
  if (task.completed) {
    status = 'completed';
  } else if (task.assignee_status === 'upcoming' || task.start_on) {
    status = 'in_progress';
  }

  // Verificar si está completada
  const completed = task.completed || !!task.completed_at;

  return {
    id: task.gid,
    name: task.name,
    description: task.notes,
    status,
    completed,
    dueDate: task.due_on || task.due_at ? new Date(task.due_on || task.due_at || '').toISOString() : undefined,
    assignee: task.assignee?.email || task.assignee?.name,
    tags: task.tags?.map((tag) => tag.name),
    parent: task.parent?.gid,
  };
}

/**
 * Mapea un proyecto de dendrita a un proyecto de Asana (para crear/actualizar)
 */
export function mapDendritaProjectToAsanaProject(
  project: DendritaProject,
  workspaceId: string
): {
  name: string;
  workspace: string;
  notes?: string;
  public?: boolean;
} {
  return {
    name: project.projectName,
    workspace: workspaceId,
    notes: project.masterPlan?.summary || project.currentContext?.progress,
    public: false,
  };
}

/**
 * Mapea una tarea de dendrita a una tarea de Asana (para crear/actualizar)
 */
export function mapDendritaTaskToAsanaTask(
  task: DendritaTask,
  workspaceId: string,
  projectId?: string
): {
  name: string;
  workspace: string;
  notes?: string;
  completed?: boolean;
  projects?: string[];
  due_on?: string;
  tags?: string[];
  parent?: string;
} {
  return {
    name: task.name,
    workspace: workspaceId,
    notes: task.description,
    completed: task.completed || task.status === 'completed',
    projects: projectId ? [projectId] : undefined,
    due_on: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : undefined,
    tags: task.tags,
    parent: task.parent,
  };
}

/**
 * Obtiene el estado de dendrita correspondiente a una tarea de Asana
 */
export function mapAsanaTaskStatusToDendrita(task: AsanaTask): DendritaTask['status'] {
  if (task.completed || task.completed_at) {
    return 'completed';
  }

  if (task.assignee_status === 'upcoming' || task.start_on) {
    return 'in_progress';
  }

  return 'pending';
}

