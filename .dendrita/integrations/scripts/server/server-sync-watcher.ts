#!/usr/bin/env ts-node
/**
 * Servicio en el servidor remoto que monitorea cambios y ejecuta scripts
 * según el deployment-manifest.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface DeploymentManifest {
  version: string;
  sync: {
    enabled: boolean;
  };
  scripts: {
    enabled: boolean;
    execution_mode: string;
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
      timeout?: number;
      retry?: {
        enabled: boolean;
        max_attempts: number;
        delay_seconds: number;
      };
    }>;
  };
  logging: {
    enabled: boolean;
    level: string;
    path: string;
  };
}

class ServerSyncWatcher {
  private manifestPath: string;
  private repoRoot: string;
  private manifest: DeploymentManifest;
  private lastManifestHash: string;
  private scriptLastRun: Map<string, Date> = new Map();

  constructor(repoRoot: string = '/app/dendrita') {
    this.repoRoot = repoRoot;
    this.manifestPath = path.join(this.repoRoot, '.dendrita', 'deployment-manifest.json');
    this.loadManifest();
  }

  private loadManifest(): void {
    try {
      if (!fs.existsSync(this.manifestPath)) {
        console.log(`Manifest not found at ${this.manifestPath}`);
        return;
      }

      const manifestContent = fs.readFileSync(this.manifestPath, 'utf-8');
      this.manifest = JSON.parse(manifestContent);
      this.lastManifestHash = this.hashString(manifestContent);
      console.log('Manifest loaded successfully');
    } catch (error) {
      console.error('Failed to load manifest', error);
    }
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  async checkManifestChanges(): Promise<boolean> {
    try {
      if (!fs.existsSync(this.manifestPath)) {
        return false;
      }

      const manifestContent = fs.readFileSync(this.manifestPath, 'utf-8');
      const currentHash = this.hashString(manifestContent);

      if (currentHash !== this.lastManifestHash) {
        this.loadManifest();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking manifest changes', error);
      return false;
    }
  }

  private shouldRunScript(scriptConfig: any): boolean {
    if (!scriptConfig.enabled) {
      return false;
    }

    const schedule = scriptConfig.schedule;

    if (schedule.type === 'manual') {
      return false;
    }

    if (schedule.type === 'interval') {
      const lastRun = this.scriptLastRun.get(scriptConfig.id);
      if (!lastRun) {
        return true;
      }

      const hoursSinceLastRun = (Date.now() - lastRun.getTime()) / (1000 * 60 * 60);
      return hoursSinceLastRun >= (schedule.interval_hours || 24);
    }

    return false;
  }

  async executeScript(scriptConfig: any): Promise<boolean> {
    const scriptPath = path.join(this.repoRoot, scriptConfig.script);
    
    if (!fs.existsSync(scriptPath)) {
      console.error(`Script not found: ${scriptPath}`);
      return false;
    }

    const command = `cd ${this.repoRoot} && npx ts-node ${scriptConfig.script}`;
    const timeout = scriptConfig.timeout || 300000;

    try {
      console.log(`Executing script: ${scriptConfig.name} (${scriptConfig.id})`);
      
      const { stdout, stderr } = await execAsync(command, {
        timeout,
        cwd: this.repoRoot,
      });

      if (stdout) {
        console.log(`Script ${scriptConfig.id} stdout:`, stdout);
      }

      if (stderr) {
        console.error(`Script ${scriptConfig.id} stderr:`, stderr);
      }

      this.scriptLastRun.set(scriptConfig.id, new Date());
      console.log(`Script ${scriptConfig.id} executed successfully`);
      return true;
    } catch (error: any) {
      console.error(`Script ${scriptConfig.id} failed:`, error.message);
      
      // Retry logic
      if (scriptConfig.retry?.enabled) {
        const attempts = this.scriptLastRun.get(`${scriptConfig.id}_attempts`) || 0;
        if (attempts < scriptConfig.retry.max_attempts) {
          console.log(`Retrying script ${scriptConfig.id} (attempt ${attempts + 1})`);
          await new Promise(resolve => setTimeout(resolve, scriptConfig.retry.delay_seconds * 1000));
          this.scriptLastRun.set(`${scriptConfig.id}_attempts`, attempts + 1);
          return await this.executeScript(scriptConfig);
        }
      }

      return false;
    }
  }

  async checkAndExecuteScripts(): Promise<void> {
    if (!this.manifest?.scripts?.enabled) {
      return;
    }

    for (const scriptConfig of this.manifest.scripts.scripts) {
      if (this.shouldRunScript(scriptConfig)) {
        await this.executeScript(scriptConfig);
      }
    }
  }

  async watch(): Promise<void> {
    console.log('Starting server sync watcher...');
    console.log(`Watching manifest: ${this.manifestPath}`);
    console.log(`Repo root: ${this.repoRoot}`);

    // Initial check
    await this.checkAndExecuteScripts();

    // Watch for manifest changes
    setInterval(async () => {
      const manifestChanged = await this.checkManifestChanges();
      if (manifestChanged) {
        console.log('Manifest changed, checking scripts...');
        await this.checkAndExecuteScripts();
      }
    }, 60000); // Check every minute

    // Periodic script execution check
    setInterval(async () => {
      await this.checkAndExecuteScripts();
    }, 3600000); // Check every hour
  }
}

async function main(): Promise<void> {
  const repoRoot = process.env.DENDRITA_REPO_ROOT || '/app/dendrita';
  const watcher = new ServerSyncWatcher(repoRoot);
  await watcher.watch();
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error', error);
    process.exit(1);
  });
}

export { ServerSyncWatcher };

