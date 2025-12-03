/**
 * EJEMPLO: Crear túnel SSH para acceso a recursos internos
 */

import { SSHClientService } from '../services/ssh/client';
import { SSHAuth } from '../services/ssh/auth';
import { createLogger } from '../utils/logger';

const logger = createLogger('SSHTunnelExample');

async function createTunnel(): Promise<void> {
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
  logger.info(`Creating tunnel via ${hostName}...`);

  const client = new SSHClientService();

  try {
    // Crear túnel SSH para Supabase (ejemplo)
    // Esto permite conectar a Supabase vía localhost:5432 desde tu máquina local
    const localPort = 5432;
    const remoteHost = 'db.supabase.co';
    const remotePort = 5432;

    logger.info(`Creating tunnel: localhost:${localPort} -> ${remoteHost}:${remotePort}`);
    const closeTunnel = await client.createTunnel(hostName, {
      localPort,
      remoteHost,
      remotePort,
    });

    logger.info('Tunnel created successfully!');
    logger.info(`You can now connect to ${remoteHost}:${remotePort} via localhost:${localPort}`);
    logger.info('Example: psql -h localhost -p 5432 -U postgres -d postgres');

    // Simular uso del túnel (en producción, usarías el túnel aquí)
    logger.info('Tunnel is active. Press Ctrl+C to close...');

    // Mantener conexión abierta (en producción, el túnel se mantendría abierto)
    // Para este ejemplo, esperamos un poco y luego cerramos
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Cerrar túnel
    logger.info('Closing tunnel...');
    closeTunnel();
    logger.info('Tunnel closed');
  } catch (error) {
    logger.error('Failed to create tunnel', error);
  } finally {
    await client.disconnectAll();
  }
}

if (require.main === module) {
  createTunnel().catch((e) => logger.error('Fatal', e));
}

