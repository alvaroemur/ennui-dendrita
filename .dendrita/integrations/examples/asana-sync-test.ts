/**
 * Ejemplo de sincronización con Asana
 * Demuestra cómo sincronizar proyectos y tareas desde Asana hacia dendrita
 */

import { sync } from '../sync/bidirectional-sync';
import { SyncConfig } from '../sync/types';
import { createLogger } from '../utils/logger';

const logger = createLogger('AsanaSyncTest');

/**
 * Ejemplo de sincronización Asana → dendrita
 */
export async function testAsanaSync(): Promise<void> {
  try {
    logger.info('Starting Asana sync test...');

    const config: SyncConfig = {
      tool: 'asana',
      direction: 'tool_to_dendrita',
      strategy: 'manual',
      workspace: 'ennui', // Filtrar por workspace específico (opcional)
    };

    const result = await sync(config);

    console.log('\n📊 Asana Sync Results:');
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

    logger.info('Asana sync test completed');
  } catch (error) {
    logger.error('Asana sync test failed', error);
    throw error;
  }
}

/**
 * Ejecuta el test si se llama directamente
 */
if (require.main === module) {
  testAsanaSync()
    .then(() => {
      console.log('\n✅ Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

