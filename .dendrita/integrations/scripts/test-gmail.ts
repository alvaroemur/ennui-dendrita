/**
 * Script de prueba para conectar con Gmail
 */

import { GmailService } from '../services/google/gmail';
import { credentials } from '../utils/credentials';
import { createLogger } from '../utils/logger';

const logger = createLogger('TestGmail');

async function testGmailConnection(): Promise<void> {
  try {
    logger.info('🔍 Verificando configuración de Google Workspace...');

    if (!credentials.hasGoogleWorkspace()) {
      logger.error('❌ Google Workspace no está configurado');
      logger.info('📖 Por favor, sigue la guía en: .dendrita/integrations/hooks/google-auth-flow.md');
      process.exit(1);
    }

    logger.info('✅ Google Workspace está configurado');
    logger.info('🔗 Conectando con Gmail...');

    const gmail = new GmailService();
    await gmail.authenticate();
    logger.info('✅ Autenticación exitosa');

    // Buscar emails recientes
    logger.info('\n📧 Buscando emails recientes (últimos 5)...');
    const recentEmails = await gmail.searchEmails('in:inbox', 5);

    if (recentEmails.length === 0) {
      logger.info('ℹ️ No se encontraron emails en la bandeja de entrada');
    } else {
      logger.info(`✅ Se encontraron ${recentEmails.length} email(s):`);
      recentEmails.forEach((email, index) => {
        logger.info(`   ${index + 1}. ${email.subject}`);
        logger.info(`      De: ${email.from}`);
        logger.info(`      Fecha: ${email.date.toLocaleString()}`);
        if (email.body) {
          const preview = email.body.substring(0, 100);
          logger.info(`      Vista previa: ${preview}${email.body.length > 100 ? '...' : ''}`);
        }
      });
    }

    // Buscar emails de hoy
    logger.info('\n📧 Buscando emails de hoy...');
    const today = new Date().toISOString().split('T')[0];
    const todayEmails = await gmail.searchEmails(`after:${today}`, 5);
    logger.info(`✅ Se encontraron ${todayEmails.length} email(s) de hoy`);

    logger.info('\n✅ Conexión con Gmail exitosa!');
  } catch (error) {
    logger.error('❌ Error al conectar con Gmail', error);
    if (error instanceof Error) {
      logger.error(`   Mensaje: ${error.message}`);
    }
    process.exit(1);
  }
}

// Ejecutar
testGmailConnection();

