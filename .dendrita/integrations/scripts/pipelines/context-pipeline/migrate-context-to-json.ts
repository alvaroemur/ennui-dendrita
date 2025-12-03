#!/usr/bin/env tsx
/**
 * Script de migración: Convierte archivos MD de contexto existentes a estructura JSON de memorias
 * 
 * Este script:
 * - Lee dev-context.md, working-context.md, personal-context.md
 * - Convierte su contenido a memorias en formato JSON
 * - Genera JSONs iniciales con quickReference poblado
 * - Archiva (no elimina) archivos MD antiguos
 * 
 * Uso:
 *   tsx .dendrita/integrations/scripts/migrate-context-to-json.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  UserContext,
  Memory,
  MemoryMetadata,
  QuickReference,
  MemoryRelevance,
  MemoryStatus
} from './utils/context-types';
import { PROJECT_ROOT, getUserId } from './utils/common';

/**
 * Convierte contenido de dev-context.md a memorias
 */
function parseDevContextToMemories(content: string): Memory[] {
  const memories: Memory[] = [];
  const now = new Date().toISOString();

  // Extraer áreas de trabajo
  const workAreasMatch = content.match(/## 📝 Trabajo Actual\s*\n\n(.+?)(?=\n##|\n---|$)/is);
  if (workAreasMatch) {
    const workAreasContent = workAreasMatch[1];
    const workAreaSections = workAreasContent.split(/\n###\s+/);

    workAreaSections.forEach(section => {
      if (!section.trim()) return;

      const lines = section.split('\n');
      const name = lines[0].trim();
      const description = lines.find(l => l.includes('**Descripción:**'))?.replace(/\*\*Descripción:\*\*\s*/, '').trim() || '';
      const status = lines.find(l => l.includes('**Estado:**'))?.replace(/\*\*Estado:\*\*\s*/, '').trim() || 'En progreso';

      // Extraer archivos
      const filesMatch = section.match(/\*\*Archivos:\*\*\s*\n((?:- .+\n?)+)/);
      const files = filesMatch
        ? filesMatch[1].split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^-\s+/, '').trim())
        : [];

      const memory: Memory = {
        id: uuidv4(),
        content: `Área de trabajo: ${name}${description ? ` - ${description}` : ''}`,
        metadata: {
          files,
          tags: ['dev-context', 'work-area', name.toLowerCase().replace(/\s+/g, '-')],
          createdAt: now,
          updatedAt: now,
          relevance: 'medium' as MemoryRelevance,
          status: 'active' as MemoryStatus
        }
      };

      memories.push(memory);
    });
  }

  // Extraer prioridades
  const prioritiesMatch = content.match(/## 🎯 Acciones Prioritarias\s*\n\n(.+?)(?=\n##|\n---|$)/is);
  if (prioritiesMatch) {
    const prioritiesContent = prioritiesMatch[1];
    
    // Urgentes
    const urgentMatch = prioritiesContent.match(/### 🔴 Urgente\s*\n((?:- .+\n?)+)/);
    if (urgentMatch) {
      urgentMatch[1].split('\n').filter(l => l.trim().startsWith('-') && !l.includes('ninguna')).forEach(item => {
        const text = item.replace(/^-\s+/, '').trim();
        if (text) {
          memories.push({
            id: uuidv4(),
            content: `Prioridad urgente: ${text}`,
            metadata: {
              files: [],
              tags: ['dev-context', 'priority', 'urgent'],
              createdAt: now,
              updatedAt: now,
              relevance: 'high' as MemoryRelevance,
              status: 'active' as MemoryStatus
            }
          });
        }
      });
    }

    // En progreso
    const inProgressMatch = prioritiesContent.match(/### 🟡 En Progreso\s*\n((?:- .+\n?)+)/);
    if (inProgressMatch) {
      inProgressMatch[1].split('\n').filter(l => l.trim().startsWith('-') && !l.includes('ninguna')).forEach(item => {
        const text = item.replace(/^-\s+/, '').trim();
        if (text) {
          memories.push({
            id: uuidv4(),
            content: `En progreso: ${text}`,
            metadata: {
              files: [],
              tags: ['dev-context', 'priority', 'in-progress'],
              createdAt: now,
              updatedAt: now,
              relevance: 'high' as MemoryRelevance,
              status: 'active' as MemoryStatus
            }
          });
        }
      });
    }
  }

  return memories;
}

/**
 * Convierte contenido de working-context.md a memorias
 */
function parseWorkingContextToMemories(content: string): Memory[] {
  const memories: Memory[] = [];
  const now = new Date().toISOString();

  // Extraer workspaces y proyectos
  const workspacesMatch = content.match(/## 📝 Trabajo Actual por Workspace\s*\n\n(.+?)(?=\n##|\n---|$)/is);
  if (workspacesMatch) {
    const workspacesContent = workspacesMatch[1];
    const workspaceSections = workspacesContent.split(/\n###\s+/);

    workspaceSections.forEach(section => {
      if (!section.trim()) return;

      const lines = section.split('\n');
      const workspaceName = lines[0].trim();

      // Extraer proyectos activos
      const projectsMatch = section.match(/\*\*Proyectos activos:\*\*\s*\n((?:- .+\n?)+)/);
      const projects = projectsMatch
        ? projectsMatch[1].split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^-\s+/, '').trim())
        : [];

      projects.forEach(projectName => {
        const memory: Memory = {
          id: uuidv4(),
          content: `Proyecto activo: ${projectName} en workspace ${workspaceName}`,
          metadata: {
            workspace: workspaceName,
            project: projectName,
            files: [],
            tags: ['working-context', 'project', workspaceName.toLowerCase()],
            createdAt: now,
            updatedAt: now,
            relevance: 'high' as MemoryRelevance,
            status: 'active' as MemoryStatus
          }
        };

        memories.push(memory);
      });
    });
  }

  return memories;
}

/**
 * Convierte contenido de personal-context.md a memorias
 */
function parsePersonalContextToMemories(content: string): Memory[] {
  const memories: Memory[] = [];
  const now = new Date().toISOString();

  // Extraer proyectos personales
  const projectsMatch = content.match(/## 📝 Trabajo Actual por Proyecto\s*\n\n(.+?)(?=\n##|\n---|$)/is);
  if (projectsMatch) {
    const projectsContent = projectsMatch[1];
    const projectSections = projectsContent.split(/\n###\s+/);

    projectSections.forEach(section => {
      if (!section.trim()) return;

      const lines = section.split('\n');
      const projectName = lines[0].trim();
      const status = lines.find(l => l.includes('**Estado:**'))?.replace(/\*\*Estado:\*\*\s*/, '').trim() || '';
      const type = lines.find(l => l.includes('**Tipo:**'))?.replace(/\*\*Tipo:\*\*\s*/, '').trim() || '';

      const memory: Memory = {
        id: uuidv4(),
        content: `Proyecto personal: ${projectName}${type ? ` (${type})` : ''} - ${status}`,
        metadata: {
          workspace: 'personal',
          project: projectName,
          files: [],
          tags: ['personal-context', 'project', 'personal'],
          createdAt: now,
          updatedAt: now,
          relevance: 'high' as MemoryRelevance,
          status: (status.includes('Detenido') || status.includes('Paused')) ? 'archived' as MemoryStatus : 'active' as MemoryStatus
        }
      };

      memories.push(memory);
    });
  }

  return memories;
}

/**
 * Crea quickReference inicial desde memorias
 */
function createInitialQuickReference(memories: Memory[]): QuickReference {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Últimas 20 memorias más recientes
  const recentMemories = memories
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

  // Workspaces activos
  const workspaceMap = new Map<string, { activeProjects: string[]; lastActivity: string }>();
  memories.forEach(m => {
    if (m.metadata.workspace) {
      const ws = workspaceMap.get(m.metadata.workspace) || { activeProjects: [], lastActivity: m.metadata.updatedAt };
      if (m.metadata.project && !ws.activeProjects.includes(m.metadata.project)) {
        ws.activeProjects.push(m.metadata.project);
      }
      if (new Date(m.metadata.updatedAt) > new Date(ws.lastActivity)) {
        ws.lastActivity = m.metadata.updatedAt;
      }
      workspaceMap.set(m.metadata.workspace, ws);
    }
  });

  const activeWorkspaces = Array.from(workspaceMap.entries())
    .filter(([_, info]) => new Date(info.lastActivity) >= sevenDaysAgo)
    .map(([name, info]) => ({
      name,
      activeProjects: info.activeProjects,
      lastActivity: info.lastActivity
    }));

  // Archivos recientes
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

  const recentFiles = Array.from(fileMap.values()).slice(0, 30);

  // Tags más usados
  const tagCounts = new Map<string, number>();
  memories.forEach(m => {
    m.metadata.tags.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  const recentTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag);

  // QuickLinks
  const quickLinks = {
    projects: {} as Record<string, { workspace: string; path: string; contextPath: string }>,
    workspaces: {} as Record<string, { contextPath: string; activeProjects: number }>
  };

  workspaceMap.forEach((info, workspaceName) => {
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
 * Archiva un archivo MD moviéndolo a _temp/.archived/
 */
function archiveMdFile(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const archiveDir = path.join(PROJECT_ROOT, '_temp', '.archived');
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }

  const fileName = path.basename(filePath);
  const archivePath = path.join(archiveDir, `${fileName}.migrated-${Date.now()}`);

  fs.copyFileSync(filePath, archivePath);
  console.log(`📦 Archived: ${filePath} -> ${archivePath}`);
}

/**
 * Función principal de migración
 */
function main() {
  try {
    console.log('🔄 Migrating context files from MD to JSON...\n');

    const userId = getUserId();
    console.log(`👤 User ID: ${userId}\n`);

    const tempDir = path.join(PROJECT_ROOT, '_temp');
    const allMemories: Memory[] = [];

    // Migrar dev-context.md
    const devContextPath = path.join(tempDir, 'dev-context.md');
    if (fs.existsSync(devContextPath)) {
      console.log('📄 Migrating dev-context.md...');
      const content = fs.readFileSync(devContextPath, 'utf-8');
      const memories = parseDevContextToMemories(content);
      allMemories.push(...memories);
      console.log(`   ✅ Extracted ${memories.length} memories\n`);
      archiveMdFile(devContextPath);
    }

    // Migrar working-context.md
    const workingContextPath = path.join(tempDir, 'working-context.md');
    if (fs.existsSync(workingContextPath)) {
      console.log('📄 Migrating working-context.md...');
      const content = fs.readFileSync(workingContextPath, 'utf-8');
      const memories = parseWorkingContextToMemories(content);
      allMemories.push(...memories);
      console.log(`   ✅ Extracted ${memories.length} memories\n`);
      archiveMdFile(workingContextPath);
    }

    // Migrar personal-context.md
    const personalContextPath = path.join(tempDir, 'personal-context.md');
    if (fs.existsSync(personalContextPath)) {
      console.log('📄 Migrating personal-context.md...');
      const content = fs.readFileSync(personalContextPath, 'utf-8');
      const memories = parsePersonalContextToMemories(content);
      allMemories.push(...memories);
      console.log(`   ✅ Extracted ${memories.length} memories\n`);
      archiveMdFile(personalContextPath);
    }

    if (allMemories.length === 0) {
      console.log('ℹ️  No context files found to migrate\n');
      return;
    }

    // Crear quickReference inicial
    const quickReference = createInitialQuickReference(allMemories);

    // Crear user context
    const userContext: UserContext = {
      lastUpdate: new Date().toISOString(),
      type: 'user-context',
      quickReference,
      memories: allMemories,
      summary: {
        totalMemories: allMemories.length,
        activeMemories: allMemories.filter(m => m.metadata.status === 'active').length,
        byWorkspace: allMemories.reduce((acc, m) => {
          if (m.metadata.workspace) {
            acc[m.metadata.workspace] = (acc[m.metadata.workspace] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>),
        byProject: allMemories.reduce((acc, m) => {
          if (m.metadata.workspace && m.metadata.project) {
            const key = `${m.metadata.workspace}/${m.metadata.project}`;
            acc[key] = (acc[key] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>)
      }
    };

    // Guardar user context
    const userContextPath = path.join(PROJECT_ROOT, '.dendrita', 'users', userId, 'context.json');
    const userContextDir = path.dirname(userContextPath);
    if (!fs.existsSync(userContextDir)) {
      fs.mkdirSync(userContextDir, { recursive: true });
    }

    fs.writeFileSync(userContextPath, JSON.stringify(userContext, null, 2), 'utf-8');
    console.log(`✅ User context created: ${userContextPath}`);
    console.log(`📊 Total memories: ${allMemories.length} (${userContext.summary.activeMemories} active)\n`);

    console.log('✅ Migration completed!');
  } catch (error: any) {
    console.error('❌ Error during migration:', error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

export { main, parseDevContextToMemories, parseWorkingContextToMemories, parsePersonalContextToMemories };

