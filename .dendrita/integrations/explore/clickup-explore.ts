/**
 * Script de exploración para ClickUp
 * Lista qué se puede sincronizar entre ClickUp y dendrita
 */

import { ClickUpClient } from '../services/clickup/client';
import {
  mapClickUpWorkspaceToDendrita,
  mapClickUpSpaceToDendritaProject,
  mapClickUpTaskToDendrita,
} from '../services/clickup/mapper';
import { createLogger } from '../utils/logger';

const logger = createLogger('ClickUpExplore');

/**
 * Explora la estructura de ClickUp y muestra qué se puede sincronizar
 */
export async function exploreClickUp(): Promise<void> {
  try {
    logger.info('Starting ClickUp exploration...');

    const client = new ClickUpClient();

    // Verificar autenticación
    if (!client.isConfigured()) {
      logger.error('ClickUp not configured. See hooks/clickup-setup.md');
      return;
    }

    await client.authenticate();

    // Obtener workspaces
    logger.info('Fetching workspaces...');
    const workspaces = await client.getWorkspaces();
    console.log('\n📊 ClickUp Workspaces:');
    console.log(`Found ${workspaces.length} workspace(s)`);

    for (const workspace of workspaces) {
      console.log(`\n  └─ ${workspace.name} (ID: ${workspace.id})`);
      console.log(`     Dendrita workspace: "${mapClickUpWorkspaceToDendrita(workspace)}"`);

      // Obtener spaces
      logger.info(`Fetching spaces for workspace: ${workspace.id}`);
      const spaces = await client.getSpaces(workspace.id);
      console.log(`     ${spaces.length} space(s) found`);

      for (const space of spaces) {
        console.log(`\n     └─ ${space.name} (ID: ${space.id})`);
        console.log(`        Dendrita project: "${space.name}"`);

        // Obtener listas
        logger.info(`Fetching lists for space: ${space.id}`);
        const lists = await client.getLists(space.id);
        console.log(`        ${lists.length} list(s) found`);

        for (const list of lists) {
          console.log(`\n        └─ ${list.name} (ID: ${list.id})`);
          console.log(`           Dendrita phase: "${list.name}"`);

          // Obtener tareas
          logger.info(`Fetching tasks for list: ${list.id}`);
          const tasks = await client.getTasks(list.id, false);
          console.log(`           ${tasks.length} task(s) found`);

          if (tasks.length > 0) {
            console.log('\n           Tasks:');
            for (const task of tasks.slice(0, 5)) {
              // Mostrar solo las primeras 5
              const dendritaTask = mapClickUpTaskToDendrita(task);
              console.log(`           - ${task.name}`);
              console.log(`             Status: ${task.status?.status} → ${dendritaTask.status}`);
              console.log(`             Completed: ${dendritaTask.completed}`);
              if (dendritaTask.dueDate) {
                console.log(`             Due: ${dendritaTask.dueDate}`);
              }
              if (dendritaTask.assignee) {
                console.log(`             Assignee: ${dendritaTask.assignee}`);
              }
            }
            if (tasks.length > 5) {
              console.log(`           ... and ${tasks.length - 5} more tasks`);
            }
          }
        }
      }
    }

    // Resumen de sincronización
    console.log('\n\n📋 Synchronization Summary:');
    console.log('✅ Can sync:');
    console.log('   - Workspaces → Dendrita workspaces');
    console.log('   - Spaces → Dendrita projects');
    console.log('   - Lists → Project phases');
    console.log('   - Tasks → Dendrita tasks');
    console.log('   - Task status → Dendrita status');
    console.log('   - Task descriptions → Dendrita task descriptions');
    console.log('   - Task due dates → Dendrita due dates');
    console.log('   - Task assignees → Dendrita assignees');
    console.log('   - Task tags → Dendrita tags');
    console.log('\n⚠️  Limitations:');
    console.log('   - ClickUp status IDs required for creating/updating tasks');
    console.log('   - ClickUp user IDs required for assignees');
    console.log('   - Spaces cannot be created via API');
    console.log('   - Master plan and current context need custom fields or descriptions');

    logger.info('ClickUp exploration completed');
  } catch (error) {
    logger.error('ClickUp exploration failed', error);
    throw error;
  }
}

/**
 * Ejecuta la exploración si se llama directamente
 */
if (require.main === module) {
  exploreClickUp()
    .then(() => {
      console.log('\n✅ Exploration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Exploration failed:', error);
      process.exit(1);
    });
}

