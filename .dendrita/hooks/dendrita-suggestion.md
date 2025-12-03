---
name: dendrita-suggestion
description: "Dendrita Suggestion Hook"
type: hook
created:
  2025-11-06T00:00:00.000Z
  
updated:
  2025-11-06T00:00:00.000Z
  
tags: ["hook", "behavior-reference"]
category: behavior-reference
---

# Hook de Dendrita Sugerencia

Referencia de comportamiento para Cursor - generación de sugerencias inteligentes basadas en contexto del sistema dendrita.

---

## ¿Qué es este Hook?

Este hook documenta el comportamiento esperado que Cursor debe aplicar cuando el usuario solicita sugerencias o recomendaciones basadas en el contexto actual del sistema dendrita.

**Propósito:** Generar sugerencias inteligentes y contextualizadas sobre próximos pasos, mejoras, optimizaciones y acciones recomendadas basadas en el estado actual del sistema.

**Diferencia con otros hooks:**
- Este hook se enfoca en generar sugerencias proactivas
- Analiza el contexto actual para proponer acciones
- Prioriza sugerencias por impacto y urgencia
- Proporciona recomendaciones accionables

---

## Comportamiento Esperado

### 1. Activación del Hook

Cursor debe ejecutar este comportamiento cuando:

- ✅ El usuario dice "dendrita sugerencia", "dendrita suggestion", "qué me sugieres" o "what do you suggest"
- ✅ El usuario pregunta "qué debería hacer ahora" o "what should I do now"
- ✅ El usuario solicita "recomendaciones", "recommendations", "sugerencias" o "suggestions"
- ✅ El usuario menciona "próximos pasos", "next steps", "qué sigue" o "what's next"
- ✅ El usuario pregunta "cómo puedo mejorar X" o "how can I improve X"

**Patrones de activación (bilingües):**

```markdown
- "dendrita sugerencia" / "dendrita suggestion"
- "qué me sugieres" / "what do you suggest"
- "qué debería hacer ahora" / "what should I do now"
- "recomendaciones" / "recommendations"
- "sugerencias" / "suggestions"
- "próximos pasos" / "next steps"
- "qué sigue" / "what's next"
- "cómo puedo mejorar [X]" / "how can I improve [X]"
```

### 2. Proceso de Generación de Sugerencias

Cuando se activa el hook, Cursor debe:

#### Paso 1: Análisis del Contexto Actual

```markdown
1. Analizar estado actual del sistema:
   - Proyectos activos y su estado
   - Tareas pendientes y prioridades
   - Stakeholders y relaciones
   - Recursos disponibles
   - Oportunidades identificadas

2. Analizar trabajo reciente:
   - Actividad reciente en proyectos
   - Tareas completadas recientemente
   - Decisiones tomadas
   - Cambios realizados

3. Analizar patrones:
   - Patrones de trabajo
   - Áreas de alta/baja actividad
   - Oportunidades de optimización
   - Riesgos o áreas de atención
```

#### Paso 2: Identificación de Oportunidades

```markdown
1. Identificar oportunidades de mejora:
   - Proyectos que necesitan atención
   - Tareas que están bloqueadas
   - Stakeholders que necesitan seguimiento
   - Automatizaciones posibles
   - Optimizaciones recomendadas

2. Identificar oportunidades de crecimiento:
   - Nuevos proyectos sugeridos
   - Expansión de proyectos existentes
   - Nuevas conexiones posibles
   - Oportunidades de sinergia

3. Identificar oportunidades de optimización:
   - Procesos que pueden mejorarse
   - Recursos que pueden optimizarse
   - Flujos de trabajo que pueden simplificarse
   - Automatizaciones que pueden implementarse
```

#### Paso 3: Generación de Sugerencias

```markdown
1. Generar sugerencias por categoría:
   - Acciones inmediatas (urgentes)
   - Mejoras a corto plazo
   - Optimizaciones a medio plazo
   - Oportunidades a largo plazo

2. Priorizar sugerencias:
   - Por impacto (alto, medio, bajo)
   - Por urgencia (urgente, importante, opcional)
   - Por facilidad de implementación
   - Por alineación con objetivos

3. Proporcionar contexto:
   - Razón de la sugerencia
   - Impacto esperado
   - Esfuerzo requerido
   - Próximos pasos sugeridos
```

#### Paso 4: Presentación de Sugerencias

```markdown
1. Organizar sugerencias:
   - Por prioridad (más importante primero)
   - Por categoría (acción, mejora, optimización)
   - Por tiempo (inmediato, corto, medio, largo plazo)

2. Proporcionar detalles:
   - Descripción clara de la sugerencia
   - Razón y justificación
   - Impacto esperado
   - Esfuerzo requerido
   - Próximos pasos concretos

3. Hacer accionables:
   - Cada sugerencia debe ser específica
   - Incluir pasos concretos
   - Sugerir recursos o herramientas
   - Proporcionar contexto necesario
```

### 3. Formato de Salida

El output debe seguir este formato:

```markdown
# 💡 Dendrita Sugerencias

## Sugerencias Prioritarias

### 🔴 Urgentes (Acción Inmediata)
1. **[Sugerencia 1]**
   - **Razón:** [Por qué es urgente]
   - **Impacto:** [Impacto esperado]
   - **Esfuerzo:** [Esfuerzo requerido]
   - **Próximos pasos:** [Pasos concretos]

2. **[Sugerencia 2]**
   - **Razón:** [Por qué es urgente]
   - **Impacto:** [Impacto esperado]
   - **Esfuerzo:** [Esfuerzo requerido]
   - **Próximos pasos:** [Pasos concretos]

### 🟡 Importantes (Corto Plazo)
1. **[Sugerencia 3]**
   - **Razón:** [Por qué es importante]
   - **Impacto:** [Impacto esperado]
   - **Esfuerzo:** [Esfuerzo requerido]
   - **Próximos pasos:** [Pasos concretos]

2. **[Sugerencia 4]**
   - **Razón:** [Por qué es importante]
   - **Impacto:** [Impacto esperado]
   - **Esfuerzo:** [Esfuerzo requerido]
   - **Próximos pasos:** [Pasos concretos]

### 🟢 Opcionales (Medio/Largo Plazo)
1. **[Sugerencia 5]**
   - **Razón:** [Por qué es valiosa]
   - **Impacto:** [Impacto esperado]
   - **Esfuerzo:** [Esfuerzo requerido]
   - **Próximos pasos:** [Pasos concretos]

## Oportunidades Identificadas

### Mejoras
- [Mejora 1]
- [Mejora 2]
- [Mejora 3]

### Optimizaciones
- [Optimización 1]
- [Optimización 2]
- [Optimización 3]

### Nuevas Oportunidades
- [Oportunidad 1]
- [Oportunidad 2]
- [Oportunidad 3]
```

### 4. Consideraciones Especiales

#### Contextualización

```markdown
- Analizar contexto actual antes de sugerir
- Considerar objetivos y prioridades
- Tener en cuenta recursos disponibles
- Considerar restricciones y limitaciones
```

#### Priorización

```markdown
- Priorizar por impacto y urgencia
- Considerar facilidad de implementación
- Alinear con objetivos estratégicos
- Balancear corto y largo plazo
```

#### Accionabilidad

```markdown
- Cada sugerencia debe ser específica
- Incluir pasos concretos
- Proporcionar contexto necesario
- Sugerir recursos o herramientas
```

---

## Referencias de Archivos

**Archivos de referencia:**
- `workspaces/[workspace]/active-projects/[proyecto]/current-context.md` - Contexto actual
- `workspaces/[workspace]/active-projects/[proyecto]/tasks.md` - Tareas pendientes
- `workspaces/[workspace]/active-projects/[proyecto]/master-plan.md` - Plan maestro
- `.dendrita/hooks/working-context.md` - Contexto de trabajo
- `.dendrita/hooks/dendrita-openup.md` - Hidden insights

**Para Cursor:**
- Leer estos archivos para analizar contexto
- NO intentar ejecutarlos
- Aplicar el comportamiento documentado cuando el usuario solicite sugerencias

---

## Diferencia con Otros Hooks

- **Este hook es proactivo:** Genera sugerencias sin que el usuario las solicite explícitamente
- **Basado en contexto:** Analiza el estado actual para proponer acciones
- **Priorizado:** Organiza sugerencias por impacto y urgencia
- **Accionable:** Proporciona pasos concretos para cada sugerencia

---

## Ejemplo de Uso

**Usuario:** "dendrita sugerencia"

**Cursor debe:**
1. Analizar contexto actual del sistema
2. Identificar oportunidades de mejora
3. Generar sugerencias priorizadas
4. Proporcionar razones y contexto
5. Incluir próximos pasos concretos
6. Presentar en formato estructurado

---

**For more information:** See `.dendrita/hooks/dendrita-openup.md` for insights revelation, and `.dendrita/hooks/working-context.md` for current work context.

