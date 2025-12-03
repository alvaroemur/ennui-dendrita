/**
 * Script para agregar anclas HTML a los archivos de transcripción
 * Esto permite que los links #L228 funcionen correctamente en markdown
 */

import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from '../../utils/logger';

const logger = createLogger('AddLineAnchors');

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
 * Agrega anclas HTML a cada línea de un archivo de transcripción
 */
function addLineAnchorsToFile(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    logger.warn(`File not found: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  // Verificar si el archivo ya tiene anclas (para no duplicar)
  if (lines.length > 0 && lines[0].includes('id="L1"')) {
    logger.info(`File already has anchors: ${filePath}`);
    return;
  }
  
  const linesWithAnchors = lines.map((line, index) => {
    const lineNumber = index + 1;
    // Agregar ancla HTML al inicio de cada línea
    // Formato: <span id="L228"></span>contenido de la línea
    return `<span id="L${lineNumber}"></span>${line}`;
  });
  
  const newContent = linesWithAnchors.join('\n');
  fs.writeFileSync(filePath, newContent, 'utf-8');
  logger.info(`Added anchors to ${lines.length} lines in ${filePath}`);
}

/**
 * Función principal
 */
async function main() {
  const projectRoot = findProjectRoot();
  const transcriptsDir = path.join(
    projectRoot,
    'workspaces/🧭 entre-rutas/⚙️ company-management/data/scraped-content/temporada-1'
  );
  
  if (!fs.existsSync(transcriptsDir)) {
    throw new Error(`Transcripts directory not found: ${transcriptsDir}`);
  }
  
  logger.info('Reading transcripts directory...');
  const files = fs.readdirSync(transcriptsDir);
  const transcriptFiles = files.filter(file => file.endsWith('-transcript.md'));
  
  logger.info(`Found ${transcriptFiles.length} transcript files`);
  
  for (const file of transcriptFiles) {
    const filePath = path.join(transcriptsDir, file);
    logger.info(`Processing ${file}...`);
    addLineAnchorsToFile(filePath);
  }
  
  logger.info('✓ All transcripts processed successfully!');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(error => {
    logger.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main, addLineAnchorsToFile };

