# Calendar Scraper Pipeline

Pipeline para scraping de eventos de Google Calendar.

## Propósito

Este pipeline sincroniza eventos de Google Calendar a Supabase, permitiendo:
- Sincronización automática de eventos
- Gestión de múltiples calendarios
- Configuración flexible por usuario/perfil
- Extracción de metadatos y asistentes

## Configuración

### Archivo `config.json`

Configuración centralizada del pipeline con valores por defecto:

```json
{
  "default_settings": {
    "time_min_offset_days": -30,
    "time_max_offset_days": 90,
    "max_results": 2500,
    "single_events": true,
    "sync_attendees": true,
    "sync_metadata": true
  },
  "filters": {
    "exclude_all_day": true,
    "exclude_declined": true,
    "exclude_cancelled": true
  },
  "auto_config": {
    "auto_enable_primary": true,
    "auto_enable_work_calendars": true,
    "work_keywords": ["work", "trabajo", "office"]
  }
}
```

### Configuración del Usuario

La configuración específica del usuario se carga desde:
- `.dendrita/users/[user-id]/scrapers-config.json` - Configuración de calendarios
- `.dendrita/users/[user-id]/profile.json` - Perfil del usuario

## Uso

### Ejecutar scraping

```bash
# Scraping para un usuario
ts-node pipelines/calendar-scraper-pipeline/calendar-scraper.ts alvaro

# Scraping para un usuario con perfil específico
ts-node pipelines/calendar-scraper-pipeline/calendar-scraper.ts alvaro workspace-ennui
```

### Scripts relacionados

- `test-calendar.ts` - Prueba de conexión con Google Calendar
- `verify-calendar-setup.ts` - Verificación de configuración
- `scrape-calendar-events-sheet.ts` - Scraping desde Google Sheets

## Dependencias

- **Servicios requeridos:**
  - Google Workspace (OAuth 2.0)
  - Supabase (para almacenamiento)

- **Credenciales necesarias:**
  - `GOOGLE_WORKSPACE_CLIENT_ID`
  - `GOOGLE_WORKSPACE_CLIENT_SECRET`
  - `GOOGLE_WORKSPACE_REFRESH_TOKEN`
  - Supabase credentials (en `.env.local`)

- **Configuración previa:**
  - Verificar setup: `ts-node pipelines/calendar-scraper-pipeline/test-calendar.ts`
  - Verificar configuración: `ts-node pipelines/calendar-scraper-pipeline/verify-calendar-setup.ts`

## Estructura

```
pipelines/calendar-scraper-pipeline/
├── config.json              ← Configuración del pipeline
├── calendar-scraper.ts      ← Script principal
├── utils.ts                 ← Utilidades compartidas
├── test-calendar.ts          ← Prueba de conexión
├── verify-calendar-setup.ts  ← Verificación de setup
└── README.md                 ← Esta documentación
```

## Ejemplos

### Configuración básica

El pipeline carga automáticamente la configuración del usuario desde `scrapers-config.json`:

```json
{
  "calendar": {
    "calendars": [
      {
        "calendar_id": "primary",
        "calendar_name": "Calendario principal",
        "enabled": true
      }
    ]
  }
}
```

### Configuración avanzada

Puedes sobrescribir valores por defecto por calendario:

```json
{
  "calendar": {
    "calendars": [
      {
        "calendar_id": "work@example.com",
        "calendar_name": "Trabajo",
        "enabled": true,
        "time_min_offset_days": -60,
        "time_max_offset_days": 180
      }
    ]
  }
}
```

## Troubleshooting

### Error: "Profile not found"
- Verifica que existe `.dendrita/users/[user-id]/profile.json`
- Verifica que el `user_id` es correcto

### Error: "Google Workspace not configured"
- Configura credenciales en `.dendrita/.env.local`
- Sigue la guía: `.dendrita/integrations/hooks/google-auth-flow.md`

### Error: "No calendars found"
- Verifica que tienes acceso a Google Calendar
- Verifica que el refresh token es válido

## Referencias

- `.dendrita/docs/integrations/SCRAPER-CONFIG-DESIGN.md` - Diseño de configuración
- `.dendrita/docs/integrations/SCRAPER-ARCHITECTURE.md` - Arquitectura de scrapers
- `.dendrita/integrations/hooks/calendar-scraper-setup.md` - Setup detallado

