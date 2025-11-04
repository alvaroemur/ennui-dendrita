/**
 * Servicio de autenticación para Asana
 * Maneja Personal Access Token authentication
 */

import { credentials } from '../../utils/credentials';
import { createLogger } from '../../utils/logger';
import { AuthenticationError } from '../../utils/error-handler';

const logger = createLogger('AsanaAuth');

export class AsanaAuth {
  /**
   * Obtiene el Personal Access Token configurado
   */
  static getAccessToken(): string {
    try {
      const creds = credentials.getAsana();
      return creds.accessToken;
    } catch (error) {
      logger.error('Failed to get Asana access token', error);
      throw new AuthenticationError(
        'Asana',
        'Personal Access Token not configured. See .dendrita/integrations/hooks/asana-setup.md'
      );
    }
  }

  /**
   * Verifica si las credenciales de Asana están correctamente configuradas
   */
  static isConfigured(): boolean {
    try {
      credentials.getAsana();
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
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }
}

