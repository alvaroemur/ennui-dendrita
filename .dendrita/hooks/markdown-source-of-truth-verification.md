---
name: markdown-source-of-truth-verification
description: "Hook de Verificación de Fuente de Verdad de Documentos Markdown"
type: hook
created: 2025-11-06
updated: 2025-11-06
tags: ["hook", "behavior-reference"]
category: behavior-reference
---

# Hook de Verificación de Fuente de Verdad de Documentos Markdown

Referencia de comportamiento para Cursor - verificación automática de sincronización entre documentos markdown del workspace y datos del sistema de trabajo (JSON/CSV).

---

## ¿Qué es este Hook?

Este hook documenta el comportamiento esperado que Cursor debe aplicar cuando lee un documento markdown del workspace (memoria de la empresa) para verificar que dicho documento sea la "fuente de verdad" comparándolo con los JSON y CSV del sistema de trabajo.

**Propósito:** Asegurar que los documentos markdown del workspace estén sincronizados con los datos del sistema de trabajo (Google Sheets, CSV, JSON) y detectar discrepancias.

**Contexto:** Los documentos markdown en workspaces representan la "memoria de la empresa" y deben reflejar fielmente los datos almacenados en sistemas de trabajo externos (Google Sheets, CSV, JSON).

---

## Comportamiento Esperado

### 1. Activación del Hook

Cursor debe ejecutar esta verificación cuando:

- ✅ Lee un documento markdown del workspace por primera vez en la sesión
- ✅ El documento está ubicado en `workspaces/[workspace]/` (cualquier subdirectorio)
- ✅ El documento es un archivo `.md` que representa información de la empresa/proyecto
- ✅ El documento contiene datos que podrían provenir de sistemas externos (Sheets, CSV, JSON)

**Condición de activación:**

```markdown
SI (lee documento markdown) Y (está en workspaces/[workspace]/) Y (es memoria de empresa)
ENTONCES ejecutar verificación de fuente de verdad
```

**Excepciones (NO ejecutar verificación):**
- Documentos en `.dendrita/` (infraestructura, no memoria de empresa)
- Documentos en `_temp/`, `_clippings/`, `_working-export/` (temporales)
- Documentos que son claramente generados automáticamente (tienen metadata de generación)
- Documentos que no contienen datos estructurados (solo texto narrativo)

### 2. Proceso de Verificación

Cuando se activa la verificación, Cursor debe:

#### Paso 1: Identificar el Tipo de Documento

```markdown
1. Analizar el contenido del markdown para identificar:
   - Tipo de datos (proyectos, clientes, stakeholders, reportes, etc.)
   - Fuente potencial (Google Sheets, CSV, JSON)
   - Metadata de generación (si existe fecha/hora de generación)
   
2. Buscar referencias a fuentes de datos:
   - Enlaces a Google Sheets
   - Referencias a archivos CSV/JSON
   - Metadata que indique origen de datos
```

#### Paso 2: Localizar Datos del Sistema de Trabajo

```markdown
1. Buscar archivos JSON/CSV relacionados en:
   - _temp/sheets-analysis/*.json (datos extraídos de Sheets)
   - _clippings/_imported-manually/*.json, *.csv (datos importados)
   - workspaces/[workspace]/**/*.json (datos del workspace)
   
2. Identificar el archivo más reciente que corresponda al tipo de datos:
   - Comparar timestamps en nombres de archivo
   - Verificar metadata dentro de los archivos
   - Priorizar archivos más recientes
```

#### Paso 3: Ejecutar Script de Verificación

```markdown
1. Ejecutar script de verificación:
   npx ts-node .dendrita/integrations/scripts/verify-markdown-source-of-truth.ts \
     --markdown [ruta-al-markdown] \
     --source [ruta-al-json-o-csv] \
     --type [tipo-de-datos]
   
2. El script debe:
   - Comparar datos clave entre markdown y JSON/CSV
   - Detectar discrepancias (valores diferentes, datos faltantes, datos adicionales)
   - Generar reporte de verificación
   - Retornar código de salida:
     * 0 = Sincronizado (markdown es fuente de verdad)
     * 1 = Discrepancias detectadas
     * 2 = No se pudo verificar (falta fuente de datos)
```

#### Paso 4: Interpretar Resultados

```markdown
SI (código de salida = 0):
  → Documento está sincronizado
  → Continuar normalmente
  → Mostrar confirmación breve: "✅ Documento verificado - sincronizado con datos del sistema"

SI (código de salida = 1):
  → Discrepancias detectadas
  → Mostrar resumen de discrepancias al usuario
  → Sugerir actualizar el markdown o regenerar desde la fuente
  → Preguntar al usuario qué acción tomar

SI (código de salida = 2):
  → No se pudo verificar (falta fuente de datos)
  → Informar al usuario que no se pudo verificar
  → Sugerir ejecutar script de extracción de datos si es necesario
  → Continuar normalmente (no bloquear)
```

### 3. Tipos de Verificación

#### Verificación de Reportes de Proyectos

**Cuando:** El markdown es un reporte de proyectos (ej: `reporte-detallado-proyectos.md`)

**Fuente de datos:** `_temp/sheets-analysis/proyectos-completos-*.json` o `_temp/sheets-analysis/analisis-detallado-*.json`

**Qué verificar:**
- Total de proyectos
- Estadísticas (duración promedio, rango de fechas)
- Análisis por empresa
- Top clientes
- Proyectos por año

**Ejemplo de comando:**
```bash
npx ts-node .dendrita/integrations/scripts/verify-markdown-source-of-truth.ts \
  --markdown workspaces/personal/active-projects/experiencia-carrera/reporte-detallado-proyectos.md \
  --source _temp/sheets-analysis/proyectos-completos-1762414324434.json \
  --type proyectos
```

#### Verificación de Stakeholders

**Cuando:** El markdown contiene información de stakeholders/aliados

**Fuente de datos:** `workspaces/[workspace]/stakeholders/fichas-json/*.json`

**Qué verificar:**
- Nombres de stakeholders
- Información de contacto
- Relaciones con proyectos
- Metadata

#### Verificación de Datos de Proyecto

**Cuando:** El markdown es `current-context.md`, `master-plan.md`, o `tasks.md` de un proyecto

**Fuente de datos:** JSON/CSV relacionados con el proyecto específico

**Qué verificar:**
- Estado del proyecto
- Tareas completadas
- Fechas importantes
- Métricas del proyecto

### 4. Reporte de Verificación

El script debe generar un reporte que incluya:

```markdown
## Reporte de Verificación de Fuente de Verdad

**Documento:** [ruta-al-markdown]
**Fuente de datos:** [ruta-al-json-csv]
**Fecha de verificación:** [timestamp]

### Estado: ✅ Sincronizado / ⚠️ Discrepancias / ❌ No verificado

### Discrepancias detectadas:
- [Lista de discrepancias si las hay]

### Recomendaciones:
- [Acciones sugeridas]
```

### 5. Comportamiento No Intrusivo

**Principios:**
- ✅ La verificación NO debe bloquear la lectura del documento
- ✅ Si la verificación falla, mostrar advertencia pero continuar
- ✅ Solo mostrar resultados si hay discrepancias significativas
- ✅ No ejecutar verificación múltiples veces para el mismo documento en la misma sesión
- ✅ Cachear resultados de verificación durante la sesión

**Mensajes al usuario:**

**Si está sincronizado:**
```markdown
✅ Documento verificado - sincronizado con datos del sistema
```

**Si hay discrepancias:**
```markdown
⚠️ Discrepancias detectadas entre el documento y los datos del sistema:

[Resumen de discrepancias]

¿Quieres actualizar el documento o regenerarlo desde la fuente?
```

**Si no se puede verificar:**
```markdown
ℹ️ No se pudo verificar la sincronización (falta fuente de datos).

El documento se puede leer normalmente, pero no se pudo confirmar que esté sincronizado con los datos del sistema.
```

---

## Integración con Otros Hooks

Este hook se integra con:

1. **post-tool-use-tracker:**
   - Registrar qué documentos se han verificado
   - Evitar verificaciones duplicadas en la misma sesión

2. **dendrita-infrastructure-modification:**
   - Si se modifica el script de verificación, actualizar documentación

3. **session-initialization-verification:**
   - No se ejecuta en inicialización (solo cuando se lee un documento)

---

## Casos Especiales

### Documento Generado Automáticamente

Si el markdown tiene metadata que indica que fue generado automáticamente:

```markdown
**Generado:** 6/11/2025, 2:53:31
**Fuente:** [Google Sheets](...)
```

**Comportamiento:**
- Verificar que la fecha de generación sea reciente
- Si es antigua, sugerir regenerar el documento
- Comparar con la fuente indicada

### Múltiples Fuentes de Datos

Si hay múltiples archivos JSON/CSV que podrían ser la fuente:

**Comportamiento:**
- Priorizar el archivo más reciente (basado en timestamp en nombre o metadata)
- Si hay ambigüedad, mostrar opciones al usuario
- Usar el archivo que mejor coincida con el tipo de datos

### Documento Sin Fuente de Datos

Si no se encuentra una fuente de datos correspondiente:

**Comportamiento:**
- No bloquear la lectura del documento
- Informar al usuario que no se pudo verificar
- Sugerir ejecutar script de extracción si es necesario
- Continuar normalmente

---

## Mensajes de Respuesta

### Verificación Inicial

```markdown
🔍 Verificando sincronización del documento con datos del sistema...
```

### Documento Sincronizado

```markdown
✅ Documento verificado - sincronizado con datos del sistema

El documento está actualizado y refleja correctamente los datos del sistema de trabajo.
```

### Discrepancias Detectadas

```markdown
⚠️ Discrepancias detectadas entre el documento y los datos del sistema:

**Discrepancias encontradas:**
- Total de proyectos: Documento muestra 116, sistema tiene 120
- Fecha de actualización: Documento del 6/11/2025, datos más recientes del 7/11/2025

**Recomendaciones:**
1. Regenerar el documento desde la fuente de datos
2. Actualizar manualmente las secciones con discrepancias
3. Verificar si hay datos nuevos en el sistema

¿Quieres que te ayude a actualizar el documento?
```

### No se Puede Verificar

```markdown
ℹ️ No se pudo verificar la sincronización

**Razón:** No se encontró una fuente de datos correspondiente.

El documento se puede leer normalmente, pero no se pudo confirmar que esté sincronizado con los datos del sistema.

**Sugerencias:**
- Si el documento proviene de un Google Sheet, ejecuta el script de extracción
- Si hay datos en CSV/JSON, colócalos en `_temp/sheets-analysis/` o `_clippings/_imported-manually/`
```

---

## Notas para Cursor

1. **Ejecutar automáticamente:**
   - Verificar cuando se lee un markdown del workspace por primera vez
   - No interrumpir el flujo de trabajo del usuario
   - Ejecutar en segundo plano si es posible

2. **Ser no intrusivo:**
   - Si está sincronizado, mostrar confirmación breve
   - Si hay discrepancias, informar pero no bloquear
   - Si no se puede verificar, continuar normalmente

3. **Mantener contexto de sesión:**
   - Cachear resultados de verificación durante la sesión
   - No verificar el mismo documento múltiples veces
   - Recordar qué documentos se han verificado

4. **Priorizar experiencia del usuario:**
   - La verificación debe ser rápida (< 5 segundos)
   - Si tarda más, ejecutar en segundo plano
   - No bloquear la lectura del documento

5. **Manejar errores gracefully:**
   - Si el script falla, no bloquear la lectura
   - Informar al usuario pero continuar
   - Registrar errores para debugging

---

## Referencias

- `.dendrita/integrations/scripts/verify-markdown-source-of-truth.ts` - Script de verificación
- `.dendrita/integrations/scripts/get-full-projects-data.ts` - Script de extracción de datos de Sheets
- `.dendrita/integrations/scripts/analyze-projects-sheet.ts` - Script de análisis de Sheets
- `.dendrita/hooks/post-tool-use-tracker.sh` - Tracker de uso de herramientas
- `_temp/sheets-analysis/` - Directorio de datos extraídos de Sheets

---

**Para Cursor:** Este hook es una referencia de comportamiento. Debes leer este archivo y aplicar la lógica documentada cuando leas un documento markdown del workspace. Ejecuta el script de verificación automáticamente y muestra los resultados de forma no intrusiva. NO bloquees la lectura del documento si la verificación falla.

