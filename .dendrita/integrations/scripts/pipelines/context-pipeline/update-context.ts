#!/usr/bin/env tsx
/**
 * Script principal para actualizar el sistema de contexto JSON unificado
 * 
 * Este script:
 * - Lee project_context.json de todos los proyectos activos (propagación desde proyectos)
 * - Extrae memorias desde project_context.json (decisiones, próximos pasos, tareas prioritarias)
 * - Lee _temp/context-input.md o .txt si existe (input manual)
 * - Analiza workspaces y proyectos activos
 * - Actualiza JSON principal de usuario con nuevas memorias (fusiona memorias de proyectos + input manual)
 * - Actualiza JSONs de workspace heurísticamente (filtra memorias del usuario por workspace)
 * - Elimina memorias obsoletas
 * - Actualiza quickReference para búsqueda rápida
 * 
 * Flujo de propagación:
 *   1. Proyecto (granular): update-project-context.ts → project_context.json
 *   2. Workspace (intermedio): update-context.ts → workspace/context.json (filtra memorias del usuario)
 *   3. Usuario (general): update-context.ts → .dendrita/users/[user-id]/context.json (agrega memorias de proyectos)
 * 
 * Uso:
 *   tsx .dendrita/integrations/scripts/pipelines/context-pipeline/update-context.ts
 * 
 * Orden recomendado:
 *   1. tsx .dendrita/integrations/scripts/pipelines/context-pipeline/update-project-context.ts
 *   2. tsx .dendrita/integrations/scripts/pipelines/context-pipeline/update-context.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  UserContext,
  WorkspaceContext,
  Memory,
  MemoryMetadata,
  QuickReference,
  ContextInput,
  RecentMemory,
  ActiveWorkspace,
  RecentFile,
  MemoryRelevance,
  MemoryStatus,
  ProjectContext
} from './utils/context-types';
import { PROJECT_ROOT, getUserId, findAllProjects, loadProjectContext } from './utils/common';

/**
 * Parsea context-input.md o .txt para extraer ideas, tareas y referencias
 */
function parseContextInput(inputPath: string): ContextInput | null {
  if (!fs.existsSync(inputPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(inputPath, 'utf-8');
    const input: ContextInput = {
      ideas: [],
      tasks: [],
      references: {
        workspaces: [],
        projects: [],
        files: []
      },
      tags: [],
      rawText: content
    };

    // Extraer ideas (líneas que empiezan con - o * o números)
    const ideaPattern = /^[-*•]\s+(.+)$/gm;
    const ideas = content.match(ideaPattern);
    if (ideas) {
      input.ideas = ideas.map(i => i.replace(/^[-*•]\s+/, '').trim());
    }

    // Extraer tareas (líneas con TODO, FIXME, o palabras clave)
    const taskPattern = /(?:TODO|FIXME|TASK|TAREA)[:\s]+(.+)$/gmi;
    const tasks = content.match(taskPattern);
    if (tasks) {
      input.tasks = tasks.map(t => t.replace(/(?:TODO|FIXME|TASK|TAREA)[:\s]+/i, '').trim());
    }

    // Extraer referencias a workspaces (workspaces/[nombre] o mención de workspace)
    const workspacePattern = /workspaces\/([^\s\/]+)/gi;
    const workspaces = content.match(workspacePattern);
    if (workspaces) {
      input.references!.workspaces = [...new Set(workspaces.map(w => w.replace('workspaces/', '')))];
    }

    // Extraer referencias a proyectos (🚀 active-projects/[nombre] o mención de proyecto)
    const projectPattern = /(?:🚀\s*active-projects|active-projects)\/([^\s\/]+)/gi;
    const projects = content.match(projectPattern);
    if (projects) {
      input.references!.projects = projects.map(p => {
        const parts = p.split('/');
        const projectName = parts[parts.length - 1];
        // Intentar inferir workspace del contexto
        const workspaceMatch = content.match(new RegExp(`workspaces/([^\\s/]+).*?${projectName}`, 'i'));
        return {
          workspace: workspaceMatch ? workspaceMatch[1] : 'unknown',
          project: projectName
        };
      });
    }

    // Extraer referencias a archivos (paths con extensiones comunes)
    const filePattern = /([^\s]+\.(?:md|ts|tsx|js|jsx|json|txt|py|sh))/gi;
    const files = content.match(filePattern);
    if (files) {
      input.references!.files = [...new Set(files)];
    }

    // Extraer tags (palabras con # o en formato @tag)
    const tagPattern = /(?:#|@)([a-zA-Z0-9-_]+)/g;
    const tags = content.match(tagPattern);
    if (tags) {
      input.tags = [...new Set(tags.map(t => t.replace(/[#@]/, '')))];
    }

    return input;
  } catch (error: any) {
    console.warn(`⚠️  Error parsing context input: ${error.message}`);
    return null;
  }
}

/**
 * Analiza workspaces para identificar proyectos activos
 */
function analyzeWorkspaces(workspacesDir: string): Map<string, { activeProjects: string[]; lastActivity: string }> {
  const workspaces = new Map<string, { activeProjects: string[]; lastActivity: string }>();

  if (!fs.existsSync(workspacesDir)) {
    return workspaces;
  }

  const entries = fs.readdirSync(workspacesDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const workspacePath = path.join(workspacesDir, entry.name);
      const activeProjectsPath = path.join(workspacePath, '🚀 active-projects');

      let activeProjects: string[] = [];
      let lastActivity = new Date(0).toISOString();

      if (fs.existsSync(activeProjectsPath)) {
        const projects = fs.readdirSync(activeProjectsPath, { withFileTypes: true });
        activeProjects = projects
          .filter(p => p.isDirectory() && !p.name.startsWith('.'))
          .map(p => {
            const projectPath = path.join(activeProjectsPath, p.name);
            const stats = fs.statSync(projectPath);
            if (stats.mtime.toISOString() > lastActivity) {
              lastActivity = stats.mtime.toISOString();
            }
            return p.name;
          });
      }

      workspaces.set(entry.name, { activeProjects, lastActivity });
    }
  }

  return workspaces;
}

/**
 * Lee el contexto de usuario existente
 */
function readUserContext(userId: string): UserContext | null {
  const contextPath = path.join(PROJECT_ROOT, '.dendrita', 'users', userId, 'context.json');

  if (!fs.existsSync(contextPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(contextPath, 'utf-8');
    return JSON.parse(content) as UserContext;
  } catch (error: any) {
    console.warn(`⚠️  Error reading user context: ${error.message}`);
    return null;
  }
}

/**
 * Crea un contexto de usuario inicial
 */
function createInitialUserContext(): UserContext {
  const now = new Date().toISOString();
  return {
    lastUpdate: now,
    type: 'user-context',
    quickReference: {
      recentMemories: [],
      activeWorkspaces: [],
      recentFiles: [],
      recentTags: [],
      quickLinks: {
        projects: {},
        workspaces: {}
      }
    },
    memories: [],
    summary: {
      totalMemories: 0,
      activeMemories: 0,
      byWorkspace: {},
      byProject: {}
    }
  };
}

/**
 * Lee project-context.json de todos los proyectos activos
 * Usa loadProjectContext de utils/common para consistencia
 */
function readAllProjectContexts(workspaces: Map<string, { activeProjects: string[]; lastActivity: string }>): Array<{ workspace: string; project: string; context: ProjectContext }> {
  const projectContexts: Array<{ workspace: string; project: string; context: ProjectContext }> = [];

  workspaces.forEach((info, workspaceName) => {
    info.activeProjects.forEach(projectName => {
      const projectContext = loadProjectContext(workspaceName, projectName);
      if (projectContext) {
        projectContexts.push({ workspace: workspaceName, project: projectName, context: projectContext });
      }
    });
  });

  return projectContexts;
}

/**
 * Extrae memorias desde project-context.json
 * Convierte decisiones, próximos pasos y tareas prioritarias en memorias
 */
function extractMemoriesFromProjectContexts(
  projectContexts: Array<{ workspace: string; project: string; context: ProjectContext }>
): Memory[] {
  const memories: Memory[] = [];
  const now = new Date().toISOString();

  projectContexts.forEach(({ workspace, project, context }) => {
    // Extraer decisiones recientes
    if (context.currentContext.recentDecisions && context.currentContext.recentDecisions.length > 0) {
      context.currentContext.recentDecisions.forEach(decision => {
        memories.push({
          id: uuidv4(),
          content: `Decisión [${project}]: ${decision.decision}`,
          metadata: {
            workspace,
            project,
            files: [`workspaces/${workspace}/🚀 active-projects/${project}/current_context.md`],
            tags: ['decision', 'project'],
            createdAt: decision.date || context.lastUpdate,
            updatedAt: decision.date || context.lastUpdate,
            relevance: 'high' as MemoryRelevance,
            status: 'active' as MemoryStatus
          }
        });
      });
    }

    // Extraer próximos pasos
    if (context.currentContext.nextSteps && context.currentContext.nextSteps.length > 0) {
      context.currentContext.nextSteps.forEach(step => {
        memories.push({
          id: uuidv4(),
          content: `Próximo paso [${project}]: ${step}`,
          metadata: {
            workspace,
            project,
            files: [`workspaces/${workspace}/🚀 active-projects/${project}/current_context.md`],
            tags: ['next-step', 'project', 'action'],
            createdAt: context.lastUpdate,
            updatedAt: context.lastUpdate,
            relevance: 'high' as MemoryRelevance,
            status: 'active' as MemoryStatus
          }
        });
      });
    }

    // Extraer tareas prioritarias/en progreso
    const priorityTasks = [
      ...context.tasks.inProgress.filter(t => t.priority === 'high'),
      ...context.tasks.pending.filter(t => t.priority === 'high'),
      ...context.tasks.inProgress.slice(0, 3), // Primeras 3 en progreso
      ...context.tasks.pending.slice(0, 2) // Primeras 2 pendientes
    ].slice(0, 5); // Máximo 5 tareas por proyecto

    priorityTasks.forEach(task => {
      memories.push({
        id: uuidv4(),
        content: `Tarea [${project}]: ${task.description}${task.priority ? ` [${task.priority}]` : ''}`,
        metadata: {
          workspace,
          project,
          files: [`workspaces/${workspace}/🚀 active-projects/${project}/tasks.md`],
          tags: ['task', 'project', task.status === 'in-progress' ? 'in-progress' : 'pending'],
          createdAt: context.lastUpdate,
          updatedAt: context.lastUpdate,
          relevance: task.priority === 'high' ? 'high' : 'medium' as MemoryRelevance,
          status: 'active' as MemoryStatus
        }
      });
    });

    // Extraer blockers si existen
    if (context.currentContext.blockers && context.currentContext.blockers.length > 0) {
      context.currentContext.blockers.forEach(blocker => {
        memories.push({
          id: uuidv4(),
          content: `Blocker [${project}]: ${blocker}`,
          metadata: {
            workspace,
            project,
            files: [`workspaces/${workspace}/🚀 active-projects/${project}/current_context.md`],
            tags: ['blocker', 'project', 'issue'],
            createdAt: context.lastUpdate,
            updatedAt: context.lastUpdate,
            relevance: 'high' as MemoryRelevance,
            status: 'active' as MemoryStatus
          }
        });
      });
    }
  });

  return memories;
}

/**
 * Crea memorias desde context input
 */
function createMemoriesFromInput(input: ContextInput, workspaces: Map<string, { activeProjects: string[]; lastActivity: string }>): Memory[] {
  const memories: Memory[] = [];
  const now = new Date().toISOString();

  // Crear memoria para cada idea
  if (input.ideas && input.ideas.length > 0) {
    input.ideas.forEach(idea => {
      const memory: Memory = {
        id: uuidv4(),
        content: idea,
        metadata: {
          files: input.references?.files || [],
          tags: input.tags || [],
          createdAt: now,
          updatedAt: now,
          relevance: 'medium' as MemoryRelevance,
          status: 'active' as MemoryStatus
        }
      };

      // Intentar inferir workspace/project
      if (input.references?.projects && input.references.projects.length > 0) {
        const ref = input.references.projects[0];
        memory.metadata.workspace = ref.workspace;
        memory.metadata.project = ref.project;
      } else if (input.references?.workspaces && input.references.workspaces.length > 0) {
        memory.metadata.workspace = input.references.workspaces[0];
      }

      memories.push(memory);
    });
  }

  // Crear memoria para cada tarea
  if (input.tasks && input.tasks.length > 0) {
    input.tasks.forEach(task => {
      const memory: Memory = {
        id: uuidv4(),
        content: `Tarea: ${task}`,
        metadata: {
          files: input.references?.files || [],
          tags: [...(input.tags || []), 'task'],
          createdAt: now,
          updatedAt: now,
          relevance: 'high' as MemoryRelevance,
          status: 'active' as MemoryStatus
        }
      };

      if (input.references?.projects && input.references.projects.length > 0) {
        const ref = input.references.projects[0];
        memory.metadata.workspace = ref.workspace;
        memory.metadata.project = ref.project;
      }

      memories.push(memory);
    });
  }

  return memories;
}

/**
 * Aplica heurística para limpiar memorias obsoletas
 */
function cleanObsoleteMemories(memories: Memory[]): Memory[] {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  return memories.filter(memory => {
    const updatedAt = new Date(memory.metadata.updatedAt);

    // Eliminar memorias archivadas con más de 30 días
    if (memory.metadata.status === 'archived' && updatedAt < thirtyDaysAgo) {
      return false;
    }

    // Eliminar memorias de baja relevancia con más de 14 días
    if (memory.metadata.relevance === 'low' && updatedAt < fourteenDaysAgo) {
      return false;
    }

    return true;
  });
}

/**
 * Actualiza memorias existentes o agrega nuevas
 */
function mergeMemories(existing: Memory[], newMemories: Memory[]): Memory[] {
  const merged = [...existing];

  newMemories.forEach(newMemory => {
    // Buscar memoria existente con mismo workspace y project
    const existingIndex = merged.findIndex(m => 
      m.metadata.workspace === newMemory.metadata.workspace &&
      m.metadata.project === newMemory.metadata.project &&
      m.content === newMemory.content
    );

    if (existingIndex >= 0) {
      // Actualizar memoria existente
      merged[existingIndex] = {
        ...merged[existingIndex],
        metadata: {
          ...merged[existingIndex].metadata,
          updatedAt: new Date().toISOString(),
          files: [...new Set([...merged[existingIndex].metadata.files, ...newMemory.metadata.files])],
          tags: [...new Set([...merged[existingIndex].metadata.tags, ...newMemory.metadata.tags])]
        }
      };
    } else {
      // Agregar nueva memoria
      merged.push(newMemory);
    }
  });

  return merged;
}

/**
 * Actualiza quickReference con información reciente
 */
function updateQuickReference(
  memories: Memory[],
  workspaces: Map<string, { activeProjects: string[]; lastActivity: string }>
): QuickReference {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Obtener últimas 20 memorias más recientes
  const recentMemories: RecentMemory[] = memories
    .filter(m => m.metadata.status === 'active')
    .sort((a, b) => new Date(b.metadata.updatedAt).getTime() - new Date(a.metadata.updatedAt).getTime())
    .slice(0, 20)
    .map(m => ({
      id: m.id,
      content: m.content,
      workspace: m.metadata.workspace,
      project: m.metadata.project,
      updatedAt: m.metadata.updatedAt
    }));

  // Obtener workspaces activos (actividad en últimos 7 días)
  const activeWorkspaces: ActiveWorkspace[] = Array.from(workspaces.entries())
    .filter(([_, info]) => new Date(info.lastActivity) >= sevenDaysAgo)
    .map(([name, info]) => ({
      name,
      activeProjects: info.activeProjects,
      lastActivity: info.lastActivity
    }));

  // Obtener archivos recientes (máximo 30)
  const recentFiles: RecentFile[] = [];
  // TODO: Implementar detección de archivos modificados recientemente
  // Por ahora, extraer de memorias
  const fileMap = new Map<string, { path: string; workspace?: string; project?: string; lastModified: string }>();
  memories.forEach(m => {
    m.metadata.files.forEach(filePath => {
      if (!fileMap.has(filePath)) {
        fileMap.set(filePath, {
          path: filePath,
          workspace: m.metadata.workspace,
          project: m.metadata.project,
          lastModified: m.metadata.updatedAt
        });
      }
    });
  });
  recentFiles.push(...Array.from(fileMap.values()).slice(0, 30));

  // Obtener tags más usados en últimos 30 días (top 10)
  const tagCounts = new Map<string, number>();
  memories
    .filter(m => new Date(m.metadata.updatedAt) >= thirtyDaysAgo)
    .forEach(m => {
      m.metadata.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });
  const recentTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag);

  // Generar quickLinks
  const quickLinks = {
    projects: {} as Record<string, { workspace: string; path: string; contextPath: string }>,
    workspaces: {} as Record<string, { contextPath: string; activeProjects: number }>
  };

  workspaces.forEach((info, workspaceName) => {
    quickLinks.workspaces[workspaceName] = {
      contextPath: `workspaces/${workspaceName}/context.json`,
      activeProjects: info.activeProjects.length
    };

    info.activeProjects.forEach(projectName => {
      const projectKey = `${workspaceName}/${projectName}`;
      quickLinks.projects[projectKey] = {
        workspace: workspaceName,
        path: `workspaces/${workspaceName}/🚀 active-projects/${projectName}/`,
        contextPath: `workspaces/${workspaceName}/🚀 active-projects/${projectName}/project_context.json`
      };
    });
  });

  return {
    recentMemories,
    activeWorkspaces,
    recentFiles,
    recentTags,
    quickLinks
  };
}

/**
 * Actualiza el resumen de contexto
 */
function updateSummary(memories: Memory[]): UserContext['summary'] {
  const activeMemories = memories.filter(m => m.metadata.status === 'active');
  const byWorkspace: Record<string, number> = {};
  const byProject: Record<string, number> = {};

  memories.forEach(m => {
    if (m.metadata.workspace) {
      byWorkspace[m.metadata.workspace] = (byWorkspace[m.metadata.workspace] || 0) + 1;
    }
    if (m.metadata.workspace && m.metadata.project) {
      const key = `${m.metadata.workspace}/${m.metadata.project}`;
      byProject[key] = (byProject[key] || 0) + 1;
    }
  });

  return {
    totalMemories: memories.length,
    activeMemories: activeMemories.length,
    byWorkspace,
    byProject
  };
}

/**
 * Actualiza el contexto de usuario
 */
function updateUserContext(userId: string, input: ContextInput | null, workspaces: Map<string, { activeProjects: string[]; lastActivity: string }>): void {
  const contextPath = path.join(PROJECT_ROOT, '.dendrita', 'users', userId, 'context.json');
  const contextDir = path.dirname(contextPath);

  // Asegurar que el directorio existe
  if (!fs.existsSync(contextDir)) {
    fs.mkdirSync(contextDir, { recursive: true });
  }

  // Leer contexto existente o crear uno nuevo
  let context = readUserContext(userId) || createInitialUserContext();

  // Leer project_context.json de todos los proyectos activos
  const projectContexts = readAllProjectContexts(workspaces);
  console.log(`📦 Project contexts found: ${projectContexts.length}`);

  // Extraer memorias desde project_context.json (propagación desde proyectos)
  const projectMemories = extractMemoriesFromProjectContexts(projectContexts);
  console.log(`   - Memories extracted from projects: ${projectMemories.length}`);

  // Crear nuevas memorias desde input manual
  let inputMemories: Memory[] = [];
  if (input) {
    inputMemories = createMemoriesFromInput(input, workspaces);
    console.log(`   - Memories from input: ${inputMemories.length}`);
  }

  // Fusionar todas las memorias (proyectos primero, luego input manual)
  const allNewMemories = [...projectMemories, ...inputMemories];
  context.memories = mergeMemories(context.memories, allNewMemories);

  // Limpiar memorias obsoletas
  context.memories = cleanObsoleteMemories(context.memories);

  // Actualizar quickReference
  context.quickReference = updateQuickReference(context.memories, workspaces);

  // Actualizar resumen
  context.summary = updateSummary(context.memories);

  // Agregar referencia a work-status-report si existe
  const reportPath = path.join(PROJECT_ROOT, '.dendrita', 'dashboards', 'work-status-report.json');
  if (fs.existsSync(reportPath)) {
    try {
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
      // Agregar referencia en metadata si no existe
      if (!context.metadata) {
        context.metadata = {};
      }
      context.metadata.workStatusReport = {
        path: reportPath,
        generatedAt: report.generatedAt,
        summary: {
          totalProjects: report.summary?.totalProjects || 0,
          totalTasks: report.summary?.totalTasks || {},
        },
      };
    } catch (error) {
      // Silently fail if report can't be read
    }
  }

  // Actualizar timestamp
  context.lastUpdate = new Date().toISOString();

  // Guardar
  fs.writeFileSync(contextPath, JSON.stringify(context, null, 2), 'utf-8');
  console.log(`✅ User context updated: ${contextPath}`);
  console.log(`📊 Total memories: ${context.summary.totalMemories} (${context.summary.activeMemories} active)`);
}

/**
 * Actualiza contextos de workspace
 */
function updateWorkspaceContexts(workspaces: Map<string, { activeProjects: string[]; lastActivity: string }>, userContext: UserContext): void {
  workspaces.forEach((info, workspaceName) => {
    const workspaceContextPath = path.join(PROJECT_ROOT, 'workspaces', workspaceName, 'context.json');
    const workspaceDir = path.dirname(workspaceContextPath);

    if (!fs.existsSync(workspaceDir)) {
      return;
    }

    // Filtrar memorias por workspace
    const workspaceMemories = userContext.memories.filter(m => m.metadata.workspace === workspaceName);

    // Crear quickReference local
    const workspaceQuickReference: QuickReference = {
      recentMemories: workspaceMemories
        .filter(m => m.metadata.status === 'active')
        .sort((a, b) => new Date(b.metadata.updatedAt).getTime() - new Date(a.metadata.updatedAt).getTime())
        .slice(0, 10)
        .map(m => ({
          id: m.id,
          content: m.content,
          workspace: m.metadata.workspace,
          project: m.metadata.project,
          updatedAt: m.metadata.updatedAt
        })),
      activeWorkspaces: [{
        name: workspaceName,
        activeProjects: info.activeProjects,
        lastActivity: info.lastActivity
      }],
      recentFiles: workspaceMemories
        .flatMap(m => m.metadata.files.map(f => ({
          path: f,
          workspace: m.metadata.workspace,
          project: m.metadata.project,
          lastModified: m.metadata.updatedAt
        })))
        .slice(0, 15),
      recentTags: Array.from(new Set(workspaceMemories.flatMap(m => m.metadata.tags))).slice(0, 10),
      quickLinks: {
        projects: Object.fromEntries(
          info.activeProjects.map(projectName => [
            `${workspaceName}/${projectName}`,
            {
              workspace: workspaceName,
              path: `workspaces/${workspaceName}/🚀 active-projects/${projectName}/`,
              contextPath: `workspaces/${workspaceName}/🚀 active-projects/${projectName}/project_context.json`
            }
          ])
        ),
        workspaces: {
          [workspaceName]: {
            contextPath: `workspaces/${workspaceName}/context.json`,
            activeProjects: info.activeProjects.length
          }
        }
      }
    };

    const workspaceContext: WorkspaceContext = {
      lastUpdate: new Date().toISOString(),
      type: 'workspace-context',
      workspace: workspaceName,
      quickReference: workspaceQuickReference,
      memories: workspaceMemories,
      summary: {
        totalMemories: workspaceMemories.length,
        activeMemories: workspaceMemories.filter(m => m.metadata.status === 'active').length,
        byWorkspace: { [workspaceName]: workspaceMemories.length },
        byProject: workspaceMemories.reduce((acc, m) => {
          if (m.metadata.project) {
            const key = `${workspaceName}/${m.metadata.project}`;
            acc[key] = (acc[key] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>)
      }
    };

    fs.writeFileSync(workspaceContextPath, JSON.stringify(workspaceContext, null, 2), 'utf-8');
    console.log(`✅ Workspace context updated: ${workspaceContextPath}`);
  });
}

/**
 * Función principal
 */
function main() {
  try {
    console.log('🔄 Updating context system...\n');

    // Obtener user ID
    const userId = getUserId();
    console.log(`👤 User ID: ${userId}\n`);

    // Leer context input si existe
    const inputPathMd = path.join(PROJECT_ROOT, '_temp', 'context-input.md');
    const inputPathTxt = path.join(PROJECT_ROOT, '_temp', 'context-input.txt');
    const inputPath = fs.existsSync(inputPathMd) ? inputPathMd : inputPathTxt;
    const input = parseContextInput(inputPath);

    if (input) {
      console.log(`📝 Context input found: ${inputPath}`);
      console.log(`   - Ideas: ${input.ideas?.length || 0}`);
      console.log(`   - Tasks: ${input.tasks?.length || 0}`);
      console.log(`   - Workspaces: ${input.references?.workspaces?.length || 0}`);
      console.log(`   - Projects: ${input.references?.projects?.length || 0}`);
      console.log(`   - Files: ${input.references?.files?.length || 0}`);
      console.log(`   - Tags: ${input.tags?.length || 0}\n`);
    } else {
      console.log('ℹ️  No context input found, updating from existing context\n');
    }

    // Analizar workspaces
    const workspacesDir = path.join(PROJECT_ROOT, 'workspaces');
    const workspaces = analyzeWorkspaces(workspacesDir);
    console.log(`📁 Workspaces found: ${workspaces.size}\n`);

    // Actualizar contexto de usuario
    updateUserContext(userId, input, workspaces);

    // Leer contexto actualizado para workspace contexts
    const userContext = readUserContext(userId);
    if (userContext) {
      // Actualizar contextos de workspace
      updateWorkspaceContexts(workspaces, userContext);
    } else {
      console.warn('⚠️  Could not read updated user context for workspace contexts');
    }

    console.log('\n✅ Context update completed!');
  } catch (error: any) {
    console.error('❌ Error updating context:', error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

export { main, parseContextInput, updateUserContext, updateWorkspaceContexts };

