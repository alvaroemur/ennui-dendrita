/**
 * Analizador semántico genérico para documentos
 * 
 * Analiza documentos usando IA para extraer:
 * - Resumen del contenido
 * - Temas principales
 * - Tags semánticos
 * - Insights clave
 * - Relaciones potenciales
 */

import { ChatService, ChatMessage, ChatCompletionResponse } from '../services/openai/chat';
import { createLogger } from './logger';
import { logIntegrationUsage } from './usage-logger';

const logger = createLogger('SemanticAnalyzer');

export interface SemanticAnalysis {
  summary: string;
  topics: string[];
  tags: string[];
  keyInsights: string[];
  suggestedRelationships?: string[];
  documentType?: string;
  importance?: 'high' | 'medium' | 'low';
}

/**
 * Analiza un documento semánticamente usando IA
 */
export async function analyzeDocument(
  content: string,
  filePath?: string,
  options: {
    model?: string;
    includeRelationships?: boolean;
  } = {}
): Promise<SemanticAnalysis> {
  try {
    const chat = new ChatService();

    if (!chat.isConfigured()) {
      throw new Error('OpenAI not configured. Set OPENAI_API_KEY in .env.local');
    }

    const model = options.model || 'gpt-4o';
    logger.info(`Analyzing document semantically with ${model}...`);

    const systemPrompt = `Eres un asistente experto en análisis semántico de documentos.
Analiza el contenido de un documento y extrae información estructurada.

IMPORTANTE: Debes responder ÚNICAMENTE con un JSON válido que siga esta estructura exacta:

{
  "summary": "Resumen breve del documento (2-3 oraciones)",
  "topics": ["tema1", "tema2", "tema3"],
  "tags": ["tag1", "tag2", "tag3"],
  "keyInsights": ["insight1", "insight2"],
  "suggestedRelationships": ["relación1", "relación2"],
  "documentType": "tipo de documento (project-plan|meeting-notes|documentation|other)",
  "importance": "high|medium|low"
}

REGLAS:
- Extrae los temas principales del documento (máximo 5)
- Genera tags semánticos relevantes (máximo 8)
- Identifica insights clave o conclusiones importantes (máximo 5)
- Sugiere relaciones potenciales con otros documentos o conceptos (máximo 5)
- Determina el tipo de documento basado en su contenido
- Evalúa la importancia del documento (high/medium/low)
- Si un campo no aplica, usa un array vacío []
- Los tags deben ser concisos y descriptivos
- Las relaciones sugeridas deben ser específicas y accionables`;

    const contentPreview = content.length > 8000 
      ? content.substring(0, 8000) + '\n\n[... contenido truncado ...]'
      : content;

    const userPrompt = `Analiza el siguiente documento${filePath ? ` (${filePath})` : ''}:

${contentPreview}

Responde ÚNICAMENTE con el JSON, sin texto adicional antes o después.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const startTime = Date.now();
    const response: ChatCompletionResponse = await chat.sendMessageWithUsage(messages, {
      model,
      temperature: 0.3,
      maxTokens: 2000,
      responseFormat: { type: 'json_object' },
    });

    const duration = Date.now() - startTime;
    
    // Registrar uso de tokens
    if (response.usage) {
      logIntegrationUsage('OpenAI', 'semantic-analysis', {
        status: 'success',
        duration,
        metadata: {
          model,
          prompt_tokens: response.usage.prompt_tokens,
          completion_tokens: response.usage.completion_tokens,
          total_tokens: response.usage.total_tokens,
          filePath: filePath || 'unknown',
        },
      });
    }

    logger.info('Semantic analysis response received');

    // Parsear JSON
    let analysis: SemanticAnalysis;
    try {
      let jsonText = response.content.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }

      analysis = JSON.parse(jsonText);
    } catch (parseError) {
      logger.error('Error parsing semantic analysis JSON', parseError);
      logger.error('Response received:', response);
      throw new Error('OpenAI did not return valid JSON');
    }

    // Validar estructura básica
    if (!analysis.summary || !Array.isArray(analysis.topics)) {
      throw new Error('JSON does not have expected structure');
    }

    // Asegurar arrays
    analysis.topics = analysis.topics || [];
    analysis.tags = analysis.tags || [];
    analysis.keyInsights = analysis.keyInsights || [];
    analysis.suggestedRelationships = analysis.suggestedRelationships || [];

    logger.info('✅ Semantic analysis completed');
    logger.info(`- Topics: ${analysis.topics.length}`);
    logger.info(`- Tags: ${analysis.tags.length}`);
    logger.info(`- Insights: ${analysis.keyInsights.length}`);

    return analysis;
  } catch (error) {
    logger.error('Error analyzing document semantically', error);
    throw error;
  }
}

