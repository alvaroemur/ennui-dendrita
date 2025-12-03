#!/usr/bin/env npx ts-node
/**
 * Script para análisis contextual de transcripciones
 * 
 * Realiza análisis específico según el tipo de reunión:
 * - Comercial: necesidades del cliente, pain points, oportunidades
 * - Proyecto: acciones, bloqueadores, alineación con master-plan
 * - Company Management: decisiones estratégicas, governance
 */

import { ChatService } from '../../../../services/openai/chat';
import { createLogger } from '../../../../utils/logger';
import { selectModel } from '../../../../utils/model-selector';
import { TranscriptContext, TranscriptType } from '../context/identify-transcript-context';
import { loadProjectContext } from '../utils/context-loader';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('AnalyzeTranscriptContextual');

export interface CommercialAnalysis {
  client_needs: Array<{
    need: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  pain_points: Array<{
    point: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
  }>;
  opportunities: Array<{
    opportunity: string;
    description: string;
    potential_value?: string;
  }>;
  stakeholders: Array<{
    name: string;
    role: string;
    influence: 'high' | 'medium' | 'low';
  }>;
  timeline?: {
    urgency: 'high' | 'medium' | 'low';
    expected_timeline?: string;
    deadlines?: string[];
  };
  budget?: {
    mentioned: boolean;
    amount?: string;
    currency?: string;
    constraints?: string[];
  };
  proposal_insights: Array<{
    insight: string;
    recommendation: string;
  }>;
}

export interface ProjectAnalysis {
  tasks: Array<{
    task: string;
    assignee?: string;
    due_date?: string;
    priority: 'high' | 'medium' | 'low';
    context: string;
  }>;
  decisions: Array<{
    decision: string;
    context: string;
    stakeholders?: string[];
    impact: 'high' | 'medium' | 'low';
  }>;
  blockers: Array<{
    blocker: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
    potential_solutions?: string[];
  }>;
  dependencies: Array<{
    dependency: string;
    description: string;
    blocking?: boolean;
  }>;
  scope_changes: Array<{
    change: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
  }>;
  timeline_updates: Array<{
    update: string;
    new_timeline?: string;
    reason: string;
  }>;
  master_plan_alignment: {
    aligned: boolean;
    deviations: Array<{
      deviation: string;
      description: string;
      recommendation: string;
    }>;
  };
}

export interface ManagementAnalysis {
  strategic_decisions: Array<{
    decision: string;
    context: string;
    stakeholders: string[];
    impact: 'high' | 'medium' | 'low';
  }>;
  management_actions: Array<{
    action: string;
    owner?: string;
    timeline?: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  stakeholders: Array<{
    name: string;
    role: string;
    involvement: string;
  }>;
  governance_topics: Array<{
    topic: string;
    description: string;
    status: 'discussed' | 'decided' | 'pending';
  }>;
  next_steps: Array<{
    step: string;
    owner?: string;
    timeline?: string;
  }>;
}

export type ContextualAnalysis = 
  | { type: 'commercial'; analysis: CommercialAnalysis }
  | { type: 'project'; analysis: ProjectAnalysis }
  | { type: 'company-management'; analysis: ManagementAnalysis };

/**
 * Carga contexto del proyecto si está disponible
 */
function loadProjectContextForAnalysis(
  workspace: string,
  project?: string
): string {
  if (!project) return '';
  
  try {
    const projectContext = loadProjectContext(workspace, project);
    if (!projectContext) return '';
    
    const parts: string[] = [];
    
    // Master plan summary
    if (projectContext.masterPlan?.executiveSummary) {
      parts.push(`## Master Plan - Resumen Ejecutivo\n${projectContext.masterPlan.executiveSummary}`);
    }
    
    // Current status
    if (projectContext.currentContext?.currentStatus) {
      parts.push(`\n## Estado Actual\n${projectContext.currentContext.currentStatus}`);
    }
    
    // High priority tasks
    const highPriorityTasks = projectContext.tasks?.pending?.filter(
      (t: any) => t.priority === 'high'
    ) || [];
    if (highPriorityTasks.length > 0) {
      parts.push(`\n## Tareas Prioritarias Pendientes`);
      highPriorityTasks.slice(0, 5).forEach((task: any) => {
        parts.push(`- ${task.description}${task.assignee ? ` (${task.assignee})` : ''}`);
      });
    }
    
    return parts.join('\n');
  } catch (error: any) {
    logger.warn(`Error loading project context: ${error.message}`);
    return '';
  }
}

/**
 * Genera prompt para análisis comercial
 */
function buildCommercialPrompt(
  normalizedTranscript: string,
  contextInfo?: string
): { system: string; user: string } {
  const systemPrompt = `Eres un asistente experto en análisis de reuniones comerciales.
Analiza la transcripción de una reunión con un cliente potencial o existente y extrae información clave para propuestas comerciales.

IMPORTANTE: Debes responder ÚNICAMENTE con un JSON válido que siga esta estructura exacta:

{
  "client_needs": [
    {
      "need": "Necesidad identificada",
      "description": "Descripción detallada",
      "priority": "high|medium|low"
    }
  ],
  "pain_points": [
    {
      "point": "Pain point identificado",
      "description": "Descripción del problema",
      "impact": "high|medium|low"
    }
  ],
  "opportunities": [
    {
      "opportunity": "Oportunidad identificada",
      "description": "Descripción de la oportunidad",
      "potential_value": "Valor potencial si se menciona"
    }
  ],
  "stakeholders": [
    {
      "name": "Nombre del stakeholder",
      "role": "Rol o posición",
      "influence": "high|medium|low"
    }
  ],
  "timeline": {
    "urgency": "high|medium|low",
    "expected_timeline": "Timeline mencionado",
    "deadlines": ["fecha1", "fecha2"]
  },
  "budget": {
    "mentioned": true|false,
    "amount": "Monto si se menciona",
    "currency": "Moneda",
    "constraints": ["restricción1", "restricción2"]
  },
  "proposal_insights": [
    {
      "insight": "Insight clave",
      "recommendation": "Recomendación para la propuesta"
    }
  ]
}

REGLAS:
- Extrae TODAS las necesidades mencionadas, incluso si son implícitas
- Identifica TODOS los pain points, no solo los explícitos
- Identifica oportunidades de propuesta o venta
- Lista TODOS los stakeholders mencionados
- Si no se menciona algo, usa valores por defecto apropiados (arrays vacíos, false, etc.)`;

  const userPrompt = `Analiza la siguiente transcripción de reunión comercial:

${normalizedTranscript}

${contextInfo ? `\n## Contexto Adicional\n${contextInfo}` : ''}

Extrae la información estructurada siguiendo el formato JSON especificado.`;

  return { system: systemPrompt, user: userPrompt };
}

/**
 * Genera prompt para análisis de proyecto
 */
function buildProjectPrompt(
  normalizedTranscript: string,
  projectContext: string
): { system: string; user: string } {
  const systemPrompt = `Eres un asistente experto en gestión de proyectos.
Analiza la transcripción de una reunión de proyecto y extrae información clave contrastándola con el contexto del proyecto.

IMPORTANTE: Debes responder ÚNICAMENTE con un JSON válido que siga esta estructura exacta:

{
  "tasks": [
    {
      "task": "Descripción de la tarea",
      "assignee": "Persona asignada (si se menciona)",
      "due_date": "Fecha límite (si se menciona)",
      "priority": "high|medium|low",
      "context": "Contexto adicional"
    }
  ],
  "decisions": [
    {
      "decision": "Decisión tomada",
      "context": "Contexto de la decisión",
      "stakeholders": ["persona1", "persona2"],
      "impact": "high|medium|low"
    }
  ],
  "blockers": [
    {
      "blocker": "Bloqueador identificado",
      "description": "Descripción del bloqueador",
      "severity": "high|medium|low",
      "potential_solutions": ["solución1", "solución2"]
    }
  ],
  "dependencies": [
    {
      "dependency": "Dependencia identificada",
      "description": "Descripción",
      "blocking": true|false
    }
  ],
  "scope_changes": [
    {
      "change": "Cambio de alcance",
      "description": "Descripción del cambio",
      "impact": "high|medium|low"
    }
  ],
  "timeline_updates": [
    {
      "update": "Actualización de timeline",
      "new_timeline": "Nuevo timeline si se menciona",
      "reason": "Razón del cambio"
    }
  ],
  "master_plan_alignment": {
    "aligned": true|false,
    "deviations": [
      {
        "deviation": "Desviación del master plan",
        "description": "Descripción",
        "recommendation": "Recomendación"
      }
    ]
  }
}

REGLAS:
- Extrae TODAS las tareas mencionadas
- Identifica decisiones explícitas e implícitas
- Identifica bloqueadores y riesgos
- Contrasta con el master plan y identifica desviaciones
- Si no hay información, usa arrays vacíos o valores por defecto`;

  const userPrompt = `Analiza la siguiente transcripción de reunión de proyecto:

${normalizedTranscript}

## Contexto del Proyecto

${projectContext || 'No hay contexto del proyecto disponible.'}

Extrae la información estructurada contrastando con el contexto del proyecto.`;

  return { system: systemPrompt, user: userPrompt };
}

/**
 * Genera prompt para análisis de gestión
 */
function buildManagementPrompt(
  normalizedTranscript: string,
  contextInfo?: string
): { system: string; user: string } {
  const systemPrompt = `Eres un asistente experto en gestión estratégica y governance.
Analiza la transcripción de una reunión de gestión interna y extrae información clave sobre decisiones estratégicas y governance.

IMPORTANTE: Debes responder ÚNICAMENTE con un JSON válido que siga esta estructura exacta:

{
  "strategic_decisions": [
    {
      "decision": "Decisión estratégica",
      "context": "Contexto de la decisión",
      "stakeholders": ["persona1", "persona2"],
      "impact": "high|medium|low"
    }
  ],
  "management_actions": [
    {
      "action": "Acción de gestión",
      "owner": "Responsable (si se menciona)",
      "timeline": "Timeline (si se menciona)",
      "priority": "high|medium|low"
    }
  ],
  "stakeholders": [
    {
      "name": "Nombre del stakeholder",
      "role": "Rol",
      "involvement": "Nivel de involucramiento"
    }
  ],
  "governance_topics": [
    {
      "topic": "Tema de governance",
      "description": "Descripción",
      "status": "discussed|decided|pending"
    }
  ],
  "next_steps": [
    {
      "step": "Próximo paso",
      "owner": "Responsable (si se menciona)",
      "timeline": "Timeline (si se menciona)"
    }
  ]
}

REGLAS:
- Identifica decisiones estratégicas importantes
- Extrae acciones de gestión y sus responsables
- Lista stakeholders involucrados
- Identifica temas de governance discutidos
- Si no hay información, usa arrays vacíos`;

  const userPrompt = `Analiza la siguiente transcripción de reunión de gestión:

${normalizedTranscript}

${contextInfo ? `\n## Contexto Adicional\n${contextInfo}` : ''}

Extrae la información estructurada siguiendo el formato JSON especificado.`;

  return { system: systemPrompt, user: userPrompt };
}

/**
 * Analiza transcripción contextualmente según su tipo
 */
async function analyzeTranscriptContextual(
  normalizedTranscript: string,
  context: TranscriptContext,
  options: {
    model?: string;
    loadContext?: boolean;
  } = {}
): Promise<ContextualAnalysis> {
  try {
    const chat = new ChatService();

    if (!chat.isConfigured()) {
      throw new Error('OpenAI not configured. Set OPENAI_API_KEY in .env.local');
    }

    // Usar modelo según tipo de análisis
    // - Análisis complejo (comercial, proyecto) → Tier 1 (gpt-4-turbo)
    // - Análisis simple (gestión) → Tier 2 (gpt-4o-mini)
    const defaultModel = context.type === 'company-management' 
      ? selectModel('simple-analysis')
      : selectModel('complex-analysis');
    const model = options.model || defaultModel;

    logger.info(`Analizando transcripción contextualmente (${context.type}) con ${model}...`);

    // Cargar contexto adicional si es necesario
    let projectContext = '';
    if (context.type === 'project' && options.loadContext && context.project) {
      projectContext = loadProjectContextForAnalysis(context.workspace, context.project);
    }

    // Construir prompt según tipo
    let prompts: { system: string; user: string };
    switch (context.type) {
      case 'commercial':
        prompts = buildCommercialPrompt(normalizedTranscript);
        break;
      case 'project':
        prompts = buildProjectPrompt(normalizedTranscript, projectContext);
        break;
      case 'company-management':
        prompts = buildManagementPrompt(normalizedTranscript);
        break;
      default:
        throw new Error(`Tipo de transcripción no soportado: ${context.type}`);
    }

    const messages: any[] = [
      { role: 'system', content: prompts.system },
      { role: 'user', content: prompts.user },
    ];

    const response = await chat.sendMessage(messages, { 
      model,
      responseFormat: { type: 'json_object' }
    });

    // Parsear respuesta JSON
    let analysis: any;
    try {
      analysis = JSON.parse(response);
    } catch (error) {
      // Intentar extraer JSON si está envuelto en texto
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No se pudo parsear la respuesta JSON');
      }
    }

    logger.info('✅ Análisis contextual completado');

    // Retornar según tipo
    switch (context.type) {
      case 'commercial':
        return { type: 'commercial', analysis: analysis as CommercialAnalysis };
      case 'project':
        return { type: 'project', analysis: analysis as ProjectAnalysis };
      case 'company-management':
        return { type: 'company-management', analysis: analysis as ManagementAnalysis };
      default:
        throw new Error(`Tipo no soportado: ${context.type}`);
    }
  } catch (error: any) {
    logger.error('Error al analizar transcripción contextualmente', error);
    throw error;
  }
}

/**
 * Función principal para uso desde línea de comandos
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Uso: ts-node analyze-transcript-contextual.ts <transcript-file> <context-json> [model]');
    process.exit(1);
  }

  const transcriptPath = args[0];
  const contextPath = args[1];
  const model = args[2];

  if (!fs.existsSync(transcriptPath)) {
    console.error(`Error: Archivo no encontrado: ${transcriptPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(contextPath)) {
    console.error(`Error: Contexto no encontrado: ${contextPath}`);
    process.exit(1);
  }

  const transcriptText = fs.readFileSync(transcriptPath, 'utf-8');
  const contextData = JSON.parse(fs.readFileSync(contextPath, 'utf-8')) as TranscriptContext;

  // Extraer texto del frontmatter si existe
  let text = transcriptText;
  const frontmatterMatch = transcriptText.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (frontmatterMatch) {
    text = frontmatterMatch[2];
  }

  try {
    const analysis = await analyzeTranscriptContextual(text, contextData, { model, loadContext: true });
    
    console.log('\n✅ Análisis contextual completado');
    console.log(`📊 Tipo: ${analysis.type}`);
    console.log(`📄 Análisis guardado en memoria`);
    
    // Guardar análisis
    const outputPath = transcriptPath.replace(/\.md$/, '-analisis.json');
    fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2), 'utf-8');
    console.log(`💾 Análisis guardado en: ${outputPath}`);
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { 
  analyzeTranscriptContextual,
  CommercialAnalysis,
  ProjectAnalysis,
  ManagementAnalysis,
  ContextualAnalysis
};

