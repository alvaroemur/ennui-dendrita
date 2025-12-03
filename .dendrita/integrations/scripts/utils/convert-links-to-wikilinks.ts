#!/usr/bin/env tsx
/**
 * Script para convertir referencias a archivos en workspaces a wikilinks
 * 
 * Este script:
 * - Busca archivos markdown en workspaces/
 * - Identifica referencias a otros archivos (markdown links, paths, etc.)
 * - Los convierte a formato wikilink [[ruta/archivo]]
 * - Actualiza los archivos
 * 
 * Uso:
 *   tsx .dendrita/integrations/scripts/convert-links-to-wikilinks.ts
 *   tsx .dendrita/integrations/scripts/convert-links-to-wikilinks.ts --dry-run
 *   tsx .dendrita/integrations/scripts/convert-links-to-wikilinks.ts --workspace ennui
 *   tsx .dendrita/integrations/scripts/convert-links-to-wikilinks.ts --file path/to/file.md
 */

import * as fs from 'fs';
import * as path from 'path';

interface ConversionResult {
  file: string;
  conversions: number;
  errors: string[];
}

interface Reference {
  original: string;
  wikilink: string;
  type: 'markdown-link' | 'path-mention' | 'backtick-path';
  line: number;
  column: number;
}

/**
 * Resuelve una ruta relativa desde el archivo actual al archivo objetivo
 */
function resolveRelativePath(fromFile: string, toPath: string, projectRoot: string): string | null {
  try {
    // Si la ruta ya es absoluta o empieza con workspaces/, usarla directamente
    if (toPath.startsWith('workspaces/') || path.isAbsolute(toPath)) {
      const resolved = path.isAbsolute(toPath) 
        ? toPath 
        : path.join(projectRoot, toPath);
      
      // Normalizar y verificar que existe
      const normalized = path.normalize(resolved);
      if (fs.existsSync(normalized)) {
        // Convertir a ruta relativa desde projectRoot
        return path.relative(projectRoot, normalized);
      }
      return null;
    }

    // Ruta relativa desde el archivo actual
    const fromDir = path.dirname(fromFile);
    const resolved = path.resolve(fromDir, toPath);
    const normalized = path.normalize(resolved);
    
    if (fs.existsSync(normalized)) {
      // Convertir a ruta relativa desde projectRoot
      return path.relative(projectRoot, normalized);
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Verifica si un archivo existe (maneja emojis y backups)
 */
function fileExists(filePath: string): boolean {
  if (fs.existsSync(filePath)) {
    return true;
  }
  
  // Verificar versión backup (sin emojis)
  const dir = path.dirname(filePath);
  const basename = path.basename(filePath);
  const backupBasename = basename.replace(/[^\x00-\x7F]/g, '').replace(/\s+/g, '-').toLowerCase();
  const backupPath = path.join(dir, `.${backupBasename}`);
  
  return fs.existsSync(backupPath);
}

/**
 * Convierte una ruta a formato wikilink
 */
function toWikilink(relativePath: string): string {
  // Normalizar separadores de ruta
  const normalized = relativePath.replace(/\\/g, '/');
  return `[[${normalized}]]`;
}

/**
 * Identifica referencias en el contenido de un archivo
 */
function identifyReferences(content: string, filePath: string, projectRoot: string): Reference[] {
  const references: Reference[] = [];
  const lines = content.split('\n');

  // Patrones para identificar referencias
  const patterns = [
    // Markdown links: [text](path/to/file.md)
    {
      regex: /\[([^\]]+)\]\(([^)]+\.md[^)]*)\)/g,
      type: 'markdown-link' as const,
    },
    // Backtick paths: `workspaces/...` or `path/to/file.md`
    {
      regex: /`(workspaces\/[^`]+\.md[^`]*)`/g,
      type: 'backtick-path' as const,
    },
    // Path mentions: workspaces/.../file.md (sin backticks ni links)
    {
      regex: /(workspaces\/[^\s\)\]`]+\.md)/g,
      type: 'path-mention' as const,
    },
  ];

  lines.forEach((line, lineIndex) => {
    patterns.forEach(({ regex, type }) => {
      let match;
      while ((match = regex.exec(line)) !== null) {
        const fullMatch = match[0];
        const pathMatch = match[2] || match[1]; // Para markdown links es match[2], para otros es match[1]
        
        // Resolver ruta
        const resolvedPath = resolveRelativePath(filePath, pathMatch, projectRoot);
        
        if (resolvedPath && fileExists(path.join(projectRoot, resolvedPath))) {
          references.push({
            original: fullMatch,
            wikilink: toWikilink(resolvedPath),
            type,
            line: lineIndex + 1,
            column: match.index || 0,
          });
        }
      }
    });
  });

  return references;
}

/**
 * Convierte referencias a wikilinks en el contenido
 */
function convertReferences(content: string, references: Reference[]): string {
  let converted = content;
  
  // Ordenar referencias por posición (de atrás hacia adelante para no afectar índices)
  const sortedRefs = [...references].sort((a, b) => {
    if (a.line !== b.line) return b.line - a.line;
    return b.column - a.column;
  });

  sortedRefs.forEach(ref => {
    // Para markdown links, reemplazar solo el link, mantener el texto si es descriptivo
    if (ref.type === 'markdown-link') {
      // Extraer el texto del link
      const textMatch = ref.original.match(/\[([^\]]+)\]/);
      const linkText = textMatch ? textMatch[1] : '';
      
      // Si el texto es descriptivo (no es igual a la ruta), mantenerlo
      if (linkText && linkText !== path.basename(ref.wikilink.replace(/[\[\]]/g, ''))) {
        converted = converted.replace(ref.original, `${linkText} ${ref.wikilink}`);
      } else {
        converted = converted.replace(ref.original, ref.wikilink);
      }
    } else {
      // Para otros tipos, reemplazar directamente
      converted = converted.replace(ref.original, ref.wikilink);
    }
  });

  return converted;
}

/**
 * Procesa un archivo markdown
 */
function processFile(filePath: string, projectRoot: string, dryRun: boolean = false): ConversionResult {
  const result: ConversionResult = {
    file: path.relative(projectRoot, filePath),
    conversions: 0,
    errors: [],
  };

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const references = identifyReferences(content, filePath, projectRoot);

    if (references.length === 0) {
      return result;
    }

    const converted = convertReferences(content, references);
    result.conversions = references.length;

    if (!dryRun && converted !== content) {
      fs.writeFileSync(filePath, converted, 'utf-8');
    }
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
  }

  return result;
}

/**
 * Encuentra todos los archivos markdown en workspaces/
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
 * Función principal
 */
function main(): void {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
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

  console.log('🔍 Buscando referencias a archivos en workspaces...\n');

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

  if (dryRun) {
    console.log('🔍 Modo dry-run: no se realizarán cambios\n');
  }

  const results: ConversionResult[] = [];
  let totalConversions = 0;

  for (const file of filesToProcess) {
    const result = processFile(file, projectRoot, dryRun);
    results.push(result);
    totalConversions += result.conversions;

    if (result.conversions > 0) {
      const status = dryRun ? '🔍' : '✅';
      console.log(`${status} ${result.file}: ${result.conversions} conversión(es)`);
    }

    if (result.errors.length > 0) {
      console.error(`❌ ${result.file}: ${result.errors.join(', ')}`);
    }
  }

  console.log(`\n📊 Resumen:`);
  console.log(`   Archivos procesados: ${results.length}`);
  console.log(`   Conversiones totales: ${totalConversions}`);
  console.log(`   Archivos modificados: ${results.filter(r => r.conversions > 0).length}`);

  if (dryRun) {
    console.log(`\n💡 Ejecuta sin --dry-run para aplicar los cambios.`);
  }
}

// Ejecutar si es llamado directamente
main();

export { processFile, identifyReferences, convertReferences, findMarkdownFiles };

