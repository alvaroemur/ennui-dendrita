#!/bin/bash
# Script para configurar la ejecución automática cada 24 horas
# Este script configura un cron job o launchd (macOS) para ejecutar la identificación diariamente

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
SCRIPT_PATH="$PROJECT_DIR/.dendrita/integrations/scripts/utils/archive-tools/run-identify.sh"

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Configurando ejecución automática cada 24 horas...${NC}\n"

# Detectar sistema operativo
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - usar launchd
    echo -e "${GREEN}Detectado macOS - Configurando con launchd${NC}"
    
    PLIST_NAME="com.dendrita.debug-identify"
    PLIST_PATH="$HOME/Library/LaunchAgents/${PLIST_NAME}.plist"
    
    # Crear el plist
    cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${PLIST_NAME}</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>${SCRIPT_PATH}</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>2</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>RunAtLoad</key>
    <false/>
    <key>StandardOutPath</key>
    <string>${PROJECT_DIR}/.dendrita/integrations/scripts/utils/archive-tools/.archived/logs/identify.log</string>
    <key>StandardErrorPath</key>
    <string>${PROJECT_DIR}/.dendrita/integrations/scripts/utils/archive-tools/.archived/logs/identify-error.log</string>
    <key>WorkingDirectory</key>
    <string>${PROJECT_DIR}</string>
</dict>
</plist>
EOF
    
    # Crear directorio de logs si no existe
    mkdir -p "${PROJECT_DIR}/.dendrita/integrations/scripts/utils/archive-tools/.archived/logs"
    
    # Cargar el job
    launchctl unload "$PLIST_PATH" 2>/dev/null || true
    launchctl load "$PLIST_PATH"
    
    echo -e "${GREEN}✅ Configurado para ejecutarse diariamente a las 2:00 AM${NC}"
    echo -e "   Plist: ${PLIST_PATH}"
    echo -e "   Logs: ${PROJECT_DIR}/.dendrita/integrations/scripts/utils/archive-tools/.archived/logs/"
    echo -e "\n${YELLOW}Para deshabilitar:${NC}"
    echo -e "   launchctl unload ${PLIST_PATH}"
    echo -e "\n${YELLOW}Para ver el estado:${NC}"
    echo -e "   launchctl list | grep ${PLIST_NAME}"
    
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux - usar cron
    echo -e "${GREEN}Detectado Linux - Configurando con cron${NC}"
    
    # Crear directorio de logs si no existe
    mkdir -p "${PROJECT_DIR}/.dendrita/integrations/scripts/utils/archive-tools/.archived/logs"
    
    # Crear entrada de cron
    CRON_ENTRY="0 2 * * * /bin/bash ${SCRIPT_PATH} >> ${PROJECT_DIR}/.dendrita/integrations/scripts/utils/archive-tools/.archived/logs/identify.log 2>&1"
    
    # Verificar si ya existe
    if crontab -l 2>/dev/null | grep -q "${SCRIPT_PATH}"; then
        echo -e "${YELLOW}⚠️  Ya existe una entrada de cron para este script${NC}"
        echo -e "   Para actualizar, ejecuta manualmente:"
        echo -e "   crontab -e"
        echo -e "   Y agrega: ${CRON_ENTRY}"
    else
        # Agregar al crontab
        (crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -
        echo -e "${GREEN}✅ Configurado para ejecutarse diariamente a las 2:00 AM${NC}"
        echo -e "   Logs: ${PROJECT_DIR}/.dendrita/integrations/scripts/utils/archive-tools/.archived/logs/identify.log"
        echo -e "\n${YELLOW}Para ver crontab:${NC}"
        echo -e "   crontab -l"
        echo -e "\n${YELLOW}Para editar:${NC}"
        echo -e "   crontab -e"
    fi
    
else
    echo -e "${YELLOW}⚠️  Sistema operativo no soportado automáticamente: $OSTYPE${NC}"
    echo -e "\n${YELLOW}Configuración manual:${NC}"
    echo -e "   Agrega esta línea a tu crontab o scheduler:"
    echo -e "   0 2 * * * /bin/bash ${SCRIPT_PATH}"
    echo -e "   Esto ejecutará el script diariamente a las 2:00 AM"
fi

echo -e "\n${GREEN}✅ Configuración completada${NC}"
