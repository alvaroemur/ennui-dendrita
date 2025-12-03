#!/usr/bin/env tsx
/**
 * Script para agregar emojis a los nombres de workspaces, replicando la estructura de Google Drive
 * 
 * Este script:
 * - Renombra las carpetas de workspaces agregando emojis al inicio
 * - Actualiza todas las referencias a estos workspaces en los archivos
 * - Crea backups de los archivos modificados
 * 
 * Uso:
 *   tsx .dendrita/integrations/scripts/add-emoji-to-workspaces.ts
 *   tsx .dendrita/integrations/scripts/add-emoji-to-workspaces.ts --dry-run
 */

import * as fs from 'fs';
import * as path from 'path';

interface WorkspaceEmoji {
  name: string;
  emoji: string;
  newName: string;
}

// Mapeo de workspaces a emojis (basado en estructura de Google Drive)
const workspaceEmojis: WorkspaceEmoji[] = [
  { name: 'ennui', emoji: '🌱', newName: '🌱 ennui' },
  { name: 'inspiro', emoji: '🌸', newName: '🌸 inspiro' },
  { name: 'entre-rutas', emoji: '🧭', newName: '🧭 entre-rutas' },
  { name: 'iami', emoji: '🍪', newName: '🍪 iami' },
  { name: 'personal', emoji: '🌱', newName: '🌱 personal' },
  { name: 'otros', emoji: '📁', newName: '📁 otros' },
];

/**
 * Encuentra todos los archivos markdown en el proyecto
 */
function findMarkdownFiles(dir: string, files: string[] = []): string[] {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Ignorar directorios ocultos y node_modules
      if (entry.name.startsWith('.') || entry.name === 'node_modules') {
        continue;
      }

      if (entry.isDirectory()) {
        findMarkdownFiles(fullPath, files);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Ignorar errores de permisos
  }

  return files;
}

/**
 * Encuentra todos los archivos TypeScript/JavaScript en el proyecto
 */
function findCodeFiles(dir: string, files: string[] = []): string[] {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Ignorar directorios ocultos y node_modules
      if (entry.name.startsWith('.') || entry.name === 'node_modules') {
        continue;
      }

      if (entry.isDirectory()) {
        findCodeFiles(fullPath, files);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Ignorar errores de permisos
  }

  return files;
}

/**
 * Actualiza referencias a workspaces en el contenido de un archivo
 */
function updateReferences(content: string, workspaceEmojis: WorkspaceEmoji[]): { content: string; changes: number } {
  let updatedContent = content;
  let changes = 0;

  for (const ws of workspaceEmojis) {
    // Escapar caracteres especiales para regex
    const escapedName = ws.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Reemplazar en rutas: workspaces/ennui/ o workspaces/ennui
    const pathPatternStr = 'workspaces/' + escapedName + '(/|\\s|"|\'|`)';
    const pathPattern = new RegExp(pathPatternStr, 'g');
    const pathMatches = updatedContent.match(pathPattern);
    if (pathMatches) {
      updatedContent = updatedContent.replace(
        pathPattern,
        'workspaces/' + ws.newName + '$1'
      );
      changes += pathMatches.length;
    }
    
    // Reemplazar en wikilinks: [[workspaces/ennui/...]]
    const wikilinkPatternStr = '\\[\\[workspaces/' + escapedName + '(/|\\]\\])';
    const wikilinkPattern = new RegExp(wikilinkPatternStr, 'g');
    const wikilinkMatches = updatedContent.match(wikilinkPattern);
    if (wikilinkMatches) {
      updatedContent = updatedContent.replace(
        wikilinkPattern,
        '[[workspaces/' + ws.newName + '$1'
      );
      changes += wikilinkMatches.length;
    }
  }

  return { content: updatedContent, changes };
}

/**
 * Renombra un workspace
 */
function renameWorkspace(oldPath: string, newPath: string, dryRun: boolean): boolean {
  if (dryRun) {
    console.log(`[DRY RUN] Would rename: ${path.basename(oldPath)} → ${path.basename(newPath)}`);
    return true;
  }

  try {
    fs.renameSync(oldPath, newPath);
    console.log(`✅ Renamed: ${path.basename(oldPath)} → ${path.basename(newPath)}`);
    return true;
  } catch (error) {
    console.error(`❌ Error renaming ${path.basename(oldPath)}:`, error);
    return false;
  }
}

/**
 * Actualiza referencias en un archivo
 */
function updateFileReferences(filePath: string, workspaceEmojis: WorkspaceEmoji[], projectRoot: string, dryRun: boolean): number {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const { content: updatedContent, changes } = updateReferences(content, workspaceEmojis);

    if (changes > 0 && updatedContent !== content) {
      if (dryRun) {
        console.log(`[DRY RUN] Would update: ${path.relative(projectRoot, filePath)} (${changes} changes)`);
      } else {
        // Crear backup
        const backupPath = `${filePath}.backup-${Date.now()}`;
        fs.writeFileSync(backupPath, content, 'utf-8');
        
        // Escribir archivo actualizado
        fs.writeFileSync(filePath, updatedContent, 'utf-8');
        console.log(`✅ Updated: ${path.relative(projectRoot, filePath)} (${changes} changes)`);
      }
      return changes;
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error);
  }

  return 0;
}

/**
 * Función principal
 */
function main(): void {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const projectRoot = process.cwd();
  const workspacesDir = path.join(projectRoot, 'workspaces');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  if (!fs.existsSync(workspacesDir)) {
    console.error('❌ Workspaces directory not found');
    process.exit(1);
  }

  console.log('📦 Renaming workspaces with emojis...\n');

  // Paso 1: Renombrar carpetas de workspaces
  const renamedWorkspaces: string[] = [];
  for (const ws of workspaceEmojis) {
    const oldPath = path.join(workspacesDir, ws.name);
    const newPath = path.join(workspacesDir, ws.newName);

    if (fs.existsSync(oldPath)) {
      if (renameWorkspace(oldPath, newPath, dryRun)) {
        renamedWorkspaces.push(ws.newName);
      }
    } else if (fs.existsSync(newPath)) {
      console.log(`ℹ️  Workspace already renamed: ${ws.newName}`);
      renamedWorkspaces.push(ws.newName);
    }
  }

  if (renamedWorkspaces.length === 0) {
    console.log('ℹ️  No workspaces to rename');
    return;
  }

  console.log('\n📄 Updating references in files...\n');

  // Paso 2: Actualizar referencias en archivos markdown
  const mdFiles = findMarkdownFiles(projectRoot);
  let totalChanges = 0;
  let filesUpdated = 0;

  for (const file of mdFiles) {
    const changes = updateFileReferences(file, workspaceEmojis, projectRoot, dryRun);
    if (changes > 0) {
      totalChanges += changes;
      filesUpdated++;
    }
  }

  // Paso 3: Actualizar referencias en archivos de código
  const codeFiles = findCodeFiles(projectRoot);
  for (const file of codeFiles) {
    const changes = updateFileReferences(file, workspaceEmojis, projectRoot, dryRun);
    if (changes > 0) {
      totalChanges += changes;
      filesUpdated++;
    }
  }

  console.log(`\n📊 Resumen:`);
  console.log(`   Workspaces renombrados: ${renamedWorkspaces.length}`);
  console.log(`   Archivos actualizados: ${filesUpdated}`);
  console.log(`   Referencias actualizadas: ${totalChanges}`);

  if (dryRun) {
    console.log(`\n💡 Ejecuta sin --dry-run para aplicar los cambios.`);
  } else {
    console.log(`\n✅ Proceso completado!`);
    console.log(`\n💡 Siguiente paso: Ejecutar script de conversión a wikilinks para actualizar referencias`);
    console.log(`   npx tsx .dendrita/integrations/scripts/convert-links-to-wikilinks.ts`);
  }
}

main();

