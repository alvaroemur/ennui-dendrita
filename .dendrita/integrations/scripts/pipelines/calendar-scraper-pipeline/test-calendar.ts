/**
 * Script de prueba para conectar con Google Calendar
 */

import { CalendarService } from '../../services/google/calendar';
import { credentials } from '../../utils/credentials';
import { createLogger } from '../../utils/logger';

const logger = createLogger('TestCalendar');

async function testCalendarConnection(): Promise<void> {
  try {
    logger.info('🔍 Verificando configuración de Google Workspace...');

    // Verificar si está configurado
    if (!credentials.hasGoogleWorkspace()) {
      logger.error('❌ Google Workspace no está configurado');
      logger.info('📖 Por favor, sigue la guía en: .dendrita/integrations/hooks/google-auth-flow.md');
      logger.info('💡 Necesitas configurar:');
      logger.info('   - GOOGLE_WORKSPACE_CLIENT_ID');
      logger.info('   - GOOGLE_WORKSPACE_CLIENT_SECRET');
      logger.info('   - GOOGLE_WORKSPACE_REFRESH_TOKEN');
      logger.info('   en el archivo .dendrita/.env.local');
      process.exit(1);
    }

    logger.info('✅ Google Workspace está configurado');
    logger.info('🔗 Conectando con Google Calendar...');

    // Crear servicio de calendario
    const calendar = new CalendarService();

    // Autenticar
    await calendar.authenticate();
    logger.info('✅ Autenticación exitosa');

    // Listar calendarios
    logger.info('📅 Listando calendarios...');
    const calendars = await calendar.listCalendars();

    if (calendars.length === 0) {
      logger.warn('⚠️ No se encontraron calendarios');
    } else {
      logger.info(`✅ Se encontraron ${calendars.length} calendario(s):`);
      calendars.forEach((cal, index) => {
        logger.info(`   ${index + 1}. ${cal.summary} (ID: ${cal.id})`);
        if (cal.description) {
          logger.info(`      Descripción: ${cal.description}`);
        }
      });
    }

    // Obtener calendario principal
    logger.info('\n📆 Obteniendo calendario principal...');
    const primary = await calendar.getPrimaryCalendar();
    logger.info(`✅ Calendario principal: ${primary.summary}`);

    // Listar eventos próximos (próximos 7 días)
    logger.info('\n📅 Obteniendo eventos próximos (próximos 7 días)...');
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const events = await calendar.listEvents('primary', {
      timeMin: now.toISOString(),
      timeMax: nextWeek.toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });

    if (events.length === 0) {
      logger.info('ℹ️ No hay eventos en los próximos 7 días');
    } else {
      logger.info(`✅ Se encontraron ${events.length} evento(s) próximos:`);
      events.forEach((event, index) => {
        const start = event.start.dateTime || event.start.date;
        logger.info(`   ${index + 1}. ${event.summary}`);
        logger.info(`      Inicio: ${start}`);
        if (event.location) {
          logger.info(`      Ubicación: ${event.location}`);
        }
        if (event.description) {
          const desc = event.description.substring(0, 50);
          logger.info(`      Descripción: ${desc}${event.description.length > 50 ? '...' : ''}`);
        }
      });
    }

    logger.info('\n✅ Conexión con Google Calendar exitosa!');
  } catch (error) {
    logger.error('❌ Error al conectar con Google Calendar', error);
    if (error instanceof Error) {
      logger.error(`   Mensaje: ${error.message}`);
    }
    process.exit(1);
  }
}

// Ejecutar
testCalendarConnection();

