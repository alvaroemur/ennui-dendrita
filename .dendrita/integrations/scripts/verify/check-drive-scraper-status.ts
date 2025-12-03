#!/usr/bin/env npx ts-node
/**
 * Script para verificar el estado del scraper de Drive
 * 
 * Uso:
 *   ts-node check-drive-scraper-status.ts [workspace]
 */

import { SupabaseService } from '../services/supabase/client';
import { createLogger } from '../utils/logger';
import * as path from 'path';
import * as fs from 'fs';

const logger = createLogger('CheckDriveScraperStatus');

async function main(workspace?: string): Promise<void> {
  try {
    logger.info('Checking Drive scraper status...\n');

    const supabaseService = new SupabaseService();
    if (!supabaseService.isConfigured()) {
      logger.error('Supabase no está configurado');
      process.exit(1);
    }

    const db = supabaseService.db(false);

    // Obtener user_id
    const projectRoot = path.resolve(__dirname, '../../..');
    const usersDir = path.join(projectRoot, '.dendrita', 'users');
    const userDirs = fs.readdirSync(usersDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    const userId = process.env.USER_ID || userDirs[0];

    logger.info(`User ID: ${userId}`);
    if (workspace) {
      logger.info(`Workspace: ${workspace}\n`);
    } else {
      logger.info('Workspace: all\n');
    }

    // Consultar configuraciones
    let query = db
      .from('drive_scraping_configs')
      .select('*')
      .eq('user_id', userId);

    if (workspace) {
      query = query.eq('workspace', workspace);
    }

    const { data: configs, error: configError } = await query;

    if (configError) {
      logger.error('Error al consultar configuraciones:', configError);
      process.exit(1);
    }

    if (!configs || configs.length === 0) {
      logger.warn('No se encontraron configuraciones de scraping');
      return;
    }

    logger.info(`📋 Configuraciones encontradas: ${configs.length}\n`);

    for (const config of configs) {
      console.log(`\n📁 Config: ${config.config_name}`);
      console.log(`   Workspace: ${config.workspace || 'default'}`);
      console.log(`   Enabled: ${config.enabled ? '✅' : '❌'}`);
      console.log(`   Folders: ${config.folder_ids?.length || 0}`);
      
      if (config.last_sync_at) {
        const lastSync = new Date(config.last_sync_at);
        const now = new Date();
        const diffMs = now.getTime() - lastSync.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        
        console.log(`   Last sync: ${lastSync.toLocaleString()}`);
        if (diffMins < 60) {
          console.log(`   (${diffMins} minutes ago)`);
        } else {
          console.log(`   (${diffHours} hours ago)`);
        }
        console.log(`   Status: ${config.last_sync_status || 'unknown'}`);
        console.log(`   Files processed: ${config.last_sync_file_count || 0}`);
        if (config.last_sync_error) {
          console.log(`   ⚠️  Error: ${config.last_sync_error}`);
        }
      } else {
        console.log(`   Last sync: Never (first run)`);
      }

      // Contar archivos indexados para esta configuración
      if (config.id) {
        const { count, error: countError } = await db
          .from('drive_files')
          .select('*', { count: 'exact', head: true })
          .eq('config_id', config.id);

        if (!countError && count !== null) {
          console.log(`   Files indexed: ${count}`);
        }

        // Contar archivos nuevos/modificados en las últimas 24 horas
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const { count: recentCount, error: recentError } = await db
          .from('drive_files')
          .select('*', { count: 'exact', head: true })
          .eq('config_id', config.id)
          .gte('created_at', yesterday.toISOString());

        if (!recentError && recentCount !== null && recentCount > 0) {
          console.log(`   Files indexed in last 24h: ${recentCount}`);
        }
      }
    }

    // Si hay workspace específico, buscar archivos de la carpeta nueva
    if (workspace) {
      const { data: newFolderFiles, error: newFolderError } = await db
        .from('drive_files')
        .select('id, name, mime_type, modified_time, created_at')
        .eq('workspace', workspace)
        .like('folder_path', '%graphic assets%')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!newFolderError && newFolderFiles && newFolderFiles.length > 0) {
        console.log(`\n📂 Archivos encontrados en "graphic assets":`);
        newFolderFiles.forEach((file, index) => {
          console.log(`   ${index + 1}. ${file.name} (${file.mime_type})`);
          if (file.created_at) {
            const created = new Date(file.created_at);
            console.log(`      Indexed: ${created.toLocaleString()}`);
          }
        });
      }
    }

    logger.info('\n✅ Status check completed');
  } catch (error: any) {
    logger.error('Error checking status', error);
    process.exit(1);
  }
}

if (require.main === module) {
  const workspace = process.argv[2];
  main(workspace).catch((error) => {
    logger.error('Error no manejado', error);
    process.exit(1);
  });
}

export { main };

