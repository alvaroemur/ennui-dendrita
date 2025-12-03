#!/bin/bash

# Script para recuperar TODAS las conversaciones de Cursor
# desde el workspace antiguo al actual

set -e

# Rutas
WORKSPACE_ANTIGUO="ff0fee52e02227a04424082fc40cd686"
WORKSPACE_ACTUAL="3a97edeaeeb28a2061d5a09bfa29e561"
CURSOR_STORAGE="$HOME/Library/Application Support/Cursor/User/workspaceStorage"

WORKSPACE_ANTIGUO_PATH="$CURSOR_STORAGE/$WORKSPACE_ANTIGUO"
WORKSPACE_ACTUAL_PATH="$CURSOR_STORAGE/$WORKSPACE_ACTUAL"

echo "🔍 Verificando ubicaciones..."

# Verificar que existen las carpetas
if [ ! -d "$WORKSPACE_ANTIGUO_PATH" ]; then
    echo "❌ Error: No se encuentra el workspace antiguo"
    exit 1
fi

if [ ! -d "$WORKSPACE_ACTUAL_PATH" ]; then
    echo "❌ Error: No se encuentra el workspace actual"
    exit 1
fi

# Verificar que Cursor no está abierto
if pgrep -x "Cursor" > /dev/null; then
    echo "⚠️  ADVERTENCIA: Cursor parece estar abierto."
    echo "   Por favor, cierra Cursor antes de continuar."
    read -p "¿Deseas continuar de todas formas? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "💾 Creando backup del estado actual..."
BACKUP_FILE="$WORKSPACE_ACTUAL_PATH/state.vscdb.backup-$(date +%Y%m%d-%H%M%S)"
cp "$WORKSPACE_ACTUAL_PATH/state.vscdb" "$BACKUP_FILE"
echo "   Backup creado: $(basename $BACKUP_FILE)"

echo ""
echo "📥 Copiando TODAS las conversaciones desde el workspace antiguo..."

# Crear script Python para copiar datos binarios
PYTHON_SCRIPT=$(mktemp)
cat > "$PYTHON_SCRIPT" <<'PYTHON_EOF'
import sqlite3
import sys

workspace_antiguo = sys.argv[1]
workspace_actual = sys.argv[2]
clave = sys.argv[3]

try:
    conn_antiguo = sqlite3.connect(workspace_antiguo)
    conn_actual = sqlite3.connect(workspace_actual)
    
    cursor_antiguo = conn_antiguo.cursor()
    cursor_antiguo.execute("SELECT value FROM ItemTable WHERE key = ?", (clave,))
    result = cursor_antiguo.fetchone()
    
    if result and result[0]:
        valor = result[0]
        size = len(valor) if isinstance(valor, bytes) else len(str(valor).encode())
        
        cursor_actual = conn_actual.cursor()
        cursor_actual.execute("INSERT OR IGNORE INTO ItemTable (key, value) VALUES (?, '')", (clave,))
        cursor_actual.execute("UPDATE ItemTable SET value = ? WHERE key = ?", (valor, clave))
        conn_actual.commit()
        
        print(f"✅ {clave} ({size} bytes)")
        sys.exit(0)
    else:
        sys.exit(1)
except Exception as e:
    print(f"❌ Error copiando {clave}: {e}", file=sys.stderr)
    sys.exit(1)
finally:
    if 'conn_antiguo' in locals():
        conn_antiguo.close()
    if 'conn_actual' in locals():
        conn_actual.close()
PYTHON_EOF

# Copiar composer.composerData (contiene la lista de todos los compositores)
echo "   Copiando composer.composerData..."
python3 "$PYTHON_SCRIPT" "$WORKSPACE_ANTIGUO_PATH/state.vscdb" "$WORKSPACE_ACTUAL_PATH/state.vscdb" "composer.composerData"

# Copiar TODOS los paneles de composerChatViewPane (sin limitación)
echo "   Copiando TODOS los paneles de chat (composerChatViewPane)..."
TOTAL=0
sqlite3 "$WORKSPACE_ANTIGUO_PATH/state.vscdb" "SELECT key FROM ItemTable WHERE key LIKE 'workbench.panel.composerChatViewPane.%' AND key NOT LIKE '%.numberOfVisibleViews' AND key NOT LIKE '%.hidden';" 2>/dev/null | while read -r clave; do
    if [ ! -z "$clave" ]; then
        python3 "$PYTHON_SCRIPT" "$WORKSPACE_ANTIGUO_PATH/state.vscdb" "$WORKSPACE_ACTUAL_PATH/state.vscdb" "$clave" 2>/dev/null || true
        TOTAL=$((TOTAL + 1))
    fi
done

# Copiar workbench.backgroundComposer.workspacePersistentData
echo "   Copiando workbench.backgroundComposer.workspacePersistentData..."
python3 "$PYTHON_SCRIPT" "$WORKSPACE_ANTIGUO_PATH/state.vscdb" "$WORKSPACE_ACTUAL_PATH/state.vscdb" "workbench.backgroundComposer.workspacePersistentData"

# Copiar history.entries
echo "   Copiando history.entries..."
python3 "$PYTHON_SCRIPT" "$WORKSPACE_ANTIGUO_PATH/state.vscdb" "$WORKSPACE_ACTUAL_PATH/state.vscdb" "history.entries"

# Limpiar script temporal
rm "$PYTHON_SCRIPT"

echo ""
echo "✅ Proceso completado!"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Cierra Cursor completamente"
echo "   2. Abre Cursor nuevamente"
echo "   3. Abre el workspace ennui-dendrita"
echo "   4. Verifica que el historial de conversaciones esté disponible"
echo ""
echo "💡 Si algo sale mal, puedes restaurar el backup:"
echo "   cp \"$BACKUP_FILE\" \"$WORKSPACE_ACTUAL_PATH/state.vscdb\""

