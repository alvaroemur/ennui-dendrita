# 📅 Calendar Scraper Setup

Sistema de scraping de Google Calendar configurable por perfil de usuario, idempotente y con extracción completa de metadatos.

---

## 🎯 Características

- ✅ **Configurable por perfil de usuario**: Cada usuario puede tener múltiples configuraciones por perfil
- ✅ **Extracción completa de metadatos**: Captura todos los campos disponibles de Google Calendar API
- ✅ **Soporte para eventos recurrentes**: Extrae instancias individuales de eventos recurrentes
- ✅ **Idempotente**: Detecta nuevos eventos y cambios comparando hashes
- ✅ **Asociado a perfil**: Todos los eventos se guardan asociados al perfil del usuario en Supabase

---

## 📋 Requisitos Previos

1. ✅ Google Workspace configurado (ver `.dendrita/integrations/hooks/google-auth-flow.md`)
2. ✅ Supabase configurado (ver `.dendrita/integrations/hooks/supabase-setup.md`)
3. ✅ Perfil de usuario creado en `.dendrita/users/[user-id]/`

---

## 🚀 Setup Inicial

### Paso 1: Crear Schema en Supabase

Ejecuta el script SQL en Supabase SQL Editor:

```bash
# Copiar el contenido de .dendrita/integrations/services/google/calendar-scraper-schema.sql
# y ejecutarlo en Supabase SQL Editor
```

O directamente desde el archivo:

1. Abre Supabase Dashboard
2. Ve a SQL Editor
3. Copia y pega el contenido de `.dendrita/integrations/services/google/calendar-scraper-schema.sql`
4. Ejecuta el script

Esto creará las siguientes tablas:
- `calendar_scraping_configs` - Configuración de scraping por usuario y perfil
- `calendar_events` - Eventos de calendario sincronizados
- `calendar_event_instances` - Instancias individuales de eventos recurrentes
- `calendar_event_attendees` - Asistentes a eventos

### Paso 2: Ejecutar Scraping por Primera Vez

El script inicializará automáticamente la configuración si no existe:

```bash
# Desde la raíz del proyecto
npx ts-node .dendrita/integrations/scripts/calendar-scraper.ts <user_id> [profile_id]
```

Ejemplos:

```bash
# Scraping para usuario sin perfil específico
npx ts-node .dendrita/integrations/scripts/calendar-scraper.ts [user-id]

# Scraping para usuario con perfil específico
npx ts-node .dendrita/integrations/scripts/calendar-scraper.ts [user-id] [profile-id]
```

---

## ⚙️ Configuración

### Configuración Automática

La primera vez que ejecutes el script, se creará automáticamente una configuración para cada calendario encontrado. Por defecto:
- ✅ Solo el calendario principal está habilitado
- ✅ Rango: -30 días a +365 días desde hoy
- ✅ Máximo 2500 eventos por calendario
- ✅ Eventos recurrentes expandidos (single_events: true)
- ✅ Sincronización de asistentes habilitada
- ✅ Sincronización de todos los metadatos habilitada

### Configuración Manual

Puedes modificar la configuración directamente en Supabase:

```sql
-- Ver configuraciones existentes
SELECT * FROM calendar_scraping_configs WHERE user_id = '[user-id]';

-- Actualizar configuración
UPDATE calendar_scraping_configs
SET 
  enabled = true,
  time_min_offset_days = -60,  -- 60 días hacia atrás
  time_max_offset_days = 730, -- 2 años hacia adelante
  max_results = 5000,
  single_events = true,
  sync_attendees = true
WHERE 
  user_id = '[user-id]' 
  AND calendar_id = 'primary';
```

### Parámetros de Configuración

| Parámetro | Descripción | Valor por Defecto |
|-----------|-------------|-------------------|
| `enabled` | Habilitar/deshabilitar scraping para este calendario | `true` |
| `time_min_offset_days` | Días hacia atrás desde hoy | `-30` |
| `time_max_offset_days` | Días hacia adelante desde hoy | `365` |
| `max_results` | Máximo de eventos a procesar | `2500` |
| `single_events` | Expandir eventos recurrentes en instancias individuales | `true` |
| `sync_attendees` | Sincronizar asistentes a eventos | `true` |
| `sync_metadata` | Sincronizar todos los metadatos disponibles | `true` |

---

## 📊 Uso

### Ejecutar Scraping

```bash
# Scraping para usuario específico
npx ts-node .dendrita/integrations/scripts/calendar-scraper.ts <user_id>

# Scraping para usuario con perfil específico
npx ts-node .dendrita/integrations/scripts/calendar-scraper.ts <user_id> <profile_id>
```

### Consultar Eventos en Supabase

```sql
-- Ver todos los eventos de un usuario
SELECT 
  calendar_id,
  summary,
  start_date_time,
  end_date_time,
  status,
  location,
  organizer_email
FROM calendar_events
WHERE user_id = '[user-id]'
ORDER BY start_date_time DESC
LIMIT 100;

-- Ver instancias de eventos recurrentes
SELECT 
  ei.instance_start,
  ei.instance_end,
  e.summary,
  e.description
FROM calendar_event_instances ei
JOIN calendar_events e ON ei.event_id = e.id
WHERE ei.user_id = '[user-id]'
ORDER BY ei.instance_start;

-- Ver asistentes de eventos
SELECT 
  e.summary,
  e.start_date_time,
  a.email,
  a.display_name,
  a.response_status
FROM calendar_event_attendees a
JOIN calendar_events e ON a.event_id = e.id
WHERE e.user_id = '[user-id]'
ORDER BY e.start_date_time DESC;
```

---

## 🔄 Idempotencia

El sistema es idempotente: puedes ejecutar el scraping múltiples veces sin duplicar datos.

### Cómo Funciona

1. **Hash de eventos**: Cada evento tiene un `sync_hash` calculado a partir de sus campos principales
2. **Detección de cambios**: Al sincronizar, se compara el hash del evento en Google Calendar con el hash almacenado en Supabase
3. **Actualización solo si hay cambios**: Solo se actualiza si el hash difiere
4. **Soft delete**: Los eventos eliminados se marcan con `deleted_at` en lugar de eliminarse físicamente

### Campos que se Comparan para el Hash

- `summary`
- `description`
- `location`
- `start` (dateTime/date)
- `end` (dateTime/date)
- `status`
- `recurrence`
- `updated` (timestamp de Google)
- `organizer`
- `creator`

---

## 📝 Metadatos Extraídos

El sistema extrae **todos los metadatos disponibles** de Google Calendar API, incluyendo:

### Campos Básicos
- ID, resumen, descripción, ubicación
- Fechas de inicio y fin (con timezone)
- Estado (confirmed, tentative, cancelled)
- Tipo de evento (single, recurring, exception)

### Información de Organización
- Organizador (email, displayName)
- Creador (email, displayName)
- Enlaces (htmlLink, icalUID)

### Recurrencia
- Reglas de recurrencia (RRULE)
- Fechas de excepción
- ID del evento recurrente padre

### Asistentes
- Email, nombre, estado de respuesta
- Indicadores (organizer, self, resource, optional)
- Comentarios

### Metadatos Adicionales
- Reminders (usar por defecto, overrides personalizados)
- Conferencias (hangoutLink, conferenceData)
- Visibilidad y transparencia
- Propiedades extendidas
- Adjuntos
- Color ID
- Etag y otros metadatos técnicos

Todo se almacena en el campo `full_metadata` como JSONB para acceso completo.

---

## 🔍 Eventos Recurrentes

### Instancias Individuales

Cuando `single_events` está habilitado:
- ✅ Los eventos recurrentes se expanden en instancias individuales
- ✅ Cada instancia aparece como un evento separado con `recurringEventId`
- ✅ Las instancias se guardan tanto en `calendar_events` como en `calendar_event_instances`
- ✅ Permite consultar instancias específicas por fecha

### Ejemplo de Consulta

```sql
-- Obtener todas las instancias de un evento recurrente
SELECT 
  e.summary,
  ei.instance_start,
  ei.instance_end,
  ei.status
FROM calendar_event_instances ei
JOIN calendar_events e ON ei.event_id = e.id
WHERE e.google_event_id = 'google_event_id_here'
ORDER BY ei.instance_start;
```

---

## 🛠️ Troubleshooting

### Error: "Google Calendar credentials not configured"

Verifica que las credenciales de Google Workspace estén configuradas:
- `.dendrita/.env.local` debe tener `GOOGLE_WORKSPACE_CLIENT_ID`, `GOOGLE_WORKSPACE_CLIENT_SECRET`, `GOOGLE_WORKSPACE_REFRESH_TOKEN`

### Error: "Supabase credentials not configured"

Verifica que Supabase esté configurado:
- `.dendrita/.env.local` debe tener `SUPABASE_URL` y `SUPABASE_ANON_KEY` (o `SUPABASE_SERVICE_ROLE_KEY`)

### Error: "table calendar_events does not exist"

Ejecuta el script SQL de creación de schema en Supabase (ver Paso 1 del Setup).

### No se encuentran calendarios

Verifica que:
1. La autenticación de Google Calendar funciona
2. Tienes acceso a los calendarios que quieres sincronizar
3. Ejecuta `npx ts-node -e "import { CalendarService } from './.dendrita/integrations/services/google/calendar'; const cs = new CalendarService(); cs.authenticate().then(() => cs.listCalendars().then(cals => console.log(cals)));"` para listar calendarios disponibles

### Eventos duplicados

El sistema es idempotente, pero si ves duplicados:
1. Verifica que el `UNIQUE` constraint en la tabla esté funcionando
2. Revisa los logs para ver si hay errores en el procesamiento
3. Considera limpiar datos antiguos antes de re-sincronizar

---

## 📚 Referencias

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/v3/reference)
- [Supabase Documentation](https://supabase.com/docs)
- [Service Implementation](../services/google/calendar-scraper.ts)
- [Script Executable](../scripts/calendar-scraper.ts)

---

## 🔐 Seguridad

- ✅ Las credenciales nunca se almacenan en Supabase
- ✅ Solo se almacenan metadatos de eventos (no datos sensibles de credenciales)
- ✅ Los datos están asociados al `user_id` y `profile_id` del usuario
- ✅ Soft delete para mantener historial sin exponer datos eliminados

---

**Última actualización**: 2025-01-28
**Versión**: 1.0

