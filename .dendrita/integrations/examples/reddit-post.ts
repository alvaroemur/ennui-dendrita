/**
 * Ejemplo de uso de Reddit API para publicar posts
 * 
 * Uso:
 *   npx ts-node .dendrita/integrations/examples/reddit-post.ts
 */

import { RedditClient } from '../services/reddit/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('RedditExample');

async function main() {
  try {
    // Crear cliente de Reddit
    const reddit = new RedditClient();

    // Verificar configuración
    if (!reddit.isConfigured()) {
      logger.error('Reddit no está configurado. Verifica .dendrita/.env.local');
      process.exit(1);
    }

    logger.info('Reddit configurado correctamente');

    // Autenticar
    await reddit.authenticate();
    logger.info('Autenticación exitosa');

    // Obtener información del usuario
    const me = await reddit.getMe();
    logger.info(`Usuario autenticado: ${me.name}`);

    // Ejemplo 1: Crear un post de texto (self post)
    logger.info('Creando post de texto...');
    const textPost = await reddit.createPost({
      title: 'dendrita: Metodología de gestión de proyectos multiplataforma',
      text: `
# ¿Qué es dendrita?

dendrita es una metodología práctica para gestionar múltiples proyectos de operaciones empresariales simultáneamente.

## Características principales:

- ✅ Estructura estandarizada de workspaces
- ✅ Sistema de documentos persistentes (master-plan, current-context, tasks)
- ✅ Integración con AI assistants (Cursor, ChatGPT)
- ✅ Best practices automatizadas por tipo de proyecto
- ✅ Sistema modular y extensible

## ¿Para quién es?

- Organizaciones que gestionan múltiples proyectos
- Equipos que necesitan continuidad entre sesiones de trabajo
- Consultores que gestionan portafolios de clientes
- Cualquier equipo que quiera sistematizar su gestión de proyectos

## Recursos

- Repositorio: https://github.com/ennui-dendrita/ennui-dendrita
- Documentación: Ver README.md en el repo

¿Has usado dendrita? ¡Comparte tu experiencia!
      `,
      subreddit: 'projectmanagement', // Cambia por el subreddit que prefieras
      kind: 'self',
    });

    logger.info(`Post creado exitosamente: ${textPost.url}`);

    // Ejemplo 2: Crear un post con link (opcional)
    // const linkPost = await reddit.createPost({
    //   title: 'dendrita - Open Source Project Management System',
    //   url: 'https://github.com/ennui-dendrita/ennui-dendrita',
    //   subreddit: 'opensource',
    //   kind: 'link',
    // });
    // logger.info(`Link post creado: ${linkPost.url}`);

    // Ejemplo 3: Obtener información de un subreddit
    logger.info('Obteniendo información del subreddit...');
    const subredditInfo = await reddit.getSubredditInfo('projectmanagement');
    logger.info(`Subreddit: ${subredditInfo.data.display_name} - ${subredditInfo.data.subscribers} suscriptores`);

    // Ejemplo 4: Obtener posts recientes
    logger.info('Obteniendo posts recientes...');
    const posts = await reddit.getSubredditPosts('projectmanagement', 5, 'new');
    logger.info(`Encontrados ${posts.data.children.length} posts recientes`);

    logger.info('✅ Ejemplo completado exitosamente');

  } catch (error) {
    logger.error('Error en ejemplo de Reddit', error);
    process.exit(1);
  }
}

// Ejecutar
main();

