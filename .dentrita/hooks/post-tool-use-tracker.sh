#!/bin/bash
# REFERENCIA DE COMPORTAMIENTO PARA CURSOR
# 
# IMPORTANTE: Este archivo es una REFERENCIA de comportamiento esperado.
# NO es un script ejecutable. Cursor debe LEER este archivo para entender
# la lógica de rastreo de contexto y aplicar el comportamiento documentado
# reflexivamente.
# 
# Comportamiento esperado:
# - Después de editar un archivo (Edit, Write, MultiEdit), identificar el contexto
# - El contexto se identifica basado en la ruta del archivo:
#   - empresas/[empresa]/proyectos-activos/[proyecto]/ → Proyecto activo
#   - mejores-practicas/[tipo-proyecto]/ → Mejores prácticas
#   - modos-trabajo/[modo].md → Modo de trabajo
# - Mantener registro del contexto afectado
# - Considerar este contexto para futuras acciones relacionadas
# 
# NO ejecutar este script. Leer y aplicar la lógica documentada.
#
# Mantenido como referencia para futuras implementaciones si se requiere
# ejecución real de hooks.

set -e

# Post-tool-use hook that tracks edited files and project context
# This runs after Edit, MultiEdit, or Write tools complete successfully

# Read tool information from stdin
tool_info=$(cat)

# Extract relevant data
tool_name=$(echo "$tool_info" | jq -r '.tool_name // empty')
file_path=$(echo "$tool_info" | jq -r '.tool_input.file_path // empty')
session_id=$(echo "$tool_info" | jq -r '.session_id // empty')

# Skip if not an edit tool or no file path
if [[ ! "$tool_name" =~ ^(Edit|MultiEdit|Write)$ ]] || [[ -z "$file_path" ]]; then
    exit 0  # Exit 0 for skip conditions
fi

# Create cache directory in project
cache_dir="$CLAUDE_PROJECT_DIR/.dentrita/cache/${session_id:-default}"
mkdir -p "$cache_dir"

# Function to detect project context from file path
detect_context() {
    local file="$1"
    local project_root="$CLAUDE_PROJECT_DIR"

    # Remove project root from path
    local relative_path="${file#$project_root/}"

    # Extract first directory component
    local context=$(echo "$relative_path" | cut -d'/' -f1)

    # Project structure patterns for ennui-dendrita
    case "$context" in
        proyectos-activos|proyectos-archivo)
            # For projects, get the project name
            local project=$(echo "$relative_path" | cut -d'/' -f2)
            if [[ -n "$project" ]]; then
                echo "proyecto:$project"
            else
                echo "$context"
            fi
            ;;
        mejores-practicas)
            local practice=$(echo "$relative_path" | cut -d'/' -f2)
            if [[ -n "$practice" ]]; then
                echo "practica:$practice"
            else
                echo "$context"
            fi
            ;;
        modos-trabajo|gestion-empresa|aliados-stakeholders|herramientas-plantillas|referencias)
            echo "$context"
            ;;
        *)
            # Check if it's a config file
            if [[ "$relative_path" =~ ^\.dentrita/ ]]; then
                echo "config"
            else
                echo "root"
            fi
            ;;
    esac
}

# Detect context
context=$(detect_context "$file_path")

# Skip if unknown context
if [[ "$context" == "unknown" ]] || [[ -z "$context" ]]; then
    exit 0  # Exit 0 for skip conditions
fi

# Log edited file
echo "$(date +%s):$file_path:$context" >> "$cache_dir/edited-files.log"

# Update affected contexts list
if ! grep -q "^$context$" "$cache_dir/affected-contexts.txt" 2>/dev/null; then
    echo "$context" >> "$cache_dir/affected-contexts.txt"
fi

# Exit cleanly
exit 0

