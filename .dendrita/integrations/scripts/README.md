# Scripts Organization

Este directorio contiene todos los scripts de integración de dendrita, organizados por categorías funcionales.

## 📁 Estructura de Carpetas

### `pipelines/` - Pipelines Complejos
Pipelines que orquestan múltiples scripts relacionados:

**`context-pipeline/`** - Scripts de Gestión de Contexto:
- `update-project-context.ts` - Actualiza project_context.json desde master_plan.md, current_context.md y tasks.md
- `update-context.ts` - Actualiza contextos de usuario y workspace
- `update-working-context.ts` - Analiza y actualiza working-context.md
- `migrate-context-to-json.ts` - Migra archivos de contexto MD a JSON
- `archive-all-context-md.ts` - Archiva archivos de contexto MD después de migración

**`calendar-scraper-pipeline/`** - Scripts de Calendar:
- `calendar-scraper.ts` - Scraper principal de calendarios
- `scrape-calendar-events-sheet.ts` - Scrapea eventos desde Google Sheets
- `workspace-calendar-integration.ts` - Integración de calendario con workspaces
- `update-calendar-name.ts` - Actualiza nombres de calendarios
- `test-calendar.ts` - Pruebas de integración con Calendar
- `verify-calendar-setup.ts` - Verifica configuración de calendario

**`drive-scraper-pipeline/`** - Scripts de Drive:
- `drive-scraper.ts` - Scraper principal de Drive
- `run-drive-scraper.ts` - Ejecuta scraper de Drive
- `create-drive-scraper-config.ts` - Crea configuración de scraper
- `setup-drive-scraper.ts` - Setup de scraper
- `setup-and-run-drive-scraper.ts` - Setup y ejecución de scraper
- `find-drive-folder.ts` - Busca carpetas en Drive
- `list-drive-folders.ts` - Lista carpetas en Drive
- `list-folders-in-folder.ts` - Lista carpetas dentro de una carpeta
- `sync-drive-folder-reference.ts` - Sincroniza referencias de carpetas
- `sync-to-drive.ts` - Sincroniza archivos a Drive
- `test-drive.ts` - Pruebas de integración con Drive (en `test/`)
- `verify-drive-scraper-setup.ts` - Verifica configuración de scraper de Drive

**`google-workspace-pipeline/`** - Scripts de Google Workspace:
- `sheets-docs/` - Scripts de Sheets y Docs:
  - `extract-gdoc-content.ts` - Extrae contenido de Google Docs
  - `extract-gsheet-content.ts` - Extrae contenido de Google Sheets
  - `search-cv-drive.ts` - Busca CVs en Drive
- `gmail/` - Scripts de Gmail:
  - `search-emails.ts` - Busca emails en Gmail
- `auth/` - Scripts de Autenticación:
  - `get-refresh-token.ts` - Obtiene refresh token de OAuth

**`transcripts-pipeline/`** - Scripts de Transcripciones:
- `extract/` - Extracción:
  - `extract-meeting-transcripts.ts` - Extrae transcripciones de reuniones
  - `extract-transcripts-from-drive.ts` - Extrae transcripciones desde Drive
- `find/` - Búsqueda:
  - `find-meetings-with-transcripts.ts` - Encuentra reuniones con transcripciones
  - `find-recent-meetings.ts` - Encuentra reuniones recientes
- `analyze/` - Análisis:
  - `analyze-transcript.ts` - Analiza transcripciones con IA
  - `integrate-transcript-analysis.ts` - Integra análisis en documentos
  - `enrich-meeting-notes.ts` - Enriquece meeting notes con análisis

**`sync/`** - Scripts de Sincronización Consolidados:
- `sync-all.ts` - Sincronización completa (workspaces, projects, documents, stakeholders, user services)
- `sync-documents.ts` - Sincroniza documentos a Supabase (con dendritaLogger)
- `sync-user-services.ts` - Sincroniza servicios de usuario (con dendritaLogger)
- `sync-google-workspace.ts` - Sincronización general de Google Workspace (con tracking, backlinks, wikilink-signature)
- `sync-experience-from-sheets.ts` - Sincroniza experiencia desde Sheets (con tracking, backlinks)
- `sync-to-server.ts` - Sincroniza archivos al servidor
- `sync-to-drive.ts` - Sincroniza archivos a Drive
- `sync-drive-folder-reference.ts` - Sincroniza referencias de carpetas
- `watch-and-sync.ts` - Monitorea cambios y sincroniza automáticamente
- Ver `sync/README.md` para documentación completa

**`pm-tools-sync-pipeline/`** - Pipeline de Sincronización con Herramientas de Gestión de Proyectos (en desarrollo):
- `bidirectional-sync.ts` - Motor de sincronización bidireccional genérico
- `conflict-resolution.ts` - Resolución de conflictos
- `types.ts` - Tipos para sincronización bidireccional

**`meeting-notes-pipeline/`** - Pipeline completo de meeting notes:
- `process-meeting-transcript.ts` - Pipeline principal para procesar transcripciones
- Scripts auxiliares para gestión de meeting notes

### `verify/` - Scripts de Verificación
Scripts para verificar configuración y seguridad:
- `verify-markdown-source-of-truth.ts` - Verifica que markdown sea fuente de verdad
- `check-dendrita-security.ts` - Verifica seguridad de dendrita
- `check-drive-scraper-status.ts` - Verifica estado del scraper de Drive
- `check-folder-info.ts` - Verifica información de carpetas
- Nota: `verify-calendar-setup.ts` y `verify-drive-scraper-setup.ts` están en sus respectivos pipelines

### `search/` - Scripts de Búsqueda
Scripts para buscar información en diferentes fuentes:
- `search-projects-sheet.ts` - Busca proyectos en Sheets
- `analyze-projects-sheet.ts` - Analiza proyectos desde Sheets

### `utils/` - Scripts de Utilidades
Scripts de utilidades generales (solo utilidades puras):
- `add-frontmatter-to-docs.ts` - Agrega frontmatter a documentos
- `add-emoji-to-workspaces.ts` - Agrega emojis a workspaces
- `convert-links-to-wikilinks.ts` - Convierte enlaces a wikilinks
- `generate-detailed-report.ts` - Genera reportes detallados
- `inspect-table-schema.ts` - Inspecciona esquema de tablas
- `list-supabase-tables.ts` - Lista tablas de Supabase
- `get-full-projects-data.ts` - Obtiene datos completos de proyectos
- `transform-workspaces-emojis.ts` - Transforma emojis en workspaces
- `update-emoji-backups.ts` - Actualiza backups de archivos con emojis
- `update-backlinks.ts` - Actualiza backlinks
- `context-types.ts` - Tipos TypeScript para contexto
- `script-logging-helper.ts` - Helper para logging de scripts

### `server/` - Scripts de Servidor
Scripts relacionados con servidores y deployment:
- `config-panel-server.ts` - Servidor del panel de configuración
- `server-sync-watcher.ts` - Watcher de sincronización en servidor
- `ssh-deploy-scraper.ts` - Deploy de scraper vía SSH
- `ssh-run-scraper.ts` - Ejecuta scraper vía SSH
- `start-dashboard-server.sh` - Inicia servidor de dashboard
- `update-server-ports.sh` - Actualiza puertos del servidor
- `upload_json_to_server.sh` - Sube JSON al servidor

### `test/` - Scripts de Prueba
Scripts para probar integraciones:
- `test-drive.ts` - Prueba integración con Drive
- `test-gmail-api.ts` - Prueba API de Gmail
- `test-gmail.ts` - Prueba Gmail
- Nota: `test-calendar.ts` está en `pipelines/calendar-scraper-pipeline/`

### `setup/` - Scripts de Configuración
Scripts de setup y configuración:
- `setup-auto-sync.sh` - Setup de sincronización automática
- `setup-config-panel.sh` - Setup del panel de configuración
- `setup-server-sync.sh` - Setup de sincronización de servidor
- `setup-drive-scraper.ts` - Setup de scraper de Drive
- `setup-and-run-drive-scraper.ts` - Setup y ejecución de scraper
- `verify-calendar-setup.ts` - Verifica configuración de calendario
- `verify-drive-scraper-setup.ts` - Verifica configuración de scraper de Drive
- `verify-markdown-source-of-truth.ts` - Verifica que markdown sea fuente de verdad

### `enrich/` - Scripts de Enriquecimiento
Scripts para enriquecer documentos con IA:
- `enrich-documents-with-ai.ts` - Enriquece documentos con IA
- `enrichment-dashboard-server.ts` - Servidor del dashboard de enriquecimiento
- `process-enrichment-log.ts` - Procesa logs de enriquecimiento
- `adapters/` - Adaptadores para diferentes fuentes de documentos
  - `base-adapter.ts` - Adaptador base
  - `files-adapter.ts` - Adaptador para archivos

### `cursor/` - Scripts de Cursor
Scripts relacionados con Cursor IDE:
- `recuperar-historial-completo.sh` - Recupera historial completo
- `recuperar-historial-v2.sh` - Recupera historial v2
- `recuperar-historial.sh` - Recupera historial
- `analysis/` - Scripts de análisis de uso de Cursor
  - `analyze_cursor_usage.py` - Analiza uso de Cursor
  - `analyze_latest_cursor_usage.py` - Analiza último uso de Cursor

### `pipelines/utilities-pipeline/` - Pipeline de Utilidades
Scripts de utilidades organizados en pipeline:
- `install-supabase.ts` - Script temporal para instalar Supabase manualmente (TypeScript)

### `sync/` - Scripts de Sincronización Consolidados
Scripts consolidados para sincronización de documentos y servicios:
- Incluye funcionalidades avanzadas: logging, tracking, backlinks, wikilink-signature
- Consolidado desde `pipelines/supabase-sync-pipeline/` y `pipelines/sync-pipeline/`
- Ver `sync/README.md` para documentación completa

### `.archived/` - Scripts Archivados
Scripts y archivos temporales archivados:
- `migrate-tracking-location.ts` - Script de migración de tracking (ya completado)
- `cleanup-duplicates.py` - Script Python de limpieza (obsoleto)
- `sync-all.py`, `sync-documents.py` - Scripts Python obsoletos (migrados a TypeScript)
- Archivos `.tacitpart` - Archivos temporales de Tacit

### `analyze/` - Scripts de Análisis Específicos
Scripts de análisis que no pertenecen a pipelines estándar:
- `analyze-nosxotros-interview.ts` - Análisis específico de entrevistas
- `analyze-projects-sheet.ts` - Análisis de proyectos desde Sheets
- `consolidate-nosxotros-analysis.ts` - Consolidación de análisis
- `generate-offer-action-plan.ts` - Generación de planes de acción

### `extract/` - Scripts de Extracción Específicos
Scripts de extracción que no pertenecen a pipelines estándar:
- `extract-entre-rutas-temporada1.ts` - Extracción específica
- `extract-gslides-content.ts` - Extracción de Google Slides
- `extract-nosxotros-transcripts.ts` - Extracción específica de transcripciones
- `2025-11-06-integration-docs/` - Documentación archivada de integraciones:
  - `DEPLOYMENT-SYNC-README.md` - Sistema de sincronización y ejecución automática
  - `README-enrichment-dashboard.md` - Dashboard de análisis de enriquecimiento
  - `USAGE-LOGGING.md` - Sistema de logging interno
  - `scripts-docs/` - Documentación de scripts:
    - `PIPELINE-ORGANIZATION.md` - Guía de organización de scripts por pipelines
    - `README-TRANSCRIPT-ANALYSIS.md` - Documentación de análisis de transcripciones
    - `README-extract-transcripts.md` - Documentación de extracción de transcripciones
    - `SYNC-GOOGLE-WORKSPACE.md` - Documentación de sincronización de Google Workspace
    - `SYNC-USER-SERVICES.md` - Documentación de sincronización de servicios de usuario
    - `SETUP-CALENDAR-SCRAPING.md` - Documentación de setup de scraping de calendario
    - `setup-google-instructions.md` - Instrucciones de setup de Google
    - `CHECK-DENDRITA-SECURITY.md` - Documentación de verificación de seguridad
    - `INSTALL-DEPENDENCIES.md` - Documentación de instalación de dependencias
    - `INTEGRATING-LOGGING.md` - Documentación de integración de logging
    - `GOOGLE-MEET-CAPTIONS.md` - Documentación de captions de Google Meet

## 🔗 Dependencias entre Scripts

### Context Pipeline
- `archive-all-context-md.ts` → `update-project-context.ts`

### Transcripts Pipeline
- `integrate-transcript-analysis.ts` → `analyze-transcript.ts`
- `enrich-meeting-notes.ts` → `analyze-transcript.ts`, `integrate-transcript-analysis.ts`
- `process-meeting-transcript.ts` (meeting-notes-pipeline) → `analyze-transcript.ts`, `integrate-transcript-analysis.ts`

### Drive Scraper Pipeline
- `list-drive-folders.ts` → `find-drive-folder.ts`
- `sync-drive-folder-reference.ts` → `find-drive-folder.ts`

### Sync Pipeline
- `watch-and-sync.ts` → `sync-to-server.ts`
- `sync-all.ts` → `sync-documents.ts`, `sync-user-services.ts`

## 📝 Notas

- Los scripts están organizados por funcionalidad, no por tecnología
- Los pipelines complejos están en `pipelines/`
- Las utilidades compartidas están en `utils/` (solo utilidades puras)
- La documentación está consolidada en `docs/`
- Los scripts de análisis de Cursor están en `cursor/analysis/`
- Las carpetas `analyze/` y `extract/` fueron eliminadas y sus scripts movidos a ubicaciones apropiadas

## 🚀 Uso

Para ejecutar un script, usa `tsx` o `ts-node`:

```bash
# Ejemplo: Actualizar contexto de proyecto
tsx .dendrita/integrations/scripts/pipelines/context-pipeline/update-project-context.ts --workspace ennui --project dendrita-comunicacion

# Ejemplo: Sincronización completa
npx ts-node .dendrita/integrations/scripts/sync/sync-all.ts

# Ejemplo: Analizar transcripción
tsx .dendrita/integrations/scripts/pipelines/transcripts-pipeline/analyze/analyze-transcript.ts transcript.txt analysis.json

# Ejemplo: Sincronizar Google Workspace
tsx .dendrita/integrations/scripts/pipelines/supabase-sync-pipeline/sync-google-workspace.ts --all

# Ejemplo: Verificar configuración de calendario
tsx .dendrita/integrations/scripts/pipelines/calendar-scraper-pipeline/verify-calendar-setup.ts
```

## 📚 Documentación Adicional

- `docs/PIPELINE-ORGANIZATION.md` - Guía de organización de scripts por pipelines
- `docs/` - Documentación detallada de scripts específicos
- Cada carpeta puede tener su propio README.md con documentación específica

## 🔄 Cambios Recientes

### Migración a TypeScript y Consolidación de Pipelines (2025-11-XX)
- ✅ Migrado `sync-all.py` a TypeScript (`sync-all.ts`)
- ✅ Eliminados scripts Python (`sync-all.py`, `sync-documents.py`) - movidos a `.archived/`
- ✅ Consolidados scripts en pipelines:
  - `context-pipeline/` - Scripts de gestión de contexto
  - `calendar-scraper-pipeline/` - Scripts de calendar
  - `drive-scraper-pipeline/` - Scripts de drive
  - `google-workspace-pipeline/` - Scripts de Google Workspace (Sheets/Docs/Gmail/Auth)
  - `transcripts-pipeline/` - Scripts de transcripciones (extract/find/analyze)
  - `pm-tools-sync-pipeline/` - Pipeline de sincronización con PM tools (en desarrollo)
- ✅ Actualizados imports y referencias en todos los scripts
- ✅ Actualizada documentación y README con nuevas rutas
- ✅ Actualizados archivos de configuración (`deployment-manifest.json`, hooks, templates)

### Consolidación de Sync Scripts (2025-12-XX)
- ✅ Consolidados `pipelines/supabase-sync-pipeline/` y `pipelines/sync-pipeline/` en `sync/`
- ✅ Mantenidas funcionalidades avanzadas (logging, tracking, backlinks, wikilink-signature)
- ✅ Eliminados duplicados en raíz de scripts/
- ✅ Consolidadas carpetas `archived/` y `.archived/`
- ✅ Limpiado `setup/` eliminando duplicados
- ✅ Actualizados imports y referencias
- ✅ Creado `sync/README.md` con documentación completa
