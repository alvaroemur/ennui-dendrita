/**
 * Ejemplo de sincronización con ClickUp
 * Demuestra cómo sincronizar proyectos y tareas desde ClickUp hacia dendrita
 */

import { sync } from '../sync/bidirectional-sync';
import { SyncConfig } from '../sync/types';
import { createLogger } from '../utils/logger';

const logger = createLogger('ClickUpSyncTest');

/**
 * Ejemplo de sincronización ClickUp → dendrita
 */
export async function testClickUpSync(): Promise<void> {
  try {
    logger.info('Starting ClickUp sync test...');

    const config: SyncConfig = {
      tool: 'clickup',
      direction: 'tool_to_dendrita',
      strategy: 'manual',
      workspace: 'ennui', // Filtrar por workspace específico (opcional)
    };

    const result = await sync(config);

    console.log('\n📊 ClickUp Sync Results:');
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

    logger.info('ClickUp sync test completed');
  } catch (error) {
    logger.error('ClickUp sync test failed', error);
    throw error;
  }
}

/**
 * Ejecuta el test si se llama directamente
 */
if (require.main === module) {
  testClickUpSync()
    .then(() => {
      console.log('\n✅ Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

