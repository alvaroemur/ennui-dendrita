#!/bin/bash
# Script para actualizar los puertos en el servidor remoto

echo "🔧 Actualizando puertos en el servidor remoto..."

# Actualizar server.py en el servidor
ssh dev "cat > /srv/cursor-dashboard/server.py << 'EOFPYTHON'
#!/usr/bin/env python3
\"\"\"
Servidor HTTP simple para servir dashboards
Sirve archivos estáticos y el último análisis JSON
\"\"\"

import http.server
import socketserver
import os
import json
from pathlib import Path
from datetime import datetime

PORT = 18432

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    \"\"\"Handler con soporte CORS para permitir acceso desde cualquier origen\"\"\"
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory='/srv/cursor-dashboard', **kwargs)
    
    def end_headers(self):
        \"\"\"Agregar headers CORS a todas las respuestas\"\"\"
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_OPTIONS(self):
        \"\"\"Manejar preflight requests\"\"\"
        self.send_response(200)
        self.end_headers()
    
    def do_GET(self):
        \"\"\"Manejar requests GET\"\"\"
        # Si es la raíz, servir dashboard.html (Cursor)
        if self.path == '/' or self.path == '':
            self.path = '/dashboard.html'
        
        # Si es /maestro, servir dashboard-maestro.html
        if self.path == '/maestro' or self.path == '/maestro/':
            self.path = '/dashboard-maestro.html'
        
        # Si es /latest.json, servir el archivo latest.json
        if self.path == '/latest.json':
            self.path = '/latest.json'
        
        # Llamar al handler padre
        return super().do_GET()
    
    def log_message(self, format, *args):
        \"\"\"Log personalizado con timestamp\"\"\"
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f'[{timestamp}] {format % args}')

def main():
    \"\"\"Función principal\"\"\"
    # Verificar que el directorio existe
    dashboard_dir = Path('/srv/cursor-dashboard')
    if not dashboard_dir.exists():
        print(f'Error: El directorio {dashboard_dir} no existe')
        return
    
    # Cambiar al directorio del dashboard
    os.chdir('/srv/cursor-dashboard')
    
    # Crear servidor
    with socketserver.TCPServer(('', PORT), CORSRequestHandler) as httpd:
        print(f'🚀 Servidor iniciado en http://0.0.0.0:{PORT}')
        print(f'📊 Dashboard Cursor: http://[IP-DEL-SERVIDOR]:{PORT}/')
        print(f'📊 Dashboard Maestro: http://[IP-DEL-SERVIDOR]:{PORT}/maestro')
        print(f'📄 JSON disponible en: http://[IP-DEL-SERVIDOR]:{PORT}/latest.json')
        print(f'📁 Sirviendo archivos desde: {dashboard_dir}')
        print(f'\n⚠️  Presiona Ctrl+C para detener el servidor\n')
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\n\n🛑 Deteniendo servidor...')
            httpd.shutdown()

if __name__ == '__main__':
    main()
EOFPYTHON
"

# Actualizar start-dashboard-server.sh en el servidor
ssh dev "cat > /srv/cursor-dashboard/start-dashboard-server.sh << 'EOFBASH'
#!/bin/bash
# Script para iniciar el servidor del dashboard de Cursor en el servidor remoto

cd /srv/cursor-dashboard

# Verificar si el servidor ya está corriendo
if pgrep -f \"python3.*server.py\" > /dev/null; then
    echo \"⚠️  El servidor ya está corriendo\"
    echo \"PID: \$(pgrep -f 'python3.*server.py')\"
    exit 1
fi

# Iniciar el servidor en segundo plano
echo \"🚀 Iniciando servidor del dashboard de Cursor...\"
nohup python3 server.py > server.log 2>&1 &

# Esperar un momento para verificar que se inició
sleep 2

# Verificar que está corriendo
if pgrep -f \"python3.*server.py\" > /dev/null; then
    echo \"✅ Servidor iniciado correctamente\"
    echo \"📍 Dashboard disponible en: http://34.171.12.47:18432/\"
    echo \"📄 JSON disponible en: http://34.171.12.47:18432/latest.json\"
    echo \"📋 Logs: /srv/cursor-dashboard/server.log\"
    echo \"\"
    echo \"Para detener el servidor:\"
    echo \"  pkill -f 'python3.*server.py'\"
else
    echo \"❌ Error al iniciar el servidor\"
    echo \"Revisa los logs: tail -f /srv/cursor-dashboard/server.log\"
    exit 1
fi
EOFBASH
chmod +x /srv/cursor-dashboard/start-dashboard-server.sh
"

echo "✅ Puertos actualizados en el servidor remoto"
echo ""
echo "Puertos configurados:"
echo "  - Dashboard: 18432"
echo "  - Panel de Configuración: 18433"
echo ""
echo "Para reiniciar el servidor del dashboard:"
echo "  ssh dev 'cd /srv/cursor-dashboard && ./start-dashboard-server.sh'"

