/**
 * Servicio de autenticación para Reddit API
 * Soporta OAuth 2.0 con client_id y client_secret
 */

import { credentials } from '../../utils/credentials';
import { createLogger } from '../../utils/logger';

// Helper para base64 encoding que funciona en Node.js y browser
function base64Encode(str: string): string {
  if (typeof btoa !== 'undefined') {
    // Browser environment
    return btoa(str);
  }
  // Node.js environment - manual base64 encoding
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;
  while (i < str.length) {
    const a = str.charCodeAt(i++);
    const b = i < str.length ? str.charCodeAt(i++) : 0;
    const c = i < str.length ? str.charCodeAt(i++) : 0;
    const bitmap = (a << 16) | (b << 8) | c;
    result += chars.charAt((bitmap >> 18) & 63);
    result += chars.charAt((bitmap >> 12) & 63);
    result += i - 2 < str.length ? chars.charAt((bitmap >> 6) & 63) : '=';
    result += i - 1 < str.length ? chars.charAt(bitmap & 63) : '=';
  }
  return result;
}

const logger = createLogger('RedditAuth');

export interface RedditCredentials {
  clientId: string;
  clientSecret: string;
  userAgent: string;
  username?: string;
  password?: string;
  accessToken?: string;
}

export class RedditAuth {
  /**
   * Obtiene las credenciales de Reddit de forma segura
   */
  static getCredentials(): RedditCredentials {
    try {
      const creds = credentials.getReddit();
      logger.debug('Reddit credentials loaded');
      return creds;
    } catch (error) {
      logger.error('Reddit credentials not configured', error);
      throw error;
    }
  }

  /**
   * Verifica que las credenciales estén configuradas
   */
  static isConfigured(): boolean {
    try {
      credentials.getReddit();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Valida que las credenciales tengan el formato correcto
   */
  static validateCredentials(creds: RedditCredentials): boolean {
    return !!(
      creds.clientId &&
      creds.clientSecret &&
      creds.userAgent &&
      creds.clientId.length > 10 &&
      creds.clientSecret.length > 10
    );
  }

  /**
   * Obtiene un access token usando OAuth 2.0 (script type)
   * Este método es para aplicaciones que actúan en nombre de un usuario
   */
  static async getAccessToken(): Promise<string> {
    const creds = this.getCredentials();

    // Si ya hay un access token válido, retornarlo
    if (creds.accessToken) {
      return creds.accessToken;
    }

    // Si hay username y password, obtener token con password grant
    if (creds.username && creds.password) {
      return await this.authenticateWithPassword(creds);
    }

    // Si no hay username/password, usar client credentials (limited access)
    return await this.authenticateWithClientCredentials(creds);
  }

  /**
   * Autentica usando username/password (OAuth 2.0 password grant)
   * Requiere: username, password, clientId, clientSecret
   */
  private static async authenticateWithPassword(
    creds: RedditCredentials
  ): Promise<string> {
    // Crear Basic Auth header
    const credentials = `${creds.clientId}:${creds.clientSecret}`;
    const encodedCredentials = base64Encode(credentials);

    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${encodedCredentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': creds.userAgent,
      },
      body: new URLSearchParams({
        grant_type: 'password',
        username: creds.username!,
        password: creds.password!,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Reddit authentication failed: ${error}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  /**
   * Autentica usando solo client credentials (OAuth 2.0 client credentials)
   * Limitado: solo lectura, no puede postear
   */
  private static async authenticateWithClientCredentials(
    creds: RedditCredentials
  ): Promise<string> {
    // Crear Basic Auth header
    const credentials = `${creds.clientId}:${creds.clientSecret}`;
    const encodedCredentials = base64Encode(credentials);

    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${encodedCredentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': creds.userAgent,
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Reddit authentication failed: ${error}`);
    }

    const data = await response.json();
    return data.access_token;
  }
}

