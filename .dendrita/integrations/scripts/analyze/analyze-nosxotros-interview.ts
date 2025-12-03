#!/usr/bin/env npx ts-node
/**
 * Script para analizar transcripciones de entrevistas del proyecto ennui-x-NOSxOTROS
 * 
 * Analiza cada transcripción individualmente usando LLM y genera un análisis estructurado
 * enfocado en identificar necesidades, desafíos, brechas de capacidad y recomendaciones de servicios.
 */

import { ChatService, ChatMessage } from '../../services/openai/chat';
import { createLogger } from '../../utils/logger';
import { selectModel } from '../../utils/model-selector';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('AnalyzeNOSxOTROSInterview');

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

const PROJECT_ROOT = findProjectRoot();
const PROJECT_PATH = path.join(PROJECT_ROOT, 'workspaces', '🌱 ennui', '🚀 active-projects', 'ennui-x-NOSxOTROS');

/**
 * Estructura del análisis de entrevista
 */
interface InterviewAnalysis {
  entrevistado: string;
  fecha: string;
  tipo_organizacion: string;
  contexto_organizacional: {
    años_operacion?: number;
    tamaño_equipo: string;
    modelo_negocio: string;
    alcance_geografico: string;
    sector_impacto?: string;
  };
  necesidades: Array<{
    categoria: string;
    descripcion: string;
    urgencia: 'alta' | 'media' | 'baja';
    citas_relevantes?: string[];
  }>;
  desafios: Array<{
    desafio: string;
    descripcion: string;
    impacto: 'alto' | 'medio' | 'bajo';
  }>;
  brechas_capacidad: string[];
  recomendaciones_servicios: Array<{
    tipo: 'mini-curso' | 'taller' | 'mentoria' | 'consultoria';
    tema: string;
    justificacion: string;
    urgencia: 'alta' | 'media' | 'baja';
  }>;
  insights_clave: string[];
  citas_destacadas: string[];
}

/**
 * Analiza una transcripción de entrevista
 */
async function analyzeInterview(
  transcriptText: string,
  transcriptFileName: string
): Promise<InterviewAnalysis> {
  const chat = new ChatService();

  if (!chat.isConfigured()) {
    throw new Error('OpenAI not configured. Set OPENAI_API_KEY in .env.local');
  }

  const model = selectModel('complex-analysis'); // gpt-4-turbo
  logger.info(`Analizando entrevista con ${model}...`);

  const systemPrompt = `Eres un analista experto en organizaciones de impacto social y fortalecimiento institucional.
Tu tarea es analizar transcripciones de entrevistas con organizaciones del ecosistema de impacto de Arequipa.

IMPORTANTE: Debes responder ÚNICAMENTE con un JSON válido que siga esta estructura exacta:

{
  "entrevistado": "Nombre completo del entrevistado",
  "fecha": "Fecha de la entrevista (YYYY-MM-DD si se menciona)",
  "tipo_organizacion": "ONG | Emprendimiento Social | Organización Estatal | Voluntariado | Red/Alianza | Otro",
  "contexto_organizacional": {
    "años_operacion": número o null,
    "tamaño_equipo": "descripción del tamaño",
    "modelo_negocio": "descripción del modelo de ingresos/sostenibilidad",
    "alcance_geografico": "Local | Regional | Nacional | Internacional",
    "sector_impacto": "Educación | Medio Ambiente | Inclusión Social | etc."
  },
  "necesidades": [
    {
      "categoria": "Financiamiento | Capacitación | Tecnología | Alianzas | Otro",
      "descripcion": "Descripción detallada de la necesidad",
      "urgencia": "alta | media | baja",
      "citas_relevantes": ["cita 1", "cita 2"]
    }
  ],
  "desafios": [
    {
      "desafio": "Título del desafío",
      "descripcion": "Descripción detallada",
      "impacto": "alto | medio | bajo"
    }
  ],
  "brechas_capacidad": [
    "Brecha 1: descripción",
    "Brecha 2: descripción"
  ],
  "recomendaciones_servicios": [
    {
      "tipo": "mini-curso | taller | mentoria | consultoria",
      "tema": "Tema específico del servicio",
      "justificacion": "Por qué este servicio sería útil",
      "urgencia": "alta | media | baja"
    }
  ],
  "insights_clave": [
    "Insight 1",
    "Insight 2"
  ],
  "citas_destacadas": [
    "Cita textual relevante 1",
    "Cita textual relevante 2"
  ]
}

REGLAS:
- Extrae TODAS las necesidades mencionadas, incluso si son implícitas
- Identifica desafíos tanto explícitos como inferidos del contexto
- Las brechas de capacidad deben ser específicas y accionables
- Las recomendaciones de servicios deben estar justificadas por necesidades reales mencionadas
- Incluye citas textuales relevantes que ilustren puntos clave
- Si un campo no aplica, usa un array vacío []
- Sé específico y concreto, evita generalidades`;

  const userPrompt = `Analiza la siguiente transcripción de entrevista y extrae la información estructurada según el formato especificado.

TRANSCRIPCIÓN:
${transcriptText}

IMPORTANTE: Responde ÚNICAMENTE con el JSON, sin texto adicional antes o después.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  logger.info('Enviando solicitud a OpenAI...');
  const response = await chat.sendMessage(messages, {
    model,
    temperature: 0.3,
    maxTokens: 4000,
    responseFormat: { type: 'json_object' },
  });

  logger.info('Respuesta recibida de OpenAI');

  // Parsear JSON
  let analysis: InterviewAnalysis;
  try {
    let jsonText = response.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    analysis = JSON.parse(jsonText);
  } catch (parseError) {
    logger.error('Error al parsear JSON de OpenAI', parseError);
    logger.error('Respuesta recibida:', response);
    throw new Error('OpenAI no devolvió un JSON válido');
  }

  return analysis;
}

/**
 * Convierte el análisis JSON a Markdown legible
 */
function analysisToMarkdown(analysis: InterviewAnalysis, transcriptFileName: string): string {
  const lines: string[] = [];

  lines.push(`# Análisis de Entrevista: ${analysis.entrevistado}`);
  lines.push('');
  lines.push(`**Fecha:** ${analysis.fecha || 'No especificada'}`);
  lines.push(`**Fuente:** ${transcriptFileName}`);
  lines.push(`**Tipo de Organización:** ${analysis.tipo_organizacion}`);
  lines.push('');

  // Contexto organizacional
  lines.push('## Contexto Organizacional');
  lines.push('');
  if (analysis.contexto_organizacional.años_operacion) {
    lines.push(`- **Años de operación:** ${analysis.contexto_organizacional.años_operacion}`);
  }
  lines.push(`- **Tamaño del equipo:** ${analysis.contexto_organizacional.tamaño_equipo}`);
  lines.push(`- **Modelo de negocio:** ${analysis.contexto_organizacional.modelo_negocio}`);
  lines.push(`- **Alcance geográfico:** ${analysis.contexto_organizacional.alcance_geografico}`);
  if (analysis.contexto_organizacional.sector_impacto) {
    lines.push(`- **Sector de impacto:** ${analysis.contexto_organizacional.sector_impacto}`);
  }
  lines.push('');

  // Necesidades
  lines.push('## Necesidades Identificadas');
  lines.push('');
  if (analysis.necesidades.length === 0) {
    lines.push('No se identificaron necesidades explícitas en la entrevista.');
  } else {
    analysis.necesidades.forEach((necesidad, index) => {
      lines.push(`### ${index + 1}. ${necesidad.categoria} (${necesidad.urgencia})`);
      lines.push('');
      lines.push(necesidad.descripcion);
      if (necesidad.citas_relevantes && necesidad.citas_relevantes.length > 0) {
        lines.push('');
        lines.push('**Citas relevantes:**');
        necesidad.citas_relevantes.forEach(cita => {
          lines.push(`- "${cita}"`);
        });
      }
      lines.push('');
    });
  }
  lines.push('');

  // Desafíos
  lines.push('## Desafíos Principales');
  lines.push('');
  if (analysis.desafios.length === 0) {
    lines.push('No se identificaron desafíos explícitos en la entrevista.');
  } else {
    analysis.desafios.forEach((desafio, index) => {
      lines.push(`### ${index + 1}. ${desafio.desafio} (Impacto: ${desafio.impacto})`);
      lines.push('');
      lines.push(desafio.descripcion);
      lines.push('');
    });
  }
  lines.push('');

  // Brechas de capacidad
  lines.push('## Brechas de Capacidad');
  lines.push('');
  if (analysis.brechas_capacidad.length === 0) {
    lines.push('No se identificaron brechas de capacidad explícitas.');
  } else {
    analysis.brechas_capacidad.forEach(brecha => {
      lines.push(`- ${brecha}`);
    });
  }
  lines.push('');

  // Recomendaciones de servicios
  lines.push('## Recomendaciones de Servicios');
  lines.push('');
  if (analysis.recomendaciones_servicios.length === 0) {
    lines.push('No se generaron recomendaciones de servicios específicas.');
  } else {
    analysis.recomendaciones_servicios.forEach((servicio, index) => {
      lines.push(`### ${index + 1}. ${servicio.tipo.toUpperCase()}: ${servicio.tema} (${servicio.urgencia})`);
      lines.push('');
      lines.push(`**Justificación:** ${servicio.justificacion}`);
      lines.push('');
    });
  }
  lines.push('');

  // Insights clave
  lines.push('## Insights Clave');
  lines.push('');
  if (analysis.insights_clave.length === 0) {
    lines.push('No se identificaron insights específicos.');
  } else {
    analysis.insights_clave.forEach((insight, index) => {
      lines.push(`${index + 1}. ${insight}`);
    });
  }
  lines.push('');

  // Citas destacadas
  if (analysis.citas_destacadas && analysis.citas_destacadas.length > 0) {
    lines.push('## Citas Destacadas');
    lines.push('');
    analysis.citas_destacadas.forEach((cita, index) => {
      lines.push(`${index + 1}. "${cita}"`);
    });
    lines.push('');
  }

  // Metadata
  lines.push('---');
  lines.push('');
  lines.push(`**Análisis generado:** ${new Date().toISOString()}`);
  lines.push(`**Modelo utilizado:** gpt-4-turbo`);

  return lines.join('\n');
}

/**
 * Procesa una transcripción individual
 */
async function processTranscript(transcriptPath: string): Promise<void> {
  const transcriptFileName = path.basename(transcriptPath);
  logger.info(`\n📄 Procesando: ${transcriptFileName}`);

  // Leer transcripción
  const transcriptText = fs.readFileSync(transcriptPath, 'utf-8');
  logger.info(`   Tamaño: ${transcriptText.length} caracteres`);

  // Analizar
  const analysis = await analyzeInterview(transcriptText, transcriptFileName);

  // Generar Markdown
  const markdown = analysisToMarkdown(analysis, transcriptFileName);

  // Guardar análisis
  const outputDir = path.join(PROJECT_PATH, '🔄 proceso', 'analisis-entrevistas');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generar nombre de archivo seguro
  const safeName = analysis.entrevistado
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
  
  const outputPath = path.join(outputDir, `${safeName}-analisis.md`);
  fs.writeFileSync(outputPath, markdown, 'utf-8');
  logger.info(`   ✅ Análisis guardado en: ${outputPath}`);

  // También guardar JSON para referencia
  const jsonPath = path.join(outputDir, `${safeName}-analisis.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(analysis, null, 2), 'utf-8');
  logger.info(`   ✅ JSON guardado en: ${jsonPath}`);
}

/**
 * Función principal
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  const transcriptsDir = path.join(PROJECT_PATH, '📥 insumos', 'transcripciones');
  
  if (!fs.existsSync(transcriptsDir)) {
    logger.error(`Directorio de transcripciones no encontrado: ${transcriptsDir}`);
    process.exit(1);
  }

  let transcriptFiles: string[] = [];

  if (args.includes('--all')) {
    // Procesar todas las transcripciones
    const files = fs.readdirSync(transcriptsDir);
    transcriptFiles = files
      .filter(f => f.endsWith('.txt') && !f.includes('README'))
      .map(f => path.join(transcriptsDir, f));
  } else if (args.includes('--file')) {
    // Procesar archivo específico
    const fileIndex = args.indexOf('--file');
    const fileName = args[fileIndex + 1];
    if (!fileName) {
      logger.error('Debes especificar un nombre de archivo después de --file');
      process.exit(1);
    }
    const filePath = path.join(transcriptsDir, fileName);
    if (!fs.existsSync(filePath)) {
      logger.error(`Archivo no encontrado: ${filePath}`);
      process.exit(1);
    }
    transcriptFiles = [filePath];
  } else {
    logger.error('Uso:');
    logger.error('  npx ts-node analyze-nosxotros-interview.ts --all');
    logger.error('  npx ts-node analyze-nosxotros-interview.ts --file <nombre-archivo>');
    process.exit(1);
  }

  logger.info(`\n📋 Iniciando análisis de ${transcriptFiles.length} transcripción(es)\n`);

  for (const transcriptPath of transcriptFiles) {
    try {
      await processTranscript(transcriptPath);
    } catch (error: any) {
      logger.error(`Error al procesar ${transcriptPath}:`, error);
      logger.error(error.message);
    }
  }

  logger.info(`\n✅ Análisis completado`);
}

if (require.main === module) {
  main().catch((error) => {
    logger.error('Error fatal', error);
    process.exit(1);
  });
}

export { analyzeInterview, InterviewAnalysis };

