#!/usr/bin/env tsx
/**
 * Utilidades comunes para scripts del context-pipeline
 * 
 * Este archivo contiene funciones y constantes compartidas entre los scripts
 * del context-pipeline para evitar duplicación de código.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ProjectContext } from './context-types';

/**
 * Raíz del proyecto (directorio de trabajo actual)
 */
export const PROJECT_ROOT = process.cwd();

/**
 * Encuentra todos los proyectos activos en todos los workspaces
 * 
 * @param workspaceFilter - Opcional: filtrar por workspace específico
 * @returns Array de objetos con workspace y project
 */
export function findAllProjects(workspaceFilter?: string): Array<{ workspace: string; project: string }> {
  const projects: Array<{ workspace: string; project: string }> = [];
  const workspacesDir = path.join(PROJECT_ROOT, 'workspaces');

  if (!fs.existsSync(workspacesDir)) {
    return projects;
  }

  const workspaceEntries = fs.readdirSync(workspacesDir, { withFileTypes: true });

  for (const entry of workspaceEntries) {
    if (entry.isDirectory()) {
      const workspace = entry.name;
      
      if (workspaceFilter && workspace !== workspaceFilter) {
        continue;
      }

      const activeProjectsPath = path.join(workspacesDir, workspace, '🚀 active-projects');
      
      if (fs.existsSync(activeProjectsPath)) {
        const projectEntries = fs.readdirSync(activeProjectsPath, { withFileTypes: true });
        
        for (const projectEntry of projectEntries) {
          if (projectEntry.isDirectory()) {
            projects.push({
              workspace,
              project: projectEntry.name
            });
          }
        }
      }
    }
  }

  return projects;
}

/**
 * Obtiene el user_id del perfil del usuario
 * 
 * @returns El user_id del usuario activo
 * @throws Error si no se puede encontrar el user_id
 */
export function getUserId(): string {
  try {
    const usersDir = path.join(PROJECT_ROOT, '.dendrita', 'users');
    if (!fs.existsSync(usersDir)) {
      throw new Error('No users directory found');
    }

    const userDirs = fs.readdirSync(usersDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    if (userDirs.length === 0) {
      throw new Error('No user directories found');
    }

    const userId = process.env.USER_ID || process.env.DENDRITA_USER_ID || userDirs[0];
    const profilePath = path.join(usersDir, userId, 'profile.json');
    if (!fs.existsSync(profilePath)) {
      throw new Error(`Profile not found for user: ${userId}`);
    }

    return userId;
  } catch (error: any) {
    console.error('Failed to get user ID:', error.message);
    throw error;
  }
}

/**
 * Lee project_context.json de un proyecto
 * 
 * Soporta ambos formatos de nombre:
 * - project_context.json (actual)
 * - project-context.json (legacy)
 * 
 * @param workspace - Nombre del workspace
 * @param project - Nombre del proyecto
 * @returns ProjectContext o null si no existe
 */
export function loadProjectContext(workspace: string, project: string): ProjectContext | null {
  const projectPath = path.join(PROJECT_ROOT, 'workspaces', workspace, '🚀 active-projects', project);
  
  // Try both naming conventions: project_context.json (current) and project-context.json (legacy)
  let contextPath = path.join(projectPath, 'project_context.json');
  if (!fs.existsSync(contextPath)) {
    contextPath = path.join(projectPath, 'project-context.json');
  }

  if (!fs.existsSync(contextPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(contextPath, 'utf-8');
    return JSON.parse(content) as ProjectContext;
  } catch (error) {
    console.warn(`⚠️  Error reading project context for ${workspace}/${project}:`, error);
    return null;
  }
}

/**
 * Obtiene la fecha actual en formato ISO (YYYY-MM-DD)
 * 
 * @returns Fecha actual en formato ISO
 */
export function getCurrentDateISO(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Formatea una fecha en formato español legible
 * 
 * @param date - Fecha a formatear (opcional, usa fecha actual si no se proporciona)
 * @returns Fecha formateada como "DD de mes de AAAA"
 */
export function formatDateSpanish(date?: Date): string {
  const d = date || new Date();
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  return `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
}

/**
 * Formatea una fecha en formato ISO legible (YYYY-MM-DD)
 * 
 * @param date - Fecha a formatear (opcional, usa fecha actual si no se proporciona)
 * @returns Fecha formateada como "YYYY-MM-DD"
 */
export function formatDateISO(date?: Date): string {
  const d = date || new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

