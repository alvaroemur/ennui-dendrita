/**
 * EJEMPLO: Deploy de archivos a servidor remoto vía SSH
 */

import { SSHClientService } from '../services/ssh/client';
import { SSHAuth } from '../services/ssh/auth';
import { createLogger } from '../utils/logger';
import * as path from 'path';

const logger = createLogger('SSHDeployExample');

async function deployFile(): Promise<void> {
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
  logger.info(`Deploying file to ${hostName}...`);

  const client = new SSHClientService();

  try {
    // Deploy de un archivo de ejemplo
    const localPath = path.join(__dirname, '../services/ssh/client.ts');
    const remotePath = '/app/dendrita/.dendrita/integrations/services/ssh/client.ts';

    logger.info(`Deploying: ${localPath} -> ${remotePath}`);
    await client.deployFile(hostName, localPath, remotePath);
    logger.info('File deployed successfully');

    // Verificar que el archivo se deployó correctamente
    logger.info('Verifying deployed file...');
    const verifyResult = await client.executeCommand(hostName, `test -f ${remotePath} && echo "File exists" || echo "File not found"`);
    logger.info(`Verification: ${verifyResult.stdout.trim()}`);

    // Ver contenido del archivo remoto (primeras líneas)
    logger.info('Reading first lines of remote file...');
    const readResult = await client.readFile(hostName, remotePath);
    const lines = readResult.split('\n').slice(0, 5).join('\n');
    logger.info(`First 5 lines:\n${lines}...`);
  } catch (error) {
    logger.error('Failed to deploy file', error);
  } finally {
    await client.disconnectAll();
  }
}

if (require.main === module) {
  deployFile().catch((e) => logger.error('Fatal', e));
}

