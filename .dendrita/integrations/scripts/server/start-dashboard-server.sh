#!/bin/bash
# Script para iniciar el servidor del dashboard de Cursor en el servidor remoto

cd /srv/cursor-dashboard

# Verificar si el servidor ya está corriendo
if pgrep -f "python3.*server.py" > /dev/null; then
    echo "⚠️  El servidor ya está corriendo"
    echo "PID: $(pgrep -f 'python3.*server.py')"
    exit 1
fi

# Iniciar el servidor en segundo plano
echo "🚀 Iniciando servidor del dashboard de Cursor..."
nohup python3 server.py > server.log 2>&1 &

# Esperar un momento para verificar que se inició
sleep 2

# Verificar que está corriendo
if pgrep -f "python3.*server.py" > /dev/null; then
    echo "✅ Servidor iniciado correctamente"
    echo "📍 Dashboard disponible en: http://34.171.12.47:18432/"
    echo "📄 JSON disponible en: http://34.171.12.47:18432/latest.json"
    echo "📋 Logs: /srv/cursor-dashboard/server.log"
    echo ""
    echo "Para detener el servidor:"
    echo "  pkill -f 'python3.*server.py'"
else
    echo "❌ Error al iniciar el servidor"
    echo "Revisa los logs: tail -f /srv/cursor-dashboard/server.log"
    exit 1
fi
