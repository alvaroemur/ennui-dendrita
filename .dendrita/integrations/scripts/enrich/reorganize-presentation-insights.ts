/**
 * Script para reorganizar insights en la presentación
 * 
 * Mueve todos los insights al final de cada slide, después del contenido
 * y de las notas del orador.
 */

import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from '../../utils/logger';

const logger = createLogger('ReorganizeInsights');

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
 * Reorganiza un slide moviendo insights al final
 */
function reorganizeSlide(slideContent: string, originalSlideContent?: string): string {
  // Extraer el título del slide (primera línea con ### Slide)
  const titleMatch = slideContent.match(/^(### Slide \d+.*?\n)/);
  if (!titleMatch) {
    return slideContent;
  }
  
  const title = titleMatch[1];
  const rest = slideContent.substring(titleMatch[0].length);
  
  // Extraer todos los insights del slide
  const allInsights: string[] = [];
  let contentWithoutInsights = rest;
  
  // Buscar todas las secciones de insights (pueden estar en cualquier lugar)
  const insightsPattern = /(\n\n---\n\n\*\*Insights de las entrevistas:\*\*[\s\S]*?)(?=\n\n---\n\n\*\*Insights de las entrevistas:\*\*|\n\n---\n\n\*\*Notas del orador:\*\*|### Slide|$)/g;
  let match;
  
  while ((match = insightsPattern.exec(rest)) !== null) {
    allInsights.push(match[1].trim());
    // Remover este insight del contenido
    contentWithoutInsights = contentWithoutInsights.replace(match[1], '');
  }
  
  // Si no se encontraron con el patrón anterior, buscar de otra manera
  if (allInsights.length === 0) {
    const insightsStart = contentWithoutInsights.indexOf('**Insights de las entrevistas:**');
    if (insightsStart !== -1) {
      // Extraer todo desde el primer insight hasta el final o siguiente slide
      const insightsSection = contentWithoutInsights.substring(insightsStart);
      const nextSlideMatch = insightsSection.match(/([\s\S]*?)(?=\n### Slide|$)/);
      if (nextSlideMatch) {
        // Dividir en múltiples insights si hay varios
        const insightsParts = nextSlideMatch[1].split(/\n\n---\n\n(?=\*\*Insights de las entrevistas:\*\*)/);
        for (const part of insightsParts) {
          if (part.includes('**Insights de las entrevistas:**')) {
            allInsights.push('\n\n---\n\n' + part.trim());
          }
        }
        contentWithoutInsights = contentWithoutInsights.substring(0, insightsStart);
      }
    }
  }
  
  // Limpiar el contenido de insights duplicados o restos
  contentWithoutInsights = contentWithoutInsights.replace(/\n\n---\n\n\*\*Insights de las entrevistas:\*\*/g, '');
  contentWithoutInsights = contentWithoutInsights.trim();
  
  // Separar notas del orador del contenido
  let content = contentWithoutInsights;
  let notes = '';
  
  const notesPattern = /(\*\*Notas del orador:\*\*[\s\S]*?)(?=\n\n---|\*\*Insights|###|$)/;
  const notesMatch = content.match(notesPattern);
  
  if (notesMatch) {
    const notesIndex = content.indexOf(notesMatch[1]);
    notes = notesMatch[1].trim();
    content = content.substring(0, notesIndex).trim();
  }
  
  // Construir el slide reorganizado
  let reorganized = title;
  
  // Añadir contenido principal
  if (content) {
    reorganized += content;
    if (!content.endsWith('\n')) {
      reorganized += '\n';
    }
  }
  
  // Añadir notas del orador
  if (notes) {
    reorganized += '\n\n';
    reorganized += notes;
    if (!notes.endsWith('\n')) {
      reorganized += '\n';
    }
  }
  
  // Añadir todos los insights al final
  if (allInsights.length > 0) {
    reorganized += '\n';
    reorganized += allInsights.join('\n');
  }
  
  return reorganized;
}

/**
 * Reorganiza la presentación completa
 */
function reorganizePresentation(content: string): string {
  // Dividir en slides
  const slides = content.split(/(?=### Slide \d+)/);
  
  const reorganizedSlides: string[] = [];
  
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    if (slide.trim()) {
      if (slide.startsWith('### Slide')) {
        const reorganized = reorganizeSlide(slide);
        reorganizedSlides.push(reorganized);
      } else {
        // Contenido antes del primer slide (header, introducción, etc.)
        reorganizedSlides.push(slide);
      }
    }
  }
  
  return reorganizedSlides.join('\n');
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
  
  logger.info('Reading presentation...');
  const content = fs.readFileSync(presentationPath, 'utf-8');
  
  logger.info('Reorganizing insights...');
  const reorganized = reorganizePresentation(content);
  
  logger.info('Saving reorganized presentation...');
  fs.writeFileSync(presentationPath, reorganized, 'utf-8');
  
  logger.info('✓ Presentation reorganized successfully!');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(error => {
    logger.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main, reorganizePresentation, reorganizeSlide };

