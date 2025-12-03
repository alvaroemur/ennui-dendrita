---
name: drive-scraper-setup
description: "Configuración de Drive Scraper"
type: documentation
created:
  2025-11-06T00:00:00.000Z
  
updated:
  2025-11-06T00:00:00.000Z
  
tags: ["documentation", "integration"]
category: integration
---

# 📁 Configuración de Drive Scraper

Guía para configurar el scraping de Google Drive por workspace.

---

## 🎯 Objetivo

El Drive Scraper permite:
- ✅ Monitorear carpetas específicas de Google Drive por workspace
- ✅ Extraer todos los metadatos posibles de archivos
- ✅ Detectar nuevos documentos y cambios en existentes (idempotente)
- ✅ Sincronizar información a Supabase
- ✅ Configurar carpetas monitoreadas específicas por workspace

---

## 📋 Requisitos Previos

1. **Google Workspace OAuth configurado**
   - Ver: [google-auth-flow.md](./google-auth-flow.md)
   - Credenciales en `.dendrita/.env.local`:
     ```
     GOOGLE_WORKSPACE_CLIENT_ID=...
     GOOGLE_WORKSPACE_CLIENT_SECRET=...
     GOOGLE_WORKSPACE_REFRESH_TOKEN=...
     ```

2. **Supabase configurado**
   - Ver: [supabase-setup.md](./supabase-setup.md)
   - Credenciales en `.dendrita/.env.local`:
     ```
     SUPABASE_URL=...
     SUPABASE_ANON_KEY=...
     SUPABASE_SERVICE_ROLE_KEY=... (opcional pero recomendado)
     ```

3. **Schema de base de datos creado**
   - Ejecutar: `.dendrita/integrations/services/google/drive-scraper-schema.sql`
   - En Supabase SQL Editor

---

## 🔧 Configuración Paso a Paso

### 1. Crear Schema en Supabase

Ejecutar el script SQL en Supabase SQL Editor:

```bash
# Ver el schema
cat .dendrita/integrations/services/google/drive-scraper-schema.sql
```

Copiar y pegar en Supabase SQL Editor, luego ejecutar.

### 2. Obtener IDs de Carpetas de Drive

Para encontrar el ID de una carpeta en Google Drive:

1. Abrir Google Drive en navegador
2. Abrir la carpeta que quieres monitorear
3. Copiar el ID de la URL:
   ```
   https://drive.google.com/drive/folders/[FOLDER_ID]
   ```

O usar el script helper:

```bash
# Listar carpetas disponibles
npx ts-node .dendrita/integrations/scripts/list-drive-folders.ts
```

### 3. Crear Configuración de Scraping

**Opción A: Usar script interactivo (recomendado)**

```bash
npx ts-node .dendrita/integrations/scripts/setup-drive-scraper.ts
```

El script te guiará paso a paso para:
- Seleccionar workspace
- Elegir nombre de configuración
- Buscar y seleccionar carpetas de Drive
- Configurar opciones de extracción

**Opción B: Crear configuración manualmente**

Crear una configuración en Supabase para cada workspace:

```typescript
import { DriveScraper } from '.dendrita/integrations/services/google/drive-scraper';

const scraper = new DriveScraper();
await scraper.initialize();

// Crear configuración para un workspace
await scraper.upsertConfig({
  user_id: 'user-id', // Tu user_id
  profile_id: 'workspace-profile', // Opcional
  workspace: 'example-workspace', // Nombre del workspace
  config_name: 'workspace-projects', // Nombre descriptivo
  enabled: true,
  folder_ids: [
    '1ABC123...', // ID de carpeta 1
    '1XYZ789...', // ID de carpeta 2
  ],
  include_subfolders: true, // Incluir subcarpetas recursivamente
  max_results: 1000, // Máximo de archivos por scraping
  extract_permissions: true, // Extraer permisos
  extract_revisions: false, // Extraer historial de revisiones
  extract_content: false, // Extraer contenido de archivos (solo texto)
  extract_metadata: true, // Extraer todos los metadatos
  extract_thumbnail: false, // Extraer miniatura
  mime_type_filter: [], // Filtrar por tipos MIME (vacío = todos)
  date_min: undefined, // Solo archivos modificados después de esta fecha
  date_max: undefined, // Solo archivos modificados antes de esta fecha
});
```

### 4. Ejecutar Scraping

```typescript
import { DriveScraper } from '.dendrita/integrations/services/google/drive-scraper';

const scraper = new DriveScraper();
await scraper.initialize();

// Scraping para un usuario específico
const results = await scraper.scrapeForUser(
  'user-id', // user_id
  'workspace-profile', // profile_id (opcional)
  'example-workspace' // workspace (opcional)
);

console.log('Results:', results);
```

---

## 📊 Estructura de Configuración

### Campos de Configuración

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `user_id` | string | ID del usuario (requerido) |
| `profile_id` | string? | ID del perfil (opcional) |
| `workspace` | string? | Nombre del workspace (opcional) |
| `config_name` | string | Nombre descriptivo de la configuración (requerido) |
| `enabled` | boolean | Si está habilitado (default: true) |
| `folder_ids` | string[] | IDs de carpetas a monitorear (requerido) |
| `include_subfolders` | boolean | Incluir subcarpetas recursivamente (default: true) |
| `max_results` | number | Máximo de archivos por scraping (default: 1000) |
| `extract_permissions` | boolean | Extraer permisos (default: true) |
| `extract_revisions` | boolean | Extraer historial de revisiones (default: false) |
| `extract_content` | boolean | Extraer contenido de archivos (default: false) |
| `extract_metadata` | boolean | Extraer todos los metadatos (default: true) |
| `extract_thumbnail` | boolean | Extraer miniatura (default: false) |
| `mime_type_filter` | string[]? | Filtrar por tipos MIME (opcional) |
| `date_min` | string? | Solo archivos modificados después de esta fecha |
| `date_max` | string? | Solo archivos modificados antes de esta fecha |

### Ejemplo de Configuración por Workspace

```typescript
// Configuración para workspace 'example-workspace'
await scraper.upsertConfig({
  user_id: 'user-id',
  workspace: 'example-workspace',
  config_name: 'workspace-active-projects',
  enabled: true,
  folder_ids: ['1ABC123...'], // Carpeta de active-projects en Drive
  include_subfolders: true,
  extract_permissions: true,
  extract_metadata: true,
});

// Configuración para otro workspace
await scraper.upsertConfig({
  user_id: 'user-id',
  workspace: 'another-workspace',
  config_name: 'workspace-documents',
  enabled: true,
  folder_ids: ['1XYZ789...'], // Carpeta de documentos en Drive
  include_subfolders: true,
  extract_permissions: true,
  extract_metadata: true,
});
```

---

## 🔍 Metadatos Extraídos

El scraper extrae todos los metadatos disponibles de Drive API:

### Información Básica
- Nombre, tipo MIME, tamaño
- Fechas (creación, modificación, visualización)
- Enlaces (webViewLink, webContentLink, etc.)

### Propietarios y Permisos
- Propietarios (owners)
- Permisos individuales (permissions)
- Información de compartido

### Jerarquía de Carpetas
- Carpetas padre (parents)
- Ruta completa de carpetas (folder_path)

### Propiedades del Archivo
- Starred, trashed, description
- Checksum MD5, revision ID
- Thumbnail, icon

### Capacidades
- canShare, canEdit, canComment, etc.

### Información de Google Workspace
- Drive ID, Team Drive ID
- Capabilities (funcionalidades disponibles)
- Spaces (drive, appDataFolder)

### Contenido (opcional)
- Contenido de texto para archivos de texto
- Exportación para Google Docs/Sheets

---

## 🔄 Idempotencia

El scraper es **idempotente**:

- ✅ **Detecta nuevos archivos**: Usa `google_file_id` único
- ✅ **Detecta cambios**: Usa `sync_hash` para comparar metadatos
- ✅ **No duplica**: Solo crea o actualiza si hay cambios
- ✅ **Soft delete**: Marca como eliminado si el archivo desaparece de Drive

### Cálculo de Hash

El `sync_hash` se calcula usando:
- Nombre del archivo
- Tipo MIME
- Tamaño
- Fecha de modificación
- Checksum MD5
- Parents (carpetas padre)
- Shared status
- Trashed status
- Descripción
- Permisos (resumen)

---

## 📈 Monitoreo y Estado

### Estado de Sincronización

Cada configuración tiene:
- `last_sync_at`: Última sincronización
- `last_sync_status`: 'success', 'error', 'partial'
- `last_sync_error`: Mensaje de error (si aplica)
- `last_sync_file_count`: Cantidad de archivos procesados

### Resultado de Scraping

```typescript
interface DriveScrapingResult {
  config: DriveScrapingConfig;
  files_processed: number;
  files_created: number;
  files_updated: number;
  folders_created: number;
  folders_updated: number;
  permissions_created: number;
  permissions_updated: number;
  revisions_created: number;
  revisions_updated: number;
  errors: string[];
  duration_ms: number;
}
```

---

## 🚀 Automatización

### Ejecutar en Cron

```bash
# Script de scraping automático
npx ts-node .dendrita/integrations/scripts/drive-scraper.ts
```

Agregar a crontab:

```bash
# Scraping cada hora
0 * * * * cd /path/to/ennui-dendrita && npx ts-node .dendrita/integrations/scripts/drive-scraper.ts
```

---

## 🔍 Consultas Útiles en Supabase

### Archivos por Workspace

```sql
SELECT * FROM drive_files
WHERE workspace = 'example-workspace'
ORDER BY modified_time DESC;
```

### Archivos Nuevos desde Última Sincronización

```sql
SELECT * FROM drive_files
WHERE workspace = 'ennui'
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

### Archivos Modificados Recientemente

```sql
SELECT * FROM drive_files
WHERE workspace = 'ennui'
  AND modified_time > NOW() - INTERVAL '24 hours'
ORDER BY modified_time DESC;
```

### Archivos Compartidos

```sql
SELECT * FROM drive_files
WHERE workspace = 'ennui'
  AND shared = true
ORDER BY modified_time DESC;
```

### Permisos de un Archivo

```sql
SELECT p.*
FROM drive_file_permissions p
JOIN drive_files f ON p.file_id = f.id
WHERE f.google_file_id = '1ABC123...';
```

---

## ⚠️ Limitaciones y Consideraciones

### Límites de Drive API

- **Rate Limits**: 1000 requests/100 segundos por usuario
- **Page Size**: Máximo 1000 archivos por página
- **Quota**: 1,000,000,000 requests/día

### Extracción de Contenido

- Solo para archivos de texto (text/plain, text/html, etc.)
- Google Docs/Sheets se exportan como texto
- Archivos binarios no se extraen

### Rendimiento

- Scraping recursivo puede ser lento para carpetas grandes
- Considera usar `max_results` para limitar
- Usa `date_min` para solo archivos recientes

---

## 🆘 Troubleshooting

### Error: "Google Drive credentials not configured"

**Solución**: Verificar que las credenciales están en `.dendrita/.env.local`:
```
GOOGLE_WORKSPACE_CLIENT_ID=...
GOOGLE_WORKSPACE_CLIENT_SECRET=...
GOOGLE_WORKSPACE_REFRESH_TOKEN=...
```

### Error: "Supabase credentials not configured"

**Solución**: Verificar que las credenciales están en `.dendrita/.env.local`:
```
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

### Error: "No scraping config found"

**Solución**: Crear configuración usando `upsertConfig()` antes de ejecutar scraping.

### Archivos no se actualizan

**Solución**: Verificar que `sync_hash` se calcula correctamente. El hash incluye metadatos relevantes.

---

## 📚 Referencias

- [Drive API Documentation](https://developers.google.com/drive/api/v3/about-sdk)
- [Drive API Files](https://developers.google.com/drive/api/v3/reference/files)
- [Drive API Permissions](https://developers.google.com/drive/api/v3/reference/permissions)
- [Drive API Revisions](https://developers.google.com/drive/api/v3/reference/revisions)

---

**Última actualización**: 2024
**Versión**: 1.0

