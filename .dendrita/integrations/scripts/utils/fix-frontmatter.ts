#!/usr/bin/env ts-node

/**
 * Script para corregir front-matter YAML que no sigue la convención estándar
 * 
 * Correcciones:
 * - Estandariza formato de tags (array con comillas)
 * - Corrige category vs categories
 * - Ordena campos según convención estándar
 * - Normaliza formato de arrays
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { dump, load } from 'js-yaml';

interface FrontMatterStandard {
  name?: string;
  displayName?: string;
  description?: string;
  type?: string;
  workspace?: string;
  project?: string;
  created?: string;
  updated?: string;
  tags?: string[];
  category?: string;
  // Campos adicionales para tipos específicos
  date?: string;
  time?: string;
  status?: string;
  id?: string;
  source?: string;
  source_context?: string;
  workflow?: string;
  purpose?: string;
  references?: any;
  related_entries?: string[];
  categories?: string[]; // Para clippings, se convierte a category
}

/**
 * Detecta el tipo de archivo basado en la ruta
 */
function detectFileType(filePath: string): 'standard' | 'entry' | 'clipping' | 'hook' | 'agent' | 'skill' {
  if (filePath.includes('_clippings/') || filePath.includes('clippings/')) {
    return 'clipping';
  }
  if (filePath.includes('/entries/') || filePath.includes('/letters/')) {
    return 'entry';
  }
  if (filePath.includes('.dendrita/hooks/')) {
    return 'hook';
  }
  if (filePath.includes('.dendrita/users/') && filePath.includes('/agents/')) {
    return 'agent';
  }
  if (filePath.includes('.dendrita/users/') && filePath.includes('/skills/')) {
    return 'skill';
  }
  return 'standard';
}

/**
 * Normaliza tags a formato array con comillas
 */
function normalizeTags(tags: any): string[] {
  if (!tags) return [];
  
  // Si ya es un array de strings
  if (Array.isArray(tags)) {
    return tags.map(tag => {
      if (typeof tag === 'string') {
        // Remover comillas si las tiene
        return tag.replace(/^["']|["']$/g, '');
      }
      return String(tag);
    });
  }
  
  // Si es un string, convertir a array
  if (typeof tags === 'string') {
    // Intentar parsear como array
    try {
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Si no es JSON, tratar como string simple
      return [tags];
    }
  }
  
  return [];
}

/**
 * Ordena campos según convención estándar
 */
function orderFields(fm: FrontMatterStandard, fileType: string): FrontMatterStandard {
  const ordered: FrontMatterStandard = {};
  
  // Orden estándar para todos los tipos
  if (fm.name !== undefined) ordered.name = fm.name;
  if (fm.displayName !== undefined) ordered.displayName = fm.displayName;
  if (fm.description !== undefined) ordered.description = fm.description;
  if (fm.type !== undefined) ordered.type = fm.type;
  if (fm.workspace !== undefined) ordered.workspace = fm.workspace;
  if (fm.project !== undefined) ordered.project = fm.project;
  
  // Campos específicos de entries
  if (fileType === 'entry') {
    if (fm.date !== undefined) ordered.date = fm.date;
    if (fm.time !== undefined) ordered.time = fm.time;
    if (fm.status !== undefined) ordered.status = fm.status;
  }
  
  // Campos específicos de clippings
  if (fileType === 'clipping') {
    if (fm.id !== undefined) ordered.id = fm.id;
    if (fm.created !== undefined) ordered.created = fm.created;
    if (fm.source !== undefined) ordered.source = fm.source;
    if (fm.source_context !== undefined) ordered.source_context = fm.source_context;
    if (fm.workflow !== undefined) ordered.workflow = fm.workflow;
    if (fm.purpose !== undefined) ordered.purpose = fm.purpose;
    if (fm.status !== undefined) ordered.status = fm.status;
  }
  
  // Campos estándar de fecha
  if (fileType !== 'clipping' && fm.created !== undefined) ordered.created = fm.created;
  if (fileType !== 'clipping' && fm.updated !== undefined) ordered.updated = fm.updated;
  
  // Tags y category
  if (fm.tags !== undefined && fm.tags.length > 0) ordered.tags = fm.tags;
  if (fm.category !== undefined) ordered.category = fm.category;
  
  // Campos adicionales de entries
  if (fileType === 'entry') {
    if (fm.references !== undefined) ordered.references = fm.references;
    if (fm.related_entries !== undefined) ordered.related_entries = fm.related_entries;
  }
  
  return ordered;
}

/**
 * Convierte front-matter a YAML string
 */
function frontMatterToYAML(fm: FrontMatterStandard): string {
  let yamlStr = '---\n';
  
  for (const [key, value] of Object.entries(fm)) {
    if (value === undefined || value === null) continue;
    
    if (key === 'tags' && Array.isArray(value)) {
      // Formato array con comillas
      yamlStr += `tags: [${value.map(t => `"${t}"`).join(', ')}]\n`;
    } else if (key === 'description' && typeof value === 'string') {
      // Description siempre con comillas
      yamlStr += `description: ${JSON.stringify(value)}\n`;
    } else if (Array.isArray(value) && value.length > 0) {
      // Otros arrays en formato YAML lista
      yamlStr += `${key}:\n`;
      for (const item of value) {
        if (typeof item === 'object') {
          yamlStr += dump([item], { indent: 2 }).replace(/^- /gm, '  - ');
        } else {
          yamlStr += `  - ${typeof item === 'string' ? JSON.stringify(item) : item}\n`;
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      // Objetos anidados
      yamlStr += `${key}:\n`;
      yamlStr += dump(value, { indent: 2 }).split('\n').map((line: string) => '  ' + line).join('\n') + '\n';
    } else {
      yamlStr += `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}\n`;
    }
  }
  
  yamlStr += '---\n';
  return yamlStr;
}

/**
 * Procesa un archivo markdown y corrige su front-matter
 */
function processFile(filePath: string): boolean {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Verificar que tiene front-matter
    if (!content.startsWith('---\n')) {
      return false;
    }
    
    // Extraer front-matter
    const frontMatterEnd = content.indexOf('\n---\n', 4);
    if (frontMatterEnd === -1) {
      return false;
    }
    
    const frontMatterStr = content.substring(4, frontMatterEnd);
    const body = content.substring(frontMatterEnd + 5);
    
    // Normalizar front-matter antes de parsear
    let normalizedFMStr = frontMatterStr;
    const lines = frontMatterStr.split('\n');
    
    // 1. Manejar tags duplicados (tags: seguido de tags:)
    const tagsIndices: number[] = [];
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith('tags:') || trimmed === 'tags:') {
        tagsIndices.push(i);
      }
    }
    
    if (tagsIndices.length > 1) {
      // Hay tags duplicados, mantener solo el último que tenga un valor
      let lastTagsIndex = tagsIndices[tagsIndices.length - 1];
      // Buscar el último que tenga un valor (no solo "tags:")
      for (let i = tagsIndices.length - 1; i >= 0; i--) {
        const idx = tagsIndices[i];
        const trimmed = lines[idx].trim();
        if (trimmed !== 'tags:' && trimmed.length > 5) {
          lastTagsIndex = idx;
          break;
        }
      }
      const newLines: string[] = [];
      for (let i = 0; i < lines.length; i++) {
        if (tagsIndices.includes(i) && i !== lastTagsIndex) {
          // Saltar líneas de tags duplicados
          continue;
        }
        newLines.push(lines[i]);
      }
      normalizedFMStr = newLines.join('\n');
      // Actualizar lines para el siguiente paso
      lines.splice(0, lines.length, ...newLines);
    }
    
    // 2. Manejar caso especial donde hay tags en array Y luego más tags en formato lista
    // Esto ocurre cuando hay tags: ["tag1", "tag2"] seguido de líneas con - tag3
    const tagsArrayLine = lines.findIndex(line => line.trim().startsWith('tags:'));
    
    if (tagsArrayLine !== -1) {
      const tagsLine = lines[tagsArrayLine].trim();
      // Buscar tags en formato array
      const tagsArrayMatch = tagsLine.match(/^tags:\s*\[([^\]]+)\]\s*$/);
      
      if (tagsArrayMatch) {
        // Extraer tags del array
        const tagsFromArray = tagsArrayMatch[1].split(',').map(t => t.trim().replace(/^["']|["']$/g, ''));
        const additionalTags: string[] = [];
        let additionalTagsCount = 0;
        
        // Buscar líneas con guiones después del array de tags
        for (let i = tagsArrayLine + 1; i < lines.length; i++) {
          const line = lines[i];
          const trimmedLine = line.trim();
          
          // Si la línea está vacía, continuar
          if (!trimmedLine) {
            continue;
          }
          
          // Si la línea comienza con guión y está al mismo nivel o con indentación mínima
          if (trimmedLine.startsWith('- ')) {
            const tag = trimmedLine.substring(2).trim().replace(/^["']|["']$/g, '');
            if (tag && !tagsFromArray.includes(tag) && !additionalTags.includes(tag)) {
              additionalTags.push(tag);
              additionalTagsCount++;
            }
          } else {
            // Si encontramos otra clave YAML al mismo nivel (sin indentación), detener
            if (!line.startsWith(' ') && trimmedLine.match(/^[a-zA-Z_][a-zA-Z0-9_]*:/)) {
              break;
            }
            // Si la línea no está vacía y no es un guión, probablemente es otra cosa
            if (trimmedLine && !trimmedLine.startsWith('-') && !line.startsWith(' ')) {
              break;
            }
          }
        }
        
        // Si hay tags adicionales, combinarlos
        if (additionalTags.length > 0) {
          const allTags = [...tagsFromArray, ...additionalTags];
          // Reemplazar el array de tags y las líneas adicionales con un solo array
          const beforeTags = lines.slice(0, tagsArrayLine).join('\n');
          const afterTagsStart = tagsArrayLine + 1 + additionalTagsCount;
          const afterTags = lines.slice(afterTagsStart).join('\n');
          normalizedFMStr = beforeTags + (beforeTags ? '\n' : '') + 'tags: [' + allTags.map(t => `"${t}"`).join(', ') + ']' + (afterTags ? '\n' + afterTags : '');
        }
      }
    }
    
    // Parsear front-matter
    let frontMatter: any;
    try {
      frontMatter = load(normalizedFMStr) as FrontMatterStandard;
    } catch (error) {
      console.error(`Error parsing YAML in ${filePath}:`, error);
      return false;
    }
    
    if (!frontMatter || typeof frontMatter !== 'object') {
      return false;
    }
    
    // Detectar tipo de archivo
    const fileType = detectFileType(filePath);
    
    // Normalizar tags
    if (frontMatter.tags) {
      frontMatter.tags = normalizeTags(frontMatter.tags);
    }
    
    // Convertir categories a category si existe
    if (frontMatter.categories && !frontMatter.category) {
      // Si categories es un array, usar el primero como category
      if (Array.isArray(frontMatter.categories) && frontMatter.categories.length > 0) {
        frontMatter.category = frontMatter.categories[0];
      }
      // Mantener categories para clippings si es necesario
      if (fileType !== 'clipping') {
        delete frontMatter.categories;
      }
    }
    
    // Ordenar campos
    const orderedFM = orderFields(frontMatter, fileType);
    
    // Generar nuevo front-matter
    const newFrontMatter = frontMatterToYAML(orderedFM);
    
    // Verificar si hay cambios
    const oldFrontMatter = '---\n' + frontMatterStr + '\n---\n';
    if (oldFrontMatter === newFrontMatter) {
      return false; // No hay cambios
    }
    
    // Escribir archivo corregido
    const newContent = newFrontMatter + body;
    fs.writeFileSync(filePath, newContent, 'utf-8');
    
    return true;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}

/**
 * Busca todos los archivos markdown con front-matter
 */
function findMarkdownFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Saltar node_modules y otros directorios
      if (file.startsWith('.') && file !== '.dendrita') {
        continue;
      }
      if (file === 'node_modules') {
        continue;
      }
      findMarkdownFiles(filePath, fileList);
    } else if (file.endsWith('.md')) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

/**
 * Función principal
 */
function main() {
  const rootDir = path.resolve(__dirname, '../../../../');
  const markdownFiles = findMarkdownFiles(rootDir);
  
  let fixedCount = 0;
  let errorCount = 0;
  
  console.log(`Encontrados ${markdownFiles.length} archivos markdown\n`);
  
  for (const file of markdownFiles) {
    const relativePath = path.relative(rootDir, file);
    try {
      const wasFixed = processFile(file);
      if (wasFixed) {
        console.log(`✓ Corregido: ${relativePath}`);
        fixedCount++;
      }
    } catch (error) {
      console.error(`✗ Error en ${relativePath}:`, error);
      errorCount++;
    }
  }
  
  console.log(`\nResumen:`);
  console.log(`  - Archivos corregidos: ${fixedCount}`);
  console.log(`  - Errores: ${errorCount}`);
  console.log(`  - Total procesados: ${markdownFiles.length}`);
}

if (require.main === module) {
  main();
}

export { processFile, normalizeTags, orderFields };

