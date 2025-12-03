/**
 * Script para sincronizar información de experiencia profesional desde Google Sheets
 * Actualiza los documentos del proyecto experiencia-carrera con datos del Sheets
 */

import { GoogleAuth } from '../../services/google/auth';
import { credentials } from '../../utils/credentials';
import { createLogger } from '../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('SyncExperienceFromSheets');

const SHEET_ID = '1r-yIuqjZ6FKjDzo4wxakJkoLnpA-lwFYTC6P-P6NwOE';
const SHEET_NAME = 'Proyectos';
const PROJECT_DIR = path.join(process.cwd(), 'workspaces', 'personal', 'active-projects', 'experiencia-carrera');

interface Project {
  Empresa: string;
  Cliente: string;
  Proyecto: string | null;
  Inicio: string;
  Fin: string;
  'Duración (días)': number;
  'Duración (meses)': number;
  Enfoque?: string;
  Legado?: string;
  Carpeta?: string;
}

interface Analysis {
  totalProjects: number;
  companies: Record<string, {
    count: number;
    clients: Set<string>;
    period: { start: string | null; end: string | null };
  }>;
  clients: Record<string, number>;
  dateRange: { earliest: string | null; latest: string | null };
  totalDuration: { days: number; months: number };
  projectsByYear: Record<string, number>;
  projectTypes: Record<string, number>;
}

async function syncExperienceFromSheets() {
  try {
    if (!credentials.hasGoogleWorkspace()) {
      logger.error('Google Workspace no está configurado');
      return;
    }

    const accessToken = await GoogleAuth.refreshAccessToken();
    logger.info('Autenticado con Google Sheets API');

    // Obtener todos los valores de la hoja "Proyectos"
    const valuesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`;
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
    const projects: Project[] = rows.map((row: any[]) => {
      const project: any = {};
      headers.forEach((header: string, colIndex: number) => {
        project[header] = row[colIndex] || null;
      });
      return project;
    }).filter((p: Project) => p.Empresa && p.Inicio); // Filtrar proyectos válidos

    // Análisis
    const analysis: Analysis = {
      totalProjects: projects.length,
      companies: {},
      clients: {},
      dateRange: {
        earliest: null,
        latest: null,
      },
      totalDuration: {
        days: 0,
        months: 0,
      },
      projectsByYear: {},
      projectTypes: {},
    };

    projects.forEach((project: Project) => {
      // Empresas
      if (project.Empresa) {
        if (!analysis.companies[project.Empresa]) {
          analysis.companies[project.Empresa] = {
            count: 0,
            clients: new Set(),
            period: { start: null, end: null },
          };
        }
        analysis.companies[project.Empresa].count++;
        if (project.Cliente) {
          analysis.companies[project.Empresa].clients.add(project.Cliente);
        }
        
        // Período (validar fechas)
        if (project.Inicio && typeof project.Inicio === 'string' && !project.Inicio.includes('#NUM!')) {
          const startDate = new Date(project.Inicio);
          if (!isNaN(startDate.getTime()) && startDate.getFullYear() > 1900 && startDate.getFullYear() < 2100) {
            if (!analysis.companies[project.Empresa].period.start || startDate < new Date(analysis.companies[project.Empresa].period.start)) {
              analysis.companies[project.Empresa].period.start = project.Inicio;
            }
          }
        }
        if (project.Fin && typeof project.Fin === 'string' && !project.Fin.includes('#NUM!')) {
          const endDate = new Date(project.Fin);
          if (!isNaN(endDate.getTime()) && endDate.getFullYear() > 1900 && endDate.getFullYear() < 2100) {
            if (!analysis.companies[project.Empresa].period.end || endDate > new Date(analysis.companies[project.Empresa].period.end)) {
              analysis.companies[project.Empresa].period.end = project.Fin;
            }
          }
        }
      }

      // Clientes
      if (project.Cliente) {
        analysis.clients[project.Cliente] = (analysis.clients[project.Cliente] || 0) + 1;
      }

      // Fechas (validar que sean fechas válidas)
      if (project.Inicio && typeof project.Inicio === 'string' && !project.Inicio.includes('#NUM!')) {
        const startDate = new Date(project.Inicio);
        if (!isNaN(startDate.getTime()) && startDate.getFullYear() > 1900 && startDate.getFullYear() < 2100) {
          if (!analysis.dateRange.earliest || startDate < new Date(analysis.dateRange.earliest)) {
            analysis.dateRange.earliest = project.Inicio;
          }
        }
      }
      if (project.Fin && typeof project.Fin === 'string' && !project.Fin.includes('#NUM!')) {
        const endDate = new Date(project.Fin);
        if (!isNaN(endDate.getTime()) && endDate.getFullYear() > 1900 && endDate.getFullYear() < 2100) {
          if (!analysis.dateRange.latest || endDate > new Date(analysis.dateRange.latest)) {
            analysis.dateRange.latest = project.Fin;
          }
        }
      }

      // Duración (filtrar valores inválidos como #NUM!)
      if (project['Duración (días)'] && typeof project['Duración (días)'] === 'number' && !isNaN(project['Duración (días)'])) {
        analysis.totalDuration.days += project['Duración (días)'];
      }
      if (project['Duración (meses)'] && typeof project['Duración (meses)'] === 'number' && !isNaN(project['Duración (meses)'])) {
        analysis.totalDuration.months += project['Duración (meses)'];
      }

      // Por año (validar fecha)
      if (project.Inicio && typeof project.Inicio === 'string' && !project.Inicio.includes('#NUM!')) {
        const startDate = new Date(project.Inicio);
        if (!isNaN(startDate.getTime()) && startDate.getFullYear() > 1900 && startDate.getFullYear() < 2100) {
          const year = startDate.getFullYear().toString();
          analysis.projectsByYear[year] = (analysis.projectsByYear[year] || 0) + 1;
        }
      }

      // Tipos de proyecto
      if (project.Proyecto) {
        analysis.projectTypes[project.Proyecto] = (analysis.projectTypes[project.Proyecto] || 0) + 1;
      }
    });

    // Generar documento experiencia-profesional.md
    await generateExperienciaProfesional(projects, analysis);

    logger.info('\n=== SINCRONIZACIÓN COMPLETADA ===\n');
    console.log(`Total de proyectos: ${analysis.totalProjects}`);
    console.log(`Empresas diferentes: ${Object.keys(analysis.companies).length}`);
    console.log(`Clientes diferentes: ${Object.keys(analysis.clients).length}`);
    console.log(`Rango temporal: ${analysis.dateRange.earliest} - ${analysis.dateRange.latest}`);
    console.log(`\nDocumento actualizado: ${path.join(PROJECT_DIR, 'experiencia-profesional.md')}`);

    return { projects, analysis };

  } catch (error) {
    logger.error('Error al sincronizar desde Sheets', error);
    throw error;
  }
}

async function generateExperienciaProfesional(projects: Project[], analysis: Analysis) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' });

  // Calcular años de experiencia
  if (analysis.dateRange.earliest && analysis.dateRange.latest) {
    const start = new Date(analysis.dateRange.earliest);
    const end = new Date(analysis.dateRange.latest);
    const years = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365));
  }

  // Top 20 clientes
  const topClients = Object.entries(analysis.clients)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20);

  // Top tipos de proyecto
  const topProjectTypes = Object.entries(analysis.projectTypes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20);

  // Proyectos por año ordenados
  const projectsByYear = Object.entries(analysis.projectsByYear)
    .sort(([a], [b]) => parseInt(a) - parseInt(b));

  // Empresas ordenadas por número de proyectos
  const companiesSorted = Object.entries(analysis.companies)
    .sort(([, a], [, b]) => b.count - a.count);

  let content = `# Experiencia Profesional - Álvaro Mur

**Última actualización:** ${dateStr}  
**Fuente de verdad:** [Google Sheets - Experiencia Álvaro Mur](https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit)

---

## 📊 Resumen Ejecutivo

- **Total de proyectos/experiencias:** ${analysis.totalProjects}
- **Rango temporal:** ${analysis.dateRange.earliest ? new Date(analysis.dateRange.earliest).getFullYear() : 'N/A'} - ${analysis.dateRange.latest ? new Date(analysis.dateRange.latest).getFullYear() : 'N/A'} (${analysis.dateRange.earliest && analysis.dateRange.latest ? Math.round((new Date(analysis.dateRange.latest).getTime() - new Date(analysis.dateRange.earliest).getTime()) / (1000 * 60 * 60 * 24 * 365)) : 'N/A'} años de experiencia)
- **Empresas/organizaciones diferentes:** ${Object.keys(analysis.companies).length}
- **Clientes diferentes:** ${Object.keys(analysis.clients).length}
- **Tipos de proyecto diferentes:** ${Object.keys(analysis.projectTypes).length}

---

## ⏱️ Estadísticas de Duración

  - **Duración total:** ${analysis.totalDuration.months > 0 ? (analysis.totalDuration.months / 12).toFixed(1) : 'N/A'} años acumulados (${analysis.totalDuration.days > 0 ? analysis.totalDuration.days.toLocaleString() : 'N/A'} días)
- **Duración promedio:** ${analysis.totalDuration.months > 0 && analysis.totalProjects > 0 ? (analysis.totalDuration.months / analysis.totalProjects).toFixed(1) : 'N/A'} meses (${analysis.totalDuration.days > 0 && analysis.totalProjects > 0 ? Math.round(analysis.totalDuration.days / analysis.totalProjects) : 'N/A'} días) por proyecto
- **Proyecto más largo:** ${Math.max(...projects.map(p => (typeof p['Duración (días)'] === 'number' && !isNaN(p['Duración (días)'])) ? p['Duración (días)'] : 0))} días

---

## 🏢 Análisis por Empresa/Organización

`;

  // Agregar empresas
  companiesSorted.forEach(([company, data]) => {
    const percentage = ((data.count / analysis.totalProjects) * 100).toFixed(1);
    const periodStart = data.period.start ? new Date(data.period.start).getFullYear() : 'N/A';
    const periodEnd = data.period.end ? new Date(data.period.end).getFullYear() : 'N/A';
    
    // Determinar tipo según empresa
    let tipo = 'Consultoría';
    let nota = '';
    
    if (company === 'PUCP') {
      tipo = 'Trabajo (Análisis de Inteligencia de Datos)';
      nota = '\n- **Nota:** Análisis de inteligencia de datos con Excel avanzado para correlación entre desempeño académico (notas estandarizadas mediante normalización estadística) y escala de pago. **Experiencia destacada donde la etapa de desarrollador salió a relucir.**';
    } else if (company === 'Acción Emprendedora') {
      tipo = 'Voluntariado (Coordinador)';
      nota = '\n- **Nota:** Voluntariado donde fue coordinador 5 de los 6 años en diferentes áreas. Aprendió sobre procesos de capacitación de emprendedores de subsistencia (base de la pirámide). **Base importante para aprender dónde se puede aplicar la programación para simplificar problemas.**';
    } else if (company === 'Sácate un 20') {
      tipo = 'Emprendimiento';
      nota = '\n- **Nota:** Emprendimiento educativo donde desarrolló sistema tipo ERP interno en Google Sheets para gestión de asignación de alumnos y profesores. **Experiencia destacada donde la etapa de desarrollador salió a relucir.**';
    } else if (company === 'Red de Impacto') {
      tipo = 'Gerencia General (Programas)';
      nota = '\n- **Nota:** Manejó diversos programas (eventos, becas, capacitaciones, comunidad) que aplicaron programación para simplificar problemas operativos.';
    }

    content += `### ${company}
- **Proyectos:** ${data.count} (${percentage}%)
- **Clientes únicos:** ${data.clients.size}
- **Período:** ${periodStart} - ${periodEnd}
- **Tipo:** ${tipo}${nota}

`;
  });

  content += `---

## 👥 Top 20 Clientes

`;

  topClients.forEach(([client, count], index) => {
    const percentage = ((count / analysis.totalProjects) * 100).toFixed(1);
    content += `${index + 1}. **${client}** - ${count} proyectos (${percentage}%)\n`;
  });

  content += `\n---

## 📋 Tipos de Proyecto Más Frecuentes

`;

  topProjectTypes.forEach(([type, count], index) => {
    const percentage = ((count / analysis.totalProjects) * 100).toFixed(1);
    content += `${index + 1}. **${type}** - ${count} proyectos (${percentage}%)\n`;
  });

  content += `\n---

## 📅 Evolución Temporal

### Proyectos por Año

`;

  projectsByYear.forEach(([year, count]) => {
    const percentage = ((count / analysis.totalProjects) * 100).toFixed(1);
    content += `- **${year}:** ${count} proyectos (${percentage}%)\n`;
  });

  // Año más activo
  const mostActiveYear = projectsByYear.reduce((max, [year, count]) => 
    count > max.count ? { year, count } : max, 
    { year: '', count: 0 }
  );

  // Empresa más activa
  const mostActiveCompany = companiesSorted[0];

  content += `\n---

## 📈 Análisis de Tendencias

- **Año más activo:** ${mostActiveYear.year} con ${mostActiveYear.count} proyectos
- **Empresa más activa:** ${mostActiveCompany[0]} con ${mostActiveCompany[1].count} proyectos
- **Cliente más frecuente:** ${topClients[0][0]} con ${topClients[0][1]} proyectos
- **Evolución profesional:** Transición de consultoría tradicional (PwC) a impacto social e innovación (CreativeLab)

---

## 💡 Conclusiones

### Puntos Destacados:

1. **Experiencia diversa:** ${analysis.totalProjects} proyectos/experiencias en ${Object.keys(analysis.companies).length} empresas/organizaciones diferentes
2. **Alcance amplio:** Trabajo con ${Object.keys(analysis.clients).length} clientes diferentes
3. **Evolución profesional:** Transición de consultoría tradicional (PwC) a impacto social e innovación (CreativeLab)
4. **Enfoque actual:** Mayor actividad en ${mostActiveCompany[0]} con ${mostActiveCompany[1].count} proyectos
5. **Duración promedio:** ${analysis.totalDuration.months > 0 && analysis.totalProjects > 0 ? (analysis.totalDuration.months / analysis.totalProjects).toFixed(1) : 'N/A'} meses por proyecto
6. **Experiencias de desarrollo destacadas:**
   - **PUCP (2011-2012):** Análisis de inteligencia de datos con Excel avanzado
   - **Sácate un 20 (2012-2016):** Sistema tipo ERP interno en Google Sheets
7. **Experiencias formativas:**
   - **Acción Emprendedora (2013-2018):** Voluntariado que enseñó dónde aplicar programación para simplificar problemas
   - **Red de Impacto (2022-2025):** Programas que aplicaron programación para simplificar problemas operativos

---

*Este documento se regenera desde el Google Sheets cuando hay cambios. Ver \`master_plan.md\` para el proceso de actualización.*
`;

  // Asegurar que el directorio existe
  if (!fs.existsSync(PROJECT_DIR)) {
    fs.mkdirSync(PROJECT_DIR, { recursive: true });
  }

  // Guardar archivo
  const filePath = path.join(PROJECT_DIR, 'experiencia-profesional.md');
  fs.writeFileSync(filePath, content, 'utf-8');
  logger.info(`Documento generado: ${filePath}`);
}

if (require.main === module) {
  syncExperienceFromSheets()
    .then(() => {
      logger.info('\nProceso completado');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Error fatal', error);
      process.exit(1);
    });
}

export { syncExperienceFromSheets };

