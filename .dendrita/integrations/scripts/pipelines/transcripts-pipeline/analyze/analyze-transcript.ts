#!/usr/bin/env npx ts-node
/**
 * Script 1: Analizar transcripción de reunión con OpenAI
 * 
 * Analiza una transcripción de reunión y genera un JSON estructurado
 * con información clave: participantes, temas, decisiones, tareas, etc.
 */

import { ChatService, ChatMessage } from '../../../../services/openai/chat';
import { createLogger } from '../../../../utils/logger';
import { selectModel } from '../../../../utils/model-selector';
import {
  detectContextLevel,
  loadContext,
  enrichSystemPrompt,
  enrichUserPrompt,
  ContextInfo,
  ContextDetectionOptions,
} from './context-enricher';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('AnalyzeTranscript');

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

const PROJECT_ROOT = findProjectRoot();

/**
 * Estructura JSON esperada del análisis
 */
export interface MeetingAnalysis {
  meeting_info: {
    date?: string;
    participants: string[];
    summary: string;
    duration?: string;
  };
  topics_discussed: Array<{
    topic: string;
    description: string;
    importance: 'high' | 'medium' | 'low';
  }>;
  decisions: Array<{
    decision: string;
    context: string;
    stakeholders?: string[];
  }>;
  tasks: Array<{
    task: string;
    assignee?: string;
    due_date?: string;
    priority: 'high' | 'medium' | 'low';
    context: string;
  }>;
  clients_projects: Array<{
    name: string;
    type: 'client' | 'project' | 'opportunity';
    status?: string;
    notes?: string;
  }>;
  next_steps: Array<{
    action: string;
    owner?: string;
    timeline?: string;
  }>;
  key_insights: string[];
  tags?: string[];
  variables?: {
    workspace?: string;
    type?: string;
    participants?: string[];
    client?: string;
    project?: string;
    [key: string]: any;
  };
}

/**
 * Opciones para análisis de transcripción
 */
export interface AnalyzeTranscriptOptions {
  model?: string;
  outputPath?: string;
  workspace?: string;
  project?: string;
  meetingNotesPath?: string;
  staging?: boolean;
  preview?: boolean;
  transcriptPath?: string;
}

/**
 * Analiza una transcripción y genera JSON estructurado
 */
async function analyzeTranscript(
  transcriptText: string,
  options: AnalyzeTranscriptOptions = {}
): Promise<MeetingAnalysis> {
  try {
    const chat = new ChatService();

    if (!chat.isConfigured()) {
      throw new Error('OpenAI not configured. Set OPENAI_API_KEY in .env.local');
    }

    // Usar modelo según estrategia de tiers:
    // - Primer análisis (first-enrichment) → Tier 1 (gpt-4-turbo) - más caro, mejor calidad
    // - Re-análisis o actualizaciones → Tier 2 (gpt-4o-mini) - balanceado
    // - Interpretaciones simples → Tier 3 (gpt-3.5-turbo) - más barato
    // Por defecto, análisis de transcripción es complejo → Tier 1
    const model = options.model || selectModel('complex-analysis');

    logger.info(`Analizando transcripción con ${model}...`);

    // Detectar y cargar contexto (también en preview para mostrar prompts enriquecidos)
    let contextInfo: ContextInfo | null = null;
    const detectionOptions: ContextDetectionOptions = {
      transcriptPath: options.transcriptPath,
      meetingNotesPath: options.meetingNotesPath,
      workspace: options.workspace,
      project: options.project,
    };

    const detected = detectContextLevel(detectionOptions);
    logger.info(`📊 Contexto detectado: ${detected.level}${detected.workspace ? ` (${detected.workspace}${detected.project ? `/${detected.project}` : ''})` : ''}`);

    contextInfo = loadContext(detected.level, detected.workspace, detected.project);

    if (contextInfo.summary) {
      logger.info(`✅ Contexto cargado: ${contextInfo.summary.length} caracteres`);
    } else {
      logger.warn('⚠️  No se pudo cargar contexto');
    }

    const baseSystemPrompt = `Eres un asistente experto en análisis de reuniones de negocio. 
Analiza la transcripción de una reunión y extrae información estructurada.

IMPORTANTE: Debes responder ÚNICAMENTE con un JSON válido que siga esta estructura exacta:

{
  "meeting_info": {
    "date": "YYYY-MM-DD o fecha mencionada",
    "participants": ["nombre1", "nombre2"],
    "summary": "Resumen breve de la reunión (2-3 oraciones)",
    "duration": "duración si se menciona"
  },
  "topics_discussed": [
    {
      "topic": "Tema principal",
      "description": "Descripción del tema",
      "importance": "high|medium|low"
    }
  ],
  "decisions": [
    {
      "decision": "Decisión tomada",
      "context": "Contexto de la decisión",
      "stakeholders": ["persona1", "persona2"]
    }
  ],
  "tasks": [
    {
      "task": "Descripción de la tarea",
      "assignee": "Persona asignada (si se menciona)",
      "due_date": "Fecha límite (si se menciona)",
      "priority": "high|medium|low",
      "context": "Contexto adicional de la tarea"
    }
  ],
  "clients_projects": [
    {
      "name": "Nombre del cliente/proyecto",
      "type": "client|project|opportunity",
      "status": "Estado actual",
      "notes": "Notas relevantes"
    }
  ],
  "next_steps": [
    {
      "action": "Acción a realizar",
      "owner": "Responsable (si se menciona)",
      "timeline": "Timeline (si se menciona)"
    }
  ],
  "key_insights": [
    "Insight 1",
    "Insight 2"
  ],
  "tags": [
    "tag1",
    "tag2"
  ],
  "variables": {
    "workspace": "nombre-del-workspace",
    "type": "tipo-de-reunion",
    "participants": ["participante1", "participante2"],
    "client": "nombre-cliente",
    "project": "nombre-proyecto"
  }
}

REGLAS:
- Extrae TODAS las tareas mencionadas, incluso si no tienen asignado
- Identifica TODOS los clientes/proyectos mencionados
- Las decisiones deben ser explícitas o claramente inferidas
- Los insights deben ser observaciones importantes o conclusiones
- Si un campo no aplica, usa un array vacío []
- Las fechas deben estar en formato ISO cuando sea posible
- Los nombres de personas deben estar normalizados (sin emails, solo nombres)
- Tags: Identifica etiquetas relevantes para categorizar la reunión (ej: "inspiro", "reunion-arturo", "cliente", "proyecto")
- Variables: Extrae variables estructuradas útiles para el sistema (workspace, type, participants, client, project)
- Las variables deben ser consistentes y normalizadas (workspace en lowercase, nombres de participantes normalizados)`;

    // Enriquecer prompts con contexto
    const systemPrompt = contextInfo
      ? enrichSystemPrompt(baseSystemPrompt, contextInfo)
      : baseSystemPrompt;

    const userPrompt = contextInfo
      ? enrichUserPrompt(transcriptText, contextInfo)
      : `Analiza la siguiente transcripción de reunión y extrae la información estructurada:

${transcriptText}

Responde ÚNICAMENTE con el JSON, sin texto adicional antes o después.`;

    // Si preview está habilitado, mostrar prompts y salir
    if (options.preview) {
      logger.info('\n=== PREVIEW: SYSTEM PROMPT ===\n');
      console.log(systemPrompt);
      logger.info('\n=== PREVIEW: USER PROMPT ===\n');
      console.log(userPrompt);
      logger.info('\n💡 Use --preview to see prompts before execution');
      process.exit(0);
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const response = await chat.sendMessage(messages, {
      model,
      temperature: 0.3, // Baja temperatura para respuestas más consistentes
      maxTokens: 4000, // Suficiente para JSON estructurado
      responseFormat: { type: 'json_object' },
    });

    logger.info('Respuesta recibida de OpenAI');

    // Parsear JSON
    let analysis: MeetingAnalysis;
    try {
      // Limpiar respuesta por si tiene markdown o texto adicional
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

    // Validar estructura básica
    if (!analysis.meeting_info || !analysis.topics_discussed) {
      throw new Error('JSON no tiene la estructura esperada');
    }

    logger.info('✅ Análisis completado');
    logger.info(`- Participantes: ${analysis.meeting_info.participants.length}`);
    logger.info(`- Temas: ${analysis.topics_discussed.length}`);
    logger.info(`- Decisiones: ${analysis.decisions.length}`);
    logger.info(`- Tareas: ${analysis.tasks.length}`);
    logger.info(`- Clientes/Proyectos: ${analysis.clients_projects.length}`);
    if (analysis.tags) {
      logger.info(`- Tags: ${analysis.tags.length}`);
    }
    if (analysis.variables) {
      logger.info(`- Variables: ${Object.keys(analysis.variables).length}`);
    }

    // Guardar resultado
    let finalOutputPath = options.outputPath;
    
    // Si staging está habilitado, guardar en directorio temporal en la raíz del proyecto
    if (options.staging) {
      const stagingDir = path.join(PROJECT_ROOT, '_temp', 'staging', 'transcript-analysis', new Date().toISOString().replace(/[:.]/g, '-'));
      if (!fs.existsSync(stagingDir)) {
        fs.mkdirSync(stagingDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      finalOutputPath = path.join(stagingDir, `analysis-${timestamp}.json`);

      // Guardar también el contexto usado y los prompts
      if (contextInfo) {
        const contextPath = path.join(stagingDir, `context-${timestamp}.json`);
        fs.writeFileSync(
          contextPath,
          JSON.stringify({
            level: contextInfo.level,
            workspace: contextInfo.workspace,
            project: contextInfo.project,
            summary: contextInfo.summary,
          }, null, 2),
          'utf-8'
        );
        logger.info(`✅ Contexto guardado en: ${contextPath}`);

        const contextSummaryPath = path.join(stagingDir, `context-summary-${timestamp}.txt`);
        fs.writeFileSync(contextSummaryPath, contextInfo.summary, 'utf-8');
        logger.info(`✅ Resumen de contexto guardado en: ${contextSummaryPath}`);
      }

      const enrichedPromptPath = path.join(stagingDir, `enriched-prompt-${timestamp}.txt`);
      fs.writeFileSync(
        enrichedPromptPath,
        `=== SYSTEM PROMPT ===\n\n${systemPrompt}\n\n=== USER PROMPT ===\n\n${userPrompt}`,
        'utf-8'
      );
      logger.info(`✅ Prompt enriquecido guardado en: ${enrichedPromptPath}`);
    }

    if (finalOutputPath) {
      fs.writeFileSync(
        finalOutputPath,
        JSON.stringify(analysis, null, 2),
        'utf-8'
      );
      logger.info(`✅ Resultado guardado en: ${finalOutputPath}`);
    }

    return analysis;
  } catch (error) {
    logger.error('Error al analizar transcripción', error);
    throw error;
  }
}

/**
 * Función principal
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    logger.error('Uso: ts-node analyze-transcript.ts <transcript-file> [options]');
    logger.error('');
    logger.error('Opciones:');
    logger.error('  [output-json]              Archivo de salida (opcional)');
    logger.error('  --workspace <name>        Workspace específico');
    logger.error('  --project <name>          Proyecto específico');
    logger.error('  --meeting-notes <path>     Ruta a meeting-notes.md para detectar contexto');
    logger.error('  --staging                 Guardar en directorio temporal (_temp/staging/)');
    logger.error('  --preview                 Mostrar prompts enriquecidos sin ejecutar');
    logger.error('  --model <model>           Modelo de OpenAI (default: gpt-4-turbo)');
    logger.error('');
    logger.error('Ejemplos:');
    logger.error('  ts-node analyze-transcript.ts transcript.txt --workspace [workspace]');
    logger.error('  ts-node analyze-transcript.ts transcript.txt --workspace [workspace] --staging');
    logger.error('  ts-node analyze-transcript.ts transcript.txt --workspace [workspace] --project [project] --staging');
    logger.error('  ts-node analyze-transcript.ts transcript.txt --workspace [workspace] --preview');
    process.exit(1);
  }

  const transcriptPath = args[0];
  const options: AnalyzeTranscriptOptions = {
    transcriptPath,
  };

  // Parsear argumentos
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--workspace' && i + 1 < args.length) {
      options.workspace = args[i + 1];
      i++;
    } else if (args[i] === '--project' && i + 1 < args.length) {
      options.project = args[i + 1];
      i++;
    } else if (args[i] === '--meeting-notes' && i + 1 < args.length) {
      options.meetingNotesPath = args[i + 1];
      i++;
    } else if (args[i] === '--staging') {
      options.staging = true;
    } else if (args[i] === '--preview') {
      options.preview = true;
    } else if (args[i] === '--model' && i + 1 < args.length) {
      options.model = args[i + 1];
      i++;
    } else if (!args[i].startsWith('--') && !options.outputPath) {
      // Primer argumento que no es flag es el output path
      options.outputPath = args[i];
    }
  }

  // Si no se especifica outputPath y no es staging, usar default
  if (!options.outputPath && !options.staging) {
    options.outputPath = path.join(
      __dirname,
      '../../workspaces/inspiro/company-management/transcript-analysis.json'
    );
  }

  if (!fs.existsSync(transcriptPath)) {
    logger.error(`Archivo no encontrado: ${transcriptPath}`);
    process.exit(1);
  }

  logger.info(`Leyendo transcripción: ${transcriptPath}`);
  const transcriptText = fs.readFileSync(transcriptPath, 'utf-8');

  if (transcriptText.length === 0) {
    logger.error('El archivo de transcripción está vacío');
    process.exit(1);
  }

  logger.info(`Tamaño de transcripción: ${transcriptText.length} caracteres`);

  if (options.staging) {
    logger.info('📦 Modo staging: resultados se guardarán en _temp/staging/');
  }

  try {
    const analysis = await analyzeTranscript(transcriptText, options);

    if (!options.preview) {
      console.log('\n=== ANÁLISIS COMPLETADO ===\n');
      console.log(JSON.stringify(analysis, null, 2));
    }
  } catch (error) {
    logger.error('Error fatal', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    logger.error('Error fatal', error);
    process.exit(1);
  });
}

export { analyzeTranscript };

