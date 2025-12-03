---
name: project-wrap-up
description: "Project Wrap-up Hook - Review project state, update key documents, check pending items, and manage temporary files"
type: hook
created:
  2025-12-01T00:00:00.000Z
  
updated:
  2025-12-01T00:00:00.000Z
  
tags: ["hook", "behavior-reference", "project-management", "wrap-up", "review"]
category: behavior-reference
---

# Hook de Wrap-up de Proyectos

Referencia de comportamiento para Cursor - revisión del estado del trabajo, actualización de documentos clave, verificación de pendientes y gestión de archivos temporales.

---

## ¿Qué es este Hook?

Este hook documenta el comportamiento esperado que Cursor debe aplicar cuando el usuario solicita hacer un wrap-up (resumen/cierre) de un proyecto o sesión de trabajo.

**Propósito:** Revisar el estado del trabajo, actualizar documentos clave, identificar documentos pendientes, y gestionar archivos temporales (guardar en workspace o eliminar).

**Diferencia con otros hooks:**
- `work-timeline.md` - Registra cambios automáticamente durante el trabajo (ejecución continua)
- `session-initialization-verification.md` - Verifica configuración al inicio de sesión (ejecución al inicio)

---

## Comportamiento Esperado

### 1. Activación del Hook

Cursor debe ejecutar este hook cuando:

- ✅ El usuario solicita explícitamente un wrap-up (ej: "hagamos un wrap-up", "resumen del proyecto", "cierre de sesión")
- ✅ El usuario indica que quiere revisar el estado del trabajo
- ✅ El usuario menciona que quiere limpiar archivos temporales
- ✅ El usuario solicita actualizar documentos del proyecto

**Condición de activación:**

```markdown
SI (usuario solicita "wrap-up" O "resumen" O "cierre de sesión" O "revisar estado") O
   (usuario solicita "actualizar documentos" O "limpiar temporales")
ENTONCES ejecutar project-wrap-up
```

### 2. Proceso de Wrap-up

Cuando se activa el wrap-up, Cursor debe ejecutar en orden:

#### Paso 1: Identificar Proyecto y Workspace

```markdown
1. Identificar proyecto activo desde contexto de conversación
2. Si no hay proyecto claro:
   → Preguntar al usuario qué proyecto quiere revisar
   → O revisar todos los proyectos activos en el workspace actual
3. Identificar workspace del proyecto
4. Leer estructura del proyecto:
   - workspaces/[workspace]/🚀 active-projects/[proyecto]/
```

#### Paso 2: Revisar Estado del Trabajo

```markdown
1. Leer project_context.json (si existe)
2. Leer master-plan.md
3. Leer tasks.md
4. Analizar cambios recientes:
   - Archivos modificados en esta sesión
   - Tareas completadas
   - Decisiones tomadas
   - Nuevos documentos creados
5. Comparar estado actual vs. objetivos del master-plan
6. Identificar progreso por fase
```

#### Paso 3: Actualizar Documentos Clave

```markdown
1. Actualizar project_context.json:
   → Ejecutar: tsx .dendrita/integrations/scripts/pipelines/context-pipeline/update-project-context.ts --workspace [workspace] --project [proyecto]
   → Verificar que se actualizó correctamente
   → Leer el JSON actualizado para confirmar

2. Revisar master-plan.md:
   → Verificar que refleja el estado actual
   → Actualizar secciones si hay cambios importantes
   → Actualizar fecha de "Última actualización" si se modificó

3. Revisar tasks.md:
   → Verificar que tareas completadas están marcadas
   → Actualizar estado de tareas en progreso
   → Agregar nuevas tareas si se identificaron durante la sesión
   → Actualizar fecha de "Última actualización" si se modificó

4. Si el proyecto tiene pipeline.md o documentos similares:
   → Actualizar con estado actual
   → Verificar que refleja cambios recientes
```

#### Paso 4: Verificar Documentos Pendientes

```markdown
1. Revisar tasks.md para identificar:
   - Tareas pendientes sin fecha de inicio
   - Tareas bloqueadas o con dependencias no resueltas
   - Tareas con deadline próximo o vencido

2. Revisar master-plan.md para identificar:
   - Fases no iniciadas
   - Entregables pendientes
   - Decisiones pendientes mencionadas

3. Revisar project_context.json para identificar:
   - Bloqueadores activos
   - Decisiones pendientes
   - Riesgos no mitigados

4. Revisar documentos del proyecto para identificar:
   - README.md desactualizado
   - Documentos mencionados pero no creados
   - Archivos de configuración faltantes

5. Generar lista de pendientes:
   → Agrupar por tipo (tareas, decisiones, documentos)
   → Priorizar por urgencia
   → Mostrar al usuario con recomendaciones
```

#### Paso 5: Examinar Archivos Temporales

```markdown
1. Identificar archivos temporales relacionados con el proyecto:
   → Buscar en _temp/ por nombre del proyecto o workspace
   → Buscar archivos con fechas recientes
   → Buscar archivos con nombres relacionados al proyecto

2. Para cada archivo temporal encontrado:
   a. Evaluar si debe guardarse:
      - ¿Contiene información valiosa del proyecto?
      - ¿Es un documento de trabajo que debe preservarse?
      - ¿Es un análisis o insight que debe documentarse?
      - ¿Es un script o herramienta reutilizable?
   
   b. Si debe guardarse:
      → Determinar ubicación en workspace:
         * Documentos de trabajo → workspaces/[workspace]/🚀 active-projects/[proyecto]/documentos/
         * Análisis/insights → workspaces/[workspace]/🚀 active-projects/[proyecto]/analisis/ o insights/
         * Scripts/herramientas → workspaces/[workspace]/🛠️ tools-templates/ o proyecto específico
         * Datos/raw → workspaces/[workspace]/⚙️ company-management/data/ si aplica
      → Mover o copiar archivo a ubicación apropiada
      → Actualizar referencias si es necesario
      → Informar al usuario del movimiento
   
   c. Si NO debe guardarse:
      → Verificar si es realmente temporal (logs, cache, backups antiguos)
      → Preguntar al usuario si quiere eliminar
      → O eliminar automáticamente si es claramente temporal (logs, cache)

3. Archivos temporales comunes a revisar:
   - _temp/[workspace]/[proyecto]/**/* - Archivos específicos del proyecto
   - _temp/general/working-context.json - Contexto de trabajo (puede ser útil)
   - _temp/[workspace]/**/* - Archivos del workspace
   - Scripts temporales en _temp/ con nombres relacionados
   - Archivos de análisis o transcripciones relacionados
```

### 3. Generar Resumen de Wrap-up

Al finalizar el proceso, Cursor debe generar un resumen que incluya:

#### Resumen Ejecutivo

```markdown
## 📊 Wrap-up: [Nombre del Proyecto]

**Fecha:** [Fecha actual - OBTENER DEL SISTEMA, nunca asumir]
**Workspace:** [workspace]
**Estado General:** [🟢 En buen camino / 🟡 Atención requerida / 🔴 Bloqueado]

**CRITICAL:** Antes de escribir la fecha:
- En agent mode: Ejecutar `date +"%Y-%m-%d"` para formato ISO o `date +"%d de %B de %Y"` para español
- En ask mode: Preguntar al usuario la fecha actual o usar placeholder [FECHA]
- NUNCA asumir fechas sin verificar
- Ver `.dendrita/hooks/date-handling-guidelines.md` para guías completas

### Progreso General
- **Fase actual:** [Fase del proyecto]
- **Tareas completadas esta sesión:** [Número]
- **Tareas pendientes:** [Número]
- **Progreso vs. objetivos:** [% o descripción]
```

#### Documentos Actualizados

```markdown
### ✅ Documentos Actualizados
- ✅ project_context.json - Actualizado con estado actual
- ✅ master-plan.md - [Si se actualizó, mencionar qué]
- ✅ tasks.md - [Si se actualizó, mencionar qué]
- ✅ [Otros documentos actualizados]
```

#### Pendientes Identificados

```markdown
### ⚠️ Pendientes Identificados

**Tareas:**
- [ ] [Tarea 1] - [Prioridad/Urgencia]
- [ ] [Tarea 2] - [Prioridad/Urgencia]

**Decisiones:**
- [ ] [Decisión pendiente 1] - [Contexto]
- [ ] [Decisión pendiente 2] - [Contexto]

**Documentos:**
- [ ] [Documento faltante 1] - [Razón/Propósito]
- [ ] [Documento faltante 2] - [Razón/Propósito]
```

#### Archivos Temporales Gestionados

```markdown
### 📁 Archivos Temporales

**Guardados en workspace:**
- ✅ [archivo1.md] → workspaces/[workspace]/🚀 active-projects/[proyecto]/documentos/
- ✅ [archivo2.json] → workspaces/[workspace]/🚀 active-projects/[proyecto]/analisis/

**Eliminados:**
- 🗑️ [archivo-temp.log] - Log temporal
- 🗑️ [cache-file.json] - Archivo de cache

**Pendientes de decisión:**
- ⏳ [archivo-ambiguo.md] - ¿Guardar o eliminar? [Razón]
```

#### Próximos Pasos Recomendados

```markdown
### 🎯 Próximos Pasos Recomendados

1. **Prioridad Alta:**
   - [Acción recomendada 1]
   - [Acción recomendada 2]

2. **Prioridad Media:**
   - [Acción recomendada 3]
   - [Acción recomendada 4]

3. **Seguimiento:**
   - [Cuándo revisar nuevamente]
   - [Qué monitorear]
```

### 4. Casos Especiales

#### Proyecto sin project_context.json

```markdown
Si project_context.json no existe:
1. Ejecutar script de actualización para crearlo
2. Si falla, verificar que master-plan.md y tasks.md existen
3. Si no existen, informar al usuario que faltan documentos base
```

#### Múltiples Proyectos Activos

```markdown
Si hay múltiples proyectos activos:
1. Preguntar al usuario cuál quiere revisar
2. O revisar todos y generar resumen comparativo
3. O revisar solo el proyecto mencionado en contexto
```

#### Archivos Temporales Ambiguos

```markdown
Si no está claro si un archivo debe guardarse o eliminarse:
1. Mostrar preview del archivo (primeras líneas)
2. Preguntar al usuario qué hacer
3. Sugerir ubicación si debe guardarse
4. Ofrecer eliminar si es claramente temporal
```

---

## Integración con Otros Hooks

Este hook se integra con:

1. **work-timeline:**
   - El wrap-up puede generar un tweet en work-timeline si hay cambios importantes
   - El wrap-up puede revisar el timeline para entender cambios recientes

2. **update-project-context:**
   - El wrap-up ejecuta el script de actualización de contexto
   - El wrap-up lee el contexto actualizado para el resumen

3. **dendrita-comunicacion:**
   - Si hay cambios importantes en infraestructura, puede registrar en timeline

---

## Mensajes de Respuesta

### Inicio de Wrap-up

```markdown
🔍 Iniciando wrap-up del proyecto [nombre]...

Revisando estado del trabajo, actualizando documentos y gestionando archivos temporales...
```

### Durante el Proceso

```markdown
✅ Documentos actualizados
⏳ Revisando pendientes...
📁 Examinando archivos temporales...
```

### Resumen Final

```markdown
✅ Wrap-up completado

[Mostrar resumen completo con todas las secciones]
```

### Si hay Errores

```markdown
⚠️ Algunos documentos no pudieron actualizarse:

- [Documento] - [Razón del error]

[Continuar con el resto del wrap-up]
```

---

## Notas para Cursor

1. **Ejecutar script de actualización:**
   - Siempre ejecutar `update-project-context.ts` para actualizar el JSON
   - Verificar que el script se ejecutó correctamente
   - Leer el JSON actualizado para el resumen

2. **Ser exhaustivo pero conciso:**
   - Revisar todos los aspectos pero resumir claramente
   - Agrupar información similar
   - Priorizar lo más importante

3. **Preguntar antes de eliminar:**
   - Si hay duda sobre un archivo temporal, preguntar al usuario
   - Solo eliminar si es claramente temporal (logs, cache)
   - Guardar si hay cualquier duda

4. **Actualizar fechas:**
   - Actualizar "Última actualización" en documentos modificados
   - Incluir fecha en el resumen de wrap-up

5. **Identificar bloqueadores:**
   - Revisar tasks.md y project_context.json para bloqueadores
   - Destacar bloqueadores en el resumen
   - Sugerir acciones para resolver bloqueadores

6. **Revisar progreso vs. objetivos:**
   - Comparar estado actual con objetivos del master-plan
   - Calcular progreso por fase si es posible
   - Identificar desviaciones o retrasos

7. **Gestionar archivos temporales inteligentemente:**
   - Buscar archivos relacionados al proyecto en _temp/
   - Evaluar valor antes de decidir guardar o eliminar
   - Mover a ubicación apropiada en workspace
   - Mantener estructura organizada

---

## Referencias

- `.dendrita/integrations/scripts/pipelines/context-pipeline/update-project-context.ts` - Script de actualización de contexto
- `.dendrita/hooks/work-timeline.md` - Registro automático de cambios
- `.dendrita/hooks/session-initialization-verification.md` - Verificación de configuración
- `workspaces/[workspace]/🚀 active-projects/[proyecto]/master-plan.md` - Plan maestro del proyecto
- `workspaces/[workspace]/🚀 active-projects/[proyecto]/tasks.md` - Tareas del proyecto
- `workspaces/[workspace]/🚀 active-projects/[proyecto]/project_context.json` - Contexto del proyecto

---

**Para Cursor:** Este hook es una referencia de comportamiento. Debes leer este archivo y aplicar la lógica documentada cuando el usuario solicite un wrap-up. Ejecuta los scripts necesarios, actualiza los documentos, y genera un resumen completo del estado del proyecto.

