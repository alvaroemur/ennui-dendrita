#!/usr/bin/env tsx
/**
 * Script para actualizar dev-context.md y working-context.md automáticamente
 * 
 * Este script analiza:
 * - _temp/ para generar dev-context.md (desarrollo e infraestructura)
 * - workspaces/ para generar working-context.md (temas de trabajo en workspaces)
 * 
 * Uso:
 *   tsx .dendrita/integrations/scripts/update-working-context.ts
 *   tsx .dendrita/integrations/scripts/update-working-context.ts --type dev
 *   tsx .dendrita/integrations/scripts/update-working-context.ts --type workspace
 *   tsx .dendrita/integrations/scripts/update-working-context.ts --type both
 */

import * as fs from 'fs';
import * as path from 'path';

interface WorkArea {
  name: string;
  files: string[];
  description: string;
  status: string;
  nextSteps?: string[];
}

interface Priority {
  urgent: string[];
  inProgress: string[];
  next: string[];
}

interface DevContext {
  lastUpdate: string;
  type: 'dev-context';
  description: string;
  priorities: Priority;
  currentWork: WorkArea[];
  infrastructure: {
    hooks: Array<{ name: string; status: string; description: string }>;
    scripts: Array<{ name: string; status: string; description: string }>;
    config: string[];
  };
  tempFiles: {
    basePath: string;
    structure: string[];
  };
  notes: string[];
}

interface WorkspaceInfo {
  status: string;
  activeProjects: string[];
  nextSteps: string[];
}

interface WorkingContext {
  lastUpdate: string;
  type: 'working-context';
  description: string;
  priorities: Priority;
  workspaces: Record<string, WorkspaceInfo>;
  summary: {
    projects: { total: number; inProgress: number; pending: number };
    products: { total: number; inDevelopment: number };
    stakeholders: { total: number; active: number };
  };
  notes: string[];
}

/**
 * Analiza el directorio _temp/ para identificar áreas de trabajo de desarrollo
 */
function analyzeTempDirectory(tempDir: string): WorkArea[] {
  const workAreas: WorkArea[] = [];
  
  if (!fs.existsSync(tempDir)) {
    return workAreas;
  }

  const entries = fs.readdirSync(tempDir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const dirPath = path.join(tempDir, entry.name);
      const files = fs.readdirSync(dirPath, { recursive: true });
      
      workAreas.push({
        name: entry.name,
        files: files.map(f => path.join(entry.name, f)),
        description: `Archivos en ${entry.name}/`,
        status: 'En progreso'
      });
    } else if (entry.name.endsWith('.md') && entry.name !== 'dev-context.md') {
      workAreas.push({
        name: entry.name.replace('.md', ''),
        files: [entry.name],
        description: `Archivo markdown: ${entry.name}`,
        status: 'En progreso'
      });
    }
  }
  
  return workAreas;
}

/**
 * Analiza archivos en _working-export/ para identificar trabajo relacionado
 */
function analyzeWorkingExport(workingExportDir: string): WorkArea[] {
  const workAreas: WorkArea[] = [];
  
  if (!fs.existsSync(workingExportDir)) {
    return workAreas;
  }

  const files = fs.readdirSync(workingExportDir);
  const mdFiles = files.filter(f => f.endsWith('.md'));
  
  if (mdFiles.length > 0) {
    workAreas.push({
      name: 'Exportaciones de Trabajo',
      files: mdFiles,
      description: `Archivos en ${workingExportDir}/`,
      status: 'En progreso'
    });
  }
  
  return workAreas;
}

/**
 * Analiza workspaces para identificar proyectos activos
 */
function analyzeWorkspaces(workspacesDir: string): Record<string, WorkspaceInfo> {
  const workspaces: Record<string, WorkspaceInfo> = {};
  
  if (!fs.existsSync(workspacesDir)) {
    return workspaces;
  }

  const entries = fs.readdirSync(workspacesDir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const workspacePath = path.join(workspacesDir, entry.name);
      const activeProjectsPath = path.join(workspacePath, '🚀 active-projects');
      
      let activeProjects: string[] = [];
      if (fs.existsSync(activeProjectsPath)) {
        const projects = fs.readdirSync(activeProjectsPath, { withFileTypes: true });
        activeProjects = projects
          .filter(p => p.isDirectory())
          .map(p => p.name);
      }
      
      workspaces[entry.name] = {
        status: 'activo',
        activeProjects,
        nextSteps: [
          'Revisar estado de proyectos activos',
          'Actualizar current-context.md de proyectos'
        ]
      };
    }
  }
  
  return workspaces;
}

/**
 * Genera el contenido de dev-context.md
 */
function generateDevContext(context: DevContext): string {
  const prioritiesSection = `
### 🔴 Urgente
${context.priorities.urgent.length > 0 
  ? context.priorities.urgent.map(p => `- ${p}`).join('\n')
  : '- (ninguna acción urgente pendiente)'}

### 🟡 En Progreso
${context.priorities.inProgress.length > 0
  ? context.priorities.inProgress.map(p => `- ${p}`).join('\n')
  : '- (ninguna acción en progreso)'}

### 🟢 Próximas
${context.priorities.next.length > 0
  ? context.priorities.next.map(p => `- ${p}`).join('\n')
  : '- (ninguna acción próxima)'}`;

  const currentWorkSection = context.currentWork.map(work => {
    const filesList = work.files.length > 0 
      ? work.files.map(f => `- ${f}`).join('\n')
      : '- (sin archivos específicos)';
    
    const nextStepsSection = work.nextSteps && work.nextSteps.length > 0
      ? `\n**Próximos pasos:**\n${work.nextSteps.map(s => `- ${s}`).join('\n')}`
      : '';
    
    return `### ${work.name}
**Estado:** ${work.status}
${work.description}

**Archivos:**
${filesList}${nextStepsSection}`;
  }).join('\n\n---\n\n');

  const infrastructureSection = `
### Hooks y Agents
${context.infrastructure.hooks.map(h => `- ${h.name} (${h.status}): ${h.description}`).join('\n')}

### Scripts
${context.infrastructure.scripts.map(s => `- ${s.name} (${s.status}): ${s.description}`).join('\n')}

### Configuración
${context.infrastructure.config.map(c => `- ${c}`).join('\n')}`;

  const tempFilesSection = `
\`\`\`
${context.tempFiles.basePath}
${context.tempFiles.structure.map(s => `├── ${s}`).join('\n')}
\`\`\``;

  const notesSection = context.notes.map(note => `- ${note}`).join('\n');

  return `# Dev Context - Desarrollo e Infraestructura

**Última actualización:** ${context.lastUpdate}

---

## 🎯 Acciones Prioritarias
${prioritiesSection}

---

## 📝 Trabajo Actual

${currentWorkSection}

---

## 🔧 Infraestructura
${infrastructureSection}

---

## 📂 Archivos Temporales
${tempFilesSection}

---

## 📌 Notas

${notesSection}
`;
}

/**
 * Genera el contenido de working-context.md
 */
function generateWorkingContext(context: WorkingContext): string {
  const prioritiesSection = `
### 🔴 Urgente
${context.priorities.urgent.length > 0 
  ? context.priorities.urgent.map(p => `- ${p}`).join('\n')
  : '- (ninguna acción urgente pendiente)'}

### 🟡 En Progreso
${context.priorities.inProgress.length > 0
  ? context.priorities.inProgress.map(p => `- ${p}`).join('\n')
  : '- (ninguna acción en progreso)'}

### 🟢 Próximas
${context.priorities.next.length > 0
  ? context.priorities.next.map(p => `- ${p}`).join('\n')
  : '- (ninguna acción próxima)'}`;

  const workspacesSection = Object.entries(context.workspaces).map(([name, info]) => {
    const projectsList = info.activeProjects.length > 0
      ? info.activeProjects.map(p => `- ${p}`).join('\n')
      : '- (revisar `workspaces/${name}/🚀 active-projects/`)';
    
    const nextStepsSection = info.nextSteps.length > 0
      ? `\n**Próximos pasos:**\n${info.nextSteps.map(s => `- ${s}`).join('\n')}`
      : '';
    
    return `### ${name}
**Estado:** ${info.status}
**Proyectos activos:** ${projectsList}${nextStepsSection}`;
  }).join('\n\n---\n\n');

  const summarySection = `
### Proyectos
- **Total:** ${context.summary.projects.total}
- **En progreso:** ${context.summary.projects.inProgress}
- **Pendientes:** ${context.summary.projects.pending}

### Productos
- **Total:** ${context.summary.products.total}
- **En desarrollo:** ${context.summary.products.inDevelopment}

### Aliados
- **Total:** ${context.summary.stakeholders.total}
- **Activos:** ${context.summary.stakeholders.active}`;

  const notesSection = context.notes.map(note => `- ${note}`).join('\n');

  return `# Working Context - Temas de Trabajo en Workspaces

**Última actualización:** ${context.lastUpdate}

---

## 🎯 Acciones Prioritarias
${prioritiesSection}

---

## 📝 Trabajo Actual por Workspace

${workspacesSection}

---

## 📊 Resumen por Tipo de Trabajo
${summarySection}

---

## 📌 Notas

${notesSection}
`;
}

/**
 * Lee el contexto existente desde JSON si existe
 */
function readExistingContext<T>(contextPath: string): T | null {
  const jsonPath = contextPath.replace('.md', '.json');
  
  if (!fs.existsSync(jsonPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(jsonPath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error) {
    console.warn(`⚠️  Error leyendo ${jsonPath}:`, error);
    return null;
  }
}

/**
 * Genera la estructura de archivos en formato árbol
 */
function generateFileStructure(tempDir: string): string[] {
  if (!fs.existsSync(tempDir)) {
    return [];
  }

  const entries = fs.readdirSync(tempDir, { withFileTypes: true });
  return entries
    .filter(e => e.isDirectory() || (e.isFile() && e.name !== 'dev-context.md' && e.name !== 'dev-context.json'))
    .map(e => e.name);
}

/**
 * Actualiza dev-context
 */
function updateDevContext(projectRoot: string): void {
  const devContextPath = path.join(projectRoot, '_temp', 'dev-context.md');
  const devContextJsonPath = path.join(projectRoot, '_temp', 'dev-context.json');
  
  const tempDir = path.join(projectRoot, '_temp');
  const workingExportDir = path.join(projectRoot, '_working-export');

  // Analizar directorios
  const tempWorkAreas = analyzeTempDirectory(tempDir);
  const exportWorkAreas = analyzeWorkingExport(workingExportDir);
  const allWorkAreas = [...tempWorkAreas, ...exportWorkAreas];

  // Leer contexto existente
  const existingContext = readExistingContext<DevContext>(devContextPath);

  // Generar nuevo contexto
  const context: DevContext = {
    lastUpdate: new Date().toISOString().split('T')[0],
    type: 'dev-context',
    description: 'Contexto de desarrollo e infraestructura',
    priorities: existingContext?.priorities || {
      urgent: [],
      inProgress: [],
      next: []
    },
    currentWork: allWorkAreas.length > 0 ? allWorkAreas : existingContext?.currentWork || [],
    infrastructure: existingContext?.infrastructure || {
      hooks: [],
      scripts: [],
      config: []
    },
    tempFiles: {
      basePath: '_temp/',
      structure: generateFileStructure(tempDir)
    },
    notes: existingContext?.notes || [
      'Este archivo es para temas de desarrollo e infraestructura',
      'Los archivos en _temp/ son de trabajo y pueden ser eliminados o movidos',
      'Mantener este archivo actualizado con el trabajo en progreso'
    ]
  };

  // Generar contenido
  const content = generateDevContext(context);

  // Asegurar que el directorio existe
  const contextDir = path.dirname(devContextPath);
  if (!fs.existsSync(contextDir)) {
    fs.mkdirSync(contextDir, { recursive: true });
  }

  // Escribir archivos
  fs.writeFileSync(devContextPath, content, 'utf-8');
  fs.writeFileSync(devContextJsonPath, JSON.stringify(context, null, 2), 'utf-8');
  
  console.log(`✅ dev-context.md actualizado en: ${devContextPath}`);
  console.log(`✅ dev-context.json actualizado en: ${devContextJsonPath}`);
  console.log(`📊 Áreas de trabajo identificadas: ${allWorkAreas.length}`);
}

/**
 * Actualiza working-context
 */
function updateWorkingContext(projectRoot: string): void {
  const workingContextPath = path.join(projectRoot, '_temp', 'working-context.md');
  const workingContextJsonPath = path.join(projectRoot, '_temp', 'working-context.json');
  
  const workspacesDir = path.join(projectRoot, 'workspaces');

  // Analizar workspaces
  const workspaces = analyzeWorkspaces(workspacesDir);

  // Leer contexto existente
  const existingContext = readExistingContext<WorkingContext>(workingContextPath);

  // Calcular resumen
  let totalProjects = 0;
  let inProgressProjects = 0;
  let pendingProjects = 0;

  Object.values(workspaces).forEach(ws => {
    totalProjects += ws.activeProjects.length;
    // TODO: Leer current-context.md de cada proyecto para determinar estado
  });

  // Generar nuevo contexto
  const context: WorkingContext = {
    lastUpdate: new Date().toISOString().split('T')[0],
    type: 'working-context',
    description: 'Contexto de temas de trabajo en workspaces',
    priorities: existingContext?.priorities || {
      urgent: [],
      inProgress: [],
      next: []
    },
    workspaces: Object.keys(workspaces).length > 0 ? workspaces : existingContext?.workspaces || {},
    summary: {
      projects: {
        total: totalProjects,
        inProgress: inProgressProjects,
        pending: pendingProjects
      },
      products: existingContext?.summary.products || {
        total: 0,
        inDevelopment: 0
      },
      stakeholders: existingContext?.summary.stakeholders || {
        total: 0,
        active: 0
      }
    },
    notes: existingContext?.notes || [
      'Este archivo es para temas de trabajo en workspaces',
      'Revisar current-context.md de cada proyecto para estado detallado',
      'Actualizar este contexto cuando haya cambios significativos en workspaces'
    ]
  };

  // Generar contenido
  const content = generateWorkingContext(context);

  // Asegurar que el directorio existe
  const contextDir = path.dirname(workingContextPath);
  if (!fs.existsSync(contextDir)) {
    fs.mkdirSync(contextDir, { recursive: true });
  }

  // Escribir archivos
  fs.writeFileSync(workingContextPath, content, 'utf-8');
  fs.writeFileSync(workingContextJsonPath, JSON.stringify(context, null, 2), 'utf-8');
  
  console.log(`✅ working-context.md actualizado en: ${workingContextPath}`);
  console.log(`✅ working-context.json actualizado en: ${workingContextJsonPath}`);
  console.log(`📊 Workspaces identificados: ${Object.keys(context.workspaces).length}`);
}

/**
 * Función principal
 */
function main() {
  const args = process.argv.slice(2);
  const type = args.includes('--type') 
    ? args[args.indexOf('--type') + 1]
    : 'both';

  const projectRoot = process.cwd();

  if (type === 'dev' || type === 'both') {
    updateDevContext(projectRoot);
  }

  if (type === 'workspace' || type === 'both') {
    updateWorkingContext(projectRoot);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

export { main, generateDevContext, generateWorkingContext, analyzeTempDirectory, analyzeWorkspaces };
