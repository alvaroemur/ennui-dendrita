# Hook de Inicialización del Repositorio

Referencia de comportamiento para Cursor - inicialización de repositorios dendrita nuevos.

---

## ¿Qué es este Hook?

Este hook documenta el comportamiento esperado que Cursor debe aplicar cuando detecta que el repositorio está vacío o no tiene usuarios configurados.

**Propósito:** Guiar a Cursor para realizar una inicialización interactiva del repositorio, creando la estructura de usuarios y configurando el perfil inicial.

---

## Comportamiento Esperado

### 1. Detección de Repositorio Vacío

Cursor debe detectar que el repositorio está vacío cuando:

- ✅ No existe `.dentrita/users/` o está vacío
- ✅ No hay archivos de usuario en `.dentrita/users/`
- ✅ El usuario indica explícitamente que es un repositorio nuevo

**Condición de activación:**

```markdown
SI (no existe .dentrita/users/) O (existe pero está vacío) O (usuario indica "nuevo repositorio")
ENTONCES activar proceso de inicialización
```

### 2. Proceso de Inicialización

Cuando se activa la inicialización, Cursor debe:

#### Paso 1: Saludo y Explicación

```markdown
¡Bienvenido a ennui-dendrita!

Este es un sistema de gestión de proyectos que te ayudará a:
- Gestionar múltiples proyectos simultáneamente
- Mantener documentación consistente
- Aplicar mejores prácticas según el tipo de proyecto

Para configurar el sistema, necesito algunos datos básicos.
```

#### Paso 2: Preguntas Básicas

Cursor debe preguntar en orden:

1. **Identificador único del usuario:**
   ```
   ¿Cuál es tu nombre o identificador único?
   (Ejemplos: alvaro, juan, equipo-1, cliente-x)
   
   Este identificador se usará para crear tu carpeta de usuario.
   ```

2. **Workspace principal:**
   ```
   ¿Cuál es tu workspace principal?
   Opciones: ennui, inspiro, entre-rutas, horizontes, iami, otros
   
   Si no estás seguro, puedes usar "otros" y cambiarlo después.
   ```

3. **Tipo de trabajo principal:**
   ```
   ¿Cuál es tu tipo de trabajo principal?
   Opciones:
   - project-manager: Gestión y coordinación de proyectos
   - sustainability-strategist: Planificación estratégica de sostenibilidad
   - mel-analyst: Análisis de monitoreo, evaluación y aprendizaje
   - stakeholder-facilitator: Gestión de aliados y stakeholders
   - fundraising-specialist: Especialista en captación de fondos
   
   Puedes especificar múltiples roles separados por comas.
   ```

4. **Estilo de comunicación:**
   ```
   ¿Prefieres comunicación directa o detallada?
   - direct: Respuestas concisas y al punto
   - detailed: Respuestas más extensas con contexto
   - balanced: Equilibrio entre ambos
   ```

5. **Frecuencia de actualización:**
   ```
   ¿Con qué frecuencia actualizamos current-context.md?
   - frequent: Después de cada decisión importante
   - normal: Después de tareas completadas
   - minimal: Solo actualizaciones críticas
   ```

#### Paso 3: Confirmación y Creación

Después de obtener las respuestas:

1. **Mostrar resumen:**
   ```markdown
   Resumen de configuración:
   
   - Usuario: [user-id]
   - Workspace principal: [workspace]
   - Roles: [roles]
   - Estilo de comunicación: [style]
   - Frecuencia de actualización: [frequency]
   
   ¿Confirmar esta configuración? (sí/no)
   ```

2. **Si el usuario confirma:**
   - Crear `.dentrita/users/[user-id]/`
   - Crear `profile.json` con la información
   - Crear `profiles/` y `workspace-defaults.json`
   - Crear perfil específico para el workspace principal (opcional)

3. **Si el usuario no confirma:**
   - Permitir editar respuestas
   - Volver a mostrar resumen

#### Paso 4: Creación de Perfil por Workspace

Después de crear el perfil básico, ofrecer:

```markdown
¿Quieres crear un perfil específico para el workspace "[workspace]"?

Este perfil se activará automáticamente cuando trabajes en ese workspace.
(puedes crearlo después si prefieres)
```

Si el usuario acepta:
- Crear `profiles/workspace-[workspace].json`
- Configurarlo como predeterminado en `workspace-defaults.json`
- Usar el perfil básico como base y adaptarlo para el workspace

#### Paso 5: Confirmación Final

```markdown
✅ Configuración completada!

Tu perfil ha sido creado en:
.dentrita/users/[user-id]/

Para más información sobre perfiles y cómo usarlos, consulta:
.dentrita/users/README.md
```

---

## Estructura de Archivos Creados

### 1. `.dentrita/users/[user-id]/profile.json`

```json
{
  "user_id": "[user-id]",
  "name": "[name]",
  "primary_workspace": "[workspace]",
  "preferences": {
    "language": "es",
    "communication_style": "[direct|detailed|balanced]",
    "update_frequency": "[frequent|normal|minimal]"
  },
  "work_context": {
    "primary_roles": ["[role1]", "[role2]"],
    "frequently_used_skills": []
  },
  "metadata": {
    "created_at": "[ISO-date]",
    "last_updated": "[ISO-date]"
  }
}
```

### 2. `.dentrita/users/[user-id]/workspace-defaults.json`

```json
{
  "workspace_profiles": {
    "[workspace]": "workspace-[workspace]"
  },
  "default_profile": "profile.json"
}
```

### 3. `.dentrita/users/[user-id]/profiles/workspace-[workspace].json` (si se crea)

```json
{
  "profile_id": "workspace-[workspace]",
  "profile_name": "Perfil [workspace]",
  "workspace": "[workspace]",
  "is_default_for_workspace": true,
  "preferences": {
    "language": "es",
    "communication_style": "[style]",
    "update_frequency": "[frequency]"
  },
  "work_context": {
    "primary_roles": ["[roles]"],
    "frequently_used_skills": [],
    "preferred_work_modes": []
  },
  "workspace_settings": {
    "default_project_type": "",
    "preferred_templates": []
  },
  "metadata": {
    "created_at": "[ISO-date]",
    "last_updated": "[ISO-date]"
  }
}
```

---

## Validaciones

Cursor debe validar:

1. **Identificador único:**
   - No puede estar vacío
   - Debe ser válido para nombres de carpeta (sin caracteres especiales excepto guiones y guiones bajos)
   - Si ya existe, preguntar si quiere usar ese usuario o crear uno nuevo

2. **Workspace:**
   - Debe ser uno de: ennui, inspiro, entre-rutas, horizontes, iami, otros
   - Si no es válido, sugerir "otros"

3. **Roles:**
   - Deben ser válidos (project-manager, sustainability-strategist, etc.)
   - Si hay roles inválidos, informar y sugerir los válidos

4. **Estilo y frecuencia:**
   - Validar que sean opciones válidas
   - Si no es válido, usar valor predeterminado (balanced, normal)

---

## Casos Especiales

### Usuario ya Existe

Si el identificador ya existe:

```markdown
El usuario "[user-id]" ya existe.

Opciones:
1. Usar el usuario existente
2. Crear un nuevo usuario con otro identificador
3. Ver información del usuario existente
```

### Múltiples Usuarios en el Futuro

Si ya hay usuarios configurados pero se quiere agregar uno nuevo:

- No activar el proceso completo de inicialización
- Solo crear el nuevo usuario siguiendo los mismos pasos
- No sobrescribir usuarios existentes

### Repositorio Migrado

Si se detecta que es un repositorio migrado (hay estructura pero no usuarios):

- Ofrecer migrar configuración existente a formato de usuarios
- Si no es posible, crear usuario nuevo con valores predeterminados

---

## Integración con Otros Hooks

Este hook se integra con:

1. **skill-activation-prompt:**
   - El perfil del usuario puede influir en qué skills se sugieren
   - Los `frequently_used_skills` del perfil priorizan ciertos skills

2. **post-tool-use-tracker:**
   - El contexto del usuario puede influir en cómo se rastrean los cambios
   - Se considera el workspace preferido del usuario

---

## Mensajes de Error

### Error al crear estructura

```markdown
⚠️ Error al crear la estructura de usuario.

Posibles causas:
- Permisos insuficientes
- Carpeta .dentrita/users/ no existe

Solución: Verificar permisos y crear .dentrita/users/ si no existe.
```

### Error al guardar perfil

```markdown
⚠️ Error al guardar el perfil.

Por favor, verifica que:
- Tienes permisos de escritura
- El formato de las respuestas es válido

Intenta nuevamente o crea el perfil manualmente.
```

---

## Notas para Cursor

1. **Siempre preguntar antes de crear:**
   - No asumir valores predeterminados sin confirmar
   - Dar opciones claras al usuario

2. **Mantener el proceso interactivo:**
   - Hacer una pregunta a la vez
   - Confirmar antes de crear archivos

3. **Documentar lo creado:**
   - Mostrar qué archivos se crearon
   - Explicar cómo usar el sistema de perfiles

4. **No sobrescribir sin confirmar:**
   - Si algo ya existe, preguntar antes de sobrescribir

---

## Referencias

- `.dentrita/users/README.md` - Documentación completa del sistema de usuarios
- `.dentrita/settings.json` - Configuración general del sistema
- `.dentrita/hooks/README.md` - Documentación general de hooks

---

**Para Cursor:** Este hook es una referencia de comportamiento. Debes leer este archivo y aplicar la lógica documentada cuando detectes un repositorio vacío. NO ejecutes scripts, aplica el comportamiento reflexivamente.

