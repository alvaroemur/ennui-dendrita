/**
 * Sistema de logging unificado para toda la infraestructura de dendrita
 * Registra eventos de hooks, agents, skills, scripts y cambios de infraestructura
 */

import * as fs from 'fs';
import * as path from 'path';

export type DendritaComponentType = 
  | 'hook' 
  | 'agent' 
  | 'skill' 
  | 'script' 
  | 'integration-hook'
  | 'service'
  | 'infrastructure-change'
  | 'user-action'
  | 'system';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface DendritaLogEntry {
  // Identificación
  timestamp: string; // ISO 8601
  id: string; // UUID único para este evento
  level: LogLevel;
  
  // Componente
  component_type: DendritaComponentType;
  component_name: string; // Nombre del componente (ej: "session-initialization-verification")
  component_path?: string; // Ruta relativa al componente
  
  // Contexto
  user_id?: string; // Usuario relacionado (si aplica)
  workspace?: string; // Workspace relacionado (si aplica)
  project?: string; // Proyecto relacionado (si aplica)
  
  // Evento
  event_type: string; // Tipo de evento (ej: "read", "activate", "execute", "modify")
  event_description: string; // Descripción legible del evento
  
  // Detalles
  status?: 'success' | 'error' | 'warning' | 'skipped';
  duration?: number; // Milisegundos
  error?: string; // Mensaje de error (sin credenciales)
  
  // Metadata
  metadata?: Record<string, unknown>; // Datos adicionales (sin credenciales)
  
  // Relaciones
  triggered_by?: string; // ID del evento que lo activó
  related_components?: string[]; // IDs de componentes relacionados
}

class DendritaLogger {
  private logDir: string;
  private logFile: string;
  private maxLogSize: number = 50 * 1024 * 1024; // 50MB por defecto
  private maxLogFiles: number = 20; // máximo 20 archivos rotados
  private currentLogSize: number = 0;

  constructor() {
    // Logs centralizados en .dendrita/logs/
    // Usar process.cwd() si __dirname no está disponible
    const baseDir = typeof __dirname !== 'undefined' 
      ? __dirname 
      : process.cwd();
    this.logDir = path.join(baseDir, '../logs');
    this.logFile = path.join(this.logDir, 'dendrita.jsonl');
    this.ensureLogDir();
    this.updateCurrentLogSize();
  }

  private ensureLogDir(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private updateCurrentLogSize(): void {
    try {
      if (fs.existsSync(this.logFile)) {
        const stats = fs.statSync(this.logFile);
        this.currentLogSize = stats.size;
      }
    } catch (error) {
      // Ignorar errores al leer tamaño
    }
  }

  /**
   * Genera un ID único para el evento
   */
  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Redacta información sensible del metadata
   */
  private sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!metadata) return undefined;

    const sanitized: Record<string, unknown> = {};
    const sensitiveKeys = [
      'token',
      'password',
      'secret',
      'key',
      'credential',
      'apiKey',
      'accessToken',
      'refreshToken',
      'authorization',
      'auth',
      'clientId',
      'clientSecret',
    ];

    for (const [key, value] of Object.entries(metadata)) {
      const keyLower = key.toLowerCase();
      const isSensitive = sensitiveKeys.some((sk) => keyLower.includes(sk));

      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'string' && this.looksLikeCredential(value)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeMetadata(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Detecta si un string parece ser una credencial
   */
  private looksLikeCredential(value: string): boolean {
    // Tokens de OpenAI
    if (/^sk-[a-zA-Z0-9]{20,}/.test(value)) return true;
    // Bearer tokens
    if (/^Bearer [a-zA-Z0-9_-]{20,}/i.test(value)) return true;
    // Tokens largos (probablemente credenciales)
    if (value.length > 50 && /^[a-zA-Z0-9_-]+$/.test(value)) return true;
    return false;
  }

  /**
   * Rota el archivo de log si es necesario
   */
  private rotateLogIfNeeded(): void {
    if (this.currentLogSize >= this.maxLogSize) {
      // Rotar archivos existentes
      for (let i = this.maxLogFiles - 1; i >= 1; i--) {
        const oldFile = `${this.logFile}.${i}`;
        const newFile = `${this.logFile}.${i + 1}`;
        
        if (fs.existsSync(oldFile)) {
          if (i + 1 <= this.maxLogFiles) {
            fs.renameSync(oldFile, newFile);
          } else {
            fs.unlinkSync(oldFile);
          }
        }
      }

      // Mover archivo actual
      if (fs.existsSync(this.logFile)) {
        fs.renameSync(this.logFile, `${this.logFile}.1`);
      }

      this.currentLogSize = 0;
    }
  }

  /**
   * Registra un evento de dendrita
   */
  log(entry: Omit<DendritaLogEntry, 'timestamp' | 'id'>): string {
    const fullEntry: DendritaLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
      id: this.generateEventId(),
      metadata: this.sanitizeMetadata(entry.metadata),
    };

    const logLine = JSON.stringify(fullEntry) + '\n';
    const logSize = new TextEncoder().encode(logLine).length;

    this.rotateLogIfNeeded();

    try {
      fs.appendFileSync(this.logFile, logLine, 'utf8');
      this.currentLogSize += logSize;
    } catch (error) {
      console.error('Failed to write dendrita log:', error);
    }

    return fullEntry.id;
  }

  /**
   * Helper para registrar lectura de hook
   */
  logHookRead(
    hookName: string,
    hookPath: string,
    options?: {
      user_id?: string;
      status?: 'success' | 'error';
      duration?: number;
      metadata?: Record<string, unknown>;
    }
  ): string {
    return this.log({
      level: 'info',
      component_type: 'hook',
      component_name: hookName,
      component_path: hookPath,
      user_id: options?.user_id,
      event_type: 'read',
      event_description: `Hook "${hookName}" was read`,
      status: options?.status || 'success',
      duration: options?.duration,
      metadata: options?.metadata,
    });
  }

  /**
   * Helper para registrar activación de skill
   */
  logSkillActivation(
    skillName: string,
    skillPath: string,
    options?: {
      user_id: string;
      triggered_by?: string;
      status?: 'success' | 'error' | 'skipped';
      metadata?: Record<string, unknown>;
    }
  ): string {
    return this.log({
      level: 'info',
      component_type: 'skill',
      component_name: skillName,
      component_path: skillPath,
      user_id: options?.user_id,
      event_type: 'activate',
      event_description: `Skill "${skillName}" was activated`,
      status: options?.status || 'success',
      triggered_by: options?.triggered_by,
      metadata: options?.metadata,
    });
  }

  /**
   * Helper para registrar activación de agent
   */
  logAgentActivation(
    agentName: string,
    agentPath: string,
    options?: {
      user_id: string;
      triggered_by?: string;
      status?: 'success' | 'error' | 'skipped';
      metadata?: Record<string, unknown>;
    }
  ): string {
    return this.log({
      level: 'info',
      component_type: 'agent',
      component_name: agentName,
      component_path: agentPath,
      user_id: options?.user_id,
      event_type: 'activate',
      event_description: `Agent "${agentName}" was activated`,
      status: options?.status || 'success',
      triggered_by: options?.triggered_by,
      metadata: options?.metadata,
    });
  }

  /**
   * Helper para registrar ejecución de script
   */
  logScriptExecution(
    scriptName: string,
    scriptPath: string,
    options?: {
      user_id?: string;
      workspace?: string;
      triggered_by?: string;
      status?: 'success' | 'error';
      duration?: number;
      error?: string;
      metadata?: Record<string, unknown>;
    }
  ): string {
    return this.log({
      level: options?.status === 'error' ? 'error' : 'info',
      component_type: 'script',
      component_name: scriptName,
      component_path: scriptPath,
      user_id: options?.user_id,
      workspace: options?.workspace,
      event_type: 'execute',
      event_description: `Script "${scriptName}" was executed`,
      status: options?.status || 'success',
      duration: options?.duration,
      error: options?.error,
      triggered_by: options?.triggered_by,
      metadata: options?.metadata,
    });
  }

  /**
   * Helper para registrar cambio de infraestructura
   */
  logInfrastructureChange(
    componentType: DendritaComponentType,
    componentName: string,
    componentPath: string,
    changeType: 'create' | 'modify' | 'delete',
    options?: {
      user_id?: string;
      triggered_by?: string;
      metadata?: Record<string, unknown>;
    }
  ): string {
    return this.log({
      level: 'info',
      component_type: 'infrastructure-change',
      component_name: componentName,
      component_path: componentPath,
      user_id: options?.user_id,
      event_type: changeType,
      event_description: `Infrastructure change: ${changeType} ${componentType} "${componentName}"`,
      status: 'success',
      triggered_by: options?.triggered_by,
      metadata: {
        ...options?.metadata,
        change_type: changeType,
        component_type: componentType,
      },
    });
  }

  /**
   * Lee logs recientes
   */
  readLogs(limit?: number): DendritaLogEntry[] {
    try {
      if (!fs.existsSync(this.logFile)) {
        return [];
      }

      const content = fs.readFileSync(this.logFile, 'utf8');
      const lines = content.trim().split('\n').filter((line: string) => line.trim());
      
      let entries = lines.map((line: string) => {
        try {
          return JSON.parse(line) as DendritaLogEntry;
        } catch {
          return null;
        }
      }).filter((entry: DendritaLogEntry | null): entry is DendritaLogEntry => entry !== null);

      // Ordenar por timestamp (más reciente primero)
      entries.sort((a: DendritaLogEntry, b: DendritaLogEntry) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      if (limit) {
        entries = entries.slice(0, limit);
      }

      return entries;
    } catch (error) {
      console.error('Failed to read dendrita logs:', error);
      return [];
    }
  }

  /**
   * Lee logs de un componente específico
   */
  readComponentLogs(
    componentType: DendritaComponentType,
    componentName?: string,
    limit?: number
  ): DendritaLogEntry[] {
    const allLogs = this.readLogs();
    
    let filtered = allLogs.filter(log => 
      log.component_type === componentType &&
      (!componentName || log.component_name === componentName)
    );

    if (limit) {
      filtered = filtered.slice(0, limit);
    }

    return filtered;
  }

  /**
   * Lee logs de un usuario específico
   */
  readUserLogs(userId: string, limit?: number): DendritaLogEntry[] {
    const allLogs = this.readLogs();
    
    let filtered = allLogs.filter(log => log.user_id === userId);

    if (limit) {
      filtered = filtered.slice(0, limit);
    }

    return filtered;
  }
}

// Singleton instance
export const dendritaLogger = new DendritaLogger();

/**
 * Helper para registrar eventos de dendrita
 */
export function logDendritaEvent(
  entry: Omit<DendritaLogEntry, 'timestamp' | 'id'>
): string {
  return dendritaLogger.log(entry);
}

