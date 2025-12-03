/**
 * Utilidades compartidas para el Drive Scraper Pipeline
 */

import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from '../../utils/logger';

const logger = createLogger('DriveScraperUtils');

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
export function getUserId(): string {
  try {
    const usersDir = path.join(process.cwd(), '.dendrita', 'users');
    if (!fs.existsSync(usersDir)) {
      throw new Error('No users directory found');
    }

    const userDirs = fs.readdirSync(usersDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
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
 * Obtiene el workspace del perfil del usuario
 */
export function getWorkspace(userId: string): string | undefined {
  try {
    const profilePath = path.join(process.cwd(), '.dendrita', 'users', userId, 'profile.json');
    if (!fs.existsSync(profilePath)) {
      return undefined;
    }

    const profileContent = fs.readFileSync(profilePath, 'utf-8');
    const profile = JSON.parse(profileContent);
    
    return profile.workspace || profile.primary_workspace || undefined;
  } catch (error) {
    logger.error('Failed to get workspace from profile', error);
    return undefined;
  }
}

/**
 * Carga configuración de scraping desde archivo scrapers-config.json del workspace
 */
export function loadWorkspaceScrapersConfig(workspace: string): any {
  try {
    const configPath = path.join(
      process.cwd(),
      'workspaces',
      workspace,
      'scrapers-config.json'
    );

    if (!fs.existsSync(configPath)) {
      logger.warn(`Scrapers config not found: ${configPath}, using defaults`);
      return null;
    }

    const configContent = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(configContent);
  } catch (error: any) {
    logger.error(`Failed to load workspace scrapers config: ${error.message}`);
    return null;
  }
}

/**
 * Combina configuración del pipeline con configuración del workspace
 */
export function mergeConfigs(
  pipelineConfig: any,
  workspaceConfig: any
): any {
  const defaults = pipelineConfig.default_settings || {};
  const workspaceDefaults = workspaceConfig?.default_settings || {};

  return {
    max_results: workspaceDefaults.max_results ?? defaults.max_results ?? 1000,
    extract_permissions: workspaceDefaults.extract_permissions ?? defaults.extract_permissions ?? true,
    extract_revisions: workspaceDefaults.extract_revisions ?? defaults.extract_revisions ?? false,
    extract_content: workspaceDefaults.extract_content ?? defaults.extract_content ?? false,
    extract_metadata: workspaceDefaults.extract_metadata ?? defaults.extract_metadata ?? true,
    extract_thumbnail: workspaceDefaults.extract_thumbnail ?? defaults.extract_thumbnail ?? false,
    include_subfolders: workspaceDefaults.include_subfolders ?? defaults.include_subfolders ?? true,
  };
}

