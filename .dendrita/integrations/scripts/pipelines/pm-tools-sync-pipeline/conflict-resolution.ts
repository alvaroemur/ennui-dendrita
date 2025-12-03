/**
 * Resolución de conflictos cuando ambos lados (dendrita y herramienta externa) cambian
 */

import { SyncConflict, SyncConfig } from './types';
import { DendritaTask } from '../../../services/clickup/mapper';
import { createLogger } from '../../../utils/logger';

const logger = createLogger('ConflictResolution');

/**
 * Estrategia de resolución de conflictos
 */
export type ConflictResolutionStrategy =
  | 'dendrita_wins'
  | 'tool_wins'
  | 'merge'
  | 'manual'
  | 'newer_wins';

/**
 * Resuelve un conflicto según la estrategia configurada
 */
export function resolveConflict(
  conflict: SyncConflict,
  strategy: ConflictResolutionStrategy = 'newer_wins'
): {
  resolved: boolean;
  data: DendritaTask | null;
  reason: string;
} {
  logger.info(`Resolving conflict for ${conflict.resourceType}: ${conflict.resource}`);

  switch (strategy) {
    case 'dendrita_wins':
      logger.info('Using dendrita version (dendrita_wins)');
      return {
        resolved: true,
        data: conflict.dendritaVersion.data as DendritaTask,
        reason: 'dendrita_wins - Using dendrita version',
      };

    case 'tool_wins':
      logger.info('Using tool version (tool_wins)');
      return {
        resolved: true,
        data: null, // El mapper de la herramienta debe convertir esto
        reason: 'tool_wins - Using tool version',
      };

    case 'newer_wins':
      const dendritaTime = new Date(conflict.dendritaVersion.lastModified).getTime();
      const toolTime = new Date(conflict.toolVersion.lastModified).getTime();

      if (dendritaTime > toolTime) {
        logger.info('Using dendrita version (newer_wins - dendrita is newer)');
        return {
          resolved: true,
          data: conflict.dendritaVersion.data as DendritaTask,
          reason: 'newer_wins - Dendrita version is newer',
        };
      } else {
        logger.info('Using tool version (newer_wins - tool is newer)');
        return {
          resolved: true,
          data: null, // El mapper de la herramienta debe convertir esto
          reason: 'newer_wins - Tool version is newer',
        };
      }

    case 'merge':
      logger.info('Attempting to merge both versions');
      return mergeVersions(conflict);

    case 'manual':
      logger.warn('Manual resolution required - conflict not resolved');
      return {
        resolved: false,
        data: null,
        reason: 'manual - Requires manual intervention',
      };

    default:
      logger.warn(`Unknown strategy: ${strategy}, using newer_wins`);
      return resolveConflict(conflict, 'newer_wins');
  }
}

/**
 * Intenta fusionar ambas versiones
 */
function mergeVersions(conflict: SyncConflict): {
  resolved: boolean;
  data: DendritaTask | null;
  reason: string;
} {
  if (conflict.resourceType !== 'task') {
    logger.warn('Merge only supported for tasks');
    return {
      resolved: false,
      data: null,
      reason: 'merge - Only supported for tasks',
    };
  }

  const dendritaTask = conflict.dendritaVersion.data as DendritaTask;
  const toolTask = conflict.toolVersion.data as any;

  // Intentar fusionar: usar el nombre más largo, descripción más completa, etc.
  const merged: DendritaTask = {
    ...dendritaTask,
    name: dendritaTask.name.length > (toolTask.name?.length || 0)
      ? dendritaTask.name
      : toolTask.name || dendritaTask.name,
    description: dendritaTask.description || toolTask.notes || toolTask.description || undefined,
    // Usar la fecha más reciente
    dueDate: dendritaTask.dueDate || toolTask.due_on || toolTask.due_date || undefined,
    // Usar el estado más avanzado (completed > in_progress > pending)
    status: getMoreAdvancedStatus(dendritaTask.status, toolTask),
    completed: dendritaTask.completed || toolTask.completed || false,
    // Combinar tags
    tags: [
      ...(dendritaTask.tags || []),
      ...(toolTask.tags?.map((t: any) => t.name || t) || []),
    ].filter((tag, index, self) => self.indexOf(tag) === index), // Remover duplicados
  };

  logger.info('Merge completed successfully');
  return {
    resolved: true,
    data: merged,
    reason: 'merge - Successfully merged both versions',
  };
}

/**
 * Obtiene el estado más avanzado entre dos estados
 */
function getMoreAdvancedStatus(
  dendritaStatus: DendritaTask['status'],
  toolTask: any
): DendritaTask['status'] {
  const statusPriority: Record<DendritaTask['status'], number> = {
    completed: 3,
    in_progress: 2,
    pending: 1,
    cancelled: 0,
  };

  let toolStatus: DendritaTask['status'] = 'pending';
  if (toolTask.completed || toolTask.completed_at) {
    toolStatus = 'completed';
  } else if (toolTask.status?.type === 'open' || toolTask.assignee_status === 'upcoming') {
    toolStatus = 'in_progress';
  }

  return statusPriority[dendritaStatus] > statusPriority[toolStatus]
    ? dendritaStatus
    : toolStatus;
}

/**
 * Detecta si hay un conflicto comparando las versiones
 */
export function detectConflict(
  dendritaData: DendritaTask,
  toolData: any,
  dendritaLastModified: string,
  toolLastModified: string
): SyncConflict | null {
  const dendritaTime = new Date(dendritaLastModified).getTime();
  const toolTime = new Date(toolLastModified).getTime();

  // Si ambas versiones fueron modificadas después de la última sincronización, hay conflicto
  // (Esto es una simplificación - en producción necesitarías trackear el último sync)
  const timeDiff = Math.abs(dendritaTime - toolTime);
  const conflictThreshold = 1000; // 1 segundo de diferencia

  if (timeDiff < conflictThreshold) {
    // Posible conflicto si ambos lados tienen cambios
    if (dendritaData.name !== (toolData.name || toolData.title) ||
        dendritaData.description !== (toolData.notes || toolData.description)) {
      return {
        resource: dendritaData.id || toolData.id || toolData.gid || 'unknown',
        resourceType: 'task',
        dendritaVersion: {
          id: dendritaData.id || 'unknown',
          name: dendritaData.name,
          lastModified: dendritaLastModified,
          data: dendritaData,
        },
        toolVersion: {
          id: toolData.id || toolData.gid || 'unknown',
          name: toolData.name || toolData.title || 'unknown',
          lastModified: toolLastModified,
          data: toolData,
        },
      };
    }
  }

  return null;
}

