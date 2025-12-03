/**
 * Servicio de autenticación para Google Workspace
 * Maneja OAuth 2.0 flow sin exponer credenciales
 */

import { credentials } from '../../utils/credentials';
import { createLogger } from '../../utils/logger';

const logger = createLogger('GoogleAuth');

export interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class GoogleAuth {
  private static readonly SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.modify', // Para modificar mensajes y aplicar etiquetas
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/documents', // Para actualizar Google Docs
  ];

  /**
   * Obtiene el URL de autorización (primera vez)
   * El usuario debe visitar este URL y autorizar acceso
   */
  static getAuthorizationUrl(): string {
    try {
      const creds = credentials.getGoogleWorkspace();
      const clientId = creds.clientId;
      const redirectUri = 'http://localhost:3000/auth/google/callback';

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: this.SCOPES.join(' '),
        access_type: 'offline',
        prompt: 'consent',
      });

      const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      logger.info('Authorization URL generated');
      return url;
    } catch (error) {
      logger.error('Failed to generate authorization URL', error);
      throw error;
    }
  }

  /**
   * Intercambia el código de autorización por tokens
   * Este proceso debe ocurrir una sola vez
   */
  static async exchangeAuthorizationCode(code: string): Promise<GoogleTokens> {
    try {
      const creds = credentials.getGoogleWorkspace();

      const tokenEndpoint = 'https://oauth2.googleapis.com/token';
      const redirectUri = 'http://localhost:3000/auth/google/callback';

      const body = new URLSearchParams({
        code,
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      });

      logger.info('Exchanging authorization code for tokens...');

      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to exchange code: ${response.status} - ${errorText}`);
      }

      const tokens = await response.json();

      if (!tokens.access_token || !tokens.refresh_token) {
        throw new Error('Invalid token response from Google');
      }

      logger.info('Successfully exchanged authorization code for tokens');

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in || 3600,
      };
    } catch (error) {
      logger.error('Failed to exchange authorization code', error);
      throw error;
    }
  }

  /**
   * Usa el refresh token para obtener un nuevo access token
   */
  static async refreshAccessToken(): Promise<string> {
    try {
      const creds = credentials.getGoogleWorkspace();

      logger.debug('Refreshing access token using refresh token...');

      const tokenEndpoint = 'https://oauth2.googleapis.com/token';
      const body = new URLSearchParams({
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
        refresh_token: creds.refreshToken,
        grant_type: 'refresh_token',
      });

      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to refresh token: ${response.status} - ${errorText}`);
      }

      const tokens = await response.json();

      if (!tokens.access_token) {
        throw new Error('Invalid token response from Google');
      }

      logger.debug('Successfully refreshed access token');
      return tokens.access_token;
    } catch (error) {
      logger.error('Failed to refresh access token', error);
      throw error;
    }
  }

  /**
   * Verifica si las credenciales de Google están correctamente configuradas
   */
  static isConfigured(): boolean {
    try {
      credentials.getGoogleWorkspace();
      return true;
    } catch {
      return false;
    }
  }
}
