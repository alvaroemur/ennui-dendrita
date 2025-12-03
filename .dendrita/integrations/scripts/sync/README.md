# Sync Scripts

Scripts consolidados para sincronización de documentos y servicios entre sistemas.

## Propósito

Este directorio contiene todos los scripts de sincronización consolidados desde:
- `pipelines/supabase-sync-pipeline/` (consolidado)
- `pipelines/sync-pipeline/` (consolidado)
- Versiones avanzadas con funcionalidades adicionales (logging, tracking, backlinks)

## Funcionalidades Avanzadas

Los scripts en este directorio incluyen funcionalidades avanzadas:

- **`dendritaLogger`** - Sistema de logging interno para tracking de ejecuciones
- **`wikilink-signature`** - Firmas para wikilinks en documentos sincronizados
- **`file-tracking`** - Tracking de modificaciones de archivos
- **`backlinks`** - Actualización automática de backlinks

## Scripts Disponibles

### Sincronización Completa
- **`sync-all.ts`** - Sincronización completa (workspaces, projects, documents, stakeholders, user services)

### Sincronización de Documentos
- **`sync-documents.ts`** - Sincroniza documentos a Supabase (con `dendritaLogger`)

### Sincronización de Servicios
- **`sync-user-services.ts`** - Sincroniza servicios de usuario (con `dendritaLogger`)

### Sincronización de Google Workspace
- **`sync-google-workspace.ts`** - Sincronización general de Google Workspace (con tracking, backlinks, wikilink-signature)
- **`sync-experience-from-sheets.ts`** - Sincroniza experiencia desde Sheets (con tracking, backlinks)

### Sincronización de Drive
- **`sync-drive-folder-reference.ts`** - Sincroniza referencias de carpetas
- **`sync-to-drive.ts`** - Sincroniza archivos a Drive

### Sincronización de Servidor
- **`sync-to-server.ts`** - Sincroniza archivos al servidor

### Monitoreo
- **`watch-and-sync.ts`** - Monitorea cambios y sincroniza automáticamente

## Configuración

### Archivo `config.json`

Configuración centralizada del pipeline con valores por defecto.

## Uso

```bash
# Sincronización completa
ts-node .dendrita/integrations/scripts/sync/sync-all.ts

# Sincronizar documentos
ts-node .dendrita/integrations/scripts/sync/sync-documents.ts

# Sincronizar servicios de usuario
ts-node .dendrita/integrations/scripts/sync/sync-user-services.ts

# Sincronizar Google Workspace
ts-node .dendrita/integrations/scripts/sync/sync-google-workspace.ts

# Monitorear y sincronizar automáticamente
ts-node .dendrita/integrations/scripts/sync/watch-and-sync.ts
```

## Estructura

```
sync/
├── README.md                    ← Esta documentación
├── config.json                  ← Configuración del pipeline
├── utils.ts                     ← Utilidades compartidas
├── sync-all.ts                  ← Sincronización completa
├── sync-documents.ts            ← Con dendritaLogger
├── sync-user-services.ts        ← Con dendritaLogger
├── sync-google-workspace.ts     ← Con tracking, backlinks, wikilink-signature
├── sync-experience-from-sheets.ts ← Con tracking, backlinks
├── sync-drive-folder-reference.ts
├── sync-to-drive.ts
├── sync-to-server.ts
└── watch-and-sync.ts
```

## Referencias

- `.dendrita/integrations/config/sync-config.json` - Configuración de sincronizaciones
- `.dendrita/integrations/hooks/supabase-sync.md` - Setup detallado de sincronización con Supabase
- `.dendrita/integrations/hooks/project-management-sync.md` - Setup detallado de sincronización con PM tools

## Notas

- Los scripts con `dendritaLogger` registran automáticamente las ejecuciones
- Los scripts con `file-tracking` registran las modificaciones de archivos
- Los scripts con `backlinks` actualizan automáticamente los backlinks en documentos
- Los scripts con `wikilink-signature` agregan firmas a los documentos sincronizados

