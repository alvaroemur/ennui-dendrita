/**
 * Servicio de autenticación para OpenAI
 * Simple: solo requiere API key en variables de entorno
 */

import { credentials } from '../../utils/credentials';
import { createLogger } from '../../utils/logger';

const logger = createLogger('OpenAIAuth');

export class OpenAIAuth {
  /**
   * Obtiene la API key de OpenAI de forma segura
   */
  static getApiKey(): string {
    try {
      const key = credentials.getOpenAIKey();
      logger.debug('OpenAI API key loaded');
      return key;
    } catch (error) {
      logger.error('OpenAI API key not configured', error);
      throw error;
    }
  }

  /**
   * Verifica que la API key esté configurada
   */
  static isConfigured(): boolean {
    try {
      credentials.getOpenAIKey();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Valida que la API key tenga el formato correcto
   */
  static validateKeyFormat(key: string): boolean {
    // Las keys de OpenAI comienzan con "sk-"
    return key.startsWith('sk-') && key.length > 10;
  }
}
