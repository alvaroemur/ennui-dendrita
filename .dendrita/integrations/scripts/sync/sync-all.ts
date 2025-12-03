#!/usr/bin/env ts-node
/**
 * Sync Pipeline - Sincronización Completa
 * 
 * Sincroniza: workspaces, projects, documents, stakeholders, user service configs
 * 
 * Uso:
 *   ts-node sync/sync-all.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from '../../utils/logger';
import { SupabaseService } from '../../services/supabase/client';
import { credentials } from '../../utils/credentials';
import { loadConfig, listDirs, listFiles, detectDocType, buildSlug } from './utils';
// Import syncDocuments function directly

const logger = createLogger('SyncAll');

interface WorkspaceInfo {
  code: string;
  name: string;
  description: string;
  style_config: Record<string, any>;
  metadata: Record<string, any>;
}

interface ProjectInfo {
  workspace_code: string;
  code: string;
  name: string;
  status: 'active' | 'archived';
  path: string;
}

interface StakeholderData {
  workspace_code: string;
  data: Record<string, any>;
  file_path: string;
}

/**
 * Recolecta información de workspaces
 */
function collectWorkspaces(repoRoot: string): WorkspaceInfo[] {
  const workspaces: WorkspaceInfo[] = [];
  const workspacesDir = path.join(repoRoot, 'workspaces');

  if (!fs.existsSync(workspacesDir)) {
    return workspaces;
  }

  const workspaceDirs = listDirs(workspacesDir);

  for (const wsCode of workspaceDirs) {
    if (wsCode === 'template') continue;

    const wsDir = path.join(workspacesDir, wsCode);
    const configFile = path.join(wsDir, 'config-estilo.json');
    const readmeFile = path.join(wsDir, 'README.md');

    let styleConfig: Record<string, any> = {};
    let description = wsCode;

    if (fs.existsSync(configFile)) {
      try {
        styleConfig = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
      } catch (error) {
        logger.warn(`Error reading config for ${wsCode}:`, error);
      }
    }

    if (fs.existsSync(readmeFile)) {
      try {
        description = fs.readFileSync(readmeFile, 'utf-8').substring(0, 200);
      } catch (error) {
        logger.warn(`Error reading README for ${wsCode}:`, error);
      }
    }

    const metadata = {
      path: path.relative(repoRoot, wsDir),
      has_config: fs.existsSync(configFile),
      has_readme: fs.existsSync(readmeFile),
    };

    workspaces.push({
      code: wsCode,
      name: wsCode,
      description,
      style_config: styleConfig,
      metadata,
    });
  }

  return workspaces;
}

/**
 * Recolecta información de proyectos (activos y archivados)
 */
function collectProjects(repoRoot: string): ProjectInfo[] {
  const projects: ProjectInfo[] = [];
  const workspacesDir = path.join(repoRoot, 'workspaces');

  if (!fs.existsSync(workspacesDir)) {
    return projects;
  }

  const workspaceDirs = listDirs(workspacesDir);

  for (const wsCode of workspaceDirs) {
    if (wsCode === 'template') continue;

    // Active projects
    const activeDir = path.join(workspacesDir, wsCode, '🚀 active-projects');
    if (fs.existsSync(activeDir)) {
      const projectDirs = listDirs(activeDir);
      for (const projectCode of projectDirs) {
        projects.push({
          workspace_code: wsCode,
          code: projectCode,
          name: projectCode.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          status: 'active',
          path: path.join(activeDir, projectCode),
        });
      }
    }

    // Archived projects
    const archivedDir = path.join(workspacesDir, wsCode, '_archived-projects');
    if (fs.existsSync(archivedDir)) {
      const projectDirs = listDirs(archivedDir);
      for (const projectCode of projectDirs) {
        projects.push({
          workspace_code: wsCode,
          code: projectCode,
          name: projectCode.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          status: 'archived',
          path: path.join(archivedDir, projectCode),
        });
      }
    }
  }

  return projects;
}

/**
 * Recolecta stakeholders desde archivos JSON
 */
function collectStakeholders(repoRoot: string): StakeholderData[] {
  const stakeholders: StakeholderData[] = [];
  const workspacesDir = path.join(repoRoot, 'workspaces');

  if (!fs.existsSync(workspacesDir)) {
    return stakeholders;
  }

  const workspaceDirs = listDirs(workspacesDir);

  for (const wsCode of workspaceDirs) {
    const stakeholdersDir = path.join(workspacesDir, wsCode, '🤝 stakeholders', 'fichas-json');

    if (!fs.existsSync(stakeholdersDir)) {
      continue;
    }

    const jsonFiles = listFiles(stakeholdersDir, (f) => f.endsWith('.json'));

    for (const jsonFile of jsonFiles) {
      const jsonPath = path.join(stakeholdersDir, jsonFile);
      try {
        const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        stakeholders.push({
          workspace_code: wsCode,
          data,
          file_path: path.relative(repoRoot, jsonPath),
        });
      } catch (error) {
        logger.warn(`Error reading ${jsonFile}:`, error);
      }
    }
  }

  return stakeholders;
}

/**
 * Sincroniza workspaces a Supabase
 */
async function syncWorkspaces(
  db: ReturnType<SupabaseService['db']>,
  workspaces: WorkspaceInfo[]
): Promise<Map<string, string>> {
  const wsCache = new Map<string, string>();

  for (const ws of workspaces) {
    try {
      const { data, error } = await db
        .from('workspaces')
        .upsert(
          {
            code: ws.code,
            name: ws.name,
            description: ws.description,
            style_config: ws.style_config,
            metadata: ws.metadata,
          },
          { onConflict: 'code' }
        )
        .select('id')
        .single();

      if (error) throw error;
      wsCache.set(ws.code, data.id);
      logger.info(`  ✅ ${ws.code}`);
    } catch (error: any) {
      logger.error(`  ❌ ${ws.code}:`, error);
    }
  }

  return wsCache;
}

/**
 * Sincroniza proyectos a Supabase
 */
async function syncProjects(
  db: ReturnType<SupabaseService['db']>,
  projects: ProjectInfo[],
  wsCache: Map<string, string>
): Promise<Map<string, string>> {
  const prCache = new Map<string, string>();

  for (const pr of projects) {
    const wsId = wsCache.get(pr.workspace_code);
    if (!wsId) {
      logger.warn(`  ⚠️  Skipping ${pr.workspace_code}/${pr.code}: workspace not found`);
      continue;
    }

    try {
      const { data, error } = await db
        .from('projects')
        .upsert(
          {
            workspace_id: wsId,
            code: pr.code,
            name: pr.name,
            status: pr.status,
            metadata: { path: pr.path, source: 'sync-all' },
          },
          { onConflict: 'workspace_id,code' }
        )
        .select('id')
        .single();

      if (error) throw error;
      prCache.set(`${pr.workspace_code}:${pr.code}`, data.id);
      logger.info(`  ✅ ${pr.workspace_code}/${pr.code} (${pr.status})`);
    } catch (error: any) {
      logger.error(`  ❌ ${pr.code}:`, error);
    }
  }

  return prCache;
}

/**
 * Sincroniza stakeholders a Supabase
 */
async function syncStakeholders(
  db: ReturnType<SupabaseService['db']>,
  stakeholders: StakeholderData[],
  wsCache: Map<string, string>
): Promise<number> {
  let synced = 0;

  for (const sh of stakeholders) {
    const wsId = wsCache.get(sh.workspace_code);
    if (!wsId) {
      logger.warn(`  ⚠️  Skipping stakeholder: workspace ${sh.workspace_code} not found`);
      continue;
    }

    try {
      // Get unique ID from JSON
      const stakeholderJsonId = sh.data.id || sh.data.nombre_corto?.toLowerCase().replace(/\s+/g, '-') || '';

      // Extract contact info
      const contacts = sh.data.contactos || {};
      const contactJson = {
        principal: contacts.principal || {},
        secundario: contacts.secundario || null,
      };

      // Use nombre_organizacion or nombre_corto as display name
      const displayName = sh.data.nombre_organizacion || sh.data.nombre_corto || '';

      const metadata = {
        source: 'sync-all',
        synced_at: new Date().toISOString(),
        json_id: stakeholderJsonId,
        original_data: sh.data,
      };

      // Try to find existing by json_id
      const { data: existing } = await db
        .from('stakeholders')
        .select('id, metadata')
        .eq('workspace_id', wsId)
        .limit(1000);

      let stakeholderId: string | null = null;

      if (existing) {
        for (const existingSh of existing) {
          const existingMetadata = existingSh.metadata as Record<string, any>;
          if (existingMetadata?.json_id === stakeholderJsonId) {
            stakeholderId = existingSh.id;
            break;
          }
        }
      }

      if (stakeholderId) {
        // Update existing
        const { error } = await db
          .from('stakeholders')
          .update({
            name: displayName,
            kind: sh.data.tipo_stakeholder || '',
            contact: contactJson,
            metadata,
          })
          .eq('id', stakeholderId);

        if (error) throw error;
      } else {
        // Insert new
        const { data, error } = await db
          .from('stakeholders')
          .insert({
            workspace_id: wsId,
            name: displayName,
            kind: sh.data.tipo_stakeholder || '',
            contact: contactJson,
            metadata,
          })
          .select('id')
          .single();

        if (error) throw error;
        stakeholderId = data.id;
      }

      synced++;
      logger.info(`  ✅ ${displayName || 'Unknown'}`);
    } catch (error: any) {
      logger.error(`  ❌ ${sh.data.nombre_corto || 'Unknown'}:`, error);
    }
  }

  return synced;
}

/**
 * Función principal de sincronización completa
 */
async function main(): Promise<void> {
  try {
    logger.info('🔄 Starting full synchronization...\n');

    if (!credentials.hasSupabase()) {
      logger.error('❌ Supabase not configured');
      process.exit(1);
    }

    const supabaseService = new SupabaseService();
    if (!supabaseService.isConfigured()) {
      logger.error('❌ Supabase service not configured');
      process.exit(1);
    }

    const db = supabaseService.db(true); // Use service role
    const repoRoot = process.cwd();

    // 1. Sync workspaces
    logger.info('📁 Syncing workspaces...');
    const workspaces = collectWorkspaces(repoRoot);
    const wsCache = await syncWorkspaces(db, workspaces);
    logger.info(`✅ Synced ${wsCache.size} workspaces\n`);

    // 2. Sync projects
    logger.info('📦 Syncing projects...');
    const projects = collectProjects(repoRoot);
    const prCache = await syncProjects(db, projects, wsCache);
    logger.info(`✅ Synced ${prCache.size} projects\n`);

    // 3. Sync documents (reuse existing function)
    logger.info('📄 Syncing documents...');
    try {
      const syncDocumentsModule = await import('./sync-documents');
      if (syncDocumentsModule.main) {
        await syncDocumentsModule.main();
      }
      logger.info('✅ Documents sync completed\n');
    } catch (error: any) {
      logger.warn('⚠️  Documents sync failed:', error);
    }

    // 4. Sync stakeholders
    logger.info('👥 Syncing stakeholders...');
    const stakeholders = collectStakeholders(repoRoot);
    const syncedStakeholders = await syncStakeholders(db, stakeholders, wsCache);
    logger.info(`✅ Synced ${syncedStakeholders} stakeholders\n`);

    // 5. Sync user services (reuse existing function)
    logger.info('🔐 Syncing user service configs...');
    try {
      const { syncUserServices } = await import('./sync-user-services');
      await syncUserServices();
      logger.info('✅ User services sync completed\n');
    } catch (error: any) {
      logger.warn('⚠️  User services sync failed:', error);
    }

    logger.info('✅ Full sync completed!');
    logger.info(`   Workspaces: ${wsCache.size}`);
    logger.info(`   Projects: ${prCache.size}`);
    logger.info(`   Stakeholders: ${syncedStakeholders}`);
  } catch (error: any) {
    logger.error('❌ Full sync failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    logger.error('Unhandled error', error);
    process.exit(1);
  });
}

export { main };

