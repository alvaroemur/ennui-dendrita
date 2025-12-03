---
# Template: tasks.md
# Este archivo es parseado automáticamente por update-project-context.ts
# 
# ESTRUCTURA REQUERIDA PARA PARSING:
# - Formato de checkbox: - [ ] (pendiente), - [x] (completada), - [~] (bloqueada)
# - También acepta: * [ ] en lugar de - [ ]
# - Metadata opcional en la descripción:
#   - [high], [medium], [low], [urgent] para prioridad
#   - @usuario para asignado
#   - due: YYYY-MM-DD para fecha límite
#
# REFERENCIA: .dendrita/integrations/scripts/pipelines/context-pipeline/update-project-context.ts (líneas 195-285)
---

> **📋 Template basado en:** `.dendrita/templates/workspace-template/project-files/tasks-template.md`
> 
> Para revisar los requisitos de parsing y estructura completa, consulta el template original.

# Tareas del Proyecto

## Fase 1: [Nombre de la Fase]

- [ ] Tarea pendiente 1
- [ ] Tarea pendiente 2 [high] @usuario due: 2025-11-15
- [x] Tarea completada 1
- [~] Tarea bloqueada 1 [urgent] @usuario

## Fase 2: [Nombre de la Fase]

- [ ] Tarea pendiente 3 [medium]
- [ ] Tarea pendiente 4 @usuario
- [x] Tarea completada 2
- [ ] Tarea pendiente 5 due: 2025-12-01

## Tareas Generales

- [ ] Tarea general 1
- [ ] Tarea general 2 [low]
- [x] Tarea general completada

---

## Notas sobre el Template

**IMPORTANTE PARA EL PARSING:**
1. **Formato de checkbox**: Usa `- [ ]` (pendiente), `- [x]` (completada), `- [~]` (bloqueada)
   - También acepta `* [ ]` en lugar de `- [ ]`
2. **Estados de tarea**:
   - `[ ]` = pendiente (pending)
   - `[x]` = completada (completed)
   - `[~]` = bloqueada (blocked)
3. **Metadata opcional en la descripción**:
   - `[high]`, `[medium]`, `[low]`, `[urgent]` para prioridad
   - `@usuario` para asignado
   - `due: YYYY-MM-DD` para fecha límite
4. **Detección de "en progreso"**: El parser detecta tareas "en progreso" si la descripción contiene "in progress" o "en progreso" (case insensitive)

**REFERENCIA DEL PARSER:**
- Archivo: `.dendrita/integrations/scripts/pipelines/context-pipeline/update-project-context.ts`
- Función: `parseTasks()` (líneas 195-285)
- Si el archivo no existe, el parser devuelve arrays vacíos

**EJEMPLOS DE FORMATO:**

```
- [ ] Tarea simple
- [ ] Tarea con prioridad [high]
- [ ] Tarea con asignado @alvaro
- [ ] Tarea con fecha límite due: 2025-11-15
- [ ] Tarea completa [medium] @alvaro due: 2025-11-15
- [x] Tarea completada
- [~] Tarea bloqueada [urgent]
- [ ] Tarea en progreso (el parser detecta "en progreso" en la descripción)
```

**ESTRUCTURA DEL JSON RESULTANTE:**
- `tasks`: Array con todas las tareas
- `completed`: Array con tareas completadas
- `inProgress`: Array con tareas en progreso
- `pending`: Array con tareas pendientes
- `blocked`: Array con tareas bloqueadas

**NOTAS:**
- Los headers `##` son opcionales y solo sirven para organización
- El parser busca el patrón de checkbox en todo el archivo, independientemente de headers
- La metadata (prioridad, asignado, fecha) se extrae de la descripción y luego se elimina del texto
- Si una tarea tiene múltiples prioridades, se usa la primera encontrada

