#!/usr/bin/env ts-node
/**
 * Script ejecutable para ejecutar un scraper remotamente vía SSH
 * 
 * Uso:
 *   ts-node ssh-run-scraper.ts <host> <scraper> <user_id> [profile_id] [config_name] [workspace]
 * 
 * Ejemplos:
 *   ts-node ssh-run-scraper.ts dev-server gmail-scraper alvaro
 *   ts-node ssh-run-scraper.ts dev-server gmail-scraper alvaro profile-1 ennui-gmail-scraper
 *   ts-node ssh-run-scraper.ts dev-server drive-scraper alvaro profile-1 ennui-drive-scraper ennui
 */

import { SSHScraperHelper } from '../services/ssh/scraper-helper';
import { SSHAuth } from '../services/ssh/auth';
import { createLogger } from '../utils/logger';

const logger = createLogger('SSHRunScraperScript');

/**
 * Función principal
 */
async function main(): Promise<void> {
  try {
    // Parsear argumentos
    const args = process.argv.slice(2);
    if (args.length < 3) {
      logger.error('Usage: ts-node ssh-run-scraper.ts <host> <scraper> <user_id> [profile_id] [config_name] [workspace]');
      logger.error('Examples:');
      logger.error('  ts-node ssh-run-scraper.ts dev-server gmail-scraper alvaro');
      logger.error('  ts-node ssh-run-scraper.ts dev-server gmail-scraper alvaro profile-1 ennui-gmail-scraper');
      logger.error('  ts-node ssh-run-scraper.ts dev-server drive-scraper alvaro profile-1 ennui-drive-scraper ennui');
      process.exit(1);
    }

    const [hostName, scraper, userId, profileId, configName, workspace] = args;

    // Validar scraper
    const validScrapers = ['gmail-scraper', 'calendar-scraper', 'drive-scraper'];
    if (!validScrapers.includes(scraper)) {
      logger.error(`Invalid scraper: ${scraper}. Must be one of: ${validScrapers.join(', ')}`);
      process.exit(1);
    }

    // Verificar si SSH está configurado
    if (!SSHAuth.isConfigured()) {
      logger.error('SSH not configured. Set SSH_PRIVATE_KEY or SSH_PRIVATE_KEY_PATH in .env.local');
      process.exit(1);
    }

    // Verificar si el host está configurado
    if (!SSHAuth.isHostConfigured(hostName)) {
      logger.error(`SSH host '${hostName}' not configured. Configure it in .env.local`);
      process.exit(1);
    }

    logger.info(`Running scraper ${scraper} on ${hostName} for user ${userId}...`);

    const helper = new SSHScraperHelper();

    try {
      // Ejecutar scraper
      const result = await helper.runScraper({
        host: hostName,
        scraper: scraper as 'gmail-scraper' | 'calendar-scraper' | 'drive-scraper',
        user_id: userId,
        profile_id: profileId,
        config_name: configName,
        workspace: workspace,
        timeout: 300000, // 5 minutos
      });

      // Mostrar resultados
      logger.info(`\n=== Scraper Execution Results ===`);
      logger.info(`Success: ${result.success}`);
      logger.info(`Exit Code: ${result.exitCode}`);

      if (result.stdout) {
        logger.info(`\n=== Stdout ===\n${result.stdout}`);
      }

      if (result.stderr) {
        logger.warn(`\n=== Stderr ===\n${result.stderr}`);
      }

      if (result.error) {
        logger.error(`\n=== Error ===\n${result.error}`);
      }

      // Verificar estado del scraper
      logger.info(`\n=== Checking Scraper Status ===`);
      const status = await helper.checkScraperStatus(hostName, scraper);
      logger.info(`Is Running: ${status.isRunning}`);
      logger.info(`Last Execution: ${status.lastExecution || 'N/A'}`);
      logger.info(`Last Status: ${status.lastStatus || 'N/A'}`);
      if (status.pid) {
        logger.info(`PID: ${status.pid}`);
      }

      if (!result.success) {
        process.exit(1);
      }
    } catch (error) {
      logger.error('Failed to run scraper remotely', error);
      process.exit(1);
    } finally {
      await helper.disconnectAll();
    }
  } catch (error) {
    logger.error('Fatal error', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch((error) => {
    logger.error('Unhandled error', error);
    process.exit(1);
  });
}

