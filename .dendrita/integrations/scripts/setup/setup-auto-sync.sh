#!/bin/bash
# Script para configurar sincronización automática con Supabase

set -e

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
SYNC_SCRIPT="$REPO_ROOT/.dendrita/integrations/scripts/sync-all.py"

echo "🔧 Configurando sincronización automática de dendrita con Supabase"
echo ""

# Verificar que el script existe
if [ ! -f "$SYNC_SCRIPT" ]; then
    echo "❌ Error: sync-all.py no encontrado en $SYNC_SCRIPT"
    exit 1
fi

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: python3 no encontrado"
    exit 1
fi

# Verificar .env.local
if [ ! -f "$REPO_ROOT/.dendrita/.env.local" ]; then
    echo "⚠️  Advertencia: .env.local no encontrado"
    echo "   Crea .dendrita/.env.local con SUPABASE_URL y SUPABASE_ANON_KEY"
fi

echo "Selecciona método de sincronización automática:"
echo ""
echo "1) Git Hook (post-commit) - Sincroniza después de cada commit"
echo "2) Cron Job (cada hora) - Sincronización periódica"
echo "3) Watch Script (watchman) - Sincroniza cuando detecta cambios"
echo "4) Solo mostrar comandos (no instalar)"
echo ""
read -p "Opción (1-4): " option

case $option in
    1)
        echo ""
        echo "📦 Configurando Git Hook..."
        cat > "$REPO_ROOT/.git/hooks/post-commit" << EOF
#!/bin/bash
# Sincronizar dendrita con Supabase después de cada commit
cd "$REPO_ROOT"
python3 "$SYNC_SCRIPT" > /dev/null 2>&1 || true
EOF
        chmod +x "$REPO_ROOT/.git/hooks/post-commit"
        echo "✅ Git hook configurado en .git/hooks/post-commit"
        echo ""
        echo "La sincronización se ejecutará automáticamente después de cada commit."
        ;;
    2)
        echo ""
        echo "⏰ Configurando Cron Job..."
        CRON_CMD="0 * * * * cd $REPO_ROOT && python3 $SYNC_SCRIPT >> /tmp/dendrita-sync.log 2>&1"
        (crontab -l 2>/dev/null | grep -v "dendrita-sync"; echo "$CRON_CMD") | crontab -
        echo "✅ Cron job configurado (cada hora)"
        echo ""
        echo "Logs: tail -f /tmp/dendrita-sync.log"
        ;;
    3)
        echo ""
        if ! command -v watchman &> /dev/null; then
            echo "⚠️  watchman no encontrado"
            echo "   Instala con: brew install watchman (Mac) o apt-get install watchman (Linux)"
            exit 1
        fi
        echo "👀 Configurando Watch Script..."
        watchman watch "$REPO_ROOT"
        watchman -- trigger "$REPO_ROOT" dendrita-sync '**/*.md' -- python3 "$SYNC_SCRIPT"
        echo "✅ Watch script configurado"
        echo ""
        echo "La sincronización se ejecutará cuando detecte cambios en archivos .md"
        ;;
    4)
        echo ""
        echo "📋 Comandos para configurar manualmente:"
        echo ""
        echo "# Git Hook:"
        echo "cat > .git/hooks/post-commit << 'EOF'"
        echo "#!/bin/bash"
        echo "cd \"$REPO_ROOT\""
        echo "python3 \"$SYNC_SCRIPT\" > /dev/null 2>&1 || true"
        echo "EOF"
        echo "chmod +x .git/hooks/post-commit"
        echo ""
        echo "# Cron Job (cada hora):"
        echo "crontab -e"
        echo "# Agregar:"
        echo "0 * * * * cd $REPO_ROOT && python3 $SYNC_SCRIPT >> /tmp/dendrita-sync.log 2>&1"
        echo ""
        echo "# Watch Script:"
        echo "watchman watch ."
        echo "watchman -- trigger . dendrita-sync '**/*.md' -- python3 $SYNC_SCRIPT"
        ;;
    *)
        echo "❌ Opción inválida"
        exit 1
        ;;
esac

echo ""
echo "✅ Configuración completada!"
echo ""
echo "Para probar manualmente:"
echo "  python3 $SYNC_SCRIPT"

