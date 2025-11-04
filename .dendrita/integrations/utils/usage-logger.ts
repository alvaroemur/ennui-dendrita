/**
 * Sistema de logging interno para uso de integraciones
 * Registra cada uso de servicios sin exponer credenciales
 */

import * as fs from 'fs';
import * as path from 'path';

export interface UsageLogEntry {
  timestamp: string;
  service: string;
  operation: string;
  status: 'success' | 'error' | 'warning';
  duration?: number; // en milisegundos
  error?: string; // mensaje de error (sin credenciales)
  metadata?: Record<string, unknown>; // datos adicionales (sin credenciales)
}

export interface UsageStats {
  service: string;
  totalCalls: number;
  successCalls: number;
  errorCalls: number;
  averageDuration: number;
  lastUsed: string;
  operations: Record<string, number>; // operación -> cantidad de veces
}

class UsageLogger {
  private logDir: string;
  private logFile: string;
  private maxLogSize: number = 10 * 1024 * 1024; // 10MB por defecto
  private maxLogFiles: number = 10; // máximo 10 archivos rotados

  constructor() {
    this.logDir = path.join(__dirname, '../logs/usage');
    this.logFile = path.join(this.logDir, 'usage.jsonl');
    this.ensureLogDir();
  }

  private ensureLogDir(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Redacta cualquier información sensible del mensaje
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
    ];

    for (const [key, value] of Object.entries(metadata)) {
      const keyLower = key.toLowerCase();
      const isSensitive = sensitiveKeys.some((sk) => keyLower.includes(sk));

      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'string' && this.looksLikeCredential(value)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
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
   * Registra el uso de una integración
   */
  log(entry: Omit<UsageLogEntry, 'timestamp'>): void {
    const fullEntry: UsageLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
      metadata: this.sanitizeMetadata(entry.metadata),
    };

    // Redactar error si contiene credenciales
    if (fullEntry.error) {
      fullEntry.error = this.sanitizeMessage(fullEntry.error);
    }

    try {
      // Rotar logs si es necesario
      this.rotateLogsIfNeeded();

      // Escribir en formato JSONL (una línea por entrada)
      const line = JSON.stringify(fullEntry) + '\n';
      fs.appendFileSync(this.logFile, line);
    } catch (error) {
      // No lanzar error para no interrumpir el flujo principal
      console.error('[UsageLogger] Failed to write log:', error);
    }
  }

  /**
   * Sanitiza mensajes de error
   */
  private sanitizeMessage(message: string): string {
    return message
      .replace(/sk-[a-zA-Z0-9]{20,}/g, '[OPENAI_KEY_REDACTED]')
      .replace(/Bearer [a-zA-Z0-9_-]+/g, '[TOKEN_REDACTED]')
      .replace(/authorization: [a-zA-Z0-9_-]+/gi, 'authorization: [REDACTED]')
      .replace(/token=[a-zA-Z0-9_-]+/gi, 'token=[REDACTED]')
      .replace(/key=[a-zA-Z0-9_-]+/gi, 'key=[REDACTED]');
  }

  /**
   * Rota los logs si el archivo es muy grande
   */
  private rotateLogsIfNeeded(): void {
    if (!fs.existsSync(this.logFile)) return;

    const stats = fs.statSync(this.logFile);
    if (stats.size < this.maxLogSize) return;

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

    // Rotar el archivo actual
    if (fs.existsSync(this.logFile)) {
      fs.renameSync(this.logFile, `${this.logFile}.1`);
    }
  }

  /**
   * Lee todos los logs de uso
   */
  readLogs(limit?: number): UsageLogEntry[] {
    if (!fs.existsSync(this.logFile)) {
      return [];
    }

    try {
      const content = fs.readFileSync(this.logFile, 'utf-8');
      const lines = content.trim().split('\n').filter((line) => line.trim());
      const entries: UsageLogEntry[] = [];

      for (const line of lines) {
        try {
          const entry = JSON.parse(line) as UsageLogEntry;
          entries.push(entry);
        } catch (error) {
          console.warn('[UsageLogger] Failed to parse log line:', line);
        }
      }

      // Retornar en orden cronológico (más reciente primero si hay límite)
      if (limit) {
        return entries.slice(-limit).reverse();
      }
      return entries.reverse();
    } catch (error) {
      console.error('[UsageLogger] Failed to read logs:', error);
      return [];
    }
  }

  /**
   * Lee logs de un servicio específico
   */
  readServiceLogs(service: string, limit?: number): UsageLogEntry[] {
    const allLogs = this.readLogs();
    const filtered = allLogs.filter((entry) => entry.service === service);
    return limit ? filtered.slice(0, limit) : filtered;
  }

  /**
   * Limpia logs antiguos (más de N días)
   */
  cleanOldLogs(daysToKeep: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const allLogs = this.readLogs();
    const recentLogs = allLogs.filter((entry) => {
      const entryDate = new Date(entry.timestamp);
      return entryDate >= cutoffDate;
    });

    // Reescribir archivo con solo logs recientes
    if (recentLogs.length < allLogs.length) {
      const lines = recentLogs.reverse().map((entry) => JSON.stringify(entry));
      fs.writeFileSync(this.logFile, lines.join('\n') + '\n');
    }
  }
}

// Singleton instance
export const usageLogger = new UsageLogger();

/**
 * Helper para registrar uso de una integración
 */
export function logIntegrationUsage(
  service: string,
  operation: string,
  options: {
    status?: 'success' | 'error' | 'warning';
    duration?: number;
    error?: Error | string;
    metadata?: Record<string, unknown>;
  } = {}
): void {
  const status = options.status || 'success';
  const errorMessage =
    options.error instanceof Error
      ? options.error.message
      : typeof options.error === 'string'
        ? options.error
        : undefined;

  usageLogger.log({
    service,
    operation,
    status,
    duration: options.duration,
    error: errorMessage,
    metadata: options.metadata,
  });
}

