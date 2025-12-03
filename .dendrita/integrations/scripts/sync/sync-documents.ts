import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from '../utils/logger';
import { dendritaLogger } from '../../utils/dendrita-logger';
import { SupabaseService } from '../services/supabase/client';
import { credentials } from '../utils/credentials';

const logger = createLogger('SyncDocuments');

interface ProjectFile {
  workspaceCode: string;
  projectCode: string;
  filePath: string; // absolute
  relPath: string;  // relative from repo root
  fileName: string;
}

function listDirs(dir: string): string[] {
  return fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((d) => fs.statSync(path.join(dir, d)).isDirectory())
    : [];
}

function listFiles(dir: string, predicate: (f: string) => boolean): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => fs.statSync(path.join(dir, f)).isFile())
    .filter(predicate);
}

function detectDocType(name: string): 'current_context' | 'master_plan' | 'tasks' | 'readme' | 'other' {
  const low = name.toLowerCase();
  if (low === 'current-context.md') return 'current_context';
  if (low === 'master-plan.md') return 'master_plan';
  if (low === 'tasks.md') return 'tasks';
  if (low === 'readme.md') return 'readme';
  return 'other';
}

function buildSlug(projectCode: string, name: string): string {
  const base = name.replace(/\.[^.]+$/, '').toLowerCase().replace(/\s+/g, '-');
  return `${projectCode}/${base}`;
}

async function upsertWorkspace(db: ReturnType<SupabaseService['db']>, code: string) {
  const { data, error } = await db
    .from('workspaces')
    .upsert({ code, name: code, description: 'Imported from filesystem', metadata: { source: 'sync-script' } }, { onConflict: 'code' })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

async function upsertProject(db: ReturnType<SupabaseService['db']>, workspaceId: string, projectCode: string) {
  const { data, error } = await db
    .from('projects')
    .upsert({ workspace_id: workspaceId, code: projectCode, name: projectCode, status: 'active', metadata: { source: 'sync-script' } }, { onConflict: 'workspace_id,code' })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

async function upsertDocument(
  db: ReturnType<SupabaseService['db']>,
  workspaceId: string,
  projectId: string,
  projectCode: string,
  file: ProjectFile
) {
  const content = fs.readFileSync(file.filePath, 'utf-8');
  const docType = detectDocType(file.fileName);
  const slug = buildSlug(projectCode, file.fileName);

  const { error } = await db
    .from('documents')
    .upsert(
      {
        workspace_id: workspaceId,
        project_id: projectId,
        title: file.fileName,
        slug,
        doc_type: docType,
        content,
        metadata: { path: file.relPath, source: 'sync-script' },
      },
      { onConflict: 'workspace_id,slug' }
    )
    .select('id')
    .single();

  if (error) throw error;
}

function collectProjectFiles(repoRoot: string): ProjectFile[] {
  const workspacesRoot = path.join(repoRoot, 'workspaces');
  const workspaceCodes = listDirs(workspacesRoot);

  const files: ProjectFile[] = [];

  for (const workspaceCode of workspaceCodes) {
    if (workspaceCode === 'template') continue; // skip template
    const projectsRoot = path.join(workspacesRoot, workspaceCode, 'active-projects');
    const projectCodes = listDirs(projectsRoot);

    for (const projectCode of projectCodes) {
      const projectDir = path.join(projectsRoot, projectCode);

      // All .md files at top-level of the project directory
      const mdFiles = listFiles(projectDir, (f) => f.toLowerCase().endsWith('.md'));
      for (const fileName of mdFiles) {
        const abs = path.join(projectDir, fileName);
        const rel = path.relative(repoRoot, abs);
        files.push({ workspaceCode, projectCode, filePath: abs, relPath: rel, fileName });
      }
    }
  }

  return files;
}

async function main() {
  const startTime = Date.now();
  const scriptPath = __filename;
  const scriptName = path.basename(scriptPath, path.extname(scriptPath));
  
  let scriptId: string | undefined;

  try {
    const repoRoot = path.resolve(__dirname, '../../../');

    // Registrar inicio de ejecución
    scriptId = dendritaLogger.logScriptExecution(
      scriptName,
      scriptPath,
      {
        status: 'success',
      }
    );

    const files = collectProjectFiles(repoRoot);
    if (files.length === 0) {
      logger.warn('No markdown files found to sync.');
      
      // Registrar skip
      dendritaLogger.log({
        level: 'warn',
        component_type: 'script',
        component_name: scriptName,
        component_path: scriptPath,
        event_type: 'execute',
        event_description: 'No files found to sync',
        status: 'skipped',
        duration: Date.now() - startTime,
        triggered_by: scriptId,
      });
      
      return;
    }

    // Prefer service role if available; fallback to anon
    const supa = new SupabaseService();
    const useServiceRole = (() => {
      try {
        return !!credentials.getSupabase().serviceRoleKey;
      } catch {
        return false;
      }
    })();
    const db = supa.db(useServiceRole);

    // Cache workspace and project IDs to minimize queries
    const wsIdCache = new Map<string, string>();
    const prIdCache = new Map<string, string>();

    let synced = 0;
    for (const file of files) {
      if (!wsIdCache.has(file.workspaceCode)) {
        const wsId = await upsertWorkspace(db, file.workspaceCode);
        wsIdCache.set(file.workspaceCode, wsId);
      }
      const wsId = wsIdCache.get(file.workspaceCode)!;

      const prKey = `${file.workspaceCode}:${file.projectCode}`;
      if (!prIdCache.has(prKey)) {
        const prId = await upsertProject(db, wsId, file.projectCode);
        prIdCache.set(prKey, prId);
      }
      const prId = prIdCache.get(prKey)!;

      await upsertDocument(db, wsId, prId, file.projectCode, file);
      synced += 1;
      if (synced % 10 === 0) logger.info(`Synced ${synced} documents...`);
    }

    logger.info(`✅ Sync completed. Total documents synced: ${synced}`);

    // Registrar éxito
    dendritaLogger.log({
      level: 'info',
      component_type: 'script',
      component_name: scriptName,
      component_path: scriptPath,
      event_type: 'execute',
      event_description: 'Documents sync completed successfully',
      status: 'success',
      duration: Date.now() - startTime,
      triggered_by: scriptId,
      metadata: {
        total_files_synced: synced,
        total_files_found: files.length,
        workspaces_processed: new Set(files.map(f => f.workspaceCode)).size,
        projects_processed: new Set(files.map(f => `${f.workspaceCode}:${f.projectCode}`)).size,
      },
    });
  } catch (error: any) {
    // Registrar error
    dendritaLogger.log({
      level: 'error',
      component_type: 'script',
      component_name: scriptName,
      component_path: scriptPath,
      event_type: 'execute',
      event_description: 'Documents sync failed',
      status: 'error',
      duration: Date.now() - startTime,
      error: error.message,
      triggered_by: scriptId,
    });

    logger.error('Sync failed', error);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}
