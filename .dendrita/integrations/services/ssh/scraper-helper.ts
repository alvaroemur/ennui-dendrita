/**
 * Helper para ejecutar scrapers remotamente vía SSH
 * Integra con DriveScraper, CalendarScraper, GmailScraper
 */

import { SSHClientService } from './client';
import { createLogger } from '../../utils/logger';
import * as path from 'path';

const logger = createLogger('SSHScraperHelper');

export interface ScraperRunConfig {
  host: string;
  scraper: 'gmail-scraper' | 'calendar-scraper' | 'drive-scraper';
  user_id: string;
  profile_id?: string;
  config_name?: string;
  workspace?: string;
  timeout?: number;
}

export interface ScraperRunResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  error?: string;
}

export interface ScraperDeployConfig {
  host: string;
  scraper: 'gmail-scraper' | 'calendar-scraper' | 'drive-scraper';
  localPath?: string;
  remotePath?: string;
}

export interface ScraperStatus {
  isRunning: boolean;
  lastExecution?: string;
  lastStatus?: string;
  pid?: number;
}

export class SSHScraperHelper {
  private sshClient: SSHClientService;

  constructor() {
    this.sshClient = new SSHClientService();
  }

  /**
   * Ejecuta un scraper remotamente
   */
  async runScraper(config: ScraperRunConfig): Promise<ScraperRunResult> {
    try {
      logger.info(`Running scraper ${config.scraper} on ${config.host} for user ${config.user_id}`);

      // Determinar comando según el tipo de scraper
      let command: string;
      const basePath = '/app/dendrita'; // Path base en el servidor remoto

      switch (config.scraper) {
        case 'gmail-scraper':
          command = `cd ${basePath} && npx ts-node .dendrita/integrations/scripts/gmail-scraper.ts ${config.user_id}`;
          if (config.profile_id) {
            command += ` ${config.profile_id}`;
          }
          break;

        case 'calendar-scraper':
          command = `cd ${basePath} && npx ts-node .dendrita/integrations/scripts/calendar-scraper.ts`;
          break;

        case 'drive-scraper':
          command = `cd ${basePath} && npx ts-node .dendrita/integrations/scripts/drive-scraper.ts`;
          if (config.workspace) {
            command += ` ${config.workspace}`;
          }
          break;

        default:
          throw new Error(`Unknown scraper type: ${config.scraper}`);
      }

      // Ejecutar comando remotamente
      const result = await this.sshClient.executeCommand(
        config.host,
        command,
        config.timeout || 300000 // 5 minutos por defecto
      );

      logger.info(`Scraper ${config.scraper} finished on ${config.host} with exit code ${result.code}`);

      return {
        success: result.code === 0,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.code,
        error: result.code !== 0 ? `Scraper exited with code ${result.code}` : undefined,
      };
    } catch (error) {
      logger.error(`Failed to run scraper ${config.scraper} on ${config.host}`, error);
      return {
        success: false,
        stdout: '',
        stderr: '',
        exitCode: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Deploya un scraper a servidor remoto
   */
  async deployScraper(config: ScraperDeployConfig): Promise<void> {
    try {
      logger.info(`Deploying scraper ${config.scraper} to ${config.host}`);

      // Determinar paths según el tipo de scraper
      const basePath = '/app/dendrita'; // Path base en el servidor remoto
      let localPath: string;
      let remotePath: string;

      if (config.localPath && config.remotePath) {
        localPath = config.localPath;
        remotePath = config.remotePath;
      } else {
        switch (config.scraper) {
          case 'gmail-scraper':
            localPath = '.dendrita/integrations/services/google/gmail-scraper.ts';
            remotePath = `${basePath}/.dendrita/integrations/services/google/gmail-scraper.ts`;
            break;

          case 'calendar-scraper':
            localPath = '.dendrita/integrations/services/google/calendar-scraper.ts';
            remotePath = `${basePath}/.dendrita/integrations/services/google/calendar-scraper.ts`;
            break;

          case 'drive-scraper':
            localPath = '.dendrita/integrations/services/google/drive-scraper.ts';
            remotePath = `${basePath}/.dendrita/integrations/services/google/drive-scraper.ts`;
            break;

          default:
            throw new Error(`Unknown scraper type: ${config.scraper}`);
        }
      }

      // Resolver path local
      const resolvedLocalPath = path.isAbsolute(localPath) ? localPath : path.resolve(process.cwd(), localPath);

      // Deployar archivo
      await this.sshClient.deployFile(config.host, resolvedLocalPath, remotePath);

      logger.info(`Scraper ${config.scraper} deployed successfully to ${config.host}`);
    } catch (error) {
      logger.error(`Failed to deploy scraper ${config.scraper} to ${config.host}`, error);
      throw error;
    }
  }

  /**
   * Verifica el estado de un scraper en servidor remoto
   */
  async checkScraperStatus(host: string, scraper: string): Promise<ScraperStatus> {
    try {
      logger.debug(`Checking status of scraper ${scraper} on ${host}`);

      // Verificar si el proceso está corriendo
      const processCheckCommand = `ps aux | grep -i "${scraper}" | grep -v grep`;
      const processResult = await this.sshClient.executeCommand(host, processCheckCommand);

      const isRunning = processResult.stdout.trim().length > 0;
      let pid: number | undefined;

      if (isRunning) {
        // Extraer PID del resultado
        const pidMatch = processResult.stdout.match(/\s+(\d+)\s+/);
        if (pidMatch) {
          pid = parseInt(pidMatch[1], 10);
        }
      }

      // Verificar última ejecución desde Supabase (si está disponible)
      const lastExecutionCommand = `cd /app/dendrita && npx ts-node -e "import { SupabaseService } from '.dendrita/integrations/services/supabase/client'; const s = new SupabaseService(); const db = s.db(false); db.from('${scraper}_scraping_configs').select('last_sync_at, last_sync_status').order('last_sync_at', { ascending: false }).limit(1).then(r => console.log(JSON.stringify(r.data?.[0] || {})))"`;

      let lastExecution: string | undefined;
      let lastStatus: string | undefined;

      try {
        const lastExecutionResult = await this.sshClient.executeCommand(host, lastExecutionCommand);
        const lastExecutionData = JSON.parse(lastExecutionResult.stdout.trim() || '{}');
        lastExecution = lastExecutionData.last_sync_at;
        lastStatus = lastExecutionData.last_sync_status;
      } catch (error) {
        logger.debug(`Could not get last execution from Supabase: ${error}`);
      }

      return {
        isRunning,
        lastExecution,
        lastStatus,
        pid,
      };
    } catch (error) {
      logger.error(`Failed to check status of scraper ${scraper} on ${host}`, error);
      throw error;
    }
  }

  /**
   * Cierra todas las conexiones SSH
   */
  async disconnectAll(): Promise<void> {
    await this.sshClient.disconnectAll();
  }
}

