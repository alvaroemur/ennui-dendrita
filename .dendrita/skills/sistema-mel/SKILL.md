---
name: sistema-mel
description: Patterns for MEL (Monitoring, Evaluation, and Learning) systems. Theory of change design, capture systems (quantitative + qualitative), data and impact analysis, MEL report generation, technology and AI integration. Use when designing MEL systems, analyzing impact data, generating quarterly reports, or integrating quantitative and qualitative metrics.
---

# Skill: Sistema MEL

## Propósito

Guías y mejores prácticas para implementar sistemas de Monitoreo, Evaluación y Aprendizaje (MEL) que combinan métricas duras con evidencia cualitativa.

## Cuándo Usar Este Skill

- Diseñar sistemas MEL para un proyecto
- Integrar métricas cuantitativas y cualitativas
- Requerir trazabilidad para auditorías y compliance
- Crear tableros y sistemas de información
- Generar reportes de impacto

## Principios del Sistema MEL de ennui

- **Utilidad sobre ornamentación:** cada métrica debe habilitar una decisión
- **Evidencia honesta:** medimos lo que importa, no por medir
- **Integración cuantitativa + cualitativa:** datos duros + historias
- **Diseño centrado en el uso:** tecnología alineada al ciclo de decisión
- **Trazabilidad:** datos auditables y compatibles con compliance

## Componentes Estándar

### 1. Indicadores Cuantitativos

- KPIs de negocio (alcance, presupuesto, tiempo)
- Indicadores de impacto (personas beneficiadas, cambios medibles)
- Indicadores financieros (ROI, costos por beneficiario)
- Indicadores operativos (tasas de participación, cumplimiento)

### 2. Evidencia Cualitativa

- Entrevistas estructuradas
- Diarios de campo
- Feedback de usuarios
- Historias de cambio
- Testimonios

### 3. Tecnología Apropiada

- Tableros MEL que conversan con flujo operativo
- Formularios de captura cualitativa
- Automatizaciones alineadas al ciclo de decisión
- Integración con herramientas existentes (Drive, Sheets)

## Diseño de Teoría de Cambio

**Debes:**
- Definir teoría de cambio mínima viable
- Identificar indicadores clave (cuantitativos + cualitativos)
- Mapear supuestos críticos
- Definir rutas de valor
- Establecer líneas base

**Preguntas clave:**
- ¿Qué cambio queremos lograr?
- ¿Cómo llegaremos allí? (lógica causal)
- ¿Qué indicadores medirán el cambio?
- ¿Qué supuestos son críticos?

## Diseño de Sistemas de Captura

**Debes:**
- Diseñar tableros MEL que conversen con flujo operativo
- Crear formularios de captura cualitativa
- Integrar con herramientas existentes
- Automatizar donde tenga sentido
- Alinear tecnología al ciclo real de decisión

**Preguntas clave:**
- ¿Qué decisiones necesitan estos datos?
- ¿Cuándo se necesitan? (timing de captura)
- ¿Quién los usará? (diseño de usuario)
- ¿Cómo se integrarán con flujo operativo?

## Análisis de Datos

**Tipos de análisis:**
- **Descriptivo:** ¿Qué está pasando?
- **Diagnóstico:** ¿Por qué está pasando?
- **Predictivo:** ¿Qué podría pasar?
- **Prescriptivo:** ¿Qué deberíamos hacer?

**Siempre integra cuantitativo + cualitativo:**
- Los datos cuantitativos dicen "qué" pasó
- La evidencia cualitativa dice "cómo" y "por qué"
- Juntos crean narrativa completa y creíble

## Generación de Reportes

**Tipos de reportes:**
1. **Trimestrales a aliados/donantes:** Resultados, historias, aprendizajes
2. **Ejecutivo a comité:** Métricas clave, riesgos, recomendaciones
3. **Para auditorías:** Trazabilidad completa, evidencia consolidada

**Archivos a usar:**
- `herramientas-plantillas/template-reporte-trimestral.md`
- `proyectos-activos/[proyecto]/contexto-actual.md`

## Herramientas Recomendadas

- **Tableros:** Google Sheets, Airtable, Power BI
- **Formularios:** Google Forms, Typeform
- **Automatización:** Zapier, Make, Apps Script
- **Análisis cualitativo:** IA responsable (ennui-rag, etc.)
- **Visualización:** Data Studio, Tableau

## Archivos de Referencia

- Template completo: `mejores-practicas/sistema-mel/`
- Instrucciones de agent: `.dendrita/agents/analista-mel.md`
- Template de reporte: `herramientas-plantillas/template-reporte-trimestral.md`

---

**Este skill se activa automáticamente cuando mencionas "MEL", "métricas", "impacto", o trabajas con archivos relacionados con análisis de datos**

