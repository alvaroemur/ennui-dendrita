/**
 * Script para analizar el Sheets de proyectos de carrera
 */

import { GoogleAuth } from '../services/google/auth';
import { credentials } from '../utils/credentials';
import { createLogger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('AnalyzeProjectsSheet');

const SHEET_ID = '1r-yIuqjZ6FKjDzo4wxakJkoLnpA-lwFYTC6P-P6NwOE';

interface SheetData {
  title: string;
  values: any[][];
  rowCount: number;
  columnCount: number;
}

interface SpreadsheetMetadata {
  title: string;
  sheets: Array<{
    properties: {
      title: string;
      sheetId: number;
      gridProperties?: {
        rowCount: number;
        columnCount: number;
      };
    };
  }>;
}

async function analyzeProjectsSheet() {
  try {
    // Verificar que Google está configurado
    if (!credentials.hasGoogleWorkspace()) {
      logger.error('Google Workspace no está configurado. Ver: .dendrita/docs/integrations/SETUP.md');
      return;
    }

    // Autenticar
    const accessToken = await GoogleAuth.refreshAccessToken();
    logger.info('Autenticado con Google Sheets API');

    // Obtener metadata del spreadsheet
    logger.info('Obteniendo metadata del spreadsheet...');
    const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?fields=properties.title,sheets.properties`;
    const metadataResponse = await fetch(metadataUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!metadataResponse.ok) {
      const errorText = await metadataResponse.text();
      throw new Error(`Sheets API error: ${metadataResponse.status} - ${errorText}`);
    }

    const metadata: SpreadsheetMetadata = await metadataResponse.json();
    logger.info(`Spreadsheet: "${metadata.title}"`);
    logger.info(`Hojas encontradas: ${metadata.sheets.length}`);

    // Analizar cada hoja
    const sheetsData: SheetData[] = [];

    for (const sheet of metadata.sheets) {
      const sheetTitle = sheet.properties.title;
      const sheetId = sheet.properties.sheetId;
      const rowCount = sheet.properties.gridProperties?.rowCount || 0;
      const columnCount = sheet.properties.gridProperties?.columnCount || 0;

      logger.info(`\nAnalizando hoja: "${sheetTitle}" (ID: ${sheetId})`);
      logger.info(`Dimensiones: ${rowCount} filas x ${columnCount} columnas`);

      // Obtener valores de la hoja
      const valuesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(sheetTitle)}?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`;
      const valuesResponse = await fetch(valuesUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!valuesResponse.ok) {
        logger.warn(`No se pudo obtener valores de la hoja "${sheetTitle}"`);
        continue;
      }

      const valuesData = await valuesResponse.json();
      const values = valuesData.values || [];

      logger.info(`Filas con datos: ${values.length}`);

      // Analizar estructura
      if (values.length > 0) {
        const headers = values[0];
        logger.info(`Columnas detectadas: ${headers.length}`);
        logger.info(`Headers: ${headers.slice(0, 10).join(' | ')}${headers.length > 10 ? '...' : ''}`);

        // Contar filas no vacías
        const nonEmptyRows = values.filter(row => row.some(cell => cell !== null && cell !== ''));
        logger.info(`Filas no vacías: ${nonEmptyRows.length}`);

        sheetsData.push({
          title: sheetTitle,
          values,
          rowCount: values.length,
          columnCount: headers.length,
        });
      }
    }

    // Generar análisis
    logger.info('\n\n=== ANÁLISIS COMPLETO ===\n');

    // Guardar datos en JSON para análisis posterior
    const outputDir = path.join(process.cwd(), '_temp', 'sheets-analysis');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFile = path.join(outputDir, `experiencia-alvaro-mur-${Date.now()}.json`);
    const analysisData = {
      spreadsheetId: SHEET_ID,
      spreadsheetTitle: metadata.title,
      analyzedAt: new Date().toISOString(),
      sheets: sheetsData.map(sheet => ({
        title: sheet.title,
        rowCount: sheet.rowCount,
        columnCount: sheet.columnCount,
        headers: sheet.values[0] || [],
        sampleRows: sheet.values.slice(1, 6), // Primeras 5 filas de datos
        totalRows: sheet.values.length,
      })),
    };

    fs.writeFileSync(outputFile, JSON.stringify(analysisData, null, 2));
    logger.info(`\nDatos guardados en: ${outputFile}`);

    // Mostrar resumen
    console.log('\n=== RESUMEN ===');
    console.log(`Spreadsheet: "${metadata.title}"`);
    console.log(`ID: ${SHEET_ID}`);
    console.log(`Enlace: https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`);
    console.log(`\nHojas analizadas: ${sheetsData.length}`);

    sheetsData.forEach((sheet, index) => {
      console.log(`\n${index + 1}. ${sheet.title}`);
      console.log(`   Filas: ${sheet.rowCount}`);
      console.log(`   Columnas: ${sheet.columnCount}`);
      if (sheet.values.length > 0) {
        console.log(`   Headers: ${sheet.values[0].slice(0, 5).join(', ')}${sheet.values[0].length > 5 ? '...' : ''}`);
      }
    });

    // Mostrar preview de la primera hoja
    if (sheetsData.length > 0) {
      const firstSheet = sheetsData[0];
      console.log(`\n\n=== PREVIEW: ${firstSheet.title} ===`);
      
      if (firstSheet.values.length > 0) {
        // Mostrar headers
        console.log('\nHeaders:');
        console.log(firstSheet.values[0].map((h, i) => `${i + 1}. ${h || '(vacío)'}`).join('\n'));
        
        // Mostrar primeras filas de datos
        console.log('\nPrimeras filas de datos:');
        const previewRows = Math.min(5, firstSheet.values.length - 1);
        for (let i = 1; i <= previewRows; i++) {
          console.log(`\nFila ${i}:`);
          firstSheet.values[0].forEach((header, colIndex) => {
            const value = firstSheet.values[i]?.[colIndex] || '(vacío)';
            console.log(`  ${header}: ${value}`);
          });
        }
      }
    }

    return analysisData;

  } catch (error) {
    logger.error('Error al analizar el Sheets', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  analyzeProjectsSheet()
    .then(() => {
      logger.info('\nAnálisis completado');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Error fatal', error);
      process.exit(1);
    });
}

export { analyzeProjectsSheet };

