---
name: scraper-config-design
description: "Diseño de Configuración de Scrapers"
type: documentation
created:
  2025-11-06T00:00:00.000Z
  
updated:
  2025-11-06T00:00:00.000Z
  
tags: ["documentation", "integration"]
category: integration
---

# 🎯 Diseño de Configuración de Scrapers

Diseño de ubicación y estructura de configuración de scrapers según principios de dendrita.

---

## 📋 Principios de Diseño

### 1. **Separación por Tipo de Scraping**

#### Calendar Scraper → `.dendrita/users/[user-id]/`
**Razón:** Calendar scraper busca **TODOS** los eventos de los calendarios del usuario. No requiere filtros específicos por workspace, ya que es un scraping completo de calendarios personales.

#### Drive Scraper → `workspaces/[workspace]/scrapers-config.json` O `.dendrita/users/[user-id]/scrapers-config.json`
**Razón:** 
- **Workspace-level:** Drive scraper puede tener **reglas específicas** (filtros por carpetas específicas) que están asociadas a un workspace/empresa específico.
- **User-level:** Drive scraper también puede configurarse a nivel de usuario para scrapear carpetas principales del Drive (ej: My Drive root, carpetas personales).

#### Gmail Scraper → `workspaces/[workspace]/scrapers-config.json`
**Razón:** Gmail scraper requiere **reglas específicas** (filtros por palabras, etiquetas, queries de búsqueda) que están asociadas a un workspace/empresa específico.

### 2. **Seguridad: Información Personal NO en Git**

**CRÍTICO:** Toda información personal debe estar excluida de git:
- `.dendrita/users/` → En `.gitignore`
- `.dendrita/logs/` → En `.gitignore`
- `workspaces/[empresa]/` → En `.gitignore` (ya está)
- Archivos de configuración con datos sensibles → En `.gitignore`

---

## 📁 Estructura de Archivos

### Calendar Scraper

**Ubicación:** `.dendrita/users/[user-id]/scrapers-config.json`

```json
{
  "_comment": "Configuración de scraping de Google Calendar para usuario",
  "_description": "Configuración global de calendarios del usuario. No requiere filtros específicos por workspace ya que se scrapean TODOS los eventos.",
  "user_id": "[user-id]",
  "default_settings": {
    "time_min_offset_days": -30,
    "time_max_offset_days": 90,
    "max_results": 2500,
    "single_events": true,
    "sync_attendees": true,
    "sync_metadata": true
  },
  "calendars": [
    {
      "calendar_id": "primary",
      "calendar_name": "Calendario principal",
      "enabled": true,
      "time_min_offset_days": -30,
      "time_max_offset_days": 365,
      "max_results": 2500,
      "single_events": true,
      "sync_attendees": true,
      "sync_metadata": true
    },
    {
      "calendar_id": "user@example.com",
      "calendar_name": "Calendario personal",
      "enabled": true
    }
  ],
  "metadata": {
    "last_updated": "2025-01-28T00:00:00Z"
  }
}
```

**Alternativa:** Puede estar integrado en `profile.json` (como está actualmente):
```json
{
  "integrations": {
    "calendar_scraping": {
      "default_settings": { ... },
      "enabled_calendars": ["primary"],
      "auto_enable_primary": false
    }
  }
}
```

---

### Drive Scraper

**Ubicación:** 
- **Workspace-level:** `workspaces/[workspace]/scrapers-config.json`
- **User-level:** `.dendrita/users/[user-id]/scrapers-config.json`

#### Workspace-level Configuration

```json
{
  "_comment": "Configuración de scraping de Google Drive para workspace",
  "_description": "Configuración específica por workspace con filtros y reglas de scraping.",
  "workspace": "example-workspace",
  "drive": {
    "configs": [
      {
        "config_name": "workspace-projects",
        "enabled": true,
        "folder_ids": [
          "1ABC123...",
          "1XYZ789..."
        ],
        "include_subfolders": true,
        "max_results": 1000,
        "extract_permissions": true,
        "extract_revisions": false,
        "extract_content": false,
        "extract_metadata": true,
        "extract_thumbnail": false,
        "root_files_metadata_only": false,
        "mime_type_filter": [],
        "date_min": null,
        "date_max": null
      },
      {
        "config_name": "workspace-documents",
        "enabled": true,
        "folder_ids": ["1DEF456..."],
        "include_subfolders": true,
        "extract_content": true,
        "root_files_metadata_only": false,
        "mime_type_filter": ["application/pdf", "text/plain"]
      }
    ]
  },
  "metadata": {
    "last_updated": "2025-01-28T00:00:00Z"
  }
}
```

#### User-level Configuration

```json
{
  "_comment": "Configuración de scrapers para usuario",
  "_description": "Este archivo contiene la configuración de scraping de Google Calendar y Google Drive para el usuario.",
  "user_id": "alvaro",
  "calendar": { ... },
  "drive": {
    "_comment": "Configuración de scraping de Google Drive a nivel de usuario",
    "_description": "Configuración para scrapear carpetas principales del Drive del usuario. My Drive scrapea todo desde root, pero solo metadata para archivos sueltos en root.",
    "configs": [
      {
        "config_name": "my-drive-root",
        "enabled": true,
        "folder_ids": ["root"],
        "include_subfolders": true,
        "max_results": 10000,
        "extract_permissions": true,
        "extract_revisions": false,
        "extract_content": false,
        "extract_metadata": true,
        "extract_thumbnail": false,
        "root_files_metadata_only": true,
        "mime_type_filter": [],
        "date_min": null,
        "date_max": null
      }
    ]
  },
  "metadata": {
    "last_updated": "2025-01-28T00:00:00Z"
  }
}
```

**Nota sobre `root_files_metadata_only`:**
- Si `true`: Cuando se scrapea desde `root`, los archivos sueltos en root solo se scrapean con metadata (sin contenido).
- Las carpetas en root siempre se scrapean recursivamente con todo su contenido.
- Esto optimiza el volumen de datos procesados cuando se scrapea todo el Drive desde root.

---

### Gmail Scraper

**Ubicación:** `workspaces/[workspace]/scrapers-config.json`

```json
{
  "_comment": "Configuración de scraping de Gmail para workspace",
  "_description": "Configuración específica por workspace con queries de búsqueda y filtros.",
  "workspace": "example-workspace",
  "configs": [
    {
      "config_name": "workspace-project-emails",
      "enabled": true,
      "search_query": "from:cliente@example.com OR subject:proyecto example",
      "max_results": 500,
      "extract_attachments": false,
      "extract_labels": true,
      "extract_threads": true,
      "extract_full_body": true,
      "extract_metadata": true,
      "auto_label": true,
      "date_min": "2024-01-01",
      "date_max": null
    },
    {
      "config_name": "workspace-fundraising",
      "enabled": true,
      "search_query": "label:fundraising OR subject:grant",
      "max_results": 200,
      "extract_attachments": true,
      "auto_label": true
    }
  ],
  "metadata": {
    "last_updated": "2025-01-28T00:00:00Z"
  }
}
```

---

## 🔄 Flujo de Carga de Configuración

### Calendar Scraper

```typescript
// 1. Cargar desde .dendrita/users/[user-id]/scrapers-config.json
// O desde profile.json si está integrado ahí (fallback legacy)
async loadConfigFromUser(userId: string): Promise<ScrapingConfig[]> {
  const configPath = path.join('.dendrita', 'users', userId, 'scrapers-config.json');
  
  // Si no existe, intentar cargar desde profile.json
  if (!fs.existsSync(configPath)) {
    const profile = await loadUserProfile(userId);
    return parseCalendarConfigFromProfile(profile);
  }
  
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  return config.calendars.map(cal => ({
    user_id: userId,
    calendar_id: cal.calendar_id,
    calendar_name: cal.calendar_name,
    enabled: cal.enabled ?? true,
    ...config.default_settings,
    ...cal, // Override defaults with calendar-specific settings
  }));
}
```

### Drive Scraper

```typescript
// 1. Cargar desde workspaces/[workspace]/scrapers-config.json (workspace-level)
async loadConfigFromWorkspace(workspace: string, userId?: string): Promise<DriveScrapingConfig[]> {
  const configPath = path.join('workspaces', workspace, 'scrapers-config.json');
  
  if (!fs.existsSync(configPath)) {
    return [];
  }
  
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  return config.drive.configs.map(cfg => ({
    user_id: userId || 'unknown',
    workspace: workspace,
    ...cfg
  }));
}

// 2. Cargar desde .dendrita/users/[user-id]/scrapers-config.json (user-level)
async loadConfigFromUser(userId: string): Promise<DriveScrapingConfig[]> {
  const configPath = path.join('.dendrita', 'users', userId, 'scrapers-config.json');
  
  if (!fs.existsSync(configPath)) {
    return [];
  }
  
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  return config.drive.configs.map(cfg => ({
    user_id: userId,
    workspace: undefined, // Configs a nivel de usuario no tienen workspace
    ...cfg
  }));
}

// 3. Ejecutar scraping (soporta ambos niveles)
async scrapeForUser(userId: string, profileId?: string, workspace?: string): Promise<DriveScrapingResult[]> {
  let configs: DriveScrapingConfig[] = [];
  
  if (workspace) {
    // Cargar configs del workspace
    configs = await this.loadConfigFromWorkspace(workspace, userId);
  } else {
    // Cargar configs a nivel de usuario
    configs = await this.loadConfigFromUser(userId);
  }
  
  // Ejecutar scraping para cada configuración
  // ...
}
```

### Gmail Scraper

```typescript
// 1. Cargar desde workspaces/[workspace]/scrapers-config.json
async loadConfigFromWorkspace(workspace: string): Promise<GmailScrapingConfig[]> {
  const configPath = path.join('workspaces', workspace, 'scrapers-config.json');
  
  if (!fs.existsSync(configPath)) {
    return [];
  }
  
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  return config.gmail.configs.map(cfg => ({
    workspace: workspace,
    ...cfg
  }));
}
```

---

## 🔐 Seguridad y Gitignore

### Reglas en `.gitignore`

```gitignore
# Dendrita users and personal data - CRITICAL: Never expose personal information
.dendrita/users/
.dendrita/logs/

# Workspaces with actual company/work data
# Example: workspaces/[workspace-name]/
# Note: Only the template workspace should be tracked

# But keep the template folder to show structure
!workspaces/template/
```

### Verificación

**Nunca deben estar en git:**
- ✅ `.dendrita/users/` (perfiles de usuario, configuraciones personales)
- ✅ `.dendrita/logs/` (logs que pueden contener información sensible)
- ✅ `workspaces/[empresa]/` (datos de empresas/clientes)
- ✅ Archivos de configuración con IDs de carpetas, queries de búsqueda, etc.

**Pueden estar en git:**
- ✅ `.dendrita/integrations/services/` (código, no datos)
- ✅ `.dendrita/integrations/scripts/` (código, no datos)
- ✅ `workspaces/template/` (estructura de ejemplo sin datos reales)
- ✅ Schemas SQL (estructura de base de datos, no datos)

---

## 📝 Migración desde Supabase

### Estado Actual
- Configuraciones están en Supabase (tablas `*_scraping_configs`)
- Lógica carga desde Supabase

### Estado Deseado (IMPLEMENTADO)
- ✅ Configuraciones en archivos locales (JSON)
- ✅ Lógica carga desde archivos locales
- ✅ Supabase solo para datos scrapeados (resultados), no configuración
- ✅ Paradigma de `.dendrita`: archivos únicos `[nombre]-config.json`

### Plan de Migración

1. **Crear archivos de configuración local** según estructura definida
2. **Actualizar servicios** para cargar desde archivos locales
3. **Migrar configuraciones existentes** desde Supabase a archivos locales
4. **Eliminar tablas de configuración** de Supabase (o mantener solo para compatibilidad)
5. **Actualizar documentación** y scripts de setup

---

## ✅ Ventajas del Nuevo Diseño

### 1. **Separación Clara**
- ✅ Calendar: configuración personal en `.dendrita/users/`
- ✅ Drive: configuración por workspace en `workspaces/[workspace]/` O a nivel de usuario en `.dendrita/users/`
- ✅ Gmail: configuración por workspace en `workspaces/[workspace]/`

### 2. **Seguridad**
- ✅ Información personal excluida de git
- ✅ Configuraciones con datos sensibles no en repositorio
- ✅ Fácil de verificar con `.gitignore`

### 3. **Mantenibilidad**
- ✅ Configuraciones en archivos JSON legibles
- ✅ Fácil de editar sin necesidad de Supabase
- ✅ Versionado local (fuera de git)

### 4. **Escalabilidad**
- ✅ Cada workspace puede tener sus propias configuraciones
- ✅ Fácil agregar nuevas configuraciones sin modificar código
- ✅ Configuraciones pueden ser compartidas entre usuarios (copia local)

---

## 📚 Referencias

- `.dendrita/docs/integrations/SCRAPER-ARCHITECTURE.md` - Arquitectura de scrapers
- `.dendrita/integrations/hooks/calendar-scraper-setup.md` - Setup de Calendar scraper
- `.dendrita/integrations/hooks/drive-scraper-setup.md` - Setup de Drive scraper
- `.dendrita/integrations/hooks/gmail-scraper-setup.md` - Setup de Gmail scraper (si existe)

---

**Última actualización:** 2025-01-28
**Versión:** 2.0
**Estado:** ✅ Implementado - Paradigma de .dendrita establecido
**Cambios:**
- ✅ Agregado soporte para Drive Scraper a nivel de usuario
- ✅ Agregado campo `root_files_metadata_only` para optimizar scraping desde root
- ✅ Actualizada documentación con ejemplos de ambos niveles

**Ver también:**
- `.dendrita/docs/TECHNICAL-PARADIGMS.md` - Technical design paradigm for .dendrita

