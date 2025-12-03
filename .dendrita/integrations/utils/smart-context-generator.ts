/**
 * Generador de contexto inteligente para backlinks
 * 
 * Usa IA para generar descripciones breves y contextuales
 * en lugar de simplemente copiar líneas alrededor del wikilink.
 */

import { ChatService, ChatMessage, ChatCompletionResponse } from '../services/openai/chat';
import { createLogger } from './logger';
import { logIntegrationUsage } from './usage-logger';

const logger = createLogger('SmartContextGenerator');

/**
 * Genera un contexto inteligente para un backlink
 */
export async function generateSmartContext(
  sourceContent: string,
  sourcePath: string,
  targetPath: string,
  rawContext?: string,
  options: {
    model?: string;
    maxLength?: number;
  } = {}
): Promise<string> {
  try {
    const chat = new ChatService();

    if (!chat.isConfigured()) {
      // Fallback a contexto básico si IA no está configurada
      return rawContext || 'Referencia desde documento relacionado.';
    }

    const model = options.model || 'gpt-4o-mini';
    const maxLength = options.maxLength || 200;

    logger.debug(`Generating smart context for backlink from ${sourcePath} to ${targetPath}`);

    const systemPrompt = `Eres un asistente experto en generar descripciones contextuales breves.
Genera una descripción concisa (máximo ${maxLength} caracteres) que explique por qué un documento referencia a otro.

La descripción debe:
- Ser clara y específica
- Explicar la relación o razón de la referencia
- Ser concisa (máximo ${maxLength} caracteres)
- Estar en español
- No incluir el nombre del archivo (ya está en el link)`;

    const contentPreview = sourceContent.length > 3000 
      ? sourceContent.substring(0, 3000) + '[...]'
      : sourceContent;

    const contextInfo = rawContext 
      ? `\n\nContexto específico donde aparece la referencia:\n${rawContext.substring(0, 500)}`
      : '';

    const userPrompt = `Genera una descripción contextual breve para un backlink:

DOCUMENTO ORIGEN: ${sourcePath}
DOCUMENTO OBJETIVO: ${targetPath}

Contenido del documento origen:
${contentPreview}${contextInfo}

Genera una descripción breve que explique por qué este documento referencia al otro.
Responde ÚNICAMENTE con la descripción, sin texto adicional.`;

    const startTime = Date.now();
    const response: ChatCompletionResponse = await chat.sendMessageWithUsage(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        model,
        temperature: 0.5,
        maxTokens: 150,
      }
    );

    const duration = Date.now() - startTime;
    
    // Registrar uso de tokens
    if (response.usage) {
      logIntegrationUsage('OpenAI', 'smart-context-generation', {
        status: 'success',
        duration,
        metadata: {
          model,
          prompt_tokens: response.usage.prompt_tokens,
          completion_tokens: response.usage.completion_tokens,
          total_tokens: response.usage.total_tokens,
          sourcePath,
          targetPath,
        },
      });
    }

    const smartContext = response.content.trim();
    
    // Asegurar que no exceda el máximo
    if (smartContext.length > maxLength) {
      return smartContext.substring(0, maxLength - 3) + '...';
    }

    return smartContext || rawContext || 'Referencia desde documento relacionado.';
  } catch (error) {
    logger.warn(`Error generating smart context, using fallback: ${error instanceof Error ? error.message : String(error)}`);
    return rawContext || 'Referencia desde documento relacionado.';
  }
}

/**
 * Genera contexto inteligente para múltiples backlinks de forma eficiente
 */
export async function generateSmartContextsBatch(
  contexts: Array<{
    sourceContent: string;
    sourcePath: string;
    targetPath: string;
    rawContext?: string;
  }>,
  options: {
    model?: string;
    maxLength?: number;
  } = {}
): Promise<string[]> {
  // Por ahora, generar uno por uno
  // En el futuro se podría optimizar con batch processing
  const results: string[] = [];
  
  for (const context of contexts) {
    try {
      const smartContext = await generateSmartContext(
        context.sourceContent,
        context.sourcePath,
        context.targetPath,
        context.rawContext,
        options
      );
      results.push(smartContext);
    } catch (error) {
      logger.warn(`Error generating context for ${context.targetPath}, using fallback: ${error instanceof Error ? error.message : String(error)}`);
      results.push(context.rawContext || 'Referencia desde documento relacionado.');
    }
  }

  return results;
}

