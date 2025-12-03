/**
 * Script para verificar que un documento markdown del workspace sea la fuente de verdad
 * comparándolo con los datos del sistema de trabajo (JSON/CSV)
 */

import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from '../utils/logger';

const logger = createLogger('VerifyMarkdownSourceOfTruth');

interface VerificationResult {
  synchronized: boolean;
  discrepancies: Array<{
    field: string;
    markdownValue: string | number;
    sourceValue: string | number;
    description: string;
  }>;
  warnings: string[];
  metadata: {
    markdownPath: string;
    sourcePath: string;
    verificationDate: string;
    markdownGeneratedDate?: string;
    sourceTimestamp?: number;
  };
}

interface ProjectsAnalysis {
  totalProjects: number;
  companies: Record<string, { count: number; projects: any[] }>;
  clients: Record<string, { count: number; projects: any[] }>;
  projectTypes?: Record<string, number>;
  dateRange: {
    earliest: string | null;
    latest: string | null;
  };
  durationStats?: {
    totalDays: number;
    totalMonths: number;
    averageDays: number;
    averageMonths: number;
    minDays: number;
    maxDays: number;
  };
  projectsByYear?: Record<string, { count: number; projects: any[] }>;
}

/**
 * Extrae datos del markdown de reporte de proyectos
 */
function extractDataFromMarkdown(markdownPath: string): Partial<ProjectsAnalysis> {
  const content = fs.readFileSync(markdownPath, 'utf-8');
  const data: Partial<ProjectsAnalysis> = {};

  // Extraer total de proyectos
  const totalMatch = content.match(/- \*\*Total de proyectos:\*\* (\d+)/);
  if (totalMatch) {
    data.totalProjects = parseInt(totalMatch[1]);
  }

  // Extraer empresas
  const companies: Record<string, { count: number }> = {};
  const companySection = content.match(/## 🏢 Análisis por Empresa\n([\s\S]*?)(?=\n## |$)/);
  if (companySection) {
    const companyMatches = companySection[1].matchAll(/### (.+?)\n- \*\*Proyectos:\*\* (\d+)/g);
    for (const match of companyMatches) {
      const companyName = match[1].trim();
      const count = parseInt(match[2]);
      companies[companyName] = { count };
    }
  }
  if (Object.keys(companies).length > 0) {
    data.companies = companies as any;
  }

  // Extraer clientes (Top 20)
  const clients: Record<string, { count: number }> = {};
  const clientsSection = content.match(/## 👥 Top 20 Clientes\n([\s\S]*?)(?=\n## |$)/);
  if (clientsSection) {
    const clientMatches = clientsSection[1].matchAll(/(\d+)\. \*\*(.+?)\*\* - (\d+) proyectos/g);
    for (const match of clientMatches) {
      const clientName = match[2].trim();
      const count = parseInt(match[3]);
      clients[clientName] = { count };
    }
  }
  if (Object.keys(clients).length > 0) {
    data.clients = clients as any;
  }

  // Extraer estadísticas de duración
  const durationSection = content.match(/## ⏱️ Estadísticas de Duración\n([\s\S]*?)(?=\n## |$)/);
  if (durationSection) {
    const durationStats: any = {};
    
    const totalDaysMatch = durationSection[1].match(/- \*\*Duración total:\*\* [\d.]+ años \(([\d,]+) días\)/);
    if (totalDaysMatch) {
      durationStats.totalDays = parseInt(totalDaysMatch[1].replace(/,/g, ''));
    }
    
    const avgDaysMatch = durationSection[1].match(/- \*\*Duración promedio:\*\* [\d.]+ meses \(([\d]+) días\)/);
    if (avgDaysMatch) {
      durationStats.averageDays = parseInt(avgDaysMatch[1]);
    }
    
    const minDaysMatch = durationSection[1].match(/- \*\*Proyecto más corto:\*\* ([\d]+) días/);
    if (minDaysMatch) {
      durationStats.minDays = parseInt(minDaysMatch[1]);
    }
    
    const maxDaysMatch = durationSection[1].match(/- \*\*Proyecto más largo:\*\* ([\d,]+) días/);
    if (maxDaysMatch) {
      durationStats.maxDays = parseInt(maxDaysMatch[1].replace(/,/g, ''));
    }
    
    if (Object.keys(durationStats).length > 0) {
      data.durationStats = durationStats;
    }
  }

  // Extraer fecha de generación
  const generatedMatch = content.match(/\*\*Generado:\*\* (.+?)\n/);
  if (generatedMatch) {
    data.markdownGeneratedDate = generatedMatch[1].trim();
  }

  return data;
}

/**
 * Carga datos del JSON de análisis
 */
function loadSourceData(sourcePath: string): ProjectsAnalysis | null {
  try {
    const content = fs.readFileSync(sourcePath, 'utf-8');
    const data = JSON.parse(content);
    
    // El JSON puede tener diferentes estructuras
    if (data.analysis) {
      return data.analysis as ProjectsAnalysis;
    } else if (data.totalProjects !== undefined) {
      return data as ProjectsAnalysis;
    } else if (data.projects && Array.isArray(data.projects)) {
      // Si solo tiene projects, necesitamos calcular el análisis
      // Por ahora, retornamos null y el script sugerirá usar el JSON completo
      return null;
    }
    
    return null;
  } catch (error) {
    logger.error(`Error al cargar datos de fuente: ${error}`);
    return null;
  }
}

/**
 * Compara datos del markdown con datos de la fuente
 */
function compareData(
  markdownData: Partial<ProjectsAnalysis>,
  sourceData: ProjectsAnalysis,
  markdownPath: string,
  sourcePath: string
): VerificationResult {
  const discrepancies: VerificationResult['discrepancies'] = [];
  const warnings: string[] = [];

  // Comparar total de proyectos
  if (markdownData.totalProjects !== undefined && sourceData.totalProjects !== undefined) {
    if (markdownData.totalProjects !== sourceData.totalProjects) {
      discrepancies.push({
        field: 'totalProjects',
        markdownValue: markdownData.totalProjects,
        sourceValue: sourceData.totalProjects,
        description: `Total de proyectos: Markdown muestra ${markdownData.totalProjects}, fuente tiene ${sourceData.totalProjects}`,
      });
    }
  }

  // Comparar empresas
  if (markdownData.companies && sourceData.companies) {
    const markdownCompanies = markdownData.companies;
    const sourceCompanies = sourceData.companies;

    // Verificar empresas en markdown
    for (const [companyName, markdownCompany] of Object.entries(markdownCompanies)) {
      const sourceCompany = sourceCompanies[companyName];
      if (!sourceCompany) {
        warnings.push(`Empresa "${companyName}" está en markdown pero no en fuente`);
      } else if (markdownCompany.count !== sourceCompany.count) {
        discrepancies.push({
          field: `companies.${companyName}`,
          markdownValue: markdownCompany.count,
          sourceValue: sourceCompany.count,
          description: `Empresa "${companyName}": Markdown muestra ${markdownCompany.count} proyectos, fuente tiene ${sourceCompany.count}`,
        });
      }
    }

    // Verificar empresas en fuente que no están en markdown
    for (const [companyName, sourceCompany] of Object.entries(sourceCompanies)) {
      if (!markdownCompanies[companyName]) {
        warnings.push(`Empresa "${companyName}" está en fuente pero no en markdown`);
      }
    }
  }

  // Comparar clientes (solo top clientes del markdown)
  if (markdownData.clients && sourceData.clients) {
    const markdownClients = markdownData.clients;
    const sourceClients = sourceData.clients;

    for (const [clientName, markdownClient] of Object.entries(markdownClients)) {
      const sourceClient = sourceClients[clientName];
      if (!sourceClient) {
        warnings.push(`Cliente "${clientName}" está en markdown pero no en fuente`);
      } else if (markdownClient.count !== sourceClient.count) {
        discrepancies.push({
          field: `clients.${clientName}`,
          markdownValue: markdownClient.count,
          sourceValue: sourceClient.count,
          description: `Cliente "${clientName}": Markdown muestra ${markdownClient.count} proyectos, fuente tiene ${sourceClient.count}`,
        });
      }
    }
  }

  // Comparar estadísticas de duración
  if (markdownData.durationStats && sourceData.durationStats) {
    const mdStats = markdownData.durationStats;
    const srcStats = sourceData.durationStats;

    if (mdStats.totalDays !== undefined && srcStats.totalDays !== undefined) {
      // Permitir pequeña diferencia por redondeo
      const diff = Math.abs(mdStats.totalDays - srcStats.totalDays);
      if (diff > 10) { // Tolerancia de 10 días
        discrepancies.push({
          field: 'durationStats.totalDays',
          markdownValue: mdStats.totalDays,
          sourceValue: srcStats.totalDays,
          description: `Duración total: Markdown muestra ${mdStats.totalDays} días, fuente tiene ${srcStats.totalDays} días (diferencia: ${diff})`,
        });
      }
    }

    if (mdStats.averageDays !== undefined && srcStats.averageDays !== undefined) {
      const diff = Math.abs(mdStats.averageDays - srcStats.averageDays);
      if (diff > 5) { // Tolerancia de 5 días
        discrepancies.push({
          field: 'durationStats.averageDays',
          markdownValue: mdStats.averageDays,
          sourceValue: srcStats.averageDays,
          description: `Duración promedio: Markdown muestra ${mdStats.averageDays} días, fuente tiene ${srcStats.averageDays} días (diferencia: ${diff})`,
        });
      }
    }
  }

  // Verificar fecha de generación vs timestamp de fuente
  const sourceStat = fs.statSync(sourcePath);
  const sourceTimestamp = sourceStat.mtime.getTime();
  
  // Si el markdown tiene fecha de generación, verificar si es más antigua que la fuente
  if (markdownData.markdownGeneratedDate) {
    try {
      // Intentar parsear la fecha del markdown (formato: "6/11/2025, 2:53:31")
      const mdDateStr = markdownData.markdownGeneratedDate;
      const mdDate = new Date(mdDateStr);
      if (!isNaN(mdDate.getTime()) && mdDate.getTime() < sourceTimestamp) {
        warnings.push(`El documento fue generado el ${mdDateStr}, pero la fuente fue modificada más recientemente`);
      }
    } catch (error) {
      // Ignorar errores de parsing de fecha
    }
  }

  return {
    synchronized: discrepancies.length === 0,
    discrepancies,
    warnings,
    metadata: {
      markdownPath,
      sourcePath,
      verificationDate: new Date().toISOString(),
      markdownGeneratedDate: markdownData.markdownGeneratedDate,
      sourceTimestamp,
    },
  };
}

/**
 * Genera reporte de verificación
 */
function generateReport(result: VerificationResult): string {
  let report = `# Reporte de Verificación de Fuente de Verdad\n\n`;
  report += `**Documento:** ${result.metadata.markdownPath}\n`;
  report += `**Fuente de datos:** ${result.metadata.sourcePath}\n`;
  report += `**Fecha de verificación:** ${result.metadata.verificationDate}\n\n`;

  if (result.metadata.markdownGeneratedDate) {
    report += `**Fecha de generación del documento:** ${result.metadata.markdownGeneratedDate}\n\n`;
  }

  report += `---\n\n`;

  if (result.synchronized) {
    report += `## ✅ Estado: Sincronizado\n\n`;
    report += `El documento está sincronizado con los datos del sistema de trabajo.\n\n`;
  } else {
    report += `## ⚠️ Estado: Discrepancias Detectadas\n\n`;
    report += `Se encontraron ${result.discrepancies.length} discrepancia(s) entre el documento y los datos del sistema.\n\n`;
  }

  if (result.discrepancies.length > 0) {
    report += `### Discrepancias Detectadas:\n\n`;
    result.discrepancies.forEach((disc, index) => {
      report += `${index + 1}. **${disc.field}**\n`;
      report += `   - Documento: ${disc.markdownValue}\n`;
      report += `   - Fuente: ${disc.sourceValue}\n`;
      report += `   - Descripción: ${disc.description}\n\n`;
    });
  }

  if (result.warnings.length > 0) {
    report += `### Advertencias:\n\n`;
    result.warnings.forEach((warning, index) => {
      report += `${index + 1}. ${warning}\n`;
    });
    report += `\n`;
  }

  if (!result.synchronized) {
    report += `### Recomendaciones:\n\n`;
    report += `1. Regenerar el documento desde la fuente de datos\n`;
    report += `2. Actualizar manualmente las secciones con discrepancias\n`;
    report += `3. Verificar si hay datos nuevos en el sistema\n\n`;
  }

  return report;
}

/**
 * Función principal
 */
async function verifyMarkdownSourceOfTruth(
  markdownPath: string,
  sourcePath?: string,
  dataType?: string
): Promise<VerificationResult> {
  try {
    // Verificar que el markdown existe
    if (!fs.existsSync(markdownPath)) {
      throw new Error(`El archivo markdown no existe: ${markdownPath}`);
    }

    // Si no se proporciona sourcePath, intentar encontrarlo automáticamente
    if (!sourcePath) {
      const markdownDir = path.dirname(markdownPath);
      const repoRoot = path.resolve(markdownDir, '../../../..');
      
      // Buscar en _temp/sheets-analysis/
      const sheetsAnalysisDir = path.join(repoRoot, '_temp', 'sheets-analysis');
      if (fs.existsSync(sheetsAnalysisDir)) {
        const files = fs.readdirSync(sheetsAnalysisDir)
          .filter(f => f.endsWith('.json'))
          .map(f => ({
            name: f,
            path: path.join(sheetsAnalysisDir, f),
            mtime: fs.statSync(path.join(sheetsAnalysisDir, f)).mtime.getTime(),
          }))
          .sort((a, b) => b.mtime - a.mtime); // Más reciente primero

        if (files.length > 0) {
          sourcePath = files[0].path;
          logger.info(`Fuente de datos encontrada automáticamente: ${sourcePath}`);
        }
      }
    }

    if (!sourcePath || !fs.existsSync(sourcePath)) {
      return {
        synchronized: false,
        discrepancies: [],
        warnings: ['No se encontró una fuente de datos para comparar'],
        metadata: {
          markdownPath,
          sourcePath: sourcePath || 'no encontrada',
          verificationDate: new Date().toISOString(),
        },
      };
    }

    // Extraer datos del markdown
    logger.info(`Extrayendo datos del markdown: ${markdownPath}`);
    const markdownData = extractDataFromMarkdown(markdownPath);

    // Cargar datos de la fuente
    logger.info(`Cargando datos de la fuente: ${sourcePath}`);
    const sourceData = loadSourceData(sourcePath);

    if (!sourceData) {
      return {
        synchronized: false,
        discrepancies: [],
        warnings: ['No se pudo cargar o parsear los datos de la fuente'],
        metadata: {
          markdownPath,
          sourcePath,
          verificationDate: new Date().toISOString(),
        },
      };
    }

    // Comparar datos
    logger.info('Comparando datos...');
    const result = compareData(markdownData, sourceData, markdownPath, sourcePath);

    // Generar reporte
    const report = generateReport(result);
    console.log(report);

    return result;

  } catch (error) {
    logger.error('Error en verificación', error);
    throw error;
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  
  let markdownPath: string | undefined;
  let sourcePath: string | undefined;
  let dataType: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--markdown' && args[i + 1]) {
      markdownPath = args[i + 1];
      i++;
    } else if (args[i] === '--source' && args[i + 1]) {
      sourcePath = args[i + 1];
      i++;
    } else if (args[i] === '--type' && args[i + 1]) {
      dataType = args[i + 1];
      i++;
    }
  }

  if (!markdownPath) {
    console.error('Uso: verify-markdown-source-of-truth.ts --markdown <ruta> [--source <ruta>] [--type <tipo>]');
    process.exit(1);
  }

  verifyMarkdownSourceOfTruth(markdownPath, sourcePath, dataType)
    .then((result) => {
      process.exit(result.synchronized ? 0 : 1);
    })
    .catch((error) => {
      logger.error('Error fatal', error);
      process.exit(2);
    });
}

export { verifyMarkdownSourceOfTruth, VerificationResult };

