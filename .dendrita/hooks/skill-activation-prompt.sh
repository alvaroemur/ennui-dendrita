#!/bin/bash
# REFERENCIA DE COMPORTAMIENTO PARA CURSOR
# 
# IMPORTANTE: Este archivo es una REFERENCIA de comportamiento esperado.
# NO es un script ejecutable. Cursor debe LEER este archivo para entender
# el flujo de activación de skills y aplicar el comportamiento documentado
# reflexivamente.
# 
# Comportamiento esperado:
# - Revisar .dendrita/skills/skill-rules.json
# - Comparar el prompt del usuario contra keywords e intentPatterns
# - Identificar skills relevantes
# - Leer SKILL.md correspondiente y aplicar conocimiento contextual
# 
# NO ejecutar este script. Leer y aplicar la lógica documentada.
#
# Mantenido como referencia para futuras implementaciones si se requiere
# ejecución real de hooks.

set -e

cd "$CLAUDE_PROJECT_DIR/.dendrita/hooks"
cat | npx tsx skill-activation-prompt.ts

