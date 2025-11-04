/**
 * EJEMPLO: Usar Google Workspace desde dendrita
 * 
 * Este archivo muestra cómo usar los servicios de Google
 * sin exponer ningún dato sensible del sistema
 */

import { GmailService } from '../services/google/gmail';
import { CalendarService } from '../services/google/calendar';
import { DriveService } from '../services/google/drive';
import { credentials } from '../utils/credentials';
import { createLogger } from '../utils/logger';

const logger = createLogger('GoogleWorkspaceExample');

/**
 * Ejemplo 1: Verificar si Google está configurado
 */
async function checkGoogleSetup(): Promise<void> {
  logger.info('Checking Google Workspace setup...');

  const available = credentials.getAvailableServices();
  logger.info(`Available services: ${available.join(', ')}`);

  if (!credentials.hasGoogleWorkspace()) {
    logger.warn('Google Workspace not configured. See hooks/google-auth-flow.md');
    return;
  }

  logger.info('✅ Google Workspace is configured and ready');
}

/**
 * Ejemplo 2: Buscar emails
 */
async function searchRecentEmails(): Promise<void> {
  try {
    const gmail = new GmailService();

    if (!gmail.isConfigured()) {
      logger.error('Gmail not configured');
      return;
    }

    await gmail.authenticate();

    // Busca emails de los últimos 7 días de un dominio específico
    const query = 'after:2024-01-01';
    const emails = await gmail.searchEmails(query, 5);

    logger.info(`Found ${emails.length} recent emails`);

    // Nota: La implementación completa mostraría detalles
    // sin exponer información personal del usuario
    for (const email of emails) {
      logger.info(`- From: [SENDER], Subject: [SUBJECT_PARTIAL]`);
    }
  } catch (error) {
    logger.error('Failed to search emails', error);
  }
}

/**
 * Ejemplo 3: Enviar email
 */
async function sendNotificationEmail(recipient: string): Promise<void> {
  try {
    const gmail = new GmailService();
    await gmail.authenticate();

    await gmail.sendEmail(
      [recipient],
      'Notificación de Dendrita',
      'Este es un email de prueba desde la integración de dendrita.'
    );

    logger.info('Email sent successfully');
  } catch (error) {
    logger.error('Failed to send email', error);
  }
}

/**
 * Ejemplo 4: Usar varios servicios
 */
async function multipleServiceExample(): Promise<void> {
  logger.info('Running multiple services example...');

  // Verificar disponibilidad
  const services = credentials.getAvailableServices();

  if (services.includes('Google Workspace')) {
    logger.info('✅ Using Google Workspace services');

    const gmail = new GmailService();
    if (gmail.isConfigured()) {
      logger.info('Gmail is ready to use');
    }

    const calendar = new CalendarService();
    if (calendar.isConfigured()) {
      logger.info('Calendar is ready to use');
    }

    const drive = new DriveService();
    if (drive.isConfigured()) {
      logger.info('Drive is ready to use');
    }
  }

  if (services.includes('OpenAI')) {
    logger.info('✅ Using OpenAI service');
    // Aquí usarías OpenAI
  }
}

/**
 * Ejemplo 5: Usar Google Calendar
 */
async function calendarExample(): Promise<void> {
  try {
    const calendar = new CalendarService();
    await calendar.authenticate();

    // Listar calendarios
    const calendars = await calendar.listCalendars();
    logger.info(`Found ${calendars.length} calendars`);

    // Crear un evento
    const event = await calendar.createEvent('primary', {
      summary: 'Reunión de prueba',
      description: 'Evento de prueba desde dendrita',
      start: {
        dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        timeZone: 'America/Lima',
      },
      end: {
        dateTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
        timeZone: 'America/Lima',
      },
    });

    logger.info(`Event created: ${event.id}`);
  } catch (error) {
    logger.error('Failed to use calendar', error);
  }
}

/**
 * Ejemplo 6: Usar Google Drive
 */
async function driveExample(): Promise<void> {
  try {
    const drive = new DriveService();
    await drive.authenticate();

    // Listar archivos
    const files = await drive.listFiles({ pageSize: 10 });
    logger.info(`Found ${files.files.length} files`);

    // Buscar archivos PDF
    const pdfFiles = await drive.searchFiles("mimeType = 'application/pdf'", { pageSize: 5 });
    logger.info(`Found ${pdfFiles.files.length} PDF files`);
  } catch (error) {
    logger.error('Failed to use drive', error);
  }
}

// Export para uso desde otros módulos
export { checkGoogleSetup, searchRecentEmails, sendNotificationEmail, calendarExample, driveExample };

// Si se ejecuta directamente:
if (require.main === module) {
  (async () => {
    await checkGoogleSetup();
    await multipleServiceExample();
    // Descomentar para probar otros ejemplos:
    // await calendarExample();
    // await driveExample();
  })().catch(logger.error);
}
