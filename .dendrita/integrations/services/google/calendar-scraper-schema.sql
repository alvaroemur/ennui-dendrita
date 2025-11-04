-- Schema SQL para scraping de calendarios en Supabase
-- Ejecutar este script en Supabase SQL Editor para crear las tablas necesarias

-- Tabla de configuración de scraping por usuario
CREATE TABLE IF NOT EXISTS calendar_scraping_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  profile_id TEXT,
  calendar_id TEXT NOT NULL, -- ID del calendario en Google Calendar
  calendar_name TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  time_min_offset_days INTEGER DEFAULT -30, -- Días hacia atrás desde hoy
  time_max_offset_days INTEGER DEFAULT 365, -- Días hacia adelante desde hoy
  max_results INTEGER DEFAULT 2500, -- Máximo de eventos por calendario
  single_events BOOLEAN NOT NULL DEFAULT true, -- Expandir eventos recurrentes
  sync_attendees BOOLEAN NOT NULL DEFAULT true, -- Sincronizar asistentes
  sync_metadata BOOLEAN NOT NULL DEFAULT true, -- Sincronizar todos los metadatos
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT, -- 'success', 'error', 'partial'
  last_sync_error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, profile_id, calendar_id)
);

-- Tabla de eventos de calendario
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  profile_id TEXT,
  calendar_id TEXT NOT NULL,
  google_event_id TEXT NOT NULL, -- ID del evento en Google Calendar
  event_type TEXT NOT NULL DEFAULT 'single', -- 'single', 'recurring', 'exception'
  recurring_event_id TEXT, -- ID del evento recurrente padre (si aplica)
  
  -- Información básica
  summary TEXT,
  description TEXT,
  location TEXT,
  status TEXT, -- 'confirmed', 'tentative', 'cancelled'
  
  -- Fechas y horas
  start_date_time TIMESTAMPTZ,
  start_date DATE,
  start_time_zone TEXT,
  end_date_time TIMESTAMPTZ,
  end_date DATE,
  end_time_zone TEXT,
  all_day BOOLEAN NOT NULL DEFAULT false,
  
  -- Recurrencia
  recurrence_rules TEXT[], -- Array de reglas RRULE
  recurrence_exception_dates DATE[], -- Fechas excluidas
  
  -- Organizador y creador
  organizer_email TEXT,
  organizer_display_name TEXT,
  creator_email TEXT,
  creator_display_name TEXT,
  
  -- Enlaces
  html_link TEXT,
  ical_uid TEXT,
  
  -- Reminders
  reminders_use_default BOOLEAN,
  reminders_overrides JSONB, -- Array de {method, minutes}
  
  -- Metadatos completos (JSON)
  full_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Timestamps de Google
  google_created TIMESTAMPTZ,
  google_updated TIMESTAMPTZ,
  
  -- Control de sincronización
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  sync_hash TEXT, -- Hash de los campos para detectar cambios
  deleted_at TIMESTAMPTZ, -- Soft delete
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, calendar_id, google_event_id)
);

-- Tabla de instancias individuales de eventos recurrentes
CREATE TABLE IF NOT EXISTS calendar_event_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  profile_id TEXT,
  calendar_id TEXT NOT NULL,
  event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  google_event_id TEXT NOT NULL, -- ID del evento padre en Google Calendar
  instance_start TIMESTAMPTZ NOT NULL, -- Fecha/hora específica de esta instancia
  instance_end TIMESTAMPTZ NOT NULL,
  
  -- Información específica de la instancia (puede diferir del evento padre)
  summary TEXT,
  description TEXT,
  location TEXT,
  status TEXT,
  
  -- Metadatos completos de la instancia
  full_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Control de sincronización
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  sync_hash TEXT,
  deleted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, calendar_id, google_event_id, instance_start)
);

-- Tabla de asistentes (relación muchos a muchos)
CREATE TABLE IF NOT EXISTS calendar_event_attendees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  instance_id UUID REFERENCES calendar_event_instances(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  response_status TEXT, -- 'needsAction', 'declined', 'tentative', 'accepted'
  organizer BOOLEAN NOT NULL DEFAULT false,
  self BOOLEAN NOT NULL DEFAULT false,
  resource BOOLEAN NOT NULL DEFAULT false,
  optional BOOLEAN NOT NULL DEFAULT false,
  comment TEXT,
  additional_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(event_id, instance_id, email)
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_calendar_scraping_configs_user_id ON calendar_scraping_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_scraping_configs_profile_id ON calendar_scraping_configs(profile_id);
CREATE INDEX IF NOT EXISTS idx_calendar_scraping_configs_calendar_id ON calendar_scraping_configs(calendar_id);
CREATE INDEX IF NOT EXISTS idx_calendar_scraping_configs_enabled ON calendar_scraping_configs(enabled);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_profile_id ON calendar_events(profile_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_calendar_id ON calendar_events(calendar_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_google_event_id ON calendar_events(google_event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_recurring_event_id ON calendar_events(recurring_event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date_time ON calendar_events(start_date_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_sync_hash ON calendar_events(sync_hash);
CREATE INDEX IF NOT EXISTS idx_calendar_events_deleted_at ON calendar_events(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_calendar_event_instances_user_id ON calendar_event_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_event_instances_profile_id ON calendar_event_instances(profile_id);
CREATE INDEX IF NOT EXISTS idx_calendar_event_instances_calendar_id ON calendar_event_instances(calendar_id);
CREATE INDEX IF NOT EXISTS idx_calendar_event_instances_event_id ON calendar_event_instances(event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_event_instances_instance_start ON calendar_event_instances(instance_start);
CREATE INDEX IF NOT EXISTS idx_calendar_event_instances_sync_hash ON calendar_event_instances(sync_hash);
CREATE INDEX IF NOT EXISTS idx_calendar_event_instances_deleted_at ON calendar_event_instances(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_calendar_event_attendees_event_id ON calendar_event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_event_attendees_instance_id ON calendar_event_attendees(instance_id);
CREATE INDEX IF NOT EXISTS idx_calendar_event_attendees_email ON calendar_event_attendees(email);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_calendar_scraping_configs_updated_at
  BEFORE UPDATE ON calendar_scraping_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_event_instances_updated_at
  BEFORE UPDATE ON calendar_event_instances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_event_attendees_updated_at
  BEFORE UPDATE ON calendar_event_attendees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentación
COMMENT ON TABLE calendar_scraping_configs IS 'Configuración de scraping de calendarios por usuario y perfil';
COMMENT ON TABLE calendar_events IS 'Eventos de calendario sincronizados desde Google Calendar';
COMMENT ON TABLE calendar_event_instances IS 'Instancias individuales de eventos recurrentes';
COMMENT ON TABLE calendar_event_attendees IS 'Asistentes a eventos de calendario';

