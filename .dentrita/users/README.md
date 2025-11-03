# Sistema de Usuarios y Perfiles

Sistema de gestión de usuarios y perfiles para ennui-dendrita que permite personalizar el comportamiento de Cursor según el usuario y el contexto de trabajo.

---

## ¿Qué es este sistema?

Este sistema permite:

- ✅ **Identificar usuarios** del repositorio
- ✅ **Guardar preferencias** y configuración personalizada
- ✅ **Crear perfiles** específicos para diferentes contextos o workspaces
- ✅ **Configurar perfiles predeterminados** por workspace
- ✅ **Activar perfiles** según la necesidad del trabajo

---

## Estructura de Carpetas

```
.dentrita/users/
├── README.md                              # Este archivo
├── [user-id]/                             # Carpeta por usuario
│   ├── profile.json                       # Perfil predeterminado del usuario
│   ├── profiles/                          # Perfiles adicionales
│   │   ├── [profile-name].json            # Perfil específico
│   │   └── workspace-[workspace-name].json # Perfil por workspace
│   └── workspace-defaults.json           # Configuración de perfiles predeterminados por workspace
└── .gitignore                             # Para excluir datos personales del repositorio
```

---

## Identificación de Usuario

### Inicialización

Cuando Cursor detecta que el repositorio está vacío o no tiene usuarios configurados, debe:

1. **Preguntar al usuario** datos básicos:
   - Nombre o identificador único
   - Workspace principal (ennui, inspiro, entre-rutas, horizontes, iami, otros)
   - Tipo de trabajo principal
   - Preferencias de comunicación

2. **Crear la estructura** del usuario en `.dentrita/users/[user-id]/`

3. **Generar el perfil predeterminado** `profile.json`

### Estructura de `profile.json`

```json
{
  "user_id": "alvaro",
  "name": "Álvaro",
  "email": "alvaro.e.mur@gmail.com",
  "primary_workspace": "ennui",
  "preferences": {
    "language": "es",
    "communication_style": "direct",
    "update_frequency": "frequent"
  },
  "work_context": {
    "primary_roles": ["project-manager", "sustainability-strategist"],
    "frequently_used_skills": ["gestion-proyectos", "diagnostico-sostenibilidad"]
  },
  "metadata": {
    "created_at": "2024-01-01",
    "last_updated": "2024-01-01"
  }
}
```

---

## Perfiles

### Perfil Predeterminado

El archivo `profile.json` en `.dentrita/users/[user-id]/` es el perfil predeterminado del usuario. Este perfil se usa cuando no se especifica otro perfil o workspace.

### Perfiles Adicionales

Los perfiles adicionales se guardan en `.dentrita/users/[user-id]/profiles/` y pueden ser:

1. **Perfiles por workspace**: `workspace-[workspace-name].json`
   - Se activan automáticamente cuando se trabaja en ese workspace
   - Pueden configurarse como predeterminados en `workspace-defaults.json`

2. **Perfiles personalizados**: `[profile-name].json`
   - Perfiles creados para contextos específicos
   - Se activan manualmente según la necesidad

### Estructura de Perfil

```json
{
  "profile_id": "workspace-ennui",
  "profile_name": "Perfil ennui",
  "workspace": "ennui",
  "is_default_for_workspace": true,
  "preferences": {
    "language": "es",
    "communication_style": "professional",
    "update_frequency": "frequent"
  },
  "work_context": {
    "primary_roles": ["sustainability-strategist", "project-manager"],
    "frequently_used_skills": ["diagnostico-sostenibilidad", "gestion-proyectos"],
    "preferred_work_modes": ["sustainability-strategist", "project-manager"]
  },
  "workspace_settings": {
    "default_project_type": "sustainability-diagnostic",
    "preferred_templates": ["sustainability-diagnostic", "project-pipeline"]
  },
  "metadata": {
    "created_at": "2024-01-01",
    "last_updated": "2024-01-01"
  }
}
```

---

## Configuración de Perfiles Predeterminados

El archivo `workspace-defaults.json` permite configurar qué perfil usar por defecto en cada workspace:

```json
{
  "workspace_profiles": {
    "ennui": "workspace-ennui",
    "inspiro": "profile-default",
    "entre-rutas": "workspace-entre-rutas",
    "horizontes": "workspace-horizontes",
    "iami": "profile-default",
    "otros": "profile-default"
  },
  "default_profile": "profile.json"
}
```

---

## Reglas de Uso

### 1. Detección de Usuario

Cursor debe identificar el usuario activo:

1. **Al iniciar una sesión:**
   - Si solo hay un usuario: usar ese usuario
   - Si hay múltiples usuarios: preguntar cuál usar
   - Si no hay usuarios: iniciar proceso de inicialización

2. **Durante una sesión:**
   - Mantener el usuario identificado
   - Usar el perfil predeterminado del usuario o el perfil configurado para el workspace activo

### 2. Activación de Perfiles

Cursor debe aplicar el perfil correcto según el contexto:

1. **Al trabajar en un workspace:**
   - Verificar `workspace-defaults.json` para el perfil predeterminado del workspace
   - Si existe, usar ese perfil
   - Si no existe, usar el perfil predeterminado del usuario (`profile.json`)

2. **Al cambiar de workspace:**
   - Verificar si hay un perfil configurado para el nuevo workspace
   - Cambiar al perfil correspondiente
   - Notificar al usuario del cambio de perfil (opcional)

3. **Activación manual:**
   - El usuario puede solicitar usar un perfil específico
   - Cursor debe cargar ese perfil y aplicarlo durante la sesión

### 3. Aplicación del Perfil

Cuando un perfil está activo, Cursor debe:

1. **Leer las preferencias:**
   - Usar el estilo de comunicación especificado
   - Aplicar la frecuencia de actualización
   - Usar el idioma preferido

2. **Aplicar el contexto de trabajo:**
   - Sugerir skills según `frequently_used_skills`
   - Activar work modes según `preferred_work_modes`
   - Usar templates según `preferred_templates`

3. **Personalizar sugerencias:**
   - Priorizar skills y modos relevantes para el perfil
   - Adaptar respuestas al estilo de comunicación
   - Usar el workspace como contexto principal

---

## Inicialización del Repositorio

### Proceso de Inicialización

Cuando Cursor detecta que el repositorio está vacío (no hay usuarios en `.dentrita/users/`):

1. **Preguntar al usuario:**
   ```
   ¡Bienvenido a ennui-dendrita! 
   
   Parece que este es un repositorio nuevo. Para configurarlo, necesito algunos datos básicos:
   
   1. ¿Cuál es tu nombre o identificador único? (ej: alvaro, juan, equipo-1)
   2. ¿Cuál es tu workspace principal? (ennui, inspiro, entre-rutas, horizontes, iami, otros)
   3. ¿Cuál es tu tipo de trabajo principal? (project-manager, sustainability-strategist, mel-analyst, stakeholder-facilitator, fundraising-specialist)
   4. ¿Prefieres comunicación directa o detallada? (direct, detailed)
   5. ¿Con qué frecuencia actualizamos current-context.md? (frequent, normal, minimal)
   ```

2. **Crear la estructura del usuario:**
   - Crear `.dentrita/users/[user-id]/`
   - Crear `profile.json` con las respuestas
   - Crear `profiles/` y `workspace-defaults.json`

3. **Confirmar la configuración:**
   - Mostrar un resumen de la configuración
   - Ofrecer crear un perfil específico para el workspace principal

---

## Ejemplos de Uso

### Ejemplo 1: Usuario con un solo workspace

```
Usuario: alvaro
Workspace principal: ennui
Perfil predeterminado: profile.json
Perfil para ennui: workspace-ennui.json (predeterminado para ennui)
```

Al trabajar en `workspaces/ennui/`, Cursor usa `workspace-ennui.json`.
Al trabajar en otros workspaces, usa `profile.json`.

### Ejemplo 2: Usuario con múltiples workspaces

```
Usuario: alvaro
Workspace principal: ennui
Perfiles configurados:
  - workspace-ennui.json (predeterminado para ennui)
  - workspace-inspiro.json (predeterminado para inspiro)
  - workspace-otros.json (predeterminado para otros)
```

Al cambiar entre workspaces, Cursor cambia automáticamente al perfil correspondiente.

### Ejemplo 3: Activar perfil manualmente

```
Usuario: "Quiero usar el perfil 'auditoria'"
Cursor: Carga .dentrita/users/alvaro/profiles/auditoria.json y lo aplica durante la sesión.
```

---

## Integración con otros Sistemas

### Skills

El sistema de perfiles se integra con `.dentrita/skills/`:

- Los perfiles pueden especificar `frequently_used_skills`
- Cursor prioriza estos skills al sugerir activación
- El hook `skill-activation-prompt` considera el perfil activo

### Work Modes

Los perfiles pueden especificar `preferred_work_modes`:

- Cursor sugiere estos work modes cuando son relevantes
- Facilita la activación de modos de trabajo frecuentes

### Workspace Structure

El sistema respeta la estructura de workspaces:

- Cada workspace puede tener su perfil configurado
- Los perfiles pueden especificar preferencias específicas del workspace
- Se mantiene consistencia con la estructura estándar

---

## Privacidad y Seguridad

### Archivos Excluidos

El archivo `.dentrita/users/.gitignore` excluye:

```
*.json
!workspace-defaults.json.example
```

**Nota:** Los perfiles contienen información personal y no deben compartirse en el repositorio por defecto. Si un usuario quiere compartir un perfil como template, puede crear un archivo `.example`.

### Datos Sensibles

Los perfiles pueden contener:
- Información de contacto (opcional)
- Preferencias personales
- Configuración de trabajo

**Recomendación:** Mantener datos sensibles al mínimo necesario.

---

## Mantenimiento

### Actualizar Perfil

El usuario puede actualizar su perfil en cualquier momento:

1. Modificar directamente `profile.json` o el perfil correspondiente
2. Pedir a Cursor que actualice el perfil
3. Cursor actualiza `last_updated` en metadata

### Crear Nuevo Perfil

El usuario puede crear un nuevo perfil:

1. Solicitar crear un perfil con un nombre específico
2. Cursor pregunta las preferencias o usa el perfil predeterminado como base
3. Guardar en `profiles/[profile-name].json`

### Eliminar Perfil

El usuario puede eliminar un perfil:

1. Solicitar eliminar un perfil
2. Cursor verifica que no esté configurado como predeterminado
3. Eliminar el archivo correspondiente

---

## Troubleshooting

### No se detecta el usuario

1. Verificar que existe `.dentrita/users/[user-id]/profile.json`
2. Si no existe, iniciar proceso de inicialización
3. Si existe pero no se detecta, verificar permisos de lectura

### Perfil no se aplica correctamente

1. Verificar `workspace-defaults.json` para el workspace activo
2. Verificar que el perfil existe en `profiles/`
3. Verificar el formato JSON del perfil

### Múltiples usuarios

1. Si hay múltiples usuarios, Cursor debe preguntar cuál usar
2. Considerar guardar el usuario activo en `settings.local.json` (no versionado)

---

## Referencias

- `.dentrita/hooks/repo-initialization.md` - Hook de inicialización
- `.dentrita/settings.json` - Configuración general del sistema
- `.dentrita/WORKSPACE-STRUCTURE.md` - Estructura estándar de workspaces

---

**Para más información:** Ver `.dentrita/hooks/repo-initialization.md` y `.dentrita/settings.json`

