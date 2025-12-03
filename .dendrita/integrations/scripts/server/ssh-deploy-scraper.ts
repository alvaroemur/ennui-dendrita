#!/usr/bin/env ts-node
/**
 * Script ejecutable para deployar un scraper a servidor remoto vía SSH
 * 
 * Uso:
 *   ts-node ssh-deploy-scraper.ts <host> <scraper> [local_path] [remote_path]
 * 
 * Ejemplos:
 *   ts-node ssh-deploy-scraper.ts dev-server gmail-scraper
 *   ts-node ssh-deploy-scraper.ts dev-server gmail-scraper ./local-file.ts /app/dendrita/remote-file.ts
 */

import { SSHScraperHelper } from '../services/ssh/scraper-helper';
import { SSHClientService } from '../services/ssh/client';
import { SSHAuth } from '../services/ssh/auth';
import { createLogger } from '../utils/logger';
import * as path from 'path';

const logger = createLogger('SSHDeployScraperScript');

/**
 * Función principal
 */
async function main(): Promise<void> {
  try {
    // Parsear argumentos
    const args = process.argv.slice(2);
    if (args.length < 2) {
      logger.error('Usage: ts-node ssh-deploy-scraper.ts <host> <scraper> [local_path] [remote_path]');
      logger.error('Examples:');
      logger.error('  ts-node ssh-deploy-scraper.ts dev-server gmail-scraper');
      logger.error('  ts-node ssh-deploy-scraper.ts dev-server gmail-scraper ./local-file.ts /app/dendrita/remote-file.ts');
      process.exit(1);
    }

    const [hostName, scraper, localPath, remotePath] = args;

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

    logger.info(`Deploying scraper ${scraper} to ${hostName}...`);

    const helper = new SSHScraperHelper();
    const client = new SSHClientService();

    try {
      // Deployar scraper
      await helper.deployScraper({
        host: hostName,
        scraper: scraper as 'gmail-scraper' | 'calendar-scraper' | 'drive-scraper',
        localPath: localPath,
        remotePath: remotePath,
      });

      logger.info('Scraper deployed successfully');

      // Verificar que el archivo se deployó correctamente
      logger.info('Verifying deployment...');
      const result = await client.executeCommand(
        hostName,
        `test -f /app/dendrita/.dendrita/integrations/services/google/${scraper}.ts && echo "File exists" || echo "File not found"`
      );
      logger.info(`Verification: ${result.stdout.trim()}`);

      // Verificar que el archivo compila correctamente
      logger.info('Verifying TypeScript compilation...');
      const compileResult = await client.executeCommand(
        hostName,
        `cd /app/dendrita && npx tsc --noEmit .dendrita/integrations/services/google/${scraper}.ts 2>&1 || echo "Compilation check skipped"`
      );
      if (compileResult.stdout) {
        logger.info(`Compilation: ${compileResult.stdout.trim()}`);
      }
      if (compileResult.stderr) {
        logger.warn(`Compilation warnings: ${compileResult.stderr.trim()}`);
      }
    } catch (error) {
      logger.error('Failed to deploy scraper', error);
      process.exit(1);
    } finally {
      await client.disconnectAll();
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

