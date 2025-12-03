#!/usr/bin/env ts-node
/**
 * Servidor HTTP para el panel de configuración de dendrita
 * Permite editar el deployment-manifest.json desde la nube
 */

import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';
import { createLogger } from '../utils/logger';

const logger = createLogger('ConfigPanel');

interface ConfigPanelServer {
  port: number;
  repoRoot: string;
  manifestPath: string;
  server: http.Server | null;
}

class ConfigPanelServer {
  constructor(port: number = 18433, repoRoot: string = '/app/dendrita') {
    this.port = port;
    this.repoRoot = repoRoot;
    this.manifestPath = path.join(this.repoRoot, '.dendrita', 'deployment-manifest.json');
    this.server = null;
  }

  private loadManifest(): any {
    try {
      if (!fs.existsSync(this.manifestPath)) {
        return { error: 'Manifest not found' };
      }
      const content = fs.readFileSync(this.manifestPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      logger.error('Failed to load manifest', error);
      return { error: 'Failed to load manifest' };
    }
  }

  private saveManifest(manifest: any): { success: boolean; error?: string } {
    try {
      // Crear directorio si no existe
      const manifestDir = path.dirname(this.manifestPath);
      if (!fs.existsSync(manifestDir)) {
        fs.mkdirSync(manifestDir, { recursive: true });
      }

      // Guardar manifest
      fs.writeFileSync(this.manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
      
      // Trigger sync back to Google Drive
      this.triggerSyncToDrive();
      
      return { success: true };
    } catch (error) {
      logger.error('Failed to save manifest', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  private triggerSyncToDrive(): void {
    // Ejecutar script de sincronización a Google Drive en background
    const syncScript = path.join(this.repoRoot, '.dendrita', 'integrations', 'scripts', 'sync-to-drive.ts');
    if (fs.existsSync(syncScript)) {
      const { exec } = require('child_process');
      exec(`cd ${this.repoRoot} && npx ts-node ${syncScript}`, (error: any) => {
        if (error) {
          logger.error('Failed to sync to Drive', error);
        } else {
          logger.info('Manifest synced to Google Drive');
        }
      });
    }
  }

  private serveHTML(req: http.IncomingMessage, res: http.ServerResponse): void {
    const html = this.getConfigPanelHTML();
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  }

  private getConfigPanelHTML(): string {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Panel de Configuración - dendrita</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      min-height: 100vh;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 2em;
      margin-bottom: 10px;
    }
    
    .content {
      padding: 30px;
    }
    
    .editor-container {
      margin-bottom: 20px;
    }
    
    .editor-label {
      font-size: 1.1em;
      font-weight: 600;
      color: #333;
      margin-bottom: 10px;
      display: block;
    }
    
    .editor {
      width: 100%;
      min-height: 500px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 14px;
      padding: 15px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      resize: vertical;
    }
    
    .editor:focus {
      outline: none;
      border-color: #667eea;
    }
    
    .buttons {
      display: flex;
      gap: 15px;
      margin-top: 20px;
    }
    
    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 1em;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .btn-primary {
      background: #667eea;
      color: white;
    }
    
    .btn-primary:hover {
      background: #5568d3;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    
    .btn-secondary {
      background: #f8f9fa;
      color: #333;
      border: 2px solid #e0e0e0;
    }
    
    .btn-secondary:hover {
      background: #e9ecef;
    }
    
    .status {
      margin-top: 15px;
      padding: 12px;
      border-radius: 8px;
      display: none;
    }
    
    .status.success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    
    .status.error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
    
    .status.info {
      background: #d1ecf1;
      color: #0c5460;
      border: 1px solid #bee5eb;
    }
    
    .info-box {
      background: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin-bottom: 20px;
      border-radius: 4px;
    }
    
    .info-box p {
      margin: 5px 0;
      color: #666;
    }
    
    .loading {
      display: none;
      text-align: center;
      padding: 20px;
    }
    
    .spinner {
      border: 3px solid #f3f3f3;
      border-top: 3px solid #667eea;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚙️ Panel de Configuración dendrita</h1>
      <p>Edita el deployment-manifest.json y se sincronizará automáticamente a Google Drive</p>
    </div>
    
    <div class="content">
      <div class="info-box">
        <p><strong>ℹ️ Información:</strong></p>
        <p>• Los cambios se guardan en el servidor y se sincronizan automáticamente a Google Drive</p>
        <p>• El formato JSON debe ser válido</p>
        <p>• Los scripts se ejecutarán según el schedule configurado</p>
      </div>
      
      <div class="editor-container">
        <label class="editor-label" for="manifest-editor">deployment-manifest.json</label>
        <textarea id="manifest-editor" class="editor" spellcheck="false"></textarea>
      </div>
      
      <div class="buttons">
        <button class="btn btn-primary" onclick="saveManifest()">💾 Guardar y Sincronizar</button>
        <button class="btn btn-secondary" onclick="loadManifest()">🔄 Recargar</button>
        <button class="btn btn-secondary" onclick="formatJSON()">✨ Formatear JSON</button>
      </div>
      
      <div id="status" class="status"></div>
      
      <div id="loading" class="loading">
        <div class="spinner"></div>
        <p>Sincronizando con Google Drive...</p>
      </div>
    </div>
  </div>
  
  <script>
    let originalContent = '';
    
    async function loadManifest() {
      try {
        showStatus('Cargando manifest...', 'info');
        const response = await fetch('/api/manifest');
        const data = await response.json();
        
        if (data.error) {
          showStatus('Error: ' + data.error, 'error');
          return;
        }
        
        const editor = document.getElementById('manifest-editor');
        const formatted = JSON.stringify(data, null, 2);
        editor.value = formatted;
        originalContent = formatted;
        showStatus('Manifest cargado correctamente', 'success');
      } catch (error) {
        showStatus('Error al cargar manifest: ' + error.message, 'error');
      }
    }
    
    async function saveManifest() {
      const editor = document.getElementById('manifest-editor');
      const content = editor.value;
      
      // Validar JSON
      try {
        JSON.parse(content);
      } catch (error) {
        showStatus('Error: JSON inválido - ' + error.message, 'error');
        return;
      }
      
      try {
        showLoading(true);
        showStatus('Guardando...', 'info');
        
        const response = await fetch('/api/manifest', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: content
        });
        
        const result = await response.json();
        
        if (result.success) {
          originalContent = content;
          showStatus('✅ Manifest guardado y sincronizado a Google Drive', 'success');
        } else {
          showStatus('Error: ' + (result.error || 'Error desconocido'), 'error');
        }
      } catch (error) {
        showStatus('Error al guardar: ' + error.message, 'error');
      } finally {
        showLoading(false);
      }
    }
    
    function formatJSON() {
      const editor = document.getElementById('manifest-editor');
      try {
        const parsed = JSON.parse(editor.value);
        editor.value = JSON.stringify(parsed, null, 2);
        showStatus('JSON formateado correctamente', 'success');
      } catch (error) {
        showStatus('Error: JSON inválido - ' + error.message, 'error');
      }
    }
    
    function showStatus(message, type) {
      const status = document.getElementById('status');
      status.textContent = message;
      status.className = 'status ' + type;
      status.style.display = 'block';
      
      if (type === 'success') {
        setTimeout(() => {
          status.style.display = 'none';
        }, 5000);
      }
    }
    
    function showLoading(show) {
      document.getElementById('loading').style.display = show ? 'block' : 'none';
    }
    
    // Cargar manifest al iniciar
    loadManifest();
    
    // Advertencia si hay cambios sin guardar
    window.addEventListener('beforeunload', (e) => {
      const editor = document.getElementById('manifest-editor');
      if (editor.value !== originalContent) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  </script>
</body>
</html>`;
  }

  private handleAPI(req: http.IncomingMessage, res: http.ServerResponse): void {
    const parsedUrl = url.parse(req.url || '', true);
    const pathname = parsedUrl.pathname;

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (pathname === '/api/manifest') {
      if (req.method === 'GET') {
        const manifest = this.loadManifest();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(manifest));
      } else if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk.toString();
        });
        req.on('end', () => {
          try {
            const manifest = JSON.parse(body);
            const result = this.saveManifest(manifest);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
          } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
          }
        });
      } else {
        res.writeHead(405);
        res.end('Method not allowed');
      }
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
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
      logger.info(`Config panel server started on port ${this.port}`);
      console.log(`🚀 Panel de Configuración disponible en: http://0.0.0.0:${this.port}`);
      console.log(`📊 Acceso público: http://34.171.12.47:${this.port}`);
    });
  }

  stop(): void {
    if (this.server) {
      this.server.close();
      logger.info('Config panel server stopped');
    }
  }
}

async function main(): Promise<void> {
  const port = parseInt(process.env.CONFIG_PANEL_PORT || '18433', 10);
  const repoRoot = process.env.DENDRITA_REPO_ROOT || '/app/dendrita';
  
  const server = new ConfigPanelServer(port, repoRoot);
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
    logger.error('Failed to start config panel server', error);
    process.exit(1);
  });
}

export { ConfigPanelServer };

