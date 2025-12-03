/**
 * Script para resumir cada entrevista con insights clave para la presentación
 */

import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from '../../utils/logger';
import { ChatService } from '../../services/openai/chat';
import type { ChatMessage } from '../../services/openai/types';

const logger = createLogger('SummarizeInterviews');

interface InterviewSummary {
  entrevistado: string;
  organizacion?: string;
  resumen: string;
  insights_clave: string[];
  citas_destacadas: Array<{
    texto: string;
    linea: number;
    contexto: string;
  }>;
  temas_principales: string[];
  conexion_presentacion: string; // Cómo se conecta con los temas de la presentación
}

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
 * Limpia el contenido de la transcripción removiendo las anclas HTML
 */
function cleanTranscript(content: string): string {
  // Remover las anclas HTML <span id="LXXX"></span>
  return content.replace(/<span id="L\d+"><\/span>/g, '');
}

/**
 * Extrae el nombre del entrevistado del nombre del archivo
 */
function extractIntervieweeName(fileName: string): string {
  // Formato: e1-XX-nombre-apellido-transcript.md
  const match = fileName.match(/e1-\d+-([^-]+(?:-[^-]+)*)-transcript\.md/);
  if (match) {
    const nameParts = match[1].split('-');
    return nameParts.map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' ');
  }
  return fileName.replace('-transcript.md', '').replace(/^e1-\d+-/, '');
}

/**
 * Analiza una transcripción y extrae insights clave
 */
async function analyzeInterview(
  transcriptContent: string,
  fileName: string,
  model: string = 'gpt-4o-mini'
): Promise<InterviewSummary> {
  const chat = new ChatService();
  
  const systemPrompt = `Eres un analista experto en liderazgo de impacto y ecosistemas de cambio social en Latinoamérica.
Tu tarea es analizar transcripciones de entrevistas del podcast "Entre Rutas y Horizontes" y extraer insights clave que sean relevantes para una presentación sobre liderazgo de impacto en LATAM.

IMPORTANTE: Debes responder ÚNICAMENTE con un JSON válido que siga esta estructura exacta:

{
  "entrevistado": "Nombre completo del entrevistado",
  "organizacion": "Nombre de la organización o proyecto (si se menciona)",
  "resumen": "Resumen de 3-4 párrafos de la entrevista, destacando los temas principales y la trayectoria del entrevistado",
  "insights_clave": [
    "Insight 1: Descripción clara y concisa",
    "Insight 2: Descripción clara y concisa"
  ],
  "citas_destacadas": [
    {
      "texto": "Cita textual exacta",
      "linea": número_de_línea,
      "contexto": "Breve contexto de por qué esta cita es relevante"
    }
  ],
  "temas_principales": [
    "Tema 1",
    "Tema 2"
  ],
  "conexion_presentacion": "Explicación de cómo esta entrevista se conecta con los temas de la presentación sobre liderazgo de impacto (confianza, vulnerabilidad, colaboración, propósito, etc.)"
}

REGLAS:
- Los insights deben ser específicos, accionables y relevantes para líderes de impacto
- Incluye 5-8 insights clave por entrevista
- Las citas deben ser textuales y relevantes para la presentación
- Los temas principales deben reflejar los conceptos centrales discutidos
- La conexión con la presentación debe explicar cómo esta entrevista ilustra los patrones de liderazgo de impacto
- Si un campo no aplica, usa un array vacío []
- Sé específico y evita generalidades`;

  const userPrompt = `Analiza la siguiente transcripción de entrevista del podcast "Entre Rutas y Horizontes" y extrae la información estructurada según el formato especificado.

NOMBRE DEL ARCHIVO: ${fileName}

TRANSCRIPCIÓN:
${transcriptContent}

IMPORTANTE: 
- Identifica insights que sean relevantes para una presentación sobre liderazgo de impacto en LATAM
- Enfócate en temas como: confianza, vulnerabilidad, colaboración, propósito, transformación social, ecosistemas de impacto
- Incluye citas textuales con sus números de línea exactos
- Responde ÚNICAMENTE con el JSON, sin texto adicional antes o después.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  logger.info(`Analizando ${fileName}...`);
  const response = await chat.sendMessage(messages, {
    model,
    temperature: 0.3,
    maxTokens: 3000,
    responseFormat: { type: 'json_object' },
  });

  logger.info('Respuesta recibida de OpenAI');

  // Parsear JSON
  let summary: InterviewSummary;
  try {
    let jsonText = response.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    summary = JSON.parse(jsonText);
  } catch (parseError) {
    logger.error('Error al parsear JSON de OpenAI', parseError);
    logger.error('Respuesta recibida:', response);
    throw new Error('OpenAI no devolvió un JSON válido');
  }

  return summary;
}

/**
 * Convierte el resumen a formato Markdown
 */
function summaryToMarkdown(summary: InterviewSummary, fileName: string): string {
  const lines: string[] = [];
  
  lines.push(`## ${summary.entrevistado}`);
  if (summary.organizacion) {
    lines.push(`**Organización:** ${summary.organizacion}`);
  }
  lines.push('');
  
  lines.push('### Resumen');
  lines.push(summary.resumen);
  lines.push('');
  
  lines.push('### Insights Clave');
  summary.insights_clave.forEach((insight, index) => {
    lines.push(`${index + 1}. ${insight}`);
  });
  lines.push('');
  
  lines.push('### Temas Principales');
  summary.temas_principales.forEach((tema, index) => {
    lines.push(`- ${tema}`);
  });
  lines.push('');
  
  if (summary.citas_destacadas.length > 0) {
    lines.push('### Citas Destacadas');
    summary.citas_destacadas.forEach((cita, index) => {
      lines.push(`${index + 1}. "${cita.texto}"`);
      lines.push(`   - *Contexto:* ${cita.contexto}`);
      lines.push(`   - *Línea:* [${cita.linea}](workspaces/🧭 entre-rutas/⚙️ company-management/data/scraped-content/temporada-1/${fileName}#L${cita.linea})`);
      lines.push('');
    });
  }
  
  lines.push('### Conexión con la Presentación');
  lines.push(summary.conexion_presentacion);
  lines.push('');
  lines.push('---');
  lines.push('');
  
  return lines.join('\n');
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
  
  const outputPath = path.join(
    projectRoot,
    'workspaces/🧭 entre-rutas/🚀 active-projects/taller-liderazgo-impacto-latam/resumen-entrevistas-temporada-1.md'
  );
  
  if (!fs.existsSync(transcriptsDir)) {
    throw new Error(`Transcripts directory not found: ${transcriptsDir}`);
  }
  
  logger.info('Leyendo archivos de transcripción...');
  const files = fs.readdirSync(transcriptsDir);
  const transcriptFiles = files
    .filter(file => file.endsWith('-transcript.md'))
    .sort(); // Ordenar para procesar en orden
  
  logger.info(`Encontrados ${transcriptFiles.length} archivos de transcripción`);
  
  const summaries: Array<{ summary: InterviewSummary; fileName: string }> = [];
  
  // Procesar cada archivo
  for (const file of transcriptFiles) {
    try {
      const filePath = path.join(transcriptsDir, file);
      logger.info(`\nProcesando ${file}...`);
      
      const content = fs.readFileSync(filePath, 'utf-8');
      const cleanContent = cleanTranscript(content);
      
      const summary = await analyzeInterview(cleanContent, file);
      summaries.push({ summary, fileName: file });
      
      logger.info(`✓ ${file} procesado exitosamente`);
    } catch (error) {
      logger.error(`Error procesando ${file}:`, error);
      // Continuar con el siguiente archivo
    }
  }
  
  // Generar archivo markdown con todos los resúmenes
  logger.info('\nGenerando archivo de resumen...');
  const markdownLines: string[] = [];
  
  markdownLines.push('# Resumen de Entrevistas - Temporada 1');
  markdownLines.push('');
  markdownLines.push('Este documento contiene un resumen de cada entrevista realizada en la Temporada 1 del podcast "Entre Rutas y Horizontes", con insights clave relevantes para la presentación sobre liderazgo de impacto en LATAM.');
  markdownLines.push('');
  markdownLines.push('---');
  markdownLines.push('');
  
  summaries.forEach(({ summary, fileName }) => {
    markdownLines.push(summaryToMarkdown(summary, fileName));
  });
  
  const finalContent = markdownLines.join('\n');
  fs.writeFileSync(outputPath, finalContent, 'utf-8');
  
  logger.info(`\n✓ Archivo generado exitosamente: ${outputPath}`);
  logger.info(`Total de entrevistas procesadas: ${summaries.length}`);
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(error => {
    logger.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main, analyzeInterview, summaryToMarkdown };

