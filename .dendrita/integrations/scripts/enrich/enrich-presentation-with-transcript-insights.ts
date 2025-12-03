/**
 * Script para enriquecer presentación con insights de transcripciones
 * 
 * Analiza cada transcripción de temporada-1 y añade insights relevantes
 * a los slides apropiados de la presentación.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ChatService } from '../../services/openai/chat';
import { selectModel } from '../../utils/model-selector';
import { createLogger } from '../../utils/logger';

const logger = createLogger('EnrichPresentation');

interface Quote {
  text: string;
  line_number: number;
  speaker: string;
}

interface SlideInsights {
  interpretation: string;
  quotes: Quote[];
}

interface RelevantSlide {
  slide_number: number;
  slide_title: string;
  insights: SlideInsights;
}

interface LLMResponse {
  relevant_slides: RelevantSlide[];
}

/**
 * Lee todas las transcripciones de temporada-1
 */
function getTranscriptFiles(transcriptsDir: string): string[] {
  const files = fs.readdirSync(transcriptsDir);
  return files
    .filter(file => file.endsWith('-transcript.md'))
    .map(file => path.join(transcriptsDir, file));
}

/**
 * Lee el contenido de un archivo con números de línea
 */
function readFileWithLineNumbers(filePath: string): { content: string; lines: string[] } {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  return { content, lines };
}

/**
 * Extrae los slides de la presentación (excluyendo introductorios 1-6)
 */
function extractSlides(presentationContent: string): Array<{ number: number; title: string; content: string }> {
  const slides: Array<{ number: number; title: string; content: string }> = [];
  const lines = presentationContent.split('\n');
  
  let currentSlide: { number: number; title: string; content: string } | null = null;
  let slideNumber = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detectar inicio de slide
    if (line.match(/^### Slide \d+$/)) {
      const match = line.match(/^### Slide (\d+)$/);
      if (match) {
        slideNumber = parseInt(match[1], 10);
        
        // Guardar slide anterior si existe
        if (currentSlide && slideNumber > 6) {
          slides.push(currentSlide);
        }
        
        // Iniciar nuevo slide solo si es > 6
        if (slideNumber > 6) {
          currentSlide = {
            number: slideNumber,
            title: '',
            content: ''
          };
        } else {
          currentSlide = null;
        }
      }
    } else if (currentSlide) {
      // Capturar título (líneas que empiezan con #### o texto destacado)
      if (line.match(/^#### /)) {
        currentSlide.title = line.replace(/^#### /, '').trim();
      } else if (line.trim() && !currentSlide.title && !line.startsWith('---')) {
        // Si no hay título con ####, usar primera línea de contenido como título
        if (!currentSlide.title) {
          currentSlide.title = line.trim();
        }
      }
      
      // Acumular contenido hasta el siguiente slide o sección
      if (line.trim() && !line.match(/^### Slide/)) {
        currentSlide.content += line + '\n';
      }
    }
  }
  
  // Agregar último slide si existe
  if (currentSlide && currentSlide.number > 6) {
    slides.push(currentSlide);
  }
  
  return slides;
}

/**
 * Construye el prompt para el LLM
 */
function buildPrompt(transcriptContent: string, transcriptLines: string[], slides: Array<{ number: number; title: string; content: string }>, transcriptFileName: string): string {
  const slidesText = slides.map(slide => 
    `Slide ${slide.number}: ${slide.title}\n${slide.content.substring(0, 500)}...`
  ).join('\n\n---\n\n');
  
  const transcriptWithLineNumbers = transcriptLines
    .map((line, index) => `${index + 1}: ${line}`)
    .join('\n');
  
  return `Analiza la siguiente transcripción de una entrevista del podcast Entre Rutas y Horizontes y identifica qué slides de la presentación "Lo que aprendimos en el camino" son relevantes para enriquecer con insights de esta entrevista.

IMPORTANTE:
- Solo identifica slides que mencionan conceptos o ideas específicas (excluye slides introductorios 1-6)
- Para cada slide relevante, proporciona una interpretación de 2-3 párrafos sobre cómo esta entrevista enriquece el concepto
- Incluye 1-3 citas específicas con números de línea exactos de la transcripción
- Las citas deben ser relevantes y enriquecer el concepto del slide
- Los números de línea deben corresponder exactamente a las líneas numeradas del transcript

FORMATO DE RESPUESTA (JSON válido):
{
  "relevant_slides": [
    {
      "slide_number": 7,
      "slide_title": "Título del slide",
      "insights": {
        "interpretation": "Interpretación de 2-3 párrafos sobre cómo esta entrevista enriquece el concepto...",
        "quotes": [
          {
            "text": "Texto exacto de la cita de la transcripción",
            "line_number": 123,
            "speaker": "Nombre del speaker"
          }
        ]
      }
    }
  ]
}

TRANSCRIPCIÓN (con números de línea):
${transcriptWithLineNumbers}

SLIDES DE LA PRESENTACIÓN (solo slides con conceptos, > 6):
${slidesText}

Responde ÚNICAMENTE con un JSON válido, sin texto adicional antes o después.`;
}

/**
 * Parsea la respuesta del LLM
 */
function parseLLMResponse(response: string): LLMResponse {
  try {
    // Intentar extraer JSON de la respuesta
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(response);
  } catch (error) {
    logger.error('Error parsing LLM response:', error);
    logger.error('Response was:', response);
    throw new Error('Failed to parse LLM response as JSON');
  }
}

/**
 * Integra insights en la presentación
 */
function integrateInsights(
  presentationContent: string,
  insights: LLMResponse,
  transcriptFileName: string,
  transcriptPath: string,
  presentationPath: string
): string {
  let result = presentationContent;
  const presentationDir = path.dirname(presentationPath);
  const relativePath = path.relative(presentationDir, transcriptPath).replace(/\\/g, '/');
  
  // Procesar cada slide con insights, en orden inverso para mantener índices correctos
  const sortedSlides = [...insights.relevant_slides].sort((a, b) => b.slide_number - a.slide_number);
  
  for (const slideData of sortedSlides) {
    const slideNumber = slideData.slide_number;
    // Patrón más robusto para encontrar el slide completo
    const slidePattern = new RegExp(`(### Slide ${slideNumber}[\\s\\S]*?)(?=\n### Slide|$)`, 'm');
    const match = result.match(slidePattern);
    
    if (match) {
      const slideContent = match[1];
      
      // Crear sección de insights para este slide
      const quotesText = slideData.insights.quotes.map(q => 
        `- "${q.text}" — ${q.speaker} ([link a línea](${relativePath}#L${q.line_number}))`
      ).join('\n');
      
      const newInsightsSection = `\n\n---\n\n**Insights de las entrevistas:**\n\n> ${slideData.insights.interpretation}\n\n**Citas relevantes:**\n${quotesText}\n`;
      
      // Verificar si ya hay una sección de insights
      const hasInsights = slideContent.includes('**Insights de las entrevistas:**');
      
      if (hasInsights) {
        // Añadir nuevos insights después de los existentes
        // Buscar el último "---" antes del siguiente slide o final
        const lastInsightsIndex = slideContent.lastIndexOf('**Insights de las entrevistas:**');
        if (lastInsightsIndex !== -1) {
          // Encontrar el final de la última sección de insights
          const afterLastInsights = slideContent.substring(lastInsightsIndex);
          const nextSectionMatch = afterLastInsights.match(/\n\n---\n\n(?=\*\*|###|$)/);
          const insertIndex = nextSectionMatch 
            ? lastInsightsIndex + nextSectionMatch.index! + nextSectionMatch[0].length
            : slideContent.length;
          
          const beforeInsert = slideContent.substring(0, insertIndex);
          const afterInsert = slideContent.substring(insertIndex);
          const newSlideContent = beforeInsert + newInsightsSection + afterInsert;
          result = result.replace(slidePattern, newSlideContent);
        } else {
          // Fallback: añadir al final del slide
          const newSlideContent = slideContent.trim() + newInsightsSection;
          result = result.replace(slidePattern, newSlideContent);
        }
      } else {
        // Crear nueva sección de insights
        // Insertar después de "Notas del orador" si existe, o al final del slide
        if (slideContent.includes('**Notas del orador:**')) {
          const notesPattern = /(\*\*Notas del orador:\*\*[\s\S]*?)(?=\n---|\n###|$)/;
          const notesMatch = slideContent.match(notesPattern);
          if (notesMatch) {
            const newSlideContent = slideContent.replace(notesPattern, notesMatch[1] + newInsightsSection);
            result = result.replace(slidePattern, newSlideContent);
          } else {
            const newSlideContent = slideContent.trim() + newInsightsSection;
            result = result.replace(slidePattern, newSlideContent);
          }
        } else {
          // Añadir al final del contenido del slide
          const newSlideContent = slideContent.trim() + newInsightsSection;
          result = result.replace(slidePattern, newSlideContent);
        }
      }
    } else {
      logger.warn(`Slide ${slideNumber} not found in presentation`);
    }
  }
  
  return result;
}

/**
 * Procesa una transcripción y enriquece la presentación
 */
async function processTranscript(
  transcriptPath: string,
  presentationPath: string,
  slides: Array<{ number: number; title: string; content: string }>
): Promise<string> {
  logger.info(`Processing transcript: ${path.basename(transcriptPath)}`);
  
  // Leer transcripción
  const { content: transcriptContent, lines: transcriptLines } = readFileWithLineNumbers(transcriptPath);
  const transcriptFileName = path.basename(transcriptPath);
  
  // Leer presentación actual
  let presentationContent = fs.readFileSync(presentationPath, 'utf-8');
  
  // Configurar LLM
  const chatService = new ChatService();
  if (!chatService.isConfigured()) {
    throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY in .env.local');
  }
  
  const model = selectModel('standard-processing');
  logger.info(`Using model: ${model}`);
  
  // Construir prompt
  const userPrompt = buildPrompt(transcriptContent, transcriptLines, slides, transcriptFileName);
  
  // Llamar al LLM
  logger.info('Calling LLM...');
  const response = await chatService.sendMessage(
    [
      {
        role: 'system',
        content: `Eres un experto en análisis de contenido y extracción de insights. Analiza la transcripción de una entrevista del podcast Entre Rutas y Horizontes y identifica qué slides de la presentación "Lo que aprendimos en el camino" son relevantes para enriquecer con insights de esta entrevista.

IMPORTANTE:
- Solo identifica slides que mencionan conceptos o ideas específicas (excluye slides introductorios 1-6)
- Para cada slide relevante, proporciona una interpretación de 2-3 párrafos sobre cómo esta entrevista enriquece el concepto
- Incluye 1-3 citas específicas con números de línea exactos de la transcripción
- Las citas deben ser relevantes y enriquecer el concepto del slide
- Responde ÚNICAMENTE con un JSON válido, sin texto adicional`
      },
      {
        role: 'user',
        content: userPrompt
      }
    ],
    {
      model,
      temperature: 0.7,
      maxTokens: 4000,
      responseFormat: { type: 'json_object' }
    }
  );
  
  // Parsear respuesta
  const insights = parseLLMResponse(response);
  logger.info(`Found ${insights.relevant_slides.length} relevant slides`);
  
  // Integrar insights
  presentationContent = integrateInsights(presentationContent, insights, transcriptFileName, transcriptPath, presentationPath);
  
  return presentationContent;
}

/**
 * Encuentra el directorio raíz del proyecto
 */
function findProjectRoot(): string {
  let currentDir = process.cwd();
  
  // Buscar hacia arriba hasta encontrar .dendrita/ o package.json en el raíz
  while (currentDir !== path.dirname(currentDir)) {
    const dendritaPath = path.join(currentDir, '.dendrita');
    const packageJsonPath = path.join(currentDir, 'package.json');
    
    if (fs.existsSync(dendritaPath) || fs.existsSync(packageJsonPath)) {
      // Verificar que también tenga workspaces/
      const workspacesPath = path.join(currentDir, 'workspaces');
      if (fs.existsSync(workspacesPath)) {
        return currentDir;
      }
    }
    
    currentDir = path.dirname(currentDir);
  }
  
  // Fallback: usar process.cwd()
  return process.cwd();
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
  const presentationPath = path.join(
    projectRoot,
    'workspaces/🧭 entre-rutas/🚀 active-projects/taller-liderazgo-impacto-latam/lo-que-aprendimos-en-el-camino-ril.md'
  );
  
  // Verificar que los directorios existen
  if (!fs.existsSync(transcriptsDir)) {
    throw new Error(`Transcripts directory not found: ${transcriptsDir}`);
  }
  
  if (!fs.existsSync(presentationPath)) {
    throw new Error(`Presentation file not found: ${presentationPath}`);
  }
  
  // Leer presentación y extraer slides
  const presentationContent = fs.readFileSync(presentationPath, 'utf-8');
  const slides = extractSlides(presentationContent);
  logger.info(`Found ${slides.length} slides to analyze (excluding intro slides 1-6)`);
  
  // Obtener lista de transcripciones
  const transcriptFiles = getTranscriptFiles(transcriptsDir);
  logger.info(`Found ${transcriptFiles.length} transcript files`);
  
  // Procesar cada transcripción
  let enrichedPresentation = presentationContent;
  let currentSlides = slides;
  
  for (const transcriptPath of transcriptFiles) {
    try {
      logger.info(`\n=== Processing ${path.basename(transcriptPath)} ===`);
      enrichedPresentation = await processTranscript(transcriptPath, presentationPath, currentSlides);
      
      // Actualizar slides después de cada procesamiento para reflejar cambios
      currentSlides = extractSlides(enrichedPresentation);
      
      // Guardar temporalmente para siguiente iteración
      fs.writeFileSync(presentationPath, enrichedPresentation, 'utf-8');
      logger.info(`✓ Completed ${path.basename(transcriptPath)}`);
    } catch (error) {
      logger.error(`Error processing ${path.basename(transcriptPath)}:`, error);
      // Continuar con siguiente transcripción
    }
  }
  
  // Guardar presentación enriquecida final (ya está guardada, pero por seguridad)
  fs.writeFileSync(presentationPath, enrichedPresentation, 'utf-8');
  logger.info('\n✓ Presentation enriched successfully!');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(error => {
    logger.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main, processTranscript, extractSlides, integrateInsights };

