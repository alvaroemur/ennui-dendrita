#!/usr/bin/env ts-node
/**
 * Script que monitorea cambios en Google Drive local y sincroniza al servidor
 * Usa file watching para detectar cambios en tiempo real
 */

import * as fs from 'fs';
import * as path from 'path';
import { DendritaSync } from './sync-to-server';
import { createLogger } from '../utils/logger';

const logger = createLogger('WatchAndSync');

class WatchAndSync {
  private sync: DendritaSync;
  private repoRoot: string;
  private watchPaths: string[] = [];
  private debounceTime: number = 5000; // 5 segundos
  private pendingChanges: Set<string> = new Set();
  private debounceTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.repoRoot = process.cwd();
    this.sync = new DendritaSync();
    this.setupWatchPaths();
  }

  private setupWatchPaths(): void {
    // Watch .dendrita directory
    this.watchPaths.push(path.join(this.repoRoot, '.dendrita'));
    
    // Watch root for manifest changes
    this.watchPaths.push(this.repoRoot);
  }

  private async syncPendingChanges(): Promise<void> {
    if (this.pendingChanges.size === 0) {
      return;
    }

    const filesToSync = Array.from(this.pendingChanges);
    this.pendingChanges.clear();

    logger.info(`Syncing ${filesToSync.length} changed files...`);

    try {
      await this.sync.syncFiles(filesToSync);
      logger.info('Sync completed successfully');
    } catch (error) {
      logger.error('Sync failed', error);
    }
  }

  private handleFileChange(filePath: string, eventType: string): void {
    logger.info(`File ${eventType}: ${filePath}`);

    // Add to pending changes
    this.pendingChanges.add(filePath);

    // Debounce: wait for more changes before syncing
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.syncPendingChanges();
    }, this.debounceTime);
  }

  private watchDirectory(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      logger.warn(`Directory does not exist: ${dirPath}`);
      return;
    }

    logger.info(`Watching directory: ${dirPath}`);

    try {
      fs.watch(dirPath, { recursive: true }, (eventType, filename) => {
        if (!filename) {
          return;
        }

        const fullPath = path.join(dirPath, filename);
        
        // Check if file exists (might be deleted)
        if (eventType === 'rename' && !fs.existsSync(fullPath)) {
          this.handleFileChange(fullPath, 'deleted');
        } else {
          this.handleFileChange(fullPath, eventType);
        }
      });
    } catch (error) {
      logger.error(`Failed to watch directory ${dirPath}`, error);
    }
  }

  start(): void {
    logger.info('Starting file watcher...');
    logger.info(`Watching directories: ${this.watchPaths.join(', ')}`);

    for (const watchPath of this.watchPaths) {
      this.watchDirectory(watchPath);
    }

    logger.info('File watcher started. Press Ctrl+C to stop.');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Stopping file watcher...');
      
      // Sync any pending changes before exit
      if (this.pendingChanges.size > 0) {
        await this.syncPendingChanges();
      }

      process.exit(0);
    });
  }
}

async function main(): Promise<void> {
  const watcher = new WatchAndSync();
  watcher.start();
}

if (require.main === module) {
  main().catch((error) => {
    logger.error('Unhandled error', error);
    process.exit(1);
  });
}

export { WatchAndSync };

