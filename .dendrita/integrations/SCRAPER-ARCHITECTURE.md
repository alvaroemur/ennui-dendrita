# 🏗️ Arquitectura de Scrapers: Separación de Configuración y Lógica

Análisis de la separación entre configuración y lógica en los scrapers de dendrita.

---

## ✅ Separación Verificada

### 📊 Configuración (Datos)

**Ubicación:** Archivos locales JSON (paradigma de .dendrita)

#### Calendar Scraper
- **Archivo:** `.dendrita/users/[user-id]/scrapers-config.json`
- **Campos de configuración:**
  - `user_id`, `profile_id`, `calendar_id`
  - `enabled`, `time_min_offset_days`, `time_max_offset_days`
  - `max_results`, `single_events`, `sync_attendees`, `sync_metadata`
  - `last_sync_at`, `last_sync_status`, `last_sync_error`
  - `metadata` (JSONB para campos adicionales)

#### Drive Scraper
- **Archivo:** `workspaces/[workspace]/scrapers-config.json`
- **Campos de configuración:**
  - `user_id`, `profile_id`, `workspace`, `config_name`
  - `enabled`, `folder_ids[]`, `include_subfolders`
  - `max_results`, `page_token`
  - `extract_permissions`, `extract_revisions`, `extract_content`, `extract_metadata`, `extract_thumbnail`
  - `mime_type_filter[]`, `date_min`, `date_max`
  - `last_sync_at`, `last_sync_status`, `last_sync_error`, `last_sync_file_count`
  - `metadata` (JSONB para campos adicionales)

#### Gmail Scraper
- **Archivo:** `workspaces/[workspace]/scrapers-config.json`
- **Campos de configuración:**
  - `user_id`, `profile_id`, `config_name`
  - `enabled`, `search_query`
  - `max_results`, `page_token`
  - `date_min`, `date_max`
  - `extract_attachments`, `extract_labels`, `extract_threads`, `extract_full_body`, `extract_metadata`
  - `auto_label`
  - `last_sync_at`, `last_sync_status`, `last_sync_error`, `last_sync_message_count`
  - `metadata` (JSONB para campos adicionales)

**Paradigma:** Archivos locales JSON (ver `.dendrita/DESIGN-PARADIGM.md`)
**Ejemplos:** `workspaces/template/scrapers-config.json.example`, `.dendrita/users/scrapers-config.json.example`

---

### 🔧 Lógica (Código)

**Ubicación:** Servicios TypeScript

#### Calendar Scraper
- **Servicio:** `.dendrita/integrations/services/google/calendar-scraper.ts`
- **Clase:** `CalendarScraper`
- **Métodos principales:**
  - `loadConfigFromProfile()` - Carga configuración desde Supabase
  - `upsertConfig()` - Crea/actualiza configuración
  - `scrapeForUser()` - Ejecuta scraping según configuración
  - `processEvent()` - Procesa un evento individual
  - `processEventInstance()` - Procesa instancia de evento recurrente
  - `processAttendees()` - Procesa asistentes
  - `calculateEventHash()` - Calcula hash para detectar cambios

#### Drive Scraper
- **Servicio:** `.dendrita/integrations/services/google/drive-scraper.ts`
- **Clase:** `DriveScraper`
- **Métodos principales:**
  - `loadConfigFromProfile()` - Carga configuración desde Supabase
  - `upsertConfig()` - Crea/actualiza configuración
  - `scrapeForUser()` - Ejecuta scraping según configuración
  - `processFile()` - Procesa un archivo individual
  - `getFilePermissions()` - Obtiene permisos de archivo
  - `getFileRevisions()` - Obtiene revisiones de archivo
  - `getFileContent()` - Extrae contenido de archivo
  - `calculateFileHash()` - Calcula hash para detectar cambios
  - `buildFolderPath()` - Construye ruta de carpetas

#### Gmail Scraper
- **Servicio:** `.dendrita/integrations/services/google/gmail-scraper.ts`
- **Clase:** `GmailScraper`
- **Métodos principales:**
  - `loadConfigFromProfile()` - Carga configuración desde Supabase
  - `upsertConfig()` - Crea/actualiza configuración
  - `scrapeForUser()` - Ejecuta scraping según configuración
  - `processMessage()` - Procesa un mensaje individual
  - `extractAttachments()` - Extrae adjuntos
  - `createOrUpdateLabel()` - Crea/actualiza etiquetas

---

## 🔄 Flujo de Separación

### 1. Carga de Configuración
```typescript
// Lógica lee configuración desde Supabase
const configs = await scraper.loadConfigFromProfile(userId, profileId);

// Configuración es solo datos, no lógica
configs.forEach(config => {
  // Lógica usa configuración para decidir qué hacer
  if (config.enabled) {
    await scraper.scrapeForUser(userId, profileId);
  }
});
```

### 2. Ejecución de Lógica
```typescript
// Lógica lee configuración y ejecuta según parámetros
async scrapeForUser(userId: string, profileId?: string): Promise<ScrapingResult[]> {
  // 1. Cargar configuración (datos)
  const configs = await this.loadConfigFromProfile(userId, profileId);
  
  // 2. Ejecutar lógica según configuración
  for (const config of configs) {
    if (!config.enabled) continue;
    
    // Lógica de scraping usa configuración
    const events = await this.calendarService.listEvents({
      calendarId: config.calendar_id,
      timeMin: this.calculateTimeMin(config.time_min_offset_days),
      timeMax: this.calculateTimeMax(config.time_max_offset_days),
      maxResults: config.max_results,
      singleEvents: config.single_events,
    });
    
    // Procesar eventos según configuración
    for (const event of events) {
      await this.processEvent(config, event);
      if (config.sync_attendees) {
        await this.processAttendees(eventId, event.attendees);
      }
    }
  }
}
```

---

## ✅ Ventajas de la Separación

### 1. **Configuración Dinámica**
- ✅ Puedes cambiar configuración sin modificar código
- ✅ Configuración se almacena en Supabase (persistente)
- ✅ Múltiples configuraciones por usuario/perfil/workspace

### 2. **Lógica Reutilizable**
- ✅ Mismo código funciona con diferentes configuraciones
- ✅ Lógica centralizada en servicios TypeScript
- ✅ Fácil de mantener y testear

### 3. **Escalabilidad**
- ✅ Puedes agregar nuevas configuraciones sin cambiar código
- ✅ Puedes modificar lógica sin afectar configuraciones existentes
- ✅ Configuraciones pueden ser creadas/actualizadas via API

### 4. **Separación de Responsabilidades**
- ✅ **Configuración:** Define QUÉ hacer (parámetros, filtros, opciones)
- ✅ **Lógica:** Define CÓMO hacerlo (algoritmos, procesamiento, transformación)

---

## 📋 Métodos de Configuración

### Crear/Actualizar Configuración
```typescript
// Calendar Scraper
await calendarScraper.upsertConfig({
  user_id: '[user-id]',
  profile_id: '[profile-id]',
  calendar_id: 'primary',
  enabled: true,
  time_min_offset_days: -30,
  time_max_offset_days: 365,
  max_results: 2500,
  single_events: true,
  sync_attendees: true,
  sync_metadata: true,
});

// Drive Scraper
await driveScraper.upsertConfig({
  user_id: '[user-id]',
  profile_id: '[profile-id]',
  workspace: '[workspace-name]',
  config_name: '[config-name]',
  enabled: true,
  folder_ids: ['1ABC123...'],
  include_subfolders: true,
  max_results: 1000,
  extract_permissions: true,
  extract_metadata: true,
});
```

### Cargar Configuración
```typescript
// Carga configuración desde Supabase
const configs = await scraper.loadConfigFromProfile(userId, profileId);

// Configuración es solo datos estructurados
configs.forEach(config => {
  console.log(`Calendar: ${config.calendar_name}`);
  console.log(`Enabled: ${config.enabled}`);
  console.log(`Time range: ${config.time_min_offset_days} to ${config.time_max_offset_days} days`);
});
```

---

## 🎯 Interfaces TypeScript

### Calendar ScrapingConfig
```typescript
interface ScrapingConfig {
  user_id: string;
  profile_id?: string;
  calendar_id: string;
  calendar_name?: string;
  enabled?: boolean;
  time_min_offset_days?: number;
  time_max_offset_days?: number;
  max_results?: number;
  single_events?: boolean;
  sync_attendees?: boolean;
  sync_metadata?: boolean;
}
```

### Drive ScrapingConfig
```typescript
interface DriveScrapingConfig {
  user_id: string;
  profile_id?: string;
  workspace?: string;
  config_name: string;
  enabled?: boolean;
  folder_ids: string[];
  include_subfolders?: boolean;
  max_results?: number;
  page_token?: string;
  extract_permissions?: boolean;
  extract_revisions?: boolean;
  extract_content?: boolean;
  extract_metadata?: boolean;
  extract_thumbnail?: boolean;
  mime_type_filter?: string[];
  date_min?: string;
  date_max?: string;
}
```

---

## ✅ Conclusión

**La separación entre configuración y lógica está bien implementada:**

1. ✅ **Configuración en Supabase** (datos persistentes)
2. ✅ **Lógica en servicios TypeScript** (código reutilizable)
3. ✅ **Métodos de carga separados** (`loadConfigFromProfile()`)
4. ✅ **Métodos de ejecución separados** (`scrapeForUser()`, `processEvent()`, `processFile()`)
5. ✅ **Interfaces TypeScript claras** para tipado
6. ✅ **Schemas SQL documentados** para estructura de datos

**Beneficios:**
- Configuración dinámica sin cambiar código
- Lógica reutilizable con diferentes configuraciones
- Fácil mantenimiento y escalabilidad
- Separación clara de responsabilidades

---

**Última actualización:** 2025-01-28
**Versión:** 1.0

