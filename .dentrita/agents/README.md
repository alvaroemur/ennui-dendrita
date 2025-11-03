# Agents para ennui-dendrita

Agentes especializados para tareas complejas y multi-paso en gestión de proyectos de sostenibilidad e impacto social.

---

## ¿Qué son los Agents?

Los agents son instancias autónomas de Claude que manejan tareas complejas específicas. A diferencia de los skills (que proporcionan guía inline), los agents:
- Se ejecutan como sub-tareas separadas
- Trabajan autónomamente con supervisión mínima
- Tienen acceso especializado a herramientas
- Retornan reportes comprensivos cuando completan

**Ventaja clave:** Los agents son **standalone** - solo copia el archivo `.md` y úsalo inmediatamente.

---

## Agents Disponibles

### estratega-sostenibilidad
**Propósito:** Planificación estratégica ESG, diagnóstico de iniciativas de sostenibilidad, diseño de roadmaps

**Cuándo usar:**
- Planificación estratégica ESG
- Diagnóstico de iniciativas de sostenibilidad
- Diseño de roadmaps de puesta en marcha
- Priorización de iniciativas
- Casos de negocio para impacto

**Integración:** ✅ Copiar tal cual

---

### gestor-proyectos
**Propósito:** Coordinación operativa, seguimiento de tareas, gestión de cronogramas

**Cuándo usar:**
- Coordinación operativa diaria
- Seguimiento de tareas y entregables
- Gestión de cronogramas
- Coordinación con equipos y aliados
- Resolución de bloqueadores

**Integración:** ✅ Copiar tal cual

---

### analista-mel
**Propósito:** Análisis de datos, métricas de impacto, reportes MEL (Monitoreo, Evaluación y Aprendizaje)

**Cuándo usar:**
- Análisis de métricas e impacto
- Generación de reportes MEL
- Análisis de datos cuantitativos y cualitativos
- Reportes trimestrales y ejecutivos
- Documentación de aprendizajes

**Integración:** ✅ Copiar tal cual

---

### facilitador-aliados
**Propósito:** Gestión de stakeholders, diseño de acuerdos de colaboración, gobernanza de proyectos

**Cuándo usar:**
- Gestión de aliados y stakeholders
- Diseño de acuerdos de colaboración
- Establecimiento de rutinas operativas
- Integración con emprendedores/organizaciones
- Gestión de gobernanza

**Integración:** ✅ Copiar tal cual

---

### especialista-fundraising
**Propósito:** Diseño de propuestas financieras, postulaciones a fondos, bootcamps de fundraising

**Cuándo usar:**
- Diseño de propuestas financieras
- Postulaciones a fondos y donantes
- Bootcamps de fundraising
- Casos de negocio para inversión
- Documentos para donantes

**Integración:** ✅ Copiar tal cual

---

### web-research-specialist
**Propósito:** Investigar información en internet, especialmente para debugging, soluciones técnicas, o información comprehensiva

**Cuándo usar:**
- Investigar mejores prácticas de sostenibilidad
- Buscar ejemplos de implementaciones ESG
- Comparar enfoques de impacto social
- Encontrar soluciones a problemas específicos
- Recopilar información de múltiples fuentes

**Integración:** ✅ Copiar tal cual

---

## Cómo Usar un Agent

### Integración Estándar

**Paso 1: Copiar el archivo**
```bash
cp .dentrita/agents/agent-name.md tu-proyecto/.dentrita/agents/
```

**Paso 2: Usarlo**
Pregunta a Claude: "Usa el agent [agent-name] para [tarea]"

Eso es todo. Los agents funcionan inmediatamente.

---

## Cuándo Usar Agents vs Skills

| Usar Agents Cuando... | Usar Skills Cuando... |
|----------------------|----------------------|
| Tarea requiere múltiples pasos | Necesitas guía inline |
| Análisis complejo necesario | Verificando mejores prácticas |
| Trabajo autónomo preferido | Quieres mantener control |
| Tarea tiene objetivo claro | Trabajo de desarrollo en curso |
| Ejemplo: "Revisar todos los proyectos activos" | Ejemplo: "Crear un nuevo proyecto" |

**Ambos pueden trabajar juntos:**
- Skill proporciona patrones durante desarrollo
- Agent revisa el resultado cuando está completo

---

## Quick Reference

| Agent | Complejidad | Personalización | Requiere Auth |
|-------|------------|----------------|---------------|
| estratega-sostenibilidad | Alta | ✅ Ninguna | No |
| gestor-proyectos | Media | ✅ Ninguna | No |
| analista-mel | Media | ✅ Ninguna | No |
| facilitador-aliados | Media | ✅ Ninguna | No |
| especialista-fundraising | Media | ✅ Ninguna | No |
| web-research-specialist | Baja | ✅ Ninguna | No |

---

## Crear Tus Propios Agents

Los agents son archivos markdown con frontmatter YAML opcional:

```markdown
---
name: mi-agent
description: Lo que hace este agent
---

# Nombre del Agent

## Propósito
Qué hace este agent

## Instrucciones
Instrucciones paso a paso para ejecución autónoma

## Herramientas Disponibles
Lista de herramientas que puede usar

## Output Esperado
Qué formato usar para retornar resultados
```

**Tips:**
- Sé muy específico en las instrucciones
- Divide tareas complejas en pasos numerados
- Especifica exactamente qué retornar
- Incluye ejemplos de buen output
- Lista herramientas disponibles explícitamente

---

## Troubleshooting

### Agent no encontrado

**Verificar:**
```bash
# ¿Existe el archivo del agent?
ls -la .dentrita/agents/[agent-name].md
```

### Agent falla con errores de path

**Verificar paths hardcodeados:**
```bash
grep "~/\|/root/\|/Users/" .dentrita/agents/[agent-name].md
```

**Corregir:**
```bash
sed -i 's|~/git/.*project|\$CLAUDE_PROJECT_DIR|g' .dentrita/agents/[agent-name].md
```

---

**Para más información:** Ver `README.md` en `.dentrita/skills/` y `.dentrita/hooks/`

