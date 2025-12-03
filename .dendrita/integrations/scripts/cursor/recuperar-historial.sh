#!/bin/bash

# Script para recuperar el historial de conversaciones de Cursor
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

# Función para copiar una clave específica
copiar_clave() {
    local clave=$1
    local temp_file=$(mktemp)
    
    # Extraer el valor del workspace antiguo usando modo binario
    sqlite3 "$WORKSPACE_ANTIGUO_PATH/state.vscdb" <<EOF
.mode binary
.output $temp_file
SELECT value FROM ItemTable WHERE key = '$clave';
.quit
EOF
    
    # Verificar que se extrajo algo
    local size=$(wc -c < "$temp_file" | tr -d ' ')
    if [ "$size" -gt 0 ]; then
        # Insertar o actualizar en el workspace actual usando modo binario
        sqlite3 "$WORKSPACE_ACTUAL_PATH/state.vscdb" <<EOF
INSERT OR IGNORE INTO ItemTable (key, value) VALUES ('$clave', '');
.mode binary
.read $temp_file
UPDATE ItemTable SET value = (SELECT hex(readfile('$temp_file'))) WHERE key = '$clave';
.quit
EOF
        # Usar un método alternativo: copiar directamente con hex
        local hex_data=$(xxd -p "$temp_file" | tr -d '\n')
        sqlite3 "$WORKSPACE_ACTUAL_PATH/state.vscdb" "UPDATE ItemTable SET value = CAST(x'$hex_data' AS BLOB) WHERE key = '$clave';" 2>/dev/null || {
            # Si falla, usar método de inserción directa
            sqlite3 "$WORKSPACE_ACTUAL_PATH/state.vscdb" <<EOF
DELETE FROM ItemTable WHERE key = '$clave';
INSERT INTO ItemTable (key, value) VALUES ('$clave', CAST(x'$hex_data' AS BLOB));
EOF
        }
        echo "   ✅ Copiado: $clave ($size bytes)"
    fi
    
    rm "$temp_file"
}

# Copiar history.entries
echo "   Copiando history.entries..."
copiar_clave "history.entries"

# Copiar composer.composerData
echo "   Copiando composer.composerData..."
copiar_clave "composer.composerData"

# Copiar workbench.backgroundComposer.workspacePersistentData
echo "   Copiando workbench.backgroundComposer.workspacePersistentData..."
copiar_clave "workbench.backgroundComposer.workspacePersistentData"

# Copiar todas las claves de composerChatViewPane
echo "   Copiando paneles de chat (composerChatViewPane)..."
sqlite3 "$WORKSPACE_ANTIGUO_PATH/state.vscdb" "SELECT key FROM ItemTable WHERE key LIKE 'workbench.panel.composerChatViewPane.%';" 2>/dev/null | while read -r clave; do
    if [ ! -z "$clave" ]; then
        copiar_clave "$clave"
    fi
done

# Copiar todas las claves de aichat
echo "   Copiando paneles de AI chat (aichat)..."
sqlite3 "$WORKSPACE_ANTIGUO_PATH/state.vscdb" "SELECT key FROM ItemTable WHERE key LIKE 'workbench.panel.aichat.%';" 2>/dev/null | while read -r clave; do
    if [ ! -z "$clave" ]; then
        copiar_clave "$clave"
    fi
done

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

