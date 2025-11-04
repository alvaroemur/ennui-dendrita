# 🏗️ Arquitectura de Integraciones en Dendrita

Cómo funciona el sistema de integraciones de forma segura y modular.

---

## 📊 Diagrama General

```
┌─────────────────────────────────────────────────────────────┐
│                    Tu Código/Aplicación                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
    ┌────────┐   ┌──────────┐   ┌────────┐
    │ Gmail  │   │ Calendar │   │ OpenAI │
    │Service │   │ Service  │   │Service │
    └───┬────┘   └───┬──────┘   └───┬────┘
        │            │              │
        └────────────┼──────────────┘
                     │
        ┌────────────▼────────────┐
        │   Credentials Loader    │
        │  (utils/credentials.ts) │
        └────────────┬────────────┘
                     │
        ┌────────────▼─────────────────┐
        │  .env.local (gitignored)     │
        │  ✓ GOOGLE_WORKSPACE_*        │
        │  ✓ OPENAI_API_KEY            │
        └──────────────────────────────┘
```

---

## 🔐 Flujo de Seguridad

### 1. Carga de Credenciales

```
┌─────────────────────┐
│   credentials.ts    │
└──────────┬──────────┘
           │
           ├─→ Intenta leer ENV variables
           │   (process.env.OPENAI_API_KEY, etc)
           │
           └─→ Si no existen, intenta leer .env.local
               ├─→ Valida que archivo existe
               ├─→ Parsea variables
               └─→ Almacena en memoria
```

### 2. Uso en Servicios

```typescript
// En cada servicio (Gmail, OpenAI, etc.)
const creds = credentials.getGoogleWorkspace();
// ↓
// Retorna: { clientId, clientSecret, refreshToken }
// ↓
// NUNCA se loguean, NUNCA se imprimen
```

### 3. Logging Seguro

```
┌────────────────────┐
│  logger.ts         │
└────────┬───────────┘
         │
         ├─→ Mensaje: "Bearer sk-abc123..."
         │   ↓ Redacta automáticamente
         │   Mensaje: "Bearer [TOKEN_REDACTED]"
         │
         ├─→ Console output: [REDACTED]
         │
         └─→ File output: logs/service.log
             (también redactado)
```

---

## 🏛️ Capas de la Arquitectura

### Capa 1: Base Service Interface

```typescript
// services/base/service.interface.ts

export interface IService {
  name: string;
  isConfigured(): boolean;
  authenticate?(): Promise<void>;
}
```

**Propósito**: Define contrato común para todos los servicios.

---

### Capa 2: Servicios Específicos

```
services/
├── google/
│   ├── auth.ts          ← Maneja OAuth 2.0
│   ├── gmail.ts         ← Operaciones de email
│   └── calendar.ts      ← Operaciones de calendario
│
└── openai/
    ├── auth.ts          ← Valida API key
    └── chat.ts          ← Chat completions + embeddings
```

**Propósito**: Implementaciones específicas de cada API.

---

### Capa 3: Utilidades

```
utils/
├── credentials.ts       ← Carga credenciales de forma segura
├── error-handler.ts     ← Manejo consistente de errores
└── logger.ts            ← Logging sin exponer datos
```

**Propósito**: Funcionalidad transversal reutilizable.

---

### Capa 4: Documentación

```
hooks/
├── google-auth-flow.md    ← Guía setup Google
└── openai-key-management.md ← Guía setup OpenAI

examples/
├── google-workspace-query.ts
└── openai-completion.ts
```

**Propósito**: Referencias y ejemplos de uso.

---

## 🔄 Flujo de Autenticación

### Google Workspace (OAuth 2.0)

```
1. Primera vez:
   GoogleAuth.getAuthorizationUrl()
   ↓
   → Retorna: https://accounts.google.com/o/oauth2/v2/auth?...
   → Usuario abre en navegador

2. Usuario autoriza en Google

3. Google redirecciona con código:
   http://localhost:3000/auth/google/callback?code=abc123

4. Intercambiar código por tokens:
   GoogleAuth.exchangeAuthorizationCode('abc123')
   ↓
   → Retorna: { accessToken, refreshToken, expiresIn }

5. Guardar refresh token en .env.local:
   GOOGLE_WORKSPACE_REFRESH_TOKEN=abc123...

6. Usar indefinidamente:
   GoogleAuth.refreshAccessToken()
   ↓
   → Usa refresh token para obtener nuevo access token
   → Access tokens expiran cada hora (por defecto)
   → Refresh token permanece válido años
```

### OpenAI (Simple API Key)

```
1. Obtener API key:
   https://platform.openai.com/api-keys
   ↓
   → Copiar: sk-...

2. Guardar en .env.local:
   OPENAI_API_KEY=sk-...

3. Usar directamente:
   ChatService carga la key
   ↓
   Authorization: Bearer sk-...
```

---

## 🛡️ Protecciones de Seguridad

### 1. Separación de Credenciales

```
❌ SIN protección:
app/
├── config.ts      ← { apiKey: 'sk-abc...' }  EXPUESTO
└── services/
    └── openai.ts

✅ CON protección:
.dendrita/
├── integrations/
│   ├── services/  ← Sin credenciales
│   └── utils/
│       └── credentials.ts ← Carga desde .env.local
│
.env.local          ← Gitignored
├── OPENAI_API_KEY=sk-...
```

### 2. Redacción en Logs

```typescript
logger.info('Conectando a API con token: Bearer sk-1234567890');
// Se convierte automáticamente a:
// [INFO] Conectando a API con token: Bearer [TOKEN_REDACTED]
```

### 3. Validación de Configuración

```typescript
if (!credentials.hasOpenAI()) {
  throw new Error('OpenAI not configured');
}
// Nunca retorna la key, solo booleano
```

### 4. Manejo de Errores Seguros

```typescript
catch (error) {
  // ❌ NO hacer:
  console.error(`Error: ${error}, token: ${token}`);
  
  // ✅ Hacer:
  logSafeError(error);
  // Solo loguea: "[OpenAI] API Error - 401"
}
```

---

## 📦 Estructura de Tipos

```typescript
// Credenciales Cargadas (en memoria)
interface Credentials {
  google?: {
    workspace?: {
      clientId: string;
      clientSecret: string;
      refreshToken: string;
    };
  };
  openai?: {
    apiKey: string;
  };
}

// Servicio Base
interface IService {
  name: string;
  isConfigured(): boolean;
  authenticate?(): Promise<void>;
}

// Errores Específicos
class IntegrationError extends Error
class AuthenticationError extends IntegrationError
class RateLimitError extends IntegrationError
```

---

## 🔗 Relaciones Entre Componentes

```
┌─────────────────────┐
│   Aplicación        │
└──────────┬──────────┘
           │ importa
           ▼
┌─────────────────────┐
│  Gmail/OpenAI       │
│  Services           │
└──────────┬──────────┘
           │ usan
           ▼
┌─────────────────────┐
│  Credentials        │
│  Loader             │
└──────────┬──────────┘
           │ lee
           ▼
┌─────────────────────┐
│  .env.local         │
│  (gitignored)       │
└─────────────────────┘

┌─────────────────────┐
│  Logger             │
└──────────┬──────────┘
           │ redacta
           ▼
┌─────────────────────┐
│  Safe Output        │
│  logs/              │
└─────────────────────┘
```

---

## 🚀 Extensión Futura

Para agregar un nuevo servicio (ej: Slack):

```
1. Crear: services/slack/auth.ts
   - Implementar IService
   - Manejar autenticación

2. Crear: services/slack/client.ts
   - Métodos específicos de Slack

3. Agregar credenciales a utils/credentials.ts
   - SLACK_BOT_TOKEN

4. Documentar en: hooks/slack-setup.md

5. Crear ejemplo en: examples/slack-notifications.ts
```

---

## 📈 Escalabilidad

Este diseño escala porque:

✅ **Modular**: Cada servicio es independiente
✅ **Reutilizable**: Utilities compartidas
✅ **Testeable**: Interfaces claras
✅ **Mantenible**: Documentación clara
✅ **Seguro**: Credenciales centralizadas
✅ **Extensible**: Agregar servicios es fácil

---

## 🔍 Debugging

Cómo debugguear sin exponer credenciales:

```bash
# Ver qué servicios están disponibles
node -e "
const c = require('./utils/credentials');
console.log('Available:', c.credentials.getAvailableServices());
"

# Ver logs sin redacción (safe)
tail -f .dendrita/integrations/logs/Gmail.log

# Verificar credenciales se cargaron (sin mostrar valores)
node -e "
const c = require('./utils/credentials');
console.log('Google:', c.credentials.hasGoogleWorkspace() ? '✅' : '❌');
console.log('OpenAI:', c.credentials.hasOpenAI() ? '✅' : '❌');
"
```

---

## 📚 Referencias

- [README.md](./README.md) - Visión general
- [SETUP.md](./SETUP.md) - Setup rápido
- [hooks/google-auth-flow.md](./hooks/google-auth-flow.md)
- [hooks/openai-key-management.md](./hooks/openai-key-management.md)
