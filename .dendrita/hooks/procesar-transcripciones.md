---
name: procesar-transcripciones
description: "Hook de Procesamiento de Transcripciones"
type: hook
created: 2025-11-27
updated: 2025-11-27
tags: ["hook", "behavior-reference", "transcripts", "processing"]
category: behavior-reference
---

# Hook de Procesamiento de Transcripciones

Referencia de comportamiento para Cursor - procesamiento completo de transcripciones con normalización y análisis contextual.

---

## ¿Qué es este Hook?

Este hook documenta el comportamiento esperado que Cursor debe aplicar cuando se busca o procesa una transcripción de reunión.

**Propósito:** Procesar transcripciones de manera estructurada, incluyendo normalización del texto y análisis contextual relevante según el tipo de reunión y entorno.

**"Procesar transcripción" significa:** Aplicar un pipeline completo que incluye identificación de contexto, normalización del texto con LLM, y análisis contextual con LLM.

---

## Comportamiento Esperado

### 1. Activación del Hook

Cursor debe activar el comportamiento de procesamiento de transcripciones cuando:

- ✅ Se busca una transcripción en Google Drive (usando scripts de scraping)
- ✅ Se busca una transcripción desde un evento de calendario
- ✅ El usuario solicita procesar una transcripción existente
- ✅ Se encuentra una transcripción nueva que aún no ha sido procesada

**Condición de activación:**

```markdown
IF (transcripción encontrada en Drive o calendario) OR
   (usuario solicita "procesar transcripción") OR
   (usuario menciona archivo de transcripción existente) OR
   (transcripción nueva detectada)
THEN preguntar si quiere procesarla Y activar comportamiento de procesamiento
```

### 2. Proceso de Procesamiento

Cuando se activa el comportamiento de procesamiento, Cursor debe:

#### Paso 1: Preguntar Confirmación

**Cuando se encuentra una transcripción nueva:**

```markdown
✅ Transcripción encontrada: [título de la reunión]

📄 Información:
   - Fecha: [fecha]
   - Participantes: [número]
   - Tamaño: [tamaño]
   - Fuente: [fuente]

¿Quieres procesar esta transcripción? Esto incluirá:
   1. Identificación del contexto (gestión comercial, proyecto, etc.)
   2. Normalización del texto (corrección de estructura, redacción)
   3. Análisis contextual (necesidades del cliente, acciones, etc.)

(sí/no)
```

**Si el usuario responde "sí":**
- Continuar con el procesamiento completo

**Si el usuario responde "no":**
- Guardar solo la transcripción original
- No procesar
- Continuar normalmente

#### Paso 2: Identificar Entorno y Validar Carpeta Destino

**2.1. Analizar contexto de la transcripción:**

Cursor debe analizar:
- **Título de la reunión:** ¿Menciona cliente, proyecto, propuesta comercial?
- **Participantes:** ¿Son clientes potenciales, stakeholders de proyecto, equipo interno?
- **Contenido inicial:** Leer primeras líneas para identificar tipo de reunión
- **Ubicación del archivo:** Si ya existe, usar la ruta para inferir contexto

**2.2. Clasificar tipo de reunión:**

```markdown
Tipos posibles:
1. Gestión Comercial:
   - Reunión inicial con cliente potencial
   - Propuesta comercial
   - Seguimiento comercial
   - Carpeta destino: workspaces/[workspace]/⚙️ company-management/💼 gestion-comercial/

2. Company Management:
   - Reunión interna de gestión
   - Reunión de stakeholders
   - Reunión estratégica
   - Carpeta destino: workspaces/[workspace]/⚙️ company-management/

3. Active Project:
   - Reunión de proyecto específico
   - Reunión de seguimiento de proyecto
   - Reunión técnica de proyecto
   - Carpeta destino: workspaces/[workspace]/🚀 active-projects/[proyecto]/
```

**2.3. Validar carpeta destino:**

```markdown
1. Identificar workspace:
   - Si la transcripción ya está en un workspace, usar ese
   - Si no, usar workspace por defecto del usuario o preguntar

2. Validar estructura:
   - Verificar que existe la carpeta destino
   - Si no existe, crear estructura necesaria:
     * workspaces/[workspace]/⚙️ company-management/💼 gestion-comercial/proposals/[proyecto]/transcripts/
     * workspaces/[workspace]/⚙️ company-management/data/scraped-content/transcripts/
     * workspaces/[workspace]/🚀 active-projects/[proyecto]/transcripts/ o 📥 reuniones/

3. Confirmar destino:
   - Mostrar al usuario dónde se guardará el análisis
   - Si el destino no es correcto, permitir ajuste
```

#### Paso 3: Normalización de la Transcripción

**3.1. Preparar prompt de normalización:**

Cursor debe crear un prompt para el LLM que incluya:

```markdown
Instrucciones para normalización:
1. Unir cadenas de texto del mismo interlocutor que hayan quedado separadas
2. Mejorar la redacción manteniendo el sentido original
3. Identificar y corregir errores en:
   - Nombres propios (personas, empresas, proyectos)
   - Términos técnicos o específicos del proyecto
   - Fechas y números
4. Mantener estructura de diálogo (interlocutor: texto)
5. Preservar información técnica y específica del contexto
6. Mejorar legibilidad sin cambiar el significado
```

**3.2. Llamar al LLM para normalización:**

```markdown
Modelo recomendado: gpt-4o-mini (balance entre calidad y costo)
Prompt:
"Normaliza la siguiente transcripción de reunión. [Instrucciones arriba]

Transcripción original:
[contenido completo de la transcripción]"
```

**3.3. Guardar transcripción normalizada:**

```markdown
1. Nombre del archivo: [nombre-original]-normalizada.md
2. Ubicación: Misma carpeta que la transcripción original
3. Frontmatter: Incluir metadatos:
   - type: transcript-normalized
   - original_transcript: [ruta al original]
   - normalized_date: [fecha]
   - normalization_model: [modelo usado]
```

#### Paso 4: Análisis Contextual

**4.1. Determinar tipo de análisis según contexto:**

**Para Gestión Comercial (reunión inicial con cliente):**

```markdown
Prompt debe incluir:
- Identificar necesidades del cliente
- Identificar pain points mencionados
- Identificar oportunidades de propuesta
- Identificar stakeholders clave
- Identificar timeline y urgencia
- Identificar presupuesto o recursos mencionados
- Extraer información para propuesta comercial

Contexto adicional:
- Si existe propuesta relacionada, incluir en el prompt
- Si existe información del cliente en stakeholders/, incluir
```

**Para Active Project:**

```markdown
Prompt debe incluir:
- Identificar acciones a realizar (tasks)
- Identificar decisiones tomadas
- Identificar bloqueadores o riesgos
- Identificar dependencias
- Contrastar con master-plan.md del proyecto
- Contrastar con tasks.md existente
- Identificar cambios en alcance o timeline

Contexto adicional:
- Cargar master-plan.md del proyecto
- Cargar project_context.json
- Cargar tasks.md
- Incluir en el prompt para análisis contextual
```

**Para Company Management:**

```markdown
Prompt debe incluir:
- Identificar decisiones estratégicas
- Identificar acciones de gestión
- Identificar stakeholders involucrados
- Identificar temas de governance
- Identificar próximos pasos

Contexto adicional:
- Cargar documentos relevantes de company-management/
- Incluir contexto del workspace
```

**4.2. Preparar prompt de análisis:**

```markdown
Estructura del prompt:
1. Contexto del análisis (tipo de reunión, entorno)
2. Instrucciones específicas según tipo
3. Documentos de contexto relevantes
4. Transcripción normalizada
5. Formato de salida esperado (JSON estructurado)
```

**4.3. Llamar al LLM para análisis:**

```markdown
Modelo recomendado: 
- Análisis complejo (gestión comercial, proyectos): gpt-4-turbo
- Análisis simple (reuniones internas): gpt-4o-mini

Prompt completo con contexto y transcripción normalizada
```

**4.4. Guardar análisis:**

```markdown
1. Formato: JSON estructurado
2. Nombre: [nombre-transcripcion]-analisis.json
3. Ubicación: Misma carpeta que la transcripción
4. Estructura según tipo de análisis:
   
   Gestión Comercial:
   {
     "client_needs": [...],
     "pain_points": [...],
     "opportunities": [...],
     "stakeholders": [...],
     "timeline": {...},
     "budget": {...},
     "proposal_insights": [...]
   }
   
   Active Project:
   {
     "tasks": [...],
     "decisions": [...],
     "blockers": [...],
     "dependencies": [...],
     "scope_changes": [...],
     "timeline_updates": [...],
     "master_plan_alignment": {...}
   }
   
   Company Management:
   {
     "strategic_decisions": [...],
     "management_actions": [...],
     "stakeholders": [...],
     "governance_topics": [...],
     "next_steps": [...]
   }
```

#### Paso 5: Integración con Documentos Existentes

**5.1. Para Gestión Comercial:**

```markdown
1. Si existe propuesta relacionada:
   - Actualizar propuesta con insights del análisis
   - Agregar sección de "Información de reunión"
   - Actualizar necesidades del cliente

2. Si no existe propuesta:
   - Sugerir crear propuesta basada en el análisis
   - Crear estructura de propuesta si el usuario acepta
```

**5.2. Para Active Project:**

```markdown
1. Actualizar tasks.md:
   - Agregar nuevas tareas identificadas
   - Actualizar estado de tareas existentes
   - Marcar tareas completadas si se mencionó

2. Actualizar project_context.json:
   - Agregar decisiones tomadas
   - Actualizar estado del proyecto
   - Agregar bloqueadores o riesgos

3. Actualizar master-plan.md si hay cambios significativos:
   - Documentar cambios de alcance
   - Actualizar timeline si cambió
   - Documentar decisiones estratégicas
```

**5.3. Para Company Management:**

```markdown
1. Actualizar documentos relevantes:
   - Agregar decisiones a documentos de governance
   - Actualizar información de stakeholders
   - Documentar acciones de gestión
```

---

## Integración con Otros Hooks

Este hook se integra con:

1. **Scripts de scraping de transcripciones:**
   - Después de encontrar una transcripción, activar este hook
   - Preguntar si quiere procesarla

2. **work-timeline:**
   - Registrar el procesamiento de transcripción como evento
   - Documentar análisis generado

3. **dendrita-comunicacion:**
   - Si se crean nuevos componentes (scripts, hooks) durante el procesamiento

---

## Casos Especiales

### Transcripción sin contexto claro

Si no se puede determinar el contexto:

```markdown
1. Preguntar al usuario:
   "No pude determinar el contexto de esta reunión. ¿Es:
   - Gestión comercial (reunión con cliente)
   - Proyecto activo (¿cuál?)
   - Gestión interna (company-management)
   - Otro (especificar)"
   
2. Usar la respuesta para clasificar
3. Continuar con el procesamiento
```

### Transcripción muy larga

Si la transcripción excede límites del modelo:

```markdown
1. Dividir en secciones lógicas
2. Procesar cada sección por separado
3. Combinar resultados al final
4. Mantener coherencia en el análisis final
```

### Transcripción con múltiples temas

Si la transcripción cubre múltiples contextos:

```markdown
1. Identificar todos los contextos relevantes
2. Crear análisis separado para cada contexto
3. Guardar análisis en carpetas correspondientes
4. Crear índice de análisis si es necesario
```

---

## Mensajes de Respuesta

### Transcripción Encontrada

```markdown
✅ Transcripción encontrada: [título]

📄 Información:
   - Fecha: [fecha]
   - Participantes: [número]
   - Tamaño: [tamaño]
   - Fuente: [fuente]

¿Quieres procesar esta transcripción? (sí/no)
```

### Procesamiento Iniciado

```markdown
🔄 Procesando transcripción...

📊 Paso 1/3: Identificando contexto...
✅ Contexto identificado: [tipo] → [carpeta destino]

📝 Paso 2/3: Normalizando transcripción...
✅ Transcripción normalizada guardada

🔍 Paso 3/3: Analizando contexto...
✅ Análisis completado
```

### Procesamiento Completado

```markdown
✅ Procesamiento completado

📄 Archivos generados:
   1. Transcripción normalizada: [ruta]
   2. Análisis: [ruta]

📊 Resumen del análisis:
   [Resumen breve según tipo]

💡 Próximos pasos sugeridos:
   [Acciones sugeridas según análisis]
```

---

## Notas para Cursor

1. **Siempre preguntar antes de procesar:**
   - No procesar automáticamente sin confirmación
   - Explicar qué incluye el procesamiento

2. **Usar contexto disponible:**
   - Cargar documentos relevantes según tipo de reunión
   - Incluir contexto en prompts de LLM

3. **Mantener estructura:**
   - Seguir estructura de carpetas del workspace
   - Usar nombres de archivo consistentes

4. **Validar antes de guardar:**
   - Verificar que las carpetas existen
   - Confirmar destino con el usuario si es ambiguo

5. **Documentar proceso:**
   - Registrar en work-timeline si aplica
   - Mantener metadatos en frontmatter

6. **Manejar errores gracefully:**
   - Si falla normalización, continuar con original
   - Si falla análisis, guardar transcripción normalizada
   - Informar al usuario sobre errores

---

## Referencias

- `.dendrita/integrations/scripts/pipelines/meeting-notes-pipeline/process-meeting-transcript.ts` - Script de procesamiento existente
- `.dendrita/integrations/scripts/pipelines/transcripts-pipeline/analyze/analyze-transcript.ts` - Análisis de transcripciones
- `.dendrita/integrations/scripts/pipelines/transcripts-pipeline/analyze/context-enricher.ts` - Detección de contexto
- `.dendrita/hooks/work-timeline.md` - Registro de eventos de trabajo

---

**Para Cursor:** Este hook es una referencia de comportamiento. Debes leer este archivo y aplicar la lógica documentada cuando se encuentre o procese una transcripción. El procesamiento debe ser interactivo, preguntando confirmación al usuario antes de proceder.

