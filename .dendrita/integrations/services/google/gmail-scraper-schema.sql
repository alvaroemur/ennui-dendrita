-- Schema SQL para scraping de Gmail en Supabase
-- Ejecutar este script en Supabase SQL Editor para crear las tablas necesarias

-- Tabla de configuración de scraping por usuario y perfil
CREATE TABLE IF NOT EXISTS gmail_scraping_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  profile_id TEXT,
  config_name TEXT NOT NULL, -- Nombre descriptivo de la configuración
  enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- Query de búsqueda de Gmail
  search_query TEXT NOT NULL, -- Query de búsqueda de Gmail (ej: "from:cliente@example.com after:2024-01-01")
  
  -- Filtros y límites
  max_results INTEGER DEFAULT 500, -- Máximo de emails por scraping
  page_token TEXT, -- Token de paginación para continuar desde donde se quedó
  
  -- Rango de fechas (opcional, si no está en search_query)
  date_min TIMESTAMPTZ, -- Fecha mínima (opcional)
  date_max TIMESTAMPTZ, -- Fecha máxima (opcional)
  
  -- Opciones de extracción
  extract_attachments BOOLEAN NOT NULL DEFAULT false, -- Extraer información de adjuntos
  extract_labels BOOLEAN NOT NULL DEFAULT true, -- Extraer etiquetas
  extract_threads BOOLEAN NOT NULL DEFAULT true, -- Extraer información de hilos
  extract_full_body BOOLEAN NOT NULL DEFAULT true, -- Extraer cuerpo completo
  extract_metadata BOOLEAN NOT NULL DEFAULT true, -- Extraer todos los metadatos
  
  -- Control de sincronización
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT, -- 'success', 'error', 'partial'
  last_sync_error TEXT,
  last_sync_message_count INTEGER, -- Cantidad de mensajes procesados en última sincronización
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, profile_id, config_name)
);

-- Tabla de emails con todos los metadatos
CREATE TABLE IF NOT EXISTS gmail_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  profile_id TEXT,
  config_id UUID REFERENCES gmail_scraping_configs(id) ON DELETE SET NULL,
  
  -- IDs de Gmail
  gmail_message_id TEXT NOT NULL, -- ID del mensaje en Gmail
  gmail_thread_id TEXT NOT NULL, -- ID del hilo en Gmail
  
  -- Información básica
  subject TEXT,
  snippet TEXT, -- Vista previa del mensaje
  
  -- Remitentes y destinatarios
  from_email TEXT,
  from_name TEXT,
  to_emails TEXT[], -- Array de emails destinatarios
  to_names TEXT[], -- Array de nombres destinatarios
  cc_emails TEXT[],
  cc_names TEXT[],
  bcc_emails TEXT[],
  bcc_names TEXT[],
  reply_to TEXT,
  
  -- Fechas
  date_sent TIMESTAMPTZ, -- Fecha de envío
  date_received TIMESTAMPTZ, -- Fecha de recepción (internalDate de Gmail)
  
  -- Contenido
  body_text TEXT, -- Cuerpo del mensaje en texto plano
  body_html TEXT, -- Cuerpo del mensaje en HTML
  body_html_sanitized TEXT, -- HTML sanitizado (sin scripts)
  
  -- Etiquetas
  labels TEXT[], -- Array de etiquetas de Gmail
  is_starred BOOLEAN NOT NULL DEFAULT false,
  is_important BOOLEAN NOT NULL DEFAULT false,
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_sent BOOLEAN NOT NULL DEFAULT false,
  is_draft BOOLEAN NOT NULL DEFAULT false,
  is_trash BOOLEAN NOT NULL DEFAULT false,
  is_spam BOOLEAN NOT NULL DEFAULT false,
  
  -- Información del hilo
  thread_size INTEGER, -- Cantidad de mensajes en el hilo
  thread_history_id TEXT, -- History ID del hilo
  
  -- Adjuntos
  has_attachments BOOLEAN NOT NULL DEFAULT false,
  attachment_count INTEGER DEFAULT 0,
  attachment_info JSONB DEFAULT '[]'::jsonb, -- Array de {filename, mimeType, size, attachmentId}
  
  -- Headers personalizados
  custom_headers JSONB DEFAULT '{}'::jsonb, -- Headers adicionales (X-*)
  
  -- Metadatos completos de Gmail (JSON)
  full_metadata JSONB NOT NULL DEFAULT '{}'::jsonb, -- Respuesta completa de Gmail API
  
  -- Timestamps de Gmail
  gmail_history_id TEXT, -- History ID del mensaje
  gmail_size_estimate INTEGER, -- Tamaño estimado del mensaje
  
  -- Control de sincronización
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  sync_hash TEXT, -- Hash de los campos para detectar cambios
  deleted_at TIMESTAMPTZ, -- Soft delete
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, gmail_message_id)
);

-- Tabla de hilos de conversación
CREATE TABLE IF NOT EXISTS gmail_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  profile_id TEXT,
  gmail_thread_id TEXT NOT NULL, -- ID del hilo en Gmail
  
  -- Información del hilo
  subject TEXT, -- Asunto del hilo (del primer mensaje)
  participants TEXT[], -- Array de emails participantes
  participant_names TEXT[], -- Array de nombres participantes
  
  -- Estadísticas del hilo
  message_count INTEGER DEFAULT 0, -- Cantidad de mensajes en el hilo
  unread_count INTEGER DEFAULT 0, -- Cantidad de mensajes no leídos
  last_message_date TIMESTAMPTZ, -- Fecha del último mensaje
  first_message_date TIMESTAMPTZ, -- Fecha del primer mensaje
  
  -- Etiquetas del hilo
  labels TEXT[],
  
  -- Metadatos completos
  full_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Control de sincronización
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  sync_hash TEXT,
  deleted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, gmail_thread_id)
);

-- Tabla de adjuntos (para tracking)
CREATE TABLE IF NOT EXISTS gmail_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_id UUID NOT NULL REFERENCES gmail_emails(id) ON DELETE CASCADE,
  gmail_attachment_id TEXT NOT NULL, -- ID del adjunto en Gmail
  
  filename TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER,
  
  -- Control de descarga
  downloaded BOOLEAN NOT NULL DEFAULT false,
  download_path TEXT, -- Ruta donde se guardó (si se descargó)
  download_date TIMESTAMPTZ,
  
  -- Metadatos adicionales
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(email_id, gmail_attachment_id)
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_gmail_scraping_configs_user_id ON gmail_scraping_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_gmail_scraping_configs_profile_id ON gmail_scraping_configs(profile_id);
CREATE INDEX IF NOT EXISTS idx_gmail_scraping_configs_enabled ON gmail_scraping_configs(enabled);
CREATE INDEX IF NOT EXISTS idx_gmail_scraping_configs_config_id ON gmail_scraping_configs(id);

CREATE INDEX IF NOT EXISTS idx_gmail_emails_user_id ON gmail_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_gmail_emails_profile_id ON gmail_emails(profile_id);
CREATE INDEX IF NOT EXISTS idx_gmail_emails_config_id ON gmail_emails(config_id);
CREATE INDEX IF NOT EXISTS idx_gmail_emails_gmail_message_id ON gmail_emails(gmail_message_id);
CREATE INDEX IF NOT EXISTS idx_gmail_emails_gmail_thread_id ON gmail_emails(gmail_thread_id);
CREATE INDEX IF NOT EXISTS idx_gmail_emails_date_received ON gmail_emails(date_received);
CREATE INDEX IF NOT EXISTS idx_gmail_emails_date_sent ON gmail_emails(date_sent);
CREATE INDEX IF NOT EXISTS idx_gmail_emails_from_email ON gmail_emails(from_email);
CREATE INDEX IF NOT EXISTS idx_gmail_emails_labels ON gmail_emails USING GIN(labels);
CREATE INDEX IF NOT EXISTS idx_gmail_emails_sync_hash ON gmail_emails(sync_hash);
CREATE INDEX IF NOT EXISTS idx_gmail_emails_deleted_at ON gmail_emails(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_gmail_emails_subject ON gmail_emails(subject);
CREATE INDEX IF NOT EXISTS idx_gmail_emails_is_read ON gmail_emails(is_read);
CREATE INDEX IF NOT EXISTS idx_gmail_emails_is_important ON gmail_emails(is_important);

CREATE INDEX IF NOT EXISTS idx_gmail_threads_user_id ON gmail_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_gmail_threads_profile_id ON gmail_threads(profile_id);
CREATE INDEX IF NOT EXISTS idx_gmail_threads_gmail_thread_id ON gmail_threads(gmail_thread_id);
CREATE INDEX IF NOT EXISTS idx_gmail_threads_last_message_date ON gmail_threads(last_message_date);
CREATE INDEX IF NOT EXISTS idx_gmail_threads_participants ON gmail_threads USING GIN(participants);
CREATE INDEX IF NOT EXISTS idx_gmail_threads_sync_hash ON gmail_threads(sync_hash);
CREATE INDEX IF NOT EXISTS idx_gmail_threads_deleted_at ON gmail_threads(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_gmail_attachments_email_id ON gmail_attachments(email_id);
CREATE INDEX IF NOT EXISTS idx_gmail_attachments_gmail_attachment_id ON gmail_attachments(gmail_attachment_id);
CREATE INDEX IF NOT EXISTS idx_gmail_attachments_downloaded ON gmail_attachments(downloaded);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_gmail_scraping_configs_updated_at
  BEFORE UPDATE ON gmail_scraping_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gmail_emails_updated_at
  BEFORE UPDATE ON gmail_emails
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gmail_threads_updated_at
  BEFORE UPDATE ON gmail_threads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gmail_attachments_updated_at
  BEFORE UPDATE ON gmail_attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentación
COMMENT ON TABLE gmail_scraping_configs IS 'Configuración de scraping de Gmail por usuario y perfil';
COMMENT ON TABLE gmail_emails IS 'Emails sincronizados desde Gmail con todos los metadatos';
COMMENT ON TABLE gmail_threads IS 'Hilos de conversación de Gmail';
COMMENT ON TABLE gmail_attachments IS 'Adjuntos de emails de Gmail';

