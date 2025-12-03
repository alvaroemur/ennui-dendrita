/**
 * Script para generar un reporte detallado del Sheets de proyectos
 */

import { GoogleAuth } from '../services/google/auth';
import { credentials } from '../utils/credentials';
import { createLogger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('GenerateDetailedReport');

const SHEET_ID = '1r-yIuqjZ6FKjDzo4wxakJkoLnpA-lwFYTC6P-P6NwOE';

interface Project {
  Empresa: string;
  Cliente: string;
  Proyecto: string | null;
  Inicio: string;
  Fin: string;
  'Duración (días)': number | string;
  'Duración (meses)': number | string;
  Enfoque: string | null;
  Legado: string | null;
  Carpeta: string | null;
}

async function generateDetailedReport() {
  try {
    if (!credentials.hasGoogleWorkspace()) {
      logger.error('Google Workspace no está configurado');
      return;
    }

    const accessToken = await GoogleAuth.refreshAccessToken();
    logger.info('Autenticado con Google Sheets API');

    // Obtener todos los valores
    const valuesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Proyectos?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`;
    const response = await fetch(valuesUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Sheets API error: ${response.status}`);
    }

    const data = await response.json();
    const values = data.values || [];
    const headers = values[0];
    const rows = values.slice(1);

    const projects: Project[] = rows.map((row: any[]) => {
      const project: any = {};
      headers.forEach((header: string, colIndex: number) => {
        project[header] = row[colIndex] || null;
      });
      return project;
    });

    // Análisis detallado
    const analysis = {
      totalProjects: projects.length,
      companies: {} as Record<string, { count: number; projects: Project[] }>,
      clients: {} as Record<string, { count: number; projects: Project[] }>,
      projectTypes: {} as Record<string, number>,
      dateRange: {
        earliest: null as string | null,
        latest: null as string | null,
      },
      projectsByYear: {} as Record<string, { count: number; projects: Project[] }>,
      projectsByMonth: {} as Record<string, number>,
      durationStats: {
        totalDays: 0,
        totalMonths: 0,
        averageDays: 0,
        averageMonths: 0,
        minDays: Infinity,
        maxDays: 0,
        validDurations: 0,
      },
      timeline: [] as Array<{ year: number; count: number; companies: string[] }>,
    };

    // Procesar cada proyecto
    projects.forEach((project: Project) => {
      // Empresas
      if (project.Empresa) {
        if (!analysis.companies[project.Empresa]) {
          analysis.companies[project.Empresa] = { count: 0, projects: [] };
        }
        analysis.companies[project.Empresa].count++;
        analysis.companies[project.Empresa].projects.push(project);
      }

      // Clientes
      if (project.Cliente) {
        if (!analysis.clients[project.Cliente]) {
          analysis.clients[project.Cliente] = { count: 0, projects: [] };
        }
        analysis.clients[project.Cliente].count++;
        analysis.clients[project.Cliente].projects.push(project);
      }

      // Tipos de proyecto
      if (project.Proyecto) {
        analysis.projectTypes[project.Proyecto] = (analysis.projectTypes[project.Proyecto] || 0) + 1;
      }

      // Fechas
      if (project.Inicio) {
        try {
          const startDate = new Date(project.Inicio);
          if (!isNaN(startDate.getTime())) {
            if (!analysis.dateRange.earliest || startDate < new Date(analysis.dateRange.earliest)) {
              analysis.dateRange.earliest = project.Inicio;
            }
            const year = startDate.getFullYear();
            if (!analysis.projectsByYear[year]) {
              analysis.projectsByYear[year] = { count: 0, projects: [] };
            }
            analysis.projectsByYear[year].count++;
            analysis.projectsByYear[year].projects.push(project);

            const monthKey = `${year}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
            analysis.projectsByMonth[monthKey] = (analysis.projectsByMonth[monthKey] || 0) + 1;
          }
        } catch (e) {
          // Ignorar fechas inválidas
        }
      }

      if (project.Fin) {
        try {
          const endDate = new Date(project.Fin);
          if (!isNaN(endDate.getTime())) {
            if (!analysis.dateRange.latest || endDate > new Date(analysis.dateRange.latest)) {
              analysis.dateRange.latest = project.Fin;
            }
          }
        } catch (e) {
          // Ignorar fechas inválidas
        }
      }

      // Duración
      if (project['Duración (días)'] && typeof project['Duración (días)'] === 'number') {
        const days = project['Duración (días)'];
        analysis.durationStats.totalDays += days;
        analysis.durationStats.validDurations++;
        if (days < analysis.durationStats.minDays) analysis.durationStats.minDays = days;
        if (days > analysis.durationStats.maxDays) analysis.durationStats.maxDays = days;
      }

      if (project['Duración (meses)'] && typeof project['Duración (meses)'] === 'number') {
        analysis.durationStats.totalMonths += project['Duración (meses)'];
      }
    });

    // Calcular promedios
    if (analysis.durationStats.validDurations > 0) {
      analysis.durationStats.averageDays = analysis.durationStats.totalDays / analysis.durationStats.validDurations;
      analysis.durationStats.averageMonths = analysis.durationStats.totalMonths / analysis.durationStats.validDurations;
    }

    // Crear timeline
    Object.entries(analysis.projectsByYear)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([year, data]) => {
        const companies = new Set(data.projects.map(p => p.Empresa).filter(Boolean));
        analysis.timeline.push({
          year: parseInt(year),
          count: data.count,
          companies: Array.from(companies),
        });
      });

    // Generar reporte en Markdown
    const report = generateMarkdownReport(analysis, projects);

    // Guardar reporte
    const outputDir = path.join(process.cwd(), '_temp', 'sheets-analysis');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const reportFile = path.join(outputDir, `reporte-detallado-proyectos-${Date.now()}.md`);
    fs.writeFileSync(reportFile, report);

    logger.info(`\nReporte detallado guardado en: ${reportFile}`);

    // También guardar análisis en JSON
    const analysisFile = path.join(outputDir, `analisis-detallado-${Date.now()}.json`);
    fs.writeFileSync(analysisFile, JSON.stringify(analysis, null, 2));

    console.log(report);

    return { report, analysis };

  } catch (error) {
    logger.error('Error al generar reporte detallado', error);
    throw error;
  }
}

function generateMarkdownReport(analysis: any, projects: Project[]): string {
  const report: string[] = [];

  report.push('# Reporte Detallado: Experiencia Álvaro Mur - Proyectos de Carrera');
  report.push('');
  report.push(`**Generado:** ${new Date().toLocaleString('es-ES')}`);
  report.push(`**Fuente:** [Google Sheets](https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit)`);
  report.push('');
  report.push('---');
  report.push('');

  // Resumen Ejecutivo
  report.push('## 📊 Resumen Ejecutivo');
  report.push('');
  report.push(`- **Total de proyectos:** ${analysis.totalProjects}`);
  report.push(`- **Rango temporal:** ${analysis.dateRange.earliest || 'N/A'} - ${analysis.dateRange.latest || 'N/A'}`);
  report.push(`- **Años de experiencia:** ${analysis.timeline.length > 0 ? analysis.timeline[analysis.timeline.length - 1].year - analysis.timeline[0].year + 1 : 'N/A'}`);
  report.push(`- **Empresas diferentes:** ${Object.keys(analysis.companies).length}`);
  report.push(`- **Clientes diferentes:** ${Object.keys(analysis.clients).length}`);
  report.push(`- **Tipos de proyecto diferentes:** ${Object.keys(analysis.projectTypes).length}`);
  report.push('');

  // Estadísticas de Duración
  report.push('## ⏱️ Estadísticas de Duración');
  report.push('');
  if (analysis.durationStats.validDurations > 0) {
    report.push(`- **Duración total:** ${(analysis.durationStats.totalMonths / 12).toFixed(1)} años (${analysis.durationStats.totalDays.toLocaleString()} días)`);
    report.push(`- **Duración promedio:** ${analysis.durationStats.averageMonths.toFixed(1)} meses (${analysis.durationStats.averageDays.toFixed(0)} días)`);
    report.push(`- **Proyecto más corto:** ${analysis.durationStats.minDays} días`);
    report.push(`- **Proyecto más largo:** ${analysis.durationStats.maxDays} días`);
  } else {
    report.push('- No se encontraron datos de duración válidos');
  }
  report.push('');

  // Análisis por Empresa
  report.push('## 🏢 Análisis por Empresa');
  report.push('');
  const companiesSorted = Object.entries(analysis.companies)
    .sort(([, a], [, b]) => b.count - a.count);

  companiesSorted.forEach(([company, data]: [string, any]) => {
    const percentage = ((data.count / analysis.totalProjects) * 100).toFixed(1);
    report.push(`### ${company}`);
    report.push(`- **Proyectos:** ${data.count} (${percentage}%)`);
    
    // Clientes únicos
    const uniqueClients = new Set(data.projects.map((p: Project) => p.Cliente).filter(Boolean));
    report.push(`- **Clientes únicos:** ${uniqueClients.size}`);
    
    // Rango temporal
    const dates = data.projects
      .map((p: Project) => p.Inicio)
      .filter(Boolean)
      .map((d: string) => new Date(d))
      .filter(d => !isNaN(d.getTime()));
    
    if (dates.length > 0) {
      const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
      const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
      report.push(`- **Período:** ${minDate.getFullYear()} - ${maxDate.getFullYear()}`);
    }
    
    report.push('');
  });
  report.push('');

  // Top Clientes
  report.push('## 👥 Top 20 Clientes');
  report.push('');
  const clientsSorted = Object.entries(analysis.clients)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 20);

  clientsSorted.forEach(([client, data]: [string, any], index) => {
    const percentage = ((data.count / analysis.totalProjects) * 100).toFixed(1);
    report.push(`${index + 1}. **${client}** - ${data.count} proyectos (${percentage}%)`);
    
    // Empresas con las que trabajó
    const companies = new Set(data.projects.map((p: Project) => p.Empresa).filter(Boolean));
    if (companies.size > 0) {
      report.push(`   - Empresas: ${Array.from(companies).join(', ')}`);
    }
    report.push('');
  });
  report.push('');

  // Tipos de Proyecto
  report.push('## 📋 Tipos de Proyecto');
  report.push('');
  const projectTypesSorted = Object.entries(analysis.projectTypes)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 20);

  projectTypesSorted.forEach(([type, count]: [string, number], index) => {
    const percentage = ((count / analysis.totalProjects) * 100).toFixed(1);
    report.push(`${index + 1}. **${type}** - ${count} proyectos (${percentage}%)`);
  });
  report.push('');

  // Timeline por Año
  report.push('## 📅 Evolución Temporal');
  report.push('');
  report.push('### Proyectos por Año');
  report.push('');
  analysis.timeline.forEach(({ year, count, companies }) => {
    const percentage = ((count / analysis.totalProjects) * 100).toFixed(1);
    report.push(`- **${year}:** ${count} proyectos (${percentage}%)`);
    if (companies.length > 0) {
      report.push(`  - Empresas: ${companies.join(', ')}`);
    }
  });
  report.push('');

  // Análisis de Tendencias
  report.push('## 📈 Análisis de Tendencias');
  report.push('');
  
  // Período más activo
  const mostActiveYear = analysis.timeline.reduce((max, item) => 
    item.count > max.count ? item : max, analysis.timeline[0] || { year: 0, count: 0 });
  
  if (mostActiveYear.count > 0) {
    report.push(`- **Año más activo:** ${mostActiveYear.year} con ${mostActiveYear.count} proyectos`);
  }

  // Empresa más activa
  const mostActiveCompany = companiesSorted[0];
  if (mostActiveCompany) {
    report.push(`- **Empresa más activa:** ${mostActiveCompany[0]} con ${mostActiveCompany[1].count} proyectos`);
  }

  // Cliente más frecuente
  const mostFrequentClient = clientsSorted[0];
  if (mostFrequentClient) {
    report.push(`- **Cliente más frecuente:** ${mostFrequentClient[0]} con ${mostFrequentClient[1].count} proyectos`);
  }
  report.push('');

  // Distribución por Mes
  report.push('## 📆 Distribución por Mes');
  report.push('');
  const monthsSorted = Object.entries(analysis.projectsByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 20);

  if (monthsSorted.length > 0) {
    report.push('Top 20 meses con más proyectos iniciados:');
    report.push('');
    monthsSorted.forEach(([month, count]: [string, number], index) => {
      report.push(`${index + 1}. **${month}:** ${count} proyectos`);
    });
  }
  report.push('');

  // Proyectos Recientes
  report.push('## 🆕 Proyectos Recientes');
  report.push('');
  const recentProjects = projects
    .filter(p => p.Inicio)
    .map(p => ({
      ...p,
      startDate: new Date(p.Inicio),
    }))
    .filter(p => !isNaN(p.startDate.getTime()))
    .sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
    .slice(0, 10);

  recentProjects.forEach((project, index) => {
    report.push(`${index + 1}. **${project.Proyecto || 'Sin nombre'}**`);
    report.push(`   - Empresa: ${project.Empresa}`);
    report.push(`   - Cliente: ${project.Cliente}`);
    report.push(`   - Inicio: ${project.Inicio}`);
    report.push(`   - Fin: ${project.Fin || 'En curso'}`);
    if (typeof project['Duración (meses)'] === 'number') {
      report.push(`   - Duración: ${project['Duración (meses)'].toFixed(1)} meses`);
    }
    report.push('');
  });
  report.push('');

  // Conclusiones
  report.push('## 💡 Conclusiones');
  report.push('');
  report.push('### Puntos Destacados:');
  report.push('');
  report.push(`1. **Experiencia diversa:** ${analysis.totalProjects} proyectos en ${Object.keys(analysis.companies).length} empresas diferentes`);
  report.push(`2. **Alcance amplio:** Trabajo con ${Object.keys(analysis.clients).length} clientes diferentes`);
  report.push(`3. **Evolución profesional:** Transición de consultoría tradicional (PwC) a impacto social e innovación (CreativeLab)`);
  
  if (mostActiveCompany) {
    report.push(`4. **Enfoque actual:** Mayor actividad en ${mostActiveCompany[0]} con ${mostActiveCompany[1].count} proyectos`);
  }
  
  report.push(`5. **Duración promedio:** ${analysis.durationStats.averageMonths.toFixed(1)} meses por proyecto`);
  report.push('');

  report.push('---');
  report.push('');
  report.push(`*Reporte generado automáticamente el ${new Date().toLocaleString('es-ES')}*`);
  report.push('');

  return report.join('\n');
}

if (require.main === module) {
  generateDetailedReport()
    .then(() => {
      logger.info('\nReporte generado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Error fatal', error);
      process.exit(1);
    });
}

export { generateDetailedReport };

