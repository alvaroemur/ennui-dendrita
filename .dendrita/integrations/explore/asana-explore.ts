/**
 * Script de exploración para Asana
 * Lista qué se puede sincronizar entre Asana y dendrita
 */

import { AsanaClient } from '../services/asana/client';
import {
  mapAsanaWorkspaceToDendrita,
  mapAsanaProjectToDendritaProject,
  mapAsanaTaskToDendrita,
} from '../services/asana/mapper';
import { createLogger } from '../utils/logger';

const logger = createLogger('AsanaExplore');

/**
 * Explora la estructura de Asana y muestra qué se puede sincronizar
 */
export async function exploreAsana(): Promise<void> {
  try {
    logger.info('Starting Asana exploration...');

    const client = new AsanaClient();

    // Verificar autenticación
    if (!client.isConfigured()) {
      logger.error('Asana not configured. See hooks/asana-setup.md');
      return;
    }

    await client.authenticate();

    // Obtener workspaces
    logger.info('Fetching workspaces...');
    const workspaces = await client.getWorkspaces();
    console.log('\n📊 Asana Workspaces:');
    console.log(`Found ${workspaces.length} workspace(s)`);

    for (const workspace of workspaces) {
      console.log(`\n  └─ ${workspace.name} (ID: ${workspace.gid})`);
      console.log(`     Dendrita workspace: "${mapAsanaWorkspaceToDendrita(workspace)}"`);

      // Obtener proyectos
      logger.info(`Fetching projects for workspace: ${workspace.gid}`);
      const projects = await client.getProjects(workspace.gid, false);
      console.log(`     ${projects.length} project(s) found`);

      for (const project of projects) {
        console.log(`\n     └─ ${project.name} (ID: ${project.gid})`);
        console.log(`        Dendrita project: "${project.name}"`);
        if (project.notes) {
          console.log(`        Notes: ${project.notes.substring(0, 100)}${project.notes.length > 100 ? '...' : ''}`);
        }

        // Obtener tareas
        logger.info(`Fetching tasks for project: ${project.gid}`);
        const tasks = await client.getTasks(project.gid, false);
        console.log(`        ${tasks.length} task(s) found`);

        if (tasks.length > 0) {
          console.log('\n        Tasks:');
          for (const task of tasks.slice(0, 5)) {
            // Mostrar solo las primeras 5
            const dendritaTask = mapAsanaTaskToDendrita(task);
            console.log(`        - ${task.name}`);
            console.log(`          Status: ${task.completed ? 'completed' : 'incomplete'} → ${dendritaTask.status}`);
            console.log(`          Completed: ${dendritaTask.completed}`);
            if (dendritaTask.dueDate) {
              console.log(`          Due: ${dendritaTask.dueDate}`);
            }
            if (dendritaTask.assignee) {
              console.log(`          Assignee: ${dendritaTask.assignee}`);
            }
            if (dendritaTask.tags && dendritaTask.tags.length > 0) {
              console.log(`          Tags: ${dendritaTask.tags.join(', ')}`);
            }
          }
          if (tasks.length > 5) {
            console.log(`        ... and ${tasks.length - 5} more tasks`);
          }
        }
      }
    }

    // Resumen de sincronización
    console.log('\n\n📋 Synchronization Summary:');
    console.log('✅ Can sync:');
    console.log('   - Workspaces → Dendrita workspaces');
    console.log('   - Projects → Dendrita projects');
    console.log('   - Tasks → Dendrita tasks');
    console.log('   - Task status → Dendrita status');
    console.log('   - Task descriptions → Dendrita task descriptions');
    console.log('   - Task due dates → Dendrita due dates');
    console.log('   - Task assignees → Dendrita assignees');
    console.log('   - Task tags → Dendrita tags');
    console.log('   - Project notes → Dendrita master plan/context');
    console.log('\n⚠️  Limitations:');
    console.log('   - Asana user IDs required for assignees');
    console.log('   - Task dependencies need custom mapping');
    console.log('   - Custom fields need configuration');

    logger.info('Asana exploration completed');
  } catch (error) {
    logger.error('Asana exploration failed', error);
    throw error;
  }
}

/**
 * Ejecuta la exploración si se llama directamente
 */
if (require.main === module) {
  exploreAsana()
    .then(() => {
      console.log('\n✅ Exploration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Exploration failed:', error);
      process.exit(1);
    });
}

