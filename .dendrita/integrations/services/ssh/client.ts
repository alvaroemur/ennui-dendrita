/**
 * Cliente SSH para ejecutar comandos remotos
 * Maneja conexiones SSH, ejecución de comandos, túneles y deploy de archivos
 */

import { SSHAuth, SSHHostConfig } from './auth';
import { createLogger } from '../../utils/logger';
import { Client as SSHClient, ConnectConfig } from 'ssh2';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('SSHClient');

export interface SSHExecuteResult {
  stdout: string;
  stderr: string;
  code: number | null;
  signal: string | null;
}

export interface SSHTunnelConfig {
  localPort: number;
  remoteHost: string;
  remotePort: number;
}

export class SSHClientService {
  private connections: Map<string, SSHClient> = new Map();

  /**
   * Conecta a un host SSH
   */
  async connect(hostName: string): Promise<SSHClient> {
    try {
      // Reutilizar conexión existente si está activa
      const existingConnection = this.connections.get(hostName);
      if (existingConnection && existingConnection.config) {
        logger.debug(`Reusing existing connection to ${hostName}`);
        return existingConnection;
      }

      const hostConfig = SSHAuth.getHostConfig(hostName);
      const privateKey = SSHAuth.getPrivateKey(hostConfig);

      const connectConfig: ConnectConfig = {
        host: hostConfig.host,
        port: hostConfig.port || 22,
        username: hostConfig.user,
        privateKey: typeof privateKey === 'string' ? privateKey : privateKey.toString(),
        readyTimeout: 20000,
        keepaliveInterval: 30000,
        keepaliveCountMax: 3,
      };

      logger.info(`Connecting to SSH host: ${hostName} (${hostConfig.host}:${hostConfig.port || 22})`);

      return new Promise((resolve, reject) => {
        const client = new SSHClient();
        let resolved = false;

        client.on('ready', () => {
          if (!resolved) {
            resolved = true;
            logger.info(`Successfully connected to ${hostName}`);
            this.connections.set(hostName, client);
            resolve(client);
          }
        });

        client.on('error', (err) => {
          if (!resolved) {
            resolved = true;
            logger.error(`Failed to connect to ${hostName}`, err);
            reject(err);
          }
        });

        client.on('close', () => {
          logger.debug(`Connection to ${hostName} closed`);
          this.connections.delete(hostName);
        });

        client.connect(connectConfig);
      });
    } catch (error) {
      logger.error(`Failed to connect to ${hostName}`, error);
      throw error;
    }
  }

  /**
   * Desconecta de un host SSH
   */
  async disconnect(hostName: string): Promise<void> {
    try {
      const connection = this.connections.get(hostName);
      if (connection) {
        connection.end();
        this.connections.delete(hostName);
        logger.info(`Disconnected from ${hostName}`);
      }
    } catch (error) {
      logger.error(`Failed to disconnect from ${hostName}`, error);
      throw error;
    }
  }

  /**
   * Ejecuta un comando en un host remoto
   */
  async executeCommand(hostName: string, command: string, timeout: number = 30000): Promise<SSHExecuteResult> {
    try {
      const client = await this.connect(hostName);

      logger.debug(`Executing command on ${hostName}: ${command.substring(0, 100)}${command.length > 100 ? '...' : ''}`);

      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error(`Command timeout after ${timeout}ms`));
        }, timeout);

        client.exec(command, (err, stream) => {
          if (err) {
            clearTimeout(timeoutId);
            reject(err);
            return;
          }

          let stdout = '';
          let stderr = '';

          stream.on('close', (code: number | null, signal: string | null) => {
            clearTimeout(timeoutId);
            logger.debug(`Command finished on ${hostName} with code ${code}`);
            resolve({
              stdout,
              stderr,
              code,
              signal,
            });
          });

          stream.on('data', (data: Buffer) => {
            stdout += data.toString();
          });

          stream.stderr.on('data', (data: Buffer) => {
            stderr += data.toString();
          });
        });
      });
    } catch (error) {
      logger.error(`Failed to execute command on ${hostName}`, error);
      throw error;
    }
  }

  /**
   * Crea un túnel SSH (port forwarding)
   * Nota: Esta implementación requiere que el servidor SSH soporte port forwarding
   * Para usar local port forwarding, necesitarías usar un servidor local que escuche
   * y redirija a través de SSH. Esta función retorna información sobre cómo configurar el túnel.
   */
  async createTunnel(hostName: string, tunnelConfig: SSHTunnelConfig): Promise<() => void> {
    try {
      const client = await this.connect(hostName);

      logger.info(`Creating tunnel on ${hostName}: localhost:${tunnelConfig.localPort} -> ${tunnelConfig.remoteHost}:${tunnelConfig.remotePort}`);

      // Nota: SSH2 no soporta directamente local port forwarding desde el cliente
      // Para implementar esto correctamente, necesitarías un servidor local que escuche
      // en localPort y redirija a través de SSH usando forwardOut
      // Por ahora, retornamos una función que documenta cómo usar el túnel

      logger.warn(`Port forwarding requires local server setup. Use SSH command: ssh -L ${tunnelConfig.localPort}:${tunnelConfig.remoteHost}:${tunnelConfig.remotePort} ${hostName}`);

      // Retornar función para "cerrar" el túnel (en este caso, solo desconectar)
      const closeTunnel = () => {
        logger.info(`Tunnel closed on ${hostName}`);
        this.disconnect(hostName);
      };

      return Promise.resolve(closeTunnel);
    } catch (error) {
      logger.error(`Failed to create tunnel on ${hostName}`, error);
      throw error;
    }
  }

  /**
   * Deploya un archivo a un host remoto usando SCP
   */
  async deployFile(hostName: string, localPath: string, remotePath: string): Promise<void> {
    try {
      const client = await this.connect(hostName);

      if (!fs.existsSync(localPath)) {
        throw new Error(`Local file not found: ${localPath}`);
      }

      const fileContent = fs.readFileSync(localPath);
      const fileStats = fs.statSync(localPath);

      logger.info(`Deploying file to ${hostName}: ${localPath} -> ${remotePath}`);

      return new Promise((resolve, reject) => {
        client.sftp((err, sftp) => {
          if (err) {
            reject(err);
            return;
          }

          // Crear directorio remoto si no existe
          const remoteDir = path.dirname(remotePath);
          sftp.mkdir(remoteDir, { recursive: true }, (mkdirErr) => {
            // Ignorar error si el directorio ya existe
            if (mkdirErr && mkdirErr.code !== 4) {
              logger.warn(`Failed to create remote directory: ${mkdirErr.message}`);
            }

            // Escribir archivo
            const writeStream = sftp.createWriteStream(remotePath);
            writeStream.on('close', () => {
              logger.info(`File deployed successfully to ${hostName}`);
              resolve();
            });

            writeStream.on('error', (writeErr) => {
              logger.error(`Failed to write file to ${hostName}`, writeErr);
              reject(writeErr);
            });

            writeStream.write(fileContent);
            writeStream.end();
          });
        });
      });
    } catch (error) {
      logger.error(`Failed to deploy file to ${hostName}`, error);
      throw error;
    }
  }

  /**
   * Lee un archivo remoto
   */
  async readFile(hostName: string, remotePath: string): Promise<string> {
    try {
      const client = await this.connect(hostName);

      logger.debug(`Reading file from ${hostName}: ${remotePath}`);

      return new Promise((resolve, reject) => {
        client.sftp((err, sftp) => {
          if (err) {
            reject(err);
            return;
          }

          sftp.readFile(remotePath, 'utf8', (readErr, data) => {
            if (readErr) {
              logger.error(`Failed to read file from ${hostName}`, readErr);
              reject(readErr);
              return;
            }

            resolve(data);
          });
        });
      });
    } catch (error) {
      logger.error(`Failed to read file from ${hostName}`, error);
      throw error;
    }
  }

  /**
   * Cierra todas las conexiones
   */
  async disconnectAll(): Promise<void> {
    const hostNames = Array.from(this.connections.keys());
    for (const hostName of hostNames) {
      await this.disconnect(hostName);
    }
  }
}

