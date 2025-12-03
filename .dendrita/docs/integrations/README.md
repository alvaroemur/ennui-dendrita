---
name: readme
description: "Integrations Module"
type: documentation
created:
  2025-11-06T00:00:00.000Z
  
updated:
  2025-11-06T00:00:00.000Z
  
tags: ["documentation", "integration", "readme"]
category: integration
---

# 🔐 Integrations Module

Sistema seguro de integración con APIs externas sin exponer datos sensibles.

## Principios de Diseño

✅ **Seguridad**: Credenciales nunca en repositorio
✅ **Modularidad**: Cada servicio en su propio módulo
✅ **Reutilizable**: Interfaces consistentes
✅ **Documentado**: Claro cómo configurar
✅ **Transparencia**: Lógica visible, credenciales ocultas

## Estructura

```
.dendrita/integrations/
├── services/                     ← Implementación de APIs
│   ├── google/
│   │   ├── auth.ts
│   │   ├── gmail.ts
│   │   ├── calendar.ts
│   │   └── drive.ts
│   ├── openai/
│   │   ├── auth.ts
│   │   └── chat.ts
│   ├── supabase/
│   │   ├── auth.ts
│   │   └── client.ts
│   └── base/
│       └── service.interface.ts
├── utils/
│   ├── credentials.ts           ← Carga credenciales de forma segura
│   ├── error-handler.ts
│   ├── logger.ts                ← Logger seguro por servicio
│   ├── usage-logger.ts          ← Sistema de logging interno
│   ├── usage-stats.ts           ← Estadísticas de uso
│   └── usage-tracker.ts         ← Helpers para tracking automático
├── hooks/
│   ├── google-auth-flow.md
│   └── openai-key-management.md
└── examples/
    ├── google-workspace-query.ts
    └── openai-completion.ts

.dendrita/docs/integrations/     ← Documentación (TÚ ESTÁS AQUÍ)
├── README.md                     ← Visión general
├── SETUP.md                      ← Quick start
├── SECURITY.md                   ← Políticas de seguridad
├── ARCHITECTURE.md               ← Cómo funciona
└── ...
```

## Configuración (Paso a Paso)

### 1. Crear archivo de credenciales local

```bash
# En la raíz del proyecto
touch .env.local
# O en .dendrita específicamente
touch .dendrita/.env.local
```

**Contenido de `.env.local` (NUNCA hacer commit):**

```env
# Google Workspace
GOOGLE_WORKSPACE_CLIENT_ID=tu_client_id
GOOGLE_WORKSPACE_CLIENT_SECRET=tu_client_secret
GOOGLE_WORKSPACE_REFRESH_TOKEN=tu_refresh_token

# OpenAI
OPENAI_API_KEY=sk-...

# Supabase
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_ANON_KEY=your_anon_key
# Solo servidor (opcional)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# Conexión Postgres (opcional)
SUPABASE_DB_URL=postgresql://postgres:YOUR_PASSWORD@db.<your-project-ref>.supabase.co:5432/postgres
```

### 2. Agregar a `.gitignore`

Si no existe, agregar estas líneas:

```
# Credenciales
.env
.env.local
.env.*.local
.dendrita/.env.local
.dendrita/config.local.json

# Cache
.dendrita/.cache/
node_modules/
```

### 3. Usar los servicios

```typescript
// Ejemplo: Usar Gmail
import { GmailService } from './.dendrita/integrations/services/google/gmail';

const gmail = new GmailService();
await gmail.authenticate();
const emails = await gmail.searchEmails('from:cliente@example.com');
```

## Servicios Disponibles

### Google Workspace (`services/google/`)

- ✅ **Gmail**: Buscar, leer, enviar emails (implementado)
- ✅ **Calendar**: Crear, listar, actualizar, eliminar eventos; listar calendarios (implementado)
- ✅ **Drive**: Listar archivos, buscar, compartir, descargar, gestionar permisos (implementado)
- ✅ **Drive Scraper**: Scraping idempotente de Drive configurable por workspace (implementado)

### OpenAI (`services/openai/`)

- ✅ **Chat Completions**: Generar respuestas con GPT
- ✅ **Embeddings**: Crear vectores para búsqueda semántica

### Supabase (`services/supabase/`)

- ✅ **Database**: Consultas via supabase-js
- ✅ **Auth/Storage**: Disponible vía SDK
- ⚠️ **Service Role**: Solo lado servidor (no cliente)
- ✅ **Sincronización Automática**: Workspaces, projects, documents, stakeholders

### Reddit (`services/reddit/`)

- ✅ **OAuth 2.0**: Autenticación con password grant o client credentials
- ✅ **Create Posts**: Publicar posts de texto o links
- ✅ **Comments**: Comentar en posts y comentarios
- ✅ **Read Operations**: Obtener información de subreddits y posts
- ✅ **User Info**: Información del usuario autenticado

## Cómo Funciona

### Flujo de Autenticación (Google)

1. **Primera vez**: Ejecuta `GoogleAuth.getAuthorizationUrl()`
2. **Usuario abre URL**: Autoriza acceso en Google
3. **Recibe código**: Guárdalo en `.env.local`
4. **Intercambia código**: Por refresh token
5. **Usa refresh token**: Para obtener access tokens

### Credenciales (OpenAI)

1. **Obtén API key** desde https://platform.openai.com/api-keys
2. **Guárdala** en `.env.local` como `OPENAI_API_KEY`
3. **Usa directamente**: Los servicios la cargan automáticamente

## 📊 Sistema de Logging Interno

dendrita incluye un **sistema de logging interno** que registra automáticamente el uso de todas las integraciones sin exponer credenciales.

### Características

✅ **Seguro**: Nunca expone credenciales o información sensible  
✅ **Automático**: Registra cada uso de integraciones  
✅ **Estadísticas**: Permite consultar estadísticas de uso  
✅ **Rotación**: Rota logs automáticamente cuando crecen demasiado  

### Uso Básico

```typescript
import { logIntegrationUsage } from './utils/usage-logger';

// Registrar uso exitoso
logIntegrationUsage('OpenAI', 'chatCompletion', {
  status: 'success',
  duration: 150,
  metadata: { model: 'gpt-4' },
});
```

### Consultar Estadísticas

```typescript
import { usageStats, formatStatsReport } from './utils/usage-stats';

// Reporte completo de los últimos 30 días
const report = usageStats.getOverallReport(30);
console.log(formatStatsReport(report));

// Estadísticas de un servicio específico
const stats = usageStats.getServiceStats('OpenAI', 30);
console.log(`Total de llamadas: ${stats.totalCalls}`);
```

**Ver documentación completa:**
- `.dendrita/integrations/scripts/.archived/2025-11-06-integration-docs/USAGE-LOGGING.md` (documentación de desarrollo personal)

---

## Seguridad

### ❌ NUNCA hagas esto

```javascript
// ❌ MALO - Expone credenciales en código
const client = new GoogleClient({ apiKey: 'sk-abc123...' });

// ❌ MALO - Hardcodear en archivo de configuración
{ "apiKey": "sk-abc123..." }
```

### ✅ SIEMPRE haz esto

```javascript
// ✅ BUENO - Carga desde variables de entorno
const apiKey = process.env.OPENAI_API_KEY;

// ✅ BUENO - Carga desde archivo gitignored
import { loadCredentials } from './utils/credentials';
const creds = loadCredentials();
```

## 🔄 Sincronización Automática con Supabase

dendrita mantiene **sincronización automática** con Supabase:

- ✅ **Workspaces**: Sincronizados desde `workspaces/`
- ✅ **Projects**: Sincronizados desde `active-projects/` y `_archived-projects/`
- ✅ **Documents**: Todos los `.md` con contenido completo
- ✅ **Stakeholders**: Desde `stakeholders/fichas-json/*.json`

**Configurar auto-sync:**
```bash
# Ejecutar setup interactivo
.dendrita/integrations/scripts/setup-auto-sync.sh

# O sincronización manual
npx ts-node .dendrita/integrations/scripts/pipelines/supabase-sync-pipeline/sync-all.ts
```

**Ver documentación completa:**
- `.dendrita/integrations/hooks/supabase-sync.md`

---

## 🔍 Scripts de Utilidad

### Extracción de Transcripciones de Reuniones

```bash
# Extraer transcripciones de reuniones desde Supabase
npx ts-node .dendrita/integrations/scripts/extract-meeting-transcripts.ts

# Especificar ruta de salida
npx ts-node .dendrita/integrations/scripts/extract-meeting-transcripts.ts ./output/transcripts.json
```

**Nota**: Este script busca transcripciones en las tablas `calendar_events` y `calendar_event_instances`. En el futuro, esta funcionalidad será proporcionada por **Neuron por API**.

Ver [README-extract-transcripts.md](scripts/README-extract-transcripts.md) para más detalles.

### Inspección de Base de Datos

```bash
# Listar todas las tablas en Supabase
npx ts-node .dendrita/integrations/scripts/list-supabase-tables.ts

# Inspeccionar esquema de una tabla específica
npx ts-node .dendrita/integrations/scripts/inspect-table-schema.ts <table_name>
```

---

## Próximas Integraciones

- [ ] Slack API
- [ ] Microsoft 365
- [ ] Notion API
- [ ] Airtable API

## Referencias

- [Google Workspace Developer Setup](https://developers.google.com/workspace)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
