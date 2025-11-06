---
name: destpate-dendrita
description: "Hook de Destápate Dendrita"
type: hook
created: 2025-11-06
updated: 2025-11-06
tags: ["hook", "behavior-reference"]
category: behavior-reference
---

# Hook de Destápate Dendrita

Referencia de comportamiento para Cursor - revelación de insights ocultos, patrones y conexiones no obvias en el sistema dendrita.

---

## ¿Qué es este Hook?

Este hook documenta el comportamiento esperado que Cursor debe aplicar cuando el usuario solicita que dendrita "se destape" y revele información oculta, patrones, conexiones o insights no obvios.

**Propósito:** Revelar información oculta, patrones, conexiones y insights que no son obvios a primera vista, ayudando al usuario a descubrir relaciones, oportunidades y áreas de mejora en su sistema dendrita.

**Diferencia con otros hooks:**
- Este hook se enfoca en revelar información oculta o no obvia
- Genera insights y conexiones que no son evidentes
- Analiza patrones y relaciones entre componentes
- Proporciona perspectivas nuevas sobre el sistema

---

## Comportamiento Esperado

### 1. Activación del Hook

Cursor debe ejecutar este comportamiento cuando:

- ✅ El usuario dice "destápate dendrita" o "destápate"
- ✅ El usuario solicita "muéstrame insights ocultos"
- ✅ El usuario pregunta "qué conexiones hay que no veo"
- ✅ El usuario menciona "revela patrones" o "muéstrame lo que no es obvio"
- ✅ El usuario solicita "análisis profundo" o "insights ocultos"

**Patrones de activación:**

```markdown
- "destápate dendrita"
- "destápate"
- "muéstrame insights ocultos"
- "qué conexiones hay que no veo"
- "revela patrones"
- "muéstrame lo que no es obvio"
- "análisis profundo"
- "insights ocultos"
```

### 2. Proceso de Revelación

Cuando se activa el hook, Cursor debe:

#### Paso 1: Análisis de Patrones

```markdown
1. Analizar proyectos activos para identificar:
   - Proyectos sin actualizaciones recientes
   - Proyectos con tareas pendientes antiguas
   - Proyectos con stakeholders sin interacción reciente
   - Proyectos con objetivos sin progreso

2. Analizar skills y agents para identificar:
   - Skills no utilizados recientemente
   - Agents sin activación en el último período
   - Oportunidades de combinación de skills/agents
   - Gaps en cobertura de skills/agents

3. Analizar scripts para identificar:
   - Scripts no ejecutados recientemente
   - Scripts con errores o problemas
   - Oportunidades de automatización
   - Scripts duplicados o redundantes
```

#### Paso 2: Identificación de Conexiones

```markdown
1. Identificar conexiones entre proyectos:
   - Proyectos con stakeholders compartidos
   - Proyectos con objetivos relacionados
   - Proyectos con dependencias no explícitas
   - Oportunidades de sinergia entre proyectos

2. Identificar conexiones entre workspaces:
   - Workspaces con proyectos relacionados
   - Workspaces con stakeholders compartidos
   - Oportunidades de colaboración entre workspaces
   - Patrones de trabajo entre workspaces

3. Identificar conexiones entre componentes:
   - Skills que podrían aplicarse a proyectos específicos
   - Agents que podrían ayudar en proyectos actuales
   - Scripts que podrían automatizar tareas manuales
   - Hooks que podrían mejorar flujos de trabajo
```

#### Paso 3: Generación de Insights

```markdown
1. Generar insights sobre el sistema:
   - Áreas de alta actividad vs. áreas descuidadas
   - Patrones de uso de skills/agents
   - Oportunidades de optimización
   - Riesgos o áreas de atención

2. Generar insights sobre proyectos:
   - Proyectos que necesitan atención
   - Proyectos con potencial no explotado
   - Proyectos con dependencias no resueltas
   - Oportunidades de consolidación

3. Generar insights sobre stakeholders:
   - Stakeholders sin interacción reciente
   - Oportunidades de fortalecimiento de relaciones
   - Stakeholders con múltiples conexiones
   - Patrones de colaboración
```

#### Paso 4: Revelación de Información Oculta

```markdown
1. Revelar información no obvia:
   - Proyectos archivados que podrían reactivarse
   - Documentos antiguos con información relevante
   - Tareas pendientes olvidadas
   - Decisiones pasadas que afectan el presente

2. Revelar patrones temporales:
   - Ciclos de actividad
   - Períodos de alta/baja productividad
   - Patrones estacionales
   - Tendencias a largo plazo

3. Revelar oportunidades:
   - Proyectos que podrían beneficiarse de skills/agents existentes
   - Automatizaciones posibles
   - Consolidaciones recomendadas
   - Nuevas conexiones sugeridas
```

### 3. Formato de Salida

El output debe seguir este formato:

```markdown
# 🔍 Dendrita se Destapa

## Insights Ocultos

### Patrones Detectados
- [Patrón 1 con explicación]
- [Patrón 2 con explicación]
- [Patrón 3 con explicación]

### Conexiones No Obvias
- [Conexión 1 entre componentes]
- [Conexión 2 entre proyectos]
- [Conexión 3 entre workspaces]

### Áreas de Atención
- [Área 1 que necesita atención]
- [Área 2 con oportunidades]
- [Área 3 con riesgos]

## Revelaciones

### Información Oculta
- [Información oculta 1]
- [Información oculta 2]
- [Información oculta 3]

### Oportunidades
- [Oportunidad 1]
- [Oportunidad 2]
- [Oportunidad 3]

## Recomendaciones

1. [Recomendación 1 basada en insights]
2. [Recomendación 2 basada en patrones]
3. [Recomendación 3 basada en conexiones]
```

### 4. Consideraciones Especiales

#### Análisis Profundo

```markdown
- Leer múltiples archivos para identificar patrones
- Comparar información entre diferentes períodos
- Analizar relaciones entre componentes
- Identificar gaps y oportunidades
```

#### Revelación Gradual

```markdown
- Empezar con insights más obvios
- Profundizar en conexiones no obvias
- Revelar información oculta de forma estructurada
- Proporcionar contexto para cada revelación
```

#### Accionabilidad

```markdown
- Cada insight debe ser accionable
- Proporcionar recomendaciones concretas
- Sugerir próximos pasos
- Priorizar por impacto y urgencia
```

---

## Referencias de Archivos

**Archivos de referencia:**
- `.dendrita/hooks/list-system-components.md` - Listado de componentes del sistema
- `.dendrita/hooks/working-context.md` - Contexto de trabajo actual
- `.dendrita/users/[user-id]/profile.json` - Perfil del usuario
- `workspaces/[workspace]/active-projects/` - Proyectos activos
- `workspaces/[workspace]/tasks.md` - Tareas pendientes

**Para Cursor:**
- Leer estos archivos para analizar el sistema
- NO intentar ejecutarlos
- Aplicar el comportamiento documentado cuando el usuario solicite que dendrita se destape

---

## Diferencia con Otros Hooks

- **Este hook es de revelación:** No solo lista, sino que revela información oculta
- **Genera insights:** Crea nuevas perspectivas sobre el sistema
- **Identifica conexiones:** Encuentra relaciones no obvias
- **Proporciona recomendaciones:** Sugiere acciones basadas en análisis

---

## Ejemplo de Uso

**Usuario:** "destápate dendrita"

**Cursor debe:**
1. Analizar proyectos activos para identificar patrones
2. Identificar conexiones entre componentes
3. Generar insights sobre el sistema
4. Revelar información oculta
5. Proporcionar recomendaciones accionables
6. Presentar todo en formato estructurado

---

**Para más información:** Ver `.dendrita/hooks/list-system-components.md` para listado de componentes, y `.dendrita/hooks/working-context.md` para contexto de trabajo actual.

