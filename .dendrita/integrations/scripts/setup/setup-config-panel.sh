#!/bin/bash
# Script para configurar el panel de configuración en el servidor remoto

set -e

REPO_ROOT="${DENDRITA_REPO_ROOT:-/app/dendrita}"
SERVICE_NAME="dendrita-config-panel"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
PORT="${CONFIG_PANEL_PORT:-18433}"

echo "🔧 Configurando panel de configuración de dendrita..."

# Verificar que estamos en el servidor
if [ ! -d "$REPO_ROOT" ]; then
    echo "❌ Error: Directorio $REPO_ROOT no existe"
    exit 1
fi

# Crear archivo de servicio systemd
cat > "$SERVICE_FILE" << EOF
[Unit]
Description=Dendrita Config Panel Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$REPO_ROOT
Environment="DENDRITA_REPO_ROOT=$REPO_ROOT"
Environment="CONFIG_PANEL_PORT=$PORT"
ExecStart=/usr/bin/npx ts-node $REPO_ROOT/.dendrita/integrations/scripts/config-panel-server.ts
Restart=always
RestartSec=10
StandardOutput=append:$REPO_ROOT/.dendrita/logs/config-panel.log
StandardError=append:$REPO_ROOT/.dendrita/logs/config-panel-error.log

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
echo "  tail -f $REPO_ROOT/.dendrita/logs/config-panel.log"
echo ""
echo "Panel disponible en:"
echo "  http://34.171.12.47:$PORT"

