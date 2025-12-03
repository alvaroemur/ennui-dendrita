#!/usr/bin/env tsx
/**
 * Script para generar reporte consolidado de estado de trabajo
 * 
 * Este script:
 * - Lee todos los project-context.json de proyectos activos
 * - Consolida todas las tareas pendientes, en progreso y bloqueadas
 * - Genera reporte en Markdown con estado de todos los proyectos
 * - Guarda en .dendrita/dashboards/work-status-report.md
 * 
 * Uso:
 *   tsx .dendrita/integrations/scripts/pipelines/context-pipeline/generate-work-status-report.ts
 *   tsx .dendrita/integrations/scripts/pipelines/context-pipeline/generate-work-status-report.ts --workspace ennui
 * 
 * Flags:
 *   --workspace <workspace>  - Filtrar por workspace específico
 * 
 * Nota: Siempre genera tanto Markdown como JSON
 */

import * as fs from 'fs';
import * as path from 'path';
import { ProjectContext, Task, ProjectStatus, UserContext } from '../../utils/context-types';
import { PROJECT_ROOT, findAllProjects, loadProjectContext, getUserId } from './utils/common';

interface ProjectInfo {
  workspace: string;
  project: string;
  context: ProjectContext;
}

interface ConsolidatedReport {
  generatedAt: string;
  summary: {
    totalProjects: number;
    active: number;
    paused: number;
    completed: number;
    totalTasks: {
      pending: number;
      inProgress: number;
      blocked: number;
      completed: number;
    };
  };
  byWorkspace: Record<string, {
    projects: Array<{
      name: string;
      status: ProjectStatus;
      lastActivity: string;
      tasks: {
        pending: number;
        inProgress: number;
        blocked: number;
      };
      pendingTasks: Task[];
      inProgressTasks: Task[];
      blockedTasks: Task[];
    }>;
  }>;
  allPendingTasks: Array<{
    workspace: string;
    project: string;
    task: Task;
  }>;
  allInProgressTasks: Array<{
    workspace: string;
    project: string;
    task: Task;
  }>;
  allBlockedTasks: Array<{
    workspace: string;
    project: string;
    task: Task;
  }>;
  references?: {
    userContext?: {
      path: string;
      lastUpdate?: string;
      totalMemories?: number;
      activeMemories?: number;
    };
  };
}

/**
 * Encuentra todos los proyectos activos
 */
// findAllProjects y loadProjectContext ahora se importan de utils/common

/**
 * Carga todos los project contexts
 */
function loadAllProjectContexts(workspaceFilter?: string): ProjectInfo[] {
  const projects = findAllProjects(workspaceFilter);
  const contexts: ProjectInfo[] = [];

  for (const { workspace, project } of projects) {
    const context = loadProjectContext(workspace, project);
    if (context) {
      contexts.push({ workspace, project, context });
    }
  }

  return contexts;
}

/**
 * Genera reporte consolidado
 */
function generateConsolidatedReport(contexts: ProjectInfo[]): ConsolidatedReport {
  const byWorkspace: Record<string, {
    projects: Array<{
      name: string;
      status: ProjectStatus;
      lastActivity: string;
      tasks: {
        pending: number;
        inProgress: number;
        blocked: number;
      };
      pendingTasks: Task[];
      inProgressTasks: Task[];
      blockedTasks: Task[];
    }>;
  }> = {};

  const allPendingTasks: Array<{ workspace: string; project: string; task: Task }> = [];
  const allInProgressTasks: Array<{ workspace: string; project: string; task: Task }> = [];
  const allBlockedTasks: Array<{ workspace: string; project: string; task: Task }> = [];

  let active = 0;
  let paused = 0;
  let completed = 0;
  let totalPending = 0;
  let totalInProgress = 0;
  let totalBlocked = 0;
  let totalCompleted = 0;

  for (const { workspace, project, context } of contexts) {
    if (!byWorkspace[workspace]) {
      byWorkspace[workspace] = { projects: [] };
    }

    // Handle missing summary field (for older project-context.json files)
    const status = context.summary?.status || 'active';
    const lastActivity = context.summary?.lastActivity || context.lastUpdate || 'unknown';
    
    if (status === 'active') active++;
    else if (status === 'paused') paused++;
    else if (status === 'completed') completed++;

    const pendingTasks = context.tasks?.pending || [];
    const inProgressTasks = context.tasks?.inProgress || [];
    const blockedTasks = context.tasks?.blocked || [];

    totalPending += pendingTasks.length;
    totalInProgress += inProgressTasks.length;
    totalBlocked += blockedTasks.length;
    totalCompleted += context.tasks?.completed?.length || 0;

    // Agregar a listas globales
    for (const task of pendingTasks) {
      allPendingTasks.push({ workspace, project, task });
    }
    for (const task of inProgressTasks) {
      allInProgressTasks.push({ workspace, project, task });
    }
    for (const task of blockedTasks) {
      allBlockedTasks.push({ workspace, project, task });
    }

    byWorkspace[workspace].projects.push({
      name: project,
      status,
      lastActivity,
      tasks: {
        pending: pendingTasks.length,
        inProgress: inProgressTasks.length,
        blocked: blockedTasks.length,
      },
      pendingTasks,
      inProgressTasks,
      blockedTasks,
    });
  }

  // Leer context.json de usuario para referencias
  let userContextRef: ConsolidatedReport['references'] = undefined;
  try {
    const userId = getUserId();
    const contextPath = path.join(PROJECT_ROOT, '.dendrita', 'users', userId, 'context.json');
    if (fs.existsSync(contextPath)) {
      const userContext: UserContext = JSON.parse(fs.readFileSync(contextPath, 'utf-8'));
      userContextRef = {
        userContext: {
          path: contextPath,
          lastUpdate: userContext.lastUpdate,
          totalMemories: userContext.summary?.totalMemories || 0,
          activeMemories: userContext.summary?.activeMemories || 0,
        },
      };
    }
  } catch (error) {
    // Silently fail if context.json doesn't exist or can't be read
  }

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalProjects: contexts.length,
      active,
      paused,
      completed,
      totalTasks: {
        pending: totalPending,
        inProgress: totalInProgress,
        blocked: totalBlocked,
        completed: totalCompleted,
      },
    },
    byWorkspace,
    allPendingTasks,
    allInProgressTasks,
    allBlockedTasks,
    references: userContextRef,
  };
}

/**
 * Genera reporte en Markdown
 */
function generateMarkdownReport(report: ConsolidatedReport): string {
  const lines: string[] = [];

  lines.push('# Work Status Report');
  lines.push('');
  lines.push(`**Generated:** ${new Date(report.generatedAt).toLocaleString()}`);
  lines.push('');

  // Summary
  lines.push('## Summary');
  lines.push('');
  lines.push(`- **Total Projects:** ${report.summary.totalProjects}`);
  lines.push(`- **Active:** ${report.summary.active}`);
  lines.push(`- **Paused:** ${report.summary.paused}`);
  lines.push(`- **Completed:** ${report.summary.completed}`);
  lines.push('');
  lines.push('### Tasks Overview');
  lines.push('');
  lines.push(`- **Pending:** ${report.summary.totalTasks.pending}`);
  lines.push(`- **In Progress:** ${report.summary.totalTasks.inProgress}`);
  lines.push(`- **Blocked:** ${report.summary.totalTasks.blocked}`);
  lines.push(`- **Completed:** ${report.summary.totalTasks.completed}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // By Workspace
  lines.push('## By Workspace');
  lines.push('');

  for (const [workspace, data] of Object.entries(report.byWorkspace)) {
    lines.push(`### ${workspace} (${data.projects.length} projects)`);
    lines.push('');

    for (const project of data.projects) {
      const statusEmoji = project.status === 'active' ? '🟢' : project.status === 'paused' ? '⏸️' : '✅';
      lines.push(`- **${project.name}** [${statusEmoji} ${project.status}]`);
      lines.push(`  - Last Activity: ${project.lastActivity}`);
      lines.push(`  - Tasks: ${project.tasks.pending} pending, ${project.tasks.inProgress} in progress, ${project.tasks.blocked} blocked`);
      
      if (project.pendingTasks.length > 0) {
        lines.push(`  - Pending:`);
        for (const task of project.pendingTasks.slice(0, 5)) {
          const priority = task.priority ? ` [${task.priority}]` : '';
          lines.push(`    - ${task.description}${priority}`);
        }
        if (project.pendingTasks.length > 5) {
          lines.push(`    - ... and ${project.pendingTasks.length - 5} more`);
        }
      }
      
      lines.push('');
    }
  }

  lines.push('---');
  lines.push('');

  // All Pending Tasks
  if (report.allPendingTasks.length > 0) {
    lines.push('## All Pending Tasks');
    lines.push('');
    
    // Agrupar por workspace
    const byWorkspace: Record<string, Array<{ project: string; task: Task }>> = {};
    for (const { workspace, project, task } of report.allPendingTasks) {
      if (!byWorkspace[workspace]) {
        byWorkspace[workspace] = [];
      }
      byWorkspace[workspace].push({ project, task });
    }

    for (const [workspace, tasks] of Object.entries(byWorkspace)) {
      lines.push(`### ${workspace}`);
      lines.push('');
      
      // Agrupar por proyecto
      const byProject: Record<string, Task[]> = {};
      for (const { project, task } of tasks) {
        if (!byProject[project]) {
          byProject[project] = [];
        }
        byProject[project].push(task);
      }

      for (const [project, projectTasks] of Object.entries(byProject)) {
        lines.push(`#### ${project} (${projectTasks.length} tasks)`);
        lines.push('');
        for (const task of projectTasks) {
          const priority = task.priority ? ` [${task.priority}]` : '';
          const dueDate = task.dueDate ? ` (due: ${task.dueDate})` : '';
          lines.push(`- ${task.description}${priority}${dueDate}`);
        }
        lines.push('');
      }
    }
  }

  // All In Progress Tasks
  if (report.allInProgressTasks.length > 0) {
    lines.push('## All In Progress Tasks');
    lines.push('');
    
    const byWorkspace: Record<string, Array<{ project: string; task: Task }>> = {};
    for (const { workspace, project, task } of report.allInProgressTasks) {
      if (!byWorkspace[workspace]) {
        byWorkspace[workspace] = [];
      }
      byWorkspace[workspace].push({ project, task });
    }

    for (const [workspace, tasks] of Object.entries(byWorkspace)) {
      lines.push(`### ${workspace}`);
      lines.push('');
      
      const byProject: Record<string, Task[]> = {};
      for (const { project, task } of tasks) {
        if (!byProject[project]) {
          byProject[project] = [];
        }
        byProject[project].push(task);
      }

      for (const [project, projectTasks] of Object.entries(byProject)) {
        lines.push(`#### ${project} (${projectTasks.length} tasks)`);
        lines.push('');
        for (const task of projectTasks) {
          const priority = task.priority ? ` [${task.priority}]` : '';
          lines.push(`- ${task.description}${priority}`);
        }
        lines.push('');
      }
    }
  }

  // All Blocked Tasks
  if (report.allBlockedTasks.length > 0) {
    lines.push('## All Blocked Tasks');
    lines.push('');
    
    const byWorkspace: Record<string, Array<{ project: string; task: Task }>> = {};
    for (const { workspace, project, task } of report.allBlockedTasks) {
      if (!byWorkspace[workspace]) {
        byWorkspace[workspace] = [];
      }
      byWorkspace[workspace].push({ project, task });
    }

    for (const [workspace, tasks] of Object.entries(byWorkspace)) {
      lines.push(`### ${workspace}`);
      lines.push('');
      
      const byProject: Record<string, Task[]> = {};
      for (const { project, task } of tasks) {
        if (!byProject[project]) {
          byProject[project] = [];
        }
        byProject[project].push(task);
      }

      for (const [project, projectTasks] of Object.entries(byProject)) {
        lines.push(`#### ${project} (${projectTasks.length} tasks)`);
        lines.push('');
        for (const task of projectTasks) {
          const priority = task.priority ? ` [${task.priority}]` : '';
          lines.push(`- ${task.description}${priority}`);
        }
        lines.push('');
      }
    }
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(`*Report generated at ${new Date(report.generatedAt).toISOString()}*`);
  lines.push('*To update this report, run: `tsx .dendrita/integrations/scripts/pipelines/context-pipeline/generate-work-status-report.ts`*');

  return lines.join('\n');
}

/**
 * Función principal
 */
function main() {
  try {
    const args = process.argv.slice(2);
    let workspaceFilter: string | undefined;

    // Parse arguments
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--workspace' && args[i + 1]) {
        workspaceFilter = args[i + 1];
        i++;
      }
    }

    console.log('📊 Generating work status report...\n');

    // Load all project contexts
    const contexts = loadAllProjectContexts(workspaceFilter);
    
    if (contexts.length === 0) {
      console.log('⚠️  No project contexts found.');
      if (workspaceFilter) {
        console.log(`   Filtered by workspace: ${workspaceFilter}`);
      }
      console.log('   Make sure project-context.json files exist. Run update-project-context.ts first.');
      process.exit(1);
    }

    console.log(`✅ Loaded ${contexts.length} project contexts`);

    // Generate consolidated report
    const report = generateConsolidatedReport(contexts);

    // Save report (both Markdown and JSON)
    const dashboardsDir = path.join(PROJECT_ROOT, '.dendrita', 'dashboards');
    if (!fs.existsSync(dashboardsDir)) {
      fs.mkdirSync(dashboardsDir, { recursive: true });
    }

    // Always generate both formats
    const markdownPath = path.join(dashboardsDir, 'work-status-report.md');
    const markdown = generateMarkdownReport(report);
    fs.writeFileSync(markdownPath, markdown, 'utf-8');
    console.log(`\n✅ Markdown report saved: ${markdownPath}`);

    const jsonPath = path.join(dashboardsDir, 'work-status-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`✅ JSON report saved: ${jsonPath}`);

    // Print summary
    console.log('\n📊 Summary:');
    console.log(`   Projects: ${report.summary.totalProjects} (${report.summary.active} active, ${report.summary.paused} paused, ${report.summary.completed} completed)`);
    console.log(`   Tasks: ${report.summary.totalTasks.pending} pending, ${report.summary.totalTasks.inProgress} in progress, ${report.summary.totalTasks.blocked} blocked`);

  } catch (error) {
    console.error('❌ Error generating work status report:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

