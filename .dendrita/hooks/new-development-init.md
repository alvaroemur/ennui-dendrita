---
name: new-development-init
description: "Hook de Inicialización de Nuevo Desarrollo"
type: hook
created: 2025-11-06
updated: 2025-11-06
tags: ["hook", "behavior-reference", "development", "project-init"]
category: behavior-reference
---

# Hook de Inicialización de Nuevo Desarrollo

Referencia de comportamiento para Cursor - inicialización de nuevos proyectos de desarrollo dentro de dendrita.

---

## ¿Qué es este Hook?

Este hook documenta el comportamiento esperado que Cursor debe aplicar cuando el usuario quiere iniciar un nuevo proyecto de desarrollo (aplicación, servicio, herramienta, etc.) dentro de dendrita.

**Propósito:** Guiar a Cursor para crear la estructura completa de un nuevo proyecto de desarrollo, incluyendo plan detallado, documentos del proyecto, y configuración necesaria.

---

## Comportamiento Esperado

### 1. Detección de Nuevo Desarrollo

Cursor debe detectar que el usuario quiere iniciar un nuevo desarrollo cuando:

- ✅ El usuario indica explícitamente "quiero desarrollar", "nuevo proyecto", "nueva app", etc.
- ✅ El usuario menciona crear un nuevo repo o proyecto de desarrollo
- ✅ El usuario menciona migrar o crear una nueva aplicación/servicio

**Condición de activación:**

```markdown
SI (usuario indica "desarrollar" O "nuevo proyecto" O "nueva app" O "migrar")
ENTONCES activar proceso de inicialización de nuevo desarrollo
```

### 2. Proceso de Inicialización

Cuando se activa la inicialización, Cursor debe:

#### Paso 1: Identificar Contexto

```markdown
1. Identificar workspace (preguntar si no está claro)
2. Identificar tipo de proyecto (aplicación, servicio, herramienta, etc.)
3. Identificar propósito y objetivos principales
4. Identificar tecnologías/stack a usar
5. Identificar referencias o código existente a migrar/adaptar
```

#### Paso 2: Crear Estructura del Proyecto

```markdown
1. Crear carpeta en workspaces/[workspace]/🚀 active-projects/[nombre-proyecto]/
2. Crear archivos base del proyecto:
   - README.md - Descripción general del proyecto
   - master-plan.md - Plan maestro con fases y objetivos
   - current-context.md - Contexto actual y decisiones
   - tasks.md - Lista de tareas y estado
```

#### Paso 3: Crear Plan Detallado

```markdown
1. Crear carpeta .cursor/plans/ si no existe
2. Crear plan detallado en .cursor/plans/@[nombre-proyecto].plan.md
3. El plan debe incluir:
   - Objetivo y contexto del proyecto
   - Arquitectura y stack tecnológico
   - Estructura del proyecto
   - Referencias exactas a código existente (si aplica)
   - Configuración específica (parámetros, umbrales, etc.)
   - Prompts de IA completos (si aplica)
   - Esquemas de base de datos (si aplica)
   - Dependencias específicas
   - Funcionalidades principales con detalles
   - Flujo de trabajo end-to-end
   - Implementación por fases
   - Referencias clave con rutas exactas
```

#### Paso 4: Documentar Referencias

```markdown
1. Si hay código existente a migrar/adaptar:
   - Documentar rutas exactas a archivos
   - Documentar funciones/clases específicas
   - Documentar configuración y parámetros
   - Documentar lógica clave a preservar
2. Si hay sistemas relacionados:
   - Documentar integraciones necesarias
   - Documentar dependencias
   - Documentar flujos de datos
```

#### Paso 5: Configurar Proyecto

```markdown
1. Crear archivos de configuración necesarios:
   - .env.example (si aplica)
   - requirements.txt o package.json (si aplica)
   - docker-compose.yml (si aplica)
   - Otros archivos de configuración según stack
2. Crear estructura de carpetas básica según el plan
3. Crear archivos iniciales mínimos (__init__.py, main.py, etc.)
```

### 3. Checklist de Inicialización

Cursor debe asegurarse de que:

- ✅ Carpeta del proyecto creada en `workspaces/[workspace]/🚀 active-projects/[nombre-proyecto]/`
- ✅ Archivos base del proyecto creados (README.md, master-plan.md, current-context.md, tasks.md)
- ✅ Plan detallado creado en `.cursor/plans/@[nombre-proyecto].plan.md`
- ✅ Plan incluye TODOS los detalles necesarios:
  - Referencias exactas a código existente (rutas completas)
  - Configuración específica (parámetros, umbrales, modelos)
  - Prompts completos de IA (si aplica)
  - Esquemas SQL completos (si aplica)
  - Dependencias específicas con versiones
  - Flujo de trabajo end-to-end
- ✅ Referencias documentadas con rutas exactas
- ✅ Estructura de carpetas básica creada
- ✅ Archivos de configuración iniciales creados

### 4. Validación del Plan

Antes de considerar el plan completo, Cursor debe verificar:

```markdown
1. ¿El plan tiene referencias exactas a código existente?
   - Rutas completas a archivos
   - Nombres exactos de funciones/clases
   - Configuración específica extraída

2. ¿El plan tiene configuración específica?
   - Parámetros, umbrales, pesos
   - Modelos de IA con nombres exactos
   - Prompts completos (no solo descripciones)

3. ¿El plan tiene esquemas de base de datos?
   - DDL completo para tablas nuevas
   - Referencias a tablas existentes

4. ¿El plan tiene dependencias específicas?
   - Versiones exactas de paquetes
   - Stack tecnológico completo

5. ¿El plan tiene flujo de trabajo end-to-end?
   - Pasos detallados desde inicio hasta fin
   - Decisiones en cada paso

6. ¿El plan es suficiente para una nueva sesión?
   - ¿Puede otra sesión de Cursor continuar sin contexto previo?
   - ¿Tiene todos los detalles necesarios?
```

---

## Ejemplo de Uso

### Escenario: Usuario quiere crear neuron 2.0

**Input del usuario:**
```
"tomando la lógica de mi proyecto @neuron, quiero desarrollar otro repo nuevo que sirva como una app en mi server..."
```

**Comportamiento esperado:**

1. **Identificar contexto:**
   - Workspace: ennui
   - Tipo: Aplicación en Python
   - Propósito: Migrar lógica de neuron a app en servidor
   - Stack: Python, FastAPI, Supabase, OpenAI
   - Referencias: `references/neuron/gas/`

2. **Crear estructura:**
   - `workspaces/ennui/🚀 active-projects/neuron-2-0-cloud-app/`
   - Archivos base: README.md, master-plan.md, current-context.md, tasks.md

3. **Crear plan detallado:**
   - `.cursor/plans/@neuron-2-0-cloud-app.plan.md`
   - Incluir:
     - Referencias exactas: `references/neuron/gas/pipeline.transcripts.js`
     - Configuración específica: `MATCHING.TIME_WINDOW_MINUTES: 30`
     - Prompts completos de OpenAI
     - Esquemas SQL para tablas nuevas
     - Dependencias Python con versiones
     - Flujo de trabajo end-to-end

4. **Validar plan:**
   - Verificar que tiene todos los detalles necesarios
   - Asegurar que otra sesión puede continuar sin contexto previo

---

## Para Cursor

**Instrucciones:**

1. **Leer este hook** cuando el usuario indica que quiere iniciar un nuevo desarrollo
2. **Aplicar el comportamiento documentado** paso a paso
3. **NO ejecutar scripts** - solo crear archivos y estructura
4. **Validar el plan** antes de considerarlo completo
5. **Asegurar que el plan es suficiente** para una nueva sesión de Cursor

**Referencias relacionadas:**

- `.dendrita/hooks/repo-initialization.md` - Inicialización de repositorio dendrita
- `.dendrita/templates/workspace-template/` - Templates de proyectos
- `README.md` - Estructura general de proyectos

---

## Notas Finales

- Este hook es una **referencia de comportamiento**, NO un script ejecutable
- Cursor debe **leer y aplicar** la lógica documentada
- El plan debe ser **suficientemente detallado** para que otra sesión pueda continuar
- **Siempre validar** que el plan tiene todos los detalles necesarios antes de considerarlo completo

---

**Versión:** 1.0  
**Creado:** 2025-11-06  
**Última actualización:** 2025-11-06

