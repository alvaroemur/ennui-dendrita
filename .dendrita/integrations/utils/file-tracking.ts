/**
 * Sistema de tracking de archivos trabajados por scripts
 * 
 * Registra qué archivos fueron modificados por qué scripts,
 * permitiendo rastrear el origen de las modificaciones.
 * 
 * El tracking se almacena en `.dendrita/users/[user-id]/.tracking/` para mantener
 * la información sensible fuera del repositorio (ya que .dendrita/users/ está en .gitignore).
 */

import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from './logger';

const logger = createLogger('FileTracking');

/**
 * Encuentra el directorio raíz del proyecto
 * Busca hacia arriba desde process.cwd() hasta encontrar .dendrita/ y workspaces/
 * Esto previene que se creen carpetas anidadas cuando los scripts se ejecutan desde subdirectorios
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

export interface ModificationRecord {
  timestamp: string;
  scriptPath: string;
  targetFile: string;
  sourceFiles: string[];
  operation: string;
  metadata?: Record<string, any>;
}

export interface ProcessingRecord {
  timestamp: string;
  filePath: string;
  processor: string;
  contentHash: string;
  analysisHash?: string;
  metadata?: Record<string, any>;
}

interface TrackingData {
  modifications: ModificationRecord[];
  processing: ProcessingRecord[];
  lastUpdated: string;
}

/**
 * Obtiene el user_id del perfil del usuario
 */
function getUserId(): string {
  try {
    const projectRoot = findProjectRoot();
    const usersDir = path.join(projectRoot, '.dendrita', 'users');
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
 * Obtiene la ruta del archivo de tracking basado en el user-id
 */
function getTrackingFilePath(): string {
  try {
    const projectRoot = findProjectRoot();
    const userId = getUserId();
    const trackingDir = path.join(projectRoot, '.dendrita', 'users', userId, '.tracking');
    return path.join(trackingDir, 'file-modifications.json');
  } catch (error) {
    // Fallback a ubicación temporal si no se puede obtener user-id
    const projectRoot = findProjectRoot();
    logger.warn(`Could not get user ID, using fallback location: ${error instanceof Error ? error.message : String(error)}`);
    return path.join(projectRoot, '.dendrita', '.tracking', 'file-modifications.json');
  }
}

const TRACKING_FILE = getTrackingFilePath();

/**
 * Asegura que el directorio de tracking existe
 */
function ensureTrackingDir(): void {
  // Recalcular la ruta en caso de que el user-id haya cambiado
  const trackingFile = getTrackingFilePath();
  const trackingDir = path.dirname(trackingFile);
  if (!fs.existsSync(trackingDir)) {
    fs.mkdirSync(trackingDir, { recursive: true });
  }
}

/**
 * Carga los datos de tracking desde el archivo
 */
function loadTrackingData(): TrackingData {
  ensureTrackingDir();
  
  const trackingFile = getTrackingFilePath();
  
  if (!fs.existsSync(trackingFile)) {
    return {
      modifications: [],
      processing: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  try {
    const content = fs.readFileSync(trackingFile, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    logger.warn(`Error loading tracking data, starting fresh: ${error instanceof Error ? error.message : String(error)}`);
    return {
      modifications: [],
      processing: [],
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Guarda los datos de tracking en el archivo
 */
function saveTrackingData(data: TrackingData): void {
  ensureTrackingDir();
  
  const trackingFile = getTrackingFilePath();
  
  try {
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(trackingFile, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    logger.error('Error saving tracking data', error);
    throw error;
  }
}

/**
 * Normaliza rutas para consistencia
 */
function normalizePath(filePath: string, projectRoot?: string): string {
  if (!projectRoot) {
    projectRoot = findProjectRoot();
  }
  try {
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(projectRoot, filePath);
    return path.normalize(absolutePath);
  } catch (error) {
    return filePath;
  }
}

/**
 * Registra una modificación de archivo
 */
export function trackFileModification(
  scriptPath: string,
  targetFile: string,
  sourceFiles: string[] = [],
  operation: string = 'unknown',
  metadata?: Record<string, any>,
  projectRoot?: string
): void {
  if (!projectRoot) {
    projectRoot = findProjectRoot();
  }
  try {
    const data = loadTrackingData();
    
    const record: ModificationRecord = {
      timestamp: new Date().toISOString(),
      scriptPath: normalizePath(scriptPath, projectRoot),
      targetFile: normalizePath(targetFile, projectRoot),
      sourceFiles: sourceFiles.map(f => normalizePath(f, projectRoot)),
      operation,
      metadata,
    };

    data.modifications.push(record);
    
    // Mantener solo los últimos 1000 registros para evitar que el archivo crezca demasiado
    if (data.modifications.length > 1000) {
      data.modifications = data.modifications.slice(-1000);
    }

    saveTrackingData(data);
    logger.debug(`Tracked modification: ${operation} on ${targetFile} by ${scriptPath}`);
  } catch (error) {
    logger.error('Error tracking file modification', error);
    // No lanzar error para no interrumpir el flujo principal
  }
}

/**
 * Obtiene todas las modificaciones registradas para un archivo
 */
export function getTrackedModifications(
  targetFile: string,
  projectRoot?: string
): ModificationRecord[] {
  if (!projectRoot) {
    projectRoot = findProjectRoot();
  }
  try {
    const data = loadTrackingData();
    const normalizedTarget = normalizePath(targetFile, projectRoot);
    
    return data.modifications.filter(
      record => normalizePath(record.targetFile, projectRoot) === normalizedTarget
    );
  } catch (error) {
    logger.error('Error getting tracked modifications', error);
    return [];
  }
}

/**
 * Obtiene todos los archivos modificados por un script específico
 */
export function getFilesModifiedByScript(
  scriptPath: string,
  projectRoot?: string
): string[] {
  if (!projectRoot) {
    projectRoot = findProjectRoot();
  }
  try {
    const data = loadTrackingData();
    const normalizedScript = normalizePath(scriptPath, projectRoot);
    
    const files = data.modifications
      .filter(record => normalizePath(record.scriptPath, projectRoot) === normalizedScript)
      .map(record => record.targetFile);
    
    // Eliminar duplicados
    return Array.from(new Set(files));
  } catch (error) {
    logger.error('Error getting files modified by script', error);
    return [];
  }
}

/**
 * Obtiene el historial completo de modificaciones
 */
export function getAllModifications(): ModificationRecord[] {
  try {
    const data = loadTrackingData();
    return data.modifications;
  } catch (error) {
    logger.error('Error getting all modifications', error);
    return [];
  }
}

/**
 * Limpia registros antiguos (más de N días)
 */
export function cleanOldRecords(daysToKeep: number = 30): void {
  try {
    const data = loadTrackingData();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const cutoffTimestamp = cutoffDate.toISOString();
    
    data.modifications = data.modifications.filter(
      record => record.timestamp >= cutoffTimestamp
    );
    
    data.processing = data.processing.filter(
      record => record.timestamp >= cutoffTimestamp
    );
    
    saveTrackingData(data);
    logger.info(`Cleaned old tracking records, kept records from last ${daysToKeep} days`);
  } catch (error) {
    logger.error('Error cleaning old records', error);
  }
}

/**
 * Calcula hash del contenido de un archivo
 */
function calculateContentHash(content: string): string {
  // Usar hash simple basado en longitud y primeros caracteres
  // En producción se podría usar crypto.createHash
  const hash = content.length.toString(36) + '-' + 
               content.substring(0, 100).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
  return hash;
}

/**
 * Registra el procesamiento de un archivo con IA
 */
export function trackProcessing(
  filePath: string,
  processor: string,
  contentHash: string,
  analysisHash?: string,
  metadata?: Record<string, any>,
  projectRoot?: string
): void {
  if (!projectRoot) {
    projectRoot = findProjectRoot();
  }
  try {
    const data = loadTrackingData();
    
    const record: ProcessingRecord = {
      timestamp: new Date().toISOString(),
      filePath: normalizePath(filePath, projectRoot),
      processor,
      contentHash,
      analysisHash,
      metadata,
    };

    data.processing.push(record);
    
    // Mantener solo los últimos 1000 registros
    if (data.processing.length > 1000) {
      data.processing = data.processing.slice(-1000);
    }

    saveTrackingData(data);
    logger.debug(`Tracked processing: ${processor} on ${filePath}`);
  } catch (error) {
    logger.error('Error tracking processing', error);
  }
}

/**
 * Verifica si un archivo ya fue procesado con un procesador específico
 */
export function isFileProcessed(
  filePath: string,
  processor: string,
  contentHash?: string,
  projectRoot?: string
): boolean {
  if (!projectRoot) {
    projectRoot = findProjectRoot();
  }
  try {
    const data = loadTrackingData();
    const normalizedPath = normalizePath(filePath, projectRoot);
    
    const records = data.processing.filter(
      record => normalizePath(record.filePath, projectRoot) === normalizedPath &&
                record.processor === processor
    );

    if (records.length === 0) {
      return false;
    }

    // Si se proporciona contentHash, verificar que coincida
    if (contentHash) {
      const latestRecord = records[records.length - 1];
      return latestRecord.contentHash === contentHash;
    }

    // Si no se proporciona hash, asumir que fue procesado
    return true;
  } catch (error) {
    logger.error('Error checking if file is processed', error);
    return false;
  }
}

/**
 * Obtiene el último procesamiento de un archivo
 */
export function getLastProcessing(
  filePath: string,
  processor?: string,
  projectRoot?: string
): ProcessingRecord | null {
  if (!projectRoot) {
    projectRoot = findProjectRoot();
  }
  try {
    const data = loadTrackingData();
    const normalizedPath = normalizePath(filePath, projectRoot);
    
    let records = data.processing.filter(
      record => normalizePath(record.filePath, projectRoot) === normalizedPath
    );

    if (processor) {
      records = records.filter(record => record.processor === processor);
    }

    if (records.length === 0) {
      return null;
    }

    // Retornar el más reciente
    return records.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
  } catch (error) {
    logger.error('Error getting last processing', error);
    return null;
  }
}

/**
 * Calcula hash del contenido de un archivo
 */
export function getContentHash(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return calculateContentHash(content);
  } catch (error) {
    logger.error(`Error calculating content hash for ${filePath}`, error);
    return null;
  }
}

