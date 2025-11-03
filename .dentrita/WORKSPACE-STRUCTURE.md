# Workspace Structure Standard

Este documento define la estructura estándar que **todos los workspaces** deben seguir en ennui-dendrita.

## Estructura Obligatoria

Cada workspace (ennui, inspiro, entre-rutas, horizontes, iami, otros) **debe** tener la siguiente estructura:

```
workspaces/[workspace-name]/
├── active-projects/          # Proyectos activos
├── archived-projects/        # Proyectos archivados
├── company-management/        # Gestión general (opcional, puede estar vacío)
├── best-practices/           # Templates y metodologías del workspace
│   └── README.md             # Documentación del propósito
├── work-modes/               # Modos de trabajo especializados
│   └── README.md             # Documentación del propósito
├── stakeholders/             # Gestión de aliados y stakeholders
│   └── README.md             # Documentación del propósito
├── tools-templates/          # Herramientas y templates reutilizables
│   └── README.md             # Documentación del propósito
├── config-estilo.json        # Reglas de estilo (opcional)
└── README.md                 # Documentación del workspace
```

## Convención de Nombres

**IMPORTANTE:** Todos los nombres de carpetas y archivos que describen la lógica del sistema deben estar en inglés:
- Carpetas: `best-practices/`, `work-modes/`, `stakeholders/`, `tools-templates/`, `company-management/`, `active-projects/`, `archived-projects/`
- Archivos del sistema: `master-plan.md`, `current-context.md`, `tasks.md`, `allies-mapping.md`, `projects-governance.md`, `projects-dashboard.md`, etc.

**Solo pueden estar en cualquier idioma:**
- Nombres de workspaces: `ennui`, `inspiro`, `entre-rutas`, `horizontes`, `iami`, `otros`
- Nombres de proyectos dentro de `active-projects/`: `diagnostico-sostenibilidad`, `EJEMPLO-proyecto`, etc.

## Explicación de Carpetas

### `active-projects/` y `archived-projects/`
- **Obligatorias**: Sí
- **Propósito**: Organizar proyectos activos y completados
- **Estructura interna**: Cada proyecto debe tener `master-plan.md`, `current-context.md`, y `tasks.md`

### `company-management/`
- **Obligatoria**: No (estructura puede estar vacía)
- **Propósito**: Documentos de gestión general que no pertenecen a un proyecto específico
- **Ejemplos**: Dashboard de proyectos, pipeline, planeación estratégica

### `best-practices/`
- **Obligatoria**: Sí (con README.md)
- **Propósito**: Templates y metodologías específicas del workspace
- **Contenido**: Carpetas por tipo de proyecto con README.md explicando la metodología
- **Ejemplo**: `best-practices/sustainability-diagnostic/README.md`

### `work-modes/`
- **Obligatoria**: Sí (con README.md)
- **Propósito**: Modos de trabajo especializados (agentes) del workspace
- **Contenido**: Archivos `.md` que documentan modos de trabajo
- **Ejemplo**: `work-modes/sustainability-strategist.md`

**IMPORTANTE:** Todos los nombres de carpetas y archivos que describen la lógica del sistema deben estar en inglés. Solo los nombres de workspaces y proyectos pueden estar en cualquier idioma.

### `stakeholders/`
- **Obligatoria**: Sí (con README.md)
- **Propósito**: Gestión de aliados, stakeholders y gobernanza
- **Contenido**: Mapeo de aliados, templates de contratos, gobernanza
- **Archivos comunes**: `allies-mapping.md`, `projects-governance.md`

### `tools-templates/`
- **Obligatoria**: Sí (con README.md)
- **Propósito**: Templates y herramientas reutilizables
- **Contenido**: Templates de reportes, matrices, checklists

### `config-estilo.json`
- **Obligatoria**: No
- **Propósito**: Reglas de estilo específicas del workspace
- **Alcance**: Aplica a todos los archivos dentro del workspace

## Workspace de Referencia: ennui

El workspace `ennui` sirve como **referencia estándar** y contiene:

- Templates completos en `best-practices/`
- Modos de trabajo completos en `work-modes/`
- Ejemplos de herramientas en `tools-templates/`
- Estructura completa de stakeholders en `stakeholders/`

**Otros workspaces pueden:**
1. Copiar y adaptar contenido de `ennui` como punto de partida
2. Desarrollar contenido específico para sus necesidades
3. Mantener estructuras mínimas si no requieren contenido específico

## Cómo Crear un Nuevo Workspace

1. Crear la estructura de carpetas básica:
   ```bash
   mkdir -p workspaces/[nuevo-workspace]/{active-projects,archived-projects,company-management,best-practices,work-modes,stakeholders,tools-templates}
   ```

2. Crear README.md en cada carpeta principal:
   - `best-practices/README.md`
   - `work-modes/README.md`
   - `stakeholders/README.md`
   - `tools-templates/README.md`

3. Crear `README.md` principal del workspace con descripción

4. (Opcional) Copiar contenido relevante de `workspaces/ennui/` y adaptarlo

## Validación

Cursor debe verificar que cada workspace sigue esta estructura cuando:
- Se crea un nuevo workspace
- Se trabaja con archivos de un workspace
- Se detectan referencias a workspaces en la documentación

## Notas para Cursor

- **Siempre** verificar que la estructura existe antes de referenciar carpetas
- **Sugerir** crear estructura faltante si un workspace no la tiene
- **Usar** `workspaces/ennui/` como referencia cuando un workspace no tiene contenido específico
- **Documentar** en README.md el propósito de cada carpeta en el workspace

