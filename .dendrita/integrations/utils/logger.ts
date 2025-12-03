/**
 * Logger seguro que nunca expone credenciales o información sensible
 */

import * as fs from 'fs';
import * as path from 'path';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Determina la categoría del log basado en el nombre del servicio
 */
function getLogCategory(serviceName: string): string {
  const name = serviceName.toLowerCase();
  
  // Services (integración con APIs externas)
  if (name.includes('google') || name.includes('gmail') || name.includes('calendar') || 
      name.includes('drive') || name.includes('docs') || name.includes('sheets') || 
      name.includes('auth') && name.includes('google')) {
    return 'services/google';
  }
  if (name.includes('openai')) {
    return 'services/openai';
  }
  if (name.includes('supabase')) {
    return 'services/supabase';
  }
  if (name.includes('reddit')) {
    return 'services/reddit';
  }
  
  // Scrapers (extracción automática)
  if (name.includes('scraper') || name.includes('scrape')) {
    if (name.includes('calendar')) {
      return 'scrapers/calendar';
    }
    if (name.includes('drive')) {
      return 'scrapers/drive';
    }
    return 'scrapers/scripts';
  }
  
  // Extract (extracción de contenido)
  if (name.includes('extract')) {
    if (name.includes('gdoc') || name.includes('gsheet') || name.includes('gslides') || 
        name.includes('doc') || name.includes('sheet') || name.includes('slides')) {
      return 'extract/docs';
    }
    if (name.includes('transcript') || name.includes('meeting')) {
      return 'extract/transcripts';
    }
    if (name.includes('staging')) {
      return 'extract/staging';
    }
    return 'extract/docs';
  }
  
  // Analyze (análisis)
  if (name.includes('analyze')) {
    if (name.includes('transcript') || name.includes('interview')) {
      return 'analyze/transcripts';
    }
    if (name.includes('project') || name.includes('sheet')) {
      return 'analyze/projects';
    }
    return 'analyze/transcripts';
  }
  
  // Enrich (enriquecimiento)
  if (name.includes('enrich')) {
    if (name.includes('presentation')) {
      return 'enrich/presentations';
    }
    if (name.includes('dashboard')) {
      return 'enrich/dashboard';
    }
    return 'enrich/content';
  }
  
  // Search (búsqueda)
  if (name.includes('search')) {
    if (name.includes('email') || name.includes('gmail')) {
      return 'search/email';
    }
    if (name.includes('project') || name.includes('sheet')) {
      return 'search/projects';
    }
    if (name.includes('drive') || name.includes('cv') || name.includes('folder')) {
      return 'search/drive';
    }
    return 'search/drive';
  }
  
  // Find (búsqueda específica)
  if (name.includes('find')) {
    if (name.includes('meeting') || name.includes('transcript') || name.includes('recent')) {
      return 'find/meetings';
    }
    if (name.includes('folder') || name.includes('inspiro') || name.includes('transcripciones')) {
      return 'find/folders';
    }
    if (name.includes('drive') || name.includes('file')) {
      return 'find/drive';
    }
    return 'find/drive';
  }
  
  // Sync (sincronización)
  if (name.includes('sync')) {
    if (name.includes('workspace') || name.includes('google')) {
      return 'sync/workspace';
    }
    if (name.includes('drive') || name.includes('folder')) {
      return 'sync/drive';
    }
    if (name.includes('config') || name.includes('tracking') || name.includes('scraper')) {
      return 'sync/config';
    }
    return 'sync/workspace';
  }
  
  // Test (pruebas)
  if (name.includes('test')) {
    if (name.includes('calendar') || name.includes('drive') || name.includes('gmail') || 
        name.includes('google')) {
      return 'test/google';
    }
    if (name.includes('scraper') || name.includes('user')) {
      return 'test/scrapers';
    }
    return 'test/google';
  }
  
  // Generate (generación)
  if (name.includes('generate')) {
    if (name.includes('report') || name.includes('dashboard')) {
      return 'generate/reports';
    }
    if (name.includes('reference')) {
      return 'generate/references';
    }
    return 'generate/reports';
  }
  
  // Utils (utilidades)
  if (name.includes('backlink')) {
    return 'utils/backlinks';
  }
  if (name.includes('context') || name.includes('identify')) {
    return 'utils/context';
  }
  if (name.includes('tracking') || name.includes('file')) {
    return 'utils/tracking';
  }
  
  // Default: root logs directory para servicios no categorizados
  return '';
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
}

class Logger {
  private logFile: string;

  constructor(private serviceName: string) {
    const category = getLogCategory(serviceName);
    const logDir = category 
      ? path.join(__dirname, '../../logs/', category)
      : path.join(__dirname, '../../logs/');
    this.logFile = path.join(logDir, `${serviceName}.log`);
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
