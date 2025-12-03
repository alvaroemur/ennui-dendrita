#!/usr/bin/env ts-node
/**
 * Servidor HTTP para el dashboard de análisis de enriquecimiento de documentos
 */

import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';
import { createLogger } from '../../utils/logger';
import { processLogFile, EnrichmentStats } from './process-enrichment-log';

const logger = createLogger('EnrichmentDashboard');

class EnrichmentDashboardServer {
  private port: number;
  private repoRoot: string;
  private logPath: string;
  private statsPath: string;
  private server: http.Server | null = null;

  constructor(port: number = 18434, repoRoot: string = process.cwd()) {
    this.port = port;
    this.repoRoot = repoRoot;
    this.logPath = path.join('/tmp', 'enrichment-relationships.log');
    this.statsPath = path.join(this.repoRoot, '.dendrita', 'integrations', 'dashboards', 'enrichment-stats.json');
  }

  private ensureStatsFile(): void {
    // Procesar log si no existe el archivo de estadísticas o si es muy antiguo
    if (!fs.existsSync(this.statsPath) || this.shouldRefreshStats()) {
      logger.info('Processing log file to generate statistics...');
      const stats = processLogFile(this.logPath);
      const statsDir = path.dirname(this.statsPath);
      if (!fs.existsSync(statsDir)) {
        fs.mkdirSync(statsDir, { recursive: true });
      }
      fs.writeFileSync(this.statsPath, JSON.stringify(stats, null, 2), 'utf-8');
    }
  }

  private shouldRefreshStats(): boolean {
    try {
      const stats = fs.statSync(this.statsPath);
      const logStats = fs.statSync(this.logPath);
      // Refrescar si el log es más reciente que las estadísticas
      return logStats.mtime > stats.mtime;
    } catch {
      return true;
    }
  }

  private getStats(): EnrichmentStats | null {
    try {
      this.ensureStatsFile();
      if (!fs.existsSync(this.statsPath)) {
        return null;
      }
      const content = fs.readFileSync(this.statsPath, 'utf-8');
      return JSON.parse(content) as EnrichmentStats;
    } catch (error) {
      logger.error('Failed to load stats', error);
      return null;
    }
  }

  private handleAPI(req: http.IncomingMessage, res: http.ServerResponse): void {
    const parsedUrl = url.parse(req.url || '', true);
    const pathname = parsedUrl.pathname;

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (pathname === '/api/stats') {
      const stats = this.getStats();
      if (!stats) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Statistics not available' }));
        return;
      }

      // Aplicar filtros si existen
      const query = parsedUrl.query;
      const limit = query.limit ? parseInt(query.limit as string, 10) : undefined;
      const minValue = query.minValue ? parseFloat(query.minValue as string) : undefined;

      let filteredStats = { ...stats };

      if (limit) {
        filteredStats.backlinksByDocument = stats.backlinksByDocument.slice(0, limit);
        filteredStats.relationshipsByDocument = stats.relationshipsByDocument.slice(0, limit);
        filteredStats.tokenUsageByDocument = stats.tokenUsageByDocument.slice(0, limit);
      }

      if (minValue !== undefined) {
        filteredStats.backlinksByDocument = stats.backlinksByDocument.filter((d) => d.backlinks >= minValue);
        filteredStats.relationshipsByDocument = stats.relationshipsByDocument.filter((d) => d.relationships >= minValue);
        filteredStats.tokenUsageByDocument = stats.tokenUsageByDocument.filter((d) => d.tokens >= minValue);
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(filteredStats));
    } else if (pathname === '/api/refresh') {
      // Forzar refresco de estadísticas
      try {
        const stats = processLogFile(this.logPath);
        const statsDir = path.dirname(this.statsPath);
        if (!fs.existsSync(statsDir)) {
          fs.mkdirSync(statsDir, { recursive: true });
        }
        fs.writeFileSync(this.statsPath, JSON.stringify(stats, null, 2), 'utf-8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Statistics refreshed' }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
      }
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  }

  private serveHTML(req: http.IncomingMessage, res: http.ServerResponse): void {
    const html = this.getDashboardHTML();
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  }

  private getDashboardHTML(): string {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard - Análisis de Enriquecimiento de Documentos</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
      color: #333;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
    }
    
    .header {
      background: white;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 20px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .controls {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
      align-items: center;
    }
    
    .control-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    
    .control-group label {
      font-size: 0.9em;
      font-weight: 600;
      color: #666;
    }
    
    .control-group input,
    .control-group select {
      padding: 8px 12px;
      border: 2px solid #e0e0e0;
      border-radius: 6px;
      font-size: 1em;
      transition: border-color 0.3s;
    }
    
    .control-group input:focus,
    .control-group select:focus {
      outline: none;
      border-color: #667eea;
    }
    
    .btn {
      padding: 10px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 1em;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      font-weight: 600;
    }
    
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }
    
    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    }
    
    .stat-card h3 {
      font-size: 0.9em;
      color: #666;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .stat-card .value {
      font-size: 2.5em;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .stat-card .unit {
      font-size: 0.8em;
      color: #999;
      margin-left: 5px;
    }
    
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }
    
    .chart-container {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .chart-container h2 {
      font-size: 1.3em;
      margin-bottom: 20px;
      color: #333;
    }
    
    .chart-wrapper {
      position: relative;
      height: 300px;
    }
    
    .loading {
      text-align: center;
      padding: 40px;
      color: #666;
    }
    
    .error {
      background: #fee;
      color: #c33;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Dashboard de Análisis de Enriquecimiento</h1>
      <p>Análisis de relaciones semánticas y backlinks en documentos</p>
    </div>
    
    <div class="controls">
      <div class="control-group">
        <label for="limit">Límite de resultados</label>
        <input type="number" id="limit" value="20" min="5" max="50" step="5">
      </div>
      <div class="control-group">
        <label for="minValue">Valor mínimo</label>
        <input type="number" id="minValue" value="0" min="0" step="1">
      </div>
      <div class="control-group">
        <label for="chartType">Tipo de gráfico</label>
        <select id="chartType">
          <option value="bar">Barras</option>
          <option value="line">Líneas</option>
          <option value="pie">Circular</option>
        </select>
      </div>
      <div class="control-group">
        <button class="btn" onclick="refreshData()">🔄 Actualizar</button>
      </div>
      <div class="control-group">
        <button class="btn" onclick="refreshStats()">📊 Refrescar Estadísticas</button>
      </div>
    </div>
    
    <div id="loading" class="loading">Cargando datos...</div>
    <div id="error" class="error" style="display: none;"></div>
    
    <div id="stats-grid" class="stats-grid" style="display: none;"></div>
    
    <div id="charts-grid" class="charts-grid" style="display: none;"></div>
  </div>
  
  <script>
    let charts = {};
    
    async function loadData() {
      const limit = document.getElementById('limit').value;
      const minValue = document.getElementById('minValue').value;
      
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit);
      if (minValue) params.append('minValue', minValue);
      
      try {
        const response = await fetch(\`/api/stats?\${params}\`);
        if (!response.ok) throw new Error('Failed to load data');
        
        const data = await response.json();
        displayStats(data);
        displayCharts(data);
        
        document.getElementById('loading').style.display = 'none';
        document.getElementById('stats-grid').style.display = 'grid';
        document.getElementById('charts-grid').style.display = 'grid';
        document.getElementById('error').style.display = 'none';
      } catch (error) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').textContent = \`Error: \${error.message}\`;
        document.getElementById('error').style.display = 'block';
      }
    }
    
    function displayStats(data) {
      const statsGrid = document.getElementById('stats-grid');
      statsGrid.innerHTML = \`
        <div class="stat-card">
          <h3>Documentos Totales</h3>
          <div class="value">\${data.totalDocuments}<span class="unit">docs</span></div>
        </div>
        <div class="stat-card">
          <h3>Documentos Procesados</h3>
          <div class="value">\${data.processedDocuments}<span class="unit">docs</span></div>
        </div>
        <div class="stat-card">
          <h3>Backlinks Totales</h3>
          <div class="value">\${data.totalBacklinks}<span class="unit">links</span></div>
        </div>
        <div class="stat-card">
          <h3>Relaciones Detectadas</h3>
          <div class="value">\${data.totalRelationships}<span class="unit">rels</span></div>
        </div>
        <div class="stat-card">
          <h3>Tokens Totales</h3>
          <div class="value">\${data.tokenUsage.total.toLocaleString()}<span class="unit">tokens</span></div>
        </div>
        <div class="stat-card">
          <h3>Costo Estimado</h3>
          <div class="value">$\${data.tokenUsage.estimatedCost.toFixed(2)}<span class="unit">USD</span></div>
        </div>
        <div class="stat-card">
          <h3>Llamadas API</h3>
          <div class="value">\${data.apiCalls.semanticAnalysis + data.apiCalls.relationshipDetection}<span class="unit">calls</span></div>
        </div>
        <div class="stat-card">
          <h3>Embeddings</h3>
          <div class="value">\${data.apiCalls.embeddings.toLocaleString()}<span class="unit">emb</span></div>
        </div>
      \`;
    }
    
    function displayCharts(data) {
      const chartType = document.getElementById('chartType').value;
      
      // Destruir gráficos existentes
      Object.values(charts).forEach(chart => chart.destroy());
      charts = {};
      
      const chartsGrid = document.getElementById('charts-grid');
      chartsGrid.innerHTML = \`
        <div class="chart-container">
          <h2>Top Documentos por Backlinks</h2>
          <div class="chart-wrapper">
            <canvas id="backlinksChart"></canvas>
          </div>
        </div>
        <div class="chart-container">
          <h2>Top Documentos por Relaciones</h2>
          <div class="chart-wrapper">
            <canvas id="relationshipsChart"></canvas>
          </div>
        </div>
        <div class="chart-container">
          <h2>Top Documentos por Uso de Tokens</h2>
          <div class="chart-wrapper">
            <canvas id="tokensChart"></canvas>
          </div>
        </div>
        <div class="chart-container">
          <h2>Distribución de Documentos</h2>
          <div class="chart-wrapper">
            <canvas id="statusChart"></canvas>
          </div>
        </div>
        <div class="chart-container">
          <h2>Uso de Tokens</h2>
          <div class="chart-wrapper">
            <canvas id="tokenUsageChart"></canvas>
          </div>
        </div>
        <div class="chart-container">
          <h2>Llamadas a la API</h2>
          <div class="chart-wrapper">
            <canvas id="apiCallsChart"></canvas>
          </div>
        </div>
      \`;
      
      // Gráfico de backlinks
      const backlinksCtx = document.getElementById('backlinksChart').getContext('2d');
      charts.backlinks = new Chart(backlinksCtx, {
        type: chartType,
        data: {
          labels: data.backlinksByDocument.map(d => d.document),
          datasets: [{
            label: 'Backlinks',
            data: data.backlinksByDocument.map(d => d.backlinks),
            backgroundColor: 'rgba(102, 126, 234, 0.6)',
            borderColor: 'rgba(102, 126, 234, 1)',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          }
        }
      });
      
      // Gráfico de relaciones
      const relationshipsCtx = document.getElementById('relationshipsChart').getContext('2d');
      charts.relationships = new Chart(relationshipsCtx, {
        type: chartType,
        data: {
          labels: data.relationshipsByDocument.map(d => d.document),
          datasets: [{
            label: 'Relaciones',
            data: data.relationshipsByDocument.map(d => d.relationships),
            backgroundColor: 'rgba(118, 75, 162, 0.6)',
            borderColor: 'rgba(118, 75, 162, 1)',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          }
        }
      });
      
      // Gráfico de tokens
      const tokensCtx = document.getElementById('tokensChart').getContext('2d');
      charts.tokens = new Chart(tokensCtx, {
        type: chartType,
        data: {
          labels: data.tokenUsageByDocument.map(d => d.document),
          datasets: [{
            label: 'Tokens',
            data: data.tokenUsageByDocument.map(d => d.tokens),
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          }
        }
      });
      
      // Gráfico de estado
      const statusCtx = document.getElementById('statusChart').getContext('2d');
      charts.status = new Chart(statusCtx, {
        type: 'pie',
        data: {
          labels: ['Procesados', 'Saltados'],
          datasets: [{
            data: [data.documentsByStatus.processed, data.documentsByStatus.skipped],
            backgroundColor: ['rgba(102, 126, 234, 0.6)', 'rgba(200, 200, 200, 0.6)'],
            borderColor: ['rgba(102, 126, 234, 1)', 'rgba(200, 200, 200, 1)'],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
      
      // Gráfico de uso de tokens
      const tokenUsageCtx = document.getElementById('tokenUsageChart').getContext('2d');
      charts.tokenUsage = new Chart(tokenUsageCtx, {
        type: 'doughnut',
        data: {
          labels: ['Prompt', 'Completion'],
          datasets: [{
            data: [data.tokenUsage.prompt, data.tokenUsage.completion],
            backgroundColor: ['rgba(102, 126, 234, 0.6)', 'rgba(118, 75, 162, 0.6)'],
            borderColor: ['rgba(102, 126, 234, 1)', 'rgba(118, 75, 162, 1)'],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
      
      // Gráfico de llamadas API
      const apiCallsCtx = document.getElementById('apiCallsChart').getContext('2d');
      charts.apiCalls = new Chart(apiCallsCtx, {
        type: 'bar',
        data: {
          labels: ['Análisis Semántico', 'Detección de Relaciones', 'Embeddings'],
          datasets: [{
            label: 'Llamadas',
            data: [
              data.apiCalls.semanticAnalysis,
              data.apiCalls.relationshipDetection,
              data.apiCalls.embeddings
            ],
            backgroundColor: [
              'rgba(102, 126, 234, 0.6)',
              'rgba(118, 75, 162, 0.6)',
              'rgba(255, 99, 132, 0.6)'
            ],
            borderColor: [
              'rgba(102, 126, 234, 1)',
              'rgba(118, 75, 162, 1)',
              'rgba(255, 99, 132, 1)'
            ],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          }
        }
      });
    }
    
    function refreshData() {
      document.getElementById('loading').style.display = 'block';
      loadData();
    }
    
    async function refreshStats() {
      try {
        const response = await fetch('/api/refresh', { method: 'POST' });
        if (!response.ok) throw new Error('Failed to refresh stats');
        alert('Estadísticas refrescadas correctamente');
        refreshData();
      } catch (error) {
        alert(\`Error al refrescar: \${error.message}\`);
      }
    }
    
    // Cargar datos al inicio
    loadData();
    
    // Actualizar cuando cambian los controles
    document.getElementById('limit').addEventListener('change', refreshData);
    document.getElementById('minValue').addEventListener('change', refreshData);
    document.getElementById('chartType').addEventListener('change', refreshData);
  </script>
</body>
</html>`;
  }

  start(): void {
    this.server = http.createServer((req, res) => {
      const parsedUrl = url.parse(req.url || '', true);
      const pathname = parsedUrl.pathname;

      if (pathname?.startsWith('/api/')) {
        this.handleAPI(req, res);
      } else {
        this.serveHTML(req, res);
      }
    });

    this.server.listen(this.port, () => {
      logger.info(`Enrichment dashboard server started on port ${this.port}`);
      console.log(`🚀 Dashboard disponible en: http://0.0.0.0:${this.port}`);
      console.log(`📊 Acceso público: http://34.171.12.47:${this.port}`);
    });
  }

  stop(): void {
    if (this.server) {
      this.server.close();
      logger.info('Enrichment dashboard server stopped');
    }
  }
}

async function main(): Promise<void> {
  const port = parseInt(process.env.ENRICHMENT_DASHBOARD_PORT || '18434', 10);
  const repoRoot = process.env.DENDRITA_REPO_ROOT || process.cwd();

  const server = new EnrichmentDashboardServer(port, repoRoot);
  server.start();

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Deteniendo servidor...');
    server.stop();
    process.exit(0);
  });
}

if (require.main === module) {
  main().catch((error) => {
    logger.error('Fatal error', error);
    process.exit(1);
  });
}

export { EnrichmentDashboardServer };

