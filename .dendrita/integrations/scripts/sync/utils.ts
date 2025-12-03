/**
 * Utilidades compartidas para el Sync Pipeline
 */

import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from '../../utils/logger';

const logger = createLogger('SyncPipelineUtils');

/**
 * Carga configuración desde archivo JSON en el mismo directorio del pipeline
 */
export function loadConfig<T>(filename: string = 'config.json'): T {
  const configPath = path.join(__dirname, filename);
  
  if (!fs.existsSync(configPath)) {
    logger.warn(`Config file not found: ${configPath}, using defaults`);
    return {} as T;
  }
  
  try {
    const configContent = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(configContent);
  } catch (error: any) {
    logger.error(`Failed to load config: ${error.message}`);
    throw error;
  }
}

/**
 * Obtiene el user_id del perfil del usuario
 */
function getUserId(): string {
  try {
    const usersDir = path.join(process.cwd(), '.dendrita', 'users');
    if (!fs.existsSync(usersDir)) {
      throw new Error('No users directory found');
    }

    const userDirs = fs.readdirSync(usersDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory() && dirent.name !== 'example-user')
      .map(dirent => dirent.name);

    if (userDirs.length === 0) {
      throw new Error('No user directories found');
    }

    const userId = process.env.USER_ID || userDirs[0];
    const profilePath = path.join(usersDir, userId, 'profile.json');
    if (!fs.existsSync(profilePath)) {
      throw new Error(`Profile not found for user: ${userId}`);
    }

    return userId;
  } catch (error: any) {
    logger.error('Failed to get user ID', error);
    throw error;
  }
}

/**
 * Carga configuración de sincronización desde archivo sync-config.json
 */
export function loadSyncConfig(): any {
  try {
    const userId = getUserId();
    const configPath = path.join(
      process.cwd(),
      '.dendrita',
      'users',
      userId,
      'config',
      'sync-config.json'
    );

    if (!fs.existsSync(configPath)) {
      logger.warn(`Sync config not found: ${configPath}, using defaults`);
      return null;
    }

    const configContent = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(configContent);
  } catch (error: any) {
    logger.error(`Failed to load sync config: ${error.message}`);
    return null;
  }
}

/**
 * Lista directorios en una ruta
 */
export function listDirs(dir: string): string[] {
  return fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((d) => fs.statSync(path.join(dir, d)).isDirectory())
    : [];
}

/**
 * Lista archivos en una ruta con un predicado
 */
export function listFiles(dir: string, predicate: (f: string) => boolean): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => fs.statSync(path.join(dir, f)).isFile())
    .filter(predicate);
}

/**
 * Detecta el tipo de documento basado en el nombre
 */
export function detectDocType(name: string): 'current_context' | 'master_plan' | 'tasks' | 'readme' | 'other' {
  const low = name.toLowerCase();
  if (low === 'current_context.md') return 'current_context';
  if (low === 'master_plan.md') return 'master_plan';
  if (low === 'tasks.md') return 'tasks';
  if (low === 'readme.md') return 'readme';
  return 'other';
}

/**
 * Construye un slug para un documento
 */
export function buildSlug(projectCode: string, name: string): string {
  const base = name.replace(/\.[^.]+$/, '').toLowerCase().replace(/\s+/g, '-');
  return `${projectCode}/${base}`;
}

