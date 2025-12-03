#!/usr/bin/env npx ts-node
/**
 * Script 2: Integrar análisis de transcripción en documento destino
 * 
 * Recibe el JSON de análisis y determina cómo incorporarlo mejor
 * en las meeting notes existentes.
 */

import { ChatService, ChatMessage } from '../../../services/openai/chat';
import { MeetingAnalysis } from './analyze-transcript';
import { createLogger } from '../../../utils/logger';
import { selectModel } from '../../../utils/model-selector';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('IntegrateTranscriptAnalysis');

/**
 * Estructura de recomendación de integración
 */
export interface IntegrationRecommendation {
  strategy: 'append' | 'merge' | 'replace' | 'create_new';
  sections_to_update: Array<{
    section: string;
    action: 'add' | 'update' | 'replace';
    content: string;
    reasoning: string;
  }>;
  new_sections?: Array<{
    title: string;
    content: string;
    position: 'before' | 'after' | 'end';
    reference_section?: string;
  }>;
  conflicts?: Array<{
    section: string;
    existing_content: string;
    new_content: string;
    recommendation: string;
  }>;
  summary: string;
}

/**
 * Determina cómo integrar el análisis en el documento destino
 */
async function determineIntegration(
  analysis: MeetingAnalysis,
  targetDocumentPath: string,
  options: {
    model?: string;
    outputPath?: string;
  } = {}
): Promise<IntegrationRecommendation> {
  try {
    const chat = new ChatService();

    if (!chat.isConfigured()) {
      throw new Error('OpenAI not configured. Set OPENAI_API_KEY in .env.local');
    }

    // Usar modelo según estrategia de tiers:
    // - Unificación de múltiples fuentes → Tier 1 (gpt-4-turbo) - más caro, mejor calidad
    // - Integración simple → Tier 2 (gpt-4o-mini) - balanceado
    // Por defecto, integración es unificación de fuentes → Tier 1
    const model = options.model || selectModel('multi-source-unification');

    logger.info(`Determinando estrategia de integración con ${model}...`);

    // Leer documento destino
    if (!fs.existsSync(targetDocumentPath)) {
      logger.warn(`Documento destino no existe: ${targetDocumentPath}`);
      logger.info('Se recomendará crear un nuevo documento');
    }

    const targetDocument = fs.existsSync(targetDocumentPath)
      ? fs.readFileSync(targetDocumentPath, 'utf-8')
      : '';

    const systemPrompt = `Eres un asistente experto en gestión de documentos y meeting notes.
Analiza el análisis estructurado de una transcripción y el documento destino (meeting notes)
y determina la mejor estrategia para integrar la información.

IMPORTANTE: Debes responder ÚNICAMENTE con un JSON válido que siga esta estructura exacta:

{
  "strategy": "append|merge|replace|create_new",
  "sections_to_update": [
    {
      "section": "Nombre de la sección existente",
      "action": "add|update|replace",
      "content": "Contenido a agregar/actualizar",
      "reasoning": "Por qué esta acción"
    }
  ],
  "new_sections": [
    {
      "title": "Título de nueva sección",
      "content": "Contenido de la nueva sección",
      "position": "before|after|end",
      "reference_section": "Sección de referencia (si aplica)"
    }
  ],
  "conflicts": [
    {
      "section": "Sección con conflicto",
      "existing_content": "Contenido existente",
      "new_content": "Contenido nuevo",
      "recommendation": "Recomendación para resolver"
    }
  ],
  "summary": "Resumen de la estrategia de integración"
}

ESTRATEGIAS:
- "append": Agregar información nueva sin modificar lo existente
- "merge": Combinar información nueva con existente (actualizar, no duplicar)
- "replace": Reemplazar secciones completas (solo si hay conflicto significativo)
- "create_new": Crear un nuevo documento (si el destino no existe o es muy diferente)

REGLAS:
- Prioriza preservar información existente
- Identifica duplicados y recomienda cómo manejarlos
- Sugiere nuevas secciones cuando la información no encaja en las existentes
- Si hay conflictos, proporciona recomendaciones claras
- Las secciones deben seguir la estructura de meeting notes estándar:
  * Temas o clientes revisados
  * Puntos de discusión y conclusiones
  * Actividades próximas
  * Tareas
  * Notas adicionales`;

    const userPrompt = `Analiza el siguiente análisis de transcripción y el documento destino:

=== ANÁLISIS DE TRANSCRIPCIÓN ===
${JSON.stringify(analysis, null, 2)}

=== DOCUMENTO DESTINO (MEETING NOTES) ===
${targetDocument || '(Documento no existe - crear nuevo)'}

Determina la mejor estrategia para integrar la información del análisis en el documento destino.
Considera:
1. Si el documento existe, qué secciones actualizar
2. Qué información nueva agregar
3. Cómo evitar duplicados
4. Cómo estructurar la información de forma clara

Responde ÚNICAMENTE con el JSON, sin texto adicional.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const response = await chat.sendMessage(messages, {
      model,
      temperature: 0.3,
      maxTokens: 3000,
      responseFormat: { type: 'json_object' },
    });

    logger.info('Respuesta recibida de OpenAI');

    // Parsear JSON
    let recommendation: IntegrationRecommendation;
    try {
      let jsonText = response.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }

      recommendation = JSON.parse(jsonText);
    } catch (parseError) {
      logger.error('Error al parsear JSON de OpenAI', parseError);
      logger.error('Respuesta recibida:', response);
      throw new Error('OpenAI no devolvió un JSON válido');
    }

    // Validar estructura básica
    if (!recommendation.strategy || !recommendation.sections_to_update) {
      throw new Error('JSON no tiene la estructura esperada');
    }

    logger.info('✅ Recomendación de integración generada');
    logger.info(`- Estrategia: ${recommendation.strategy}`);
    logger.info(`- Secciones a actualizar: ${recommendation.sections_to_update.length}`);
    if (recommendation.new_sections) {
      logger.info(`- Nuevas secciones: ${recommendation.new_sections.length}`);
    }
    if (recommendation.conflicts && recommendation.conflicts.length > 0) {
      logger.warn(`- Conflictos detectados: ${recommendation.conflicts.length}`);
    }

    // Guardar resultado si se especifica path
    if (options.outputPath) {
      fs.writeFileSync(
        options.outputPath,
        JSON.stringify(recommendation, null, 2),
        'utf-8'
      );
      logger.info(`✅ Recomendación guardada en: ${options.outputPath}`);
    }

    return recommendation;
  } catch (error) {
    logger.error('Error al determinar integración', error);
    throw error;
  }
}

/**
 * Función principal
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    logger.error('Uso: ts-node integrate-transcript-analysis.ts <analysis-json> <target-document> [output-json] [model]');
    logger.error('');
    logger.error('Ejemplo:');
    logger.error('  ts-node integrate-transcript-analysis.ts analysis.json meeting-notes.md recommendation.json');
    logger.error('  ts-node integrate-transcript-analysis.ts analysis.json meeting-notes.md recommendation.json gpt-4-turbo');
    process.exit(1);
  }

  const analysisPath = args[0];
  const targetDocumentPath = args[1];
  const outputPath = args[2] || path.join(
    __dirname,
    '../../workspaces/inspiro/company-management/integration-recommendation.json'
  );
  const model = args[3]; // Opcional

  if (!fs.existsSync(analysisPath)) {
    logger.error(`Archivo de análisis no encontrado: ${analysisPath}`);
    process.exit(1);
  }

  logger.info(`Leyendo análisis: ${analysisPath}`);
  const analysisJson = fs.readFileSync(analysisPath, 'utf-8');
  const analysis: MeetingAnalysis = JSON.parse(analysisJson);

  logger.info(`Leyendo documento destino: ${targetDocumentPath}`);

  try {
    const recommendation = await determineIntegration(
      analysis,
      targetDocumentPath,
      {
        model,
        outputPath,
      }
    );

    console.log('\n=== RECOMENDACIÓN DE INTEGRACIÓN ===\n');
    console.log(JSON.stringify(recommendation, null, 2));
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

export { determineIntegration };

