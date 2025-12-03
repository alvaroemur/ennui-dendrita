#!/usr/bin/env npx ts-node
/**
 * Script para generar plan de acción estratégico con oferta de servicios
 * 
 * Lee el informe consolidado, el censo y el master-plan para generar un plan de acción
 * estratégico con portafolio de oferta (mini cursos, talleres, mentorías, consultorías).
 */

import { ChatService, ChatMessage } from '../../services/openai/chat';
import { createLogger } from '../../utils/logger';
import { selectModel } from '../../utils/model-selector';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('GenerateOfferActionPlan');

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
 * Carga el informe consolidado
 */
function loadConsolidatedReport(): string {
  const reportPath = path.join(PROJECT_PATH, '📤 entregables', 'informe-analisis-entrevistas.md');
  
  if (!fs.existsSync(reportPath)) {
    throw new Error(`Informe consolidado no encontrado en: ${reportPath}. Ejecuta primero consolidate-nosxotros-analysis.ts`);
  }

  return fs.readFileSync(reportPath, 'utf-8');
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
 * Genera el plan de acción estratégico usando LLM
 */
async function generateActionPlan(
  reportContent: string,
  censoContent: string,
  masterPlanContent: string
): Promise<string> {
  const chat = new ChatService();

  if (!chat.isConfigured()) {
    throw new Error('OpenAI not configured. Set OPENAI_API_KEY in .env.local');
  }

  const model = selectModel('standard-processing'); // gpt-4o-mini según el plan
  logger.info(`Generando plan de acción con ${model}...`);

  const systemPrompt = `Eres un consultor estratégico experto en diseño de ofertas de servicios para ecosistemas de impacto social.
Tu tarea es generar un plan de acción estratégico para ennui × NOSxOTROS basado en las necesidades identificadas en las entrevistas.

El plan debe ser:
- Estratégico (no detallado operativamente)
- Basado en evidencia de las entrevistas y el censo
- Enfocado en oferta de servicios (mini cursos, talleres, mentorías, consultorías)
- Con justificación clara de por qué cada servicio responde a necesidades reales
- Con segmentación de público objetivo
- Con recomendaciones de priorización e implementación

Estructura requerida del plan en Markdown:

# Plan de Acción Estratégico - Oferta de Servicios ennui × NOSxOTROS

## 1. Resumen Ejecutivo
[Visión general del plan y enfoque estratégico]

## 2. Portafolio de Oferta

### 2.1 Mini Cursos
[Descripción estratégica de mini cursos, temas principales, justificación basada en necesidades]

### 2.2 Talleres
[Descripción estratégica de talleres, temas principales, justificación basada en necesidades]

### 2.3 Mentorías
[Descripción estratégica de mentorías, enfoques, justificación basada en necesidades]

### 2.4 Consultorías
[Descripción estratégica de consultorías, tipos, justificación basada en necesidades]

## 3. Justificación Estratégica

### 3.1 Mapeo Necesidades-Servicios
[Tabla o mapeo que conecta necesidades identificadas con servicios propuestos]

### 3.2 Valor Propuesto
[Cómo cada categoría de servicio genera valor para las organizaciones]

## 4. Segmentación de Público

### 4.1 Por Tipo de Organización
[Qué servicios para ONGs, emprendimientos sociales, organizaciones estatales, etc.]

### 4.2 Por Nivel de Madurez
[Qué servicios para organizaciones nuevas vs. consolidadas]

### 4.3 Por Necesidades Prioritarias
[Segmentación basada en necesidades más urgentes]

## 5. Recomendaciones de Implementación

### 5.1 Priorización
[Qué servicios implementar primero y por qué]

### 5.2 Secuencia Sugerida
[Orden lógico de implementación]

### 5.3 Consideraciones Operativas
[Consideraciones clave para la implementación]

## 6. Modelo de Valor

### 6.1 Propuesta de Valor por Servicio
[Cómo cada servicio genera valor]

### 6.2 Impacto Esperado
[Impacto esperado en el ecosistema]

## 7. Próximos Pasos

[Recomendaciones concretas de próximos pasos]

IMPORTANTE:
- NO te enfoques en el componente de diagnóstico
- Enfócate en servicios de formación, acompañamiento y consultoría
- Sé estratégico, no operativo (no detalles de contenido, duración, precios específicos)
- Justifica cada recomendación con evidencia de las entrevistas
- Usa datos del censo para validar segmentación
- Mantén un tono profesional y accionable`;

  // Truncar contenido si es muy largo para evitar exceder límites de tokens
  const truncateContent = (content: string, maxLength: number) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '\n[... contenido truncado ...]';
  };

  const userPrompt = `Genera el plan de acción estratégico basado en los siguientes insumos:

INFORME CONSOLIDADO DE ENTREVISTAS:
${truncateContent(reportContent, 12000)}

CENSO DEL ECOSISTEMA:
${truncateContent(censoContent, 6000)}

CONTEXTO DEL PROYECTO (Master Plan):
${truncateContent(masterPlanContent, 4000)}

Genera el plan completo en formato Markdown según la estructura especificada.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  logger.info('Enviando solicitud a OpenAI...');
  const response = await chat.sendMessage(messages, {
    model,
    temperature: 0.4,
    maxTokens: 4000,
  });

  logger.info('Respuesta recibida de OpenAI');
  return response;
}

/**
 * Función principal
 */
async function main(): Promise<void> {
  logger.info('\n📋 Iniciando generación de plan de acción estratégico\n');

  // Cargar datos
  logger.info('📥 Cargando informe consolidado...');
  const reportContent = loadConsolidatedReport();
  logger.info(`✅ Informe cargado (${reportContent.length} caracteres)`);

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

  // Generar plan
  logger.info('\n🔄 Generando plan de acción estratégico...');
  const plan = await generateActionPlan(reportContent, censoContent, masterPlanContent);

  // Guardar plan
  const outputDir = path.join(PROJECT_PATH, '📤 entregables');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'plan-accion-oferta.md');
  fs.writeFileSync(outputPath, plan, 'utf-8');
  logger.info(`\n✅ Plan guardado en: ${outputPath}`);

  // Agregar metadata al final del plan
  const metadata = `\n\n---\n\n**Plan generado:** ${new Date().toISOString()}\n**Modelo utilizado:** gpt-4o-mini\n**Basado en:** Informe de análisis de entrevistas y censo del ecosistema`;
  fs.appendFileSync(outputPath, metadata, 'utf-8');

  logger.info('\n✅ Plan de acción generado exitosamente');
}

if (require.main === module) {
  main().catch((error) => {
    logger.error('Error fatal', error);
    process.exit(1);
  });
}

export { generateActionPlan };

