/**
 * Utilidad para manejar backlinks en documentos markdown
 * 
 * Extrae wikilinks del contenido y crea backlinks automáticamente
 * en los archivos referenciados.
 */

import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from './logger';
import { generateSmartContext } from './smart-context-generator';

const logger = createLogger('Backlinks');

export interface Wikilink {
  text: string;
  path: string;
  line: number;
  column: number;
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
  // Simplificar: si el archivo no existe, retornar false
  // El sistema de backups se maneja en otro lugar
  return false;
}

/**
 * Extrae todos los wikilinks del contenido
 */
export function extractWikilinks(content: string): Wikilink[] {
  const wikilinks: Wikilink[] = [];
  const lines = content.split('\n');
  
  // Patrón para wikilinks: [[ruta/archivo]] o [[ruta/archivo|texto]]
  const wikilinkPattern = /\[\[([^\]]+)\]\]/g;
  
  lines.forEach((line, lineIndex) => {
    let match;
    while ((match = wikilinkPattern.exec(line)) !== null) {
      const fullMatch = match[0];
      const linkContent = match[1];
      
      // Separar ruta y texto opcional
      const parts = linkContent.split('|');
      const linkPath = parts[0].trim();
      
      wikilinks.push({
        text: fullMatch,
        path: linkPath,
        line: lineIndex + 1,
        column: match.index || 0,
      });
    }
  });
  
  return wikilinks;
}

/**
 * Resuelve la ruta absoluta de un archivo referenciado por un wikilink
 */
export function resolveWikilinkPath(
  wikilink: string,
  currentFile: string,
  projectRoot: string = process.cwd()
): string | null {
  try {
    // Si la ruta ya es absoluta o empieza con workspaces/ o .dendrita/, usarla directamente
    if (wikilink.startsWith('workspaces/') || wikilink.startsWith('.dendrita/') || path.isAbsolute(wikilink)) {
      const resolved = path.isAbsolute(wikilink) 
        ? wikilink 
        : path.join(projectRoot, wikilink);
      
      const normalized = path.normalize(resolved);
      if (fileExists(normalized)) {
        return normalized;
      }
      return null;
    }

    // Ruta relativa desde el archivo actual
    const currentDir = path.dirname(currentFile);
    const resolved = path.resolve(currentDir, wikilink);
    const normalized = path.normalize(resolved);
    
    if (fileExists(normalized)) {
      return normalized;
    }
    
    return null;
  } catch (error) {
    logger.warn(`Error resolving wikilink path: ${wikilink}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

/**
 * Obtiene la ruta relativa desde el root del proyecto
 */
function getRelativePath(filePath: string, projectRoot: string = process.cwd()): string {
  try {
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(projectRoot, filePath);
    const relativePath = path.relative(projectRoot, absolutePath);
    return relativePath.replace(/\\/g, '/');
  } catch (error) {
    return filePath;
  }
}

/**
 * Obtiene la ruta relativa desde un archivo a otro
 */
function getRelativePathFromFile(fromFile: string, toFile: string): string {
  try {
    const fromDir = path.dirname(fromFile);
    const relativePath = path.relative(fromDir, toFile);
    return relativePath.replace(/\\/g, '/');
  } catch (error) {
    return toFile;
  }
}

/**
 * Lee el contenido de un archivo
 */
function readFileContent(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    logger.error(`Error reading file: ${filePath}`, error);
    return null;
  }
}

/**
 * Encuentra o crea la sección de backlinks en el contenido
 */
function findOrCreateBacklinksSection(content: string): {
  hasSection: boolean;
  sectionIndex: number;
  content: string;
} {
  // Buscar sección de backlinks
  const backlinksPattern = /^## Backlinks\s*$/m;
  const match = content.match(backlinksPattern);
  
  if (match && match.index !== undefined) {
    return {
      hasSection: true,
      sectionIndex: match.index,
      content,
    };
  }
  
  // Si no existe, agregar al final
  return {
    hasSection: false,
    sectionIndex: content.length,
    content,
  };
}

/**
 * Verifica si un backlink ya existe en el contenido
 */
function backlinkExists(content: string, sourceFile: string): boolean {
  const relativePath = getRelativePath(sourceFile);
  const relativePathPattern = new RegExp(relativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  return relativePathPattern.test(content);
}

/**
 * Agrega un backlink en el archivo objetivo
 */
export async function addBacklink(
  targetFile: string,
  sourceFile: string,
  context: string = '',
  position: 'section' | 'inline' = 'section',
  projectRoot: string = process.cwd(),
  options: {
    useSmartContext?: boolean;
    sourceContent?: string;
  } = {}
): Promise<void> {
  try {
    const content = readFileContent(targetFile);
    if (!content) {
      logger.warn(`Cannot add backlink: target file does not exist: ${targetFile}`);
      return;
    }

    // Verificar si el backlink ya existe
    if (backlinkExists(content, sourceFile)) {
      logger.debug(`Backlink already exists in ${targetFile} for ${sourceFile}`);
      return;
    }

    const sourceRelative = getRelativePath(sourceFile, projectRoot);
    const targetRelative = getRelativePath(targetFile, projectRoot);
    const sourceRelativeFromTarget = getRelativePathFromFile(targetFile, sourceFile);

    // Usar la ruta relativa más corta
    const linkPath = sourceRelativeFromTarget.length < sourceRelative.length 
      ? sourceRelativeFromTarget 
      : sourceRelative;

    const timestamp = new Date().toLocaleString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Generar contexto inteligente si está habilitado
    let finalContext = context || 'Referencia desde documento relacionado.';
    if (options.useSmartContext && options.sourceContent) {
      try {
        finalContext = await generateSmartContext(
          options.sourceContent,
          sourceFile,
          targetFile,
          context
        );
      } catch (error) {
        logger.warn(`Error generating smart context, using fallback: ${error instanceof Error ? error.message : String(error)}`);
        finalContext = context || 'Referencia desde documento relacionado.';
      }
    }

    const backlinkEntry = `**${timestamp}** | [${path.basename(sourceFile)}](${linkPath})\n\n${finalContext}\n\n---\n`;

    if (position === 'section') {
      const { hasSection, sectionIndex, content: currentContent } = findOrCreateBacklinksSection(content);
      
      if (hasSection) {
        // Insertar después del título de la sección
        const sectionTitle = '## Backlinks';
        const insertIndex = currentContent.indexOf(sectionTitle) + sectionTitle.length;
        const before = currentContent.slice(0, insertIndex);
        const after = currentContent.slice(insertIndex);
        
        // Insertar con salto de línea si no hay
        const newContent = before + (before.endsWith('\n') ? '' : '\n') + '\n' + backlinkEntry + after;
        fs.writeFileSync(targetFile, newContent, 'utf-8');
      } else {
        // Crear nueva sección al final
        const newContent = currentContent + '\n\n## Backlinks\n\n' + backlinkEntry;
        fs.writeFileSync(targetFile, newContent, 'utf-8');
      }
    } else {
      // Inline: buscar el contexto y agregar cerca
      // Por ahora, agregar al final del contenido
      const newContent = content + '\n\n' + backlinkEntry;
      fs.writeFileSync(targetFile, newContent, 'utf-8');
    }

    logger.debug(`Added backlink in ${targetFile} for ${sourceFile}`);
  } catch (error) {
    logger.error(`Error adding backlink in ${targetFile}`, error);
  }
}

/**
 * Actualiza backlinks desde el contenido de un archivo
 */
export async function updateBacklinksFromContent(
  filePath: string,
  projectRoot: string = process.cwd(),
  options: {
    useSmartContext?: boolean;
  } = {}
): Promise<void> {
  try {
    const content = readFileContent(filePath);
    if (!content) {
      return;
    }

    const wikilinks = extractWikilinks(content);
    
    for (const wikilink of wikilinks) {
      const resolvedPath = resolveWikilinkPath(wikilink.path, filePath, projectRoot);
      
      if (resolvedPath && resolvedPath !== filePath) {
        // Extraer contexto alrededor del wikilink
        const lines = content.split('\n');
        const lineIndex = wikilink.line - 1;
        const contextLines = lines.slice(Math.max(0, lineIndex - 2), Math.min(lines.length, lineIndex + 3));
        const context = contextLines.join('\n');
        
        await addBacklink(
          resolvedPath, 
          filePath, 
          context, 
          'section', 
          projectRoot,
          {
            useSmartContext: options.useSmartContext,
            sourceContent: content,
          }
        );
      }
    }

    logger.debug(`Updated backlinks from ${filePath}: ${wikilinks.length} wikilinks processed`);
  } catch (error) {
    logger.error(`Error updating backlinks from ${filePath}`, error);
  }
}

