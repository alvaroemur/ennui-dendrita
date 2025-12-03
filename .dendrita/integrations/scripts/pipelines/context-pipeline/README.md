---
name: context-pipeline-readme
description: "Context Pipeline - README"
type: documentation
created: 2025-12-02
updated: 2025-12-02
tags: ["documentation", "context", "pipeline"]
category: infrastructure
---

# Context Pipeline

Sistema de pipeline para mantener contextos unificados y reportes de estado de trabajo en dendrita.

---

## Visión General

El context pipeline mantiene tres niveles de contexto:

1. **Project Context** (`project_context.json`) - Contexto granular de cada proyecto
2. **User/Workspace Context** (`context.json`) - Contexto unificado con memorias
3. **Work Status Report** (`work-status-report.md/json`) - Reporte ejecutivo de estado

Ver `.dendrita/docs/CONTEXT-SYSTEM-COMPARISON.md` para diferencias detalladas entre sistemas.

---

## Scripts Disponibles

### 1. sync-all-context.ts (Recomendado)

**Script maestro que ejecuta todo el pipeline en orden correcto.**

```bash
# Actualizar todo
tsx sync-all-context.ts

# Filtrar por workspace
tsx sync-all-context.ts --workspace ennui

# Filtrar por proyecto
tsx sync-all-context.ts --workspace ennui --project dendrita-dev

# Saltar pasos específicos
tsx sync-all-context.ts --skip-project-context
tsx sync-all-context.ts --skip-user-context
tsx sync-all-context.ts --skip-report
```

**Orden de ejecución:**
1. `update-project-context.ts` - Actualiza project_context.json
2. `update-context.ts` - Actualiza context.json (usuario y workspace)
3. `generate-work-status-report.ts` - Genera work-status-report

---

### 2. update-project-context.ts

**Actualiza `project_context.json` de cada proyecto desde archivos fuente.**

```bash
# Actualizar todos los proyectos
tsx update-project-context.ts

# Filtrar por workspace
tsx update-project-context.ts --workspace ennui

# Filtrar por proyecto
tsx update-project-context.ts --workspace ennui --project dendrita-dev

# Archivar archivos MD después de generar JSON
tsx update-project-context.ts --workspace ennui --project dendrita-dev --archive
```

**Fuentes de datos:**
- `master-plan.md`
- `current-context.md` (opcional)
- `tasks.md`

**Salida:**
- `workspaces/[workspace]/🚀 active-projects/[project]/project_context.json`

---

### 3. update-context.ts

**Actualiza `context.json` de usuario y workspaces desde project_context.json.**

```bash
# Actualizar contexto de usuario y todos los workspaces
tsx update-context.ts
```

**Fuentes de datos:**
- Todos los `project_context.json` (extrae memorias)
- `_temp/context-input.md` o `.txt` (input manual)

**Salida:**
- `.dendrita/users/[user-id]/context.json` (contexto de usuario)
- `workspaces/[workspace]/context.json` (contexto de workspace)

**Flujo de propagación:**
```
project_context.json → context.json (usuario) → context.json (workspace)
```

---

### 4. generate-work-status-report.ts

**Genera reporte ejecutivo de estado de trabajo.**

```bash
# Generar reporte completo
tsx generate-work-status-report.ts

# Filtrar por workspace
tsx generate-work-status-report.ts --workspace ennui
```

**Fuente de datos:**
- Todos los `project_context.json` de proyectos activos

**Salida:**
- `.dendrita/dashboards/work-status-report.md` (legible)
- `.dendrita/dashboards/work-status-report.json` (máquina)

**Contenido:**
- Estadísticas consolidadas
- Listas de tareas (pending, inProgress, blocked)
- Organización por workspace y proyecto

---

### 5. validate-context-sync.ts

**Valida que todos los sistemas de contexto estén sincronizados.**

```bash
# Validar sincronización
tsx validate-context-sync.ts

# Validar con reporte detallado
tsx validate-context-sync.ts --verbose
```

**Verifica:**
- Que `project_context.json` esté actualizado
- Que `context.json` refleje cambios de proyectos
- Que `work-status-report.json` esté sincronizado
- Detecta inconsistencias entre sistemas

---

## Workflow Recomendado

### Actualización Completa (Recomendado)

```bash
tsx sync-all-context.ts
```

Este comando ejecuta todo el pipeline en el orden correcto.

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

## Estructura de Archivos

```
.dendrita/
├── users/[user-id]/
│   └── context.json                    ← Contexto de usuario
├── dashboards/
│   ├── work-status-report.md          ← Reporte Markdown
│   └── work-status-report.json        ← Reporte JSON
└── integrations/scripts/pipelines/context-pipeline/
    ├── sync-all-context.ts            ← Script maestro
    ├── update-project-context.ts       ← Actualiza proyectos
    ├── update-context.ts               ← Actualiza usuario/workspace
    ├── generate-work-status-report.ts  ← Genera reporte
    ├── validate-context-sync.ts        ← Valida sincronización
    └── utils/
        ├── common.ts                   ← Utilidades compartidas
        └── context-types.ts            ← Tipos TypeScript

workspaces/
└── [workspace]/
    ├── context.json                    ← Contexto de workspace
    └── 🚀 active-projects/
        └── [project]/
            └── project_context.json    ← Contexto de proyecto
```

---

## Flujo de Datos

```
1. Archivos fuente (MD)
   ├─ master-plan.md
   ├─ current-context.md
   └─ tasks.md
        ↓
2. update-project-context.ts
        ↓
3. project_context.json (granular)
        ↓
   ├─→ update-context.ts
   │       ↓
   │   context.json (usuario) → context.json (workspace)
   │
   └─→ generate-work-status-report.ts
           ↓
       work-status-report.json
```

---

## Integración entre Sistemas

Los sistemas están integrados:

1. **work-status-report** puede referenciar `context.json` para memorias relevantes
2. **context.json** puede referenciar `work-status-report.json` para estadísticas

Esta integración permite:
- Ver memorias relevantes en el reporte
- Acceder a estadísticas desde el contexto
- Mantener sincronización entre ambos sistemas

---

## Validación

Usa el script de validación para verificar sincronización:

```bash
tsx validate-context-sync.ts
```

El script verifica:
- ✅ Que `project_context.json` esté actualizado
- ✅ Que `context.json` refleje cambios de proyectos
- ✅ Que `work-status-report.json` esté sincronizado
- ⚠️ Detecta inconsistencias entre sistemas

---

## Referencias

- **Documentación comparativa:** `.dendrita/docs/CONTEXT-SYSTEM-COMPARISON.md`
- **Hook working-context:** `.dendrita/hooks/working-context.md`
- **Hook dendrita-work-status:** `.dendrita/hooks/dendrita-work-status.md`
- **Tipos TypeScript:** `utils/context-types.ts`

---

## Troubleshooting

### Error: "No project contexts found"

**Solución:** Ejecuta primero `update-project-context.ts`:
```bash
tsx update-project-context.ts
```

### Error: "Context is outdated"

**Solución:** Ejecuta el script maestro:
```bash
tsx sync-all-context.ts
```

### Inconsistencias entre sistemas

**Solución:** Ejecuta validación y luego sincronización:
```bash
tsx validate-context-sync.ts
tsx sync-all-context.ts
```

---

**Última actualización:** 2025-12-02

