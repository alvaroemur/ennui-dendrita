---
name: context-system-comparison
description: "Comparación entre work-status-report y context.json"
type: documentation
created: 2025-12-02
updated: 2025-12-02
tags: ["documentation", "context", "comparison"]
category: infrastructure
---

# Comparación: work-status-report vs context.json

Este documento explica las diferencias entre los dos sistemas de contexto en dendrita y cuándo usar cada uno.

---

## Resumen Ejecutivo

| Aspecto | work-status-report | context.json |
|--------|-------------------|--------------|
| **Propósito** | Reporte ejecutivo de estado | Contexto operativo con memorias |
| **Audiencia** | Visualización, reportes, análisis | Búsqueda rápida, continuidad, IA |
| **Formato** | Markdown + JSON | JSON estructurado |
| **Fuente** | `project_context.json` | `project_context.json` + `context-input.md` |
| **Contenido** | Tareas, estadísticas, resumen | Memorias, decisiones, quickReference |
| **Actualización** | On-demand o automática | On-demand o automática |
| **Ubicación** | `.dendrita/dashboards/` | `.dendrita/users/[user-id]/` y `workspaces/[workspace]/` |

---

## work-status-report

### Propósito

**Reporte ejecutivo de estado de trabajo** - Consolida información de todos los proyectos para visualización y análisis.

### Características

- **Formato:** Markdown (legible) + JSON (máquina)
- **Ubicación:** `.dendrita/dashboards/work-status-report.md` y `.json`
- **Fuente de datos:** Lee todos los `project_context.json` de proyectos activos
- **Contenido:**
  - Estadísticas consolidadas (total proyectos, tareas por estado)
  - Listas completas de tareas (pending, inProgress, blocked, completed)
  - Organización por workspace y proyecto
  - Resumen ejecutivo

### Casos de Uso

✅ **Usa work-status-report cuando:**
- Necesitas ver todas las tareas pendientes en un solo lugar
- Quieres estadísticas consolidadas de todos los proyectos
- Necesitas un reporte ejecutivo para compartir o revisar
- Quieres analizar el estado general del trabajo
- Necesitas filtrar por workspace o proyecto específico

### Estructura de Datos

```json
{
  "generatedAt": "2025-12-02T...",
  "summary": {
    "totalProjects": 20,
    "active": 19,
    "paused": 1,
    "totalTasks": {
      "pending": 484,
      "inProgress": 1,
      "blocked": 0
    }
  },
  "byWorkspace": {
    "ennui": {
      "projects": [...]
    }
  },
  "allPendingTasks": [...],
  "allInProgressTasks": [...],
  "allBlockedTasks": [...]
}
```

### Generación

```bash
# Generar reporte completo
tsx .dendrita/integrations/scripts/pipelines/context-pipeline/generate-work-status-report.ts

# Filtrar por workspace
tsx .dendrita/integrations/scripts/pipelines/context-pipeline/generate-work-status-report.ts --workspace ennui
```

---

## context.json

### Propósito

**Contexto operativo con memorias** - Mantiene un contexto unificado con memorias, decisiones y quickReference para búsqueda rápida y continuidad entre sesiones.

### Características

- **Formato:** JSON estructurado
- **Ubicación:** 
  - Usuario: `.dendrita/users/[user-id]/context.json`
  - Workspace: `workspaces/[workspace]/context.json`
- **Fuente de datos:** 
  - `project_context.json` (extrae memorias)
  - `context-input.md` (input manual)
- **Contenido:**
  - Memorias (decisiones, próximos pasos, ideas, tareas relevantes)
  - `quickReference` para búsqueda rápida
  - Enlaces rápidos a proyectos y workspaces
  - Estadísticas de memorias

### Casos de Uso

✅ **Usa context.json cuando:**
- Necesitas buscar información rápidamente (usando quickReference)
- Quieres mantener continuidad entre sesiones
- Necesitas contexto para que la IA entienda tu trabajo
- Quieres recordar decisiones y próximos pasos
- Necesitas filtrar memorias por workspace o proyecto

### Estructura de Datos

```json
{
  "lastUpdate": "2025-12-02T...",
  "type": "user-context",
  "quickReference": {
    "recentMemories": [...],
    "activeWorkspaces": [...],
    "recentFiles": [...],
    "recentTags": [...],
    "quickLinks": {
      "projects": {...},
      "workspaces": {...}
    }
  },
  "memories": [
    {
      "id": "memory-uuid",
      "content": "Memoria corta",
      "metadata": {
        "workspace": "ennui",
        "project": "dendrita-dev",
        "tags": ["task", "project"],
        "relevance": "high",
        "status": "active"
      }
    }
  ],
  "summary": {
    "totalMemories": 150,
    "activeMemories": 120,
    "byWorkspace": {...},
    "byProject": {...}
  }
}
```

### Actualización

```bash
# Actualizar contexto de usuario y workspaces
tsx .dendrita/integrations/scripts/pipelines/context-pipeline/update-context.ts
```

---

## Diferencias Clave

### 1. Propósito

- **work-status-report:** Reporte ejecutivo (qué hay pendiente)
- **context.json:** Contexto operativo (qué recordar, cómo buscar)

### 2. Contenido

- **work-status-report:** Lista todas las tareas con estadísticas
- **context.json:** Memorias relevantes con quickReference

### 3. Formato

- **work-status-report:** Markdown (legible) + JSON (máquina)
- **context.json:** JSON estructurado (solo máquina)

### 4. Uso

- **work-status-report:** Visualización, reportes, análisis
- **context.json:** Búsqueda rápida, continuidad, contexto para IA

---

## Flujo de Datos

```
project_context.json (fuente única de verdad)
    ↓
    ├─→ work-status-report.json
    │   └─→ Consolida tareas y estadísticas
    │
    └─→ context.json (usuario)
        ├─→ Extrae memorias relevantes
        ├─→ Agrega context-input.md
        └─→ Genera quickReference
            ↓
        context.json (workspace)
            └─→ Filtra memorias por workspace
```

---

## Cuándo Actualizar Cada Sistema

### Actualización Completa (Recomendado)

Usa el script maestro para actualizar todo:

```bash
tsx .dendrita/integrations/scripts/pipelines/context-pipeline/sync-all-context.ts
```

Este script ejecuta en orden:
1. `update-project-context.ts` - Actualiza project_context.json
2. `update-context.ts` - Actualiza context.json (usuario y workspace)
3. `generate-work-status-report.ts` - Genera work-status-report

### Actualización Parcial

**Solo reporte (si contextos ya están actualizados):**
```bash
tsx sync-all-context.ts --skip-project-context --skip-user-context
```

**Solo contexto (si reporte no es necesario):**
```bash
tsx sync-all-context.ts --skip-report
```

**Solo un workspace:**
```bash
tsx sync-all-context.ts --workspace ennui
```

---

## Integración entre Sistemas

Ambos sistemas están integrados:

1. **work-status-report** puede referenciar `context.json` para memorias relevantes
2. **context.json** puede referenciar `work-status-report.json` para estadísticas consolidadas

Esta integración permite:
- Ver memorias relevantes en el reporte
- Acceder a estadísticas desde el contexto
- Mantener sincronización entre ambos sistemas

---

## Validación de Sincronización

Usa el script de validación para verificar que ambos sistemas estén sincronizados:

```bash
tsx .dendrita/integrations/scripts/pipelines/context-pipeline/validate-context-sync.ts
```

Este script verifica:
- Que `project_context.json` esté actualizado
- Que `context.json` refleje los cambios de proyectos
- Que `work-status-report.json` esté sincronizado
- Detecta inconsistencias entre sistemas

---

## Referencias

- **Script maestro:** `.dendrita/integrations/scripts/pipelines/context-pipeline/sync-all-context.ts`
- **Hook working-context:** `.dendrita/hooks/working-context.md`
- **Hook dendrita-work-status:** `.dendrita/hooks/dendrita-work-status.md`
- **README del pipeline:** `.dendrita/integrations/scripts/pipelines/context-pipeline/README.md`

---

**Última actualización:** 2025-12-02

