---
name: axon-modifications
description: "Recomendaciones para Modificaciones de Axon"
type: documentation
created:
  2025-11-06T00:00:00.000Z
  
updated:
  2025-11-06T00:00:00.000Z
  
tags: ["documentation", "integration"]
category: integration
---

# Recomendaciones para Modificaciones de Axon

Este documento propone mejoras y modificaciones a Axon (Chrome extension de scraping de WhatsApp) para mejorar la integración con ennui-dendrita y asegurar una estructura de datos consistente y escalable.

## Contexto

- **Axon**: Chrome extension que hace scraping de WhatsApp por `contacto@axon`
- **ennui-dendrita**: Sistema de gestión que comparte la misma base de datos Supabase
- **Necesidad**: Estructura de datos consistente y accesible desde ambos sistemas

## Recomendaciones de Estructura de Datos

### 1. Convenciones de Nombres

**Problema actual**: Los nombres de tablas pueden variar y no ser consistentes.

**Recomendación**: Usar una convención clara y consistente.

**Opción A - Prefijo `axon_`**:
```sql
- axon_contacts
- axon_messages
- axon_conversations
- axon_media (si aplica)
```

**Opción B - Prefijo `whatsapp_`**:
```sql
- whatsapp_contacts
- whatsapp_messages
- whatsapp_conversations
- whatsapp_media (si aplica)
```

**Opción C - Sin prefijo (si es la única fuente de WhatsApp)**:
```sql
- contacts
- messages
- conversations
- media (si aplica)
```

**Recomendación final**: **Opción A (`axon_`)** porque:
- Clarifica que los datos vienen de Axon
- Permite coexistir con otros sistemas de mensajería
- Es más fácil identificar el origen de los datos

### 2. Estructura de Tabla de Contactos

**Tabla recomendada**: `axon_contacts`

```sql
CREATE TABLE IF NOT EXISTS axon_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Información básica
  name TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  whatsapp_id TEXT UNIQUE NOT NULL,
  
  -- Metadatos de WhatsApp
  profile_picture_url TEXT,
  is_business BOOLEAN DEFAULT false,
  business_name TEXT,
  
  -- Relaciones y contexto
  workspace TEXT, -- Para integración con dendrita
  user_id TEXT, -- Usuario que capturó el contacto
  
  -- Control de sincronización
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  
  -- Metadatos adicionales
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[], -- Para categorización
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Índices
  CONSTRAINT unique_whatsapp_id UNIQUE (whatsapp_id)
);

CREATE INDEX idx_axon_contacts_phone ON axon_contacts(phone);
CREATE INDEX idx_axon_contacts_whatsapp_id ON axon_contacts(whatsapp_id);
CREATE INDEX idx_axon_contacts_workspace ON axon_contacts(workspace);
CREATE INDEX idx_axon_contacts_user_id ON axon_contacts(user_id);
```

**Mejoras propuestas**:
- ✅ Campo `workspace` para integración con dendrita
- ✅ Campo `user_id` para multi-usuario
- ✅ Campos de metadatos de WhatsApp (`profile_picture_url`, `is_business`)
- ✅ Campo `tags` para categorización
- ✅ Índices para búsquedas rápidas

### 3. Estructura de Tabla de Mensajes

**Tabla recomendada**: `axon_messages`

```sql
CREATE TABLE IF NOT EXISTS axon_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relaciones
  contact_id UUID REFERENCES axon_contacts(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES axon_conversations(id) ON DELETE SET NULL,
  
  -- Información del mensaje
  whatsapp_message_id TEXT UNIQUE, -- ID original de WhatsApp
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  is_from_me BOOLEAN NOT NULL DEFAULT false,
  
  -- Contenido
  message_text TEXT,
  message_type TEXT NOT NULL DEFAULT 'text', -- text, image, audio, video, document, etc.
  
  -- Media (si aplica)
  media_url TEXT,
  media_mime_type TEXT,
  media_size_bytes BIGINT,
  media_caption TEXT,
  
  -- Metadatos del mensaje
  timestamp TIMESTAMPTZ NOT NULL,
  is_forwarded BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  
  -- Contexto
  workspace TEXT, -- Para integración con dendrita
  user_id TEXT, -- Usuario que capturó el mensaje
  
  -- Metadatos adicionales
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Índices
  CONSTRAINT unique_whatsapp_message_id UNIQUE (whatsapp_message_id)
);

CREATE INDEX idx_axon_messages_contact_id ON axon_messages(contact_id);
CREATE INDEX idx_axon_messages_conversation_id ON axon_messages(conversation_id);
CREATE INDEX idx_axon_messages_timestamp ON axon_messages(timestamp DESC);
CREATE INDEX idx_axon_messages_workspace ON axon_messages(workspace);
CREATE INDEX idx_axon_messages_user_id ON axon_messages(user_id);
CREATE INDEX idx_axon_messages_whatsapp_message_id ON axon_messages(whatsapp_message_id);
```

**Mejoras propuestas**:
- ✅ Campo `whatsapp_message_id` único para evitar duplicados
- ✅ Campos para media (`media_url`, `media_mime_type`, `media_size_bytes`)
- ✅ Campos de estado (`is_forwarded`, `is_starred`, `is_deleted`)
- ✅ Campo `workspace` para integración con dendrita
- ✅ Campo `user_id` para multi-usuario
- ✅ Índices optimizados para consultas comunes

### 4. Estructura de Tabla de Conversaciones

**Tabla recomendada**: `axon_conversations`

```sql
CREATE TABLE IF NOT EXISTS axon_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relaciones
  contact_id UUID REFERENCES axon_contacts(id) ON DELETE SET NULL,
  
  -- Información de la conversación
  name TEXT,
  whatsapp_chat_id TEXT UNIQUE, -- ID original del chat en WhatsApp
  
  -- Estadísticas
  message_count INTEGER DEFAULT 0,
  unread_count INTEGER DEFAULT 0,
  
  -- Fechas
  first_message_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  
  -- Contexto
  workspace TEXT, -- Para integración con dendrita
  user_id TEXT, -- Usuario que capturó la conversación
  
  -- Estado
  is_archived BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  is_muted BOOLEAN DEFAULT false,
  
  -- Metadatos adicionales
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[], -- Para categorización
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Índices
  CONSTRAINT unique_whatsapp_chat_id UNIQUE (whatsapp_chat_id)
);

CREATE INDEX idx_axon_conversations_contact_id ON axon_conversations(contact_id);
CREATE INDEX idx_axon_conversations_workspace ON axon_conversations(workspace);
CREATE INDEX idx_axon_conversations_user_id ON axon_conversations(user_id);
CREATE INDEX idx_axon_conversations_last_message_at ON axon_conversations(last_message_at DESC);
CREATE INDEX idx_axon_conversations_whatsapp_chat_id ON axon_conversations(whatsapp_chat_id);
```

**Mejoras propuestas**:
- ✅ Campo `whatsapp_chat_id` único para evitar duplicados
- ✅ Campos de estado (`is_archived`, `is_pinned`, `is_muted`)
- ✅ Campos de estadísticas (`message_count`, `unread_count`)
- ✅ Campo `workspace` para integración con dendrita
- ✅ Campo `user_id` para multi-usuario
- ✅ Campo `tags` para categorización

### 5. Tabla de Media (Opcional)

Si Axon captura media (imágenes, videos, documentos), considerar:

**Tabla recomendada**: `axon_media`

```sql
CREATE TABLE IF NOT EXISTS axon_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relaciones
  message_id UUID REFERENCES axon_messages(id) ON DELETE CASCADE,
  
  -- Información del archivo
  file_name TEXT,
  file_path TEXT,
  file_url TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  
  -- Metadatos
  width INTEGER, -- Para imágenes/videos
  height INTEGER, -- Para imágenes/videos
  duration INTEGER, -- Para audio/video (en segundos)
  
  -- Almacenamiento
  storage_bucket TEXT,
  storage_key TEXT,
  
  -- Metadatos adicionales
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_axon_media_message_id ON axon_media(message_id);
```

## Recomendaciones de Seguridad

### Row Level Security (RLS)

**Problema**: Sin RLS, todos los usuarios pueden acceder a todos los datos.

**Recomendación**: Implementar políticas RLS basadas en `user_id` y `workspace`:

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE axon_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE axon_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE axon_conversations ENABLE ROW LEVEL SECURITY;

-- Políticas para axon_contacts
CREATE POLICY "Users can view their own contacts"
  ON axon_contacts FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own contacts"
  ON axon_contacts FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Repetir para otras tablas...
```

**Nota**: Ajustar según el sistema de autenticación usado (Supabase Auth, JWT, etc.)

## Integración con dendrita

### Campos de Integración

Para facilitar la integración con dendrita, agregar:

1. **`workspace` TEXT**: Para vincular datos con workspaces de dendrita
2. **`user_id` TEXT**: Para multi-usuario (si aplica)
3. **`metadata` JSONB**: Para metadatos flexibles y extensibles

### Sincronización

Considerar crear una tabla de sincronización para tracking:

```sql
CREATE TABLE IF NOT EXISTS axon_sync_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  workspace TEXT,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT, -- success, error, in_progress
  sync_error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## Migración desde Estructura Actual

Si Axon ya tiene una estructura existente:

1. **Análisis**: Ejecutar `inspect-table-schema.ts` en todas las tablas actuales
2. **Documentación**: Documentar la estructura actual en `SCHEMA.md`
3. **Migración gradual**: 
   - Crear nuevas tablas con recomendaciones
   - Migrar datos gradualmente
   - Mantener compatibilidad temporal con estructura antigua
4. **Validación**: Verificar integridad de datos después de migración

## Checklist de Implementación

- [ ] Definir convención de nombres de tablas
- [ ] Crear tablas con estructura recomendada
- [ ] Agregar campos de integración (`workspace`, `user_id`)
- [ ] Implementar índices para performance
- [ ] Configurar RLS policies
- [ ] Crear funciones de migración si hay estructura existente
- [ ] Documentar estructura final en `SCHEMA.md`
- [ ] Actualizar código de Axon para usar nueva estructura
- [ ] Probar integración con ennui-dendrita

## Próximos Pasos

1. **Revisar estructura actual**: Ejecutar scripts de verificación para ver qué hay actualmente
2. **Decidir convención**: Elegir prefijo de nombres (`axon_` recomendado)
3. **Implementar cambios**: Crear/modificar tablas según recomendaciones
4. **Actualizar código**: Modificar Axon para usar nueva estructura
5. **Probar integración**: Verificar que ennui-dendrita puede acceder a los datos

## Notas Adicionales

- **Performance**: Los índices propuestos optimizan consultas comunes. Ajustar según patrones de uso reales.
- **Escalabilidad**: La estructura propuesta permite crecimiento sin cambios mayores.
- **Flexibilidad**: El campo `metadata` JSONB permite agregar datos sin modificar esquema.
- **Compatibilidad**: Si hay múltiples sistemas accediendo a los datos, considerar versionado de esquema.

