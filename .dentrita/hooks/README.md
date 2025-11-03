# Hooks para ennui-dendrita

Referencias de comportamiento para Cursor - base reflexiva del proyecto.

---

## ¿Qué son los Hooks?

Los hooks en `.dentrita/hooks/` son **referencias de comportamiento**, NO scripts ejecutables.

**Propósito:** Documentan el comportamiento esperado que Cursor debe LEER y aplicar reflexivamente, no ejecutar como código.

### Puntos clave:

- ✅ **Cursor debe LEER estos archivos** para entender el comportamiento esperado
- ✅ **Documentan la lógica** que Cursor debe aplicar
- ❌ **NO se ejecutan** - son referencias, no código ejecutable
- ✅ **Mantenidos para futuras implementaciones** si se requiere ejecución real

---

## Hooks como Referencias

### repo-initialization (RepoInitialization)

**Referencia de comportamiento:** Lógica para inicializar repositorios dendrita nuevos cuando se detecta que están vacíos

**Comportamiento esperado que Cursor debe aplicar:**

1. Al detectar que el repositorio está vacío (no existe `.dentrita/users/` o está vacío):
   - Iniciar proceso interactivo de inicialización
   - Preguntar al usuario datos básicos (identificador, workspace principal, roles, preferencias)
   - Crear estructura de usuario en `.dentrita/users/[user-id]/`
   - Generar perfil predeterminado `profile.json`
   - Ofrecer crear perfil específico para el workspace principal

2. Durante la inicialización:
   - Hacer preguntas una a la vez
   - Validar respuestas
   - Mostrar resumen antes de crear
   - Confirmar con el usuario antes de crear archivos

**Archivos de referencia:**
- `repo-initialization.md` - Lógica de inicialización documentada

**Para Cursor:**
- Lee este archivo para entender la lógica
- NO intentes ejecutarlo
- Aplica el comportamiento documentado reflexivamente cuando detectes repositorio vacío

**Documentación relacionada:**
- `.dentrita/users/README.md` - Sistema completo de usuarios y perfiles

---

### skill-activation-prompt (UserPromptSubmit)

**Referencia de comportamiento:** Lógica para sugerir skills relevantes basados en prompts del usuario y contexto de archivos

**Comportamiento esperado que Cursor debe aplicar:**

1. Al recibir un prompt del usuario:
   - Identifica el perfil de usuario activo (verificar `.dentrita/users/` y workspace activo)
   - Lee `.dentrita/skills/skill-rules.json`
   - Compara el prompt contra `promptTriggers.keywords` e `promptTriggers.intentPatterns`
   - Considera `frequently_used_skills` del perfil activo para priorizar
   - Identifica qué skills son relevantes
   - Lee el archivo `SKILL.md` correspondiente en `.dentrita/skills/[skill-name]/SKILL.md`
   - Sugiere al usuario activar el skill si es apropiado

**Archivos de referencia:**
- `skill-activation-prompt.ts` - Lógica TypeScript documentada
- `skill-activation-prompt.sh` - Wrapper bash (referencia)

**Para Cursor:**
- Lee estos archivos para entender la lógica
- NO intentes ejecutarlos
- Aplica el comportamiento documentado reflexivamente

---

### post-tool-use-tracker (PostToolUse)

**Referencia de comportamiento:** Lógica para rastrear cambios en archivos y mantener contexto entre sesiones

**Comportamiento esperado que Cursor debe aplicar:**

1. Después de editar un archivo (Edit, Write, MultiEdit):
   - Identifica el contexto del archivo editado:
     - `empresas/[empresa]/proyectos-activos/[proyecto]/` → Proyecto activo
     - `mejores-practicas/[tipo-proyecto]/` → Mejores prácticas
     - `modos-trabajo/[modo].md` → Modo de trabajo
   - Mantén registro mental del contexto afectado
   - Considera este contexto para futuras acciones relacionadas

**Archivos de referencia:**
- `post-tool-use-tracker.sh` - Lógica bash documentada

**Para Cursor:**
- Lee este archivo para entender la lógica
- NO intentes ejecutarlo
- Aplica el comportamiento documentado reflexivamente

---

## Archivos Incluidos (Referencias)

- `repo-initialization.md` - Referencia: Lógica de inicialización de repositorios vacíos
- `skill-activation-prompt.sh` - Referencia: Wrapper bash para el hook TypeScript
- `skill-activation-prompt.ts` - Referencia: Lógica de activación de skills documentada
- `post-tool-use-tracker.sh` - Referencia: Lógica de rastreo de archivos documentada
- `package.json` - Referencia: Dependencias Node.js (para referencia futura)
- `tsconfig.json` - Referencia: Configuración TypeScript (para referencia futura)

**NOTA:** Estos archivos son referencias. Cursor debe leerlos para entender el comportamiento esperado, pero NO se ejecutan.

---

## Personalización para ennui-dendrita

Los hooks están adaptados para reconocer:
- Estructura de proyectos (`proyectos-activos/`, `proyectos-archivo/`)
- Modos de trabajo (`modos-trabajo/`)
- Mejores prácticas (`mejores-practicas/`)
- Gestión empresarial (`gestion-empresa/`)

**Para Cursor:** Al aplicar el comportamiento documentado, usa estas estructuras para identificar el contexto de los archivos.

---

## Uso para Cursor

### Cómo aplicar el comportamiento de repo-initialization:

1. **Al detectar repositorio vacío:**
   ```markdown
   - Verificar si existe .dentrita/users/ y si tiene usuarios
   - Si está vacío o no existe, iniciar proceso de inicialización
   - Preguntar datos básicos al usuario
   - Crear estructura de usuario y perfil predeterminado
   - Ofrecer crear perfil específico para workspace
   ```

### Cómo aplicar el comportamiento de skill-activation-prompt:

1. **Al recibir un prompt del usuario:**
   ```markdown
   - Identifica perfil de usuario activo (verificar workspace y defaults)
   - Lee .dentrita/skills/skill-rules.json
   - Compara el prompt contra keywords e intentPatterns
   - Prioriza skills de frequently_used_skills del perfil activo
   - Si hay coincidencias, lee el SKILL.md correspondiente
   - Sugiere al usuario activar el skill si es apropiado
   ```

### Cómo aplicar el comportamiento de post-tool-use-tracker:

1. **Después de editar un archivo:**
   ```markdown
   - Identifica el contexto basado en la ruta del archivo
   - Mantén registro del contexto afectado
   - Considera este contexto para futuras acciones relacionadas
   ```

---

## Mantenimiento de Referencias

Estos archivos se mantienen para:
- ✅ **Documentar el comportamiento esperado** para Cursor
- ✅ **Referencia futura** si se implementa ejecución real de hooks
- ✅ **Comprensión de la lógica** sin necesidad de ejecución

**NO requieren:**
- ❌ Instalación de dependencias (`npm install`)
- ❌ Permisos de ejecución especiales
- ❌ Configuración de hooks en settings.json para ejecución

---

## Troubleshooting

### Cursor no está aplicando el comportamiento

**Verificar:**
1. ¿Cursor ha leído `.cursorrules` en la raíz? (Debe revisar `.dentrita/` primero)
2. ¿Cursor ha leído `.dentrita/skills/skill-rules.json`?
3. ¿Cursor ha leído los archivos `SKILL.md` relevantes?

**Solución:**
- Asegúrate de que Cursor revise `.dentrita/` al inicio
- Lee explícitamente los archivos de referencia si es necesario

### Referencias no claras

**Verificar:**
1. Lee los archivos de referencia directamente
2. Consulta `.dentrita/hooks/INSTALL.md` para más contexto
3. Revisa `.cursorrules` en la raíz para instrucciones

---

## Nota Importante

**Estos hooks son referencias de comportamiento, NO código ejecutable.**

- Cursor debe LEER estos archivos
- Cursor debe APLICAR el comportamiento documentado
- Cursor NO debe EJECUTAR estos scripts

---

**Para más información:** Ver `.cursorrules` en la raíz del proyecto y `.dentrita/agents/` y `.dentrita/skills/`
