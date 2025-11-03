---
name: gestion-proyectos
description: Project management patterns for ennui-dendrita. Structure of projects (plan-estrategico, contexto-actual, tareas-seguimiento), managing multiple simultaneous projects, operational rhythms (scrums, reviews), task tracking and deliverables, persistent documentation. Use when creating/modifying project structures, following documentation best practices, managing multiple projects, or updating contexts and tasks.
---

# Skill: Gestión de Proyectos

## Propósito

Guías y mejores prácticas para la gestión de proyectos en ennui-dendrita, incluyendo estructura de proyectos, gestión de múltiples proyectos simultáneos, y documentación persistente.

## Cuándo Usar Este Skill

- Crear/modificar estructuras de proyectos
- Seguir mejores prácticas de documentación
- Gestionar múltiples proyectos
- Actualizar contextos y tareas
- Trabajar con proyectos activos o archivados

## Estructura de Proyectos

Cada proyecto usa **3 archivos clave**:

### `plan-estrategico.md`
- Resumen ejecutivo
- Fases del proyecto
- Métricas de éxito
- Cronograma
- Riesgos y mitigaciones

### `contexto-actual.md` ⚠️ ACTUALIZAR FRECUENTEMENTE
- **PROGRESO SESIÓN** (fecha)
  - ✅ Completado
  - 🟡 En progreso
  - ⚠️ Bloqueadores
- Decisiones clave
- Archivos importantes
- Próximos pasos

### `tareas-seguimiento.md`
- Checklist por fases
- Estado de cada tarea
- Criterios de aceptación
- Responsables

## Ubicación de Proyectos

```
proyectos-activos/[nombre-proyecto]/
├── plan-estrategico.md
├── contexto-actual.md
└── tareas-seguimiento.md

proyectos-archivo/[nombre-proyecto]/
└── (misma estructura - proyectos completados)
```

## Gestión de Múltiples Proyectos

### Dashboard de Proyectos

Crea/actualiza `gestion-empresa/dashboard-proyectos.md`:

```markdown
# Dashboard de Proyectos ennui

## Proyectos Activos

| Proyecto | Estado | Fase | Responsable | Próximo Hito |
|----------|--------|------|-------------|--------------|
| ... | ... | ... | ... | ... |

## Proyectos Archivo
- ...
```

### Ritmos de Revisión

- **Daily scrums:** 15 min (para proyectos activos)
- **Revisión semanal:** 30-60 min (estado general)
- **Revisión mensual:** 1-2 horas (planificación y ajustes)
- **Reporte trimestral:** 2-4 horas (consolidación)

## Principios de Documentación

### Actualización Frecuente

**Contexto Actual**
- Actualiza cada vez que:
  - Completes una tarea importante
  - Tomes una decisión clave
  - Identifiques un bloqueador
  - Cambie el estado del proyecto

**Tareas de Seguimiento**
- Actualiza cuando:
  - Marques una tarea como completada
  - Agregues una nueva tarea
  - Cambie el estado de una tarea

**Plan Estratégico**
- Actualiza cuando:
  - Cambie el alcance del proyecto
  - Descubras nuevas fases
  - Ajustes el cronograma significativamente

## Checklist para Nuevos Proyectos

1. **Crear carpeta:** `proyectos-activos/[nombre-proyecto]/`
2. **Crear 3 archivos base:**
   - `plan-estrategico.md` (usar template relevante)
   - `contexto-actual.md` (iniciar con estado actual)
   - `tareas-seguimiento.md` (crear checklist inicial)
3. **Actualizar dashboard:** Agregar a `gestion-empresa/dashboard-proyectos.md`
4. **Revisar mejores-practicas:** Usar template correspondiente al tipo de proyecto

## Checklist para Finalizar Proyectos

1. **Completar reportes finales**
2. **Archivar proyecto:**
   ```bash
   mv proyectos-activos/[proyecto] proyectos-archivo/
   ```
3. **Documentar aprendizajes** en mejores-practicas si corresponde
4. **Actualizar mapeo de aliados** si corresponde
5. **Actualizar dashboard**

## Archivos de Referencia

- Templates de proyectos en `mejores-practicas/`
- Dashboard en `gestion-empresa/dashboard-proyectos.md`
- Instrucciones generales en `INSTRUCCION.md`

---

**Este skill se activa automáticamente cuando trabajas con archivos en `proyectos-activos/` o `proyectos-archivo/`**

