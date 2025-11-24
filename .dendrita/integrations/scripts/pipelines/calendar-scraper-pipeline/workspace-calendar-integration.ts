/**
 * Script de integración de Google Calendar para workspaces
 * 
 * Funcionalidades:
 * - Listar eventos próximos relacionados con un workspace
 * - Crear eventos de reuniones recurrentes
 * - Sincronizar eventos con notas de reuniones
 * - Buscar eventos por participantes o palabras clave
 * 
 * Uso:
 *   ts-node .dendrita/integrations/scripts/pipelines/calendar-scraper-pipeline/workspace-calendar-integration.ts <workspace> [operation] [options]
 * 
 * Ejemplos:
 *   ts-node .dendrita/integrations/scripts/pipelines/calendar-scraper-pipeline/workspace-calendar-integration.ts [workspace] list
 *   ts-node .dendrita/integrations/scripts/pipelines/calendar-scraper-pipeline/workspace-calendar-integration.ts [workspace] summary --days 7
 */

import { CalendarService, CalendarEvent, CalendarEventResponse } from '../../services/google/calendar';
import { credentials } from '../../utils/credentials';
import { createLogger } from '../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('WorkspaceCalendar');

interface WorkspaceCalendarConfig {
  workspace: string;
  keywords?: string[];
  attendee_emails?: string[];
  timezone?: string;
  default_days?: number;
}

interface MeetingConfig {
  summary: string;
  description?: string;
  attendees: string[];
  recurrence?: {
    frequency: 'weekly' | 'biweekly' | 'monthly';
    dayOfWeek?: number; // 0 = Sunday, 1 = Monday, etc.
    interval?: number;
  };
}

/**
 * Carga la configuración de calendar para un workspace
 */
function loadWorkspaceCalendarConfig(workspace: string): WorkspaceCalendarConfig | null {
  try {
    const workspacePath = path.resolve(__dirname, '../../../..', 'workspaces', workspace);
    const configPath = path.join(workspacePath, 'scrapers-config.json');
    
    if (!fs.existsSync(configPath)) {
      logger.warn(`No scrapers-config.json found for workspace: ${workspace}`);
      return null;
    }
    
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    
    if (!config.calendar) {
      logger.warn(`No calendar configuration found for workspace: ${workspace}`);
      return null;
    }
    
    return {
      workspace,
      keywords: config.calendar.keywords || [],
      attendee_emails: config.calendar.attendee_emails || [],
      timezone: config.calendar.timezone || 'America/Lima',
      default_days: config.calendar.default_days || 30,
    };
  } catch (error) {
    logger.error(`Error loading calendar config for workspace ${workspace}`, error);
    return null;
  }
}

/**
 * Verifica que Google Calendar esté configurado
 */
function checkConfiguration(): void {
  if (!credentials.hasGoogleWorkspace()) {
    logger.error('❌ Google Workspace no está configurado');
    logger.info('📖 Por favor, sigue la guía en: .dendrita/integrations/hooks/google-auth-flow.md');
    process.exit(1);
  }
}

/**
 * Lista eventos próximos relacionados con un workspace
 */
export async function listUpcomingWorkspaceEvents(
  workspace: string,
  days?: number
): Promise<CalendarEventResponse[]> {
  try {
    checkConfiguration();
    
    const config = loadWorkspaceCalendarConfig(workspace);
    if (!config) {
      throw new Error(`No calendar configuration found for workspace: ${workspace}`);
    }
    
    const calendar = new CalendarService();
    await calendar.authenticate();
    
    const now = new Date();
    const futureDays = days || config.default_days || 30;
    const future = new Date(now.getTime() + futureDays * 24 * 60 * 60 * 1000);
    
    logger.info(`📅 Buscando eventos de ${workspace} en los próximos ${futureDays} días...`);
    
    // Construir query de búsqueda
    let searchQuery = '';
    if (config.keywords && config.keywords.length > 0) {
      searchQuery = config.keywords.join(' OR ');
    }
    
    // Buscar eventos
    const events = await calendar.listEvents('primary', {
      timeMin: now.toISOString(),
      timeMax: future.toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime',
      q: searchQuery || undefined,
    });
    
    // Filtrar eventos relacionados con el workspace
    const workspaceEvents = events.filter(event => {
      const summary = event.summary?.toLowerCase() || '';
      const description = event.description?.toLowerCase() || '';
      const workspaceName = workspace.toLowerCase();
      
      // Filtrar por keywords
      const matchesKeywords = config.keywords?.some(keyword =>
        summary.includes(keyword.toLowerCase()) ||
        description.includes(keyword.toLowerCase())
      ) || false;
      
      // Filtrar por attendees
      const matchesAttendees = config.attendee_emails?.some(email =>
        event.attendees?.some(att =>
          att.email?.toLowerCase().includes(email.toLowerCase())
        )
      ) || false;
      
      // Filtrar por nombre del workspace
      const matchesWorkspace = summary.includes(workspaceName) ||
        description.includes(workspaceName);
      
      return matchesKeywords || matchesAttendees || matchesWorkspace;
    });
    
    logger.info(`✅ Se encontraron ${workspaceEvents.length} evento(s) relacionados con ${workspace}`);
    
    return workspaceEvents;
  } catch (error) {
    logger.error(`Error al listar eventos de ${workspace}`, error);
    throw error;
  }
}

/**
 * Crea un evento de reunión recurrente
 */
export async function createRecurringMeeting(
  workspace: string,
  config: MeetingConfig,
  startDate: Date,
  endDate: Date
): Promise<CalendarEventResponse> {
  try {
    checkConfiguration();
    
    const workspaceConfig = loadWorkspaceCalendarConfig(workspace);
    const timezone = workspaceConfig?.timezone || 'America/Lima';
    
    const calendar = new CalendarService();
    await calendar.authenticate();
    
    logger.info(`📅 Creando reunión recurrente: ${config.summary}`);
    
    // Construir regla de recurrencia
    let recurrence: string[] = [];
    if (config.recurrence) {
      const { frequency, dayOfWeek, interval = 1 } = config.recurrence;
      
      // RFC 5545 format para recurrencia
      const rrule = `RRULE:FREQ=${frequency.toUpperCase()};INTERVAL=${interval}`;
      
      if (dayOfWeek !== undefined) {
        const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
        recurrence.push(`${rrule};BYDAY=${days[dayOfWeek]}`);
      } else {
        recurrence.push(rrule);
      }
    }
    
    const event: CalendarEvent = {
      summary: config.summary,
      description: config.description || '',
      start: {
        dateTime: startDate.toISOString(),
        timeZone: timezone,
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: timezone,
      },
      attendees: config.attendees.map(email => ({
        email,
        responseStatus: 'needsAction',
      })),
      recurrence: recurrence.length > 0 ? recurrence : undefined,
      reminders: {
        useDefault: true,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 día antes
          { method: 'popup', minutes: 30 }, // 30 minutos antes
        ],
      },
    };
    
    const createdEvent = await calendar.createEvent('primary', event);
    
    logger.info(`✅ Evento creado: ${createdEvent.id}`);
    logger.info(`🔗 Link: ${createdEvent.htmlLink}`);
    
    return createdEvent;
  } catch (error) {
    logger.error('Error al crear reunión recurrente', error);
    throw error;
  }
}

/**
 * Busca eventos por participantes específicos
 */
export async function findEventsByAttendees(
  attendeeEmails: string[],
  days: number = 30
): Promise<CalendarEventResponse[]> {
  try {
    checkConfiguration();
    
    const calendar = new CalendarService();
    await calendar.authenticate();
    
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    logger.info(`🔍 Buscando eventos con participantes: ${attendeeEmails.join(', ')}`);
    
    // Listar todos los eventos en el rango
    const allEvents = await calendar.listEvents('primary', {
      timeMin: now.toISOString(),
      timeMax: future.toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime',
    });
    
    // Filtrar por participantes
    const matchingEvents = allEvents.filter(event => {
      if (!event.attendees || event.attendees.length === 0) {
        return false;
      }
      
      const eventEmails = event.attendees.map(att => att.email?.toLowerCase() || '');
      return attendeeEmails.some(email =>
        eventEmails.some(eventEmail => eventEmail.includes(email.toLowerCase()))
      );
    });
    
    logger.info(`✅ Se encontraron ${matchingEvents.length} evento(s) con esos participantes`);
    
    return matchingEvents;
  } catch (error) {
    logger.error('Error al buscar eventos por participantes', error);
    throw error;
  }
}

/**
 * Exporta eventos de un workspace a un archivo JSON
 */
export async function exportWorkspaceEventsToJSON(
  workspace: string,
  outputPath: string,
  days?: number
): Promise<void> {
  try {
    const events = await listUpcomingWorkspaceEvents(workspace, days);
    
    const exportData = {
      workspace,
      exportedAt: new Date().toISOString(),
      totalEvents: events.length,
      events: events.map(event => ({
        id: event.id,
        summary: event.summary,
        description: event.description,
        start: event.start,
        end: event.end,
        location: event.location,
        attendees: event.attendees?.map(att => ({
          email: att.email,
          displayName: att.displayName,
          responseStatus: att.responseStatus,
        })),
        htmlLink: event.htmlLink,
        status: event.status,
      })),
    };
    
    const fullPath = path.resolve(outputPath);
    fs.writeFileSync(fullPath, JSON.stringify(exportData, null, 2), 'utf-8');
    
    logger.info(`✅ Eventos exportados a: ${fullPath}`);
    logger.info(`📊 Total de eventos: ${events.length}`);
  } catch (error) {
    logger.error('Error al exportar eventos', error);
    throw error;
  }
}

/**
 * Genera un resumen de eventos próximos para las notas de reunión
 */
export async function generateMeetingSummary(
  workspace: string,
  days?: number
): Promise<string> {
  try {
    const config = loadWorkspaceCalendarConfig(workspace);
    const futureDays = days || config?.default_days || 7;
    
    const events = await listUpcomingWorkspaceEvents(workspace, futureDays);
    
    if (events.length === 0) {
      return `No hay eventos de ${workspace} programados en los próximos ${futureDays} días.`;
    }
    
    let summary = `## Eventos de ${workspace} (próximos ${futureDays} días)\n\n`;
    summary += `Total: ${events.length} evento(s)\n\n`;
    
    events.forEach((event, index) => {
      const start = new Date(event.start.dateTime || event.start.date || '');
      const formattedDate = start.toLocaleDateString('es-PE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      
      summary += `### ${index + 1}. ${event.summary}\n`;
      summary += `- **Fecha:** ${formattedDate}\n`;
      
      if (event.location) {
        summary += `- **Ubicación:** ${event.location}\n`;
      }
      
      if (event.attendees && event.attendees.length > 0) {
        const attendees = event.attendees
          .map(att => att.displayName || att.email)
          .join(', ');
        summary += `- **Participantes:** ${attendees}\n`;
      }
      
      if (event.description) {
        const desc = event.description.substring(0, 100);
        summary += `- **Descripción:** ${desc}${event.description.length > 100 ? '...' : ''}\n`;
      }
      
      if (event.htmlLink) {
        summary += `- **Link:** ${event.htmlLink}\n`;
      }
      
      summary += '\n';
    });
    
    return summary;
  } catch (error) {
    logger.error('Error al generar resumen', error);
    throw error;
  }
}

// Ejecución directa del script
if (require.main === module) {
  (async () => {
    try {
      const args = process.argv.slice(2);
      
      if (args.length === 0) {
        logger.error('❌ Uso: ts-node workspace-calendar-integration.ts <workspace> [operation] [options]');
        logger.info('   Operaciones: list, summary, export');
        logger.info('   Ejemplo: ts-node workspace-calendar-integration.ts [workspace] list');
        process.exit(1);
      }
      
      const workspace = args[0];
      const operation = args[1] || 'list';
      
      logger.info(`🚀 Integración de Google Calendar para ${workspace}\n`);
      
      switch (operation) {
        case 'list': {
          const days = args[2] ? parseInt(args[2]) : undefined;
          const events = await listUpcomingWorkspaceEvents(workspace, days);
          
          if (events.length > 0) {
            logger.info('\n📋 Eventos próximos:');
            events.forEach((event, index) => {
              const start = new Date(event.start.dateTime || event.start.date || '');
              logger.info(`   ${index + 1}. ${event.summary}`);
              logger.info(`      Fecha: ${start.toLocaleString('es-PE')}`);
              if (event.location) {
                logger.info(`      Ubicación: ${event.location}`);
              }
            });
          } else {
            logger.info(`ℹ️ No hay eventos próximos de ${workspace}`);
          }
          break;
        }
        
        case 'summary': {
          const days = args[2] ? parseInt(args[2]) : undefined;
          logger.info('\n📝 Generando resumen para notas de reunión...');
          const summary = await generateMeetingSummary(workspace, days);
          logger.info(summary);
          break;
        }
        
        case 'export': {
          const outputPath = args[2] || `./${workspace}-events-export.json`;
          const days = args[3] ? parseInt(args[3]) : undefined;
          await exportWorkspaceEventsToJSON(workspace, outputPath, days);
          break;
        }
        
        default:
          logger.error(`❌ Operación desconocida: ${operation}`);
          logger.info('   Operaciones disponibles: list, summary, export');
          process.exit(1);
      }
    } catch (error) {
      logger.error('Error en la ejecución', error);
      process.exit(1);
    }
  })();
}

