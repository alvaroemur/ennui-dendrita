#!/usr/bin/env tsx
/**
 * Script para archivar todos los archivos *-context.md existentes
 * 
 * Este script:
 * - Busca todos los archivos current_context.md, working-context.md, personal-context.md, dev-context.md
 * - Genera project_context.json para cada proyecto que tenga current_context.md
 * - Archiva los archivos MD después de generar JSON
 * - Archiva archivos MD de _temp/ después de migración
 * 
 * Uso:
 *   tsx .dendrita/integrations/scripts/archive-all-context-md.ts
 *   tsx .dendrita/integrations/scripts/archive-all-context-md.ts --dry-run
 */

import * as fs from 'fs';
import * as path from 'path';
import { PROJECT_ROOT } from './utils/common';
import { updateProjectContext } from './update-project-context';

/**
 * Archiva un archivo MD moviéndolo a .archived/
 */
function archiveMdFile(filePath: string, archiveBaseDir: string): void {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const archiveDir = path.join(archiveBaseDir, '.archived');
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }

  const fileName = path.basename(filePath);
  const archivePath = path.join(archiveDir, `${fileName}.migrated-${Date.now()}`);

  fs.copyFileSync(filePath, archivePath);
  fs.unlinkSync(filePath);
  console.log(`📦 Archived: ${filePath} -> ${archivePath}`);
}

/**
 * Encuentra todos los archivos current_context.md
 */
function findAllCurrentContextFiles(): Array<{ workspace: string; project: string; path: string }> {
  const files: Array<{ workspace: string; project: string; path: string }> = [];
  const workspacesDir = path.join(PROJECT_ROOT, 'workspaces');

  if (!fs.existsSync(workspacesDir)) {
    return files;
  }

  const workspaceEntries = fs.readdirSync(workspacesDir, { withFileTypes: true });

  for (const entry of workspaceEntries) {
    if (entry.isDirectory()) {
      const workspace = entry.name;
      const activeProjectsPath = path.join(workspacesDir, workspace, '🚀 active-projects');
      const archivedProjectsPath = path.join(workspacesDir, workspace, '_archived-projects');

      // Buscar en proyectos activos
      if (fs.existsSync(activeProjectsPath)) {
        const projectEntries = fs.readdirSync(activeProjectsPath, { withFileTypes: true });
        for (const projectEntry of projectEntries) {
          if (projectEntry.isDirectory()) {
            const currentContextPath = path.join(activeProjectsPath, projectEntry.name, 'current_context.md');
            if (fs.existsSync(currentContextPath)) {
              files.push({
                workspace,
                project: projectEntry.name,
                path: currentContextPath
              });
            }
          }
        }
      }

      // Buscar en proyectos archivados
      if (fs.existsSync(archivedProjectsPath)) {
        const projectEntries = fs.readdirSync(archivedProjectsPath, { withFileTypes: true });
        for (const projectEntry of projectEntries) {
          if (projectEntry.isDirectory()) {
            const currentContextPath = path.join(archivedProjectsPath, projectEntry.name, 'current_context.md');
            if (fs.existsSync(currentContextPath)) {
              files.push({
                workspace,
                project: projectEntry.name,
                path: currentContextPath
              });
            }
          }
        }
      }
    }
  }

  return files;
}

/**
 * Archiva archivos MD de contexto en _temp/
 */
function archiveTempContextFiles(): void {
  const tempDir = path.join(PROJECT_ROOT, '_temp');
  if (!fs.existsSync(tempDir)) {
    return;
  }

  const contextFiles = [
    'dev-context.md',
    'working-context.md',
    'personal-context.md'
  ];

  contextFiles.forEach(fileName => {
    const filePath = path.join(tempDir, fileName);
    if (fs.existsSync(filePath)) {
      archiveMdFile(filePath, tempDir);
    }
  });
}

/**
 * Función principal
 */
function main() {
  try {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');

    console.log('🔄 Archiving all context MD files...\n');

    if (dryRun) {
      console.log('🔍 DRY RUN MODE - No files will be modified\n');
    }

    // 1. Generar project_context.json para todos los proyectos con current_context.md
    console.log('📁 Step 1: Generating project_context.json for all projects...\n');
    const currentContextFiles = findAllCurrentContextFiles();

    console.log(`Found ${currentContextFiles.length} projects with current_context.md\n`);

    if (!dryRun) {
      // Generar project_context.json para cada proyecto
      currentContextFiles.forEach(({ workspace, project }) => {
        try {
          updateProjectContext(workspace, project);
        } catch (error: any) {
          console.warn(`⚠️  Error updating project ${workspace}/${project}: ${error.message}`);
        }
      });
    } else {
      currentContextFiles.forEach(({ workspace, project, path: filePath }) => {
        console.log(`   Would update: ${workspace}/${project} (${filePath})`);
      });
    }

    console.log('\n');

    // 2. Archivar archivos MD de contexto en _temp/
    console.log('📁 Step 2: Archiving context MD files in _temp/...\n');
    if (!dryRun) {
      archiveTempContextFiles();
    } else {
      const tempDir = path.join(PROJECT_ROOT, '_temp');
      const contextFiles = ['dev-context.md', 'working-context.md', 'personal-context.md'];
      contextFiles.forEach(fileName => {
        const filePath = path.join(tempDir, fileName);
        if (fs.existsSync(filePath)) {
          console.log(`   Would archive: ${filePath}`);
        }
      });
    }

    console.log('\n✅ Archive completed!');
    if (dryRun) {
      console.log('\n⚠️  This was a dry run. Run without --dry-run to actually archive files.');
    }
  } catch (error: any) {
    console.error('❌ Error archiving context MD files:', error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

export { main, findAllCurrentContextFiles, archiveTempContextFiles };

