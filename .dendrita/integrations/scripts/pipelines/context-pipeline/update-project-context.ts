#!/usr/bin/env tsx
/**
 * Script para actualizar project-context.json de cada proyecto
 * 
 * Este script:
 * - Lee master_plan.md, current_context.md y tasks.md de cada proyecto
 * - Genera project_context.json con contenido parseado
 * - Actualiza lastActivity basado en última modificación de archivos
 * - Calcula estadísticas de tareas
 * - Agrega comentarios de sincronización a los archivos MD
 * - NO archiva current_context.md por defecto (se mantiene como documento de trabajo)
 * 
 * Uso:
 *   tsx .dendrita/integrations/scripts/pipelines/context-pipeline/update-project-context.ts
 *   tsx .dendrita/integrations/scripts/pipelines/context-pipeline/update-project-context.ts --workspace ennui
 *   tsx .dendrita/integrations/scripts/pipelines/context-pipeline/update-project-context.ts --project dendrita-comunicacion
 *   tsx .dendrita/integrations/scripts/pipelines/context-pipeline/update-project-context.ts --workspace ennui --project nombre-proyecto --archive
 * 
 * Flags:
 *   --workspace <workspace>  - Filtrar por workspace específico
 *   --project <project>      - Filtrar por proyecto específico
 *   --archive                - Archivar los 3 archivos principales (master_plan.md, current_context.md, tasks.md)
 *                              Requiere --workspace y --project
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  ProjectContext,
  ParsedMasterPlan,
  ParsedCurrentContext,
  ParsedTasks,
  Task,
  ProjectStatus,
  QuickReference,
  RecentMemory,
  RecentFile
} from './utils/context-types';
import { PROJECT_ROOT, findAllProjects } from './utils/common';

/**
 * Parsea master_plan.md
 */
function parseMasterPlan(masterPlanPath: string): ParsedMasterPlan {
  if (!fs.existsSync(masterPlanPath)) {
    return { rawContent: '' };
  }

  try {
    const content = fs.readFileSync(masterPlanPath, 'utf-8');
    const parsed: ParsedMasterPlan = {
      rawContent: content
    };

    // Extraer executive summary (sección después de # o ## Propósito/Resumen)
    const summaryMatch = content.match(/(?:##?\s+(?:Propósito|Resumen|Executive Summary|Objetivo)[^\n]*\n\n?)(.+?)(?=\n##|\n---|$)/is);
    if (summaryMatch) {
      parsed.executiveSummary = summaryMatch[1].trim();
    }

    // Extraer fases (secciones con ## Fases o ## Phases)
    const phasesMatch = content.match(/##\s+(?:Fases|Phases)[^\n]*\n\n?(.+?)(?=\n##|\n---|$)/is);
    if (phasesMatch) {
      const phasesContent = phasesMatch[1];
      const phaseSections = phasesContent.split(/\n###\s+/);
      parsed.phases = phaseSections
        .filter(p => p.trim())
        .map(phase => {
          const lines = phase.split('\n');
          const name = lines[0].trim();
          const description = lines.slice(1).join('\n').trim();
          const timelineMatch = description.match(/timeline[:\s]+(.+)/i);
          return {
            name,
            description: timelineMatch ? description.replace(timelineMatch[0], '').trim() : description,
            timeline: timelineMatch ? timelineMatch[1].trim() : undefined
          };
        });
    }

    // Extraer métricas de éxito (lista con ## Success Metrics o ## Métricas)
    const metricsMatch = content.match(/##\s+(?:Success Metrics|Métricas|Métricas de Éxito)[^\n]*\n\n?(.+?)(?=\n##|\n---|$)/is);
    if (metricsMatch) {
      const metricsContent = metricsMatch[1];
      parsed.successMetrics = metricsContent
        .split('\n')
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
        .map(line => line.replace(/^[-*]\s+/, '').trim());
    }

    // Extraer riesgos (sección con ## Risks o ## Riesgos)
    const risksMatch = content.match(/##\s+(?:Risks|Riesgos|Riesgos y Mitigaciones)[^\n]*\n\n?(.+?)(?=\n##|\n---|$)/is);
    if (risksMatch) {
      const risksContent = risksMatch[1];
      const riskItems = risksContent.split(/\n(?:###|-|\*)\s+/);
      parsed.risks = riskItems
        .filter(r => r.trim())
        .map(risk => {
          const lines = risk.split('\n');
          const riskText = lines[0].trim();
          const mitigationMatch = risk.match(/mitigation[:\s]+(.+)/i);
          return {
            risk: riskText,
            mitigation: mitigationMatch ? mitigationMatch[1].trim() : undefined
          };
        });
    }

    return parsed;
  } catch (error: any) {
    console.warn(`⚠️  Error parsing master_plan.md: ${error.message}`);
    return { rawContent: '' };
  }
}

/**
 * Parsea current_context.md
 */
function parseCurrentContext(currentContextPath: string): ParsedCurrentContext {
  if (!fs.existsSync(currentContextPath)) {
    return { rawContent: '' };
  }

  try {
    const content = fs.readFileSync(currentContextPath, 'utf-8');
    const parsed: ParsedCurrentContext = {
      rawContent: content
    };

    // Extraer session progress (secciones con ## SESSION PROGRESS o ## Progreso)
    const sessionProgressMatch = content.match(/##\s+(?:SESSION PROGRESS|Progreso|Session Progress)[^\n]*\n\n?(.+?)(?=\n##|\n---|$)/is);
    if (sessionProgressMatch) {
      const progressContent = sessionProgressMatch[1];
      const dateSections = progressContent.split(/\n###\s+(\d{4}-\d{2}-\d{2})/);
      parsed.sessionProgress = [];

      for (let i = 1; i < dateSections.length; i += 2) {
        const date = dateSections[i];
        const sectionContent = dateSections[i + 1] || '';
        const completed = sectionContent.match(/✅\s+(.+?)(?=\n|$)/g)?.map(c => c.replace(/✅\s+/, '').trim()) || [];
        const inProgress = sectionContent.match(/🟡\s+(.+?)(?=\n|$)/g)?.map(c => c.replace(/🟡\s+/, '').trim()) || [];
        const notes = sectionContent.match(/📝\s+(.+?)(?=\n|$)/g)?.map(c => c.replace(/📝\s+/, '').trim()) || [];

        parsed.sessionProgress.push({
          date,
          completed,
          inProgress,
          notes: notes.length > 0 ? notes : undefined
        });
      }
    }

    // Extraer estado actual
    const statusMatch = content.match(/##\s+(?:Estado Actual|Current Status|Status)[^\n]*\n\n?(.+?)(?=\n##|\n---|$)/is);
    if (statusMatch) {
      parsed.currentStatus = statusMatch[1].trim();
    }

    // Extraer decisiones recientes
    const decisionsMatch = content.match(/##\s+(?:Decisiones|Decisions|Recent Decisions)[^\n]*\n\n?(.+?)(?=\n##|\n---|$)/is);
    if (decisionsMatch) {
      const decisionsContent = decisionsMatch[1];
      parsed.recentDecisions = decisionsContent
        .split('\n')
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
        .map(line => {
          const text = line.replace(/^[-*]\s+/, '').trim();
          const dateMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
          const contextMatch = text.match(/context[:\s]+(.+)/i);
          return {
            decision: text,
            date: dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0],
            context: contextMatch ? contextMatch[1].trim() : undefined
          };
        });
    }

    // Extraer blockers
    const blockersMatch = content.match(/##\s+(?:Blockers|Bloqueadores|Obstáculos)[^\n]*\n\n?(.+?)(?=\n##|\n---|$)/is);
    if (blockersMatch) {
      parsed.blockers = blockersMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
        .map(line => line.replace(/^[-*]\s+/, '').trim());
    }

    // Extraer próximos pasos
    const nextStepsMatch = content.match(/##\s+(?:Próximos Pasos|Next Steps)[^\n]*\n\n?(.+?)(?=\n##|\n---|$)/is);
    if (nextStepsMatch) {
      parsed.nextSteps = nextStepsMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
        .map(line => line.replace(/^[-*]\s+/, '').trim());
    }

    return parsed;
  } catch (error: any) {
    console.warn(`⚠️  Error parsing current_context.md: ${error.message}`);
    return { rawContent: '' };
  }
}

/**
 * Parsea tasks.md
 */
function parseTasks(tasksPath: string): ParsedTasks {
  if (!fs.existsSync(tasksPath)) {
    return {
      tasks: [],
      completed: [],
      inProgress: [],
      pending: [],
      blocked: []
    };
  }

  try {
    const content = fs.readFileSync(tasksPath, 'utf-8');
    const tasks: Task[] = [];
    const completed: Task[] = [];
    const inProgress: Task[] = [];
    const pending: Task[] = [];
    const blocked: Task[] = [];

    // Parsear tareas (líneas con - [ ] o - [x] o - [~])
    const taskPattern = /^[-*]\s+\[([ x~])\]\s+(.+)$/gm;
    let match;

    while ((match = taskPattern.exec(content)) !== null) {
      const statusChar = match[1];
      const description = match[2].trim();

      let status: Task['status'] = 'pending';
      if (statusChar === 'x' || statusChar === 'X') {
        status = 'completed';
      } else if (statusChar === '~') {
        status = 'blocked';
      }

      // Extraer metadata de la descripción
      const priorityMatch = description.match(/\[(high|medium|low|urgent)\]/i);
      const assigneeMatch = description.match(/@(\w+)/);
      const dueDateMatch = description.match(/due[:\s]+(\d{4}-\d{2}-\d{2})/i);

      const task: Task = {
        description: description
          .replace(/\[(high|medium|low|urgent)\]/i, '')
          .replace(/@\w+/, '')
          .replace(/due[:\s]+\d{4}-\d{2}-\d{2}/i, '')
          .trim(),
        status
      };

      if (priorityMatch) {
        task.priority = priorityMatch[1].toLowerCase() as 'high' | 'medium' | 'low';
      }
      if (assigneeMatch) {
        task.assignee = assigneeMatch[1];
      }
      if (dueDateMatch) {
        task.dueDate = dueDateMatch[1];
      }

      tasks.push(task);

      // Categorizar
      if (status === 'completed') {
        completed.push(task);
      } else if (status === 'blocked') {
        blocked.push(task);
      } else if (description.toLowerCase().includes('in progress') || description.toLowerCase().includes('en progreso')) {
        task.status = 'in-progress';
        inProgress.push(task);
      } else {
        pending.push(task);
      }
    }

    return {
      tasks,
      completed,
      inProgress,
      pending,
      blocked
    };
  } catch (error: any) {
    console.warn(`⚠️  Error parsing tasks.md: ${error.message}`);
    return {
      tasks: [],
      completed: [],
      inProgress: [],
      pending: [],
      blocked: []
    };
  }
}

/**
 * Obtiene la última actividad de un proyecto
 */
function getLastActivity(projectPath: string): string {
  let lastActivity = new Date(0);

  const files = [
    path.join(projectPath, 'master_plan.md'),
    path.join(projectPath, 'current_context.md'),
    path.join(projectPath, 'tasks.md')
  ];

  files.forEach(file => {
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file);
      if (stats.mtime > lastActivity) {
        lastActivity = stats.mtime;
      }
    }
  });

  return lastActivity.toISOString();
}

/**
 * Determina el estado del proyecto
 */
function determineProjectStatus(parsedTasks: ParsedTasks, lastActivity: string): ProjectStatus {
  const now = new Date();
  const lastActivityDate = new Date(lastActivity);
  const daysSinceActivity = (now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24);

  // Si no hay actividad en 30 días, está pausado
  if (daysSinceActivity > 30) {
    return 'paused';
  }

  // Si todas las tareas están completadas, está completado
  if (parsedTasks.tasks.length > 0 && parsedTasks.completed.length === parsedTasks.tasks.length) {
    return 'completed';
  }

  // Si hay tareas en progreso o pendientes, está activo
  if (parsedTasks.inProgress.length > 0 || parsedTasks.pending.length > 0) {
    return 'active';
  }

  return 'active';
}

/**
 * Actualiza quickReference con información específica del proyecto
 */
function updateProjectQuickReference(
  workspace: string,
  project: string,
  projectPath: string,
  masterPlan: ParsedMasterPlan,
  currentContext: ParsedCurrentContext,
  tasks: ParsedTasks,
  lastActivity: string
): QuickReference {
  const now = new Date();
  const projectBasePath = `workspaces/${workspace}/🚀 active-projects/${project}`;

  // Crear memorias recientes desde decisiones recientes y próximos pasos
  const recentMemories: RecentMemory[] = [];
  
  // Agregar decisiones recientes como memorias
  if (currentContext.recentDecisions && currentContext.recentDecisions.length > 0) {
    currentContext.recentDecisions
      .slice(0, 5) // Últimas 5 decisiones
      .forEach((decision, index) => {
        recentMemories.push({
          id: `decision-${index}`,
          content: `Decisión: ${decision.decision}`,
          workspace,
          project,
          updatedAt: decision.date || lastActivity
        });
      });
  }

  // Agregar próximos pasos como memorias
  if (currentContext.nextSteps && currentContext.nextSteps.length > 0) {
    currentContext.nextSteps
      .slice(0, 5) // Próximos 5 pasos
      .forEach((step, index) => {
        recentMemories.push({
          id: `next-step-${index}`,
          content: `Próximo paso: ${step}`,
          workspace,
          project,
          updatedAt: lastActivity
        });
      });
  }

  // Agregar tareas prioritarias/en progreso como memorias
  const priorityTasks = [
    ...tasks.inProgress.filter(t => t.priority === 'high'),
    ...tasks.pending.filter(t => t.priority === 'high'),
    ...tasks.inProgress.filter(t => !t.priority || t.priority === 'medium'),
    ...tasks.pending.filter(t => !t.priority || t.priority === 'medium')
  ].slice(0, 5);

  priorityTasks.forEach((task, index) => {
    recentMemories.push({
      id: `task-${index}`,
      content: `Tarea [${task.priority}]: ${task.description}`,
      workspace,
      project,
      updatedAt: lastActivity
    });
  });

  // Ordenar por fecha más reciente
  recentMemories.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // Archivos del proyecto
  const recentFiles: RecentFile[] = [];
  const projectFiles = [
    { name: 'master_plan.md', path: `${projectBasePath}/master_plan.md` },
    { name: 'current_context.md', path: `${projectBasePath}/current_context.md` },
    { name: 'tasks.md', path: `${projectBasePath}/tasks.md` }
  ];

  projectFiles.forEach(file => {
    const filePath = path.join(PROJECT_ROOT, 'workspaces', workspace, '🚀 active-projects', project, file.name);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      recentFiles.push({
        path: file.path,
        workspace,
        project,
        lastModified: stats.mtime.toISOString()
      });
    }
  });

  // Tags del proyecto (extraer de masterPlan, currentContext si hay)
  const recentTags: string[] = [];
  if (masterPlan.phases && masterPlan.phases.length > 0) {
    recentTags.push('fases');
  }
  if (tasks.inProgress.length > 0) {
    recentTags.push('en-progreso');
  }
  if (tasks.blocked.length > 0) {
    recentTags.push('bloqueado');
  }
  if (currentContext.blockers && currentContext.blockers.length > 0) {
    recentTags.push('blockers');
  }
  if (masterPlan.risks && masterPlan.risks.length > 0) {
    recentTags.push('riesgos');
  }

  // Enlaces rápidos
  const quickLinks = {
    projects: {
      [project]: {
        workspace,
        path: projectBasePath,
        contextPath: `${projectBasePath}/project_context.json`
      }
    },
    workspaces: {
      [workspace]: {
        contextPath: `workspaces/${workspace}/context.json`,
        activeProjects: 1 // Se actualizará desde el workspace context
      }
    }
  };

  return {
    recentMemories: recentMemories.slice(0, 20), // Máximo 20
    activeWorkspaces: [], // No aplica a nivel de proyecto
    recentFiles,
    recentTags,
    quickLinks
  };
}

/**
 * Actualiza project-context.json para un proyecto
 */
function updateProjectContext(workspace: string, project: string): void {
  const projectPath = path.join(PROJECT_ROOT, 'workspaces', workspace, '🚀 active-projects', project);
  
  if (!fs.existsSync(projectPath)) {
    console.warn(`⚠️  Project path does not exist: ${projectPath}`);
    return;
  }

  const masterPlanPath = path.join(projectPath, 'master_plan.md');
  const currentContextPath = path.join(projectPath, 'current_context.md');
  const tasksPath = path.join(projectPath, 'tasks.md');

  // Parsear archivos
  const masterPlan = parseMasterPlan(masterPlanPath);
  const currentContext = parseCurrentContext(currentContextPath);
  const tasks = parseTasks(tasksPath);

  // Obtener última actividad
  const lastActivity = getLastActivity(projectPath);

  // Determinar estado
  const status = determineProjectStatus(tasks, lastActivity);

  // Generar quickReference
  const quickReference = updateProjectQuickReference(
    workspace,
    project,
    projectPath,
    masterPlan,
    currentContext,
    tasks,
    lastActivity
  );

  // Crear project context
  const projectContext: ProjectContext = {
    lastUpdate: new Date().toISOString(),
    project,
    workspace,
    masterPlan,
    currentContext,
    tasks,
    quickReference,
    summary: {
      status,
      lastActivity,
      tasksCount: {
        total: tasks.tasks.length,
        completed: tasks.completed.length,
        pending: tasks.pending.length,
        inProgress: tasks.inProgress.length,
        blocked: tasks.blocked.length
      }
    }
  };

  // Guardar
  const contextPath = path.join(projectPath, 'project_context.json');
  fs.writeFileSync(contextPath, JSON.stringify(projectContext, null, 2), 'utf-8');
  console.log(`✅ Project context updated: ${contextPath}`);
  console.log(`   Status: ${status}, Tasks: ${tasks.tasks.length} (${tasks.completed.length} completed, ${tasks.pending.length} pending)`);

  // Agregar comentarios de sincronización a los archivos MD
  addJsonSyncComment(masterPlanPath, projectContext.lastUpdate, workspace, project);
  addJsonSyncComment(currentContextPath, projectContext.lastUpdate, workspace, project);
  addJsonSyncComment(tasksPath, projectContext.lastUpdate, workspace, project);

  // Archivar archivos MD de contexto opcionales (NO archiva current-context.md por defecto)
  archiveContextMdFiles(projectPath);
}

/**
 * Archiva archivos MD de contexto opcionales después de generar JSON
 * NOTA: NO archiva current_context.md por defecto (se mantiene como documento de trabajo)
 */
function archiveContextMdFiles(projectPath: string): void {
  const contextFiles = [
    // 'current_context.md', // NO archivar por defecto - se mantiene como documento de trabajo
    'working-context.md',
    'personal-context.md',
    'dev-context.md'
  ];

  const archiveDir = path.join(projectPath, '.archived');
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }

  contextFiles.forEach(fileName => {
    const filePath = path.join(projectPath, fileName);
    if (fs.existsSync(filePath)) {
      const archivePath = path.join(archiveDir, `${fileName}.migrated-${Date.now()}`);
      fs.copyFileSync(filePath, archivePath);
      fs.unlinkSync(filePath);
      console.log(`📦 Archived: ${fileName} -> .archived/${path.basename(archivePath)}`);
    }
  });
}

/**
 * Archiva los 3 archivos principales del proyecto (master_plan.md, current_context.md, tasks.md)
 * Solo se ejecuta cuando el usuario lo solicita explícitamente con --archive flag
 */
function archiveProjectFiles(projectPath: string): void {
  const projectFiles = [
    'master_plan.md',
    'current_context.md',
    'tasks.md'
  ];

  const archiveDir = path.join(projectPath, '.archived');
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }

  projectFiles.forEach(fileName => {
    const filePath = path.join(projectPath, fileName);
    if (fs.existsSync(filePath)) {
      const archivePath = path.join(archiveDir, `${fileName}.archived-${Date.now()}`);
      fs.copyFileSync(filePath, archivePath);
      fs.unlinkSync(filePath);
      console.log(`📦 Archived: ${fileName} -> .archived/${path.basename(archivePath)}`);
    }
  });
}

/**
 * Agrega un comentario y nota visible al inicio de los archivos MD con la fecha de última actualización del JSON
 */
function addJsonSyncComment(filePath: string, jsonLastUpdate: string, workspace: string, project: string): void {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Formatear fecha para mostrar
  const jsonDate = new Date(jsonLastUpdate);
  const formattedDate = jsonDate.toLocaleString('es-ES', { 
    dateStyle: 'short', 
    timeStyle: 'short' 
  });

  // Patrones para buscar y reemplazar
  const syncCommentPattern = /<!-- JSON last updated: .+ -->/;
  const syncNotePattern = /> \*\*⚠️ JSON Status:\*\* .+[\s\S]*?Si modificas este archivo/;

  // Comentario HTML (no visible)
  const htmlComment = `<!-- JSON last updated: ${jsonLastUpdate} (${formattedDate}) -->`;
  
  // Nota visible (blockquote)
  const visibleNote = `> **⚠️ JSON Status:** Última actualización: ${formattedDate}
> 
> Si modificas este archivo, ejecuta: \`tsx .dendrita/integrations/scripts/pipelines/context-pipeline/update-project-context.ts --workspace ${workspace} --project ${project}\``;

  let newContent = content;
  
  // Reemplazar o agregar comentario HTML
  if (syncCommentPattern.test(newContent)) {
    newContent = newContent.replace(syncCommentPattern, htmlComment);
  } else {
    // Agregar comentario después del frontmatter si existe
    const frontmatterPattern = /^(---\n[\s\S]*?\n---\n)/;
    if (frontmatterPattern.test(newContent)) {
      newContent = newContent.replace(frontmatterPattern, `$1\n${htmlComment}\n\n`);
    } else {
      newContent = `${htmlComment}\n\n${newContent}`;
    }
  }

  // Reemplazar o agregar nota visible
  if (syncNotePattern.test(newContent)) {
    newContent = newContent.replace(syncNotePattern, visibleNote);
  } else {
    // Agregar nota visible después del comentario HTML
    const commentPattern = new RegExp(`(${htmlComment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`);
    if (commentPattern.test(newContent)) {
      newContent = newContent.replace(commentPattern, `$1\n\n${visibleNote}\n\n`);
    } else {
      // Si no hay comentario, agregar al inicio
      const frontmatterPattern = /^(---\n[\s\S]*?\n---\n)/;
      if (frontmatterPattern.test(newContent)) {
        newContent = newContent.replace(frontmatterPattern, `$1\n\n${visibleNote}\n\n`);
      } else {
        newContent = `${visibleNote}\n\n${newContent}`;
      }
    }
  }

  fs.writeFileSync(filePath, newContent, 'utf-8');
}

/**
 * Verifica si el JSON está desactualizado comparando fechas de modificación de los MD
 */
function isJsonOutOfDate(projectPath: string): boolean {
  const contextPath = path.join(projectPath, 'project_context.json');
  
  if (!fs.existsSync(contextPath)) {
    return true; // No existe JSON, está desactualizado
  }

  try {
    const jsonContent = JSON.parse(fs.readFileSync(contextPath, 'utf-8'));
    const jsonLastUpdate = new Date(jsonContent.lastUpdate);

    const mdFiles = [
      path.join(projectPath, 'master_plan.md'),
      path.join(projectPath, 'current_context.md'),
      path.join(projectPath, 'tasks.md')
    ];

    for (const mdFile of mdFiles) {
      if (fs.existsSync(mdFile)) {
        const stats = fs.statSync(mdFile);
        if (stats.mtime > jsonLastUpdate) {
          return true; // MD fue modificado después del JSON
        }
      }
    }

    return false; // JSON está actualizado
  } catch (error) {
    return true; // Error al leer JSON, asumir desactualizado
  }
}

/**
 * Encuentra todos los proyectos activos
 */
// findAllProjects ahora se importa de utils/common

/**
 * Función principal
 */
function main() {
  try {
    const args = process.argv.slice(2);
    const workspaceIndex = args.indexOf('--workspace');
    const projectIndex = args.indexOf('--project');
    const shouldArchive = args.includes('--archive');
    
    const workspaceFilter = workspaceIndex >= 0 ? args[workspaceIndex + 1] : undefined;
    const projectFilter = projectIndex >= 0 ? args[projectIndex + 1] : undefined;

    if (shouldArchive) {
      console.log('📦 Archiving project files...\n');
      
      if (!workspaceFilter || !projectFilter) {
        console.error('❌ --archive requires --workspace and --project flags');
        console.error('Usage: tsx update-project-context.ts --workspace <workspace> --project <project> --archive');
        process.exit(1);
      }

      const projectPath = path.join(PROJECT_ROOT, 'workspaces', workspaceFilter, '🚀 active-projects', projectFilter);
      if (!fs.existsSync(projectPath)) {
        console.error(`❌ Project path does not exist: ${projectPath}`);
        process.exit(1);
      }

      archiveProjectFiles(projectPath);
      console.log('\n✅ Project files archived!');
      return;
    }

    console.log('🔄 Updating project contexts...\n');

    if (projectFilter) {
      // Buscar proyecto en todos los workspaces o en el workspace especificado
      const allProjects = findAllProjects(workspaceFilter);
      const matchingProjects = allProjects.filter(p => p.project === projectFilter);
      
      if (matchingProjects.length === 0) {
        console.error(`❌ Project "${projectFilter}" not found${workspaceFilter ? ` in workspace "${workspaceFilter}"` : ''}`);
        process.exit(1);
      } else if (matchingProjects.length === 1) {
        // Actualizar proyecto único encontrado
        updateProjectContext(matchingProjects[0].workspace, matchingProjects[0].project);
      } else {
        // Múltiples proyectos con el mismo nombre - actualizar todos
        console.log(`⚠️  Found ${matchingProjects.length} projects with name "${projectFilter}", updating all:\n`);
        matchingProjects.forEach(({ workspace, project }) => {
          updateProjectContext(workspace, project);
        });
      }
    } else {
      // Actualizar todos los proyectos
      const projects = findAllProjects(workspaceFilter);
      console.log(`📁 Found ${projects.length} projects\n`);

      projects.forEach(({ workspace, project }) => {
        updateProjectContext(workspace, project);
      });
    }

    console.log('\n✅ Project context update completed!');
  } catch (error: any) {
    console.error('❌ Error updating project contexts:', error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

export { main, updateProjectContext, parseMasterPlan, parseCurrentContext, parseTasks, archiveContextMdFiles, archiveProjectFiles, addJsonSyncComment, isJsonOutOfDate };

