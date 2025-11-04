/**
 * Servicio de scraping de Google Calendar
 * Extrae eventos de calendario con todos los metadatos y los guarda en Supabase
 * Configurable por perfil de usuario e idempotente
 */

import { CalendarService, CalendarEventResponse } from './calendar';
import { SupabaseService } from '../supabase/client';
import { credentials } from '../../utils/credentials';
import { createLogger } from '../../utils/logger';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('CalendarScraper');

export interface ScrapingConfig {
  user_id: string;
  profile_id?: string;
  calendar_id: string;
  calendar_name?: string;
  enabled?: boolean;
  time_min_offset_days?: number; // Días hacia atrás desde hoy
  time_max_offset_days?: number; // Días hacia adelante desde hoy
  max_results?: number;
  single_events?: boolean; // Expandir eventos recurrentes
  sync_attendees?: boolean;
  sync_metadata?: boolean;
}

export interface ScrapingResult {
  config: ScrapingConfig;
  events_processed: number;
  events_created: number;
  events_updated: number;
  instances_created: number;
  instances_updated: number;
  attendees_created: number;
  errors: string[];
  duration_ms: number;
}

export class CalendarScraper {
  private calendarService: CalendarService;
  private supabaseService: SupabaseService;
  private db: ReturnType<SupabaseService['db']>;

  constructor() {
    this.calendarService = new CalendarService();
    this.supabaseService = new SupabaseService();
    // Prefer service role if available; fallback to anon (like sync-documents.ts)
    const useServiceRole = (() => {
      try {
        return !!credentials.getSupabase().serviceRoleKey;
      } catch {
        return false;
      }
    })();
    this.db = this.supabaseService.db(useServiceRole);
    if (useServiceRole) {
      logger.debug('Using Supabase service role key for writes');
    } else {
      logger.debug('Using Supabase anon key (service role not available)');
    }
  }

  /**
   * Inicializa el scraper verificando configuraciones
   */
  async initialize(): Promise<void> {
    if (!this.calendarService.isConfigured()) {
      throw new Error('Google Calendar credentials not configured');
    }
    if (!this.supabaseService.isConfigured()) {
      throw new Error('Supabase credentials not configured');
    }

    await this.calendarService.authenticate();
    logger.info('Calendar scraper initialized');
  }

  /**
   * Carga configuración de scraping desde archivo local del usuario
   * Paradigma de .dendrita: configuración en .dendrita/users/[user-id]/scrapers-config.json
   */
  async loadConfigFromUser(userId: string, profileId?: string): Promise<ScrapingConfig[]> {
    try {
      const projectRoot = path.resolve(__dirname, '../../../..');
      const configPath = path.join(projectRoot, '.dendrita', 'users', userId, 'scrapers-config.json');
      
      // Intentar cargar desde scrapers-config.json
      if (fs.existsSync(configPath)) {
        const configContent = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(configContent);
        
        if (!config.calendar || !config.calendar.calendars) {
          logger.warn(`No calendar configuration found in scrapers-config.json for user ${userId}`);
          return [];
        }
        
        const defaultSettings = config.calendar.default_settings || {};
        
        return config.calendar.calendars.map((cal: any) => ({
          user_id: userId,
          profile_id: profileId,
          calendar_id: cal.calendar_id,
          calendar_name: cal.calendar_name || undefined,
          enabled: cal.enabled ?? true,
          time_min_offset_days: cal.time_min_offset_days ?? defaultSettings.time_min_offset_days ?? -30,
          time_max_offset_days: cal.time_max_offset_days ?? defaultSettings.time_max_offset_days ?? 365,
          max_results: cal.max_results ?? defaultSettings.max_results ?? 2500,
          single_events: cal.single_events ?? defaultSettings.single_events ?? true,
          sync_attendees: cal.sync_attendees ?? defaultSettings.sync_attendees ?? true,
          sync_metadata: cal.sync_metadata ?? defaultSettings.sync_metadata ?? true,
        }));
      }
      
      // Fallback: intentar cargar desde profile.json (legacy)
      const profilePath = profileId
        ? path.join(projectRoot, '.dendrita', 'users', userId, 'profiles', `${profileId}.json`)
        : path.join(projectRoot, '.dendrita', 'users', userId, 'profile.json');
      
      if (fs.existsSync(profilePath)) {
        const profileContent = fs.readFileSync(profilePath, 'utf-8');
        const profile = JSON.parse(profileContent);
        
        if (profile.integrations && profile.integrations.calendar_scraping) {
          logger.info('Loading calendar config from profile.json (legacy format)');
          const calendarConfig = profile.integrations.calendar_scraping;
          const defaultSettings = calendarConfig.default_settings || {};
          
          // Retornar configuración básica para calendarios habilitados
          const enabledCalendars = calendarConfig.enabled_calendars || ['primary'];
          
          return enabledCalendars.map((calendarId: string) => ({
            user_id: userId,
            profile_id: profileId,
            calendar_id: calendarId,
            enabled: true,
            time_min_offset_days: defaultSettings.time_min_offset_days ?? -30,
            time_max_offset_days: defaultSettings.time_max_offset_days ?? 90,
            max_results: defaultSettings.max_results ?? 2500,
            single_events: defaultSettings.single_events ?? true,
            sync_attendees: defaultSettings.sync_attendees ?? true,
            sync_metadata: defaultSettings.sync_metadata ?? true,
          }));
        }
      }
      
      logger.warn(`No scraping config found for user ${userId}${profileId ? ` with profile ${profileId}` : ''}`);
      return [];
    } catch (error) {
      logger.error('Failed to load config from user', error);
      throw error;
    }
  }

  /**
   * @deprecated Use loadConfigFromUser() instead. Kept for backward compatibility.
   * Carga configuración de scraping desde perfil de usuario
   */
  async loadConfigFromProfile(userId: string, profileId?: string): Promise<ScrapingConfig[]> {
    return this.loadConfigFromUser(userId, profileId);
  }

  /**
   * Guarda o actualiza configuración de scraping en archivo local
   * Paradigma de .dendrita: configuración en .dendrita/users/[user-id]/scrapers-config.json
   */
  async saveConfig(userId: string, configs: ScrapingConfig[]): Promise<void> {
    try {
      const projectRoot = path.resolve(__dirname, '../../../..');
      const configPath = path.join(projectRoot, '.dendrita', 'users', userId, 'scrapers-config.json');
      const userDir = path.dirname(configPath);
      
      // Crear directorio si no existe
      if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
      }
      
      // Cargar configuración existente o crear nueva
      let config: any = {};
      if (fs.existsSync(configPath)) {
        const configContent = fs.readFileSync(configPath, 'utf-8');
        config = JSON.parse(configContent);
      } else {
        config.user_id = userId;
        config.calendar = {
          default_settings: {},
          calendars: []
        };
      }
      
      // Actualizar sección de calendar
      if (!config.calendar) {
        config.calendar = { default_settings: {}, calendars: [] };
      }
      
      // Actualizar calendarios
      config.calendar.calendars = configs.map(cfg => ({
        calendar_id: cfg.calendar_id,
        calendar_name: cfg.calendar_name,
        enabled: cfg.enabled ?? true,
        time_min_offset_days: cfg.time_min_offset_days ?? -30,
        time_max_offset_days: cfg.time_max_offset_days ?? 365,
        max_results: cfg.max_results ?? 2500,
        single_events: cfg.single_events ?? true,
        sync_attendees: cfg.sync_attendees ?? true,
        sync_metadata: cfg.sync_metadata ?? true,
      }));
      
      // Actualizar metadata
      config.metadata = {
        ...config.metadata,
        last_updated: new Date().toISOString(),
      };
      
      // Guardar archivo
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
      logger.info(`Config saved for user ${userId} in ${configPath}`);
    } catch (error) {
      logger.error('Failed to save config', error);
      throw error;
    }
  }

  /**
   * @deprecated Use saveConfig() instead. Kept for backward compatibility.
   * Crea o actualiza configuración de scraping
   */
  async upsertConfig(config: ScrapingConfig): Promise<void> {
    // Para mantener compatibilidad, guardamos el config individual
    await this.saveConfig(config.user_id, [config]);
  }

  /**
   * Calcula hash de un evento para detectar cambios
   */
  private calculateEventHash(event: any): string {
    const hashable = {
      summary: event.summary || '',
      description: event.description || '',
      location: event.location || '',
      start: JSON.stringify(event.start),
      end: JSON.stringify(event.end),
      status: event.status || '',
      recurrence: event.recurrence || [],
      updated: event.updated || '',
      organizer: JSON.stringify(event.organizer || {}),
      creator: JSON.stringify(event.creator || {}),
    };

    const hashInput = JSON.stringify(hashable);
    return crypto.createHash('sha256').update(hashInput).digest('hex');
  }

  /**
   * Extrae todos los metadatos de un evento
   */
  private extractFullMetadata(event: any): any {
    return {
      id: event.id,
      htmlLink: event.htmlLink,
      icalUID: event.icalUID,
      sequence: event.sequence,
      hangoutLink: event.hangoutLink,
      conferenceData: event.conferenceData,
      visibility: event.visibility,
      transparency: event.transparency,
      locked: event.locked,
      anyoneCanAddSelf: event.anyoneCanAddSelf,
      guestsCanInviteOthers: event.guestsCanInviteOthers,
      guestsCanModify: event.guestsCanModify,
      guestsCanSeeOtherGuests: event.guestsCanSeeOtherGuests,
      source: event.source,
      attachments: event.attachments,
      extendedProperties: event.extendedProperties,
      gadget: event.gadget,
      colorId: event.colorId,
      endTimeUnspecified: event.endTimeUnspecified,
      originalStartTime: event.originalStartTime,
      recurringEventId: event.recurringEventId,
      privateCopy: event.privateCopy,
      etag: event.etag,
      // Incluir todos los campos que puedan existir
      ...event,
    };
  }

  /**
   * Procesa un evento y lo guarda en Supabase
   */
  private async processEvent(
    config: ScrapingConfig,
    googleEvent: CalendarEventResponse,
    isInstance: boolean = false,
    parentEventId?: string,
    instanceStart?: string,
    instanceEnd?: string
  ): Promise<{
    eventId: string;
    created: boolean;
    updated: boolean;
  }> {
    try {
      const syncHash = this.calculateEventHash(googleEvent);
      const fullMetadata = this.extractFullMetadata(googleEvent);

      // Determinar si es evento todo el día
      const isAllDay = !!googleEvent.start.date && !googleEvent.start.dateTime;

      // Parsear fechas
      const startDateTime = googleEvent.start.dateTime || null;
      const startDate = googleEvent.start.date || null;
      const endDateTime = googleEvent.end.dateTime || null;
      const endDate = googleEvent.end.date || null;

      // Determinar tipo de evento
      let eventType = 'single';
      if (googleEvent.recurringEventId) {
        eventType = 'exception';
      } else if (googleEvent.recurrence && googleEvent.recurrence.length > 0) {
        eventType = 'recurring';
      }

      // Buscar evento existente
      const { data: existingEvent, error: findError } = await this.db
        .from('calendar_events')
        .select('id, sync_hash, deleted_at')
        .eq('user_id', config.user_id)
        .eq('calendar_id', config.calendar_id)
        .eq('google_event_id', googleEvent.id!)
        .maybeSingle();

      if (findError && findError.code !== 'PGRST116') {
        // PGRST116 es "no rows returned", que es aceptable
        throw findError;
      }

      const eventData: any = {
        user_id: config.user_id,
        profile_id: config.profile_id || null,
        calendar_id: config.calendar_id,
        google_event_id: googleEvent.id!,
        event_type: eventType,
        recurring_event_id: googleEvent.recurringEventId || null,
        summary: googleEvent.summary || null,
        description: googleEvent.description || null,
        location: googleEvent.location || null,
        status: googleEvent.status || null,
        start_date_time: startDateTime,
        start_date: startDate,
        start_time_zone: googleEvent.start.timeZone || null,
        end_date_time: endDateTime,
        end_date: endDate,
        end_time_zone: googleEvent.end.timeZone || null,
        all_day: isAllDay,
        recurrence_rules: googleEvent.recurrence || null,
        organizer_email: googleEvent.organizer?.email || null,
        organizer_display_name: googleEvent.organizer?.displayName || null,
        creator_email: googleEvent.creator?.email || null,
        creator_display_name: googleEvent.creator?.displayName || null,
        html_link: googleEvent.htmlLink || null,
        ical_uid: googleEvent.icalUID || null,
        reminders_use_default: googleEvent.reminders?.useDefault || null,
        reminders_overrides: googleEvent.reminders?.overrides || null,
        full_metadata: fullMetadata,
        google_created: googleEvent.created || null,
        google_updated: googleEvent.updated || null,
        sync_hash: syncHash,
        last_synced_at: new Date().toISOString(),
        deleted_at: null, // Restaurar si estaba eliminado
        updated_at: new Date().toISOString(),
      };

      let eventId: string;
      let created = false;
      let updated = false;

      if (existingEvent) {
        // Verificar si hay cambios
        if (existingEvent.sync_hash !== syncHash) {
          // Actualizar evento existente
          const { data: updatedEvent, error: updateError } = await this.db
            .from('calendar_events')
            .update(eventData)
            .eq('id', existingEvent.id)
            .select('id')
            .single();

          if (updateError) throw updateError;
          eventId = updatedEvent.id;
          updated = true;
          logger.debug(`Event updated: ${googleEvent.id}`);
        } else {
          // Sin cambios, solo actualizar last_synced_at
          eventId = existingEvent.id;
          await this.db
            .from('calendar_events')
            .update({ last_synced_at: new Date().toISOString() })
            .eq('id', existingEvent.id);
        }
      } else {
        // Crear nuevo evento
        const { data: newEvent, error: insertError } = await this.db
          .from('calendar_events')
          .insert(eventData)
          .select('id')
          .single();

        if (insertError) throw insertError;
        eventId = newEvent.id;
        created = true;
        logger.debug(`Event created: ${googleEvent.id}`);
      }

      // Procesar asistentes si está habilitado
      if (config.sync_attendees && googleEvent.attendees && googleEvent.attendees.length > 0) {
        await this.processAttendees(eventId, googleEvent.attendees);
      }

      // Nota: Las instancias de eventos recurrentes se procesan en el método scrape()
      // después de procesar el evento principal, no aquí

      return { eventId, created, updated };
    } catch (error) {
      logger.error(`Failed to process event ${googleEvent.id}`, error);
      throw error;
    }
  }

  /**
   * Procesa instancia individual de evento recurrente
   * @returns true si se creó, false si se actualizó o ya existía sin cambios
   */
  private async processEventInstance(
    config: ScrapingConfig,
    eventId: string,
    googleEventId: string,
    recurringEventId: string,
    instanceStart: string,
    instanceEnd: string,
    syncHash: string,
    fullMetadata: any
  ): Promise<boolean> {
    try {
      const instanceData: any = {
        user_id: config.user_id,
        profile_id: config.profile_id || null,
        calendar_id: config.calendar_id,
        event_id: eventId,
        google_event_id: googleEventId,
        instance_start: instanceStart,
        instance_end: instanceEnd,
        summary: fullMetadata.summary || null,
        description: fullMetadata.description || null,
        location: fullMetadata.location || null,
        status: fullMetadata.status || null,
        full_metadata: fullMetadata,
        sync_hash: syncHash,
        last_synced_at: new Date().toISOString(),
        deleted_at: null,
        updated_at: new Date().toISOString(),
      };

      // Buscar instancia existente
      const { data: existingInstance } = await this.db
        .from('calendar_event_instances')
        .select('id, sync_hash')
        .eq('user_id', config.user_id)
        .eq('calendar_id', config.calendar_id)
        .eq('google_event_id', googleEventId)
        .eq('instance_start', instanceStart)
        .maybeSingle();

      if (existingInstance) {
        if (existingInstance.sync_hash !== syncHash) {
          await this.db
            .from('calendar_event_instances')
            .update(instanceData)
            .eq('id', existingInstance.id);
          return false; // Actualizado
        }
        return false; // Sin cambios
      } else {
        await this.db.from('calendar_event_instances').insert(instanceData);
        return true; // Creado
      }
    } catch (error) {
      logger.error(`Failed to process event instance ${googleEventId}`, error);
      throw error;
    }
  }

  /**
   * Procesa asistentes de un evento
   */
  private async processAttendees(eventId: string, attendees: any[]): Promise<void> {
    try {
      for (const attendee of attendees) {
        const attendeeData: any = {
          event_id: eventId,
          instance_id: null,
          email: attendee.email,
          display_name: attendee.displayName || null,
          response_status: attendee.responseStatus || null,
          organizer: attendee.organizer || false,
          self: attendee.self || false,
          resource: attendee.resource || false,
          optional: attendee.optional || false,
          comment: attendee.comment || null,
          additional_metadata: {
            ...attendee,
          },
          updated_at: new Date().toISOString(),
        };

        await this.db
          .from('calendar_event_attendees')
          .upsert(attendeeData, {
            onConflict: 'event_id,instance_id,email',
          });
      }
    } catch (error) {
      logger.error(`Failed to process attendees for event ${eventId}`, error);
      throw error;
    }
  }

  /**
   * Ejecuta scraping para una configuración específica
   */
  async scrape(config: ScrapingConfig): Promise<ScrapingResult> {
    const startTime = Date.now();
    const result: ScrapingResult = {
      config,
      events_processed: 0,
      events_created: 0,
      events_updated: 0,
      instances_created: 0,
      instances_updated: 0,
      attendees_created: 0,
      errors: [],
      duration_ms: 0,
    };

    try {
      logger.info(`Starting scrape for user ${config.user_id}, calendar ${config.calendar_id}`);

      // Calcular rangos de tiempo
      const now = new Date();
      const timeMin = new Date(now);
      timeMin.setDate(timeMin.getDate() + (config.time_min_offset_days || -30));
      const timeMax = new Date(now);
      timeMax.setDate(timeMax.getDate() + (config.time_max_offset_days || 365));

      // Obtener eventos del calendario
      const events = await this.calendarService.listEvents(config.calendar_id, {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        maxResults: config.max_results || 2500,
        singleEvents: config.single_events ?? true, // Expandir eventos recurrentes
        orderBy: 'startTime',
      });

      logger.info(`Found ${events.length} events to process`);

      // Procesar cada evento
      for (const event of events) {
        try {
          result.events_processed++;

          // Determinar si es una instancia de evento recurrente
          const isRecurringInstance = !!event.recurringEventId;
          const startDateTime = event.start.dateTime || event.start.date;
          const endDateTime = event.end.dateTime || event.end.date;

          // Procesar el evento (se guarda en calendar_events)
          const { eventId, created, updated } = await this.processEvent(
            config,
            event,
            isRecurringInstance,
            event.recurringEventId,
            startDateTime ? new Date(startDateTime).toISOString() : undefined,
            endDateTime ? new Date(endDateTime).toISOString() : undefined
          );

          if (created) {
            result.events_created++;
          } else if (updated) {
            result.events_updated++;
          }

          // Si es instancia de evento recurrente, también guardar en calendar_event_instances
          if (isRecurringInstance && startDateTime && endDateTime) {
            const instanceCreated = await this.processEventInstance(
              config,
              eventId,
              event.id!,
              event.recurringEventId!,
              new Date(startDateTime).toISOString(),
              new Date(endDateTime).toISOString(),
              this.calculateEventHash(event),
              this.extractFullMetadata(event)
            );

            if (instanceCreated) {
              result.instances_created++;
            } else {
              result.instances_updated++;
            }
          }

          // Contar asistentes
          if (event.attendees) {
            result.attendees_created += event.attendees.length;
          }
        } catch (error: any) {
          const errorMsg = `Error processing event ${event.id}: ${error.message}`;
          logger.error(errorMsg, error);
          result.errors.push(errorMsg);
        }
      }

      // Actualizar estado de sincronización
      await this.updateSyncStatus(config, 'success', null);

      result.duration_ms = Date.now() - startTime;
      logger.info(
        `Scrape completed: ${result.events_processed} processed, ${result.events_created} created, ${result.events_updated} updated`
      );

      return result;
    } catch (error: any) {
      const errorMsg = `Scrape failed: ${error.message}`;
      logger.error(errorMsg, error);
      result.errors.push(errorMsg);
      result.duration_ms = Date.now() - startTime;

      await this.updateSyncStatus(config, 'error', errorMsg);
      throw error;
    }
  }

  /**
   * Actualiza estado de sincronización
   */
  private async updateSyncStatus(config: ScrapingConfig, status: string, error: string | null): Promise<void> {
    try {
      await this.db
        .from('calendar_scraping_configs')
        .update({
          last_sync_at: new Date().toISOString(),
          last_sync_status: status,
          last_sync_error: error,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', config.user_id)
        .eq('profile_id', config.profile_id || null)
        .eq('calendar_id', config.calendar_id);
    } catch (error) {
      logger.error('Failed to update sync status', error);
    }
  }

  /**
   * Ejecuta scraping para un usuario y perfil específicos
   */
  async scrapeForUser(userId: string, profileId?: string): Promise<ScrapingResult[]> {
    const configs = await this.loadConfigFromUser(userId, profileId);

    if (configs.length === 0) {
      logger.warn(`No scraping configs found for user ${userId}`);
      return [];
    }

    const results: ScrapingResult[] = [];

    for (const config of configs) {
      if (!config.enabled) {
        logger.info(`Skipping disabled config for calendar ${config.calendar_id}`);
        continue;
      }

      try {
        const result = await this.scrape(config);
        results.push(result);
      } catch (error: any) {
        logger.error(`Failed to scrape calendar ${config.calendar_id}`, error);
        results.push({
          config,
          events_processed: 0,
          events_created: 0,
          events_updated: 0,
          instances_created: 0,
          instances_updated: 0,
          attendees_created: 0,
          errors: [error.message],
          duration_ms: 0,
        });
      }
    }

    return results;
  }
}

