#!/usr/bin/env npx ts-node
/**
 * Utilidades para cargar contexto según nivel (project, workspace, user)
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  ProjectContext,
  WorkspaceContext,
  UserContext,
} from '../../../utils/context-types';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('ContextLoader');

/**
 * Encuentra el directorio raíz del proyecto
 */
function findProjectRoot(): string {
  let currentDir = process.cwd();
  
  // Buscar hacia arriba hasta encontrar .dendrita/ o package.json en el raíz
  while (currentDir !== path.dirname(currentDir)) {
    const dendritaPath = path.join(currentDir, '.dendrita');
    const packageJsonPath = path.join(currentDir, 'package.json');
    
    if (fs.existsSync(dendritaPath) || fs.existsSync(packageJsonPath)) {
      // Verificar que también tenga workspaces/
      const workspacesPath = path.join(currentDir, 'workspaces');
      if (fs.existsSync(workspacesPath)) {
        return currentDir;
      }
    }
    
    currentDir = path.dirname(currentDir);
  }
  
  // Fallback: usar process.cwd()
  return process.cwd();
}

const PROJECT_ROOT = findProjectRoot();

/**
 * Extrae workspace de la ruta
 */
export function extractWorkspace(filePath: string): string | undefined {
  const workspaceMatch = filePath.match(/workspaces\/([^\/]+)/);
  return workspaceMatch ? workspaceMatch[1] : undefined;
}

/**
 * Extrae project de la ruta
 */
export function extractProject(filePath: string): string | undefined {
  // Buscar en active-projects o archived-projects
  const activeMatch = filePath.match(/(?:active-projects|🚀 active-projects)\/([^\/]+)/);
  const archivedMatch = filePath.match(/(?:archived-projects|\.archived-projects)\/([^\/]+)/);
  
  if (activeMatch) return activeMatch[1];
  if (archivedMatch) return archivedMatch[1];
  return undefined;
}

/**
 * Obtiene el user_id del perfil del usuario
 */
function getUserId(): string {
  try {
    const usersDir = path.join(PROJECT_ROOT, '.dendrita', 'users');
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
 * Carga project-context.json
 */
export function loadProjectContext(workspace: string, project: string): ProjectContext | null {
  try {
    const projectContextPath = path.join(
      PROJECT_ROOT,
      'workspaces',
      workspace,
      '🚀 active-projects',
      project,
      'project-context.json'
    );

    if (!fs.existsSync(projectContextPath)) {
      logger.warn(`Project context not found: ${projectContextPath}`);
      return null;
    }

    const content = fs.readFileSync(projectContextPath, 'utf-8');
    const projectContext = JSON.parse(content) as ProjectContext;
    logger.info(`✅ Project context loaded: ${workspace}/${project}`);
    return projectContext;
  } catch (error: any) {
    logger.error(`Error loading project context: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

/**
 * Encuentra el directorio del workspace (puede tener emojis)
 */
function findWorkspaceDir(workspaceName: string): string | null {
  const workspacesDir = path.join(PROJECT_ROOT, 'workspaces');
  if (!fs.existsSync(workspacesDir)) {
    return null;
  }

  const entries = fs.readdirSync(workspacesDir, { withFileTypes: true });
  
  // Buscar coincidencia exacta primero
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name === workspaceName) {
      return entry.name;
    }
  }

  // Buscar coincidencia parcial (sin emojis)
  const normalizedName = workspaceName.toLowerCase().replace(/[^\w\s]/g, '').trim();
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const normalizedEntry = entry.name.toLowerCase().replace(/[^\w\s]/g, '').trim();
      if (normalizedEntry === normalizedName || normalizedEntry.includes(normalizedName) || normalizedName.includes(normalizedEntry)) {
        return entry.name;
      }
    }
  }

  return null;
}

/**
 * Carga workspace context.json
 */
export function loadWorkspaceContext(workspace: string): WorkspaceContext | null {
  try {
    const workspaceDir = findWorkspaceDir(workspace);
    if (!workspaceDir) {
      logger.warn(`Workspace directory not found: ${workspace}`);
      return null;
    }

    const workspaceContextPath = path.join(
      PROJECT_ROOT,
      'workspaces',
      workspaceDir,
      'context.json'
    );

    if (!fs.existsSync(workspaceContextPath)) {
      logger.warn(`Workspace context not found: ${workspaceContextPath}`);
      return null;
    }

    const content = fs.readFileSync(workspaceContextPath, 'utf-8');
    const workspaceContext = JSON.parse(content) as WorkspaceContext;
    logger.info(`✅ Workspace context loaded: ${workspaceDir}`);
    return workspaceContext;
  } catch (error: any) {
    logger.error(`Error loading workspace context: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

/**
 * Carga user context.json
 */
export function loadUserContext(): UserContext | null {
  try {
    const userId = getUserId();
    const userContextPath = path.join(
      PROJECT_ROOT,
      '.dendrita',
      'users',
      userId,
      'context.json'
    );

    if (!fs.existsSync(userContextPath)) {
      logger.warn(`User context not found: ${userContextPath}`);
      return null;
    }

    const content = fs.readFileSync(userContextPath, 'utf-8');
    const userContext = JSON.parse(content) as UserContext;
    logger.info(`✅ User context loaded: ${userId}`);
    return userContext;
  } catch (error: any) {
    logger.error(`Error loading user context: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

