#!/usr/bin/env npx ts-node
/**
 * Script temporal para hacer scraping de la hoja "📅 Eventos" de Google Sheets
 * Simula la conexión al sistema para obtener eventos de calendario
 */

import { GoogleAuth } from '../../services/google/auth';
import { credentials } from '../../utils/credentials';
import { createLogger } from '../../utils/logger';

const logger = createLogger('ScrapeCalendarEventsSheet');

// ID del spreadsheet desde la URL
const SPREADSHEET_ID = '1oLSE99x_ysL2MpvzDmtMgzTCu7jQ4j4cREaFakVfljc';
const SHEET_NAME = '📅 Eventos';

interface CalendarEvent {
  [key: string]: any;
}

/**
 * Obtiene los datos de la hoja "📅 Eventos"
 */
async function scrapeCalendarEventsSheet(): Promise<CalendarEvent[]> {
  try {
    if (!credentials.hasGoogleWorkspace()) {
      logger.error('Google Workspace no está configurado');
      throw new Error('Google Workspace credentials not configured');
    }

    logger.info('Autenticando con Google Sheets API...');
    const accessToken = await GoogleAuth.refreshAccessToken();
    logger.info('Autenticación exitosa');

    // Obtener todos los valores de la hoja "📅 Eventos"
    // Usar encodeURIComponent para manejar el emoji en el nombre de la hoja
    const encodedSheetName = encodeURIComponent(SHEET_NAME);
    const valuesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodedSheetName}?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`;
    
    logger.info(`Obteniendo datos de la hoja "${SHEET_NAME}"...`);
    logger.debug(`URL: ${valuesUrl}`);
    
    const response = await fetch(valuesUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Error de Google Sheets API: ${response.status} - ${errorText}`);
      throw new Error(`Sheets API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const values = data.values || [];

    if (values.length === 0) {
      logger.warn(`No se encontraron datos en la hoja "${SHEET_NAME}"`);
      return [];
    }

    logger.info(`Datos obtenidos: ${values.length} filas`);

    // Primera fila son los headers
    const headers = values[0];
    const rows = values.slice(1);

    logger.info(`Headers encontrados: ${headers.length}`);
    logger.info(`Filas de datos: ${rows.length}`);

    // Mostrar headers
    console.log('\n📋 Headers encontrados:');
    console.log('─'.repeat(80));
    headers.forEach((header: string, index: number) => {
      console.log(`  ${index + 1}. ${header}`);
    });

    // Procesar datos
    const events: CalendarEvent[] = rows
      .filter((row: any[]) => row.some((cell: any) => cell !== null && cell !== '')) // Filtrar filas vacías
      .map((row: any[], rowIndex: number) => {
        const event: CalendarEvent = {};
        headers.forEach((header: string, colIndex: number) => {
          event[header] = row[colIndex] || null;
        });
        return event;
      });

    logger.info(`Eventos procesados: ${events.length}`);

    // Mostrar resumen
    console.log('\n📊 Resumen:');
    console.log('─'.repeat(80));
    console.log(`  Total de filas: ${values.length}`);
    console.log(`  Headers: ${headers.length}`);
    console.log(`  Filas de datos: ${rows.length}`);
    console.log(`  Eventos válidos: ${events.length}`);

    // Mostrar primeros eventos como ejemplo
    if (events.length > 0) {
      console.log('\n📄 Primeros eventos (ejemplo):');
      console.log('─'.repeat(80));
      
      const examplesToShow = Math.min(3, events.length);
      for (let i = 0; i < examplesToShow; i++) {
        console.log(`\n  Evento ${i + 1}:`);
        const event = events[i];
        Object.entries(event).forEach(([key, value]) => {
          if (value !== null && value !== '') {
            const displayValue = typeof value === 'string' && value.length > 100 
              ? value.substring(0, 100) + '...' 
              : value;
            console.log(`    ${key}: ${displayValue}`);
          }
        });
      }
    }

    return events;
  } catch (error: any) {
    logger.error('Error al hacer scraping de la hoja', error);
    throw error;
  }
}

/**
 * Función principal
 */
async function main(): Promise<void> {
  logger.info('=== Scraping Temporal de Hoja "📅 Eventos" ===\n');
  logger.info(`Spreadsheet ID: ${SPREADSHEET_ID}`);
  logger.info(`Sheet Name: ${SHEET_NAME}\n`);

  try {
    const events = await scrapeCalendarEventsSheet();
    
    console.log('\n✅ Scraping completado exitosamente');
    console.log(`   Total de eventos obtenidos: ${events.length}\n`);

    // Opcional: guardar en archivo JSON
    if (events.length > 0) {
      const outputPath = '_temp/calendar-scrapes/calendar-events-scrape.json';
      const fs = require('fs');
      const path = require('path');
      
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(outputPath, JSON.stringify(events, null, 2), 'utf-8');
      logger.info(`Datos guardados en: ${outputPath}`);
    }

  } catch (error: any) {
    logger.error('Error en scraping', error);
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch((error) => {
    logger.error('Fatal error', error);
    process.exit(1);
  });
}

export { scrapeCalendarEventsSheet };

