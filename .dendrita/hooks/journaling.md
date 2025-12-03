---
name: journaling
description: "Hook de Journaling"
type: hook
created:
  2025-11-06T00:00:00.000Z
  
updated:
  2025-11-06T00:00:00.000Z
  
tags: ["hook", "behavior-reference"]
category: behavior-reference
---

# Hook de Journaling

Referencia de comportamiento para Cursor - captura de narrativas de trabajo y extracción automática de insights y tareas.

---

## ¿Qué es este Hook?

Este hook documenta el comportamiento esperado que Cursor debe aplicar cuando el usuario está haciendo journaling (capturando narrativas de trabajo).

**Propósito:** Capturar narrativas de trabajo por sesiones de conversación, extrayendo automáticamente insights (decisiones, aprendizajes, patrones) y tareas que luego se integren con los planes de otros workspaces.

**Diferencia con otros hooks:**
- Este hook se enfoca en la captura reflexiva y narrativa del trabajo diario
- Extrae automáticamente información accionable (insights y tareas) de las narrativas
- Integra con otros workspaces para agregar tareas a sus planes de trabajo

---

## Comportamiento Esperado

### 1. Activación del Hook

Cursor debe activar el comportamiento de journaling cuando:

- ✅ **🌙 El usuario escribe el emoji 🌙 o menciona "luna"** (codename principal)
- ✅ El usuario está contando narrativas de trabajo en la conversación
- ✅ El usuario menciona explícitamente que quiere hacer journaling
- ✅ El usuario describe su día/sesión de trabajo de forma narrativa
- ✅ Se detectan patrones de narrativa: "hoy trabajé en...", "me di cuenta de...", "tengo que..."

**Condición de activación (prioridad):**

```markdown
SI (🌙 emoji o mención "luna") O (narrativa de trabajo) O (mención explícita de journaling) O (patrones narrativos detectados)
ENTONCES activar comportamiento de journaling en MODO ESCUCHA (default)
```

**🌙 Codename:** El emoji 🌙 o la palabra "luna" es el trigger principal para iniciar una sesión de journaling. Cuando se detecta, el sistema debe entrar inmediatamente en modo escucha.

### 2. Proceso de Captura

Cuando se activa el journaling, Cursor debe:

#### Paso 1: Crear o Actualizar Entrada de Sesión

1. **Identificar sesión actual:**
   - Usar fecha y hora actual: `YYYY-MM-DD-HHMM-session.md`
   - Si ya existe entrada para esta sesión, actualizarla
   - Si es nueva sesión, crear nueva entrada

2. **Ubicación del archivo:**
   - Identificar el workspace personal del usuario (verificar perfil del usuario)
   - `workspaces/[personal-workspace]/active-projects/[journaling-project]/entries/YYYY-MM-DD-HHMM-session.md`
   - El nombre del proyecto de journaling debe identificarse desde el perfil del usuario o preguntar al usuario

3. **Formato de entrada:**
   - Seguir el formato documentado en el README del proyecto de journaling
   - Incluir secciones: Resumen, Momentos significativos, Insights, Tareas, Frases clave, Notas personales, Cierre

#### Paso 2: Capturar Narrativa (Modo Escucha - Default)

**🌙 Modo Escucha:** El sistema debe estar en modo escucha por defecto. Esto significa:

1. **Escuchar sin interrumpir:**
   - Capturar la narrativa completa del usuario
   - No agregar interpretaciones sin solicitud
   - No hacer preguntas hasta que el usuario haya terminado de narrar
   - Reflejar lo que el usuario está contando
   - Solo interrumpir si es absolutamente necesario (ej: confirmar destino de tarea sin workspace)

2. **Principio de escucha primero:**
   - El usuario debe poder narrar completamente su experiencia antes de recibir respuestas
   - Las preguntas del sistema deben ser mínimas y solo cuando sea estrictamente necesario
   - El sistema debe capturar toda la narrativa antes de procesar o extraer insights/tareas

2. **Organizar en secciones:**
   - **Resumen de la sesión:** Síntesis breve de lo ocurrido
   - **Momentos significativos:** Eventos, decisiones, logros destacados
   - **Notas personales:** Reflexiones, intuiciones, dudas, planes
   - **Frases clave:** Frases que resumen ideas importantes
   - **Cierre de la sesión:** Reflexión final (opcional)

#### Paso 3: Extracción Automática de Insights

Cursor debe extraer automáticamente insights mientras captura la narrativa:

**Patrones de detección:**

1. **Decisiones:**
   - "decidí que...", "voy a...", "necesito...", "decidí...", "he decidido..."
   - "vamos a cambiar...", "será mejor si..."

2. **Aprendizajes:**
   - "aprendí que...", "me di cuenta de...", "entendí que...", "me quedó claro..."
   - "ahora veo que...", "comprendí..."

3. **Patrones:**
   - "siempre pasa que...", "noto que...", "veo un patrón..."
   - "cada vez que...", "suele ocurrir..."

4. **Bloqueos y necesidades:**
   - "no puedo...", "falta...", "necesito...", "hay que..."
   - "bloqueado por...", "no tengo..."

**Proceso de extracción:**

1. **Identificar insight en la narrativa**
2. **Formatear como lista en sección "Insights identificados"**
3. **Registrar en archivo de insights mensual:**
   - Identificar el workspace personal del usuario y proyecto de journaling
   - `workspaces/[personal-workspace]/active-projects/[journaling-project]/insights/YYYY-MM-insights.md`
4. **Incluir fecha y contexto de origen**

**Formato de insight extraído:**

```markdown
- **[YYYY-MM-DD]** Decisión: [descripción de la decisión]
- **[YYYY-MM-DD]** Aprendizaje: [descripción del aprendizaje]
- **[YYYY-MM-DD]** Patrón: [descripción del patrón]
- **[YYYY-MM-DD]** Bloqueo: [descripción del bloqueo]
```

#### Paso 4: Extracción Automática de Tareas

Cursor debe extraer automáticamente tareas mientras captura la narrativa:

**Patrones de detección:**

1. **Acciones explícitas:**
   - "tengo que...", "necesito...", "debo...", "hay que..."
   - "voy a...", "quiero...", "debería..."

2. **Verbos de acción:**
   - "revisar...", "crear...", "actualizar...", "completar..."
   - "enviar...", "llamar...", "preparar..."

3. **Contexto de workspace:**
   - Menciones de workspace del usuario (identificar desde perfil o workspaces existentes)
   - Menciones de proyecto: nombre de proyecto en active-projects
   - Referencias a trabajos específicos

**Proceso de extracción:**

1. **Identificar tarea en la narrativa**
2. **Identificar contexto workspace/proyecto:**
   - Si menciona workspace/proyecto explícitamente: usar ese
   - Si no menciona: preguntar al usuario dónde debe ir la tarea
3. **Formatear como checklist:**
   - `[ ] Descripción de la tarea → workspace: [workspace-name]/[project-name]`
4. **Registrar en entrada de journaling**
5. **Registrar en archivo de tareas extraídas:**
   - Identificar el workspace personal del usuario y proyecto de journaling
   - `workspaces/[personal-workspace]/active-projects/[journaling-project]/tasks-extracted/YYYY-MM-tasks.md`
   - Incluir fecha de creación y destino

**Integración con otros workspaces:**

1. **Leer `tasks.md` del workspace/proyecto destino:**
   - `workspaces/[workspace-name]/active-projects/[project-name]/tasks.md`

2. **Identificar sección apropiada:**
   - Quick Wins (This Week)
   - Current Sprint
   - Upcoming
   - O sección específica del proyecto

3. **Agregar tarea:**
   - Formato: `[ ] Descripción de la tarea`
   - Incluir comentario con fecha de origen: `<!-- Extraída de journaling: YYYY-MM-DD -->`

4. **Confirmación (opcional):**
   - Si el usuario prefiere confirmar antes de agregar: preguntar antes de agregar
   - Si el usuario prefiere agregar automáticamente: agregar directamente

### 3. Estructura de Archivos

El proyecto de journaling debe tener estructura específica:

```
workspaces/[personal-workspace]/active-projects/[journaling-project]/
├── README.md                    # Documentación del sistema
├── entries/                      # Entradas por sesión
│   └── YYYY-MM-DD-HHMM-session.md
├── insights/                     # Insights extraídos mensualmente
│   └── YYYY-MM-insights.md
├── tasks-extracted/              # Registro de tareas extraídas mensualmente
│   └── YYYY-MM-tasks.md
└── navigation-guides/            # Guías de navegación por rangos
    └── YYYY-MM-navigation-guide.md
```

**Nota:** El workspace personal y el nombre del proyecto de journaling deben identificarse desde el perfil del usuario o preguntarse al usuario si no están configurados.

### 4. Formato de Entrada de Journaling

Cada entrada debe seguir este formato:

```markdown
# 🌙 Journal - [Fecha] - [Hora] - Sesión

## 🧠 Resumen de la sesión
_Breve introducción que describe qué ocurrió, qué trabajaste o qué provocó esta entrada._

## 🌠 Momentos significativos
_(Eventos, decisiones, logros o detalles que marcaron la sesión)_
- 
- 

## 💡 Insights identificados
_(Extracción automática de decisiones, aprendizajes, patrones)_
- 

## ✅ Tareas identificadas
_(Extracción automática de acciones a realizar)_
- [ ] Tarea 1 → workspace: [workspace-name]/[project-name]
- [ ] Tarea 2 → workspace: [workspace-name]/[project-name]

## 🗣️ Frases clave
_(Frases que resumen ideas o decisiones importantes)_
- "..."

## 🧭 Notas personales
_(Reflexiones, intuiciones, dudas, planes)_
- 

## 🌙 Cierre de la sesión
_(Opcional: palabras de cierre, reflexión final)_
```

### 5. Archivos de Insights Mensuales

Cada mes se mantiene un archivo consolidado de insights:

**Ubicación:** `workspaces/[personal-workspace]/active-projects/[journaling-project]/insights/YYYY-MM-insights.md`

**Formato:**

```markdown
# Insights - [Mes] [Año]

## Decisiones
- **[YYYY-MM-DD]** [Descripción de la decisión]
  - Contexto: [breve contexto]
  - Origen: [sesión de journaling]

## Aprendizajes
- **[YYYY-MM-DD]** [Descripción del aprendizaje]
  - Contexto: [breve contexto]
  - Origen: [sesión de journaling]

## Patrones
- **[YYYY-MM-DD]** [Descripción del patrón]
  - Contexto: [breve contexto]
  - Origen: [sesión de journaling]

## Bloqueos y Necesidades
- **[YYYY-MM-DD]** [Descripción del bloqueo]
  - Contexto: [breve contexto]
  - Origen: [sesión de journaling]
```

### 6. Archivos de Tareas Extraídas Mensuales

Cada mes se mantiene un archivo consolidado de tareas extraídas:

**Ubicación:** `workspaces/[personal-workspace]/active-projects/[journaling-project]/tasks-extracted/YYYY-MM-tasks.md`

**Formato:**

```markdown
# Tareas Extraídas - [Mes] [Año]

## Por Workspace

### [workspace-name]
- **[YYYY-MM-DD]** [Descripción de la tarea]
  - Proyecto: [project-name]
  - Estado: [Agregada/En espera]
  - Origen: [sesión de journaling]

### [workspace-name]
- **[YYYY-MM-DD]** [Descripción de la tarea]
  - Proyecto: [project-name]
  - Estado: [Agregada/En espera]
  - Origen: [sesión de journaling]

## Sin Workspace Asignado
- **[YYYY-MM-DD]** [Descripción de la tarea]
  - Estado: Pendiente de asignación
  - Origen: [sesión de journaling]
```

**Nota:** Los workspaces listados deben ser los workspaces del usuario identificados desde su perfil o desde la estructura de workspaces existente.

---

## Integración con Otros Hooks

Este hook se integra con:

1. **skill-activation-prompt:**
   - Si se menciona "journaling" o "diario", puede sugerir activar este comportamiento
   - Si se mencionan workspaces/proyectos, puede sugerir skill de gestión de proyectos

2. **post-tool-use-tracker:**
   - Después de agregar tareas a otros workspaces, registrar el cambio en el contexto

3. **dendrita-alias-activation:**
   - Si el usuario menciona el alias de dendrita, puede activar contexto de workspaces para identificar mejor destinos de tareas

---

## Casos Especiales

### Usuario No Especifica Workspace para Tarea

Si se extrae una tarea pero no se menciona workspace/proyecto:

```markdown
1. Identificar tarea extraída
2. Preguntar al usuario: "¿En qué workspace/proyecto debe ir esta tarea?"
3. Esperar respuesta del usuario
4. Agregar tarea con workspace/proyecto especificado
```

### Tarea Ya Existe en Workspace

Si se detecta que la tarea ya existe en el `tasks.md` destino:

```markdown
1. Verificar si tarea similar ya existe
2. Si existe: registrar en journaling que ya estaba presente
3. Si no existe: agregar normalmente
```

### Múltiples Tareas en Una Sesión

Si se extraen múltiples tareas en una sesión:

```markdown
1. Extraer todas las tareas
2. Agrupar por workspace/proyecto
3. Agregar todas las tareas al workspace correspondiente en una operación
4. Registrar todas en archivo de tareas extraídas
```

---

## Mensajes de Respuesta

### Activación de Journaling

```markdown
🌙 Modo escucha activado. Estoy escuchando tu narrativa...

Capturando tu narrativa completa. Extraeré automáticamente insights y tareas mientras narras. Continúa cuando estés listo. 🌙
```

### Insight Extraído

```markdown
💡 Insight identificado: [descripción del insight]

Lo he registrado en tu entrada de journaling y en el archivo mensual de insights.
```

### Tarea Extraída

```markdown
✅ Tarea identificada: [descripción de la tarea]

¿En qué workspace/proyecto debe ir esta tarea?

[Si ya tiene destino]
✅ Tarea agregada a [workspace]/[project]/tasks.md
```

### Tarea Agregada a Workspace

```markdown
✅ Tarea agregada a [workspace]/[project]/tasks.md

Registrada en tu journaling y en el archivo mensual de tareas extraídas.
```

---

## Notas para Cursor

1. **🌙 Modo Escucha (Default):**
   - El sistema está en modo escucha por defecto cuando se activa journaling
   - No interrumpir la narrativa del usuario
   - Capturar la narrativa completa antes de responder o hacer preguntas
   - Solo interrumpir si es absolutamente necesario (ej: confirmar destino de tarea)

2. **Ser proactivo pero no intrusivo:**
   - Extraer insights y tareas automáticamente mientras el usuario narra
   - No interrumpir la narrativa del usuario
   - Preguntar solo cuando sea necesario (workspace no especificado)

3. **Mantener contexto:**
   - Recordar sesiones anteriores si es relevante
   - Conectar insights y tareas con contexto previo cuando corresponda

4. **🌙 Reconocer el codename:**
   - Cuando el usuario escribe 🌙 o menciona "luna", activar inmediatamente modo escucha
   - No esperar más contexto, entrar directamente en modo journaling
   - El emoji 🌙 es el trigger principal y más directo

5. **Respetar el ritmo del usuario:**
   - No forzar completar todas las secciones
   - Permitir que el usuario decida qué registrar
   - El modo escucha permite que el usuario narre a su ritmo sin presión

6. **Integrar con otros workspaces:**
   - Leer estructura de `tasks.md` antes de agregar
   - Mantener formato consistente con el workspace destino
   - Registrar origen de tarea para trazabilidad

7. **Mantener consistencia:**
   - Usar formato de fecha `YYYY-MM-DD` siempre
   - Seguir formato de entrada documentado (🌙 Journal)
   - Mantener estructura de archivos mensuales

---

## Referencias

- `.dendrita/hooks/skill-activation-prompt.md` - Activación de skills relacionados
- `.dendrita/hooks/post-tool-use-tracker.md` - Tracking de cambios de archivos
- `.dendrita/hooks/dendrita-alias-activation.md` - Activación de contexto de workspaces
- `.dendrita/users/[user-id]/skills/gestion-proyectos/SKILL.md` - Gestión de proyectos y tareas
- `workspaces/[personal-workspace]/active-projects/[journaling-project]/README.md` - Documentación del proyecto de journaling

---

**Para Cursor:** Este hook es una referencia de comportamiento. Debes leer este archivo y aplicar la lógica documentada cuando detectes **🌙** (emoji luna), menciones "luna", narrativas de trabajo o menciones de journaling. El sistema debe entrar en **modo escucha (default)** para capturar la narrativa completa sin interrumpir. Extrae insights y tareas automáticamente, e integra con otros workspaces de forma proactiva pero respetuosa. 🌙

