/**
 * Mapper para convertir entre estructura Notion y dendrita
 * Proporciona funciones bidireccionales para mapear datos
 */

import {
  NotionDatabase,
  NotionPage,
  NotionBlock,
} from './client';
import { createLogger } from '../../utils/logger';
import { DendritaProject, DendritaTask } from '../clickup/mapper';

const logger = createLogger('NotionMapper');

/**
 * Obtiene el título de una página de Notion
 */
function getPageTitle(page: NotionPage): string {
  const titleProperty = Object.values(page.properties || {}).find(
    (prop: any) => prop?.type === 'title'
  );
  if (titleProperty?.title) {
    return titleProperty.title
      .map((text: any) => text.plain_text)
      .join('');
  }
  return 'Untitled';
}

/**
 * Obtiene el título de una database de Notion
 */
function getDatabaseTitle(database: NotionDatabase): string {
  if (database.title && database.title.length > 0) {
    return database.title.map((text) => text.plain_text).join('');
  }
  return 'Untitled Database';
}

/**
 * Mapea una database de Notion a un proyecto de dendrita
 */
export function mapNotionDatabaseToDendritaProject(
  database: NotionDatabase,
  pages: NotionPage[] = []
): DendritaProject {
  const dendritaTasks = pages.map(mapNotionPageToDendritaTask);

  return {
    workspace: 'notion', // Notion no tiene workspaces explícitos
    projectName: getDatabaseTitle(database),
    tasks: dendritaTasks,
  };
}

/**
 * Mapea una página de Notion a una tarea de dendrita
 */
export function mapNotionPageToDendritaTask(page: NotionPage): DendritaTask {
  const title = getPageTitle(page);

  // Buscar propiedades comunes
  const statusProperty = Object.values(page.properties || {}).find(
    (prop: any) => prop?.type === 'select' || prop?.type === 'status'
  );
  const dueDateProperty = Object.values(page.properties || {}).find(
    (prop: any) => prop?.type === 'date'
  );
  const assigneeProperty = Object.values(page.properties || {}).find(
    (prop: any) => prop?.type === 'people'
  );

  // Mapear estado
  let status: 'pending' | 'in_progress' | 'completed' | 'cancelled' = 'pending';
  if (statusProperty?.select) {
    const statusName = statusProperty.select.name?.toLowerCase() || '';
    if (statusName.includes('complete') || statusName.includes('done')) {
      status = 'completed';
    } else if (statusName.includes('cancel')) {
      status = 'cancelled';
    } else if (statusName.includes('progress') || statusName.includes('doing')) {
      status = 'in_progress';
    }
  }

  // Verificar si está archivada (completada)
  const completed = status === 'completed' || page.archived;

  // Obtener fecha de vencimiento
  let dueDate: string | undefined;
  if (dueDateProperty?.date?.start) {
    dueDate = new Date(dueDateProperty.date.start).toISOString();
  }

  // Obtener asignado
  let assignee: string | undefined;
  if (assigneeProperty?.people && assigneeProperty.people.length > 0) {
    const person = assigneeProperty.people[0];
    assignee = person.person?.email || person.name;
  }

  return {
    id: page.id,
    name: title,
    description: undefined, // Se obtiene de los bloques
    status,
    completed,
    dueDate,
    assignee,
    tags: undefined, // Notion no tiene tags directos, se pueden usar propiedades
    parent: page.parent?.page_id || page.parent?.block_id,
  };
}

/**
 * Mapea un proyecto de dendrita a una database de Notion (para crear/actualizar)
 */
export function mapDendritaProjectToNotionDatabase(
  project: DendritaProject
): {
  title: Array<{ type: string; text: { content: string } }>;
  properties: Record<string, any>;
} {
  return {
    title: [
      {
        type: 'text',
        text: { content: project.projectName },
      },
    ],
    properties: {
      Name: {
        title: {},
      },
      Status: {
        select: {
          options: [
            { name: 'Pending', color: 'gray' },
            { name: 'In Progress', color: 'blue' },
            { name: 'Completed', color: 'green' },
            { name: 'Cancelled', color: 'red' },
          ],
        },
      },
      'Due Date': {
        date: {},
      },
      Assignee: {
        people: {},
      },
    },
  };
}

/**
 * Mapea una tarea de dendrita a una página de Notion (para crear/actualizar)
 */
export function mapDendritaTaskToNotionPage(
  task: DendritaTask,
  databaseId: string
): {
  parent: { database_id: string };
  properties: Record<string, any>;
  children?: NotionBlock[];
} {
  const properties: Record<string, any> = {
    Name: {
      title: [
        {
          text: {
            content: task.name,
          },
        },
      ],
    },
  };

  // Agregar estado si está disponible
  if (task.status) {
    properties.Status = {
      select: {
        name: task.status === 'completed' ? 'Completed' :
              task.status === 'in_progress' ? 'In Progress' :
              task.status === 'cancelled' ? 'Cancelled' :
              'Pending',
      },
    };
  }

  // Agregar fecha de vencimiento si está disponible
  if (task.dueDate) {
    properties['Due Date'] = {
      date: {
        start: new Date(task.dueDate).toISOString().split('T')[0],
      },
    };
  }

  // Agregar descripción como bloque de texto
  const children: NotionBlock[] = [];
  if (task.description) {
    children.push({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: task.description,
            },
          },
        ],
      },
    } as NotionBlock);
  }

  return {
    parent: {
      database_id: databaseId,
    },
    properties,
    children: children.length > 0 ? children : undefined,
  };
}

/**
 * Convierte bloques de Notion a texto markdown
 */
export function blocksToMarkdown(blocks: NotionBlock[]): string {
  return blocks
    .map((block) => {
      const type = block.type;
      const blockData = block[type];

      if (blockData?.rich_text) {
        return blockData.rich_text
          .map((text: any) => text.plain_text)
          .join('');
      }

      return '';
    })
    .filter((text) => text.length > 0)
    .join('\n\n');
}

