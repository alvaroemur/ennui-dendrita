/**
 * Ejemplo de sincronización con Notion
 * Demuestra cómo sincronizar proyectos y tareas desde Notion hacia dendrita
 */

import { sync } from '../scripts/pipelines/pm-tools-sync-pipeline/bidirectional-sync';
import { SyncConfig } from '../scripts/pipelines/pm-tools-sync-pipeline/types';
import { createLogger } from '../utils/logger';

const logger = createLogger('NotionSyncTest');

/**
 * Ejemplo de sincronización Notion → dendrita
 */
export async function testNotionSync(): Promise<void> {
  try {
    logger.info('Starting Notion sync test...');

    const config: SyncConfig = {
      tool: 'notion',
      direction: 'tool_to_dendrita',
      strategy: 'manual',
      workspace: '', // Notion no tiene workspaces explícitos
    };

    const result = await sync(config);

    console.log('\n📊 Notion Sync Results:');
    console.log(`✅ Success: ${result.success}`);
    console.log(`📁 Projects synced: ${result.synced.projects}`);
    console.log(`✅ Tasks synced: ${result.synced.tasks}`);

    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach((error) => {
        console.log(`   - ${error.type}: ${error.message}`);
      });
    }

    if (result.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      result.warnings.forEach((warning) => {
        console.log(`   - ${warning.type}: ${warning.message}`);
      });
    }

    logger.info('Notion sync test completed');
  } catch (error) {
    logger.error('Notion sync test failed', error);
    throw error;
  }
}

/**
 * Ejecuta el test si se llama directamente
 */
if (require.main === module) {
  testNotionSync()
    .then(() => {
      console.log('\n✅ Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

