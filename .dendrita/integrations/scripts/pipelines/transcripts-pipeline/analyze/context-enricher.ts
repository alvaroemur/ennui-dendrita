#!/usr/bin/env npx ts-node
/**
 * Módulo para enriquecer análisis de transcripciones con contexto
 * Detecta y carga contexto según nivel (project, workspace, user)
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  ProjectContext,
  WorkspaceContext,
  UserContext,
} from '../../../utils/context-types';
import {
  extractWorkspace,
  extractProject,
  loadProjectContext,
  loadWorkspaceContext,
  loadUserContext,
} from '../utils/context-loader';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('ContextEnricher');

export type ContextLevel = 'project' | 'workspace' | 'user';

export interface ContextInfo {
  level: ContextLevel;
  workspace?: string;
  project?: string;
  context: {
    project?: ProjectContext;
    workspace?: WorkspaceContext;
    user?: UserContext;
  };
  summary: string;
}

export interface ContextDetectionOptions {
  transcriptPath?: string;
  meetingNotesPath?: string;
  workspace?: string;
  project?: string;
}

/**
 * Detecta el nivel de contexto desde la ruta o parámetros
 */
export function detectContextLevel(options: ContextDetectionOptions): {
  level: ContextLevel;
  workspace?: string;
  project?: string;
} {
  // Prioridad 1: Parámetros explícitos
  if (options.workspace && options.project) {
    return { level: 'project', workspace: options.workspace, project: options.project };
  }
  if (options.workspace) {
    return { level: 'workspace', workspace: options.workspace };
  }

  // Prioridad 2: Desde meeting-notes.md si está disponible
  if (options.meetingNotesPath) {
    const workspace = extractWorkspace(options.meetingNotesPath);
    const project = extractProject(options.meetingNotesPath);
    
    if (workspace && project) {
      return { level: 'project', workspace, project };
    }
    if (workspace) {
      return { level: 'workspace', workspace };
    }
  }

  // Prioridad 3: Desde transcriptPath
  if (options.transcriptPath) {
    const workspace = extractWorkspace(options.transcriptPath);
    const project = extractProject(options.transcriptPath);
    
    if (workspace && project) {
      return { level: 'project', workspace, project };
    }
    if (workspace) {
      return { level: 'workspace', workspace };
    }
  }

  // Fallback: user-level
  return { level: 'user' };
}

/**
 * Carga contexto según nivel detectado
 */
export function loadContext(
  level: ContextLevel,
  workspace?: string,
  project?: string
): ContextInfo {
  const contextInfo: ContextInfo = {
    level,
    workspace,
    project,
    context: {},
    summary: '',
  };

  try {
    switch (level) {
      case 'project':
        if (workspace && project) {
          const projectContext = loadProjectContext(workspace, project);
          if (projectContext) {
            contextInfo.context.project = projectContext;
            contextInfo.summary = generateProjectContextSummary(projectContext);
          }
        }
        break;

      case 'workspace':
        if (workspace) {
          const workspaceContext = loadWorkspaceContext(workspace);
          if (workspaceContext) {
            contextInfo.context.workspace = workspaceContext;
            contextInfo.summary = generateWorkspaceContextSummary(workspaceContext);
          }
        }
        break;

      case 'user':
        const userContext = loadUserContext();
        if (userContext) {
          contextInfo.context.user = userContext;
          contextInfo.summary = generateUserContextSummary(userContext);
        }
        break;
    }
  } catch (error: any) {
    logger.error(`Error loading context: ${error instanceof Error ? error.message : String(error)}`);
  }

  return contextInfo;
}

/**
 * Genera resumen de contexto para project-level
 */
function generateProjectContextSummary(context: ProjectContext): string {
  const parts: string[] = [];

  // Executive summary del master plan
  if (context.masterPlan?.executiveSummary) {
    parts.push(`## Proyecto: ${context.project} (${context.workspace})`);
    parts.push(`\n**Resumen Ejecutivo:**\n${context.masterPlan.executiveSummary}`);
  }

  // Estado actual
  if (context.currentContext?.currentStatus) {
    parts.push(`\n**Estado Actual:**\n${context.currentContext.currentStatus}`);
  }

  // Tareas prioritarias
  const highPriorityTasks = context.tasks?.pending?.filter((t: any) => t.priority === 'high') || [];
  if (highPriorityTasks.length > 0) {
    parts.push(`\n**Tareas Prioritarias Pendientes:**`);
    highPriorityTasks.slice(0, 5).forEach((task: any) => {
      parts.push(`- ${task.description}${task.assignee ? ` (${task.assignee})` : ''}`);
    });
  }

  // Decisiones recientes
  const recentDecisions = context.currentContext?.recentDecisions?.slice(0, 3) || [];
  if (recentDecisions.length > 0) {
    parts.push(`\n**Decisiones Recientes:**`);
    recentDecisions.forEach((decision: any) => {
      parts.push(`- ${decision.decision}${decision.date ? ` (${decision.date})` : ''}`);
    });
  }

  // Próximos pasos
  const nextSteps = context.currentContext?.nextSteps || [];
  if (nextSteps.length > 0) {
    parts.push(`\n**Próximos Pasos:**`);
    nextSteps.slice(0, 5).forEach((step: string) => {
      parts.push(`- ${step}`);
    });
  }

  return parts.join('\n');
}

/**
 * Genera resumen de contexto para workspace-level
 */
function generateWorkspaceContextSummary(context: WorkspaceContext): string {
  const parts: string[] = [];

  parts.push(`## Workspace: ${context.workspace}`);

  // Proyectos activos
  const activeProjects = context.quickReference?.quickLinks?.projects || {};
  const projectNames = Object.keys(activeProjects);
  if (projectNames.length > 0) {
    parts.push(`\n**Proyectos Activos:** ${projectNames.length}`);
    projectNames.slice(0, 5).forEach(project => {
      parts.push(`- ${project}`);
    });
  }

  // Memorias relevantes recientes
  const recentMemories = context.quickReference?.recentMemories || [];
  if (recentMemories.length > 0) {
    parts.push(`\n**Memorias Recientes:**`);
    recentMemories.slice(0, 5).forEach((memory: any) => {
      const preview = memory.content.length > 100 
        ? memory.content.substring(0, 100) + '...' 
        : memory.content;
      parts.push(`- ${preview}`);
    });
  }

  // Resumen de memorias
  if (context.summary) {
    parts.push(`\n**Resumen:**`);
    parts.push(`- Total memorias: ${context.summary.totalMemories}`);
    parts.push(`- Memorias activas: ${context.summary.activeMemories}`);
  }

  return parts.join('\n');
}

/**
 * Genera resumen de contexto para user-level
 */
function generateUserContextSummary(context: UserContext): string {
  const parts: string[] = [];

  parts.push(`## Contexto General del Usuario`);

  // Workspaces activos
  const activeWorkspaces = context.quickReference?.activeWorkspaces || [];
  if (activeWorkspaces.length > 0) {
    parts.push(`\n**Workspaces Activos:**`);
    activeWorkspaces.forEach((ws: any) => {
      parts.push(`- ${ws.name} (${ws.activeProjects.length} proyectos)`);
    });
  }

  // Memorias generales recientes
  const recentMemories = context.quickReference?.recentMemories || [];
  if (recentMemories.length > 0) {
    parts.push(`\n**Memorias Recientes:**`);
    recentMemories.slice(0, 5).forEach((memory: any) => {
      const preview = memory.content.length > 100 
        ? memory.content.substring(0, 100) + '...' 
        : memory.content;
      parts.push(`- ${preview}`);
    });
  }

  // Resumen
  if (context.summary) {
    parts.push(`\n**Resumen:**`);
    parts.push(`- Total memorias: ${context.summary.totalMemories}`);
    parts.push(`- Memorias activas: ${context.summary.activeMemories}`);
  }

  return parts.join('\n');
}

/**
 * Enriquece el system prompt con contexto
 */
export function enrichSystemPrompt(basePrompt: string, contextInfo: ContextInfo): string {
  if (!contextInfo.summary) {
    return basePrompt;
  }

  const contextSection = `
## CONTEXTO ADICIONAL

El siguiente contexto proporciona información relevante sobre el proyecto, workspace o usuario para mejorar el análisis:

${contextInfo.summary}

IMPORTANTE: Usa este contexto para:
- Identificar proyectos, clientes o stakeholders mencionados
- Entender el estado actual del proyecto/workspace
- Relacionar tareas y decisiones con el contexto existente
- Normalizar nombres y referencias según el contexto
- Identificar tags y variables relevantes según el contexto

`;

  return basePrompt + contextSection;
}

/**
 * Enriquece el user prompt con contexto relevante
 */
export function enrichUserPrompt(
  transcriptText: string,
  contextInfo: ContextInfo
): string {
  let contextNote = '';

  if (contextInfo.level === 'project' && contextInfo.context.project) {
    contextNote = `\n\nNOTA: Esta reunión está relacionada con el proyecto "${contextInfo.project}" del workspace "${contextInfo.workspace}". `;
    contextNote += `Considera el contexto del proyecto al analizar la transcripción.`;
  } else if (contextInfo.level === 'workspace' && contextInfo.context.workspace) {
    contextNote = `\n\nNOTA: Esta reunión está relacionada con el workspace "${contextInfo.workspace}". `;
    contextNote += `Considera el contexto del workspace al analizar la transcripción.`;
  }

  return transcriptText + contextNote;
}

