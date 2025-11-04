/**
 * Tipos para el sistema de sincronización bidireccional
 */

import { DendritaProject, DendritaTask } from '../services/clickup/mapper';

/**
 * Tipo de herramienta de gestión de proyectos
 */
export type ProjectManagementTool = 'clickup' | 'asana' | 'notion';

/**
 * Dirección de sincronización
 */
export type SyncDirection = 'dendrita_to_tool' | 'tool_to_dendrita' | 'bidirectional';

/**
 * Estrategia de sincronización
 */
export type SyncStrategy = 'manual' | 'automatic' | 'scheduled';

/**
 * Resultado de sincronización
 */
export interface SyncResult {
  success: boolean;
  tool: ProjectManagementTool;
  direction: SyncDirection;
  synced: {
    projects: number;
    tasks: number;
  };
  errors: Array<{
    type: string;
    message: string;
    resource?: string;
  }>;
  warnings: Array<{
    type: string;
    message: string;
    resource?: string;
  }>;
}

/**
 * Conflicto de sincronización
 */
export interface SyncConflict {
  resource: string;
  resourceType: 'project' | 'task';
  dendritaVersion: {
    id: string;
    name: string;
    lastModified: string;
    data: DendritaProject | DendritaTask;
  };
  toolVersion: {
    id: string;
    name: string;
    lastModified: string;
    data: any;
  };
  resolution?: 'dendrita_wins' | 'tool_wins' | 'merge' | 'manual';
}

/**
 * Configuración de sincronización
 */
export interface SyncConfig {
  tool: ProjectManagementTool;
  direction: SyncDirection;
  strategy: SyncStrategy;
  workspace: string;
  projectMapping?: Record<string, string>; // dendrita project → tool project ID
  conflictResolution?: 'dendrita_wins' | 'tool_wins' | 'merge' | 'manual';
  syncInterval?: number; // en segundos, para scheduled
}

