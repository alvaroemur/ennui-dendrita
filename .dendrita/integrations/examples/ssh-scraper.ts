/**
 * EJEMPLO: Ejecutar scraper remotamente vía SSH
 */

import { SSHScraperHelper } from '../services/ssh/scraper-helper';
import { SSHAuth } from '../services/ssh/auth';
import { createLogger } from '../utils/logger';

const logger = createLogger('SSHScraperExample');

async function runScraperRemotely(): Promise<void> {
  // Verificar si SSH está configurado
  if (!SSHAuth.isConfigured()) {
    logger.warn('SSH not configured. Set SSH_PRIVATE_KEY or SSH_PRIVATE_KEY_PATH in .env.local');
    return;
  }

  const hosts = SSHAuth.listHosts();
  if (hosts.length === 0) {
    logger.warn('No SSH hosts configured');
    return;
  }

  const hostName = hosts[0].name;
  logger.info(`Running scraper on ${hostName}...`);

  const helper = new SSHScraperHelper();

  try {
    // Ejecutar scraper de Gmail
    logger.info('Running Gmail scraper...');
    const gmailResult = await helper.runScraper({
      host: hostName,
      scraper: 'gmail-scraper',
      user_id: 'alvaro',
      profile_id: 'profile-1',
      config_name: 'ennui-gmail-scraper',
      timeout: 300000, // 5 minutos
    });

    logger.info(`Gmail Scraper - Success: ${gmailResult.success}`);
    logger.info(`Gmail Scraper - Exit Code: ${gmailResult.exitCode}`);
    if (gmailResult.stdout) {
      logger.info(`Gmail Scraper - Stdout:\n${gmailResult.stdout}`);
    }
    if (gmailResult.stderr) {
      logger.warn(`Gmail Scraper - Stderr:\n${gmailResult.stderr}`);
    }
    if (gmailResult.error) {
      logger.error(`Gmail Scraper - Error: ${gmailResult.error}`);
    }

    // Verificar estado del scraper
    logger.info('Checking scraper status...');
    const status = await helper.checkScraperStatus(hostName, 'gmail-scraper');
    logger.info(`Is Running: ${status.isRunning}`);
    logger.info(`Last Execution: ${status.lastExecution}`);
    logger.info(`Last Status: ${status.lastStatus}`);
    if (status.pid) {
      logger.info(`PID: ${status.pid}`);
    }
  } catch (error) {
    logger.error('Failed to run scraper remotely', error);
  } finally {
    await helper.disconnectAll();
  }
}

if (require.main === module) {
  runScraperRemotely().catch((e) => logger.error('Fatal', e));
}

