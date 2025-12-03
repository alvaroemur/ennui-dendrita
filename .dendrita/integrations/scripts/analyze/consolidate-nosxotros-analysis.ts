#!/usr/bin/env npx ts-node
/**
 * Script para consolidar análisis individuales de entrevistas y generar informe para NOSxOTROS
 * 
 * Lee todos los análisis individuales, el censo y el master-plan para generar un informe
 * consolidado con resumen ejecutivo, síntesis analítica, análisis detallado por entrevista
 * y extrapolación al censo.
 */

import { ChatService, ChatMessage } from '../../services/openai/chat';
import { createLogger } from '../../utils/logger';
import { selectModel } from '../../utils/model-selector';
import { InterviewAnalysis } from './analyze-nosxotros-interview';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('ConsolidateNOSxOTROSAnalysis');

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
 * Carga todos los análisis individuales
 */
function loadAllAnalyses(): InterviewAnalysis[] {
  const analysesDir = path.join(PROJECT_PATH, '🔄 proceso', 'analisis-entrevistas');
  
  if (!fs.existsSync(analysesDir)) {
    logger.error(`Directorio de análisis no encontrado: ${analysesDir}`);
    return [];
  }

  const files = fs.readdirSync(analysesDir)
    .filter(f => f.endsWith('.json'))
    .map(f => path.join(analysesDir, f));

  const analyses: InterviewAnalysis[] = [];

  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const analysis = JSON.parse(content) as InterviewAnalysis;
      analyses.push(analysis);
      logger.info(`✅ Cargado: ${path.basename(filePath)}`);
    } catch (error) {
      logger.error(`Error al cargar ${filePath}:`, error);
    }
  }

  return analyses;
}

/**
 * Carga el censo
 */
function loadCenso(): string {
  const censoPath = path.join(PROJECT_PATH, '📥 insumos', 'censo-NOSxOTROS', 'censo-NOSxOTROS.md');
  
  if (!fs.existsSync(censoPath)) {
    logger.warn(`Censo no encontrado en: ${censoPath}`);
    return '';
  }

  return fs.readFileSync(censoPath, 'utf-8');
}

/**
 * Carga el master-plan
 */
function loadMasterPlan(): string {
  const masterPlanPath = path.join(PROJECT_PATH, 'master_plan.md');
  
  if (!fs.existsSync(masterPlanPath)) {
    logger.warn(`Master plan no encontrado en: ${masterPlanPath}`);
    return '';
  }

  return fs.readFileSync(masterPlanPath, 'utf-8');
}

/**
 * Genera el informe consolidado usando LLM
 */
async function generateConsolidatedReport(
  analyses: InterviewAnalysis[],
  censoContent: string,
  masterPlanContent: string
): Promise<string> {
  const chat = new ChatService();

  if (!chat.isConfigured()) {
    throw new Error('OpenAI not configured. Set OPENAI_API_KEY in .env.local');
  }

  const model = selectModel('complex-analysis'); // gpt-4-turbo
  logger.info(`Generando informe consolidado con ${model}...`);

  // Preparar resumen de análisis
  const analysesSummary = analyses.map((a, i) => {
    return {
      numero: i + 1,
      entrevistado: a.entrevistado,
      tipo_organizacion: a.tipo_organizacion,
      necesidades_count: a.necesidades.length,
      desafios_count: a.desafios.length,
      servicios_recomendados: a.recomendaciones_servicios.length,
    };
  });

  const systemPrompt = `Eres un consultor experto en fortalecimiento institucional y ecosistemas de impacto social.
Tu tarea es generar un informe consolidado profesional para NOSxOTROS basado en análisis individuales de entrevistas.

El informe debe ser:
- Profesional y presentable directamente a NOSxOTROS
- Estructurado y claro
- Basado en evidencia de las entrevistas
- Con extrapolaciones válidas al censo
- Enfoque en necesidades y oportunidades de servicios (NO en diagnóstico)

Estructura requerida del informe en Markdown:

# Informe de Análisis de Entrevistas - ennui × NOSxOTROS

## Resumen Ejecutivo
[Síntesis de 2-3 párrafos con hallazgos principales]

## 1. Síntesis Analítica

### 1.1 Tipos de Organizaciones Identificadas
[Distribución y características]

### 1.2 Necesidades Comunes
[Patrones de necesidades identificadas, categorizadas]

### 1.3 Desafíos Principales
[Desafíos recurrentes y su impacto]

### 1.4 Brechas de Capacidad
[Brechas identificadas en el ecosistema]

### 1.5 Oportunidades de Servicios
[Tipos de servicios más relevantes según necesidades]

## 2. Análisis Detallado por Entrevista

[Para cada entrevista, incluir:]
### 2.X [Nombre del Entrevistado]
- Tipo de organización
- Necesidades principales
- Desafíos identificados
- Recomendaciones de servicios
- Insights clave

## 3. Extrapolación al Censo del Ecosistema

### 3.1 Aplicabilidad de Hallazgos
[Cómo los hallazgos se aplican a la población del censo]

### 3.2 Segmentación de Público
[Qué tipos de organizaciones del censo podrían beneficiarse de qué servicios]

### 3.3 Estimaciones de Demanda Potencial
[Estimaciones basadas en datos del censo]

## 4. Conclusiones y Recomendaciones

### 4.1 Hallazgos Clave
[Principales conclusiones]

### 4.2 Recomendaciones Estratégicas
[Recomendaciones para la oferta de servicios]

IMPORTANTE:
- NO te enfoques en el componente de diagnóstico
- Enfócate en identificar necesidades de servicios (mini cursos, talleres, mentorías, consultorías)
- Usa datos del censo para validar y extrapolar
- Sé específico y concreto
- Mantén un tono profesional pero accesible`;

  const userPrompt = `Genera el informe consolidado basado en los siguientes datos:

ANÁLISIS INDIVIDUALES (${analyses.length} entrevistas):
${JSON.stringify(analysesSummary, null, 2)}

ANÁLISIS COMPLETOS:
${JSON.stringify(analyses, null, 2)}

CENSO DEL ECOSISTEMA:
${censoContent.substring(0, 8000)}${censoContent.length > 8000 ? '\n[... contenido truncado ...]' : ''}

CONTEXTO DEL PROYECTO (Master Plan):
${masterPlanContent.substring(0, 4000)}${masterPlanContent.length > 4000 ? '\n[... contenido truncado ...]' : ''}

Genera el informe completo en formato Markdown según la estructura especificada.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  logger.info('Enviando solicitud a OpenAI...');
  const response = await chat.sendMessage(messages, {
    model,
    temperature: 0.4,
    maxTokens: 4096,
  });

  logger.info('Respuesta recibida de OpenAI');
  return response;
}

/**
 * Función principal
 */
async function main(): Promise<void> {
  logger.info('\n📋 Iniciando consolidación de análisis\n');

  // Cargar datos
  logger.info('📥 Cargando análisis individuales...');
  const analyses = loadAllAnalyses();
  
  if (analyses.length === 0) {
    logger.error('No se encontraron análisis individuales. Ejecuta primero analyze-nosxotros-interview.ts');
    process.exit(1);
  }

  logger.info(`✅ ${analyses.length} análisis cargados`);

  logger.info('📥 Cargando censo...');
  const censoContent = loadCenso();
  if (censoContent) {
    logger.info(`✅ Censo cargado (${censoContent.length} caracteres)`);
  }

  logger.info('📥 Cargando master plan...');
  const masterPlanContent = loadMasterPlan();
  if (masterPlanContent) {
    logger.info(`✅ Master plan cargado (${masterPlanContent.length} caracteres)`);
  }

  // Generar informe
  logger.info('\n🔄 Generando informe consolidado...');
  const report = await generateConsolidatedReport(analyses, censoContent, masterPlanContent);

  // Guardar informe
  const outputDir = path.join(PROJECT_PATH, '📤 entregables');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'informe-analisis-entrevistas.md');
  fs.writeFileSync(outputPath, report, 'utf-8');
  logger.info(`\n✅ Informe guardado en: ${outputPath}`);

  // Agregar metadata al final del informe
  const metadata = `\n\n---\n\n**Informe generado:** ${new Date().toISOString()}\n**Análisis consolidados:** ${analyses.length} entrevistas\n**Modelo utilizado:** gpt-4-turbo`;
  fs.appendFileSync(outputPath, metadata, 'utf-8');

  logger.info('\n✅ Consolidación completada');
}

if (require.main === module) {
  main().catch((error) => {
    logger.error('Error fatal', error);
    process.exit(1);
  });
}

export { generateConsolidatedReport };

