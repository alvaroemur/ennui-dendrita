#!/usr/bin/env tsx
/**
 * Script maestro para sincronizar todos los sistemas de contexto
 * 
 * Este script ejecuta en orden todos los scripts de actualización de contexto:
 * 1. update-project-context.ts - Actualiza project_context.json de cada proyecto
 * 2. update-context.ts - Actualiza context.json (usuario y workspace)
 * 3. generate-work-status-report.ts - Genera work-status-report
 * 
 * Uso:
 *   tsx .dendrita/integrations/scripts/pipelines/context-pipeline/sync-all-context.ts
 *   tsx .dendrita/integrations/scripts/pipelines/context-pipeline/sync-all-context.ts --workspace ennui
 *   tsx .dendrita/integrations/scripts/pipelines/context-pipeline/sync-all-context.ts --workspace ennui --project dendrita-dev
 *   tsx .dendrita/integrations/scripts/pipelines/context-pipeline/sync-all-context.ts --skip-project-context
 *   tsx .dendrita/integrations/scripts/pipelines/context-pipeline/sync-all-context.ts --skip-user-context
 *   tsx .dendrita/integrations/scripts/pipelines/context-pipeline/sync-all-context.ts --skip-report
 * 
 * Flags:
 *   --skip-project-context  - Saltar actualización de project_context.json
 *   --skip-user-context      - Saltar actualización de context.json (usuario y workspace)
 *   --skip-report            - Saltar generación de work-status-report
 *   --workspace <name>       - Filtrar por workspace específico
 *   --project <name>         - Filtrar por proyecto específico (requiere --workspace)
 */

import { execSync } from 'child_process';
import * as path from 'path';
import { PROJECT_ROOT } from './utils/common';

interface SyncOptions {
  skipProjectContext: boolean;
  skipUserContext: boolean;
  skipReport: boolean;
  workspace?: string;
  project?: string;
}

interface SyncResult {
  step: string;
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Parsea argumentos de línea de comandos
 */
function parseArgs(): SyncOptions {
  const args = process.argv.slice(2);
  const options: SyncOptions = {
    skipProjectContext: false,
    skipUserContext: false,
    skipReport: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--skip-project-context':
        options.skipProjectContext = true;
        break;
      case '--skip-user-context':
        options.skipUserContext = true;
        break;
      case '--skip-report':
        options.skipReport = true;
        break;
      case '--workspace':
        if (args[i + 1]) {
          options.workspace = args[i + 1];
          i++;
        }
        break;
      case '--project':
        if (args[i + 1]) {
          options.project = args[i + 1];
          i++;
        }
        break;
    }
  }

  // Validar que project requiere workspace
  if (options.project && !options.workspace) {
    console.error('❌ Error: --project requires --workspace');
    process.exit(1);
  }

  return options;
}

/**
 * Ejecuta un script y captura el resultado
 */
function runScript(scriptPath: string, args: string[] = []): SyncResult {
  const fullPath = path.join(PROJECT_ROOT, scriptPath);
  const command = `tsx "${fullPath}" ${args.join(' ')}`;

  try {
    execSync(command, {
      stdio: 'inherit',
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
    });
    return {
      step: path.basename(scriptPath),
      success: true,
      message: 'Completed successfully',
    };
  } catch (error: any) {
    return {
      step: path.basename(scriptPath),
      success: false,
      message: 'Failed',
      error: error.message,
    };
  }
}

/**
 * Construye argumentos para pasar a los scripts
 */
function buildScriptArgs(options: SyncOptions): string[] {
  const args: string[] = [];
  
  if (options.workspace) {
    args.push('--workspace', options.workspace);
  }
  
  if (options.project) {
    args.push('--project', options.project);
  }
  
  return args;
}

/**
 * Función principal
 */
function main() {
  const options = parseArgs();
  const results: SyncResult[] = [];

  console.log('🔄 Syncing all context systems...\n');

  // Step 1: Update project contexts
  if (!options.skipProjectContext) {
    console.log('📦 Step 1/3: Updating project contexts...');
    const args = buildScriptArgs(options);
    const result = runScript(
      '.dendrita/integrations/scripts/pipelines/context-pipeline/update-project-context.ts',
      args
    );
    results.push(result);
    
    if (!result.success) {
      console.warn(`⚠️  Step 1 failed: ${result.error}`);
      console.warn('   Continuing with next steps...\n');
    } else {
      console.log('   ✅ Project contexts updated\n');
    }
  } else {
    console.log('⏭️  Step 1/3: Skipping project context update\n');
    results.push({
      step: 'update-project-context',
      success: true,
      message: 'Skipped',
    });
  }

  // Step 2: Update user and workspace contexts
  if (!options.skipUserContext) {
    console.log('📝 Step 2/3: Updating user and workspace contexts...');
    const result = runScript(
      '.dendrita/integrations/scripts/pipelines/context-pipeline/update-context.ts'
    );
    results.push(result);
    
    if (!result.success) {
      console.warn(`⚠️  Step 2 failed: ${result.error}`);
      console.warn('   Continuing with next steps...\n');
    } else {
      console.log('   ✅ User and workspace contexts updated\n');
    }
  } else {
    console.log('⏭️  Step 2/3: Skipping user context update\n');
    results.push({
      step: 'update-context',
      success: true,
      message: 'Skipped',
    });
  }

  // Step 3: Generate work status report
  if (!options.skipReport) {
    console.log('📊 Step 3/3: Generating work status report...');
    const args: string[] = [];
    if (options.workspace) {
      args.push('--workspace', options.workspace);
    }
    const result = runScript(
      '.dendrita/integrations/scripts/pipelines/context-pipeline/generate-work-status-report.ts',
      args
    );
    results.push(result);
    
    if (!result.success) {
      console.warn(`⚠️  Step 3 failed: ${result.error}`);
    } else {
      console.log('   ✅ Work status report generated\n');
    }
  } else {
    console.log('⏭️  Step 3/3: Skipping work status report generation\n');
    results.push({
      step: 'generate-work-status-report',
      success: true,
      message: 'Skipped',
    });
  }

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Sync Summary:\n');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const skipped = results.filter(r => r.message === 'Skipped').length;
  
  results.forEach(result => {
    const icon = result.success 
      ? (result.message === 'Skipped' ? '⏭️' : '✅')
      : '❌';
    console.log(`   ${icon} ${result.step}: ${result.message}`);
    if (result.error) {
      console.log(`      Error: ${result.error}`);
    }
  });
  
  console.log(`\n   Total: ${results.length} steps`);
  console.log(`   ✅ Successful: ${successful - skipped}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  if (failed > 0) {
    console.log(`   ❌ Failed: ${failed}`);
  }
  
  if (failed === 0) {
    console.log('\n✅ All context systems synced successfully!');
  } else {
    console.log('\n⚠️  Some steps failed. Check errors above.');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { main, parseArgs, runScript };

