/**
 * Script para convertir links relativos a rutas absolutas en la presentación
 */

import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from '../../utils/logger';

const logger = createLogger('ConvertLinksToAbsolute');

/**
 * Encuentra el directorio raíz del proyecto
 */
function findProjectRoot(): string {
  let currentDir = process.cwd();
  
  while (currentDir !== path.dirname(currentDir)) {
    const dendritaPath = path.join(currentDir, '.dendrita');
    const packageJsonPath = path.join(currentDir, 'package.json');
    
    if (fs.existsSync(dendritaPath) || fs.existsSync(packageJsonPath)) {
      const workspacesPath = path.join(currentDir, 'workspaces');
      if (fs.existsSync(workspacesPath)) {
        return currentDir;
      }
    }
    
    currentDir = path.dirname(currentDir);
  }
  
  return process.cwd();
}

/**
 * Convierte una ruta relativa a absoluta desde la raíz del proyecto
 */
function convertToAbsolutePath(relativePath: string, projectRoot: string): string {
  // La ruta relativa actual es: ../../⚙️ company-management/data/scraped-content/temporada-1/...
  // Desde: workspaces/🧭 entre-rutas/🚀 active-projects/taller-liderazgo-impacto-latam/
  // Hacia: workspaces/🧭 entre-rutas/⚙️ company-management/data/scraped-content/temporada-1/
  
  // Si ya es una ruta absoluta (empieza con workspaces/), devolverla tal cual
  if (relativePath.startsWith('workspaces/')) {
    return relativePath;
  }
  
  // Extraer el nombre del archivo y el ancla
  const parts = relativePath.split('#');
  const filePath = parts[0];
  const anchor = parts.length > 1 ? '#' + parts[1] : '';
  
  // Resolver la ruta relativa
  // Desde: workspaces/🧭 entre-rutas/🚀 active-projects/taller-liderazgo-impacto-latam/
  // ../../ sube dos niveles: workspaces/🧭 entre-rutas/
  // Luego agrega el resto de la ruta (sin los ../)
  
  // Remover los ../ del inicio
  const cleanPath = filePath.replace(/^\.\.\/\.\.\//, '');
  
  // Construir la ruta absoluta
  const absolutePath = `workspaces/🧭 entre-rutas/${cleanPath}`;
  
  // Normalizar y limpiar la ruta (usar / en lugar de \)
  const normalized = absolutePath.replace(/\\/g, '/');
  
  return normalized + anchor;
}

/**
 * Convierte todos los links relativos a absolutos en el contenido
 */
function convertLinks(content: string, projectRoot: string): string {
  // Patrón para encontrar links: [link a línea](ruta-relativa#LXXX)
  const linkPattern = /\[link a línea\]\(([^)]+)\)/g;
  
  return content.replace(linkPattern, (match, relativePath) => {
    const absolutePath = convertToAbsolutePath(relativePath, projectRoot);
    logger.debug(`Converting: ${relativePath} -> ${absolutePath}`);
    return `[link a línea](${absolutePath})`;
  });
}

/**
 * Función principal
 */
async function main() {
  const projectRoot = findProjectRoot();
  const presentationPath = path.join(
    projectRoot,
    'workspaces/🧭 entre-rutas/🚀 active-projects/taller-liderazgo-impacto-latam/lo-que-aprendimos-en-el-camino-ril.md'
  );
  
  if (!fs.existsSync(presentationPath)) {
    throw new Error(`Presentation file not found: ${presentationPath}`);
  }
  
  logger.info('Reading presentation file...');
  const content = fs.readFileSync(presentationPath, 'utf-8');
  
  logger.info('Converting links to absolute paths...');
  const convertedContent = convertLinks(content, projectRoot);
  
  logger.info('Saving converted presentation...');
  fs.writeFileSync(presentationPath, convertedContent, 'utf-8');
  
  logger.info('✓ Links converted successfully!');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(error => {
    logger.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main, convertLinks, convertToAbsolutePath };

