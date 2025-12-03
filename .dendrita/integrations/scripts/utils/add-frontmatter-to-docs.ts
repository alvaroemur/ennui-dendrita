#!/usr/bin/env ts-node

/**
 * Script para agregar YAML front-matter a todos los archivos markdown
 * en .dendrita/ y workspaces/
 */

import * as fs from 'fs';
import * as path from 'path';

interface FrontMatter {
  name: string;
  displayName?: string;
  description: string;
  type: string;
  created: string;
  updated: string;
  tags: string[];
  category: string;
  workspace?: string;
  project?: string;
}

interface FileInfo {
  filePath: string;
  relativePath: string;
  fileName: string;
  baseName: string;
  hasEmoji: boolean;
  content: string;
  alreadyHasFrontMatter: boolean;
}

/**
 * Sanitiza el nombre del archivo removiendo emojis y normalizando
 */
function sanitizeFileName(fileName: string): string {
  // Remover extensión
  const baseName = fileName.replace(/\.md$/, '');
  
  // Remover emojis y caracteres especiales, convertir espacios a guiones
  const sanitized = baseName
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Emojis
    .replace(/[\u{2600}-\u{26FF}]/gu, '') // Símbolos misc
    .replace(/[\u{2700}-\u{27BF}]/gu, '') // Dingbats
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Suplemento de emojis
    .replace(/[\u{1FA00}-\u{1FAFF}]/gu, '') // Extensiones de emojis
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/[^a-zA-Z0-9\-_]/g, '') // Remover caracteres especiales
    .toLowerCase()
    .replace(/-+/g, '-') // Múltiples guiones a uno
    .replace(/^-|-$/g, ''); // Remover guiones al inicio/fin
  
  return sanitized || 'untitled';
}

/**
 * Detecta si un nombre de archivo tiene emojis
 */
function hasEmoji(fileName: string): boolean {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FAFF}]/gu;
  return emojiRegex.test(fileName);
}

/**
 * Extrae workspace de la ruta
 */
function extractWorkspace(filePath: string): string | undefined {
  const workspaceMatch = filePath.match(/workspaces\/([^\/]+)/);
  return workspaceMatch ? workspaceMatch[1] : undefined;
}

/**
 * Extrae project de la ruta
 */
function extractProject(filePath: string): string | undefined {
  // Buscar en active-projects o archived-projects
  const activeMatch = filePath.match(/(?:active-projects|🚀 active-projects)\/([^\/]+)/);
  const archivedMatch = filePath.match(/(?:archived-projects|\.archived-projects)\/([^\/]+)/);
  
  if (activeMatch) return activeMatch[1];
  if (archivedMatch) return archivedMatch[1];
  return undefined;
}

/**
 * Detecta el tipo de documento basado en ubicación y nombre
 */
function detectType(filePath: string, fileName: string, baseName: string): string {
  const lowerPath = filePath.toLowerCase();
  const lowerName = baseName.toLowerCase();
  
  // .dendrita/
  if (filePath.includes('.dendrita/hooks/')) return 'hook';
  if (filePath.includes('.dendrita/users/') && filePath.includes('/skills/')) return 'skill';
  if (filePath.includes('.dendrita/users/') && filePath.includes('/agents/')) return 'agent';
  if (filePath.includes('.dendrita/templates/')) return 'template';
  if (filePath.includes('.dendrita/integrations/scripts/')) {
    if (fileName.endsWith('.md')) return 'script-documentation';
    return 'script';
  }
  if (filePath.includes('.dendrita/blog/posts/')) return 'blog-post';
  if (filePath.includes('.dendrita/blog/clippings/')) return 'blog-clipping';
  if (filePath.includes('.dendrita/blog/')) return 'blog-documentation';
  if (filePath.includes('.dendrita/')) return 'documentation';
  
  // workspaces/
  if (lowerName === 'readme') return 'readme';
  if (lowerName === 'master-plan') return 'master-plan';
  if (lowerName === 'current-context') return 'current-context';
  if (lowerName === 'tasks') return 'tasks';
  if (filePath.includes('best-practices/')) return 'best-practice';
  if (filePath.includes('products/')) return 'product';
  if (filePath.includes('stakeholders/')) return 'stakeholder';
  if (filePath.includes('tools-templates/')) return 'tool-template';
  if (filePath.includes('company-management/')) return 'project-document';
  if (filePath.includes('active-projects/') || filePath.includes('archived-projects/')) return 'project-document';
  
  return 'document';
}

/**
 * Detecta la categoría basado en ubicación
 */
function detectCategory(filePath: string, type: string): string {
  const lowerPath = filePath.toLowerCase();
  
  // .dendrita/
  if (filePath.includes('.dendrita/hooks/')) return 'behavior-reference';
  if (filePath.includes('.dendrita/users/') && filePath.includes('/skills/')) return 'skill';
  if (filePath.includes('.dendrita/users/') && filePath.includes('/agents/')) return 'agent';
  if (filePath.includes('.dendrita/templates/')) return 'template';
  if (filePath.includes('.dendrita/integrations/')) return 'integration';
  if (filePath.includes('.dendrita/blog/')) return 'blog';
  if (filePath.includes('.dendrita/')) return 'infrastructure';
  
  // workspaces/
  if (lowerPath.includes('active-projects/') || lowerPath.includes('archived-projects/')) {
    return 'project-management';
  }
  if (lowerPath.includes('company-management/')) return 'company-management';
  if (lowerPath.includes('best-practices/')) return 'best-practice';
  if (lowerPath.includes('products/')) return 'product';
  if (lowerPath.includes('stakeholders/')) return 'stakeholder';
  if (lowerPath.includes('tools-templates/')) return 'tool-template';
  
  return 'documentation';
}

/**
 * Genera tags basado en contenido y ubicación
 */
function generateTags(filePath: string, fileName: string, baseName: string, type: string, category: string): string[] {
  const tags: string[] = [];
  
  // Tags basados en tipo
  tags.push(type);
  tags.push(category);
  
  // Tags basados en ubicación
  if (filePath.includes('.dendrita/hooks/')) tags.push('hook', 'behavior-reference');
  if (filePath.includes('.dendrita/users/')) tags.push('user-specific');
  if (filePath.includes('.dendrita/integrations/')) tags.push('integration');
  if (filePath.includes('.dendrita/blog/')) tags.push('blog');
  if (filePath.includes('active-projects/')) tags.push('active-project');
  if (filePath.includes('archived-projects/')) tags.push('archived-project');
  if (filePath.includes('best-practices/')) tags.push('best-practice', 'template');
  if (filePath.includes('products/')) tags.push('product');
  if (filePath.includes('stakeholders/')) tags.push('stakeholder', 'allies');
  if (filePath.includes('company-management/')) tags.push('company-management');
  
  // Tags basados en nombre
  const lowerName = baseName.toLowerCase();
  if (lowerName.includes('readme')) tags.push('readme', 'documentation');
  if (lowerName.includes('master-plan')) tags.push('planning', 'strategy');
  if (lowerName.includes('current-context')) tags.push('context', 'status');
  if (lowerName.includes('tasks')) tags.push('tasks', 'todo');
  
  // Remover duplicados
  return Array.from(new Set(tags));
}

/**
 * Genera descripción basada en contenido
 */
function generateDescription(content: string, fileName: string, type: string): string {
  // Buscar título H1
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    const title = h1Match[1].trim();
    // Limpiar emojis y caracteres especiales para descripción
    const cleanTitle = title.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
    if (cleanTitle) {
      return cleanTitle.length > 100 ? cleanTitle.substring(0, 97) + '...' : cleanTitle;
    }
  }
  
  // Buscar primera línea no vacía
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('---')) {
      const clean = trimmed.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
      if (clean && clean.length > 10) {
        return clean.length > 100 ? clean.substring(0, 97) + '...' : clean;
      }
    }
  }
  
  // Fallback basado en tipo
  const typeDescriptions: Record<string, string> = {
    'hook': 'Behavior reference for dendrita system',
    'skill': 'Skill definition for dendrita system',
    'agent': 'Agent definition for dendrita system',
    'readme': 'Documentation file',
    'master-plan': 'Master plan document',
    'current-context': 'Current context document',
    'tasks': 'Tasks document',
    'blog-post': 'Blog post',
    'documentation': 'Documentation file'
  };
  
  return typeDescriptions[type] || `Document: ${fileName}`;
}

/**
 * Verifica si el archivo ya tiene front-matter
 */
function hasFrontMatter(content: string): boolean {
  // Verificar si empieza con ---
  const trimmed = content.trim();
  if (!trimmed.startsWith('---')) return false;
  
  // Verificar si hay un segundo ---
  const lines = trimmed.split('\n');
  let foundFirst = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      if (!foundFirst) {
        foundFirst = true;
      } else {
        return true; // Encontramos el cierre del front-matter
      }
    }
  }
  
  return false;
}

/**
 * Genera el front-matter YAML
 */
function generateFrontMatter(info: FileInfo, workspace?: string, project?: string): string {
  const baseName = info.baseName;
  const sanitizedName = sanitizeFileName(info.fileName);
  const type = detectType(info.filePath, info.fileName, baseName);
  const category = detectCategory(info.filePath, type);
  const tags = generateTags(info.filePath, info.fileName, baseName, type, category);
  const description = generateDescription(info.content, info.fileName, type);
  const today = new Date().toISOString().split('T')[0];
  
  const frontMatter: FrontMatter = {
    name: sanitizedName,
    description: description,
    type: type,
    created: today,
    updated: today,
    tags: tags,
    category: category
  };
  
  // Agregar displayName si tiene emojis
  if (info.hasEmoji) {
    frontMatter.displayName = baseName;
  }
  
  // Agregar workspace y project si aplica
  if (workspace) {
    frontMatter.workspace = workspace;
  }
  if (project) {
    frontMatter.project = project;
  }
  
  // Convertir a YAML
  let yaml = '---\n';
  yaml += `name: ${frontMatter.name}\n`;
  if (frontMatter.displayName) {
    yaml += `displayName: ${frontMatter.displayName}\n`;
  }
  yaml += `description: ${JSON.stringify(frontMatter.description)}\n`;
  yaml += `type: ${frontMatter.type}\n`;
  if (frontMatter.workspace) {
    yaml += `workspace: ${frontMatter.workspace}\n`;
  }
  if (frontMatter.project) {
    yaml += `project: ${frontMatter.project}\n`;
  }
  yaml += `created: ${frontMatter.created}\n`;
  yaml += `updated: ${frontMatter.updated}\n`;
  yaml += `tags: [${frontMatter.tags.map(t => `"${t}"`).join(', ')}]\n`;
  yaml += `category: ${frontMatter.category}\n`;
  yaml += '---\n';
  
  return yaml;
}

/**
 * Procesa un archivo markdown
 */
function processFile(filePath: string): FileInfo | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    const baseName = fileName.replace(/\.md$/, '');
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Verificar si ya tiene front-matter
    const alreadyHasFrontMatter = hasFrontMatter(content);
    
    return {
      filePath,
      relativePath,
      fileName,
      baseName,
      hasEmoji: hasEmoji(fileName),
      content,
      alreadyHasFrontMatter
    };
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return null;
  }
}

/**
 * Inserta front-matter en el contenido preservando todo lo demás
 */
function insertFrontMatter(content: string, frontMatter: string): string {
  // Si ya tiene front-matter, no hacer nada
  if (hasFrontMatter(content)) {
    return content;
  }
  
  // Insertar front-matter al inicio
  return frontMatter + '\n' + content;
}

/**
 * Encuentra todos los archivos .md recursivamente
 */
function findMarkdownFiles(dir: string): string[] {
  const files: string[] = [];
  
  function walkDir(currentPath: string) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      // Ignorar node_modules, .git, y otros directorios comunes
      // Pero permitir .archived-projects y otras carpetas ocultas del sistema
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git') {
          // Saltar estos directorios
        } else {
          walkDir(fullPath);
        }
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }
  
  walkDir(dir);
  return files;
}

/**
 * Función principal
 */
function main() {
  const targetDirs = ['.dendrita', 'workspaces'];
  const stats = {
    total: 0,
    processed: 0,
    skipped: 0,
    errors: 0
  };
  
  console.log('🔍 Escaneando archivos markdown...\n');
  
  for (const dir of targetDirs) {
    if (!fs.existsSync(dir)) {
      console.log(`⚠️  Directorio ${dir} no existe, saltando...`);
      continue;
    }
    
    const files = findMarkdownFiles(dir);
    stats.total += files.length;
    
    console.log(`📁 ${dir}: ${files.length} archivos encontrados`);
    
    for (const filePath of files) {
      const info = processFile(filePath);
      if (!info) {
        stats.errors++;
        continue;
      }
      
      // Si ya tiene front-matter, saltar
      if (info.alreadyHasFrontMatter) {
        console.log(`⏭️  Saltando ${info.relativePath} (ya tiene front-matter)`);
        stats.skipped++;
        continue;
      }
      
      // Extraer workspace y project
      const workspace = extractWorkspace(filePath);
      const project = extractProject(filePath);
      
      // Generar front-matter
      const frontMatter = generateFrontMatter(info, workspace, project);
      
      // Insertar front-matter
      const newContent = insertFrontMatter(info.content, frontMatter);
      
      // Escribir archivo
      try {
        fs.writeFileSync(filePath, newContent, 'utf-8');
        console.log(`✅ Procesado: ${info.relativePath}`);
        stats.processed++;
      } catch (error) {
        console.error(`❌ Error escribiendo ${info.relativePath}:`, error);
        stats.errors++;
      }
    }
  }
  
  console.log('\n📊 Estadísticas:');
  console.log(`   Total: ${stats.total}`);
  console.log(`   Procesados: ${stats.processed}`);
  console.log(`   Saltados (ya tenían front-matter): ${stats.skipped}`);
  console.log(`   Errores: ${stats.errors}`);
}

// Ejecutar
if (require.main === module) {
  main();
}

