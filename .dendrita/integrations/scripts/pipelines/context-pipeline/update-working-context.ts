#!/usr/bin/env tsx
/**
 * Script para actualizar dev-context.json y working-context.json automáticamente
 * 
 * Este script analiza:
 * - _temp/ para generar dev-context.json (desarrollo e infraestructura)
 * - workspaces/ para generar working-context.json (temas de trabajo en workspaces)
 * 
 * NOTE: Solo genera JSON, no archivos MD
 * 
 * Uso:
 *   tsx .dendrita/integrations/scripts/utils/update-working-context.ts
 *   tsx .dendrita/integrations/scripts/utils/update-working-context.ts --type dev
 *   tsx .dendrita/integrations/scripts/utils/update-working-context.ts --type workspace
 *   tsx .dendrita/integrations/scripts/utils/update-working-context.ts --type both
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
  products: string[];
  stakeholders: string[];
  hasWorkTimeline: boolean;
  companyManagement: {
    hasBestPractices: boolean;
    hasDashboards: boolean;
    hasTeamProfiles: boolean;
  };
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
      const productsPath = path.join(workspacePath, '📦 products');
      const stakeholdersPath = path.join(workspacePath, '🤝 stakeholders');
      const workTimelinePath = path.join(workspacePath, '📊 work-timeline.md');
      const companyManagementPath = path.join(workspacePath, '⚙️ company-management');
      
      // Analizar proyectos activos
      let activeProjects: string[] = [];
      if (fs.existsSync(activeProjectsPath)) {
        const projects = fs.readdirSync(activeProjectsPath, { withFileTypes: true });
        activeProjects = projects
          .filter(p => p.isDirectory() && !p.name.startsWith('.'))
          .map(p => p.name);
      }
      
      // Analizar productos
      let products: string[] = [];
      if (fs.existsSync(productsPath)) {
        const productEntries = fs.readdirSync(productsPath, { withFileTypes: true });
        products = productEntries
          .filter(p => p.isDirectory() && !p.name.startsWith('.'))
          .map(p => p.name);
      }
      
      // Analizar stakeholders
      let stakeholders: string[] = [];
      if (fs.existsSync(stakeholdersPath)) {
        const stakeholderEntries = fs.readdirSync(stakeholdersPath, { withFileTypes: true });
        stakeholders = stakeholderEntries
          .filter(s => s.isDirectory() && !s.name.startsWith('.'))
          .map(s => s.name);
        
        // También incluir fichas JSON si existen
        const fichasPath = path.join(stakeholdersPath, 'fichas-json');
        if (fs.existsSync(fichasPath)) {
          const fichas = fs.readdirSync(fichasPath, { withFileTypes: true });
          const fichasCount = fichas.filter(f => f.isFile() && f.name.endsWith('.json')).length;
          if (fichasCount > 0) {
            stakeholders.push(`${fichasCount} fichas JSON`);
          }
        }
      }
      
      // Verificar work timeline
      const hasWorkTimeline = fs.existsSync(workTimelinePath);
      
      // Analizar company management
      const companyManagement = {
        hasBestPractices: false,
        hasDashboards: false,
        hasTeamProfiles: false
      };
      
      if (fs.existsSync(companyManagementPath)) {
        const bestPracticesPath = path.join(companyManagementPath, '📚 best-practices');
        const dashboardsPath = path.join(companyManagementPath, 'dashboards');
        const teamProfilesPath = path.join(companyManagementPath, '👥 team-profiles.md');
        
        companyManagement.hasBestPractices = fs.existsSync(bestPracticesPath);
        companyManagement.hasDashboards = fs.existsSync(dashboardsPath);
        companyManagement.hasTeamProfiles = fs.existsSync(teamProfilesPath);
      }
      
      workspaces[entry.name] = {
        status: 'activo',
        activeProjects,
        products,
        stakeholders,
        hasWorkTimeline,
        companyManagement,
        nextSteps: [
          'Revisar estado de proyectos activos',
          'Actualizar current_context.md de proyectos',
          'Revisar productos y stakeholders',
          'Actualizar work timeline si hay cambios significativos'
        ]
      };
    }
  }
  
  return workspaces;
}

// NOTE: MD generation functions removed - only JSON is generated now

/**
 * Lee el contexto existente desde JSON si existe
 */
function readExistingContext<T>(jsonPath: string): T | null {
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
 * Actualiza dev-context (solo JSON)
 */
function updateDevContext(projectRoot: string): void {
  const devContextJsonPath = path.join(projectRoot, '_temp', 'dev-context.json');
  
  const tempDir = path.join(projectRoot, '_temp');
  const workingExportDir = path.join(projectRoot, '_working-export');

  // Analizar directorios
  const tempWorkAreas = analyzeTempDirectory(tempDir);
  const exportWorkAreas = analyzeWorkingExport(workingExportDir);
  const allWorkAreas = [...tempWorkAreas, ...exportWorkAreas];

  // Leer contexto existente
  const existingContext = readExistingContext<DevContext>(devContextJsonPath);

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

  // Asegurar que el directorio existe
  const contextDir = path.dirname(devContextJsonPath);
  if (!fs.existsSync(contextDir)) {
    fs.mkdirSync(contextDir, { recursive: true });
  }

  // Escribir solo JSON
  fs.writeFileSync(devContextJsonPath, JSON.stringify(context, null, 2), 'utf-8');
  
  console.log(`✅ dev-context.json actualizado en: ${devContextJsonPath}`);
  console.log(`📊 Áreas de trabajo identificadas: ${allWorkAreas.length}`);
}

/**
 * Actualiza working-context (solo JSON)
 */
function updateWorkingContext(projectRoot: string): void {
  const workingContextJsonPath = path.join(projectRoot, '_temp', 'working-context.json');
  
  const workspacesDir = path.join(projectRoot, 'workspaces');

  // Analizar workspaces
  const workspaces = analyzeWorkspaces(workspacesDir);

  // Leer contexto existente
  const existingContext = readExistingContext<WorkingContext>(workingContextJsonPath);

  // Calcular resumen
  let totalProjects = 0;
  let inProgressProjects = 0;
  let pendingProjects = 0;
  let totalProducts = 0;
  let inDevelopmentProducts = 0;
  let totalStakeholders = 0;
  let activeStakeholders = 0;

  Object.values(workspaces).forEach(ws => {
    totalProjects += ws.activeProjects.length;
    totalProducts += ws.products.length;
    totalStakeholders += ws.stakeholders.length;
    // TODO: Leer current_context.md de cada proyecto para determinar estado
    // TODO: Leer estado de productos y stakeholders desde sus archivos
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
      products: {
        total: totalProducts,
        inDevelopment: inDevelopmentProducts
      },
      stakeholders: {
        total: totalStakeholders,
        active: activeStakeholders
      }
    },
    notes: existingContext?.notes || [
      'Este archivo es para temas de trabajo en workspaces',
      'Revisar current_context.md de cada proyecto para estado detallado',
      'Actualizar este contexto cuando haya cambios significativos en workspaces'
    ]
  };

  // Asegurar que el directorio existe
  const contextDir = path.dirname(workingContextJsonPath);
  if (!fs.existsSync(contextDir)) {
    fs.mkdirSync(contextDir, { recursive: true });
  }

  // Escribir solo JSON
  fs.writeFileSync(workingContextJsonPath, JSON.stringify(context, null, 2), 'utf-8');
  
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

export { main, analyzeTempDirectory, analyzeWorkspaces };
