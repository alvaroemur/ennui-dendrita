/**
 * EJEMPLO: Uso básico del servicio SSH
 */

import { SSHClientService } from '../services/ssh/client';
import { SSHAuth } from '../services/ssh/auth';
import { createLogger } from '../utils/logger';

const logger = createLogger('SSHExample');

async function testSSH(): Promise<void> {
  // Verificar si SSH está configurado
  if (!SSHAuth.isConfigured()) {
    logger.warn('SSH not configured. Set SSH_PRIVATE_KEY or SSH_PRIVATE_KEY_PATH in .env.local');
    return;
  }

  // Listar hosts configurados
  const hosts = SSHAuth.listHosts();
  logger.info(`Available hosts: ${hosts.length}`);
  hosts.forEach((host) => {
    logger.info(`  - ${host.name}: ${host.user}@${host.host}:${host.port}`);
  });

  if (hosts.length === 0) {
    logger.warn('No SSH hosts configured. Configure hosts using SSH_HOST_* environment variables');
    return;
  }

  // Usar primer host disponible
  const hostName = hosts[0].name;
  logger.info(`Testing connection to ${hostName}...`);

  const client = new SSHClientService();

  try {
    // Ejecutar comando simple
    logger.info('Executing command: echo "Hello from SSH!"');
    const result = await client.executeCommand(hostName, 'echo "Hello from SSH!"');
    logger.info(`Exit Code: ${result.code}`);
    logger.info(`Stdout: ${result.stdout.trim()}`);
    if (result.stderr) {
      logger.warn(`Stderr: ${result.stderr.trim()}`);
    }

    // Ejecutar comando más complejo
    logger.info('Executing command: uname -a');
    const unameResult = await client.executeCommand(hostName, 'uname -a');
    logger.info(`System Info: ${unameResult.stdout.trim()}`);

    // Desconectar
    await client.disconnect(hostName);
    logger.info('Disconnected successfully');
  } catch (error) {
    logger.error('SSH test failed', error);
  } finally {
    await client.disconnectAll();
  }
}

if (require.main === module) {
  testSSH().catch((e) => logger.error('Fatal', e));
}

