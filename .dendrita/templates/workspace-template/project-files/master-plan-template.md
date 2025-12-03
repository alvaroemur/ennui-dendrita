---
# Template: master_plan.md
# Este archivo es parseado automáticamente por update-project-context.ts
# 
# NOTA: Este template se copia como master_plan.md (con guión bajo)
# 
# ESTRUCTURA REQUERIDA PARA PARSING:
# - Headers: ## o # para secciones principales
# - Listas: - o * para items
# - Fases: ### Nombre Fase dentro de ## Fases
# 
# VARIANTES ACEPTADAS (español/inglés):
# - Propósito / Resumen / Executive Summary / Objetivo
# - Fases / Phases
# - Success Metrics / Métricas / Métricas de Éxito
# - Risks / Riesgos / Riesgos y Mitigaciones
#
# REFERENCIA: .dendrita/integrations/scripts/pipelines/context-pipeline/update-project-context.ts (líneas 33-103)
---

> **📋 Template basado en:** `.dendrita/templates/workspace-template/project-files/master-plan-template.md`
> 
> Para revisar los requisitos de parsing y estructura completa, consulta el template original.

# [Nombre del Proyecto]

## Propósito
<!-- 
  PARSER BUSCA: ## Propósito, ## Resumen, ## Executive Summary, o ## Objetivo
  EXTRACCIÓN: Todo el contenido hasta el siguiente ## o ---
  VARIANTES ACEPTADAS: Propósito | Resumen | Executive Summary | Objetivo
-->
[Descripción breve del propósito del proyecto. Esta sección se extrae como executiveSummary en el JSON.]

## Fases
<!-- 
  PARSER BUSCA: ## Fases o ## Phases
  EXTRACCIÓN: Cada fase debe estar en ### Nombre Fase
  TIMELINE OPCIONAL: Puedes incluir "timeline: [fecha]" en la descripción
  VARIANTES ACEPTADAS: Fases | Phases
-->
### Fase 1: [Nombre de la Fase]
<!-- 
  FORMATO: ### Nombre Fase
  DESCRIPCIÓN: Todo el texto después del nombre hasta el siguiente ###
  TIMELINE OPCIONAL: Incluye "timeline: Q1 2025" o similar en la descripción
-->
Descripción de la fase 1. Puedes incluir timeline: Q1 2025 si es relevante.

### Fase 2: [Nombre de la Fase]
Descripción de la fase 2.

### Fase 3: [Nombre de la Fase]
Descripción de la fase 3.

## Métricas
<!-- 
  PARSER BUSCA: ## Success Metrics, ## Métricas, o ## Métricas de Éxito
  EXTRACCIÓN: Lista con - o * (cada línea debe empezar con - o *)
  VARIANTES ACEPTADAS: Success Metrics | Métricas | Métricas de Éxito
-->
- Métrica de éxito 1
- Métrica de éxito 2
- Métrica de éxito 3

## Riesgos
<!-- 
  PARSER BUSCA: ## Risks, ## Riesgos, o ## Riesgos y Mitigaciones
  EXTRACCIÓN: Lista con - o * o ### (cada riesgo puede ser un item de lista o un ###)
  MITIGACIÓN OPCIONAL: Puedes incluir "mitigation: [descripción]" en el texto del riesgo
  VARIANTES ACEPTADAS: Risks | Riesgos | Riesgos y Mitigaciones
-->
- Riesgo 1: Descripción del riesgo. Mitigation: Descripción de la mitigación.
- Riesgo 2: Descripción del riesgo.
- Riesgo 3: Descripción del riesgo. Mitigation: Descripción de la mitigación.

---

## Notas sobre el Template

**IMPORTANTE PARA EL PARSING:**
1. **Headers de sección**: Usa `##` para secciones principales (Propósito, Fases, Métricas, Riesgos)
2. **Fases**: Usa `###` para cada fase individual dentro de `## Fases`
3. **Listas**: Usa `-` o `*` para items (Métricas y Riesgos)
4. **Variantes**: El parser acepta nombres en español o inglés, pero deben coincidir exactamente
5. **Timeline en fases**: Puedes incluir "timeline: [fecha]" en la descripción de la fase
6. **Mitigación en riesgos**: Puedes incluir "mitigation: [descripción]" en el texto del riesgo

**REFERENCIA DEL PARSER:**
- Archivo: `.dendrita/integrations/scripts/pipelines/context-pipeline/update-project-context.ts`
- Función: `parseMasterPlan()` (líneas 33-103)
- Si una sección no se encuentra, el parser devuelve estructura vacía pero mantiene `rawContent`

**CONTENIDO NO ESTRUCTURADO:**
- Todo el contenido se guarda en `rawContent` del JSON
- Las secciones estructuradas se extraen adicionalmente en campos específicos
- Puedes agregar cualquier contenido adicional fuera de las secciones requeridas

