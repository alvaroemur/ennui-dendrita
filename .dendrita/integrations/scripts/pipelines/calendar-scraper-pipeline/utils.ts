/**
 * Utilidades compartidas para el Calendar Scraper Pipeline
 */

import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from '../../utils/logger';

const logger = createLogger('CalendarScraperUtils');

/**
 * Carga configuración desde archivo JSON en el mismo directorio del pipeline
 */
export function loadConfig<T>(filename: string = 'config.json'): T {
  const configPath = path.join(__dirname, filename);
  
  if (!fs.existsSync(configPath)) {
    logger.warn(`Config file not found: ${configPath}, using defaults`);
    return {} as T;
  }
  
  try {
    const configContent = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(configContent);
  } catch (error: any) {
    logger.error(`Failed to load config: ${error.message}`);
    throw error;
  }
}

/**
 * Carga perfil de usuario desde archivo
 */
export function loadUserProfile(userId: string, profileId?: string): any {
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
 * Carga configuración de scraping desde archivo scrapers-config.json del usuario
 */
export function loadScrapersConfig(userId: string): any {
  try {
    const configPath = path.join(
      process.cwd(),
      '.dendrita',
      'users',
      userId,
      'scrapers-config.json'
    );

    if (!fs.existsSync(configPath)) {
      logger.warn(`Scrapers config not found: ${configPath}, using defaults`);
      return null;
    }

    const configContent = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(configContent);
  } catch (error: any) {
    logger.error(`Failed to load scrapers config: ${error.message}`);
    return null;
  }
}

/**
 * Combina configuración del pipeline con configuración del usuario
 */
export function mergeConfigs(
  pipelineConfig: any,
  userConfig: any
): {
  time_min_offset_days: number;
  time_max_offset_days: number;
  max_results: number;
  single_events: boolean;
  sync_attendees: boolean;
  sync_metadata: boolean;
} {
  const defaults = pipelineConfig.default_settings || {};
  const userDefaults = userConfig?.calendar?.default_settings || {};

  return {
    time_min_offset_days: userDefaults.time_min_offset_days ?? defaults.time_min_offset_days ?? -30,
    time_max_offset_days: userDefaults.time_max_offset_days ?? defaults.time_max_offset_days ?? 90,
    max_results: userDefaults.max_results ?? defaults.max_results ?? 2500,
    single_events: userDefaults.single_events ?? defaults.single_events ?? true,
    sync_attendees: userDefaults.sync_attendees ?? defaults.sync_attendees ?? true,
    sync_metadata: userDefaults.sync_metadata ?? defaults.sync_metadata ?? true,
  };
}

/**
 * Valida configuración de calendario
 */
export function validateCalendarConfig(config: any): boolean {
  if (!config.calendar_id) {
    logger.error('Calendar config missing calendar_id');
    return false;
  }
  return true;
}

/**
 * Determina si un calendario debe estar habilitado basado en configuración
 */
export function shouldEnableCalendar(
  calendar: { id: string; summary?: string },
  userEmail: string,
  pipelineConfig: any,
  userConfig: any
): boolean {
  const autoConfig = pipelineConfig.auto_config || {};
  const calendars = userConfig?.calendar?.calendars || [];

  // Buscar configuración específica del calendario
  const calendarConfig = calendars.find(
    (c: any) => c.calendar_id === calendar.id
  );

  if (calendarConfig) {
    return calendarConfig.enabled ?? false;
  }

  // Auto-habilitar calendario principal
  if (autoConfig.auto_enable_primary) {
    const isPrimary = calendar.id === 'primary' || calendar.id === userEmail;
    if (isPrimary) return true;
  }

  // Auto-habilitar calendarios de trabajo
  if (autoConfig.auto_enable_work_calendars) {
    const workKeywords = autoConfig.work_keywords || [];
    const summaryLower = (calendar.summary || '').toLowerCase();
    const isWorkCalendar = workKeywords.some((keyword: string) =>
      summaryLower.includes(keyword.toLowerCase())
    );
    if (isWorkCalendar) return true;
  }

  return false;
}

