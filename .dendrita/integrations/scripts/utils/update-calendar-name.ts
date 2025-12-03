#!/usr/bin/env ts-node
/**
 * Script para actualizar el nombre de un calendario en Google Calendar
 * 
 * Uso:
 *   ts-node update-calendar-name.ts <calendar_id> <new_name>
 * 
 * Ejemplos:
 *   ts-node update-calendar-name.ts user@example.com "💼 Work"
 *   ts-node update-calendar-name.ts primary "💼 Work"
 */

import { CalendarService } from '../services/google/calendar';
import { createLogger } from '../utils/logger';

const logger = createLogger('UpdateCalendarName');

async function main(): Promise<void> {
  try {
    const args = process.argv.slice(2);

    if (args.length < 2) {
      console.error('Usage: ts-node update-calendar-name.ts <calendar_id> <new_name>');
      console.error('');
      console.error('Examples:');
      console.error('  ts-node update-calendar-name.ts user@example.com "💼 Work"');
      console.error('  ts-node update-calendar-name.ts primary "💼 Work"');
      process.exit(1);
    }

    const calendarId = args[0];
    const newName = args[1];

    logger.info(`Updating calendar ${calendarId} to: ${newName}`);

    // Crear servicio de calendario
    const calendar = new CalendarService();

    // Autenticar
    await calendar.authenticate();
    logger.info('✅ Authentication successful');

    // Actualizar nombre del calendario
    const updatedCalendar = await calendar.updateCalendarName(calendarId, newName);

    logger.info(`✅ Calendar name updated successfully!`);
    logger.info(`   ID: ${updatedCalendar.id}`);
    logger.info(`   New name: ${updatedCalendar.summary}`);
  } catch (error) {
    logger.error('❌ Failed to update calendar name', error);
    if (error instanceof Error) {
      logger.error(`   Message: ${error.message}`);
    }
    process.exit(1);
  }
}

// Ejecutar
main();

