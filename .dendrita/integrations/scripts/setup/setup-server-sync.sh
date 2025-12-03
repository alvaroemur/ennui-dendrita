#!/bin/bash
# Script para configurar el servicio de sincronización en el servidor remoto

set -e

REPO_ROOT="${DENDRITA_REPO_ROOT:-/app/dendrita}"
SERVICE_NAME="dendrita-sync-watcher"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

echo "🔧 Configurando servicio de sincronización de dendrita..."

# Verificar que estamos en el servidor
if [ ! -d "$REPO_ROOT" ]; then
    echo "❌ Error: Directorio $REPO_ROOT no existe"
    exit 1
fi

# Crear archivo de servicio systemd
cat > "$SERVICE_FILE" << EOF
[Unit]
Description=Dendrita Sync Watcher Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$REPO_ROOT
Environment="DENDRITA_REPO_ROOT=$REPO_ROOT"
ExecStart=/usr/bin/npx ts-node $REPO_ROOT/.dendrita/integrations/scripts/server-sync-watcher.ts
Restart=always
RestartSec=10
StandardOutput=append:$REPO_ROOT/.dendrita/logs/sync-watcher.log
StandardError=append:$REPO_ROOT/.dendrita/logs/sync-watcher-error.log

[Install]
WantedBy=multi-user.target
EOF

# Recargar systemd
systemctl daemon-reload

# Habilitar servicio
systemctl enable $SERVICE_NAME

echo "✅ Servicio configurado: $SERVICE_NAME"
echo ""
echo "Para iniciar el servicio:"
echo "  sudo systemctl start $SERVICE_NAME"
echo ""
echo "Para ver el estado:"
echo "  sudo systemctl status $SERVICE_NAME"
echo ""
echo "Para ver los logs:"
echo "  tail -f $REPO_ROOT/.dendrita/logs/sync-watcher.log"

