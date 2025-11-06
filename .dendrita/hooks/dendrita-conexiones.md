---
name: dendrita-conexiones
description: "Hook de Dendrita Conexiones"
type: hook
created: 2025-11-06
updated: 2025-11-06
tags: ["hook", "behavior-reference"]
category: behavior-reference
---

# Hook de Dendrita Conexiones

Referencia de comportamiento para Cursor - identificación y visualización de conexiones entre componentes del sistema dendrita.

---

## ¿Qué es este Hook?

Este hook documenta el comportamiento esperado que Cursor debe aplicar cuando el usuario solicita ver conexiones entre componentes del sistema dendrita (proyectos, stakeholders, workspaces, etc.).

**Propósito:** Identificar y visualizar conexiones entre componentes del sistema dendrita, mostrando relaciones, dependencias y oportunidades de sinergia.

**Diferencia con otros hooks:**
- Este hook se enfoca en conexiones y relaciones
- Visualiza redes de componentes
- Identifica dependencias y sinergias
- Muestra el sistema como una red interconectada

---

## Comportamiento Esperado

### 1. Activación del Hook

Cursor debe ejecutar este comportamiento cuando:

- ✅ El usuario dice "dendrita conexiones" o "muéstrame las conexiones"
- ✅ El usuario pregunta "qué proyectos están relacionados"
- ✅ El usuario solicita "red de stakeholders" o "mapa de conexiones"
- ✅ El usuario menciona "dependencias" o "relaciones entre componentes"
- ✅ El usuario pregunta "cómo se conecta X con Y"

**Patrones de activación:**

```markdown
- "dendrita conexiones"
- "muéstrame las conexiones"
- "qué proyectos están relacionados"
- "red de stakeholders"
- "mapa de conexiones"
- "dependencias"
- "relaciones entre componentes"
- "cómo se conecta [X] con [Y]"
```

### 2. Proceso de Identificación de Conexiones

Cuando se activa el hook, Cursor debe:

#### Paso 1: Identificación del Tipo de Conexión

```markdown
1. Identificar qué tipo de conexiones se solicita:
   - Conexiones entre proyectos
   - Conexiones entre stakeholders
   - Conexiones entre workspaces
   - Conexiones entre componentes (skills, agents, scripts)
   - Conexiones específicas (proyecto X con proyecto Y)

2. Si no se especifica:
   - Mostrar todas las conexiones disponibles
   - Organizar por tipo de conexión
   - Priorizar conexiones más relevantes
```

#### Paso 2: Análisis de Conexiones

```markdown
1. Analizar conexiones entre proyectos:
   - Stakeholders compartidos
   - Objetivos relacionados
   - Dependencias explícitas o implícitas
   - Oportunidades de sinergia
   - Recursos compartidos

2. Analizar conexiones entre stakeholders:
   - Proyectos en común
   - Workspaces compartidos
   - Roles y responsabilidades
   - Patrones de colaboración
   - Oportunidades de fortalecimiento

3. Analizar conexiones entre workspaces:
   - Proyectos relacionados
   - Stakeholders compartidos
   - Recursos compartidos
   - Oportunidades de colaboración
   - Patrones de trabajo

4. Analizar conexiones entre componentes:
   - Skills aplicables a proyectos
   - Agents útiles para proyectos
   - Scripts que podrían automatizar tareas
   - Hooks que podrían mejorar flujos
   - Oportunidades de combinación
```

#### Paso 3: Visualización de Conexiones

```markdown
1. Crear mapa de conexiones:
   - Nodos: proyectos, stakeholders, workspaces, componentes
   - Enlaces: relaciones, dependencias, sinergias
   - Peso: fuerza de la conexión
   - Color: tipo de conexión

2. Organizar por tipo:
   - Conexiones directas (explícitas)
   - Conexiones indirectas (implícitas)
   - Conexiones potenciales (oportunidades)
   - Conexiones débiles (necesitan fortalecimiento)

3. Destacar conexiones importantes:
   - Conexiones fuertes
   - Conexiones críticas
   - Oportunidades de sinergia
   - Dependencias importantes
```

#### Paso 4: Análisis de Red

```markdown
1. Identificar nodos centrales:
   - Proyectos con más conexiones
   - Stakeholders con más relaciones
   - Workspaces más conectados
   - Componentes más utilizados

2. Identificar clusters:
   - Grupos de proyectos relacionados
   - Comunidades de stakeholders
   - Workspaces con sinergias
   - Componentes que trabajan juntos

3. Identificar gaps:
   - Componentes aislados
   - Oportunidades de conexión
   - Dependencias no resueltas
   - Sinergias no explotadas
```

### 3. Formato de Salida

El output debe seguir este formato:

```markdown
# 🔗 Dendrita Conexiones

## Mapa de Conexiones

### Conexiones Directas
- [Componente A] ↔ [Componente B] - [Tipo de conexión] - [Fuerza]
- [Componente C] ↔ [Componente D] - [Tipo de conexión] - [Fuerza]
- [Componente E] ↔ [Componente F] - [Tipo de conexión] - [Fuerza]

### Conexiones Indirectas
- [Componente A] → [Componente B] → [Componente C] - [Tipo de conexión]
- [Componente D] → [Componente E] → [Componente F] - [Tipo de conexión]

### Conexiones Potenciales
- [Componente A] ⚡ [Componente B] - [Oportunidad de sinergia]
- [Componente C] ⚡ [Componente D] - [Oportunidad de sinergia]

## Nodos Centrales

### Proyectos Más Conectados
1. [Proyecto A] - [Número de conexiones] conexiones
2. [Proyecto B] - [Número de conexiones] conexiones
3. [Proyecto C] - [Número de conexiones] conexiones

### Stakeholders Más Relacionados
1. [Stakeholder A] - [Número de relaciones] relaciones
2. [Stakeholder B] - [Número de relaciones] relaciones
3. [Stakeholder C] - [Número de relaciones] relaciones

## Clusters Identificados

### Cluster 1: [Nombre]
- [Componente 1]
- [Componente 2]
- [Componente 3]
- [Tipo de relación]

### Cluster 2: [Nombre]
- [Componente 4]
- [Componente 5]
- [Componente 6]
- [Tipo de relación]

## Oportunidades

### Sinergias No Explotadas
- [Oportunidad 1]
- [Oportunidad 2]
- [Oportunidad 3]

### Gaps Identificados
- [Gap 1]
- [Gap 2]
- [Gap 3]
```

### 4. Consideraciones Especiales

#### Análisis de Red

```markdown
- Identificar nodos centrales (más conexiones)
- Identificar nodos periféricos (menos conexiones)
- Identificar clusters (grupos relacionados)
- Identificar puentes (conexiones entre clusters)
```

#### Visualización

```markdown
- Usar formato de texto para representar conexiones
- Usar símbolos para diferentes tipos de conexión
- Organizar por tipo y fuerza de conexión
- Destacar conexiones importantes
```

#### Accionabilidad

```markdown
- Identificar oportunidades de fortalecimiento
- Sugerir nuevas conexiones
- Recomendar consolidaciones
- Proponer sinergias
```

---

## Referencias de Archivos

**Archivos de referencia:**
- `workspaces/[workspace]/active-projects/` - Proyectos activos
- `workspaces/[workspace]/stakeholders/` - Stakeholders
- `.dendrita/users/[user-id]/agents/` - Agents
- `.dendrita/users/[user-id]/skills/` - Skills
- `.dendrita/integrations/scripts/` - Scripts

**Para Cursor:**
- Leer estos archivos para identificar conexiones
- NO intentar ejecutarlos
- Aplicar el comportamiento documentado cuando el usuario solicite conexiones

---

## Diferencia con Otros Hooks

- **Este hook es de visualización de red:** Muestra el sistema como red interconectada
- **Identifica relaciones:** Encuentra conexiones entre componentes
- **Muestra dependencias:** Visualiza dependencias y sinergias
- **Proporciona perspectiva de red:** Ayuda a entender el sistema como un todo

---

## Ejemplo de Uso

**Usuario:** "dendrita conexiones, qué proyectos están relacionados con el proyecto X"

**Cursor debe:**
1. Identificar el proyecto X
2. Analizar conexiones con otros proyectos
3. Identificar stakeholders compartidos
4. Mostrar dependencias y sinergias
5. Visualizar red de conexiones
6. Proporcionar oportunidades de sinergia

---

**Para más información:** Ver `.dendrita/hooks/destápate-dendrita.md` para revelación de insights ocultos, y `.dendrita/hooks/list-system-components.md` para listado de componentes.

