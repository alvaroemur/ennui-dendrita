#!/usr/bin/env ts-node

/**
 * Script to transform workspace files and folders to use emojis in names
 * 
 * Usage:
 *   ts-node transform-workspaces-emojis.ts [workspace]
 *   ts-node transform-workspaces-emojis.ts --all
 *   ts-node transform-workspaces-emojis.ts --dry-run
 */

import * as fs from 'fs';
import * as path from 'path';

interface EmojiMapping {
  [key: string]: string;
}

// Mapping de palabras clave a emojis
const emojiMapping: EmojiMapping = {
  // Dashboard y análisis
  'dashboard': '📊',
  'analysis': '📈',
  'analisis': '📈',
  'metrics': '📊',
  'report': '📄',
  'reporte': '📄',
  
  // Pipeline y flujo
  'pipeline': '🔄',
  'flow': '🔄',
  'flujo': '🔄',
  
  // Guías y directrices
  'guidelines': '📋',
  'guide': '📋',
  'guia': '📋',
  'instructions': '📋',
  'instrucciones': '📋',
  
  // Perfiles y equipos
  'profiles': '👥',
  'profile': '👥',
  'perfil': '👥',
  'team': '👥',
  'equipo': '👥',
  
  // Roadmap y planificación
  'roadmap': '🗺️',
  'plan': '🗺️',
  'planning': '🗺️',
  'planeamiento': '🗺️',
  
  // Notas y reuniones
  'notes': '📝',
  'notas': '📝',
  'meeting': '📝',
  'reunion': '📝',
  
  // Acuerdos y contratos
  'acuerdos': '🤝',
  'agreements': '🤝',
  'contracts': '🤝',
  'contratos': '🤝',
  
  // Correos y comunicación
  'correos': '📧',
  'emails': '📧',
  'email': '📧',
  'communication': '💬',
  'comunicacion': '💬',
  'comms': '💬',
  
  // Experiencias y portafolio
  'experiencias': '💼',
  'experiences': '💼',
  'portafolio': '💼',
  'portfolio': '💼',
  'cv': '📄',
  
  // Desarrollo y proyectos
  'desarrollo': '💻',
  'development': '💻',
  'dev': '💻',
  'proyectos': '🚀',
  'projects': '🚀',
  
  // Proyectos específicos
  'axon': '🧠',
  'neuron': '🧠',
  'bootcamp': '🎓',
  'fundraising': '💰',
  'dendrita': '🌳',
  'rag': '🔍',
  'mosaico': '🎨',
  'nosotros': '🤝',
  
  // Configuración
  'config': '⚙️',
  'configuration': '⚙️',
  'configuracion': '⚙️',
  'setup': '⚙️',
  
  // Referencias
  'reference': '📚',
  'referencia': '📚',
  'references': '📚',
  'referencias': '📚',
  
  // Archivos importantes
  'important': '⭐',
  'importante': '⭐',
  
  // Archivos y contenido
  'files': '📁',
  'archivos': '📁',
  'content': '📄',
  'contenido': '📄',
  
  // Scraped content
  'scraped': '🔍',
  'scrapeado': '🔍',
  
  // Scripts
  'scripts': '🔧',
  'script': '🔧',
  'integration': '🔗',
  'integracion': '🔗',
};

/**
 * Encuentra el emoji apropiado para un nombre
 */
function findEmoji(name: string): string {
  const lowerName = name.toLowerCase();
  
  // Buscar coincidencias exactas primero
  for (const [key, emoji] of Object.entries(emojiMapping)) {
    if (lowerName.includes(key)) {
      return emoji;
    }
  }
  
  return '';
}

// Carpetas del sistema que NO deben transformarse
const systemFolders = [
  'active-projects',
  'archived-projects',
  'company-management',
  'best-practices',
  'products',
  'stakeholders',
  'tools-templates',
  'work-modes'
];

// Archivos del sistema que NO deben transformarse
const systemFiles = [
  'master-plan.md',
  'current-context.md',
  'tasks.md',
  'README.md',
  '.gitignore',
  'allies-mapping.md',
  'projects-governance.md',
  'projects-dashboard.md'
];

/**
 * Transforma un nombre de archivo/carpeta agregando emoji
 */
function transformName(originalName: string, isDirectory: boolean = false, parentPath: string = ''): string {
  // No transformar si ya tiene emoji al inicio (formato: "emoji nombre")
  const emojiAtStartRegex = /^[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FAFF}]\s/u;
  if (emojiAtStartRegex.test(originalName)) {
    return originalName; // Ya tiene emoji al inicio
  }
  
  // NO transformar carpetas del sistema
  if (isDirectory && systemFolders.includes(originalName)) {
    return originalName;
  }
  
  // NO transformar archivos del sistema
  if (systemFiles.includes(originalName)) {
    return originalName;
  }
  
  // NO transformar archivos de configuración técnica
  if (originalName.endsWith('.json') || originalName.endsWith('.html') || originalName.endsWith('.ts') || originalName.endsWith('.js')) {
    // Solo transformar si es un archivo de contenido, no de configuración técnica
    if (originalName.includes('config') || originalName.includes('metrics') || originalName.includes('visualization')) {
      return originalName;
    }
  }
  
  // Encontrar emoji apropiado
  const emoji = findEmoji(originalName);
  
  if (emoji) {
    return `${emoji} ${originalName}`;
  }
  
  return originalName; // No hay emoji apropiado, mantener original
}

/**
 * Transforma archivos y carpetas recursivamente
 */
function transformDirectory(dir: string, dryRun: boolean = false, transformed: string[] = [], isSystemFolder: boolean = false): void {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    // Skip hidden files and system directories
    if (item.name.startsWith('.')) continue;
    if (item.name === 'node_modules') continue;
    if (item.name === '_archived') continue;
    
    // Determinar si estamos en una carpeta del sistema
    const isInSystemFolder = isSystemFolder || systemFolders.includes(item.name);
    
    // Lógica de transformación:
    // 1. NO transformar carpetas del sistema (active-projects, company-management, etc.)
    // 2. SÍ transformar carpetas dentro de active-projects/ y archived-projects/ (proyectos personalizados)
    // 3. SÍ transformar archivos dentro de company-management/
    const isSystemFolderItem = item.isDirectory() && systemFolders.includes(item.name);
    const isInsideActiveProjects = dir.includes('active-projects') || dir.includes('archived-projects');
    const isInsideCompanyManagement = dir.includes('company-management');
    
    // Transformar si:
    // - NO es una carpeta del sistema Y
    // - (Estamos dentro de active-projects/archived-projects O dentro de company-management)
    const shouldTransform = !isSystemFolderItem && (isInsideActiveProjects || isInsideCompanyManagement || !isInSystemFolder);
    
    const newName = shouldTransform ? transformName(item.name, item.isDirectory(), dir) : item.name;
    
    if (newName !== item.name) {
      const newPath = path.join(dir, newName);
      
      if (dryRun) {
        console.log(`[DRY RUN] Would rename: ${item.name} → ${newName}`);
        transformed.push(`${fullPath} → ${newPath}`);
      } else {
        try {
          fs.renameSync(fullPath, newPath);
          console.log(`✅ Renamed: ${item.name} → ${newName}`);
          transformed.push(`${fullPath} → ${newPath}`);
          
          // Si es directorio, continuar transformando su contenido
          if (item.isDirectory()) {
            transformDirectory(newPath, dryRun, transformed, false);
          }
        } catch (error) {
          console.error(`❌ Error renaming ${item.name}:`, error);
        }
      }
    } else {
      // Continuar en subdirectorios aunque no se renombre
      if (item.isDirectory()) {
        // Si es una carpeta del sistema, marcar como tal para no transformar su contenido
        const isSystem = systemFolders.includes(item.name);
        transformDirectory(fullPath, dryRun, transformed, isSystem);
      }
    }
  }
}

/**
 * Función principal
 */
function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const allWorkspaces = args.includes('--all');
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }
  
  if (allWorkspaces) {
    const workspacesDir = path.join(process.cwd(), 'workspaces');
    if (fs.existsSync(workspacesDir)) {
      const workspaces = fs.readdirSync(workspacesDir, { withFileTypes: true })
        .filter(item => item.isDirectory() && !item.name.startsWith('.'));
      
      for (const workspace of workspaces) {
        console.log(`\n📦 Processing workspace: ${workspace.name}`);
        const workspacePath = path.join(workspacesDir, workspace.name);
        
        // Transformar company-management/
        const companyManagementPath = path.join(workspacePath, 'company-management');
        if (fs.existsSync(companyManagementPath)) {
          console.log(`\n  📁 Transforming company-management/`);
          transformDirectory(companyManagementPath, dryRun);
        }
        
        // Transformar active-projects/
        const activeProjectsPath = path.join(workspacePath, 'active-projects');
        if (fs.existsSync(activeProjectsPath)) {
          console.log(`\n  📁 Transforming active-projects/`);
          transformDirectory(activeProjectsPath, dryRun);
        }
        
        // Transformar archived-projects/
        const archivedProjectsPath = path.join(workspacePath, 'archived-projects');
        if (fs.existsSync(archivedProjectsPath)) {
          console.log(`\n  📁 Transforming archived-projects/`);
          transformDirectory(archivedProjectsPath, dryRun);
        }
      }
      
      if (!dryRun) {
        console.log('\n✅ All workspaces transformed!');
        console.log('\n💡 Next step: Run backup script to create hidden backups');
        console.log('   ts-node .dendrita/integrations/scripts/update-emoji-backups.ts --all');
      }
    }
  } else {
    const workspace = args.find(arg => !arg.startsWith('--'));
    if (workspace) {
      const workspacePath = path.join(process.cwd(), 'workspaces', workspace);
      if (fs.existsSync(workspacePath)) {
        console.log(`\n📦 Processing workspace: ${workspace}`);
        
        // Transformar company-management/
        const companyManagementPath = path.join(workspacePath, 'company-management');
        if (fs.existsSync(companyManagementPath)) {
          console.log(`\n  📁 Transforming company-management/`);
          transformDirectory(companyManagementPath, dryRun);
        }
        
        // Transformar active-projects/
        const activeProjectsPath = path.join(workspacePath, 'active-projects');
        if (fs.existsSync(activeProjectsPath)) {
          console.log(`\n  📁 Transforming active-projects/`);
          transformDirectory(activeProjectsPath, dryRun);
        }
        
        // Transformar archived-projects/
        const archivedProjectsPath = path.join(workspacePath, 'archived-projects');
        if (fs.existsSync(archivedProjectsPath)) {
          console.log(`\n  📁 Transforming archived-projects/`);
          transformDirectory(archivedProjectsPath, dryRun);
        }
        
        if (!dryRun) {
          console.log('\n✅ Workspace transformed!');
          console.log('\n💡 Next step: Run backup script to create hidden backups');
          console.log(`   ts-node .dendrita/integrations/scripts/update-emoji-backups.ts ${workspace}`);
        }
      } else {
        console.error(`❌ Workspace not found: ${workspace}`);
      }
    } else {
      console.log('Usage:');
      console.log('  ts-node transform-workspaces-emojis.ts [workspace]');
      console.log('  ts-node transform-workspaces-emojis.ts --all');
      console.log('  ts-node transform-workspaces-emojis.ts --dry-run');
      console.log('');
      console.log('Examples:');
      console.log('  ts-node transform-workspaces-emojis.ts --all --dry-run  # Preview changes');
      console.log('  ts-node transform-workspaces-emojis.ts --all             # Apply to all workspaces');
      console.log('  ts-node transform-workspaces-emojis.ts inspiro            # Apply to specific workspace');
    }
  }
}

if (require.main === module) {
  main();
}

