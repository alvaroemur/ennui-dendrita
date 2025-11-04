-- Schema SQL para scraping de Google Drive en Supabase
-- Ejecutar este script en Supabase SQL Editor para crear las tablas necesarias

-- Tabla de configuración de scraping por usuario, perfil y workspace
CREATE TABLE IF NOT EXISTS drive_scraping_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  profile_id TEXT,
  workspace TEXT, -- Nombre del workspace (ej: ennui, inspiro, etc.)
  config_name TEXT NOT NULL, -- Nombre descriptivo de la configuración
  enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- Carpetas a monitorear (array de folder IDs)
  folder_ids TEXT[] NOT NULL, -- IDs de carpetas de Google Drive a monitorear
  
  -- Opciones de scraping
  include_subfolders BOOLEAN NOT NULL DEFAULT true, -- Incluir subcarpetas recursivamente
  max_results INTEGER DEFAULT 1000, -- Máximo de archivos por scraping
  page_token TEXT, -- Token de paginación para continuar desde donde se quedó
  
  -- Opciones de extracción
  extract_permissions BOOLEAN NOT NULL DEFAULT true, -- Extraer permisos y compartidos
  extract_revisions BOOLEAN NOT NULL DEFAULT false, -- Extraer historial de revisiones
  extract_content BOOLEAN NOT NULL DEFAULT false, -- Extraer contenido de archivos (solo texto)
  extract_metadata BOOLEAN NOT NULL DEFAULT true, -- Extraer todos los metadatos
  extract_thumbnail BOOLEAN NOT NULL DEFAULT false, -- Extraer miniatura si está disponible
  
  -- Filtros opcionales
  mime_type_filter TEXT[], -- Filtrar por tipos MIME (ej: ['application/pdf', 'text/plain'])
  date_min TIMESTAMPTZ, -- Solo archivos modificados después de esta fecha
  date_max TIMESTAMPTZ, -- Solo archivos modificados antes de esta fecha
  
  -- Control de sincronización
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT, -- 'success', 'error', 'partial'
  last_sync_error TEXT,
  last_sync_file_count INTEGER, -- Cantidad de archivos procesados en última sincronización
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, profile_id, workspace, config_name)
);

-- Tabla de archivos de Drive con todos los metadatos
CREATE TABLE IF NOT EXISTS drive_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  profile_id TEXT,
  workspace TEXT, -- Nombre del workspace asociado
  config_id UUID REFERENCES drive_scraping_configs(id) ON DELETE SET NULL,
  
  -- IDs de Google Drive
  google_file_id TEXT NOT NULL, -- ID del archivo en Google Drive
  google_drive_id TEXT, -- ID del Drive (si aplica)
  
  -- Información básica
  name TEXT NOT NULL, -- Nombre del archivo
  mime_type TEXT NOT NULL, -- Tipo MIME del archivo
  kind TEXT, -- Tipo de recurso (file, folder, etc.)
  
  -- Tamaño y espacio
  size_bytes BIGINT, -- Tamaño en bytes
  quota_bytes_used BIGINT, -- Bytes usados en cuota
  
  -- Fechas
  created_time TIMESTAMPTZ, -- Fecha de creación
  modified_time TIMESTAMPTZ, -- Fecha de última modificación
  viewed_by_me_time TIMESTAMPTZ, -- Última vez que el usuario lo vio
  shared_with_me_time TIMESTAMPTZ, -- Fecha en que se compartió con el usuario
  
  -- Enlaces
  web_view_link TEXT, -- Link para ver en navegador
  web_content_link TEXT, -- Link para descargar contenido
  alternate_link TEXT, -- Link alternativo
  embed_link TEXT, -- Link para embed
  
  -- Propietarios y permisos
  owners JSONB, -- Array de {displayName, emailAddress, photoLink, me}
  shared BOOLEAN NOT NULL DEFAULT false, -- Si está compartido
  permissions_summary JSONB, -- Resumen de permisos (array de {id, type, role, emailAddress})
  permission_ids TEXT[], -- IDs de permisos para referencia rápida
  
  -- Jerarquía de carpetas
  parents TEXT[], -- IDs de carpetas padre
  parent_folder_id TEXT, -- ID de carpeta padre directa (último en parents)
  folder_path TEXT, -- Ruta completa de carpetas (calculada)
  
  -- Propiedades del archivo
  starred BOOLEAN NOT NULL DEFAULT false,
  trashed BOOLEAN NOT NULL DEFAULT false,
  explicitly_trashed BOOLEAN NOT NULL DEFAULT false,
  description TEXT, -- Descripción del archivo
  original_filename TEXT, -- Nombre original (si fue subido)
  
  -- Información de contenido
  md5_checksum TEXT, -- Checksum MD5 del contenido
  head_revision_id TEXT, -- ID de la revisión actual
  has_thumbnail BOOLEAN NOT NULL DEFAULT false,
  thumbnail_link TEXT, -- Link a miniatura
  thumbnail_version TEXT, -- Versión de la miniatura
  
  -- Vista previa
  icon_link TEXT, -- Link al ícono del archivo
  has_augmented_permissions BOOLEAN,
  
  -- Información de Google Workspace
  is_app_authorized BOOLEAN, -- Si fue creado por una app
  copy_requires_writer_permission BOOLEAN,
  writers_can_share BOOLEAN,
  can_share BOOLEAN,
  can_edit BOOLEAN,
  can_comment BOOLEAN,
  can_read_revisions BOOLEAN,
  
  -- Capabilities (funcionalidades disponibles)
  capabilities JSONB, -- {canAddChildren, canChangeCopyRequiresWriterPermission, canComment, canCopy, canDelete, canDownload, canEdit, canListChildren, canModifyContent, canMoveChildrenWithinDrive, canMoveItemIntoTeamDrive, canMoveItemOutOfDrive, canMoveItemWithinDrive, canReadRevisions, canRemoveChildren, canRename, canShare, canTrash, canUntrash}
  
  -- Espacios de nombres
  spaces TEXT[], -- Array de espacios donde aparece el archivo (drive, appDataFolder)
  
  -- Team Drive / Shared Drive (si aplica)
  drive_id TEXT, -- ID del Drive compartido
  team_drive_id TEXT, -- ID del Team Drive (legacy)
  
  -- Metadatos completos de Drive API (JSON)
  full_metadata JSONB NOT NULL DEFAULT '{}'::jsonb, -- Respuesta completa de Drive API
  
  -- Contenido extraído (si extract_content = true)
  content_text TEXT, -- Contenido extraído como texto (solo para archivos de texto)
  content_extracted BOOLEAN NOT NULL DEFAULT false, -- Si se extrajo contenido
  content_extraction_error TEXT, -- Error al extraer contenido (si aplica)
  
  -- Control de sincronización
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  sync_hash TEXT NOT NULL, -- Hash de los campos para detectar cambios
  deleted_at TIMESTAMPTZ, -- Soft delete (si el archivo fue eliminado de Drive)
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, google_file_id)
);

-- Tabla de permisos individuales (relación muchos a muchos)
CREATE TABLE IF NOT EXISTS drive_file_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id UUID NOT NULL REFERENCES drive_files(id) ON DELETE CASCADE,
  google_permission_id TEXT NOT NULL, -- ID del permiso en Google Drive
  
  -- Información del permiso
  type TEXT NOT NULL, -- 'user', 'group', 'domain', 'anyone'
  role TEXT NOT NULL, -- 'owner', 'organizer', 'fileOrganizer', 'writer', 'commenter', 'reader'
  email_address TEXT, -- Email (si type = 'user' o 'group')
  domain TEXT, -- Dominio (si type = 'domain')
  
  -- Propiedades adicionales
  display_name TEXT, -- Nombre a mostrar
  photo_link TEXT, -- Link a foto de perfil
  deleted BOOLEAN NOT NULL DEFAULT false, -- Si el permiso fue eliminado
  
  -- Información adicional
  allow_file_discovery BOOLEAN, -- Si permite descubrir el archivo
  expiration_time TIMESTAMPTZ, -- Fecha de expiración (si aplica)
  
  -- Metadatos completos
  full_metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(file_id, google_permission_id)
);

-- Tabla de revisiones (si extract_revisions = true)
CREATE TABLE IF NOT EXISTS drive_file_revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id UUID NOT NULL REFERENCES drive_files(id) ON DELETE CASCADE,
  google_revision_id TEXT NOT NULL, -- ID de la revisión en Google Drive
  
  -- Información básica
  mime_type TEXT,
  size_bytes BIGINT,
  md5_checksum TEXT,
  
  -- Fechas
  created_time TIMESTAMPTZ, -- Fecha de creación de la revisión
  modified_time TIMESTAMPTZ, -- Fecha de modificación
  
  -- Propiedades
  keep_forever BOOLEAN NOT NULL DEFAULT false, -- Si se mantiene para siempre
  published BOOLEAN NOT NULL DEFAULT false, -- Si está publicado
  published_outside_domain BOOLEAN NOT NULL DEFAULT false, -- Si está publicado fuera del dominio
  publish_auto BOOLEAN NOT NULL DEFAULT false, -- Si se publica automáticamente
  
  -- Links
  export_links JSONB, -- Links de exportación por tipo MIME
  
  -- Metadatos completos
  full_metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(file_id, google_revision_id)
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_drive_scraping_configs_user_id ON drive_scraping_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_drive_scraping_configs_profile_id ON drive_scraping_configs(profile_id);
CREATE INDEX IF NOT EXISTS idx_drive_scraping_configs_workspace ON drive_scraping_configs(workspace);
CREATE INDEX IF NOT EXISTS idx_drive_scraping_configs_enabled ON drive_scraping_configs(enabled);

CREATE INDEX IF NOT EXISTS idx_drive_files_user_id ON drive_files(user_id);
CREATE INDEX IF NOT EXISTS idx_drive_files_profile_id ON drive_files(profile_id);
CREATE INDEX IF NOT EXISTS idx_drive_files_workspace ON drive_files(workspace);
CREATE INDEX IF NOT EXISTS idx_drive_files_config_id ON drive_files(config_id);
CREATE INDEX IF NOT EXISTS idx_drive_files_google_file_id ON drive_files(google_file_id);
CREATE INDEX IF NOT EXISTS idx_drive_files_parent_folder_id ON drive_files(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_drive_files_parents ON drive_files USING GIN(parents);
CREATE INDEX IF NOT EXISTS idx_drive_files_mime_type ON drive_files(mime_type);
CREATE INDEX IF NOT EXISTS idx_drive_files_modified_time ON drive_files(modified_time);
CREATE INDEX IF NOT EXISTS idx_drive_files_created_time ON drive_files(created_time);
CREATE INDEX IF NOT EXISTS idx_drive_files_name ON drive_files(name);
CREATE INDEX IF NOT EXISTS idx_drive_files_sync_hash ON drive_files(sync_hash);
CREATE INDEX IF NOT EXISTS idx_drive_files_deleted_at ON drive_files(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_drive_files_trashed ON drive_files(trashed) WHERE trashed = false;
CREATE INDEX IF NOT EXISTS idx_drive_files_shared ON drive_files(shared) WHERE shared = true;

CREATE INDEX IF NOT EXISTS idx_drive_file_permissions_file_id ON drive_file_permissions(file_id);
CREATE INDEX IF NOT EXISTS idx_drive_file_permissions_google_permission_id ON drive_file_permissions(google_permission_id);
CREATE INDEX IF NOT EXISTS idx_drive_file_permissions_type ON drive_file_permissions(type);
CREATE INDEX IF NOT EXISTS idx_drive_file_permissions_role ON drive_file_permissions(role);
CREATE INDEX IF NOT EXISTS idx_drive_file_permissions_email_address ON drive_file_permissions(email_address);

CREATE INDEX IF NOT EXISTS idx_drive_file_revisions_file_id ON drive_file_revisions(file_id);
CREATE INDEX IF NOT EXISTS idx_drive_file_revisions_google_revision_id ON drive_file_revisions(google_revision_id);
CREATE INDEX IF NOT EXISTS idx_drive_file_revisions_created_time ON drive_file_revisions(created_time);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_drive_scraping_configs_updated_at
  BEFORE UPDATE ON drive_scraping_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drive_files_updated_at
  BEFORE UPDATE ON drive_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drive_file_permissions_updated_at
  BEFORE UPDATE ON drive_file_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drive_file_revisions_updated_at
  BEFORE UPDATE ON drive_file_revisions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentación
COMMENT ON TABLE drive_scraping_configs IS 'Configuración de scraping de Google Drive por usuario, perfil y workspace';
COMMENT ON TABLE drive_files IS 'Archivos sincronizados desde Google Drive con todos los metadatos';
COMMENT ON TABLE drive_file_permissions IS 'Permisos individuales de archivos de Drive';
COMMENT ON TABLE drive_file_revisions IS 'Historial de revisiones de archivos de Drive';

