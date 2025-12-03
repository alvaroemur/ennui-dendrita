#!/usr/bin/env ts-node
/**
 * Script para generar reportes de uso de dendrita
 * 
 * Uso:
 *   ts-node .dendrita/utils/scripts/generate-dendrita-report.ts [days] [format]
 * 
 * Ejemplos:
 *   ts-node .dendrita/utils/scripts/generate-dendrita-report.ts 7 json
 *   ts-node .dendrita/utils/scripts/generate-dendrita-report.ts 30 markdown
 */

import * as path from 'path';
import * as fs from 'fs';
import { dendritaLogAnalyzer } from '../dendrita-log-analyzer';

async function main() {
  const args = process.argv.slice(2);
  const days = args[0] ? parseInt(args[0], 10) : 30;
  const format = args[1] || 'markdown';

  if (isNaN(days) || days < 1) {
    console.error('Error: days must be a positive number');
    process.exit(1);
  }

  if (format !== 'json' && format !== 'markdown') {
    console.error('Error: format must be "json" or "markdown"');
    process.exit(1);
  }

  console.log(`📊 Generating dendrita report for last ${days} days...\n`);

  // Generar reporte
  const report = dendritaLogAnalyzer.generateReport(days);

  // Mostrar resumen en consola
  console.log('=== Summary ===');
  console.log(`Total Events: ${report.summary.total_events}`);
  console.log(`Unique Components: ${report.summary.unique_components}`);
  console.log(`Unique Users: ${report.summary.unique_users}`);
  console.log(`Error Rate: ${report.summary.error_rate.toFixed(2)}%\n`);

  if (report.top_components.length > 0) {
    console.log('=== Top 5 Components ===');
    report.top_components.slice(0, 5).forEach((comp, i) => {
      console.log(`${i + 1}. ${comp.component_name} (${comp.component_type})`);
      console.log(`   Events: ${comp.total_events} | Success: ${comp.success_count} | Errors: ${comp.error_count}`);
    });
    console.log('');
  }

  if (report.recent_errors.length > 0) {
    console.log('=== Recent Errors ===');
    report.recent_errors.slice(0, 5).forEach((error, i) => {
      console.log(`${i + 1}. ${error.component_name} - ${new Date(error.timestamp).toLocaleString()}`);
      if (error.error) {
        console.log(`   Error: ${error.error}`);
      }
    });
    console.log('');
  }

  // Exportar reporte
  const timestamp = new Date().toISOString().split('T')[0];
  const outputDir = path.join(__dirname, '../../logs');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  if (format === 'json') {
    const outputPath = path.join(outputDir, `dendrita-report-${timestamp}.json`);
    dendritaLogAnalyzer.exportReportToJSON(days, outputPath);
    console.log(`✅ Report exported to: ${outputPath}`);
  } else {
    const outputPath = path.join(outputDir, `dendrita-report-${timestamp}.md`);
    dendritaLogAnalyzer.exportReportToMarkdown(days, outputPath);
    console.log(`✅ Report exported to: ${outputPath}`);
  }
}

main().catch(error => {
  console.error('Error generating report:', error);
  process.exit(1);
});

