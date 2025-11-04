# 🚀 Setup Rápido: Calendar Scraping

Guía paso a paso para configurar el scraping de calendario por primera vez.

---

## ✅ Checklist Pre-Setup

Antes de comenzar, verifica que tienes:

- [ ] **Google Workspace configurado**
  - Verifica: `.dendrita/.env.local` tiene `GOOGLE_WORKSPACE_CLIENT_ID`, `GOOGLE_WORKSPACE_CLIENT_SECRET`, `GOOGLE_WORKSPACE_REFRESH_TOKEN`
  - Si no está: sigue `.dendrita/integrations/hooks/google-auth-flow.md`

- [ ] **Supabase configurado**
  - Verifica: `.dendrita/.env.local` tiene `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - Si no está: sigue `.dendrita/integrations/hooks/supabase-setup.md`

- [ ] **Perfil de usuario creado**
  - Verifica: `.dendrita/users/[user-id]/profile.json` existe
  - Si no existe: el sistema te pedirá crearlo

---

## 📋 Pasos de Setup

### Paso 1: Instalar Dependencias

```bash
# Desde la raíz del proyecto
npm install

# O si usas yarn
yarn install

# O si usas pnpm
pnpm install
```

Esto instalará:
- `@supabase/supabase-js` (ya agregado al `package.json`)
- `ts-node` (ya instalado)
- `typescript` (ya instalado)

### Paso 2: Crear Schema en Supabase

1. **Abre Supabase Dashboard**
   - Ve a tu proyecto en https://app.supabase.com
   - Click en "SQL Editor" en el menú lateral

2. **Copia el contenido del schema**
   ```bash
   # Abre el archivo
   cat .dendrita/integrations/services/google/calendar-scraper-schema.sql
   ```

3. **Pega y ejecuta en Supabase SQL Editor**
   - Copia todo el contenido del archivo
   - Pégalo en el SQL Editor de Supabase
   - Click en "Run" o presiona `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows/Linux)

4. **Verifica que se crearon las tablas**
   - Deberías ver 4 tablas nuevas:
     - `calendar_scraping_configs`
     - `calendar_events`
     - `calendar_event_instances`
     - `calendar_event_attendees`

### Paso 3: Ejecutar Setup Inicial

El script inicializará automáticamente la configuración para todos tus calendarios:

```bash
# Desde la raíz del proyecto
node node_modules/.bin/ts-node .dendrita/integrations/scripts/calendar-scraper.ts [user-id]
```

**O si prefieres usar npm script** (agregar al `package.json`):
```json
"scripts": {
  "calendar-scraper": "ts-node .dendrita/integrations/scripts/calendar-scraper.ts"
}
```

Luego ejecutar:
```bash
npm run calendar-scraper -- [user-id]
```

**Qué hace el script:**
1. ✅ Verifica que Google Calendar y Supabase estén configurados
2. ✅ Carga configuración desde tu perfil de usuario (`.dendrita/users/[user-id]/profile.json`)
3. ✅ Lista todos tus calendarios de Google
4. ✅ Crea configuración automática para cada calendario usando valores de tu perfil
5. ✅ Ejecuta el scraping inicial y guarda todos los eventos en Supabase

**Configuración desde perfil:**
El script lee automáticamente la configuración desde tu perfil en `integrations.calendar_scraping`. Si no existe, usa valores por defecto:
- Ventana de tiempo: -30 días (pasado) a +90 días (futuro)
- Calendarios habilitados: solo `primary`

---

## ⚙️ Configuración en Perfil de Usuario

La configuración de scraping se lee automáticamente desde tu perfil de usuario. Esto mantiene tus preferencias privadas (no expuestas en `.dendrita`).

### Configuración en `profile.json`

Agrega la configuración en `.dendrita/users/[user-id]/profile.json`:

```json
{
  "integrations": {
    "calendar_scraping": {
      "default_settings": {
        "time_min_offset_days": -30,    // Días hacia atrás
        "time_max_offset_days": 90,     // Días hacia adelante
        "max_results": 2500,
        "single_events": true,
        "sync_attendees": true,
        "sync_metadata": true
      },
      "enabled_calendars": ["primary"],
      "auto_enable_primary": true
    }
  }
}
```

**Parámetros:**
- `time_min_offset_days`: Días hacia atrás desde hoy (negativo, ej: -30)
- `time_max_offset_days`: Días hacia adelante desde hoy (positivo, ej: 90)
- `max_results`: Máximo de eventos a procesar por calendario
- `single_events`: Expandir eventos recurrentes en instancias individuales
- `sync_attendees`: Sincronizar asistentes a eventos
- `sync_metadata`: Sincronizar todos los metadatos disponibles
- `enabled_calendars`: IDs de calendarios habilitados (ej: `["primary", "otro-cal-id"]`)
- `auto_enable_primary`: Habilitar automáticamente el calendario principal si no está en `enabled_calendars`

### Configuración por Perfil Específico

Si quieres configurar scraping para un perfil específico:

```bash
# Ejemplo: scraping para perfil de workspace ennui
node node_modules/.bin/ts-node .dendrita/integrations/scripts/calendar-scraper.ts [user-id] [profile-id]
```

Esto creará configuraciones separadas asociadas a ese perfil.

---

## ⚙️ Configuración Personalizada

Después del setup inicial, puedes modificar la configuración en Supabase:

```sql
-- Ver todas tus configuraciones
SELECT * FROM calendar_scraping_configs WHERE user_id = '[user-id]';

-- Habilitar otro calendario
UPDATE calendar_scraping_configs
SET enabled = true
WHERE user_id = '[user-id]' AND calendar_id = 'otro-calendario-id';

-- Cambiar rango de fechas (ej: últimos 60 días y próximos 2 años)
UPDATE calendar_scraping_configs
SET 
  time_min_offset_days = -60,
  time_max_offset_days = 730
WHERE user_id = '[user-id]' AND calendar_id = 'primary';
```

---

## 🔄 Ejecutar Scraping Regular

Una vez configurado, ejecuta el scraping cuando quieras sincronizar:

```bash
node node_modules/.bin/ts-node .dendrita/integrations/scripts/calendar-scraper.ts [user-id]
```

El sistema es idempotente: puedes ejecutarlo múltiples veces sin duplicar datos.

---

## 🐛 Troubleshooting

### Error: "Cannot find module '@supabase/supabase-js'"
**Solución:** Ejecuta `npm install` para instalar las dependencias.

### Error: "Google Calendar credentials not configured"
**Solución:** Verifica que `.dendrita/.env.local` tenga las credenciales de Google Workspace.

### Error: "Supabase credentials not configured"
**Solución:** Verifica que `.dendrita/.env.local` tenga las credenciales de Supabase.

### Error: "table calendar_scraping_configs does not exist"
**Solución:** Ejecuta el schema SQL en Supabase (Paso 2).

### Error: "Profile not found"
**Solución:** Verifica que `.dendrita/users/[user-id]/profile.json` existe.

---

## 📚 Referencias

- **Documentación completa:** `.dendrita/integrations/hooks/calendar-scraper-setup.md`
- **Schema SQL:** `.dendrita/integrations/services/google/calendar-scraper-schema.sql`
- **Script ejecutable:** `.dendrita/integrations/scripts/calendar-scraper.ts`
- **Servicio:** `.dendrita/integrations/services/google/calendar-scraper.ts`

---

**Última actualización:** 2025-01-28
**Estado:** ✅ Listo para configurar

