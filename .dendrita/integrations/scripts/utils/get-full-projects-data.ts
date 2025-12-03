/**
 * Script para obtener todos los datos del Sheets de proyectos
 */

import { GoogleAuth } from '../services/google/auth';
import { credentials } from '../utils/credentials';
import { createLogger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('GetFullProjectsData');

const SHEET_ID = '1r-yIuqjZ6FKjDzo4wxakJkoLnpA-lwFYTC6P-P6NwOE';

async function getFullProjectsData() {
  try {
    if (!credentials.hasGoogleWorkspace()) {
      logger.error('Google Workspace no está configurado');
      return;
    }

    const accessToken = await GoogleAuth.refreshAccessToken();
    logger.info('Autenticado con Google Sheets API');

    // Obtener todos los valores de la hoja "Proyectos"
    const valuesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Proyectos?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`;
    const response = await fetch(valuesUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Sheets API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const values = data.values || [];

    if (values.length === 0) {
      logger.warn('No se encontraron datos en la hoja "Proyectos"');
      return;
    }

    const headers = values[0];
    const rows = values.slice(1);

    logger.info(`Headers: ${headers.length}`);
    logger.info(`Filas de datos: ${rows.length}`);

    // Procesar datos
    const projects = rows.map((row: any[], index: number) => {
      const project: any = {};
      headers.forEach((header: string, colIndex: number) => {
        project[header] = row[colIndex] || null;
      });
      return project;
    });

    // Análisis
    const analysis = {
      totalProjects: projects.length,
      companies: {} as Record<string, number>,
      clients: {} as Record<string, number>,
      dateRange: {
        earliest: null as string | null,
        latest: null as string | null,
      },
      totalDuration: {
        days: 0,
        months: 0,
      },
      projectsByYear: {} as Record<string, number>,
    };

    projects.forEach((project: any) => {
      // Empresas
      if (project.Empresa) {
        analysis.companies[project.Empresa] = (analysis.companies[project.Empresa] || 0) + 1;
      }

      // Clientes
      if (project.Cliente) {
        analysis.clients[project.Cliente] = (analysis.clients[project.Cliente] || 0) + 1;
      }

      // Fechas
      if (project.Inicio) {
        const startDate = new Date(project.Inicio);
        if (!analysis.dateRange.earliest || startDate < new Date(analysis.dateRange.earliest)) {
          analysis.dateRange.earliest = project.Inicio;
        }
      }
      if (project.Fin) {
        const endDate = new Date(project.Fin);
        if (!analysis.dateRange.latest || endDate > new Date(analysis.dateRange.latest)) {
          analysis.dateRange.latest = project.Fin;
        }
      }

      // Duración
      if (project['Duración (días)']) {
        analysis.totalDuration.days += project['Duración (días)'] || 0;
      }
      if (project['Duración (meses)']) {
        analysis.totalDuration.months += project['Duración (meses)'] || 0;
      }

      // Por año
      if (project.Inicio) {
        const year = new Date(project.Inicio).getFullYear();
        analysis.projectsByYear[year] = (analysis.projectsByYear[year] || 0) + 1;
      }
    });

    // Guardar datos completos
    const outputDir = path.join(process.cwd(), '_temp', 'sheets-analysis');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fullDataFile = path.join(outputDir, `proyectos-completos-${Date.now()}.json`);
    fs.writeFileSync(fullDataFile, JSON.stringify({ projects, analysis }, null, 2));

    logger.info(`\nDatos completos guardados en: ${fullDataFile}`);

    // Mostrar análisis
    console.log('\n=== ANÁLISIS COMPLETO DEL SHEETS DE PROYECTOS ===\n');
    console.log(`Total de proyectos: ${analysis.totalProjects}`);
    console.log(`\nRango de fechas:`);
    console.log(`  Inicio más temprano: ${analysis.dateRange.earliest}`);
    console.log(`  Fin más reciente: ${analysis.dateRange.latest}`);
    console.log(`\nDuración total:`);
    console.log(`  Días: ${analysis.totalDuration.days.toLocaleString()}`);
    console.log(`  Meses: ${(analysis.totalDuration.months / 12).toFixed(1)} años`);
    console.log(`\nProyectos por empresa:`);
    Object.entries(analysis.companies)
      .sort(([, a], [, b]) => b - a)
      .forEach(([company, count]) => {
        console.log(`  ${company}: ${count}`);
      });
    console.log(`\nTop 10 clientes:`);
    Object.entries(analysis.clients)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .forEach(([client, count]) => {
        console.log(`  ${client}: ${count}`);
      });
    console.log(`\nProyectos por año:`);
    Object.entries(analysis.projectsByYear)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([year, count]) => {
        console.log(`  ${year}: ${count}`);
      });

    return { projects, analysis };

  } catch (error) {
    logger.error('Error al obtener datos completos', error);
    throw error;
  }
}

if (require.main === module) {
  getFullProjectsData()
    .then(() => {
      logger.info('\nProceso completado');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Error fatal', error);
      process.exit(1);
    });
}

export { getFullProjectsData };

