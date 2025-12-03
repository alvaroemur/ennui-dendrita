---
# Template: current_context.md
# Este archivo es parseado automáticamente por update-project-context.ts
# 
# NOTA: Este template se copia como current_context.md (con guión bajo)
# 
# ESTRUCTURA REQUERIDA PARA PARSING:
# - Headers: ## para secciones principales
# - Listas: - o * para items
# - Fechas: ### YYYY-MM-DD dentro de ## SESSION PROGRESS
# - Emojis opcionales: ✅ (completado), 🟡 (en progreso), 📝 (notas)
#
# VARIANTES ACEPTADAS (español/inglés):
# - SESSION PROGRESS / Progreso / Session Progress
# - Estado Actual / Current Status / Status
# - Decisiones / Decisions / Recent Decisions
# - Blockers / Bloqueadores / Obstáculos
# - Próximos Pasos / Next Steps
#
# REFERENCIA: .dendrita/integrations/scripts/pipelines/context-pipeline/update-project-context.ts (líneas 108-190)
---

> **📋 Template basado en:** `.dendrita/templates/workspace-template/project-files/current-context-template.md`
> 
> Para revisar los requisitos de parsing y estructura completa, consulta el template original.

## Estado Actual
<!-- 
  PARSER BUSCA: ## Estado Actual, ## Current Status, o ## Status
  EXTRACCIÓN: Todo el contenido hasta el siguiente ## o ---
  VARIANTES ACEPTADAS: Estado Actual | Current Status | Status
-->
[Descripción del estado actual del proyecto. Esta sección se extrae como currentStatus en el JSON.]

## SESSION PROGRESS
<!-- 
  PARSER BUSCA: ## SESSION PROGRESS, ## Progreso, o ## Session Progress
  EXTRACCIÓN: Cada fecha debe estar en ### YYYY-MM-DD
  EMOJIS OPCIONALES: ✅ (completado), 🟡 (en progreso), 📝 (notas)
  VARIANTES ACEPTADAS: SESSION PROGRESS | Progreso | Session Progress
-->
### 2025-11-06
<!-- 
  FORMATO: ### YYYY-MM-DD (formato de fecha requerido)
  EMOJIS: El parser busca ✅, 🟡, y 📝 para categorizar items
-->
✅ Tarea completada 1
✅ Tarea completada 2
🟡 Tarea en progreso 1
📝 Nota importante sobre el progreso

### 2025-11-05
✅ Tarea completada del día anterior
🟡 Tarea que sigue en progreso

## Decisiones
<!-- 
  PARSER BUSCA: ## Decisiones, ## Decisions, o ## Recent Decisions
  EXTRACCIÓN: Lista con - o * (cada línea debe empezar con - o *)
  FECHA OPCIONAL: Puedes incluir fecha en formato YYYY-MM-DD en el texto
  CONTEXTO OPCIONAL: Puedes incluir "context: [descripción]" en el texto
  VARIANTES ACEPTADAS: Decisiones | Decisions | Recent Decisions
-->
- Decisión 1 tomada el 2025-11-06. Context: Contexto de la decisión.
- Decisión 2 tomada el 2025-11-05
- Decisión 3. Context: Contexto adicional de la decisión.

## Blockers
<!-- 
  PARSER BUSCA: ## Blockers, ## Bloqueadores, o ## Obstáculos
  EXTRACCIÓN: Lista con - o * (cada línea debe empezar con - o *)
  VARIANTES ACEPTADAS: Blockers | Bloqueadores | Obstáculos
-->
- Blocker 1: Descripción del bloqueador
- Blocker 2: Descripción del bloqueador

## Próximos Pasos
<!-- 
  PARSER BUSCA: ## Próximos Pasos o ## Next Steps
  EXTRACCIÓN: Lista con - o * (cada línea debe empezar con - o *)
  VARIANTES ACEPTADAS: Próximos Pasos | Next Steps
-->
- Paso 1 a realizar
- Paso 2 a realizar
- Paso 3 a realizar

---

## Notas sobre el Template

**IMPORTANTE PARA EL PARSING:**
1. **Headers de sección**: Usa `##` para secciones principales
2. **Fechas en SESSION PROGRESS**: Usa `### YYYY-MM-DD` (formato exacto requerido)
3. **Listas**: Usa `-` o `*` para items (Decisiones, Blockers, Próximos Pasos)
4. **Emojis opcionales**: ✅ (completado), 🟡 (en progreso), 📝 (notas) en SESSION PROGRESS
5. **Variantes**: El parser acepta nombres en español o inglés, pero deben coincidir exactamente
6. **Fechas en decisiones**: Puedes incluir fecha en formato YYYY-MM-DD en el texto
7. **Contexto en decisiones**: Puedes incluir "context: [descripción]" en el texto

**REFERENCIA DEL PARSER:**
- Archivo: `.dendrita/integrations/scripts/pipelines/context-pipeline/update-project-context.ts`
- Función: `parseCurrentContext()` (líneas 108-190)
- Si una sección no se encuentra, el parser devuelve estructura vacía pero mantiene `rawContent`

**CONTENIDO NO ESTRUCTURADO:**
- Todo el contenido se guarda en `rawContent` del JSON
- Las secciones estructuradas se extraen adicionalmente en campos específicos
- Puedes agregar cualquier contenido adicional fuera de las secciones requeridas

**SESSION PROGRESS:**
- El parser busca fechas en formato `### YYYY-MM-DD`
- Los emojis ✅, 🟡, y 📝 son opcionales pero ayudan a categorizar
- Si no usas emojis, el parser aún extraerá el contenido pero sin categorización

