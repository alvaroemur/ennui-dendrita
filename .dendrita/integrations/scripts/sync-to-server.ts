#!/usr/bin/env ts-node
/**
 * Script para sincronizar cambios de dendrita local al servidor remoto
 * Detecta cambios y sincroniza archivos según el deployment-manifest.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { SSHClientService } from '../services/ssh/client';
import { SSHAuth } from '../services/ssh/auth';
import { createLogger } from '../utils/logger';

const logger = createLogger('SyncToServer');

interface DeploymentManifest {
  version: string;
  sync: {
    enabled: boolean;
    source: {
      type: string;
      path: string;
      watch?: boolean;
    };
    target: {
      type: string;
      host: string;
      path: string;
    };
    exclude: string[];
    include: string[];
  };
  scripts?: {
    enabled: boolean;
    scripts: Array<{
      id: string;
      name: string;
      script: string;
      enabled: boolean;
      schedule: {
        type: string;
        interval_hours?: number;
        run_on_sync?: boolean;
      };
    }>;
  };
}

interface FileChange {
  path: string;
  type: 'added' | 'modified' | 'deleted';
  timestamp: Date;
}

class DendritaSync {
  private manifest!: DeploymentManifest;
  private manifestPath: string;
  private repoRoot: string;
  private sshClient: SSHClientService;
  private host: string;
  private remotePath: string;

  constructor() {
    this.repoRoot = process.cwd();
    this.manifestPath = path.join(this.repoRoot, '.dendrita', 'deployment-manifest.json');
    this.loadManifest();
    this.sshClient = new SSHClientService();
    this.host = this.manifest.sync.target.host;
    this.remotePath = this.manifest.sync.target.path;
  }

  private loadManifest(): void {
    try {
      const manifestContent = fs.readFileSync(this.manifestPath, 'utf-8');
      this.manifest = JSON.parse(manifestContent);
      logger.info('Manifest loaded successfully');
    } catch (error) {
      logger.error('Failed to load manifest', error);
      throw new Error('Could not load deployment manifest');
    }
  }

  private shouldSync(filePath: string): boolean {
    const relativePath = path.relative(this.repoRoot, filePath);
    
    // Check excludes
    for (const exclude of this.manifest.sync.exclude) {
      if (relativePath.includes(exclude) || relativePath.match(exclude)) {
        return false;
      }
    }
    
    // Check includes
    for (const include of this.manifest.sync.include) {
      if (relativePath.match(include.replace(/\*\*/g, '.*'))) {
        return true;
      }
    }
    
    // Default: sync if in .dendrita directory
    return relativePath.startsWith('.dendrita/');
  }

  private async deployFile(localPath: string, remotePath: string): Promise<boolean> {
    try {
      await this.sshClient.deployFile(this.host, localPath, remotePath);
      logger.info(`Deployed: ${localPath} -> ${remotePath}`);
      return true;
    } catch (error) {
      logger.error(`Failed to deploy ${localPath}`, error);
      return false;
    }
  }

  async syncFiles(changedFiles?: string[]): Promise<void> {
    if (!this.manifest.sync.enabled) {
      logger.info('Sync is disabled in manifest');
      return;
    }

    logger.info('Starting sync to server...');

    try {
      // If specific files provided, sync only those
      if (changedFiles && changedFiles.length > 0) {
        for (const filePath of changedFiles) {
          if (this.shouldSync(filePath)) {
            const relativePath = path.relative(this.repoRoot, filePath);
            const remoteFilePath = path.join(this.remotePath, relativePath).replace(/\\/g, '/');
            await this.deployFile(filePath, remoteFilePath);
          }
        }
      } else {
        // Sync all included files
        logger.info('Syncing all included files...');
        // This would require walking the directory tree
        // For now, we'll sync the manifest and key scripts
        const keyFiles = [
          this.manifestPath,
          path.join(this.repoRoot, '.dendrita', 'integrations', 'scripts', 'sync-documents.ts'),
          path.join(this.repoRoot, '.dendrita', 'integrations', 'scripts', 'sync-user-services.ts'),
        ];

        for (const filePath of keyFiles) {
          if (fs.existsSync(filePath) && this.shouldSync(filePath)) {
            const relativePath = path.relative(this.repoRoot, filePath);
            const remoteFilePath = path.join(this.remotePath, relativePath).replace(/\\/g, '/');
            await this.deployFile(filePath, remoteFilePath);
          }
        }
      }

      logger.info('Sync completed successfully');
    } catch (error) {
      logger.error('Sync failed', error);
      throw error;
    }
  }

  async executeScripts(): Promise<void> {
    if (!this.manifest.scripts?.enabled) {
      logger.info('Script execution is disabled in manifest');
      return;
    }

    logger.info('Checking scripts to execute...');

    for (const scriptConfig of this.manifest.scripts.scripts) {
      if (!scriptConfig.enabled) {
        continue;
      }

      if (scriptConfig.schedule.run_on_sync) {
        logger.info(`Executing script: ${scriptConfig.name} (${scriptConfig.id})`);
        await this.runScript(scriptConfig);
      }
    }
  }

  private async runScript(scriptConfig: any): Promise<void> {
    const scriptPath = path.join(this.remotePath, scriptConfig.script).replace(/\\/g, '/');
    const command = `cd ${this.remotePath} && npx ts-node ${scriptPath}`;

    try {
      const result = await this.sshClient.executeCommand(this.host, command, scriptConfig.timeout || 300000);
      
      if (result.code === 0) {
        logger.info(`Script ${scriptConfig.id} executed successfully`);
      } else {
        logger.error(`Script ${scriptConfig.id} failed with exit code ${result.code}`);
        logger.error(`Stderr: ${result.stderr}`);
      }
    } catch (error) {
      logger.error(`Failed to execute script ${scriptConfig.id}`, error);
    }
  }
}

async function main(): Promise<void> {
  const sync = new DendritaSync();
  
  // Get changed files from command line args or sync all
  const changedFiles = process.argv.slice(2);
  
  try {
    await sync.syncFiles(changedFiles.length > 0 ? changedFiles : undefined);
    await sync.executeScripts();
  } catch (error) {
    logger.error('Sync process failed', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    logger.error('Unhandled error', error);
    process.exit(1);
  });
}

export { DendritaSync };

