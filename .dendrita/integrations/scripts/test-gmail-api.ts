/**
 * Script de prueba rápida para verificar Gmail API
 * Prueba con una búsqueda simple primero
 */

import { GmailService } from '../services/google/gmail';
import { credentials } from '../utils/credentials';
import { createLogger } from '../utils/logger';

const logger = createLogger('TestGmailAPI');

async function testGmailAPI(): Promise<void> {
  try {
    logger.info('🔍 Verificando configuración...');

    if (!credentials.hasGoogleWorkspace()) {
      logger.error('❌ Google Workspace no está configurado');
      process.exit(1);
    }

    logger.info('✅ Google Workspace configurado');
    
    const gmail = new GmailService();
    await gmail.authenticate();
    logger.info('✅ Autenticación exitosa');

    // Prueba 1: Búsqueda simple (sin filtros de fecha)
    logger.info('\n📧 Prueba 1: Búsqueda simple "in:inbox" (últimos 3)...');
    try {
      const simpleEmails = await gmail.searchEmails('in:inbox', 3);
      logger.info(`✅ Éxito: ${simpleEmails.length} email(s) encontrados`);
      if (simpleEmails.length > 0) {
        logger.info(`   Ejemplo: ${simpleEmails[0].subject}`);
      }
    } catch (error) {
      logger.error('❌ Error en búsqueda simple:', error);
    }

    // Prueba 2: Búsqueda con fecha (como la que usamos)
    logger.info('\n📧 Prueba 2: Búsqueda con fecha "after:2025-01-01" (últimos 3)...');
    try {
      const datedEmails = await gmail.searchEmails('after:2025-01-01', 3);
      logger.info(`✅ Éxito: ${datedEmails.length} email(s) encontrados`);
      if (datedEmails.length > 0) {
        logger.info(`   Ejemplo: ${datedEmails[0].subject}`);
      }
    } catch (error) {
      logger.error('❌ Error en búsqueda con fecha:', error);
    }

    // Prueba 3: Búsqueda específica de Inspiro
    logger.info('\n📧 Prueba 3: Búsqueda "Inspiro after:2025-01-01" (últimos 3)...');
    try {
      const inspiroEmails = await gmail.searchEmails('Inspiro after:2025-01-01', 3);
      logger.info(`✅ Éxito: ${inspiroEmails.length} email(s) encontrados`);
      if (inspiroEmails.length > 0) {
        logger.info(`   Ejemplo: ${inspiroEmails[0].subject}`);
        logger.info(`   De: ${inspiroEmails[0].from}`);
      }
    } catch (error) {
      logger.error('❌ Error en búsqueda de Inspiro:', error);
    }

    // Prueba 4: Búsqueda por email
    logger.info('\n📧 Prueba 4: Búsqueda "from:arturo@inspiro.pe after:2025-01-01" (últimos 3)...');
    try {
      const fromEmails = await gmail.searchEmails('from:arturo@inspiro.pe after:2025-01-01', 3);
      logger.info(`✅ Éxito: ${fromEmails.length} email(s) encontrados`);
      if (fromEmails.length > 0) {
        logger.info(`   Ejemplo: ${fromEmails[0].subject}`);
      }
    } catch (error) {
      logger.error('❌ Error en búsqueda por email:', error);
    }

    logger.info('\n✅ Pruebas completadas');

  } catch (error) {
    logger.error('❌ Error fatal:', error);
    if (error instanceof Error) {
      logger.error(`   Mensaje: ${error.message}`);
      if (error.message.includes('403')) {
        logger.error('\n⚠️  Error 403: La Gmail API podría no estar habilitada');
        logger.error('   URL para habilitar: https://console.developers.google.com/apis/api/gmail.googleapis.com/overview?project=566537967461');
      }
    }
    process.exit(1);
  }
}

testGmailAPI();

