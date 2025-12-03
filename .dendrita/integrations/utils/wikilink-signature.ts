/**
 * Utilidad para generar firmas de wikilinks en inserciones de texto
 * 
 * Genera firmas que indican el origen del contenido insertado:
 * - Para contenido generado por LLM: "generado con gpt-4o a partir de [[archivo1.md]], [[archivo2.md]]"
 * - Para contenido integrado por LLM: "integrado con gpt-5 a partir de [[archivo1.md]], [[archivo2.md]]"
 * - Para contenido copiado: "copiado de [[archivo.md]], líneas 10-25"
 */

import * as path from 'path';
import { createLogger } from './logger';

const logger = createLogger('WikilinkSignature');

export interface SignatureOptions {
  model?: string;
  sourceFiles?: string[];
  operation?: 'generated' | 'integrated';
  sourceFile?: string;
  lines?: { start: number; end: number };
}

/**
 * Convierte una ruta absoluta a ruta relativa desde el root del proyecto
 */
function toRelativePath(filePath: string, projectRoot: string = process.cwd()): string {
  try {
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(projectRoot, filePath);
    const relativePath = path.relative(projectRoot, absolutePath);
    // Normalizar separadores para usar siempre /
    return relativePath.replace(/\\/g, '/');
  } catch (error) {
    logger.warn(`Error converting path to relative: ${filePath}`);
    return filePath;
  }
}

/**
 * Convierte una ruta a formato wikilink
 */
function toWikilink(filePath: string, projectRoot: string = process.cwd()): string {
  const relativePath = toRelativePath(filePath, projectRoot);
  return `[[${relativePath}]]`;
}

/**
 * Genera firma para contenido generado por LLM
 */
export function generateLLMSignature(
  model: string,
  sourceFiles: string[],
  operation: 'generated' | 'integrated' = 'generated',
  projectRoot: string = process.cwd()
): string {
  if (sourceFiles.length === 0) {
    const verb = operation === 'generated' ? 'Generado' : 'Integrado';
    return `*${verb} con ${model}*`;
  }

  const wikilinks = sourceFiles.map(file => toWikilink(file, projectRoot)).join(', ');
  const verb = operation === 'generated' ? 'Generado' : 'Integrado';
  
  return `*${verb} con ${model} a partir de ${wikilinks}*`;
}

/**
 * Genera firma para contenido copiado
 */
export function generateCopySignature(
  sourceFile: string,
  lines?: { start: number; end: number },
  projectRoot: string = process.cwd()
): string {
  const wikilink = toWikilink(sourceFile, projectRoot);
  
  if (lines) {
    return `*Copiado de ${wikilink}, líneas ${lines.start}-${lines.end}*`;
  }
  
  return `*Copiado de ${wikilink}*`;
}

/**
 * Genera firma para contenido extraído/scrapeado (sin LLM)
 */
export function generateScrapeSignature(
  source: string,
  sourceType: 'google-sheet' | 'google-doc' | 'drive' | 'calendar' | 'other' = 'other',
  projectRoot: string = process.cwd()
): string {
  const sourceLabel = sourceType === 'google-sheet' ? 'Google Sheet' :
                     sourceType === 'google-doc' ? 'Google Doc' :
                     sourceType === 'drive' ? 'Google Drive' :
                     sourceType === 'calendar' ? 'Google Calendar' :
                     'fuente externa';
  
  // Si la fuente es un ID de Google, no crear wikilink
  if (source.startsWith('Google ') || source.includes('://') || source.length < 20) {
    return `*Extraído de ${sourceLabel}: ${source}*`;
  }
  
  // Si es una ruta de archivo, crear wikilink
  const wikilink = toWikilink(source, projectRoot);
  return `*Extraído de ${sourceLabel}: ${wikilink}*`;
}

/**
 * Genera firma unificada según el tipo de operación
 */
export function generateSignature(
  operation: 'llm' | 'copy',
  options: SignatureOptions,
  projectRoot: string = process.cwd()
): string {
  if (operation === 'llm') {
    if (!options.model) {
      throw new Error('Model is required for LLM signature');
    }
    return generateLLMSignature(
      options.model,
      options.sourceFiles || [],
      options.operation || 'generated',
      projectRoot
    );
  } else {
    if (!options.sourceFile) {
      throw new Error('Source file is required for copy signature');
    }
    return generateCopySignature(
      options.sourceFile,
      options.lines,
      projectRoot
    );
  }
}

/**
 * Determina la mejor posición para insertar una firma
 */
function determineBestPosition(content: string): 'start' | 'end' {
  // Si el contenido es muy corto, poner al final
  if (content.length < 200) {
    return 'end';
  }

  // Si empieza con un título o frontmatter, poner al final
  if (content.trim().startsWith('#') || content.trim().startsWith('---')) {
    return 'end';
  }

  // Si tiene estructura de lista o párrafo, poner al final
  const lines = content.split('\n');
  const firstNonEmptyLine = lines.find(line => line.trim().length > 0);
  
  if (firstNonEmptyLine && (firstNonEmptyLine.startsWith('-') || firstNonEmptyLine.startsWith('*'))) {
    return 'end';
  }

  // Por defecto, poner al final
  return 'end';
}

/**
 * Inserta una firma en el contenido según la posición especificada
 */
export function insertSignature(
  content: string,
  signature: string,
  position: 'start' | 'end' | 'auto' = 'auto',
  projectRoot: string = process.cwd()
): string {
  // Si ya contiene la firma, no duplicar
  if (content.includes(signature)) {
    return content;
  }

  const actualPosition = position === 'auto' ? determineBestPosition(content) : position;

  if (actualPosition === 'start') {
    // Insertar al inicio, después de frontmatter si existe
    const frontmatterMatch = content.match(/^---\n[\s\S]*?\n---\n/);
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[0];
      const rest = content.slice(frontmatter.length);
      return frontmatter + signature + '\n\n' + rest;
    }
    return signature + '\n\n' + content;
  } else {
    // Insertar al final, antes de backlinks si existen
    const backlinksMatch = content.match(/\n## Backlinks[\s\S]*$/);
    if (backlinksMatch) {
      const backlinks = backlinksMatch[0];
      const rest = content.slice(0, -backlinks.length);
      return rest + '\n\n' + signature + backlinks;
    }
    
    // Si no hay backlinks, agregar al final
    return content + '\n\n' + signature;
  }
}

/**
 * Extrae el modelo de OpenAI de una cadena de texto
 */
export function extractModelFromString(text: string): string | null {
  // Patrones comunes para modelos de OpenAI
  const patterns = [
    /gpt-4o(-mini)?/i,
    /gpt-4(-turbo)?/i,
    /gpt-3\.5-turbo/i,
    /gpt-5/i,
    /claude/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return null;
}

