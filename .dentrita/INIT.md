# Inicialización de .dentrita

## Estado de Configuración

✅ **Configuración completa:**
- `settings.json` configurado como metadata reflexiva
- Hooks documentados como referencias de comportamiento
- Skills definidos en `skill-rules.json`
- Agents creados en `.dentrita/agents/`
- Sistema de usuarios y perfiles configurado en `.dentrita/users/`

---

## ¿Qué es .dentrita?

`.dentrita/` es una **base reflexiva** que contiene metadata y documentación para Cursor. Cursor debe LEER estos archivos para entender el contexto del proyecto y aplicar el comportamiento documentado.

**NOTA IMPORTANTE:** `.dentrita/` NO es un sistema de ejecución de código. Es metadata y referencias que Cursor lee directamente.

---

## Próximos Pasos para Cursor

### 1. Revisar .cursorrules

Cursor debe revisar `.cursorrules` en la raíz del proyecto primero. Este archivo instruye a Cursor a:
- Revisar `.dentrita/` antes de cualquier acción
- Usar los contenidos de `.dentrita/` como base reflexiva
- Leer hooks como referencias, no ejecutarlos

### 2. Leer .dentrita/settings.json

Este archivo contiene metadata del proyecto. NO es configuración de ejecución, es información reflexiva que Cursor debe usar.

### 3. Usar Skills Reflexivamente

Al recibir un prompt del usuario:

1. **Lee `.dentrita/skills/skill-rules.json`**
   - Compara el prompt contra `keywords` e `intentPatterns`
   - Identifica skills relevantes

2. **Lee el archivo `SKILL.md` correspondiente**
   - Aplica el conocimiento contextual del skill

3. **Sugiere al usuario** si es apropiado

### 4. Detectar y Usar Usuarios

Al iniciar una sesión o detectar repositorio vacío:

1. **Verificar `.dentrita/users/`**
   - Si no existe o está vacío: iniciar proceso de inicialización (ver `.dentrita/hooks/repo-initialization.md`)
   - Si existe: identificar usuario activo y cargar perfil correspondiente

2. **Aplicar perfil de usuario:**
   - Verificar workspace activo
   - Cargar perfil predeterminado del workspace (si existe) o perfil predeterminado del usuario
   - Aplicar preferencias y contexto de trabajo del perfil

3. **Usar perfil para personalizar comportamiento:**
   - Priorizar skills de `frequently_used_skills`
   - Sugerir work modes de `preferred_work_modes`
   - Adaptar estilo de comunicación según preferencias

**Documentación:** Ver `.dentrita/users/README.md` para detalles completos.

### 5. Usar Hooks como Referencias

Los hooks en `.dentrita/hooks/` son referencias de comportamiento:

- **repo-initialization**: Cursor debe aplicar la lógica de inicialización cuando detecta repositorio vacío
- **skill-activation-prompt**: Cursor debe aplicar la lógica de identificar skills relevantes (considerando perfil activo)
- **post-tool-use-tracker**: Cursor debe aplicar la lógica de identificar contexto de archivos

**NO se ejecutan** - son referencias que Cursor lee y aplica.

---

## Archivos Creados

- `.dentrita/settings.json` - Metadata reflexiva del proyecto
- `.dentrita/settings.local.json` - Metadata local (puedes personalizar)
- `.dentrita/hooks/` - Referencias de comportamiento (NO ejecutables)
- `.dentrita/agents/` - Agentes especializados
- `.dentrita/skills/` - Skills de conocimiento contextual
- `.dentrita/users/` - Sistema de usuarios y perfiles (se crea durante inicialización)

---

## Uso Reflexivo

### Para Cursor:

1. **Al recibir un prompt:**
   - Revisa `.dentrita/skills/skill-rules.json`
   - Identifica skills relevantes
   - Lee `SKILL.md` correspondiente

2. **Al editar archivos:**
   - Identifica el contexto del archivo (proyecto, práctica, modo)
   - Mantén coherencia con documentos persistentes
   - Considera el contexto para futuras acciones

3. **Al trabajar con proyectos:**
   - Lee `contexto-actual.md` antes de responder
   - Revisa `tareas-seguimiento.md` para entender estado
   - Consulta `plan-estrategico.md` para estrategia general
   - Actualiza `contexto-actual.md` después de decisiones importantes

---

## No Requiere Instalación

✅ **NO es necesario instalar nada:**

- ❌ NO requiere `npm install`
- ❌ NO requiere Node.js
- ❌ NO requiere permisos de ejecución
- ❌ NO requiere configuración especial

**Cursor solo necesita LEER estos archivos.**

---

## Troubleshooting

### Cursor no está aplicando el comportamiento

1. **Verifica que Cursor ha leído `.cursorrules`:**
   - El archivo en la raíz debe instruir a Cursor a revisar `.dentrita/` primero

2. **Verifica que Cursor ha leído `skill-rules.json`:**
   - Debe revisar `.dentrita/skills/skill-rules.json` al recibir prompts

3. **Verifica que Cursor está leyendo los hooks como referencias:**
   - Lee `.dentrita/hooks/README.md` para entender el comportamiento esperado
   - NO intenta ejecutar los scripts

### Los skills no se activan

1. **Verifica que Cursor está revisando `skill-rules.json`:**
   ```markdown
   - ¿Cursor está comparando el prompt contra keywords e intentPatterns?
   - ¿Cursor está leyendo los SKILL.md correspondientes?
   ```

2. **Sugiere explícitamente:**
   - Si identificas un skill relevante, sugiérelo explícitamente al usuario
   - Lee el `SKILL.md` y aplica el conocimiento contextual

3. **Verifica que los skills existen:**
   - Revisa `.dentrita/skills/[skill-name]/SKILL.md`

---

## Estado Actual

- ✅ Configuración: Completa (metadata reflexiva)
- ✅ Skills: Configurados en `skill-rules.json`
- ✅ Agents: Listos en `.dentrita/agents/`
- ✅ Hooks: Documentados como referencias (incluyendo repo-initialization)
- ✅ Sistema de usuarios: Configurado en `.dentrita/users/`
- ✅ NO requiere instalación: Solo lectura

---

## Siguiente Paso

**Cursor debe leer `.cursorrules` en la raíz del proyecto primero.**

Este archivo instruye a Cursor sobre cómo usar `.dentrita/` como base reflexiva.

---

**Para más información:** Ver `.cursorrules` en la raíz y `.dentrita/hooks/README.md`
