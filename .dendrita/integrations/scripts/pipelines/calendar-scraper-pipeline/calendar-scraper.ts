#!/usr/bin/env ts-node
/**
 * Script ejecutable para scraping de calendarios
 * 
 * Uso:
 *   ts-node calendar-scraper.ts <user_id> [profile_id]
 * 
 * Ejemplos:
 *   ts-node calendar-scraper.ts [user-id]
 *   ts-node calendar-scraper.ts [user-id] [profile-id]
 */

import { CalendarScraper, ScrapingConfig } from '../../services/google/calendar-scraper';
import { CalendarService } from '../../services/google/calendar';
import { createLogger } from '../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('CalendarScraperScript');

/**
 * Carga perfil de usuario desde archivo
 */
function loadUserProfile(userId: string, profileId?: string): any {
  try {
    const profilePath = profileId
      ? path.join(process.cwd(), '.dendrita', 'users', userId, 'profiles', `${profileId}.json`)
      : path.join(process.cwd(), '.dendrita', 'users', userId, 'profile.json');

    if (!fs.existsSync(profilePath)) {
      throw new Error(`Profile not found: ${profilePath}`);
    }

    const profileContent = fs.readFileSync(profilePath, 'utf-8');
    return JSON.parse(profileContent);
  } catch (error: any) {
    logger.error(`Failed to load profile: ${error.message}`);
    throw error;
  }
}

/**
 * Carga configuración de scraping desde perfil de usuario
 */
function loadScrapingConfigFromProfile(profile: any): {
  time_min_offset_days: number;
  time_max_offset_days: number;
  max_results: number;
  single_events: boolean;
  sync_attendees: boolean;
  sync_metadata: boolean;
  enabled_calendars: string[];
  auto_enable_primary: boolean;
} {
  // Valores por defecto
  const defaults = {
    time_min_offset_days: -30,
    time_max_offset_days: 90,
    max_results: 2500,
    single_events: true,
    sync_attendees: true,
    sync_metadata: true,
    enabled_calendars: ['primary'],
    auto_enable_primary: true,
  };

  // Si no hay configuración en el perfil, usar defaults
  if (!profile.integrations || !profile.integrations.calendar_scraping) {
    logger.info('No calendar scraping config in profile, using defaults');
    return defaults;
  }

  const config = profile.integrations.calendar_scraping;
  const defaultSettings = config.default_settings || {};

  return {
    time_min_offset_days: defaultSettings.time_min_offset_days ?? defaults.time_min_offset_days,
    time_max_offset_days: defaultSettings.time_max_offset_days ?? defaults.time_max_offset_days,
    max_results: defaultSettings.max_results ?? defaults.max_results,
    single_events: defaultSettings.single_events ?? defaults.single_events,
    sync_attendees: defaultSettings.sync_attendees ?? defaults.sync_attendees,
    sync_metadata: defaultSettings.sync_metadata ?? defaults.sync_metadata,
    enabled_calendars: config.enabled_calendars || defaults.enabled_calendars,
    auto_enable_primary: config.auto_enable_primary ?? defaults.auto_enable_primary,
  };
}

/**
 * Inicializa configuración de scraping desde calendarios disponibles
 */
async function initializeScrapingConfig(
  scraper: CalendarScraper,
  userId: string,
  profileId?: string
): Promise<void> {
  try {
    logger.info('Initializing scraping configuration...');

    // Cargar perfil para obtener configuración
    const profile = loadUserProfile(userId, profileId);
    const scrapingConfig = loadScrapingConfigFromProfile(profile);
    const userEmail = profile.email || '';

    logger.info(`Loaded scraping config from profile:`);
    logger.info(`  Time window: ${scrapingConfig.time_min_offset_days} to ${scrapingConfig.time_max_offset_days} days`);
    logger.info(`  Enabled calendars: ${scrapingConfig.enabled_calendars.join(', ')}`);

    const calendarService = new CalendarService();
    await calendarService.authenticate();

    // Obtener lista de calendarios
    const calendars = await calendarService.listCalendars();
    logger.info(`Found ${calendars.length} calendars`);

    // Crear configuración para cada calendario usando configuración del perfil
    const configs: ScrapingConfig[] = calendars.map((cal) => {
      // Determinar si este calendario debe estar habilitado
      // Buscar por ID exacto, nombre que contenga keywords específicos, o email del usuario
      const isWorkCalendar = cal.summary?.toLowerCase().includes('work') || 
        cal.summary?.toLowerCase().includes('trabajo') ||
        (userEmail && cal.id === userEmail);
      const isPrimaryCalendar = cal.id === 'primary' || 
        (userEmail && cal.id === userEmail) ||
        (userEmail && cal.id.includes(userEmail.split('@')[0]));
      
      // Verificar si está en enabled_calendars o si es un calendario de trabajo
      const isEnabled = scrapingConfig.enabled_calendars.includes(cal.id) ||
        scrapingConfig.enabled_calendars.some(id => cal.id.includes(id)) ||
        (scrapingConfig.auto_enable_primary && isPrimaryCalendar) ||
        (isWorkCalendar && scrapingConfig.auto_enable_primary);

      return {
        user_id: userId,
        profile_id: profileId,
        calendar_id: cal.id,
        calendar_name: cal.summary,
        enabled: isEnabled,
        time_min_offset_days: scrapingConfig.time_min_offset_days,
        time_max_offset_days: scrapingConfig.time_max_offset_days,
        max_results: scrapingConfig.max_results,
        single_events: scrapingConfig.single_events,
        sync_attendees: scrapingConfig.sync_attendees,
        sync_metadata: scrapingConfig.sync_metadata,
      };
    });

    // Guardar configuraciones en archivo local
    await scraper.saveConfig(userId, configs);
    for (const config of configs) {
      const status = config.enabled ? '✅ ENABLED' : '⏸️  DISABLED';
      logger.info(`${status} - Calendar: ${config.calendar_name} (${config.calendar_id})`);
    }

    logger.info('Scraping configuration initialized');
  } catch (error: any) {
    logger.error(`Failed to initialize scraping config: ${error.message}`);
    throw error;
  }
}

/**
 * Función principal
 */
async function main(): Promise<void> {
  try {
    const args = process.argv.slice(2);

    if (args.length < 1) {
      console.error('Usage: ts-node calendar-scraper.ts <user_id> [profile_id]');
      console.error('');
      console.error('Examples:');
      console.error('  ts-node calendar-scraper.ts [user-id]');
      console.error('  ts-node calendar-scraper.ts [user-id] [profile-id]');
      process.exit(1);
    }

    const userId = args[0];
    const profileId = args[1];

    logger.info(`Starting calendar scraping for user: ${userId}${profileId ? `, profile: ${profileId}` : ''}`);

    // Verificar que el perfil existe
    try {
      loadUserProfile(userId, profileId);
    } catch (error) {
      logger.error(`Profile not found for user ${userId}${profileId ? ` with profile ${profileId}` : ''}`);
      process.exit(1);
    }

    // Inicializar scraper
    const scraper = new CalendarScraper();
    await scraper.initialize();

    // Verificar si hay configuración
    const existingConfigs = await scraper.loadConfigFromUser(userId, profileId);

    if (existingConfigs.length === 0) {
      logger.info('No scraping configuration found. Initializing...');
      await initializeScrapingConfig(scraper, userId, profileId);
    }

    // Ejecutar scraping
    logger.info('Starting scraping process...');
    const results = await scraper.scrapeForUser(userId, profileId);

    // Mostrar resultados
    console.log('\n=== Scraping Results ===\n');

    for (const result of results) {
      console.log(`Calendar: ${result.config.calendar_name || result.config.calendar_id}`);
      console.log(`  Events processed: ${result.events_processed}`);
      console.log(`  Events created: ${result.events_created}`);
      console.log(`  Events updated: ${result.events_updated}`);
      console.log(`  Instances created: ${result.instances_created}`);
      console.log(`  Instances updated: ${result.instances_updated}`);
      console.log(`  Attendees processed: ${result.attendees_created}`);
      console.log(`  Duration: ${result.duration_ms}ms`);
      if (result.errors.length > 0) {
        console.log(`  Errors: ${result.errors.length}`);
        result.errors.forEach((error) => console.log(`    - ${error}`));
      }
      console.log('');
    }

    // Resumen total
    const totalProcessed = results.reduce((sum, r) => sum + r.events_processed, 0);
    const totalCreated = results.reduce((sum, r) => sum + r.events_created, 0);
    const totalUpdated = results.reduce((sum, r) => sum + r.events_updated, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    console.log('=== Summary ===');
    console.log(`Total events processed: ${totalProcessed}`);
    console.log(`Total events created: ${totalCreated}`);
    console.log(`Total events updated: ${totalUpdated}`);
    console.log(`Total errors: ${totalErrors}`);

    if (totalErrors > 0) {
      process.exit(1);
    }
  } catch (error: any) {
    logger.error(`Script failed: ${error.message}`, error);
    console.error(`\nError: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { main as runCalendarScraper };

