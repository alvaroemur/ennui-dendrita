---
name: dendrita-memory
description: "Dendrita Memory Hook"
type: hook
created:
  2025-11-06T00:00:00.000Z
  
updated:
  2025-11-06T00:00:00.000Z
  
tags: ["hook", "behavior-reference"]
category: behavior-reference
---

# Hook de Dendrita Memoria

Referencia de comportamiento para Cursor - recuperación de información histórica y contexto pasado del sistema dendrita.

---

## ¿Qué es este Hook?

Este hook documenta el comportamiento esperado que Cursor debe aplicar cuando el usuario solicita recuperar información histórica, contexto pasado o decisiones anteriores del sistema dendrita.

**Propósito:** Recuperar información histórica, contexto pasado, decisiones anteriores y evolución del sistema dendrita, permitiendo al usuario acceder a la "memoria" del sistema.

**Diferencia con otros hooks:**
- Este hook se enfoca en recuperar información histórica
- Accede a contexto pasado y decisiones anteriores
- Muestra evolución del sistema a lo largo del tiempo
- Proporciona perspectiva histórica sobre el trabajo

---

## Comportamiento Esperado

### 1. Activación del Hook

Cursor debe ejecutar este comportamiento cuando:

- ✅ El usuario dice "dendrita memoria", "dendrita memory", "muéstrame la memoria" o "show me the memory"
- ✅ El usuario pregunta "qué decidimos antes sobre X" o "what did we decide before about X"
- ✅ El usuario solicita "historial de decisiones" o "decision history"
- ✅ El usuario menciona "contexto pasado", "past context", "información histórica" o "historical information"
- ✅ El usuario pregunta "cómo evolucionó X", "how did X evolve", "qué cambió en X" o "what changed in X"

**Patrones de activación (bilingües):**

```markdown
- "dendrita memoria" / "dendrita memory"
- "muéstrame la memoria" / "show me the memory"
- "qué decidimos antes sobre [tema]" / "what did we decide before about [topic]"
- "historial de decisiones" / "decision history"
- "contexto pasado" / "past context"
- "información histórica" / "historical information"
- "cómo evolucionó [proyecto/componente]" / "how did [project/component] evolve"
- "qué cambió en [proyecto/componente]" / "what changed in [project/component]"
```

### 2. Proceso de Recuperación

Cuando se activa el hook, Cursor debe:

#### Paso 1: Identificación del Contexto

```markdown
1. Identificar qué información histórica se solicita:
   - Proyecto específico
   - Decisión específica
   - Componente del sistema
   - Período de tiempo
   - Tema o área

2. Si no se especifica:
   - Preguntar al usuario qué información histórica necesita
   - Ofrecer opciones: proyectos, decisiones, componentes, evolución
```

#### Paso 2: Búsqueda de Información Histórica

```markdown
1. Buscar en archivos históricos:
   - `current-context.md` de proyectos (versiones anteriores)
   - `master-plan.md` de proyectos (evolución)
   - `tasks.md` de proyectos (tareas completadas)
   - Archivos en `_archived-projects/`
   - Documentos en `company-management/`

2. Buscar en clippings y notas:
   - `_clippings/` para información capturada
   - `_temp/` para trabajo temporal histórico
   - `_working-export/` para exportaciones pasadas

3. Buscar en journaling:
   - Entradas de journaling anteriores
   - Insights históricos
   - Decisiones documentadas en journaling
```

#### Paso 3: Reconstrucción del Contexto

```markdown
1. Reconstruir contexto histórico:
   - Estado del proyecto en diferentes momentos
   - Decisiones tomadas y razones
   - Cambios realizados y motivos
   - Evolución de objetivos y estrategias

2. Identificar puntos clave:
   - Momentos de cambio significativo
   - Decisiones importantes
   - Eventos relevantes
   - Lecciones aprendidas

3. Mostrar evolución:
   - Cambios a lo largo del tiempo
   - Progreso hacia objetivos
   - Adaptaciones y ajustes
   - Tendencias y patrones
```

#### Paso 4: Presentación de Memoria

```markdown
1. Organizar información histórica:
   - Por cronología (más antiguo a más reciente)
   - Por tema o área
   - Por proyecto o componente
   - Por tipo de información (decisiones, cambios, evolución)

2. Proporcionar contexto:
   - Fechas relevantes
   - Estado en cada momento
   - Razones de cambios
   - Impacto de decisiones

3. Destacar información relevante:
   - Decisiones importantes
   - Cambios significativos
   - Lecciones aprendidas
   - Patrones identificados
```

### 3. Formato de Salida

El output debe seguir este formato:

```markdown
# 🧠 Dendrita Memoria

## Información Histórica Solicitada

### Contexto Histórico
- [Contexto 1 con fecha y estado]
- [Contexto 2 con fecha y estado]
- [Contexto 3 con fecha y estado]

### Decisiones Pasadas
- [Decisión 1] - [Fecha] - [Razón]
- [Decisión 2] - [Fecha] - [Razón]
- [Decisión 3] - [Fecha] - [Razón]

### Evolución
- [Momento 1] - [Estado] - [Cambios]
- [Momento 2] - [Estado] - [Cambios]
- [Momento 3] - [Estado] - [Cambios]

## Lecciones Aprendidas

- [Lección 1]
- [Lección 2]
- [Lección 3]

## Patrones Históricos

- [Patrón 1]
- [Patrón 2]
- [Patrón 3]
```

### 4. Consideraciones Especiales

#### Búsqueda Profunda

```markdown
- Buscar en múltiples ubicaciones
- Revisar versiones anteriores de archivos
- Analizar cambios en git (si está disponible)
- Revisar documentación histórica
```

#### Reconstrucción de Contexto

```markdown
- Combinar información de múltiples fuentes
- Identificar relaciones entre eventos
- Mostrar causa y efecto
- Proporcionar narrativa coherente
```

#### Relevancia

```markdown
- Filtrar información relevante
- Priorizar información más reciente
- Destacar información más importante
- Proporcionar resumen ejecutivo
```

---

## Referencias de Archivos

**Archivos de referencia:**
- `workspaces/[workspace]/active-projects/[proyecto]/current-context.md` - Contexto actual (versiones anteriores)
- `workspaces/[workspace]/active-projects/[proyecto]/master-plan.md` - Plan maestro (evolución)
- `workspaces/[workspace]/active-projects/[proyecto]/tasks.md` - Tareas (historial)
- `workspaces/[workspace]/_archived-projects/` - Proyectos archivados
- `_clippings/` - Clippings históricos
- `.dendrita/hooks/journaling.md` - Journaling histórico

**Para Cursor:**
- Leer estos archivos para recuperar información histórica
- NO intentar ejecutarlos
- Aplicar el comportamiento documentado cuando el usuario solicite memoria

---

## Diferencia con Otros Hooks

- **Este hook es de recuperación histórica:** Accede a información pasada
- **Reconstruye contexto:** Muestra cómo era el sistema antes
- **Muestra evolución:** Presenta cambios a lo largo del tiempo
- **Proporciona perspectiva:** Ayuda a entender el presente desde el pasado

---

## Ejemplo de Uso

**Usuario:** "dendrita memoria, qué decidimos antes sobre el proyecto X"

**Cursor debe:**
1. Identificar el proyecto X
2. Buscar información histórica sobre decisiones
3. Reconstruir contexto histórico
4. Presentar decisiones pasadas con fechas y razones
5. Mostrar evolución del proyecto
6. Destacar lecciones aprendidas

---

**Para más información:** Ver `.dendrita/hooks/journaling.md` para captura de narrativas históricas, y `.dendrita/hooks/working-context.md` para contexto de trabajo actual.

