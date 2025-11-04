/**
 * Logger seguro que nunca expone credenciales o información sensible
 */

import * as fs from 'fs';
import * as path from 'path';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
}

class Logger {
  private logFile: string;

  constructor(private serviceName: string) {
    this.logFile = path.join(__dirname, '../../logs/', `${serviceName}.log`);
    this.ensureLogDir();
  }

  private ensureLogDir(): void {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  private sanitizeMessage(message: string): string {
    // Remueve cualquier string que parezca una credencial
    return message
      .replace(/sk-[a-zA-Z0-9]{20,}/g, '[OPENAI_KEY_REDACTED]')
      .replace(/Bearer [a-zA-Z0-9_-]+/g, '[TOKEN_REDACTED]')
      .replace(/authorization: [a-zA-Z0-9_-]+/gi, 'authorization: [REDACTED]');
  }

  private log(level: LogLevel, message: string): void {
    const sanitized = this.sanitizeMessage(message);
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message: sanitized,
    };

    // Console output
    const emoji = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
    };

    console.log(`${emoji[level]} [${this.serviceName}] ${sanitized}`);

    // File output
    this.appendToFile(entry);
  }

  private appendToFile(entry: LogEntry): void {
    try {
      const line = `${entry.timestamp} [${entry.level.toUpperCase()}] ${entry.message}\n`;
      fs.appendFileSync(this.logFile, line);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  debug(message: string): void {
    this.log('debug', message);
  }

  info(message: string): void {
    this.log('info', message);
  }

  warn(message: string): void {
    this.log('warn', message);
  }

  error(message: string, error?: unknown): void {
    let fullMessage = message;
    if (error instanceof Error) {
      fullMessage += ` - ${error.message}`;
    }
    this.log('error', fullMessage);
  }
}

export function createLogger(serviceName: string): Logger {
  return new Logger(serviceName);
}
