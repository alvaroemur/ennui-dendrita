---
name: pipeline-proyectos
description: Patterns for project and alliance pipeline. Opportunity identification, proposal design with allies, coordinated submissions, pipeline management. Use when working on project pipeline, designing proposals with allies, or submitting funds coordinately.
---

# Skill: Pipeline de Proyectos

## Propósito

Guías y mejores prácticas para gestionar pipeline de proyectos y alianzas, identificando, estructurando y postulando proyectos con aliados del ecosistema de impacto.

## Cuándo Usar Este Skill

- Diseñar propuesta de financiamiento con un aliado
- Mapear convocatorias y fondos relevantes
- Acompañar la postulación de propuestas
- Gestionar múltiples oportunidades simultáneas

## Flujo Estándar

1. **Detección** - Identificación de oportunidad o aliado
2. **Evaluación** - Análisis de fit estratégico
3. **Diseño** - Estructuración de propuesta
4. **Postulación** - Envío y seguimiento
5. **Ejecución** - Si aprobado (usar template de implementación)

## Checklist de Oportunidad

Para cada oportunidad identificada:

- [ ] Evaluación de fit (estratégico, técnico, financiero)
- [ ] Análisis de aliado potencial (capacidades, experiencia, legitimidad)
- [ ] Revisión de convocatoria/fondo (requisitos, timing, montos)
- [ ] Decisión: seguir o no seguir
- [ ] Si sigue: diseño de propuesta
- [ ] Si sigue: asignación de responsable
- [ ] Seguimiento de postulación
- [ ] Resultado: aprobado/rechazado
- [ ] Aprendizaje documentado

## Criterios de Evaluación

- **Fit estratégico:** ¿Se alinea con nuestra misión?
- **Requisitos:** ¿Cumplimos requisitos?
- **Timing:** ¿Tiene sentido el cronograma?
- **Monto:** ¿El monto es adecuado?
- **Probabilidad:** ¿Qué tan probable es aprobación?

## Tipos de Financiamiento

- **Corporativo:** Fundaciones empresariales
- **Filantrópico:** Fundaciones independientes
- **Multilateral:** Bancos de desarrollo, agencias ONU
- **Gobierno:** Programas públicos
- **Blended:** Combinación público-privada

## Aliados Comunes

- ONGs con propósito
- Fundaciones corporativas
- Organismos internacionales
- Empresas con propósito
- Organizaciones de apoyo a emprendedores

## Métricas del Pipeline

- Número de oportunidades detectadas/mes
- Tasa de conversión (evaluación → diseño → postulación)
- Tasa de aprobación (% de propuestas aprobadas)
- Monto total postulado vs. aprobado
- Tiempo promedio diseño → postulación
- ROI por tipo de aliado

## Herramientas Recomendadas

- Hoja de cálculo para tracking de oportunidades
- Template de evaluación de fit
- Template de propuesta de financiamiento
- Sistema de alertas de convocatorias
- Mapa de aliados estratégicos

## Gestión de Múltiples Proyectos

Este tipo de proyecto suele tener **múltiples sub-proyectos simultáneos**:

```
pipeline-proyectos/
├── plan-estrategico.md         # Estrategia general del pipeline
├── contexto-actual.md          # Estado de todas las oportunidades
├── tareas-seguimiento.md       # Checklist general
│
└── oportunidades/
    ├── oportunidad-1/
    │   ├── evaluacion.md
    │   ├── propuesta.md
    │   └── seguimiento.md
    └── oportunidad-2/
        └── ...
```

## Archivos de Referencia

- Template completo: `mejores-practicas/pipeline-proyectos/`
- Instrucciones de agent: `.dentrita/agents/especialista-fundraising.md`
- Mapeo de aliados: `aliados-stakeholders/mapeo-aliados.md`

---

**Este skill se activa automáticamente cuando mencionas "pipeline", "propuesta", "postulación", o trabajas con archivos relacionados con fundraising**

