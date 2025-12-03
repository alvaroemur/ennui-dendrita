#!/bin/bash
# Script para subir el último JSON de análisis al servidor remoto

# Configuración
SERVER_HOST="dev"
REMOTE_PATH="/srv/cursor-dashboard/latest.json"
LOCAL_JSON_PATH="_clippings/_imported-manually/usage-events-2025-11-06_analysis.json"

# Verificar si existe el archivo local
if [ ! -f "$LOCAL_JSON_PATH" ]; then
    echo "❌ No se encontró el archivo: $LOCAL_JSON_PATH"
    echo ""
    echo "💡 Primero ejecuta:"
    echo "   python3 analyze_latest_cursor_usage.py"
    exit 1
fi

# Intentar encontrar el JSON más reciente
if [ -f "_clippings/_imported-manually/latest.json" ]; then
    # Leer la ruta del análisis desde latest.json
    ANALYSIS_FILE=$(grep -o '"_clippings/_imported-manually/[^"]*_analysis.json"' _clippings/_imported-manually/latest.json | tr -d '"')
    if [ -n "$ANALYSIS_FILE" ] && [ -f "$ANALYSIS_FILE" ]; then
        LOCAL_JSON_PATH="$ANALYSIS_FILE"
        echo "📄 Usando el análisis más reciente: $LOCAL_JSON_PATH"
    fi
fi

echo "📤 Subiendo JSON al servidor remoto..."
echo "   Archivo local: $LOCAL_JSON_PATH"
echo "   Servidor: $SERVER_HOST"
echo "   Ruta remota: $REMOTE_PATH"

# Subir el archivo
scp "$LOCAL_JSON_PATH" "$SERVER_HOST:$REMOTE_PATH"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ JSON subido correctamente"
    echo "📍 Dashboard disponible en: http://34.171.12.47:8000/"
    echo ""
    echo "💡 El dashboard se actualizará automáticamente al recargar la página"
else
    echo ""
    echo "❌ Error al subir el archivo"
    exit 1
fi

