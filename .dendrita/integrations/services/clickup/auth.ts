/**
 * Servicio de autenticación para ClickUp
 * Maneja Personal Access Token authentication
 */

import { credentials } from '../../utils/credentials';
import { createLogger } from '../../utils/logger';
import { AuthenticationError } from '../../utils/error-handler';

const logger = createLogger('ClickUpAuth');

export class ClickUpAuth {
  /**
   * Obtiene el Personal Access Token configurado
   */
  static getAccessToken(): string {
    try {
      const creds = credentials.getClickUp();
      return creds.accessToken;
    } catch (error) {
      logger.error('Failed to get ClickUp access token', error);
      throw new AuthenticationError(
        'ClickUp',
        'Personal Access Token not configured. See .dendrita/integrations/hooks/clickup-setup.md'
      );
    }
  }

  /**
   * Verifica si las credenciales de ClickUp están correctamente configuradas
   */
  static isConfigured(): boolean {
    try {
      credentials.getClickUp();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Obtiene los headers de autenticación para las requests
   */
  static getAuthHeaders(): Record<string, string> {
    const token = this.getAccessToken();
    return {
      'Authorization': token,
      'Content-Type': 'application/json',
    };
  }
}

