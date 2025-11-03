# Skills para ennui-dendrita

Skills de conocimiento modular que Claude carga cuando se necesitan. Proporcionan:
- Guías específicas del dominio
- Mejores prácticas
- Ejemplos de código/estructura
- Anti-patrones a evitar

**Problema:** Los skills no se activan automáticamente por defecto.

**Solución:** Esta infraestructura incluye hooks + configuración para hacer que se activen automáticamente.

---

## Skills Disponibles

### gestion-proyectos
**Propósito:** Patrones de gestión de proyectos para ennui-dendrita

**Archivos:** Múltiples archivos de recursos

**Cubre:**
- Estructura de proyectos (plan-estrategico, contexto-actual, tareas-seguimiento)
- Gestión de múltiples proyectos simultáneos
- Ritmos operativos (scrums, revisiones)
- Seguimiento de tareas y entregables
- Documentación persistente

**Usar cuando:**
- Creas/modificas estructuras de proyectos
- Necesitas seguir mejores prácticas de documentación
- Gestionas múltiples proyectos
- Actualizas contextos y tareas

**Personalización:** ✅ Ninguna necesaria - adaptado a ennui-dendrita

**[Ver Skill →](gestion-proyectos/)**

---

### diagnostico-sostenibilidad
**Propósito:** Patrones para diagnóstico de iniciativas ESG y sostenibilidad

**Archivos:** Múltiples archivos de recursos

**Cubre:**
- Mapeo de iniciativas vigentes
- Identificación de brechas de evidencia
- Mapeo de aliados clave
- Análisis de conexión con core del negocio
- Creación de mapas de valor

**Usar cuando:**
- Realizas diagnóstico de sostenibilidad
- Mapeas iniciativas ESG
- Analizas brechas de evidencia
- Diseñas mapas de valor

**Personalización:** ✅ Ninguna necesaria

**[Ver Skill →](diagnostico-sostenibilidad/)**

---

### pipeline-proyectos
**Propósito:** Patrones para pipeline de proyectos y alianzas

**Archivos:** Múltiples archivos de recursos

**Cubre:**
- Identificación de oportunidades
- Diseño de propuestas con aliados
- Postulación coordinada
- Gestión de pipeline

**Usar cuando:**
- Trabajas en pipeline de proyectos
- Diseñas propuestas con aliados
- Postulas a fondos coordinadamente

**Personalización:** ✅ Ninguna necesaria

**[Ver Skill →](pipeline-proyectos/)**

---

### sistema-mel
**Propósito:** Patrones para sistemas MEL (Monitoreo, Evaluación y Aprendizaje)

**Archivos:** Múltiples archivos de recursos

**Cubre:**
- Diseño de teoría de cambio
- Sistemas de captura (cuantitativo + cualitativo)
- Análisis de datos e impacto
- Generación de reportes MEL
- Integración de tecnología e IA

**Usar cuando:**
- Diseñas sistemas MEL
- Analizas datos de impacto
- Generas reportes trimestrales
- Integras métricas cuantitativas y cualitativas

**Personalización:** ✅ Ninguna necesaria

**[Ver Skill →](sistema-mel/)**

---

### bootcamp-fundraising
**Propósito:** Patrones para bootcamps y formación en fundraising

**Archivos:** Múltiples archivos de recursos

**Cubre:**
- Estructura de bootcamps (4 módulos, 8 semanas)
- Fortalecimiento de capacidades
- Aprendizaje aplicado
- Templates de propuestas

**Usar cuando:**
- Diseñas bootcamps de fundraising
- Fortaleces capacidades de fundraising
- Creas programas de formación

**Personalización:** ✅ Ninguna necesaria

**[Ver Skill →](bootcamp-fundraising/)**

---

## Cómo Agregar un Skill a Tu Proyecto

Los skills ya están configurados en `skill-rules.json`. Solo necesitas:

1. **Verificar que existe** el skill en `.dentrita/skills/[skill-name]/`
2. **Los hooks están instalados** (ver `.dentrita/hooks/README.md`)
3. **settings.json está configurado** (ver `.dentrita/settings.json`)

El skill se activará automáticamente cuando:
- Tu prompt contenga keywords relevantes
- Estés editando archivos en directorios relevantes
- El contenido del archivo coincida con patrones específicos

---

## skill-rules.json Configuración

### Qué Hace

Define cuándo los skills deben activarse basados en:
- **Keywords** en prompts del usuario ("diagnóstico", "MEL", "fundraising")
- **Intent patterns** (regex matching user intent)
- **File path patterns** (editando archivos en proyectos-activos/)
- **Content patterns** (código contiene ciertos patrones)

### Niveles de Enforcement

- **suggest**: El skill aparece como sugerencia, no bloquea
- **block**: Debe usarse el skill antes de continuar (guardrail)

**Usar "block" para:**
- Prevenir cambios que rompan estructura de proyectos
- Operaciones críticas de base de datos
- Código sensible de seguridad

**Usar "suggest" para:**
- Mejores prácticas generales
- Guía de dominio
- Organización de código

---

## Troubleshooting

### Skill no se activa

**Verificar:**
1. ¿Existe el skill en `.dentrita/skills/`?
2. ¿Está listado en `skill-rules.json`?
3. ¿Los `pathPatterns` coinciden con tus archivos?
4. ¿Los hooks están instalados y funcionando?
5. ¿settings.json está configurado correctamente?

**Debug:**
```bash
# Verificar skill existe
ls -la .dentrita/skills/

# Validar skill-rules.json
cat .dentrita/skills/skill-rules.json | jq .

# Verificar hooks son ejecutables
ls -la .dentrita/hooks/*.sh

# Probar hook manualmente
./.dentrita/hooks/skill-activation-prompt.sh
```

### Skill se activa demasiado

Actualiza skill-rules.json:
- Haz keywords más específicas
- Estrecha `pathPatterns`
- Aumenta especificidad de `intentPatterns`

### Skill nunca se activa

Actualiza skill-rules.json:
- Agrega más keywords
- Amplía `pathPatterns`
- Agrega más `intentPatterns`

---

**Para más información:** Ver `README.md` en `.dentrita/agents/` y `.dentrita/hooks/`

