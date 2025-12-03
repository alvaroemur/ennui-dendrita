/**
 * Servicio de Chat Completions para OpenAI
 */

import { BaseService } from '../base/service.interface';
import { OpenAIAuth } from './auth';
import { createLogger } from '../../utils/logger';

const logger = createLogger('OpenAI');

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  responseFormat?: { type: 'json_object' | 'text' };
}

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatCompletionResponse {
  content: string;
  usage?: TokenUsage;
}

export class ChatService extends BaseService {
  name = 'OpenAI';
  private apiKey?: string;

  constructor() {
    super();
    this.apiKey = OpenAIAuth.getApiKey();
  }

  isConfigured(): boolean {
    return OpenAIAuth.isConfigured();
  }

  /**
   * Envía un mensaje y obtiene una respuesta usando Chat Completions API
   */
  async sendMessage(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {}
  ): Promise<string> {
    const result = await this.sendMessageWithUsage(messages, options);
    return result.content;
  }

  /**
   * Envía un mensaje y obtiene una respuesta con información de uso de tokens
   */
  async sendMessageWithUsage(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {}
  ): Promise<ChatCompletionResponse> {
    try {
      if (!this.apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const {
        model = 'gpt-4',
        temperature = 0.7,
        maxTokens = 2000,
        topP = 1,
      } = options;

      logger.info(`Sending message to ${model}...`);

      const requestBody: any = {
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        top_p: topP,
      };

      if (options.responseFormat) {
        requestBody.response_format = options.responseFormat;
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      // Extraer información de uso de tokens
      const usage: TokenUsage | undefined = data.usage ? {
        prompt_tokens: data.usage.prompt_tokens || 0,
        completion_tokens: data.usage.completion_tokens || 0,
        total_tokens: data.usage.total_tokens || 0,
      } : undefined;

      // Loggear uso de tokens
      if (usage) {
        logger.info(`Token usage: ${usage.total_tokens} total (${usage.prompt_tokens} prompt + ${usage.completion_tokens} completion)`);
      }

      return {
        content: data.choices[0].message.content,
        usage,
      };
    } catch (error) {
      logger.error('Chat completion failed', error);
      throw error;
    }
  }

  /**
   * Genera embeddings para búsqueda semántica
   */
  async createEmbedding(text: string): Promise<number[]> {
    try {
      if (!this.apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      logger.info('Creating embedding...');

      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: text,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      logger.error('Embedding creation failed', error);
      throw error;
    }
  }
}
