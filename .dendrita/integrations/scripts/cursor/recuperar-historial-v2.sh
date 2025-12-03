#!/bin/bash

# Script para recuperar el historial de conversaciones de Cursor
# desde el workspace antiguo al actual (versión mejorada)

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
    echo "❌ Error: No se encuentra el workspace antiguo: $WORKSPACE_ANTIGUO_PATH"
    exit 1
fi

if [ ! -d "$WORKSPACE_ACTUAL_PATH" ]; then
    echo "❌ Error: No se encuentra el workspace actual: $WORKSPACE_ACTUAL_PATH"
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
echo "📊 Estado actual:"
echo "   Workspace antiguo: $WORKSPACE_ANTIGUO"
ANTIGUO_SIZE=$(sqlite3 "$WORKSPACE_ANTIGUO_PATH/state.vscdb" "SELECT LENGTH(value) FROM ItemTable WHERE key = 'history.entries';" 2>/dev/null || echo "0")
echo "   Historial antiguo: $ANTIGUO_SIZE bytes"

echo "   Workspace actual: $WORKSPACE_ACTUAL"
ACTUAL_SIZE=$(sqlite3 "$WORKSPACE_ACTUAL_PATH/state.vscdb" "SELECT LENGTH(value) FROM ItemTable WHERE key = 'history.entries';" 2>/dev/null || echo "0")
echo "   Historial actual: $ACTUAL_SIZE bytes"

if [ "$ANTIGUO_SIZE" -lt 100 ]; then
    echo "❌ Error: El historial antiguo parece estar vacío o no existe."
    exit 1
fi

echo ""
echo "💾 Creando backup del estado actual..."
BACKUP_FILE="$WORKSPACE_ACTUAL_PATH/state.vscdb.backup-$(date +%Y%m%d-%H%M%S)"
cp "$WORKSPACE_ACTUAL_PATH/state.vscdb" "$BACKUP_FILE"
echo "   Backup creado: $(basename $BACKUP_FILE)"

echo ""
echo "📥 Copiando historial y datos de conversaciones desde el workspace antiguo..."

# Crear script Python temporal para copiar datos binarios
PYTHON_SCRIPT=$(mktemp)
cat > "$PYTHON_SCRIPT" <<'PYTHON_EOF'
import sqlite3
import sys

workspace_antiguo = sys.argv[1]
workspace_actual = sys.argv[2]
clave = sys.argv[3]

# Conectar a ambas bases de datos
conn_antiguo = sqlite3.connect(workspace_antiguo)
conn_actual = sqlite3.connect(workspace_actual)

# Obtener el valor del workspace antiguo
cursor_antiguo = conn_antiguo.cursor()
cursor_antiguo.execute("SELECT value FROM ItemTable WHERE key = ?", (clave,))
result = cursor_antiguo.fetchone()

if result and result[0]:
    valor = result[0]
    size = len(valor) if isinstance(valor, bytes) else len(str(valor).encode())
    
    # Insertar o actualizar en el workspace actual
    cursor_actual = conn_actual.cursor()
    cursor_actual.execute("INSERT OR IGNORE INTO ItemTable (key, value) VALUES (?, '')", (clave,))
    
    # Actualizar con el valor
    if isinstance(valor, bytes):
        cursor_actual.execute("UPDATE ItemTable SET value = ? WHERE key = ?", (valor, clave))
    else:
        cursor_actual.execute("UPDATE ItemTable SET value = ? WHERE key = ?", (valor, clave))
    
    conn_actual.commit()
    print(f"✅ Copiado: {clave} ({size} bytes)")
else:
    print(f"⚠️  No se encontró: {clave}")

conn_antiguo.close()
conn_actual.close()
PYTHON_EOF

# Copiar history.entries
echo "   Copiando history.entries..."
python3 "$PYTHON_SCRIPT" "$WORKSPACE_ANTIGUO_PATH/state.vscdb" "$WORKSPACE_ACTUAL_PATH/state.vscdb" "history.entries"

# Copiar composer.composerData
echo "   Copiando composer.composerData..."
python3 "$PYTHON_SCRIPT" "$WORKSPACE_ANTIGUO_PATH/state.vscdb" "$WORKSPACE_ACTUAL_PATH/state.vscdb" "composer.composerData"

# Copiar workbench.backgroundComposer.workspacePersistentData
echo "   Copiando workbench.backgroundComposer.workspacePersistentData..."
python3 "$PYTHON_SCRIPT" "$WORKSPACE_ANTIGUO_PATH/state.vscdb" "$WORKSPACE_ACTUAL_PATH/state.vscdb" "workbench.backgroundComposer.workspacePersistentData"

# Copiar todas las claves de composerChatViewPane (solo las más importantes)
echo "   Copiando paneles de chat (composerChatViewPane)..."
sqlite3 "$WORKSPACE_ANTIGUO_PATH/state.vscdb" "SELECT key FROM ItemTable WHERE key LIKE 'workbench.panel.composerChatViewPane.%' AND key NOT LIKE '%.numberOfVisibleViews';" 2>/dev/null | while read -r clave; do
    if [ ! -z "$clave" ]; then
        python3 "$PYTHON_SCRIPT" "$WORKSPACE_ANTIGUO_PATH/state.vscdb" "$WORKSPACE_ACTUAL_PATH/state.vscdb" "$clave" 2>/dev/null || true
    fi
done | head -20

# Limpiar script temporal
rm "$PYTHON_SCRIPT"

# Verificar que se copió correctamente
NUEVO_SIZE=$(sqlite3 "$WORKSPACE_ACTUAL_PATH/state.vscdb" "SELECT LENGTH(value) FROM ItemTable WHERE key = 'history.entries';" 2>/dev/null || echo "0")

echo ""
echo "✅ Historial recuperado exitosamente!"
echo "   Tamaño anterior: $ACTUAL_SIZE bytes"
echo "   Tamaño nuevo: $NUEVO_SIZE bytes"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Abre Cursor"
echo "   2. Abre el workspace ennui-dendrita"
echo "   3. Verifica que el historial de conversaciones esté disponible"
echo ""
echo "💡 Si algo sale mal, puedes restaurar el backup:"
echo "   cp \"$BACKUP_FILE\" \"$WORKSPACE_ACTUAL_PATH/state.vscdb\""

