/**
 * Servicio de autenticación para Notion
 * Maneja Integration Token authentication (OAuth)
 */

import { credentials } from '../../utils/credentials';
import { createLogger } from '../../utils/logger';
import { AuthenticationError } from '../../utils/error-handler';

const logger = createLogger('NotionAuth');

export class NotionAuth {
  /**
   * Obtiene el Integration Token configurado
   */
  static getIntegrationToken(): string {
    try {
      const creds = credentials.getNotion();
      return creds.integrationToken;
    } catch (error) {
      logger.error('Failed to get Notion integration token', error);
      throw new AuthenticationError(
        'Notion',
        'Integration Token not configured. See .dendrita/integrations/hooks/notion-setup.md'
      );
    }
  }

  /**
   * Verifica si las credenciales de Notion están correctamente configuradas
   */
  static isConfigured(): boolean {
    try {
      credentials.getNotion();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Obtiene los headers de autenticación para las requests
   */
  static getAuthHeaders(): Record<string, string> {
    const token = this.getIntegrationToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    };
  }
}

