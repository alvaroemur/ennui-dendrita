/**
 * Script para reorganizar insights en la presentación (versión mejorada)
 * 
 * Usa la versión original como referencia para identificar el contenido real
 * de cada slide y mueve todos los insights al final.
 */

import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from '../../utils/logger';

const logger = createLogger('ReorganizeInsightsV2');

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
 * Extrae el contenido original de un slide (sin insights)
 */
function getOriginalSlideContent(slideNumber: number, originalContent: string): string {
  const slidePattern = new RegExp(`(### Slide ${slideNumber}[\\s\\S]*?)(?=### Slide|$)`, 'm');
  const match = originalContent.match(slidePattern);
  return match ? match[1] : '';
}

/**
 * Extrae todos los insights de un slide y también identifica dónde terminan
 */
function extractInsights(slideContent: string): { insights: string[]; lastInsightEndIndex: number } {
  const insights: string[] = [];
  
  // Buscar todas las ocurrencias de "**Insights de las entrevistas:**"
  const allInsightStarts: number[] = [];
  let searchIndex = 0;
  while ((searchIndex = slideContent.indexOf('**Insights de las entrevistas:**', searchIndex)) !== -1) {
    allInsightStarts.push(searchIndex);
    searchIndex += '**Insights de las entrevistas:**'.length;
  }
  
  if (allInsightStarts.length === 0) {
    return { insights: [], lastInsightEndIndex: -1 };
  }
  
  // Extraer cada insight manualmente
  let lastInsightEndIndex = -1;
  for (let i = 0; i < allInsightStarts.length; i++) {
    const startIndex = allInsightStarts[i];
    
    // Buscar el separador --- antes del insight
    const separatorIndex = slideContent.lastIndexOf('\n---\n', startIndex);
    
    // Encontrar dónde termina este insight
    let endIndex = -1;
    if (i < allInsightStarts.length - 1) {
      // Hay otro insight después, terminar justo antes del separador del siguiente insight
      const nextSeparatorIndex = slideContent.lastIndexOf('\n---\n', allInsightStarts[i + 1]);
      if (nextSeparatorIndex > startIndex) {
        endIndex = nextSeparatorIndex;
      } else {
        // Si no hay separador antes del siguiente, usar el inicio del siguiente insight
        endIndex = allInsightStarts[i + 1];
      }
    } else {
      // Es el último insight, encontrar el final real del último insight
      // ESTRATEGIA: Buscar el siguiente slide y encontrar el final de la última cita antes de él
      const nextSlideIndex = slideContent.indexOf('\n### Slide', startIndex);
      const searchEndIndex = nextSlideIndex > startIndex ? nextSlideIndex : slideContent.length;
      const contentBeforeNext = slideContent.substring(startIndex, searchEndIndex);
      
      // Buscar el último patrón "**Citas relevantes:**" y encontrar el final de la última cita
      const lastCitasIndex = contentBeforeNext.lastIndexOf('**Citas relevantes:**');
      if (lastCitasIndex > 0) {
        // Hay citas, encontrar el final de la última cita (después del último link)
        const afterCitas = contentBeforeNext.substring(lastCitasIndex);
        const linkPattern = /\(\[link a línea\]\([^)]+\)\)/g;
        let lastLinkEnd = -1;
        let linkMatch;
        while ((linkMatch = linkPattern.exec(afterCitas)) !== null) {
          lastLinkEnd = linkMatch.index + linkMatch[0].length;
        }
        if (lastLinkEnd > 0) {
          // Encontrar el final de la línea que contiene el último link
          // Buscar el siguiente salto de línea después del último link
          const afterLastLink = afterCitas.substring(lastLinkEnd);
          const lineEnd = afterLastLink.indexOf('\n');
          if (lineEnd > 0) {
            // Hay un salto de línea después del último link
            // El insight termina justo después de ese salto de línea
            // IMPORTANTE: No incluir ningún contenido después de la última cita
            endIndex = startIndex + lastCitasIndex + lastLinkEnd + lineEnd + 1; // +1 para incluir el \n
          } else {
            // No hay salto de línea después del último link (raro, pero manejarlo)
            // El insight termina al final de la línea con el último link
            endIndex = startIndex + lastCitasIndex + lastLinkEnd;
          }
        } else {
          // No se encontraron links, buscar el final del contenido antes del siguiente slide
          // Pero asegurarse de que no incluya contenido residual
          endIndex = searchEndIndex;
        }
      } else {
        // No hay citas, buscar el último separador --- antes del siguiente slide
        const lastSeparator = contentBeforeNext.lastIndexOf('\n---\n');
        if (lastSeparator > 0) {
          endIndex = startIndex + lastSeparator + 5; // +5 para incluir "\n---\n"
        } else {
          // No hay separador ni citas, usar el siguiente slide como límite
          endIndex = searchEndIndex;
        }
      }
    }
    
    if (endIndex > startIndex && separatorIndex >= 0 && separatorIndex < startIndex) {
      const insightContent = slideContent.substring(separatorIndex, endIndex);
      insights.push(insightContent.trim());
      lastInsightEndIndex = Math.max(lastInsightEndIndex, endIndex);
    }
  }
  
  return { insights, lastInsightEndIndex };
}

/**
 * Reorganiza un slide usando la versión original como referencia
 */
function reorganizeSlideWithOriginal(
  slideNumber: number,
  currentSlideContent: string,
  originalSlideContent: string
): string {
  // Extraer título
  const titleMatch = currentSlideContent.match(/^(### Slide \d+.*?\n)/);
  if (!titleMatch) {
    return currentSlideContent;
  }
  
  const title = titleMatch[1];
  
  // Extraer todos los insights del slide actual primero
  // IMPORTANTE: Extraer insights ANTES de procesar el contenido para evitar que el contenido residual se filtre
  const { insights: allInsights, lastInsightEndIndex } = extractInsights(currentSlideContent);
  
  // Extraer contenido original (sin insights) - esta es la fuente de verdad
  let originalRest = '';
  if (originalSlideContent && originalSlideContent.trim()) {
    const originalTitleMatch = originalSlideContent.match(/^(### Slide \d+.*?\n)/);
    if (originalTitleMatch) {
      originalRest = originalSlideContent.substring(originalTitleMatch[0].length).trim();
    }
  }
  
  // SIEMPRE usar el contenido original si está disponible (es la fuente de verdad)
  // Esto reemplaza completamente el contenido actual para evitar duplicados
  // IMPORTANTE: El contenido original NO incluye insights ni contenido residual, así que no habrá duplicación
  let baseContent = originalRest;
  
  // Si NO tenemos contenido original, extraer del contenido actual removiendo insights
  // IMPORTANTE: Si tenemos contenido original, NO usar nada del contenido actual excepto los insights
  if (!baseContent || baseContent.trim() === '') {
    // Fallback: extraer del contenido actual removiendo insights
    // Usar el índice del primer insight para extraer solo el contenido antes de los insights
    let contentWithoutInsights = '';
    const firstInsightIndex = currentSlideContent.indexOf('**Insights de las entrevistas:**');
    if (firstInsightIndex > 0) {
      // Todo antes del primer insight es el contenido (sin el título)
      // Buscar el separador --- antes del primer insight
      const separatorIndex = currentSlideContent.lastIndexOf('\n---\n', firstInsightIndex);
      if (separatorIndex > titleMatch[0].length) {
        // El contenido termina justo antes del separador que precede al primer insight
        contentWithoutInsights = currentSlideContent.substring(titleMatch[0].length, separatorIndex).trim();
      } else {
        // No hay separador antes del primer insight, usar todo hasta el primer insight
        contentWithoutInsights = currentSlideContent.substring(titleMatch[0].length, firstInsightIndex).trim();
      }
    } else {
      // Si no hay insights, usar todo el contenido después del título
      // Pero necesitamos encontrar dónde termina este slide (siguiente slide o final)
      // IMPORTANTE: Si llegamos aquí, el slideContent ya fue procesado en reorganizePresentation
      // y debería haber sido cortado en lastInsightEndIndex, así que usamos todo el contenido restante
      const nextSlideIndex = currentSlideContent.indexOf('\n### Slide', titleMatch[0].length);
      if (nextSlideIndex > 0) {
        contentWithoutInsights = currentSlideContent.substring(titleMatch[0].length, nextSlideIndex).trim();
      } else {
        contentWithoutInsights = currentSlideContent.substring(titleMatch[0].length).trim();
      }
    }
    
    baseContent = contentWithoutInsights;
  }
  
  // Separar notas del orador del contenido
  let content = baseContent;
  let notes = '';
  
  const notesPattern = /(\*\*Notas del orador:\*\*[\s\S]*?)(?=\n---|\n###|$)/;
  const notesMatch = content.match(notesPattern);
  
  if (notesMatch) {
    const notesIndex = content.indexOf(notesMatch[1]);
    notes = notesMatch[1].trim();
    content = content.substring(0, notesIndex).trim();
  }
  
  // Construir el slide reorganizado
  // IMPORTANTE: Usar SOLO el contenido original (baseContent) y los insights extraídos
  // NO incluir nada del currentSlideContent excepto los insights
  let reorganized = title;
  
  // Añadir contenido principal (del original, sin insights)
  if (content) {
    reorganized += content;
    if (!content.endsWith('\n')) {
      reorganized += '\n';
    }
  }
  
  // Añadir notas del orador (del original)
  if (notes) {
    reorganized += '\n\n';
    reorganized += notes;
    if (!notes.endsWith('\n')) {
      reorganized += '\n';
    }
  }
  
  // Añadir todos los insights al final (extraídos del currentSlideContent)
  if (allInsights.length > 0) {
    reorganized += '\n';
    reorganized += allInsights.join('\n');
  }
  
  // No hay contenido residual porque:
  // 1. El contenido viene del original (sin insights ni contenido residual)
  // 2. Los insights se extrajeron del currentSlideContent pero no incluyen contenido residual
  // 3. No añadimos nada más del currentSlideContent
  
  return reorganized;
}

/**
 * Reorganiza la presentación completa
 */
function reorganizePresentation(currentContent: string, originalContent: string): string {
  // Dividir en slides usando un patrón más robusto que capture todo hasta el siguiente slide
  // Usar un patrón que capture desde "### Slide N" hasta el siguiente "### Slide" o el final
  const currentSlides: string[] = [];
  const slidePattern = /(### Slide \d+[\s\S]*?)(?=\n### Slide \d+|$)/g;
  let match;
  while ((match = slidePattern.exec(currentContent)) !== null) {
    let slideContent = match[1];
    
    // Remover contenido residual después de los insights
    // Si hay insights, necesitamos cortar todo el contenido residual después de ellos
    const { insights, lastInsightEndIndex } = extractInsights(slideContent);
    if (insights.length > 0 && lastInsightEndIndex > 0) {
      // IMPORTANTE: Cortar el contenido justo después del último insight usando lastInsightEndIndex
      // Esto elimina cualquier contenido residual/duplicado que pueda haber quedado después de los insights
      slideContent = slideContent.substring(0, lastInsightEndIndex).trim();
    } else if (insights.length > 0) {
      // Si no tenemos lastInsightEndIndex pero hay insights, buscar el siguiente slide como fallback
      const titleMatch = slideContent.match(/^(### Slide \d+)/);
      if (titleMatch) {
        const titleEndIndex = titleMatch[0].length;
        const nextSlideIndex = slideContent.indexOf('\n### Slide', titleEndIndex);
        
        if (nextSlideIndex > 0) {
          // Hay un siguiente slide, cortar TODO el contenido justo antes de él
          slideContent = slideContent.substring(0, nextSlideIndex).trim();
        }
      }
    }
    
    currentSlides.push(slideContent);
  }
  
  // Si no se encontraron slides con el patrón anterior, usar el método original
  if (currentSlides.length === 0) {
    const split = currentContent.split(/(?=### Slide \d+)/);
    for (const slide of split) {
      if (slide.trim() && slide.startsWith('### Slide')) {
        currentSlides.push(slide);
      }
    }
  }
  
  const originalSlides = originalContent.split(/(?=### Slide \d+)/);
  
  // Crear mapa de slides originales por número
  const originalSlidesMap = new Map<number, string>();
  for (const slide of originalSlides) {
    const numberMatch = slide.match(/^### Slide (\d+)/);
    if (numberMatch) {
      const slideNumber = parseInt(numberMatch[1], 10);
      originalSlidesMap.set(slideNumber, slide);
    }
  }
  
  const reorganizedSlides: string[] = [];
  
  // Procesar contenido antes del primer slide
  const firstSlideIndex = currentContent.indexOf('### Slide');
  if (firstSlideIndex > 0) {
    reorganizedSlides.push(currentContent.substring(0, firstSlideIndex));
  }
  
  // Procesar cada slide
  for (const slide of currentSlides) {
    if (slide.trim() && slide.startsWith('### Slide')) {
      const numberMatch = slide.match(/^### Slide (\d+)/);
      if (numberMatch) {
        const slideNumber = parseInt(numberMatch[1], 10);
        const originalSlide = originalSlidesMap.get(slideNumber) || '';
        const reorganized = reorganizeSlideWithOriginal(slideNumber, slide, originalSlide);
        reorganizedSlides.push(reorganized);
      } else {
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
  const originalPath = path.join(
    projectRoot,
    'workspaces/🧭 entre-rutas/⚙️ company-management/data/scraped-content/lo-que-aprendimos-en-el-camino-ril.md'
  );
  
  if (!fs.existsSync(presentationPath)) {
    throw new Error(`Presentation file not found: ${presentationPath}`);
  }
  
  if (!fs.existsSync(originalPath)) {
    throw new Error(`Original presentation file not found: ${originalPath}`);
  }
  
  logger.info('Reading presentations...');
  const currentContent = fs.readFileSync(presentationPath, 'utf-8');
  const originalContent = fs.readFileSync(originalPath, 'utf-8');
  
  logger.info('Reorganizing insights...');
  const reorganized = reorganizePresentation(currentContent, originalContent);
  
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

export { main, reorganizePresentation, reorganizeSlideWithOriginal };

