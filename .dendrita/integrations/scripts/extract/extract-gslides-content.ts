/**
 * Script para extraer contenido de un Google Slides en formato Markdown
 * Utiliza la exportación de Google Drive API y procesa el texto para
 * identificar diapositivas con separadores claros y metadatos
 */

import { DriveService } from '../../services/google/drive';
import { credentials } from '../../utils/credentials';
import { createLogger } from '../../utils/logger';
// No importamos generateScrapeSignature ni insertSignature porque la información ya está en el frontmatter
import { trackFileModification } from '../../utils/file-tracking';
import { updateBacklinksFromContent } from '../../utils/backlinks';
import { generateFrontmatter } from '../../utils/frontmatter-generator';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('ExtractGSlidesContent');

/**
 * Extrae texto del HTML y detecta diapositivas por elementos HTML
 */
function extractTextFromHtml(html: string): string {
  // Buscar elementos que indican diapositivas en el HTML de Google Slides
  // Google Slides usa clases como "slide" o elementos específicos
  const slideMatches = html.match(/<div[^>]*class="[^"]*slide[^"]*"[^>]*>/gi) || 
                       html.match(/<section[^>]*class="[^"]*slide[^"]*"[^>]*>/gi) ||
                       html.match(/<div[^>]*data-slide[^>]*>/gi);
  
  if (slideMatches && slideMatches.length > 0) {
    logger.info(`Detectadas ${slideMatches.length} diapositivas en HTML`);
    // Extraer texto de cada sección de slide
    const slides: string[] = [];
    let currentIndex = 0;
    
    for (let i = 0; i < slideMatches.length; i++) {
      const slideStart = html.indexOf(slideMatches[i], currentIndex);
      const nextSlideStart = i < slideMatches.length - 1 
        ? html.indexOf(slideMatches[i + 1], slideStart + slideMatches[i].length)
        : html.length;
      
      const slideHtml = html.substring(slideStart, nextSlideStart);
      // Extraer solo texto, removiendo tags HTML
      const slideText = slideHtml
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, '\n')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      
      if (slideText.length > 0) {
        slides.push(slideText);
      }
      currentIndex = nextSlideStart;
    }
    
    return slides.join('\n\n---SLIDE_SEPARATOR---\n\n');
  }
  
  // Si no se encontraron slides en HTML, extraer todo el texto
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Detecta títulos de secciones/capítulos temáticos
 */
function isSectionHeader(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed.length > 10 &&
    trimmed === trimmed.toUpperCase() &&
    !!trimmed.match(/^[A-Z\s]+$/) &&
    !trimmed.match(/^(PASO|Y|EL|LA|LOS|LAS|UN|UNA|DE|DEL|EN|CON|PARA|POR|QUE|QUÉ)/i)
  );
}

/**
 * Detecta si una línea indica inicio de nueva diapositiva individual
 */
function isSlideBreak(
  line: string,
  prevLine: string,
  nextLine: string,
  emptyLineCount: number,
  currentSlideLength: number
): boolean {
  const trimmed = line.trim();
  
  // Múltiples líneas vacías (2 o más) seguidos de contenido
  if (trimmed.length === 0 && emptyLineCount >= 2 && nextLine.length > 0 && currentSlideLength > 0) {
    return true;
  }
  
  // Títulos en mayúsculas que no son secciones (más cortos)
  if (trimmed.length > 0 && trimmed.length < 60 && trimmed === trimmed.toUpperCase() && 
      !!trimmed.match(/^[A-Z\s]+$/) && prevLine.length > 30 && currentSlideLength > 3) {
    return true;
  }
  
  // Patrones específicos que indican nueva slide
  if (!!trimmed.match(/^(PASO \d+|PREGUNTAS PARA|SEGUNDA TEMPORADA|PRIMERA TEMPORADA)/i) && 
      currentSlideLength > 5) {
    return true;
  }
  
  // Cambios bruscos: línea corta después de párrafo largo
  if (trimmed.length < 50 && trimmed.length > 0 && prevLine.length > 80 && 
      currentSlideLength > 5 && !trimmed.match(/^["']/)) {
    // Puede ser inicio de nueva slide, pero verificar contexto
    return false; // Será manejado por otras heurísticas
  }
  
  return false;
}

/**
 * Convierte el texto plano de Google Slides a formato Markdown estructurado
 * con separadores claros entre diapositivas y agrupación por secciones
 */
function convertSlidesToMarkdown(
  text: string,
  title: string
): string {
  let markdown = '';
  
  // Agregar título
  markdown += `# ${title}\n\n`;
  
  // Dividir el texto en líneas
  const lines = text.split('\n');
  
  // Primero, detectar todas las diapositivas individuales
  const allSlides: string[][] = [];
  let currentSlide: string[] = [];
  let emptyLineCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const prevLine = i > 0 ? lines[i - 1].trim() : '';
    const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
    
    if (trimmed.length === 0) {
      emptyLineCount++;
      // Si hay 2+ líneas vacías y tenemos contenido, es probable separador de slide
      if (emptyLineCount >= 2 && currentSlide.length > 0) {
        allSlides.push([...currentSlide]);
        currentSlide = [];
        emptyLineCount = 0;
        continue;
      }
      if (currentSlide.length > 0) {
        currentSlide.push('');
      }
    } else {
      emptyLineCount = 0;
      
      // Detectar si es inicio de nueva slide
      if (isSlideBreak(trimmed, prevLine, nextLine, emptyLineCount, currentSlide.length) && 
          currentSlide.length > 0) {
        allSlides.push([...currentSlide]);
        currentSlide = [trimmed];
      } else {
        currentSlide.push(trimmed);
      }
    }
  }
  
  // Agregar última diapositiva
  if (currentSlide.length > 0) {
    allSlides.push(currentSlide);
  }
  
  // Si detectamos muy pocas slides, usar heurística más agresiva
  if (allSlides.length < 33) {
    // Verificar si hay separadores especiales del HTML
    if (text.includes('---SLIDE_SEPARATOR---')) {
      const slideParts = text.split('---SLIDE_SEPARATOR---');
      allSlides.length = 0;
      slideParts.forEach(part => {
        const slideLines = part.split('\n').filter(l => l.trim().length > 0);
        if (slideLines.length > 0) {
          allSlides.push(slideLines);
        }
      });
    } else {
      // Dividir por líneas vacías dobles más agresivamente
      allSlides.length = 0;
      currentSlide = [];
      let consecutiveEmpty = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        if (trimmed.length === 0) {
          consecutiveEmpty++;
          // Cualquier línea vacía puede ser separador si hay contenido previo
          if (consecutiveEmpty >= 1 && currentSlide.length > 2) {
            allSlides.push([...currentSlide]);
            currentSlide = [];
            consecutiveEmpty = 0;
            continue;
          }
          if (currentSlide.length > 0) {
            currentSlide.push('');
          }
        } else {
          consecutiveEmpty = 0;
          
          // Detectar separadores: línea vacía anterior + línea que parece título o inicio
          const hasEmptyBefore = i > 0 && lines[i - 1].trim().length === 0;
          const isTitleLike = trimmed.length < 100 && (
            trimmed === trimmed.toUpperCase() ||
            !!trimmed.match(/^(PASO|PREGUNTAS|TEMPORADA|APRENDIZAJES|TENSIONES|PATRONES|EL|LA|LOS|LAS|UN|UNA)/i) ||
            trimmed.match(/^["']/) // Citas al inicio
          );
          
          // Si hay línea vacía antes y parece título, y tenemos contenido suficiente, nueva slide
          if (hasEmptyBefore && isTitleLike && currentSlide.length > 1) {
            allSlides.push([...currentSlide]);
            currentSlide = [trimmed];
          } else if (hasEmptyBefore && currentSlide.length > 5 && trimmed.length < 100) {
            // También separar si hay línea vacía antes y la línea es relativamente corta
            // (puede ser inicio de nueva slide incluso sin ser título)
            allSlides.push([...currentSlide]);
            currentSlide = [trimmed];
          } else {
            currentSlide.push(trimmed);
          }
        }
      }
      
      if (currentSlide.length > 0) {
        allSlides.push(currentSlide);
      }
    }
  }
  
  // Ahora agrupar slides en secciones temáticas
  const sections: Array<{ title: string; slides: string[][] }> = [];
  let currentSection: { title: string; slides: string[][] } | null = null;
  
  for (let i = 0; i < allSlides.length; i++) {
    const slide = allSlides[i];
    const firstLine = slide.find(l => l.trim().length > 0) || '';
    
    // Detectar si el slide es un encabezado de sección
    if (isSectionHeader(firstLine) && slide.length <= 3) {
      // Finalizar sección anterior
      if (currentSection && currentSection.slides.length > 0) {
        sections.push(currentSection);
      }
      // Iniciar nueva sección
      currentSection = {
        title: firstLine,
        slides: []
      };
    } else {
      // Agregar slide a la sección actual
      if (!currentSection) {
        // Si no hay sección, crear una genérica
        currentSection = {
          title: 'Introducción',
          slides: []
        };
      }
      currentSection.slides.push(slide);
    }
  }
  
  // Agregar última sección
  if (currentSection && currentSection.slides.length > 0) {
    sections.push(currentSection);
  }
  
  // Generar markdown con estructura jerárquica
  let globalSlideNumber = 1;
  
  for (let sectionIdx = 0; sectionIdx < sections.length; sectionIdx++) {
    const section = sections[sectionIdx];
    
    // Separador entre secciones (excepto antes de la primera)
    if (sectionIdx > 0) {
      markdown += '\n---\n\n';
    }
    
    // Encabezado de sección
    markdown += `## ${section.title}\n\n`;
    
    // Slides de la sección
    for (let slideIdx = 0; slideIdx < section.slides.length; slideIdx++) {
      const slide = section.slides[slideIdx];
      
      // Encabezado de slide individual
      markdown += `### Slide ${globalSlideNumber}\n\n`;
      
      // Contenido formateado
      markdown += formatSlideContent(slide);
      
      globalSlideNumber++;
    }
  }
  
  logger.info(`Procesadas ${globalSlideNumber - 1} diapositivas en ${sections.length} secciones`);
  
  return markdown.trim();
}

/**
 * Detecta si una línea o bloque podría ser nota del orador
 */
function isLikelySpeakerNote(line: string, context: { isLastInSlide: boolean; lineIndex: number; totalLines: number; allLines: string[] }): boolean {
  const trimmed = line.trim();
  
  // Las notas suelen ser:
  // 1. Citas largas (contienen comillas y son párrafos largos)
  const hasQuotes = trimmed.includes('"') || trimmed.includes("'");
  
  // Si es una cita muy larga (más de 100 caracteres), definitivamente es nota
  if (hasQuotes && trimmed.length > 100) {
    return true;
  }
  
  // Verificar si hay un título antes (líneas en mayúsculas cortas o títulos formateados)
  const hasTitleBefore = context.lineIndex > 0 && context.allLines.slice(0, context.lineIndex).some(l => {
    const t = l.trim();
    return (t.length < 50 && t === t.toUpperCase() && t.match(/^[A-Z\s]+$/)) ||
           (t.length < 100 && (t === t.toUpperCase() || t.match(/^[A-Z][^.!?]*$/)));
  });
  
  // Si hay título antes y la cita es larga (más de 50 caracteres), probablemente es nota
  if (hasQuotes && hasTitleBefore && trimmed.length > 50) {
    return true;
  }
  
  // Citas de longitud media que están al final de la diapositiva
  if (hasQuotes && context.isLastInSlide && trimmed.length > 50) {
    return true;
  }
  
  // Si hay múltiples citas en la diapositiva (más de una), todas después del título son notas
  if (hasQuotes && hasTitleBefore) {
    const otherQuotes = context.allLines.filter(l => {
      const t = l.trim();
      return (t.includes('"') || t.includes("'")) && t.length > 50;
    });
    if (otherQuotes.length > 1) {
      return true;
    }
  }
  
  // 2. Párrafos largos al final de la diapositiva (últimas líneas, sin comillas)
  if (!hasQuotes && context.isLastInSlide && trimmed.length > 80 && !trimmed.match(/^[A-Z\s]{10,}$/)) {
    return true;
  }
  
  // 4. Texto narrativo largo que parece explicación (no título ni bullet)
  if (trimmed.length > 60 && 
      !trimmed.match(/^[A-Z\s]{10,}$/) && 
      !trimmed.match(/^[-*•]\s/) &&
      trimmed.includes('.') &&
      context.lineIndex > context.totalLines * 0.5) {
    return true;
  }
  
  return false;
}

/**
 * Formatea el contenido de una diapositiva separando contenido de notas
 */
function formatSlideContent(content: string[]): string {
  let formatted = '';
  let lastWasTitle = false;
  let speakerNotes: string[] = [];
  let slideContent: string[] = [];
  
  // Identificar el primer título para saber qué viene después
  let firstTitleIndex = -1;
  for (let i = 0; i < content.length; i++) {
    const trimmed = content[i].trim();
    if (trimmed.length > 0 && trimmed.length < 100 && 
        (trimmed === trimmed.toUpperCase() || trimmed.match(/^[A-Z][^.!?]*$/))) {
      firstTitleIndex = i;
      break;
    }
  }
  
  // Identificar todas las citas en la diapositiva
  const allQuotes: Array<{ index: number; text: string }> = [];
  for (let i = 0; i < content.length; i++) {
    const trimmed = content[i].trim();
    if (trimmed.length > 0 && (trimmed.includes('"') || trimmed.includes("'")) && trimmed.length > 50) {
      allQuotes.push({ index: i, text: trimmed });
    }
  }
  
  // Si hay múltiples citas, todas después de la primera línea no vacía son notas
  const hasMultipleQuotes = allQuotes.length > 1;
  
  // Separar contenido de notas
  for (let i = 0; i < content.length; i++) {
    const line = content[i];
    const trimmed = line.trim();
    const isLast = i === content.length - 1;
    
    if (trimmed.length === 0) {
      slideContent.push(line);
      continue;
    }
    
    const context = {
      isLastInSlide: isLast,
      lineIndex: i,
      totalLines: content.length,
      allLines: content
    };
    
    const isQuote = trimmed.includes('"') || trimmed.includes("'");
    
    // PRIORIDAD 1: Si es una cita muy larga (más de 100 caracteres), siempre es nota
    if (isQuote && trimmed.length > 100) {
      speakerNotes.push(trimmed);
      continue;
    }
    
    // PRIORIDAD 2: Si hay múltiples citas en la diapositiva, todas son notas
    // (esto es común en slides donde las citas son notas del orador)
    if (hasMultipleQuotes && isQuote && trimmed.length > 50) {
      speakerNotes.push(trimmed);
      continue;
    }
    
    // PRIORIDAD 3: Si es una cita después de un título, es nota
    // (las citas después de títulos suelen ser notas del orador)
    if (isQuote && trimmed.length > 50 && firstTitleIndex >= 0 && i > firstTitleIndex) {
      speakerNotes.push(trimmed);
      continue;
    }
    
    // PRIORIDAD 4: Otras heurísticas
    if (isLikelySpeakerNote(trimmed, context)) {
      speakerNotes.push(trimmed);
      continue;
    }
    
    // Si no es nota, es contenido
    slideContent.push(line);
  }
  
  // Formatear contenido principal
  for (const line of slideContent) {
    const trimmed = line.trim();
    
    if (trimmed.length === 0) {
      if (!lastWasTitle) {
        formatted += '\n';
      }
      lastWasTitle = false;
      continue;
    }
    
    // Detectar títulos (líneas cortas en mayúsculas o con formato especial)
    const isTitle = 
      trimmed.length < 100 && (
        trimmed === trimmed.toUpperCase() ||
        trimmed.match(/^[A-Z][^.!?]*$/) ||
        trimmed.match(/^[A-Z][A-Z\s]{5,}$/)
      );
    
    if (isTitle && !lastWasTitle) {
      formatted += `#### ${trimmed}\n\n`;
      lastWasTitle = true;
    } else {
      formatted += `${trimmed}\n\n`;
      lastWasTitle = false;
    }
  }
  
  // Agregar notas del orador al final si existen
  if (speakerNotes.length > 0) {
    formatted += '\n---\n\n';
    formatted += '**Notas del orador:**\n\n';
    for (const note of speakerNotes) {
      formatted += `> ${note}\n\n`;
    }
  }
  
  return formatted;
}

async function extractGSlidesContent(fileId: string, outputPath: string) {
  try {
    if (!credentials.hasGoogleWorkspace()) {
      logger.error('Google Workspace no está configurado');
      return;
    }

    const drive = new DriveService();
    await drive.authenticate();
    
    // Obtener access token del drive service
    const accessToken = (drive as any).accessToken;
    
    if (!accessToken) {
      logger.error('No se pudo obtener access token');
      return;
    }

    // Obtener metadatos del archivo
    let title = 'Presentación';
    let fileMetadata: any = null;
    try {
      fileMetadata = await drive.getFile(fileId);
      if (fileMetadata.name) {
        title = fileMetadata.name;
      }
    } catch (error) {
      logger.warn('No se pudo obtener el título del archivo, usando título por defecto');
    }

    // Intentar exportar como HTML primero (tiene mejor estructura para detectar slides)
    logger.info('Exportando presentación como HTML para mejor detección de diapositivas...');
    let text = '';
    let useHtml = true;
    
    try {
      const htmlExportUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export?mimeType=text/html`;
      const htmlResponse = await fetch(htmlExportUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (htmlResponse.ok) {
        const html = await htmlResponse.text();
        // Extraer texto del HTML y detectar diapositivas por elementos HTML
        text = extractTextFromHtml(html);
        logger.info('Extracción desde HTML completada');
      } else {
        useHtml = false;
      }
    } catch (error) {
      logger.warn('No se pudo exportar como HTML, usando texto plano');
      useHtml = false;
    }

    // Si HTML falló, usar texto plano
    if (!useHtml || !text) {
      logger.info('Exportando presentación como texto plano...');
      const exportUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export?mimeType=text/plain`;
      const response = await fetch(exportUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google Drive API export error: ${response.status} - ${errorText}`);
      }

      // El contenido viene como texto plano
      text = await response.text();
    }
    
    // Convertir a Markdown con estructura completa y separadores
    const markdown = convertSlidesToMarkdown(text, title);

    // Generar frontmatter
    const extractedAt = new Date().toISOString();
    const frontmatter = await generateFrontmatter(
      {
        title: title,
        fileId: fileId,
        fileType: 'google-slides',
        webViewLink: fileMetadata?.webViewLink,
        webContentLink: fileMetadata?.webContentLink,
        createdTime: fileMetadata?.createdTime,
        modifiedTime: fileMetadata?.modifiedTime,
        extractedAt: extractedAt,
        owners: fileMetadata?.owners,
        shared: fileMetadata?.shared,
        size: fileMetadata?.size,
        mimeType: fileMetadata?.mimeType,
        parents: fileMetadata?.parents,
      },
      drive
    );

    // Combinar frontmatter y contenido
    // No agregamos firma de scraping porque la información ya está en el frontmatter
    const contentWithFrontmatter = `${frontmatter}\n\n${markdown}`;

    // Asegurar que el archivo tenga extensión .md (si no la tiene, agregarla)
    let finalOutputPath = outputPath;
    if (!finalOutputPath.endsWith('.md')) {
      finalOutputPath = finalOutputPath + '.md';
      logger.info(`Extensión .md agregada al archivo de salida: ${finalOutputPath}`);
    }

    // Crear directorio si no existe
    const dir = path.dirname(finalOutputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // No agregamos firma de scraping porque la información ya está en el frontmatter
    const textWithSignature = contentWithFrontmatter;
    
    // Trackear modificación antes de escribir
    const scriptPath = __filename;
    const sourceFiles: string[] = [`Google Slides: ${fileId}`];
    trackFileModification(scriptPath, finalOutputPath, sourceFiles, 'extract-gslides-content', {
      source: `Google Slides: ${fileId}`,
    });

    // Guardar contenido en formato Markdown
    fs.writeFileSync(finalOutputPath, textWithSignature, 'utf-8');
    logger.info(`Contenido extraído y guardado en formato Markdown: ${finalOutputPath}`);
    logger.info(`Tamaño: ${textWithSignature.length} caracteres`);

    // Actualizar backlinks
    await updateBacklinksFromContent(finalOutputPath);

    return textWithSignature;
  } catch (error: any) {
    logger.error('Error al extraer contenido del Google Slides', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const fileId = process.argv[2];
  const outputPath = process.argv[3];

  if (!fileId || !outputPath) {
    console.error('Uso: ts-node extract-gslides-content.ts <fileId> <outputPath>');
    process.exit(1);
  }

  extractGSlidesContent(fileId, outputPath)
    .then(() => {
      logger.info('Extracción completada');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Error fatal', error);
      process.exit(1);
    });
}

export { extractGSlidesContent };

