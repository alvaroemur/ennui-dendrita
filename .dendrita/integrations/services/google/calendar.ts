/**
 * Servicio de Google Calendar para crear, leer y buscar eventos
 */

import { BaseService } from '../base/service.interface';
import { GoogleAuth } from './auth';
import { createLogger } from '../../utils/logger';

const logger = createLogger('GoogleCalendar');

export interface Calendar {
  id: string;
  summary: string;
  description?: string;
  timeZone?: string;
}

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  recurrence?: string[];
  reminders?: {
    useDefault?: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
}

export interface CalendarEventResponse extends CalendarEvent {
  id: string;
  htmlLink: string;
  created: string;
  updated: string;
  creator: {
    email: string;
    displayName?: string;
  };
  organizer: {
    email: string;
    displayName?: string;
  };
  status: 'confirmed' | 'tentative' | 'cancelled';
  recurringEventId?: string; // ID del evento recurrente padre (para excepciones)
  icalUID?: string; // UID del calendario iCal
}

export class CalendarService extends BaseService {
  name = 'Google Calendar';
  private accessToken?: string;

  async authenticate(): Promise<void> {
    try {
      logger.info('Authenticating with Google Calendar...');

      if (!GoogleAuth.isConfigured()) {
        throw new Error('Google Workspace credentials not configured');
      }

      this.accessToken = await GoogleAuth.refreshAccessToken();
      logger.info('Google Calendar authentication successful');
    } catch (error) {
      logger.error('Google Calendar authentication failed', error);
      throw error;
    }
  }

  isConfigured(): boolean {
    return GoogleAuth.isConfigured();
  }

  /**
   * Lista todos los calendarios del usuario
   */
  async listCalendars(): Promise<Calendar[]> {
    try {
      if (!this.accessToken) {
        await this.authenticate();
      }

      logger.info('Listing calendars...');

      const url = 'https://www.googleapis.com/calendar/v3/users/me/calendarList';
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Calendar API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const calendars: Calendar[] = (data.items || []).map((item: any) => ({
        id: item.id,
        summary: item.summary,
        description: item.description,
        timeZone: item.timeZone,
      }));

      logger.info(`Found ${calendars.length} calendars`);
      return calendars;
    } catch (error) {
      logger.error('Failed to list calendars', error);
      throw error;
    }
  }

  /**
   * Obtiene el calendario principal (primary)
   */
  async getPrimaryCalendar(): Promise<Calendar> {
    try {
      if (!this.accessToken) {
        await this.authenticate();
      }

      logger.debug('Getting primary calendar...');

      const url = 'https://www.googleapis.com/calendar/v3/users/me/calendarList/primary';
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Calendar API error: ${response.status} - ${errorText}`);
      }

      const item = await response.json();
      return {
        id: item.id,
        summary: item.summary,
        description: item.description,
        timeZone: item.timeZone,
      };
    } catch (error) {
      logger.error('Failed to get primary calendar', error);
      throw error;
    }
  }

  /**
   * Actualiza el nombre (summary) de un calendario
   * Para calendarios propios, actualiza el recurso del calendario
   * Para calendarios compartidos, actualiza la entrada en calendarList
   */
  async updateCalendarName(calendarId: string, newName: string): Promise<Calendar> {
    try {
      if (!this.accessToken) {
        await this.authenticate();
      }

      logger.info(`Updating calendar name: ${calendarId} -> ${newName}`);

      // Para el calendario principal y calendarios propios, actualizar el recurso del calendario
      // Primero intentar actualizar el recurso del calendario (calendars/{id})
      const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}`;
      const calendarGetResponse = await fetch(calendarUrl, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (calendarGetResponse.ok) {
        // Es un calendario propio, actualizar el recurso del calendario
        const currentCalendar = await calendarGetResponse.json();
        
        const calendarUpdateResponse = await fetch(calendarUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...currentCalendar,
            summary: newName,
          }),
        });

        if (!calendarUpdateResponse.ok) {
          const errorText = await calendarUpdateResponse.text();
          throw new Error(`Calendar API error: ${calendarUpdateResponse.status} - ${errorText}`);
        }

        const updatedCalendar = await calendarUpdateResponse.json();
        logger.info(`Calendar name updated successfully (calendar resource)`);

        // También actualizar la entrada en calendarList para que se refleje en la lista
        const listUrl = `https://www.googleapis.com/calendar/v3/users/me/calendarList/${encodeURIComponent(calendarId)}`;
        const listGetResponse = await fetch(listUrl, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        });

        if (listGetResponse.ok) {
          const currentListEntry = await listGetResponse.json();
          await fetch(listUrl, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...currentListEntry,
              summaryOverride: newName, // summaryOverride para sobrescribir el nombre en la lista
            }),
          });
        }

        return {
          id: updatedCalendar.id,
          summary: updatedCalendar.summary,
          description: updatedCalendar.description,
          timeZone: updatedCalendar.timeZone,
        };
      } else {
        // No es un calendario propio, actualizar solo la entrada en calendarList
        const listUrl = `https://www.googleapis.com/calendar/v3/users/me/calendarList/${encodeURIComponent(calendarId)}`;
        const listGetResponse = await fetch(listUrl, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        });

        if (!listGetResponse.ok) {
          const errorText = await listGetResponse.text();
          throw new Error(`Calendar API error: ${listGetResponse.status} - ${errorText}`);
        }

        const currentListEntry = await listGetResponse.json();

        const listUpdateResponse = await fetch(listUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...currentListEntry,
            summaryOverride: newName,
          }),
        });

        if (!listUpdateResponse.ok) {
          const errorText = await listUpdateResponse.text();
          throw new Error(`Calendar API error: ${listUpdateResponse.status} - ${errorText}`);
        }

        const updatedListEntry = await listUpdateResponse.json();
        logger.info(`Calendar name updated successfully (calendarList entry)`);

        return {
          id: updatedListEntry.id,
          summary: updatedListEntry.summaryOverride || updatedListEntry.summary,
          description: updatedListEntry.description,
          timeZone: updatedListEntry.timeZone,
        };
      }
    } catch (error) {
      logger.error('Failed to update calendar name', error);
      throw error;
    }
  }

  /**
   * Crea un evento en un calendario
   */
  async createEvent(
    calendarId: string = 'primary',
    event: CalendarEvent
  ): Promise<CalendarEventResponse> {
    try {
      if (!this.accessToken) {
        await this.authenticate();
      }

      logger.info(`Creating event in calendar: ${calendarId}`);

      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Calendar API error: ${response.status} - ${errorText}`);
      }

      const createdEvent = await response.json();
      logger.info(`Event created: ${createdEvent.id}`);

      return {
        id: createdEvent.id,
        summary: createdEvent.summary,
        description: createdEvent.description,
        start: createdEvent.start,
        end: createdEvent.end,
        location: createdEvent.location,
        attendees: createdEvent.attendees,
        recurrence: createdEvent.recurrence,
        reminders: createdEvent.reminders,
        htmlLink: createdEvent.htmlLink,
        created: createdEvent.created,
        updated: createdEvent.updated,
        creator: createdEvent.creator,
        organizer: createdEvent.organizer,
        status: createdEvent.status,
      };
    } catch (error) {
      logger.error('Failed to create event', error);
      throw error;
    }
  }

  /**
   * Busca eventos en un calendario
   */
  async listEvents(
    calendarId: string = 'primary',
    options: {
      timeMin?: string;
      timeMax?: string;
      maxResults?: number;
      singleEvents?: boolean;
      orderBy?: 'startTime' | 'updated';
      q?: string;
    } = {}
  ): Promise<CalendarEventResponse[]> {
    try {
      if (!this.accessToken) {
        await this.authenticate();
      }

      const {
        timeMin,
        timeMax,
        maxResults = 10,
        singleEvents = true,
        orderBy = 'startTime',
        q,
      } = options;

      logger.info(`Listing events in calendar: ${calendarId}`);

      const params = new URLSearchParams();
      if (timeMin) params.append('timeMin', timeMin);
      if (timeMax) params.append('timeMax', timeMax);
      params.append('maxResults', maxResults.toString());
      params.append('singleEvents', singleEvents.toString());
      params.append('orderBy', orderBy);
      if (q) params.append('q', q);

      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Calendar API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const events: CalendarEventResponse[] = (data.items || []).map((item: any) => ({
        id: item.id,
        summary: item.summary,
        description: item.description,
        start: item.start,
        end: item.end,
        location: item.location,
        attendees: item.attendees,
        recurrence: item.recurrence,
        reminders: item.reminders,
        htmlLink: item.htmlLink,
        created: item.created,
        updated: item.updated,
        creator: item.creator,
        organizer: item.organizer,
        status: item.status,
      }));

      logger.info(`Found ${events.length} events`);
      return events;
    } catch (error) {
      logger.error('Failed to list events', error);
      throw error;
    }
  }

  /**
   * Obtiene un evento específico por ID
   */
  async getEvent(calendarId: string = 'primary', eventId: string): Promise<CalendarEventResponse> {
    try {
      if (!this.accessToken) {
        await this.authenticate();
      }

      logger.debug(`Getting event: ${eventId}`);

      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Calendar API error: ${response.status} - ${errorText}`);
      }

      const item = await response.json();
      return {
        id: item.id,
        summary: item.summary,
        description: item.description,
        start: item.start,
        end: item.end,
        location: item.location,
        attendees: item.attendees,
        recurrence: item.recurrence,
        reminders: item.reminders,
        htmlLink: item.htmlLink,
        created: item.created,
        updated: item.updated,
        creator: item.creator,
        organizer: item.organizer,
        status: item.status,
      };
    } catch (error) {
      logger.error('Failed to get event', error);
      throw error;
    }
  }

  /**
   * Actualiza un evento existente
   */
  async updateEvent(
    calendarId: string = 'primary',
    eventId: string,
    event: Partial<CalendarEvent>
  ): Promise<CalendarEventResponse> {
    try {
      if (!this.accessToken) {
        await this.authenticate();
      }

      logger.info(`Updating event: ${eventId}`);

      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Calendar API error: ${response.status} - ${errorText}`);
      }

      const updatedEvent = await response.json();
      logger.info(`Event updated: ${updatedEvent.id}`);

      return {
        id: updatedEvent.id,
        summary: updatedEvent.summary,
        description: updatedEvent.description,
        start: updatedEvent.start,
        end: updatedEvent.end,
        location: updatedEvent.location,
        attendees: updatedEvent.attendees,
        recurrence: updatedEvent.recurrence,
        reminders: updatedEvent.reminders,
        htmlLink: updatedEvent.htmlLink,
        created: updatedEvent.created,
        updated: updatedEvent.updated,
        creator: updatedEvent.creator,
        organizer: updatedEvent.organizer,
        status: updatedEvent.status,
      };
    } catch (error) {
      logger.error('Failed to update event', error);
      throw error;
    }
  }

  /**
   * Elimina un evento
   */
  async deleteEvent(calendarId: string = 'primary', eventId: string): Promise<void> {
    try {
      if (!this.accessToken) {
        await this.authenticate();
      }

      logger.info(`Deleting event: ${eventId}`);

      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok && response.status !== 204) {
        const errorText = await response.text();
        throw new Error(`Calendar API error: ${response.status} - ${errorText}`);
      }

      logger.info(`Event deleted: ${eventId}`);
    } catch (error) {
      logger.error('Failed to delete event', error);
      throw error;
    }
  }
}

