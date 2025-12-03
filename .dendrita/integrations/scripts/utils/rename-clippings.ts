#!/usr/bin/env ts-node
/**
 * Script para renombrar archivos de clipping con nuevo formato:
 * YYYY-MM-DD-HHmm-[descripcion]-clipping.md
 * 
 * Extrae la hora del frontmatter 'created' y genera un slug del título
 */

import * as fs from 'fs';
import * as path from 'path';

interface ClippingFrontmatter {
  id?: string;
  created?: string;
  source?: string;
  [key: string]: any;
}

function slugify(text: string, maxLength: number = 50): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, maxLength)
    .replace(/-+$/, ''); // Remove trailing hyphens after truncation
}

function extractTitle(content: string): string | null {
  // Buscar título en formato "# Clipping: [título]"
  const titleMatch = content.match(/^#\s+Clipping:\s+(.+)$/m);
  if (titleMatch) {
    return titleMatch[1].trim();
  }
  
  // Buscar cualquier título H1
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return h1Match[1].trim();
  }
  
  return null;
}

function parseFrontmatter(content: string): ClippingFrontmatter | null {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    return null;
  }
  
  const frontmatterText = frontmatterMatch[1];
  const frontmatter: ClippingFrontmatter = {};
  
  for (const line of frontmatterText.split('\n')) {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      const key = match[1];
      let value: any = match[2].trim();
      
      // Parse arrays
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map((v: string) => v.trim().replace(/^["']|["']$/g, ''));
      } else if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      
      frontmatter[key] = value;
    }
  }
  
  return frontmatter;
}

function generateNewFilename(oldPath: string, frontmatter: ClippingFrontmatter, title: string | null): string {
  const dir = path.dirname(oldPath);
  const oldBasename = path.basename(oldPath);
  
  // Extraer fecha del nombre actual o del frontmatter
  let dateStr = '';
  let timeStr = '';
  
  if (frontmatter.created) {
    // Parsear fecha en UTC para mantener consistencia
    const date = new Date(frontmatter.created);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    
    dateStr = `${year}-${month}-${day}`;
    timeStr = `${hours}${minutes}`;
  } else {
    // Fallback: extraer del nombre actual
    const dateMatch = oldBasename.match(/^(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      dateStr = dateMatch[1];
      timeStr = '0000'; // Default time if not available
    } else {
      throw new Error(`No se pudo extraer fecha de ${oldPath}`);
    }
  }
  
  // Generar descripción del título o usar hash como fallback
  let description = '';
  if (title) {
    description = slugify(title, 50);
  } else if (frontmatter.id) {
    description = frontmatter.id.substring(0, 8);
  } else {
    // Extraer hash del nombre actual como último recurso
    const hashMatch = oldBasename.match(/-([a-f0-9]{6,8})-clipping\.md$/);
    if (hashMatch) {
      description = hashMatch[1];
    } else {
      description = 'clipping';
    }
  }
  
  // Si la descripción está vacía, usar un hash corto
  if (!description) {
    description = frontmatter.id?.substring(0, 8) || 'clipping';
  }
  
  const newBasename = `${dateStr}-${timeStr}-${description}-clipping.md`;
  return path.join(dir, newBasename);
}

function renameClippingFile(filePath: string, dryRun: boolean = false): { old: string; new: string; success: boolean; error?: string } {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const frontmatter = parseFrontmatter(content);
    
    if (!frontmatter) {
      return {
        old: filePath,
        new: filePath,
        success: false,
        error: 'No se encontró frontmatter'
      };
    }
    
    const title = extractTitle(content);
    const newPath = generateNewFilename(filePath, frontmatter, title);
    
    // Si el nuevo nombre es igual al actual, no hacer nada
    if (filePath === newPath) {
      return {
        old: filePath,
        new: newPath,
        success: true
      };
    }
    
    // Verificar si el archivo destino ya existe
    if (fs.existsSync(newPath) && newPath !== filePath) {
      return {
        old: filePath,
        new: newPath,
        success: false,
        error: `El archivo destino ya existe: ${newPath}`
      };
    }
    
    if (!dryRun) {
      fs.renameSync(filePath, newPath);
    }
    
    return {
      old: filePath,
      new: newPath,
      success: true
    };
  } catch (error: any) {
    return {
      old: filePath,
      new: filePath,
      success: false,
      error: error.message
    };
  }
}

function findClippingFiles(baseDir: string): string[] {
  const files: string[] = [];
  
  function walkDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('-clipping.md')) {
        files.push(fullPath);
      }
    }
  }
  
  walkDir(baseDir);
  return files;
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const baseDir = args.find(arg => !arg.startsWith('--')) || '_clippings';
  
  if (!fs.existsSync(baseDir)) {
    console.error(`Error: El directorio ${baseDir} no existe`);
    process.exit(1);
  }
  
  console.log(`Buscando archivos de clipping en: ${baseDir}`);
  if (dryRun) {
    console.log('🔍 MODO DRY-RUN: No se realizarán cambios\n');
  }
  
  const files = findClippingFiles(baseDir);
  console.log(`Encontrados ${files.length} archivos de clipping\n`);
  
  // Primero, generar todos los nombres nuevos para detectar colisiones
  const nameMap = new Map<string, string>(); // newName -> oldPath
  const results: Array<{ old: string; new: string; success: boolean; error?: string }> = [];
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const frontmatter = parseFrontmatter(content);
      
      if (!frontmatter) {
        results.push({
          old: file,
          new: file,
          success: false,
          error: 'No se encontró frontmatter'
        });
        continue;
      }
      
      const title = extractTitle(content);
      let newPath = generateNewFilename(file, frontmatter, title);
      
      // Manejar colisiones: si el nombre ya existe, agregar hash corto
      let finalPath = newPath;
      let attempts = 0;
      while (nameMap.has(finalPath) && finalPath !== file) {
        attempts++;
        // Hay una colisión, agregar hash al final
        const hash = frontmatter.id?.substring(0, 6) || path.basename(file).match(/-([a-f0-9]{6,8})-clipping\.md$/)?.[1] || 'hash';
        const dir = path.dirname(newPath);
        const basename = path.basename(newPath);
        // Formato: YYYY-MM-DD-HHmm-[descripcion]-clipping.md
        const match = basename.match(/^(\d{4}-\d{2}-\d{2}-\d{4})-(.+)-clipping\.md$/);
        if (match) {
          const dateTimePart = match[1]; // YYYY-MM-DD-HHmm
          let descPart = match[2]; // descripción
          // Si ya tiene hash, removerlo primero
          descPart = descPart.replace(/-[a-f0-9]{6,8}$/, '');
          // Truncar descripción si es necesario para dejar espacio al hash (max 40 chars)
          if (descPart.length > 40) {
            descPart = descPart.substring(0, 40);
          }
          finalPath = path.join(dir, `${dateTimePart}-${descPart}-${hash}-clipping.md`);
        } else {
          // No se pudo parsear, usar hash directo
          break;
        }
        if (attempts > 10) {
          // Prevenir loop infinito
          break;
        }
      }
      
      nameMap.set(finalPath, file);
      newPath = finalPath;
      results.push({
        old: file,
        new: newPath,
        success: true
      });
    } catch (error: any) {
      results.push({
        old: file,
        new: file,
        success: false,
        error: error.message
      });
    }
  }
  
  // Ahora renombrar los archivos
  for (const result of results) {
    if (result.success) {
      if (result.old !== result.new) {
        // Verificar si el archivo destino ya existe
        if (fs.existsSync(result.new) && result.new !== result.old) {
          console.error(`❌ ${path.basename(result.old)}`);
          console.error(`   Error: El archivo destino ya existe: ${path.basename(result.new)}`);
          result.success = false;
          result.error = 'Archivo destino ya existe';
        } else {
          if (!dryRun) {
            fs.renameSync(result.old, result.new);
          }
          console.log(`✅ ${path.basename(result.old)}`);
          console.log(`   → ${path.basename(result.new)}`);
        }
      } else {
        console.log(`⏭️  ${path.basename(result.old)} (ya tiene formato correcto)`);
      }
    } else {
      console.error(`❌ ${path.basename(result.old)}`);
      console.error(`   Error: ${result.error}`);
    }
  }
  
  const successful = results.filter(r => r.success && r.old !== r.new).length;
  const failed = results.filter(r => !r.success).length;
  const skipped = results.filter(r => r.success && r.old === r.new).length;
  
  console.log(`\n📊 Resumen:`);
  console.log(`   ✅ Renombrados: ${successful}`);
  console.log(`   ⏭️  Sin cambios: ${skipped}`);
  console.log(`   ❌ Errores: ${failed}`);
  
  if (dryRun && successful > 0) {
    console.log(`\n💡 Ejecuta sin --dry-run para aplicar los cambios`);
  }
}

if (require.main === module) {
  main();
}

