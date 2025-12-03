/**
 * Servicio de autenticación SSH
 * Maneja claves SSH y configuración de hosts sin exponer credenciales
 */

import { credentials } from '../../utils/credentials';
import { createLogger } from '../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('SSHAuth');

export interface SSHHostConfig {
  name: string;
  host: string;
  user: string;
  port: number;
  privateKey?: string;
  privateKeyPath?: string;
}

export interface SSHConfig {
  privateKey?: string;
  privateKeyPath?: string;
  configPath?: string;
  hosts: Record<string, SSHHostConfig>;
}

export class SSHAuth {
  /**
   * Obtiene configuración SSH desde credenciales
   */
  static getSSHConfig(): SSHConfig {
    try {
      return credentials.getSSH();
    } catch (error) {
      logger.error('Failed to get SSH config', error);
      throw error;
    }
  }

  /**
   * Obtiene configuración de un host específico
   */
  static getHostConfig(hostName: string): SSHHostConfig {
    try {
      const config = credentials.getSSHHost(hostName);
      if (!config) {
        throw new Error(`SSH host '${hostName}' not configured`);
      }
      return config;
    } catch (error) {
      logger.error(`Failed to get SSH host config for ${hostName}`, error);
      throw error;
    }
  }

  /**
   * Obtiene la clave privada SSH para un host
   */
  static getPrivateKey(hostConfig?: SSHHostConfig): string | Buffer {
    try {
      // Si el host tiene clave específica, usar esa
      if (hostConfig?.privateKey) {
        return hostConfig.privateKey;
      }

      if (hostConfig?.privateKeyPath) {
        const keyPath = path.resolve(hostConfig.privateKeyPath);
        if (!fs.existsSync(keyPath)) {
          throw new Error(`SSH private key file not found: ${keyPath}`);
        }
        return fs.readFileSync(keyPath, 'utf-8');
      }

      // Intentar usar clave global
      const config = credentials.getSSH();
      if (config.privateKey) {
        return config.privateKey;
      }

      if (config.privateKeyPath) {
        const keyPath = path.resolve(config.privateKeyPath);
        if (!fs.existsSync(keyPath)) {
          throw new Error(`SSH private key file not found: ${keyPath}`);
        }
        return fs.readFileSync(keyPath, 'utf-8');
      }

      // Intentar usar ~/.ssh/id_rsa por defecto
      const defaultKeyPath = path.join(process.env.HOME || process.env.USERPROFILE || '', '.ssh', 'id_rsa');
      if (fs.existsSync(defaultKeyPath)) {
        logger.debug(`Using default SSH key: ${defaultKeyPath}`);
        return fs.readFileSync(defaultKeyPath, 'utf-8');
      }

      throw new Error('SSH private key not configured. Set SSH_PRIVATE_KEY or SSH_PRIVATE_KEY_PATH');
    } catch (error) {
      logger.error('Failed to get SSH private key', error);
      throw error;
    }
  }

  /**
   * Verifica si SSH está configurado
   */
  static isConfigured(): boolean {
    try {
      credentials.getSSH();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verifica si un host específico está configurado
   */
  static isHostConfigured(hostName: string): boolean {
    try {
      const config = credentials.getSSHHost(hostName);
      return !!config;
    } catch {
      return false;
    }
  }

  /**
   * Lista todos los hosts SSH configurados
   */
  static listHosts(): SSHHostConfig[] {
    try {
      const config = credentials.getSSH();
      return Object.values(config.hosts || {});
    } catch {
      return [];
    }
  }
}

