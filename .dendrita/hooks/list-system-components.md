---
name: list-system-components
description: "Hook de Listado de Componentes del Sistema"
type: hook
created:
  2025-11-06T00:00:00.000Z
  
updated:
  2025-11-06T00:00:00.000Z
  
tags: ["hook", "behavior-reference"]
category: behavior-reference
---

# Hook de Listado de Componentes del Sistema

Referencia de comportamiento para Cursor - listado del sistema de hooks, agents, skills (capa verbal) y scripts (capa lógica).

---

## ¿Qué es este Hook?

Este hook documenta el comportamiento esperado que Cursor debe aplicar cuando el usuario solicita listar el sistema de componentes de dendrita.

**Propósito:** Proporcionar una vista completa y organizada de todos los componentes del sistema dendrita, separando la capa verbal (hooks, agents, skills) de la capa lógica (scripts).

**System name:** The system is called **"dendrita"** or **"dendrita system"**. Components (hooks, agents, skills, scripts) are collectively referred to as "dendrita components" or "dendrita infrastructure". See `.dendrita/docs/SYSTEM-BEHAVIOR.md` for more details.

**Estructura del sistema:**
- **Capa Verbal:** Hooks, Agents, Skills (documentación y referencias de comportamiento)
- **Capa Lógica:** Scripts (código ejecutable para integraciones)

---

## Comportamiento Esperado

### 1. Activación del Hook

Cursor debe ejecutar este listado cuando:

- ✅ El usuario solicita explícitamente "listar el sistema"
- ✅ El usuario pregunta "qué hooks/agents/skills/scripts hay"
- ✅ El usuario menciona "sistema de hooks, agentes y skills"
- ✅ El usuario solicita "mostrar componentes del sistema"
- ✅ El usuario quiere ver "la capa verbal y la capa lógica"

**Patrones de activación:**

```markdown
- "listar el sistema"
- "mostrar hooks, agentes y skills"
- "qué componentes hay"
- "sistema de hooks, agentes y skills"
- "capa verbal y capa lógica"
- "listar scripts"
```

### 2. Proceso de Listado

Cuando se activa el listado, Cursor debe:

#### Paso 1: Identificar Usuario Activo

```markdown
1. Leer `.dendrita/users/` para identificar usuarios disponibles
2. Identificar usuario activo (si hay uno configurado)
3. Si hay múltiples usuarios, listar componentes por usuario
4. Si solo hay un usuario, mostrar componentes de ese usuario
```

#### Paso 2: Listar Hooks (Capa Verbal)

```markdown
1. Leer `.dendrita/hooks/` para obtener todos los hooks
2. Excluir archivos de configuración (package.json, tsconfig.json, etc.)
3. Incluir solo archivos .md (documentación de comportamiento)
4. Organizar por categoría si es posible:
   - Inicialización: repo-initialization, session-initialization-verification
   - Activación: skill-activation-prompt, dendrita-alias-activation
   - Seguimiento: post-tool-use-tracker, working-context
   - Modificación: dendrita-infrastructure-modification, dendritify
   - Verificación: markdown-source-of-truth-verification
   - Otros: journaling, blog-clipping-creation, code-debugging-archiving
```

**Formato de salida:**

```markdown
### Hooks (Capa Verbal)
Ubicación: `.dendrita/hooks/`

#### Inicialización
- `repo-initialization.md` - Inicialización de repositorio vacío
- `session-initialization-verification.md` - Verificación de configuración al inicio de sesión

#### Activación
- `skill-activation-prompt.md` - Activación de skills basada en prompts
- `dendrita-alias-activation.md` - Activación de contexto de workspace mediante alias

#### Seguimiento
- `post-tool-use-tracker.md` - Seguimiento de cambios de archivos
- `working-context.md` - Contexto de trabajo temporal

#### Modificación
- `dendrita-infrastructure-modification.md` - Modificación de infraestructura dendrita
- `dendritify.md` - Conversión de componentes a formato dendrita

#### Verificación
- `markdown-source-of-truth-verification.md` - Verificación de markdown como fuente de verdad

#### Otros
- `journaling.md` - Captura de narrativas de trabajo
- `blog-clipping-creation.md` - Creación de clippings para blog
- `blog-publication.md` - Publicación de blog
- `code-debugging-archiving.md` - Depuración y archivado de código
```

#### Paso 3: Listar Agents (Capa Verbal - por Usuario)

```markdown
1. Para cada usuario en `.dendrita/users/[user-id]/agents/`:
   - Leer todos los archivos .md (excluir README.md)
   - Extraer nombre del archivo (sin .md)
   - Si tiene YAML frontmatter, extraer descripción
   - Organizar por usuario
```

**Formato de salida:**

```markdown
### Agents (Capa Verbal)
Ubicación: `.dendrita/users/[user-id]/agents/`

#### Usuario: alvaro
- `analista-mel.md` - Análisis de sistemas MEL
- `especialista-fundraising.md` - Especialista en fundraising
- `estratega-sostenibilidad.md` - Estrategia de sostenibilidad
- `facilitador-aliados.md` - Facilitación de alianzas
- `gestor-contexto-temporal.md` - Gestión de contexto temporal
- `gestor-proyectos.md` - Gestión de proyectos
- `web-research-specialist.md` - Especialista en investigación web

#### Usuario: example-user
- `example-agent.md` - Agente de ejemplo
```

#### Paso 4: Listar Skills (Capa Verbal - por Usuario)

```markdown
1. Para cada usuario en `.dendrita/users/[user-id]/skills/`:
   - Leer `skill-rules.json` para obtener lista de skills
   - Para cada skill, verificar si existe `[skill-name]/SKILL.md`
   - Extraer descripción del skill-rules.json
   - Organizar por usuario
```

**Formato de salida:**

```markdown
### Skills (Capa Verbal)
Ubicación: `.dendrita/users/[user-id]/skills/`

#### Usuario: alvaro
- `gestion-proyectos/` - Patrones de gestión de proyectos
- `diagnostico-sostenibilidad/` - Patrones para diagnósticos ESG y sostenibilidad
- `sistema-mel/` - Patrones para sistemas MEL (Monitoreo, Evaluación y Aprendizaje)
- `pipeline-proyectos/` - Patrones para pipeline de proyectos y alianzas
- `bootcamp-fundraising/` - Patrones para bootcamps de fundraising y fortalecimiento de capacidades
- `gestion-stakeholders/` - Patrones para gestión de stakeholders, diseño de alianzas estratégicas y coordinación multi-actor

#### Usuario: example-user
- `example-skill/` - Skill de ejemplo
```

#### Paso 5: Listar Scripts (Capa Lógica)

```markdown
1. Leer `.dendrita/integrations/scripts/` para obtener todos los scripts
2. Excluir archivos de documentación (.md) y configuración (.json)
3. Incluir solo archivos ejecutables (.ts, .js, .py, .sh)
4. Organizar por categoría si es posible:
   - Extracción: extract-gdoc-content, extract-gsheet-content
   - Sincronización: sync-documents, sync-drive-folder-reference, sync-user-services
   - Scrapers: drive-scraper, calendar-scraper, setup-drive-scraper
   - Búsqueda: search-cv-drive, search-projects-sheet, search-emails
   - Análisis: analyze-projects-sheet, generate-detailed-report
   - Verificación: verify-markdown-source-of-truth, verify-calendar-setup
   - Configuración: setup-drive-scraper, create-drive-scraper-config
   - Utilidades: list-supabase-tables, inspect-table-schema, find-drive-folder
   - SSH: ssh-deploy-scraper, ssh-run-scraper
   - Otros: update-working-context, get-full-projects-data
```

**Formato de salida:**

```markdown
### Scripts (Capa Lógica)
Ubicación: `.dendrita/integrations/scripts/`

#### Extracción
- `extract-gdoc-content.ts` - Extracción de contenido de Google Docs
- `extract-gsheet-content.ts` - Extracción de contenido de Google Sheets

#### Sincronización
- `sync-documents.ts` - Sincronización de documentos
- `sync-documents.py` - Sincronización de documentos (Python)
- `sync-drive-folder-reference.ts` - Sincronización de referencias de carpetas de Drive
- `sync-user-services.ts` - Sincronización de servicios de usuario
- `sync-all.py` - Sincronización completa

#### Scrapers
- `drive-scraper.ts` - Scraper de Google Drive
- `calendar-scraper.ts` - Scraper de Google Calendar
- `setup-drive-scraper.ts` - Configuración de scraper de Drive
- `setup-and-run-drive-scraper.ts` - Configuración y ejecución de scraper de Drive

#### Búsqueda
- `search-cv-drive.ts` - Búsqueda de CV en Drive
- `search-projects-sheet.ts` - Búsqueda en hoja de proyectos
- `search-emails.ts` - Búsqueda de emails

#### Análisis
- `analyze-projects-sheet.ts` - Análisis de hoja de proyectos
- `generate-detailed-report.ts` - Generación de reporte detallado
- `get-full-projects-data.ts` - Obtención de datos completos de proyectos

#### Verificación
- `verify-markdown-source-of-truth.ts` - Verificación de markdown como fuente de verdad
- `verify-calendar-setup.ts` - Verificación de configuración de Calendar
- `verify-drive-scraper-setup.ts` - Verificación de configuración de scraper de Drive

#### Configuración
- `create-drive-scraper-config.ts` - Creación de configuración de scraper de Drive
- `update-calendar-name.ts` - Actualización de nombre de Calendar

#### Utilidades
- `list-supabase-tables.ts` - Listado de tablas de Supabase
- `inspect-table-schema.ts` - Inspección de esquema de tabla
- `find-drive-folder.ts` - Búsqueda de carpeta en Drive
- `list-drive-folders.ts` - Listado de carpetas de Drive
- `list-folders-in-folder.ts` - Listado de carpetas dentro de una carpeta
- `get-refresh-token.ts` - Obtención de refresh token

#### SSH
- `ssh-deploy-scraper.ts` - Despliegue de scraper vía SSH
- `ssh-run-scraper.ts` - Ejecución de scraper vía SSH

#### Otros
- `update-working-context.ts` - Actualización de contexto de trabajo
- `test-calendar.ts` - Prueba de Calendar
- `test-drive.ts` - Prueba de Drive
- `test-gmail.ts` - Prueba de Gmail
- `test-gmail-api.ts` - Prueba de API de Gmail
- `setup-auto-sync.sh` - Configuración de sincronización automática
```

### 3. Formato de Salida Completo

El listado completo debe seguir este formato:

```markdown
# Sistema de Componentes dendrita

**Nota:** El sistema se denomina "dendrita" o "sistema dendrita". Los componentes se refieren colectivamente como "componentes del sistema dendrita".

## Capa Verbal (Documentación y Referencias de Comportamiento)

### Hooks
[Formato del Paso 2]

### Agents
[Formato del Paso 3]

### Skills
[Formato del Paso 4]

---

## Capa Lógica (Código Ejecutable)

### Scripts
[Formato del Paso 5]

---

## Resumen

- **Hooks:** [número] hooks disponibles
- **Agents:** [número] agents disponibles ([número] usuarios)
- **Skills:** [número] skills disponibles ([número] usuarios)
- **Scripts:** [número] scripts disponibles
```

### 4. Consideraciones Especiales

#### Archivos a Excluir

```markdown
- README.md (documentación, no componentes)
- package.json, tsconfig.json (configuración)
- Archivos en subdirectorios archived/ (archivados)
- Archivos de ejemplo en examples/ (si se listan por separado)
```

#### Archivos a Incluir

```markdown
- Todos los .md en hooks/ (excepto README.md)
- Todos los .md en agents/ (excepto README.md)
- Todas las carpetas en skills/ con SKILL.md
- Todos los .ts, .js, .py, .sh en scripts/ (excepto documentación)
```

#### Organización por Usuario

```markdown
- Si hay un solo usuario: mostrar directamente sus agents y skills
- Si hay múltiples usuarios: agrupar por usuario
- Si no hay usuarios: indicar que no hay agents ni skills configurados
```

---

## Referencias de Archivos

**Archivos de referencia:**
- `.dendrita/hooks/README.md` - Documentación de hooks
- `.dendrita/users/[user-id]/agents/README.md` - Documentación de agents
- `.dendrita/users/[user-id]/skills/README.md` - Documentación de skills
- `.dendrita/users/[user-id]/skills/skill-rules.json` - Reglas de activación de skills
- `.dendrita/integrations/README.md` - Documentación de integraciones

**Para Cursor:**
- Leer estos archivos para entender la estructura
- NO intentar ejecutarlos
- Aplicar el comportamiento documentado cuando el usuario solicite listar el sistema

---

## Diferencia con Otros Hooks

- **Este hook es de consulta:** Solo lista componentes, no modifica nada
- **No requiere activación automática:** Solo se ejecuta cuando el usuario lo solicita
- **Es informativo:** Proporciona una vista completa del sistema para referencia

---

## Ejemplo de Uso

**Usuario:** "listar el sistema de hooks, agentes y skills"

**Cursor debe:**
1. Leer `.dendrita/hooks/` y listar todos los hooks
2. Leer `.dendrita/users/` y listar agents por usuario
3. Leer `.dendrita/users/[user-id]/skills/` y listar skills por usuario
4. Leer `.dendrita/integrations/scripts/` y listar todos los scripts
5. Presentar el listado completo organizado por capa (verbal vs lógica)

---

**Para más información:** Ver `.dendrita/hooks/README.md` para documentación completa de hooks, `.dendrita/users/[user-id]/agents/README.md` para agents, y `.dendrita/users/[user-id]/skills/README.md` para skills.

