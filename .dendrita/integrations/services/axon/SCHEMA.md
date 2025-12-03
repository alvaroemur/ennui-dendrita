# Esquema de Tablas de Axon

Este documento describe la estructura real de las tablas de Axon en Supabase. Axon es una Chrome extension que hace scraping de WhatsApp por `contacto@axon`.

**Última actualización**: 2025-11-06  
**Tablas encontradas**: 2 (`messages`, `conversations`)

## Tablas Identificadas

Las siguientes tablas de Axon fueron encontradas en Supabase:

1. **`messages`** - Almacena mensajes de WhatsApp capturados (651 filas)
2. **`conversations`** - Almacena conversaciones/chats de WhatsApp (11 filas)

## Estructura Real de Tablas

### Tabla: `messages`

Tabla que almacena mensajes de WhatsApp capturados por Axon.

**Filas**: ~651  
**Columnas**: 21

#### Columnas

| Columna | Tipo | Nullable | Descripción |
|---------|------|----------|-------------|
| `id` | UUID | NOT NULL | ID único del mensaje (PK) |
| `conversation_id` | UUID | NOT NULL | ID de la conversación (FK → `conversations.id`) |
| `data_id` | VARCHAR | NOT NULL | ID del mensaje en WhatsApp |
| `content` | VARCHAR | NOT NULL | Contenido del mensaje |
| `type` | VARCHAR | NOT NULL | Tipo de mensaje (`message-in`, `message-out`) |
| `format` | VARCHAR | NOT NULL | Formato del mensaje (ej: `chat`) |
| `timestamp` | INTEGER | NOT NULL | Timestamp Unix del mensaje |
| `backup_timestamp` | VARCHAR | NOT NULL | Timestamp formateado del backup |
| `is_edited` | BOOLEAN | NOT NULL | Si el mensaje fue editado |
| `phone_number` | VARCHAR | NOT NULL | Número de teléfono del contacto |
| `identifier` | TEXT | NULL | Identificador adicional (opcional) |
| `audio_data` | JSONB | NULL | Datos de audio si aplica |
| `created_at` | TIMESTAMPTZ | NOT NULL | Fecha de creación en DB |
| `image_data` | JSONB | NULL | Datos de imagen si aplica |
| `transcription_text` | TEXT | NULL | Texto transcrito de audio |
| `transcription_status` | TEXT | NULL | Estado de la transcripción |
| `transcription_model` | TEXT | NULL | Modelo usado para transcripción |
| `transcription_confidence` | NUMERIC | NULL | Confianza de la transcripción |
| `suggestion_context` | JSONB | NULL | Contexto para sugerencias |
| `sender_id` | TEXT | NULL | ID del remitente |
| `sender_name` | TEXT | NULL | Nombre del remitente |

#### Relaciones

- `conversation_id` → `conversations.id` (Foreign Key)

#### Ejemplo de Datos

```json
{
  "id": "0b276a79-8be4-4ca9-a265-1283f41fa7db",
  "conversation_id": "0380bf80-54a1-41fa-a85b-50242e4950c5",
  "data_id": "3EB0D4A52EBD60555D4766",
  "content": "este es mi número de Colombia",
  "type": "message-out",
  "format": "chat",
  "timestamp": 1762046335,
  "backup_timestamp": "[8:18 PM, 11/1/2025] Álvaro Mur: ",
  "is_edited": false,
  "phone_number": "17864248255",
  "identifier": null,
  "audio_data": null,
  "created_at": "2025-11-02T05:29:26.86473+00:00",
  "image_data": null,
  "transcription_text": null,
  "transcription_status": null,
  "transcription_model": null,
  "transcription_confidence": null,
  "suggestion_context": null,
  "sender_id": null,
  "sender_name": null
}
```

### Tabla: `conversations`

Tabla que almacena conversaciones/chats de WhatsApp.

**Filas**: ~11  
**Columnas**: 12

#### Columnas

| Columna | Tipo | Nullable | Descripción |
|---------|------|----------|-------------|
| `id` | UUID | NOT NULL | ID único de la conversación (PK) |
| `chat_id` | VARCHAR | NOT NULL | ID del chat en WhatsApp |
| `alias` | VARCHAR | NOT NULL | Alias/nombre del contacto |
| `social_media` | VARCHAR | NOT NULL | Red social (ej: `whatsapp`) |
| `image_url` | VARCHAR | NOT NULL | URL de la imagen del contacto |
| `enabled` | BOOLEAN | NOT NULL | Si la conversación está habilitada |
| `written_conversation_id` | VARCHAR | NOT NULL | ID de conversación escrito |
| `created_at` | TIMESTAMPTZ | NOT NULL | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Fecha de última actualización |
| `is_group` | BOOLEAN | NOT NULL | Si es un grupo de WhatsApp |
| `axon_user_id` | TEXT | NULL | ID del usuario de Axon (opcional) |
| `whatsapp_account_id` | TEXT | NULL | ID de cuenta de WhatsApp (opcional) |

#### Relaciones

- `id` ← Referenciado por `messages.conversation_id` (Foreign Key)

#### Ejemplo de Datos

```json
{
  "id": "0380bf80-54a1-41fa-a85b-50242e4950c5",
  "chat_id": "17864248255",
  "alias": "+1 (786) 424-8255",
  "social_media": "whatsapp",
  "image_url": "chrome-extension://jlmiefmmhbknkconcngpbnggkmopodje/images/boton-whatsapp.svg",
  "enabled": true,
  "written_conversation_id": "local-1762065292457-17864248255",
  "created_at": "2025-11-02T05:29:26.633896+00:00",
  "updated_at": "2025-11-02T06:34:52.784945+00:00",
  "is_group": false,
  "axon_user_id": null,
  "whatsapp_account_id": null
}
```

## Notas sobre la Estructura

### Diferencias con Estructura Esperada

1. **No hay tabla de contactos separada**: Los contactos están implícitos en `conversations` (campo `alias` y `chat_id`)
2. **Nombres de tablas**: Las tablas se llaman `messages` y `conversations` (sin prefijo `axon_` o `whatsapp_`)
3. **Campos adicionales**: Las tablas incluyen campos para transcripción de audio y sugerencias que no estaban en la estructura esperada

### Campos Importantes

#### En `messages`:
- `type`: `message-in` (recibido) o `message-out` (enviado)
- `timestamp`: Timestamp Unix (segundos desde epoch)
- `backup_timestamp`: Timestamp formateado legible
- `phone_number`: Identifica el contacto
- `transcription_*`: Campos para transcripción de audio

#### En `conversations`:
- `chat_id`: Identificador único del chat en WhatsApp
- `alias`: Nombre/alias del contacto
- `social_media`: Siempre `whatsapp` en este caso
- `is_group`: Indica si es un grupo o conversación individual

## Uso desde ennui-dendrita

### Configurar el Conector

```typescript
import { AxonConnector } from '.dendrita/integrations/services/axon/connector';

const axon = new AxonConnector();

// Configurar nombres de tablas reales
axon.setTableNames({
  messages: 'messages',
  conversations: 'conversations',
  // No hay tabla de contactos separada
});
```

### Obtener Conversaciones

```typescript
// Obtener todas las conversaciones
const conversations = await axon.getConversations({ limit: 50 });

// Buscar conversación por alias
const conversations = await axon.getConversations({ 
  search: 'Juan',
  limit: 10 
});
```

### Obtener Mensajes

```typescript
// Obtener mensajes de una conversación
const messages = await axon.getConversationMessages(conversationId, 100);

// Obtener mensajes recientes
const messages = await axon.getMessages({ 
  limit: 50,
  after: '2025-01-01T00:00:00Z'
});

// Filtrar por tipo (enviados/recibidos)
const sentMessages = await axon.getMessages({ 
  limit: 100 
});
// Luego filtrar por type === 'message-out'
```

### Mapeo de Campos

El conector `AxonConnector` mapea automáticamente los campos:

**Conversaciones**:
- `id` → `id`
- `alias` → `name`
- `chat_id` → `contact_id` (inferido)
- `updated_at` → `last_message_at`
- `created_at` → `created_at`

**Mensajes**:
- `id` → `id`
- `conversation_id` → `conversation_id`
- `content` → `message_text`
- `type` → `message_type`
- `timestamp` → `timestamp` (convertir de Unix a ISO)
- `phone_number` → `from` o `to` (según `type`)
- `is_edited` → `is_from_me` (inferido de `type`)

## Verificación de Esquema

Para verificar el esquema actualizado:

```bash
# Listar todas las tablas
npx ts-node .dendrita/integrations/scripts/list-supabase-tables.ts

# Inspeccionar una tabla específica
npx ts-node .dendrita/integrations/scripts/inspect-table-schema.ts messages
npx ts-node .dendrita/integrations/scripts/inspect-table-schema.ts conversations
```

## Próximos Pasos

1. ✅ **Completado**: Identificar tablas reales en Supabase
2. ✅ **Completado**: Documentar estructura real de tablas
3. ⏳ **Pendiente**: Actualizar `AxonConnector` para mapear correctamente los campos reales
4. ⏳ **Pendiente**: Agregar soporte para campos específicos (transcripción, sugerencias)
5. ⏳ **Pendiente**: Considerar crear tabla de contactos si es necesario para integración con dendrita

## Notas Importantes

1. **Row Level Security (RLS)**: Verifica que las políticas RLS en Supabase permitan acceso desde ennui-dendrita si es necesario.

2. **Detección Automática**: El conector detecta automáticamente los nombres de tablas, pero en este caso las tablas tienen nombres simples (`messages`, `conversations`).

3. **Mapeo de Campos**: Algunos campos pueden necesitar transformación (ej: `timestamp` Unix a ISO, `type` a `is_from_me`).

4. **Contactos**: No hay tabla de contactos separada. Los contactos están en `conversations.alias` y `conversations.chat_id`.

5. **Performance**: Para consultas grandes, usa `limit` y `offset` para paginación.
