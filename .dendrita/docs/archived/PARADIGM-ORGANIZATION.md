---
name: paradigm-organization
description: "Paradigma de Organización de dendrita"
type: documentation
created: 2025-11-06
updated: 2025-11-06
tags: ["documentation", "infrastructure"]
category: infrastructure
---

# Paradigma de Organización de dendrita

**Última actualización:** 2025-11-04  
**Versión:** 2.0

---

## Principio Fundamental

**Agents y skills son conocimiento de dominio específico del usuario, no infraestructura técnica genérica.**

Este paradigma separa claramente:
- **Conocimiento de dominio** (user-specific): Metodologías, patrones, mejores prácticas del usuario
- **Infraestructura técnica** (generic): Código, APIs, herramientas técnicas reutilizables

---

## Estructura de Organización

### Conocimiento de Dominio (User-Specific)

**Ubicación:** `.dendrita/users/[user-id]/`

#### Agents (`.dendrita/users/[user-id]/agents/`)
- **Contenido:** Agentes especializados con metodologías de dominio
- **Ejemplos:** `estratega-sostenibilidad.md`, `analista-mel.md`, `especialista-fundraising.md`
- **Naturaleza:** Conocimiento específico del usuario sobre sostenibilidad, impacto social, gestión de proyectos
- **Propósito:** Proporcionar agentes autónomos que encapsulan metodologías del dominio del usuario

#### Skills (`.dendrita/users/[user-id]/skills/`)
- **Contenido:** Patrones y mejores prácticas de dominio
- **Ejemplos:** `gestion-proyectos/`, `diagnostico-sostenibilidad/`, `sistema-mel/`
- **Naturaleza:** Conocimiento contextual específico del usuario sobre cómo trabajar en su dominio
- **Propósito:** Proporcionar guías inline durante el desarrollo que reflejan la metodología del usuario

---

### Infraestructura Técnica (Generic)

**Ubicación:** `.dendrita/integrations/`

#### Integrations (`.dendrita/integrations/`)
- **Contenido:** Código para conectar con servicios externos
- **Ejemplos:** Google Workspace APIs, Supabase, OpenAI
- **Naturaleza:** Infraestructura técnica genérica y reutilizable
- **Propósito:** Proporcionar herramientas técnicas sin conocimiento de dominio específico

#### Hooks (`.dendrita/hooks/`)
- **Contenido:** Referencias de comportamiento del sistema
- **Naturaleza:** Lógica de comportamiento del sistema dendrita
- **Propósito:** Documentar cómo debe comportarse Cursor al aplicar la lógica del sistema

---

## Comparación Visual

| Componente | Ubicación | Naturaleza | Contenido | Específico para Usuario |
|------------|-----------|------------|-----------|------------------------|
| **Agents** | `.dendrita/users/[user-id]/agents/` | Conocimiento de dominio | Metodologías ESG, MEL, fundraising | ✅ Sí |
| **Skills** | `.dendrita/users/[user-id]/skills/` | Conocimiento de dominio | Patrones de trabajo del usuario | ✅ Sí |
| **Integrations** | `.dendrita/integrations/` | Infraestructura técnica | Código de APIs, scrapers | ❌ No |
| **Hooks** | `.dendrita/hooks/` | Comportamiento del sistema | Lógica de dendrita | ⚠️ Parcial |

---

## Beneficios de esta Separación

### 1. **Claridad de Propósito**
- Facilita identificar qué es conocimiento de dominio vs. infraestructura técnica
- Hace explícito que agents y skills son específicos del usuario

### 2. **Escalabilidad Multi-Usuario**
- Cada usuario puede tener sus propios agents y skills
- El conocimiento de dominio no se mezcla con infraestructura técnica
- Facilita compartir infraestructura técnica sin exponer conocimiento de dominio

### 3. **Mantenibilidad**
- Separación clara de responsabilidades
- Fácil identificar dónde hacer cambios
- El conocimiento de dominio evoluciona independientemente de la infraestructura técnica

### 4. **Privacidad y Seguridad**
- El conocimiento de dominio puede mantenerse privado por usuario
- La infraestructura técnica puede ser compartida y versionada

---

## Reglas de Organización

### ✅ HACER

1. **Agents y skills van en `.dendrita/users/[user-id]/`**
   - Cada usuario tiene su propia carpeta
   - Contienen conocimiento específico del dominio del usuario

2. **Integrations van en `.dendrita/integrations/`**
   - Infraestructura técnica genérica
   - Código reutilizable sin conocimiento de dominio

3. **Hooks van en `.dendrita/hooks/`**
   - Comportamiento del sistema dendrita
   - Referencias de lógica, no ejecutables

### ❌ NO HACER

1. **No mezclar conocimiento de dominio con infraestructura técnica**
   - Agents y skills no van en `.dendrita/integrations/`
   - Integrations no contienen metodologías de dominio

2. **No poner agents y skills en `.dendrita/` directamente**
   - Deben estar bajo `.dendrita/users/[user-id]/`
   - Refleja que son conocimiento específico del usuario

3. **No hardcodear rutas antiguas en documentación**
   - Usar `.dendrita/users/[user-id]/agents/` y `.dendrita/users/[user-id]/skills/`
   - No usar `.dendrita/agents/` o `.dendrita/skills/`

---

## Migración desde Estructura Anterior

### Estructura Anterior (v1.0)
```
.dendrita/
├── agents/          ← Conocimiento de dominio (ubicación incorrecta)
├── skills/          ← Conocimiento de dominio (ubicación incorrecta)
└── integrations/    ← Infraestructura técnica (ubicación correcta)
```

### Estructura Actual (v2.0)
```
.dendrita/
├── users/[user-id]/
│   ├── agents/      ← Conocimiento de dominio (ubicación correcta)
│   └── skills/      ← Conocimiento de dominio (ubicación correcta)
└── integrations/    ← Infraestructura técnica (ubicación correcta)
```

### Cambios Requeridos

1. **Mover archivos:**
   ```bash
   # Mover agents
   mv .dendrita/agents/* .dendrita/users/[user-id]/agents/
   
   # Mover skills
   mv .dendrita/skills/* .dendrita/users/[user-id]/skills/
   ```

2. **Actualizar referencias:**
   - Cambiar `.dendrita/agents/` → `.dendrita/users/[user-id]/agents/`
   - Cambiar `.dendrita/skills/` → `.dendrita/users/[user-id]/skills/`

3. **Actualizar documentación:**
   - Actualizar `.cursorrules`
   - Actualizar `.dendrita/settings.json`
   - Actualizar todos los README.md relevantes
   - Actualizar referencias en hooks

---

## Referencias

- `.dendrita/users/README.md` - Sistema de usuarios y perfiles
- `.cursorrules` - Reglas de configuración de Cursor
- `.dendrita/integrations/README.md` - Documentación de integraciones
- `.dendrita/hooks/README.md` - Documentación de hooks

---

## Notas de Implementación

- Este paradigma se estableció el 2025-11-04
- Todos los agents y skills deben estar bajo `.dendrita/users/[user-id]/`
- La infraestructura técnica permanece en `.dendrita/integrations/`
- Este paradigma se aplica a todos los nuevos componentes creados

---

**IMPORTANTE:** Este paradigma debe ser seguido estrictamente. Agents y skills son conocimiento de dominio específico del usuario y deben estar organizados en `.dendrita/users/[user-id]/`, no como infraestructura genérica en `.dendrita/`.

