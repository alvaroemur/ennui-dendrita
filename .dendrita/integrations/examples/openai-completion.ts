/**
 * EJEMPLO: Usar OpenAI desde dendrita
 * 
 * Este archivo muestra cómo usar ChatGPT y embeddings
 * sin exponer la API key en el código
 */

import { ChatService, ChatMessage } from '../services/openai/chat';
import { credentials } from '../utils/credentials';
import { createLogger } from '../utils/logger';

const logger = createLogger('OpenAIExample');

/**
 * Ejemplo 1: Verificar si OpenAI está configurado
 */
function checkOpenAISetup(): void {
  logger.info('Checking OpenAI setup...');

  const available = credentials.getAvailableServices();
  logger.info(`Available services: ${available.join(', ')}`);

  if (!credentials.hasOpenAI()) {
    logger.warn('OpenAI not configured. See hooks/openai-key-management.md');
    return;
  }

  logger.info('✅ OpenAI is configured and ready');
}

/**
 * Ejemplo 2: Chat simple
 */
async function simpleChat(): Promise<void> {
  try {
    const chat = new ChatService();

    if (!chat.isConfigured()) {
      logger.error('OpenAI not configured');
      return;
    }

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'Eres un asistente experto en dendrita y sistemas de integración.',
      },
      {
        role: 'user',
        content: '¿Cuáles son los beneficios de usar variables de entorno para credenciales?',
      },
    ];

    logger.info('Sending message to GPT-4...');

    const response = await chat.sendMessage(messages, {
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 500,
    });

    logger.info(`Response: ${response}`);
  } catch (error) {
    logger.error('Chat failed', error);
  }
}

/**
 * Ejemplo 3: Conversación multi-turno
 */
async function multiTurnConversation(): Promise<void> {
  try {
    const chat = new ChatService();

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'Eres un asistente amable y servicial.',
      },
    ];

    // Primer turno
    messages.push({
      role: 'user',
      content: '¿Cuál es la mejor práctica para manejar errores en APIs?',
    });

    let response = await chat.sendMessage(messages);
    logger.info(`Assistant: ${response}`);

    // Agregar respuesta al historial
    messages.push({
      role: 'assistant',
      content: response,
    });

    // Segundo turno - continuación
    messages.push({
      role: 'user',
      content: '¿Y cómo registramos estos errores de forma segura?',
    });

    response = await chat.sendMessage(messages);
    logger.info(`Assistant: ${response}`);
  } catch (error) {
    logger.error('Multi-turn conversation failed', error);
  }
}

/**
 * Ejemplo 4: Crear embeddings para búsqueda
 */
async function createEmbeddingExample(): Promise<void> {
  try {
    const chat = new ChatService();

    const textsToEmbed = [
      'Google Workspace es una suite de productividad en la nube',
      'Las credenciales nunca deben estar en el código fuente',
      'Dendrita es un sistema de integración seguro',
    ];

    logger.info('Creating embeddings for semantic search...');

    const embeddings = [];
    for (const text of textsToEmbed) {
      const embedding = await chat.createEmbedding(text);
      embeddings.push({ text, embedding });
      logger.info(`✓ Embedded: "${text.substring(0, 30)}..."`);
    }

    logger.info(`Created ${embeddings.length} embeddings`);

    // Embeddings se pueden usar para búsqueda semántica
    // Nota: La implementación completa incluiría cálculo de similitud
  } catch (error) {
    logger.error('Embedding creation failed', error);
  }
}

/**
 * Ejemplo 5: Analizar texto con OpenAI
 */
async function analyzeText(text: string): Promise<void> {
  try {
    const chat = new ChatService();

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `Analiza el siguiente texto y proporciona:
1. Tema principal
2. Sentimiento (positivo/negativo/neutral)
3. Palabras clave (máximo 5)

Responde en formato JSON.`,
      },
      {
        role: 'user',
        content: text,
      },
    ];

    logger.info('Analyzing text...');

    const response = await chat.sendMessage(messages, {
      model: 'gpt-3.5-turbo',
      temperature: 0.3,
      maxTokens: 200,
    });

    logger.info(`Analysis: ${response}`);
  } catch (error) {
    logger.error('Text analysis failed', error);
  }
}

// Export para uso desde otros módulos
export {
  checkOpenAISetup,
  simpleChat,
  multiTurnConversation,
  createEmbeddingExample,
  analyzeText,
};

// Si se ejecuta directamente:
if (require.main === module) {
  (async () => {
    checkOpenAISetup();
    await simpleChat();
  })().catch(logger.error);
}
