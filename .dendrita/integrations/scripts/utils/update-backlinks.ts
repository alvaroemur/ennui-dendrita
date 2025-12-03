#!/usr/bin/env npx ts-node
/**
 * Script de post-procesamiento para actualizar backlinks
 * 
 * Escanea todos los documentos en workspaces y crea/actualiza backlinks
 * basándose en los wikilinks encontrados en cada documento.
 * 
 * Uso:
 *   ts-node update-backlinks.ts
 *   ts-node update-backlinks.ts --workspace ennui
 *   ts-node update-backlinks.ts --file path/to/file.md
 */

import * as fs from 'fs';
import * as path from 'path';
import { extractWikilinks, updateBacklinksFromContent } from '../../utils/backlinks';
import { createLogger } from '../../utils/logger';

const logger = createLogger('UpdateBacklinks');

/**
 * Encuentra todos los archivos markdown en workspaces
 */
function findMarkdownFiles(workspacesDir: string, workspaceFilter?: string): string[] {
  const files: string[] = [];

  if (!fs.existsSync(workspacesDir)) {
    return files;
  }

  const workspaces = fs.readdirSync(workspacesDir, { withFileTypes: true });

  for (const workspace of workspaces) {
    if (!workspace.isDirectory()) continue;
    if (workspaceFilter && workspace.name !== workspaceFilter) continue;

    const workspacePath = path.join(workspacesDir, workspace.name);
    findMarkdownFilesRecursive(workspacePath, files);
  }

  return files;
}

/**
 * Recursivamente encuentra archivos markdown
 */
function findMarkdownFilesRecursive(dir: string, files: string[]): void {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Ignorar directorios ocultos y node_modules
      if (entry.isDirectory()) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') {
          continue;
        }
        findMarkdownFilesRecursive(fullPath, files);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Ignorar errores de permisos
  }
}

/**
 * Procesa un archivo para actualizar backlinks
 */
async function processFile(filePath: string, projectRoot: string): Promise<{ file: string; wikilinks: number; backlinks: number }> {
  const result = {
    file: path.relative(projectRoot, filePath),
    wikilinks: 0,
    backlinks: 0,
  };

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const wikilinks = extractWikilinks(content);
    result.wikilinks = wikilinks.length;

    // Actualizar backlinks para cada wikilink encontrado
    await updateBacklinksFromContent(filePath, projectRoot);
    result.backlinks = wikilinks.length;
  } catch (error) {
    logger.error(`Error processing file ${filePath}`, error);
  }

  return result;
}

/**
 * Función principal
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const workspaceIndex = args.indexOf('--workspace');
  const fileIndex = args.indexOf('--file');
  
  const workspaceFilter = workspaceIndex >= 0 && args[workspaceIndex + 1] 
    ? args[workspaceIndex + 1] 
    : undefined;
  
  const fileFilter = fileIndex >= 0 && args[fileIndex + 1]
    ? args[fileIndex + 1]
    : undefined;

  const projectRoot = process.cwd();
  const workspacesDir = path.join(projectRoot, 'workspaces');

  console.log('🔍 Escaneando documentos para actualizar backlinks...\n');

  let filesToProcess: string[] = [];

  if (fileFilter) {
    // Procesar archivo específico
    const filePath = path.isAbsolute(fileFilter) 
      ? fileFilter 
      : path.join(projectRoot, fileFilter);
    
    if (fs.existsSync(filePath)) {
      filesToProcess = [filePath];
    } else {
      console.error(`❌ Archivo no encontrado: ${fileFilter}`);
      process.exit(1);
    }
  } else {
    // Procesar todos los archivos en workspaces
    filesToProcess = findMarkdownFiles(workspacesDir, workspaceFilter);
  }

  if (filesToProcess.length === 0) {
    console.log('ℹ️  No se encontraron archivos markdown para procesar.');
    return;
  }

  console.log(`📄 Procesando ${filesToProcess.length} archivo(s)...\n`);

  const results: Array<{ file: string; wikilinks: number; backlinks: number }> = [];
  let totalWikilinks = 0;
  let totalBacklinks = 0;

  for (const file of filesToProcess) {
    const result = await processFile(file, projectRoot);
    results.push(result);
    totalWikilinks += result.wikilinks;
    totalBacklinks += result.backlinks;

    if (result.wikilinks > 0) {
      console.log(`✅ ${result.file}: ${result.wikilinks} wikilink(s) procesado(s)`);
    }
  }

  console.log(`\n📊 Resumen:`);
  console.log(`   Archivos procesados: ${results.length}`);
  console.log(`   Wikilinks encontrados: ${totalWikilinks}`);
  console.log(`   Backlinks actualizados: ${totalBacklinks}`);
  console.log(`   Archivos con wikilinks: ${results.filter(r => r.wikilinks > 0).length}`);
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch((error) => {
    logger.error('Fatal error', error);
    process.exit(1);
  });
}

export { processFile, findMarkdownFiles };

