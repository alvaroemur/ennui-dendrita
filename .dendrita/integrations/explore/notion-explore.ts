/**
 * Script de exploración para Notion
 * Lista qué se puede sincronizar entre Notion y dendrita
 */

import { NotionClient } from '../services/notion/client';
import {
  mapNotionDatabaseToDendritaProject,
  mapNotionPageToDendritaTask,
  blocksToMarkdown,
} from '../services/notion/mapper';
import { createLogger } from '../utils/logger';

const logger = createLogger('NotionExplore');

/**
 * Explora la estructura de Notion y muestra qué se puede sincronizar
 */
export async function exploreNotion(): Promise<void> {
  try {
    logger.info('Starting Notion exploration...');

    const client = new NotionClient();

    // Verificar autenticación
    if (!client.isConfigured()) {
      logger.error('Notion not configured. See hooks/notion-setup.md');
      return;
    }

    await client.authenticate();

    // Obtener databases
    logger.info('Fetching databases...');
    const databases = await client.listDatabases();
    console.log('\n📊 Notion Databases:');
    console.log(`Found ${databases.length} database(s)`);

    for (const database of databases) {
      const dbTitle = database.title.map((t) => t.plain_text).join('');
      console.log(`\n  └─ ${dbTitle} (ID: ${database.id})`);
      console.log(`     Dendrita project: "${dbTitle}"`);

      // Obtener páginas
      logger.info(`Fetching pages for database: ${database.id}`);
      const pages = await client.queryDatabase(database.id);
      console.log(`     ${pages.length} page(s) found`);

      if (pages.length > 0) {
        console.log('\n     Pages:');
        for (const page of pages.slice(0, 5)) {
          // Mostrar solo las primeras 5
          const dendritaTask = mapNotionPageToDendritaTask(page);
          console.log(`     - ${dendritaTask.name}`);
          console.log(`       Status: ${dendritaTask.status}`);
          console.log(`       Completed: ${dendritaTask.completed}`);
          if (dendritaTask.dueDate) {
            console.log(`       Due: ${dendritaTask.dueDate}`);
          }
          if (dendritaTask.assignee) {
            console.log(`       Assignee: ${dendritaTask.assignee}`);
          }

          // Obtener contenido de la página
          try {
            const blocks = await client.getPageBlocks(page.id);
            const content = blocksToMarkdown(blocks);
            if (content) {
              console.log(`       Content: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`);
            }
          } catch (error) {
            // Ignorar errores al obtener bloques
          }
        }
        if (pages.length > 5) {
          console.log(`     ... and ${pages.length - 5} more pages`);
        }
      }
    }

    // Resumen de sincronización
    console.log('\n\n📋 Synchronization Summary:');
    console.log('✅ Can sync:');
    console.log('   - Databases → Dendrita projects');
    console.log('   - Pages → Dendrita tasks');
    console.log('   - Page properties → Dendrita task properties');
    console.log('   - Page content (blocks) → Dendrita task descriptions');
    console.log('   - Status properties → Dendrita status');
    console.log('   - Date properties → Dendrita due dates');
    console.log('   - People properties → Dendrita assignees');
    console.log('\n⚠️  Limitations:');
    console.log('   - Notion requires database schema configuration');
    console.log('   - Page content is stored as blocks, not markdown directly');
    console.log('   - Custom properties need configuration');
    console.log('   - Workspace structure is implicit in Notion');

    logger.info('Notion exploration completed');
  } catch (error) {
    logger.error('Notion exploration failed', error);
    throw error;
  }
}

/**
 * Ejecuta la exploración si se llama directamente
 */
if (require.main === module) {
  exploreNotion()
    .then(() => {
      console.log('\n✅ Exploration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Exploration failed:', error);
      process.exit(1);
    });
}

