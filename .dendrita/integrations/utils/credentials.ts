/**
 * Utilidad para cargar credenciales de forma segura
 * Soporta variables de entorno y archivo .env.local
 */

import * as fs from 'fs';
import * as path from 'path';

export interface Credentials {
  google?: {
    workspace?: {
      clientId: string;
      clientSecret: string;
      refreshToken: string;
    };
  };
  openai?: {
    apiKey: string;
  };
  supabase?: {
    url: string;
    anonKey?: string;
    serviceRoleKey?: string;
    dbUrl?: string;
  };
  reddit?: {
    clientId: string;
    clientSecret: string;
    userAgent: string;
    username?: string;
    password?: string;
    accessToken?: string;
  };
  clickup?: {
    accessToken: string;
  };
  asana?: {
    accessToken: string;
  };
  notion?: {
    integrationToken: string;
  };
}

class CredentialsLoader {
  private loaded: Credentials = {};

  constructor() {
    this.initialize();
  }

  /**
   * Inicializa el cargador de credenciales
   * Intenta cargar desde:
   * 1. Variables de entorno
   * 2. Archivo .env.local en .dendrita/
   */
  private initialize(): void {
    // Cargar desde variables de entorno
    this.loadFromEnv();

    // Intenta cargar desde .env.local si existe
    this.tryLoadFromFile();
  }

  private loadFromEnv(): void {
    // Google Workspace
    if (
      process.env.GOOGLE_WORKSPACE_CLIENT_ID &&
      process.env.GOOGLE_WORKSPACE_CLIENT_SECRET &&
      process.env.GOOGLE_WORKSPACE_REFRESH_TOKEN
    ) {
      this.loaded.google = {
        workspace: {
          clientId: process.env.GOOGLE_WORKSPACE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_WORKSPACE_CLIENT_SECRET,
          refreshToken: process.env.GOOGLE_WORKSPACE_REFRESH_TOKEN,
        },
      };
    }

    // OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.loaded.openai = {
        apiKey: process.env.OPENAI_API_KEY,
      };
    }

    // Supabase
    if (process.env.SUPABASE_URL) {
      this.loaded.supabase = {
        url: process.env.SUPABASE_URL,
        anonKey: process.env.SUPABASE_ANON_KEY,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        dbUrl: process.env.SUPABASE_DB_URL,
      };
    }

    // Reddit
    if (process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET && process.env.REDDIT_USER_AGENT) {
      this.loaded.reddit = {
        clientId: process.env.REDDIT_CLIENT_ID,
        clientSecret: process.env.REDDIT_CLIENT_SECRET,
        userAgent: process.env.REDDIT_USER_AGENT,
        username: process.env.REDDIT_USERNAME,
        password: process.env.REDDIT_PASSWORD,
        accessToken: process.env.REDDIT_ACCESS_TOKEN,
      };
    }

    // ClickUp
    if (process.env.CLICKUP_ACCESS_TOKEN) {
      this.loaded.clickup = {
        accessToken: process.env.CLICKUP_ACCESS_TOKEN,
      };
    }

    // Asana
    if (process.env.ASANA_ACCESS_TOKEN) {
      this.loaded.asana = {
        accessToken: process.env.ASANA_ACCESS_TOKEN,
      };
    }

    // Notion
    if (process.env.NOTION_INTEGRATION_TOKEN) {
      this.loaded.notion = {
        integrationToken: process.env.NOTION_INTEGRATION_TOKEN,
      };
    }
  }

  private tryLoadFromFile(): void {
    const envPath = path.join(__dirname, '../../.env.local');

    if (!fs.existsSync(envPath)) {
      return;
    }

    try {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      this.parseEnvFile(envContent);
    } catch (error) {
      console.warn(`[Credentials] No se pudo leer ${envPath}:`, error);
    }
  }

  private parseEnvFile(content: string): void {
    const lines = content.split('\n');

    const envVars: Record<string, string> = {};
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const [key, ...valueParts] = trimmed.split('=');
      if (key) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }

    // Google
    if (
      envVars.GOOGLE_WORKSPACE_CLIENT_ID &&
      envVars.GOOGLE_WORKSPACE_CLIENT_SECRET &&
      envVars.GOOGLE_WORKSPACE_REFRESH_TOKEN
    ) {
      this.loaded.google = {
        workspace: {
          clientId: envVars.GOOGLE_WORKSPACE_CLIENT_ID,
          clientSecret: envVars.GOOGLE_WORKSPACE_CLIENT_SECRET,
          refreshToken: envVars.GOOGLE_WORKSPACE_REFRESH_TOKEN,
        },
      };
    }

    // OpenAI
    if (envVars.OPENAI_API_KEY) {
      this.loaded.openai = {
        apiKey: envVars.OPENAI_API_KEY,
      };
    }

    // Supabase
    if (envVars.SUPABASE_URL) {
      this.loaded.supabase = {
        url: envVars.SUPABASE_URL,
        anonKey: envVars.SUPABASE_ANON_KEY,
        serviceRoleKey: envVars.SUPABASE_SERVICE_ROLE_KEY,
        dbUrl: envVars.SUPABASE_DB_URL,
      };
    }

    // Reddit
    if (envVars.REDDIT_CLIENT_ID && envVars.REDDIT_CLIENT_SECRET && envVars.REDDIT_USER_AGENT) {
      this.loaded.reddit = {
        clientId: envVars.REDDIT_CLIENT_ID,
        clientSecret: envVars.REDDIT_CLIENT_SECRET,
        userAgent: envVars.REDDIT_USER_AGENT,
        username: envVars.REDDIT_USERNAME,
        password: envVars.REDDIT_PASSWORD,
        accessToken: envVars.REDDIT_ACCESS_TOKEN,
      };
    }

    // ClickUp
    if (envVars.CLICKUP_ACCESS_TOKEN) {
      this.loaded.clickup = {
        accessToken: envVars.CLICKUP_ACCESS_TOKEN,
      };
    }

    // Asana
    if (envVars.ASANA_ACCESS_TOKEN) {
      this.loaded.asana = {
        accessToken: envVars.ASANA_ACCESS_TOKEN,
      };
    }

    // Notion
    if (envVars.NOTION_INTEGRATION_TOKEN) {
      this.loaded.notion = {
        integrationToken: envVars.NOTION_INTEGRATION_TOKEN,
      };
    }
  }

  /**
   * Obtiene credenciales de Google Workspace
   */
  getGoogleWorkspace() {
    if (!this.loaded.google?.workspace) {
      throw new Error(
        'Google Workspace credentials not configured. See .dendrita/integrations/hooks/google-auth-flow.md'
      );
    }
    return this.loaded.google.workspace;
  }

  /**
   * Obtiene API key de OpenAI
   */
  getOpenAIKey(): string {
    if (!this.loaded.openai?.apiKey) {
      throw new Error(
        'OpenAI credentials not configured. Set OPENAI_API_KEY in environment or .env.local'
      );
    }
    return this.loaded.openai.apiKey;
  }

  /**
   * Obtiene configuración de Supabase
   */
  getSupabase() {
    if (!this.loaded.supabase?.url) {
      throw new Error(
        'Supabase not configured. Set SUPABASE_URL (+ keys) in .env.local'
      );
    }
    return this.loaded.supabase;
  }

  /**
   * Obtiene credenciales de Reddit
   */
  getReddit() {
    if (!this.loaded.reddit?.clientId || !this.loaded.reddit?.clientSecret || !this.loaded.reddit?.userAgent) {
      throw new Error(
        'Reddit credentials not configured. Set REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, and REDDIT_USER_AGENT in .env.local'
      );
    }
    return this.loaded.reddit;
  }

  /**
   * Obtiene credenciales de ClickUp
   */
  getClickUp() {
    if (!this.loaded.clickup?.accessToken) {
      throw new Error(
        'ClickUp credentials not configured. Set CLICKUP_ACCESS_TOKEN in .env.local. See .dendrita/integrations/hooks/clickup-setup.md'
      );
    }
    return this.loaded.clickup;
  }

  /**
   * Obtiene credenciales de Asana
   */
  getAsana() {
    if (!this.loaded.asana?.accessToken) {
      throw new Error(
        'Asana credentials not configured. Set ASANA_ACCESS_TOKEN in .env.local. See .dendrita/integrations/hooks/asana-setup.md'
      );
    }
    return this.loaded.asana;
  }

  /**
   * Obtiene credenciales de Notion
   */
  getNotion() {
    if (!this.loaded.notion?.integrationToken) {
      throw new Error(
        'Notion credentials not configured. Set NOTION_INTEGRATION_TOKEN in .env.local. See .dendrita/integrations/hooks/notion-setup.md'
      );
    }
    return this.loaded.notion;
  }

  /**
   * Comprueba si las credenciales están disponibles
   */
  hasGoogleWorkspace(): boolean {
    return !!this.loaded.google?.workspace;
  }

  hasOpenAI(): boolean {
    return !!this.loaded.openai?.apiKey;
  }

  hasSupabase(): boolean {
    return !!this.loaded.supabase?.url;
  }

  hasReddit(): boolean {
    return !!(
      this.loaded.reddit?.clientId &&
      this.loaded.reddit?.clientSecret &&
      this.loaded.reddit?.userAgent
    );
  }

  hasClickUp(): boolean {
    return !!this.loaded.clickup?.accessToken;
  }

  hasAsana(): boolean {
    return !!this.loaded.asana?.accessToken;
  }

  hasNotion(): boolean {
    return !!this.loaded.notion?.integrationToken;
  }

  /**
   * IMPORTANTE: Nunca retorna credenciales en logs o strings
   */
  getAvailableServices(): string[] {
    const services: string[] = [];
    if (this.hasGoogleWorkspace()) services.push('Google Workspace');
    if (this.hasOpenAI()) services.push('OpenAI');
    if (this.hasSupabase()) services.push('Supabase');
    if (this.hasReddit()) services.push('Reddit');
    if (this.hasClickUp()) services.push('ClickUp');
    if (this.hasAsana()) services.push('Asana');
    if (this.hasNotion()) services.push('Notion');
    return services;
  }
}

export const credentials = new CredentialsLoader();

export async function loadCredentials(): Promise<Credentials> {
  return {
    google: credentials.hasGoogleWorkspace() ? { workspace: credentials.getGoogleWorkspace() } : undefined,
    openai: credentials.hasOpenAI() ? { apiKey: credentials.getOpenAIKey() } : undefined,
    supabase: credentials.hasSupabase() ? credentials.getSupabase() : undefined,
    reddit: credentials.hasReddit() ? credentials.getReddit() : undefined,
    clickup: credentials.hasClickUp() ? credentials.getClickUp() : undefined,
    asana: credentials.hasAsana() ? credentials.getAsana() : undefined,
    notion: credentials.hasNotion() ? credentials.getNotion() : undefined,
  };
}
