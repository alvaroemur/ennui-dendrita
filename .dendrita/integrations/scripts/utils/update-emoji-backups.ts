#!/usr/bin/env ts-node

/**
 * Script to update hidden backups of files/folders with emojis in their names
 * 
 * Usage:
 *   ts-node update-emoji-backups.ts [workspace] [path]
 *   ts-node update-emoji-backups.ts --all
 *   ts-node update-emoji-backups.ts --create [path]
 */

import * as fs from 'fs';
import * as path from 'path';

interface BackupConfig {
  workspace?: string;
  targetPath?: string;
  createOnly?: boolean;
  updateAll?: boolean;
}

/**
 * Sanitize filename: remove emojis, replace spaces with hyphens, lowercase
 */
function sanitizeFilename(filename: string): string {
  // Remove emojis (Unicode ranges for emojis)
  let sanitized = filename.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FAFF}]/gu, '');
  
  // Replace spaces with hyphens
  sanitized = sanitized.replace(/\s+/g, '-');
  
  // Remove multiple hyphens
  sanitized = sanitized.replace(/-+/g, '-');
  
  // Remove leading/trailing hyphens
  sanitized = sanitized.replace(/^-+|-+$/g, '');
  
  // Convert to lowercase
  sanitized = sanitized.toLowerCase();
  
  return sanitized;
}

/**
 * Check if filename contains emojis or special characters
 */
function hasEmojisOrSpecialChars(filename: string): boolean {
  // Check for emojis
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FAFF}]/u;
  if (emojiRegex.test(filename)) return true;
  
  // Check for spaces (not allowed in system files)
  if (filename.includes(' ')) return true;
  
  return false;
}

/**
 * Get backup filename
 */
function getBackupName(originalName: string): string {
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext);
  const sanitized = sanitizeFilename(base);
  return `.${sanitized}${ext}`;
}

/**
 * Create or update backup for a file
 */
function backupFile(filePath: string): void {
  const dir = path.dirname(filePath);
  const filename = path.basename(filePath);
  
  if (!hasEmojisOrSpecialChars(filename)) {
    return; // No need to backup
  }
  
  const backupName = getBackupName(filename);
  const backupPath = path.join(dir, backupName);
  
  try {
    // Copy file content
    fs.copyFileSync(filePath, backupPath);
    console.log(`✅ Backup created/updated: ${backupName}`);
  } catch (error) {
    console.error(`❌ Error backing up ${filename}:`, error);
  }
}

/**
 * Recursively copy directory contents
 */
function copyDirectory(src: string, dest: string): void {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const items = fs.readdirSync(src, { withFileTypes: true });
  
  for (const item of items) {
    const srcPath = path.join(src, item.name);
    const destPath = path.join(dest, item.name);
    
    // Skip hidden files and system directories
    if (item.name.startsWith('.')) continue;
    if (item.name === 'node_modules') continue;
    
    if (item.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Recursively find and backup files with emojis
 */
function findAndBackupFiles(dir: string, config: BackupConfig): void {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    // Skip hidden files and system directories
    if (item.name.startsWith('.')) continue;
    if (item.name === 'node_modules') continue;
    
    if (item.isDirectory()) {
      // Check if directory name has emojis
      if (hasEmojisOrSpecialChars(item.name)) {
        const backupName = getBackupName(item.name);
        const backupPath = path.join(dir, backupName);
        
        // Create backup directory structure
        if (!fs.existsSync(backupPath)) {
          fs.mkdirSync(backupPath, { recursive: true });
          console.log(`📁 Backup directory created: ${backupName}/`);
        }
        
        // Copy directory contents
        copyDirectory(fullPath, backupPath);
        console.log(`✅ Backup directory updated: ${backupName}/`);
        
        // Recursively backup contents
        findAndBackupFiles(fullPath, config);
      } else {
        // Continue searching in subdirectories
        findAndBackupFiles(fullPath, config);
      }
    } else if (item.isFile() && item.name.endsWith('.md')) {
      // Backup markdown files with emojis
      if (hasEmojisOrSpecialChars(item.name)) {
        backupFile(fullPath);
      }
    }
  }
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const config: BackupConfig = {};
  
  if (args.includes('--all')) {
    config.updateAll = true;
    // Update all workspaces
    const workspacesDir = path.join(process.cwd(), 'workspaces');
    if (fs.existsSync(workspacesDir)) {
      const workspaces = fs.readdirSync(workspacesDir, { withFileTypes: true })
        .filter(item => item.isDirectory() && !item.name.startsWith('.'));
      
      for (const workspace of workspaces) {
        console.log(`\n📦 Processing workspace: ${workspace.name}`);
        findAndBackupFiles(path.join(workspacesDir, workspace.name), config);
      }
    }
  } else if (args.includes('--create')) {
    config.createOnly = true;
    const targetPath = args[args.indexOf('--create') + 1];
    if (targetPath) {
      const fullPath = path.resolve(targetPath);
      if (fs.existsSync(fullPath)) {
        if (fs.statSync(fullPath).isFile()) {
          backupFile(fullPath);
        } else {
          findAndBackupFiles(fullPath, config);
        }
      } else {
        console.error(`❌ Path not found: ${fullPath}`);
      }
    } else {
      console.error('❌ Please provide a path after --create');
    }
  } else {
    // Default: update backups in specified workspace/path
    const workspace = args[0];
    const targetPath = args[1];
    
    if (workspace) {
      const workspacePath = path.join(process.cwd(), 'workspaces', workspace);
      if (fs.existsSync(workspacePath)) {
        const searchPath = targetPath 
          ? path.join(workspacePath, targetPath)
          : workspacePath;
        
        if (fs.existsSync(searchPath)) {
          console.log(`\n📦 Processing: ${searchPath}`);
          findAndBackupFiles(searchPath, config);
        } else {
          console.error(`❌ Path not found: ${searchPath}`);
        }
      } else {
        console.error(`❌ Workspace not found: ${workspace}`);
      }
    } else {
      console.log('Usage:');
      console.log('  ts-node update-emoji-backups.ts [workspace] [path]');
      console.log('  ts-node update-emoji-backups.ts --all');
      console.log('  ts-node update-emoji-backups.ts --create [path]');
      console.log('');
      console.log('Examples:');
      console.log('  ts-node update-emoji-backups.ts inspiro company-management');
      console.log('  ts-node update-emoji-backups.ts --all');
      console.log('  ts-node update-emoji-backups.ts --create workspaces/inspiro/company-management/✅\ Participantes\ aceptados.md');
    }
  }
}

if (require.main === module) {
  main();
}

