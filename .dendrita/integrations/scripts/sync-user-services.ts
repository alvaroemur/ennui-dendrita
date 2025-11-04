/**
 * Sincroniza la configuración de servicios de usuarios a Supabase
 * Solo almacena metadatos sobre qué servicios están configurados (sin credenciales)
 */

import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from '../utils/logger';
import { SupabaseService } from '../services/supabase/client';
import { credentials } from '../utils/credentials';

const logger = createLogger('SyncUserServices');

interface UserServiceConfig {
  user_id: string;
  service_name: string;
  is_configured: boolean;
  last_checked: string;
  metadata?: Record<string, any>;
}

/**
 * Detecta qué servicios están configurados para el usuario actual
 * SIN exponer credenciales reales
 */
function detectConfiguredServices(): {
  google_workspace: boolean;
  openai: boolean;
  supabase: boolean;
  reddit: boolean;
} {
  return {
    google_workspace: credentials.hasGoogleWorkspace(),
    openai: credentials.hasOpenAI(),
    supabase: credentials.hasSupabase(),
    reddit: credentials.hasReddit(),
  };
}

/**
 * Obtiene información de usuarios desde .dendrita/users/
 */
function collectUsers(repoRoot: string): Array<{ user_id: string; profile_path: string }> {
  const usersDir = path.join(repoRoot, '.dendrita', 'users');
  const users: Array<{ user_id: string; profile_path: string }> = [];

  if (!fs.existsSync(usersDir)) {
    logger.warn('Users directory does not exist');
    return users;
  }

  const dirs = fs.readdirSync(usersDir).filter((d) => {
    const fullPath = path.join(usersDir, d);
    return fs.statSync(fullPath).isDirectory() && !d.startsWith('.');
  });

  for (const userDir of dirs) {
    const profilePath = path.join(usersDir, userDir, 'profile.json');
    if (fs.existsSync(profilePath)) {
      try {
        const profile = JSON.parse(fs.readFileSync(profilePath, 'utf-8'));
        users.push({
          user_id: profile.user_id || userDir,
          profile_path: profilePath,
        });
      } catch (error) {
        logger.warn(`Error reading profile for ${userDir}:`, error);
      }
    }
  }

  return users;
}

/**
 * Sincroniza configuración de servicios de un usuario a Supabase
 */
async function syncUserServices(
  db: ReturnType<SupabaseService['db']>,
  userId: string,
  services: ReturnType<typeof detectConfiguredServices>
): Promise<void> {
  const now = new Date().toISOString();
  const serviceConfigs: UserServiceConfig[] = [];

  // Crear configuración para cada servicio
  const serviceList = [
    { key: 'google_workspace', name: 'Google Workspace' },
    { key: 'openai', name: 'OpenAI' },
    { key: 'supabase', name: 'Supabase' },
    { key: 'reddit', name: 'Reddit' },
  ];

  for (const service of serviceList) {
    const isConfigured = services[service.key as keyof typeof services];
    serviceConfigs.push({
      user_id: userId,
      service_name: service.name,
      is_configured: isConfigured,
      last_checked: now,
      metadata: {
        // Solo metadatos, nunca credenciales
        has_config: isConfigured,
        service_key: service.key,
      },
    });
  }

  // Upsert cada configuración de servicio
  for (const config of serviceConfigs) {
    try {
      const { error } = await db
        .from('user_service_configs')
        .upsert(
          {
            user_id: config.user_id,
            service_name: config.service_name,
            is_configured: config.is_configured,
            last_checked: config.last_checked,
            metadata: config.metadata,
          },
          {
            onConflict: 'user_id,service_name',
          }
        );

      if (error) {
        logger.error(`Error syncing ${config.service_name} for ${userId}:`, error);
      } else {
        logger.debug(
          `✅ ${config.service_name} for ${userId}: ${config.is_configured ? 'configured' : 'not configured'}`
        );
      }
    } catch (error) {
      logger.error(`Exception syncing ${config.service_name} for ${userId}:`, error);
    }
  }
}

/**
 * Función principal
 */
async function main(): Promise<void> {
  try {
    // Verificar que Supabase está configurado
    const supabase = new SupabaseService();
    if (!supabase.isConfigured()) {
      logger.error('Supabase not configured. Cannot sync user services.');
      process.exit(1);
    }

    const db = supabase.db(true); // Usar service role para escritura

    // Obtener ruta raíz del repo
    const repoRoot = path.resolve(__dirname, '../../..');

    // Obtener lista de usuarios
    const users = collectUsers(repoRoot);

    if (users.length === 0) {
      logger.warn('No users found in .dendrita/users/');
      return;
    }

    logger.info(`Found ${users.length} user(s)`);

    // Para cada usuario, detectar servicios configurados y sincronizar
    // NOTA: Actualmente detecta servicios del sistema actual, no por usuario
    // Esto es porque las credenciales están en .env.local del sistema
    // En el futuro, esto podría ser por usuario si se implementa almacenamiento por usuario

    // Detectar servicios configurados en el sistema actual
    const services = detectConfiguredServices();

    logger.info('Detected services:');
    logger.info(`  Google Workspace: ${services.google_workspace ? '✅' : '❌'}`);
    logger.info(`  OpenAI: ${services.openai ? '✅' : '❌'}`);
    logger.info(`  Supabase: ${services.supabase ? '✅' : '❌'}`);
    logger.info(`  Reddit: ${services.reddit ? '✅' : '❌'}`);

    // Sincronizar para cada usuario
    // (Nota: Actualmente todos los usuarios comparten las mismas credenciales del sistema)
    for (const user of users) {
      logger.info(`Syncing services for user: ${user.user_id}`);
      await syncUserServices(db, user.user_id, services);
    }

    logger.info('✅ User services sync completed');
  } catch (error) {
    logger.error('Error in sync-user-services:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

export { main as syncUserServices, detectConfiguredServices, collectUsers };

