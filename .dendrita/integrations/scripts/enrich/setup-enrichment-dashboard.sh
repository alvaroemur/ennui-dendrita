#!/bin/bash
# Script para configurar el dashboard de enriquecimiento en el servidor remoto

set -e

REPO_ROOT="${DENDRITA_REPO_ROOT:-/app/dendrita}"
SERVICE_NAME="dendrita-enrichment-dashboard"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
PORT="${ENRICHMENT_DASHBOARD_PORT:-18434}"

echo "🔧 Configurando dashboard de enriquecimiento de dendrita..."

# Verificar que estamos en el servidor
if [ ! -d "$REPO_ROOT" ]; then
    echo "❌ Error: Directorio $REPO_ROOT no existe"
    exit 1
fi

# Crear archivo de servicio systemd
cat > "$SERVICE_FILE" << EOF
[Unit]
Description=Dendrita Enrichment Dashboard Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$REPO_ROOT
Environment="DENDRITA_REPO_ROOT=$REPO_ROOT"
Environment="ENRICHMENT_DASHBOARD_PORT=$PORT"
ExecStart=/usr/bin/npx ts-node $REPO_ROOT/.dendrita/integrations/scripts/enrich/enrichment-dashboard-server.ts
Restart=always
RestartSec=10
StandardOutput=append:$REPO_ROOT/.dendrita/logs/enrichment-dashboard.log
StandardError=append:$REPO_ROOT/.dendrita/logs/enrichment-dashboard-error.log

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
echo "  tail -f $REPO_ROOT/.dendrita/logs/enrichment-dashboard.log"
echo ""
echo "Dashboard disponible en:"
echo "  http://34.171.12.47:$PORT"

