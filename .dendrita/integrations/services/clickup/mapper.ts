/**
 * Mapper para convertir entre estructura ClickUp y dendrita
 * Proporciona funciones bidireccionales para mapear datos
 */

import {
  ClickUpWorkspace,
  ClickUpSpace,
  ClickUpList,
  ClickUpTask,
  ClickUpStatus,
} from './client';
import { createLogger } from '../../utils/logger';

const logger = createLogger('ClickUpMapper');

/**
 * Estructura de datos de dendrita
 */
export interface DendritaProject {
  workspace: string;
  projectName: string;
  masterPlan?: {
    summary?: string;
    phases?: string[];
    metrics?: string[];
    timeline?: string;
    risks?: string[];
  };
  currentContext?: {
    progress?: string;
    decisions?: string[];
    nextSteps?: string[];
  };
  tasks: DendritaTask[];
}

export interface DendritaTask {
  id?: string;
  name: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  completed: boolean;
  dueDate?: string;
  assignee?: string;
  tags?: string[];
  parent?: string;
  order?: number;
}

/**
 * Mapea un workspace de ClickUp a un workspace de dendrita
 */
export function mapClickUpWorkspaceToDendrita(
  workspace: ClickUpWorkspace
): string {
  return workspace.name;
}

/**
 * Mapea un space de ClickUp a un proyecto de dendrita
 */
export function mapClickUpSpaceToDendritaProject(
  workspace: ClickUpWorkspace,
  space: ClickUpSpace,
  tasks: ClickUpTask[] = []
): DendritaProject {
  const dendritaTasks = tasks.map(mapClickUpTaskToDendrita);

  return {
    workspace: workspace.name,
    projectName: space.name,
    tasks: dendritaTasks,
  };
}

/**
 * Mapea una tarea de ClickUp a una tarea de dendrita
 */
export function mapClickUpTaskToDendrita(task: ClickUpTask): DendritaTask {
  // Mapear estado
  let status: 'pending' | 'in_progress' | 'completed' | 'cancelled' = 'pending';
  if (task.status) {
    const statusType = task.status.type?.toLowerCase() || '';
    if (statusType === 'closed' || task.archived) {
      status = task.status.status === 'complete' ? 'completed' : 'cancelled';
    } else if (statusType === 'open') {
      status = 'in_progress';
    }
  }

  // Verificar si está completada
  const completed =
    status === 'completed' || !!task.date_done || !!task.date_closed;

  return {
    id: task.id,
    name: task.name,
    description: task.description,
    status,
    completed,
    dueDate: task.due_date ? new Date(task.due_date).toISOString() : undefined,
    assignee: task.assignees?.[0]?.email || task.assignees?.[0]?.username,
    tags: task.tags?.map((tag) => tag.name),
    parent: task.parent,
    order: parseInt(task.orderindex) || undefined,
  };
}

/**
 * Mapea un proyecto de dendrita a un space de ClickUp (para crear/actualizar)
 */
export function mapDendritaProjectToClickUpSpace(
  project: DendritaProject
): Partial<ClickUpSpace> {
  return {
    name: project.projectName,
    // Nota: ClickUp no permite crear spaces directamente via API
    // Esto retorna la estructura que se usaría si fuera posible
  };
}

/**
 * Mapea una tarea de dendrita a una tarea de ClickUp (para crear/actualizar)
 */
export function mapDendritaTaskToClickUp(task: DendritaTask): {
  name: string;
  description?: string;
  status?: string;
  priority?: number;
  due_date?: number;
  due_date_time?: boolean;
  assignees?: string[];
  tags?: string[];
  parent?: string;
} {
  // Mapear estado dendrita a ClickUp
  // Nota: ClickUp requiere IDs de estado, no nombres
  // Esto retorna un objeto parcial que requiere configuración adicional

  let priority: number | undefined;
  // Mapear prioridad basada en tags o contexto (necesita configuración)

  return {
    name: task.name,
    description: task.description,
    // status: se requiere el ID del estado en ClickUp
    priority,
    due_date: task.dueDate
      ? Math.floor(new Date(task.dueDate).getTime() / 1000) * 1000
      : undefined,
    due_date_time: !!task.dueDate,
    // assignees: se requiere el ID del usuario en ClickUp
    tags: task.tags,
    parent: task.parent,
  };
}

/**
 * Obtiene el estado de ClickUp correspondiente a un estado de dendrita
 * Nota: Esto requiere conocer los estados disponibles en el workspace/space
 */
export function mapDendritaStatusToClickUpStatus(
  dendritaStatus: DendritaTask['status'],
  availableStatuses: ClickUpStatus[]
): ClickUpStatus | undefined {
  const statusMap: Record<string, string[]> = {
    pending: ['to do', 'todo', 'open', 'backlog'],
    in_progress: ['in progress', 'inprogress', 'doing', 'work in progress'],
    completed: ['complete', 'done', 'closed'],
    cancelled: ['cancelled', 'canceled', 'cancelled'],
  };

  const searchTerms = statusMap[dendritaStatus] || [];
  const status = availableStatuses.find((s) =>
    searchTerms.some((term) =>
      s.status?.toLowerCase().includes(term.toLowerCase())
    )
  );

  return status;
}

/**
 * Obtiene el estado de dendrita correspondiente a un estado de ClickUp
 */
export function mapClickUpStatusToDendrita(
  clickUpStatus: ClickUpStatus
): DendritaTask['status'] {
  const statusType = clickUpStatus.type?.toLowerCase() || '';
  const statusName = clickUpStatus.status?.toLowerCase() || '';

  if (statusType === 'closed' || statusName.includes('complete')) {
    return 'completed';
  }

  if (statusName.includes('cancel')) {
    return 'cancelled';
  }

  if (statusType === 'open' || statusName.includes('progress')) {
    return 'in_progress';
  }

  return 'pending';
}

