# 🔴 Reddit API Setup

Guía completa para configurar Reddit API en dendrita.

---

## 📋 Requisitos Previos

- [ ] Cuenta de Reddit activa
- [ ] Acceso a Reddit Developer Portal
- [ ] Aplicación registrada en Reddit

---

## 🚀 Paso 1: Crear Aplicación en Reddit

1. **Ve a Reddit Developer Portal:**
   - https://www.reddit.com/prefs/apps

2. **Crea una nueva aplicación:**
   - Click en "create another app..." o "create application"
   - **Nombre**: Elige un nombre descriptivo (ej: "dendrita-community-bot")
   - **Tipo**: Selecciona "script" (para OAuth 2.0 con username/password)
   - **Descripción**: Descripción breve de tu aplicación
   - **About URL**: URL opcional (puede ser el repo de dendrita)
   - **Redirect URI**: `http://localhost:8080` (para desarrollo local)

3. **Guarda las credenciales:**
   - **client_id**: Aparece debajo del nombre de la app (identificador único)
   - **secret**: Aparece como "secret" (solo visible una vez, guárdalo)

---

## 🔐 Paso 2: Configurar Credenciales

1. **Crea o edita `.dendrita/.env.local`:**

```env
# Reddit API
REDDIT_CLIENT_ID=tu_client_id_aqui
REDDIT_CLIENT_SECRET=tu_secret_aqui
REDDIT_USER_AGENT=dendrita-community-bot/1.0 by (tu_username) - https://github.com/ennui-dendrita/ennui-dendrita
REDDIT_USERNAME=tu_username_de_reddit
REDDIT_PASSWORD=tu_password_de_reddit
```

**IMPORTANTE:**
- `REDDIT_USER_AGENT` debe seguir el formato: `app_name/version by (username) - url`
- Usa tu username de Reddit, no el nombre de la app
- El formato es importante para que Reddit identifique tu aplicación

2. **Verifica que `.dendrita/.env.local` está en `.gitignore`:**

```bash
# Verificar
cat .dendrita/integrations/.gitignore | grep env.local
```

Si no está, agregalo manualmente.

---

## ✅ Paso 3: Verificar Configuración

```bash
# Desde la raíz del proyecto
cd .dendrita/integrations

# Verificar que Reddit está configurado
node -e "const c = require('./utils/credentials'); console.log(c.credentials.hasReddit() ? '✅ Reddit configurado' : '❌ Reddit no configurado')"
```

---

## 📝 Paso 4: Usar el Servicio

```typescript
import { RedditClient } from './.dendrita/integrations/services/reddit/client';

const reddit = new RedditClient();

// Verificar configuración
if (!reddit.isConfigured()) {
  throw new Error('Reddit not configured');
}

// Autenticar
await reddit.authenticate();

// Crear un post
const post = await reddit.createPost({
  title: '¡Hola desde dendrita!',
  text: 'Este es mi primer post automatizado usando dendrita.',
  subreddit: 'projectmanagement',
  kind: 'self',
});

console.log('Post creado:', post.url);
```

---

## 🔑 Tipos de Autenticación

### OAuth 2.0 Password Grant (Recomendado para Posting)

**Requiere:**
- `REDDIT_CLIENT_ID`
- `REDDIT_CLIENT_SECRET`
- `REDDIT_USERNAME`
- `REDDIT_PASSWORD`
- `REDDIT_USER_AGENT`

**Permisos:**
- ✅ Leer y escribir posts
- ✅ Comentar
- ✅ Acceso completo a la cuenta

**Uso:**
```typescript
// Automáticamente usa password grant si tienes username/password
await reddit.authenticate();
```

### OAuth 2.0 Client Credentials (Solo Lectura)

**Requiere:**
- `REDDIT_CLIENT_ID`
- `REDDIT_CLIENT_SECRET`
- `REDDIT_USER_AGENT`

**Permisos:**
- ✅ Solo lectura
- ❌ No puede postear
- ❌ No puede comentar

**Uso:**
```typescript
// Usa client credentials si no hay username/password
await reddit.authenticate();
```

---

## 📊 Límites de Rate

Reddit API tiene límites de rate:

- **Sin autenticación**: 60 requests/minuto
- **Con OAuth**: 60 requests/minuto por IP
- **Aplicaciones**: 100 requests/minuto (con OAuth)

**Recomendaciones:**
- Espera entre requests (mínimo 1 segundo)
- No publiques más de 2-3 posts por semana en el mismo subreddit
- Respeta las reglas de cada subreddit

---

## 🛡️ Seguridad

### ❌ NUNCA hagas esto

```typescript
// ❌ MALO - Expone credenciales en código
const clientId = 'tu_client_id_aqui';
const secret = 'tu_secret_aqui';

// ❌ MALO - Hardcodear en archivo de configuración
{ "reddit": { "clientId": "abc123..." } }
```

### ✅ SIEMPRE haz esto

```typescript
// ✅ BUENO - Carga desde variables de entorno
import { credentials } from './utils/credentials';
const creds = credentials.getReddit();

// ✅ BUENO - Usa .env.local (gitignored)
// REDDIT_CLIENT_ID=abc123...
```

---

## 🔍 Troubleshooting

### Error: "Invalid credentials"

**Causa:** Credenciales incorrectas o expiradas

**Solución:**
1. Verifica que `REDDIT_CLIENT_ID` y `REDDIT_CLIENT_SECRET` son correctos
2. Verifica que `REDDIT_USER_AGENT` sigue el formato correcto
3. Si usas username/password, verifica que sean correctos

### Error: "Forbidden" o "403"

**Causa:** No tienes permisos o la cuenta está suspendida

**Solución:**
1. Verifica que tu cuenta de Reddit no esté suspendida
2. Verifica que la aplicación esté activa en Reddit Developer Portal
3. Verifica que el subreddit permite posts automatizados

### Error: "Rate limit exceeded"

**Causa:** Demasiadas requests en poco tiempo

**Solución:**
1. Espera antes de hacer más requests
2. Implementa retry con exponential backoff
3. Reduce la frecuencia de publicación

### Error: "User-Agent required"

**Causa:** `REDDIT_USER_AGENT` no está configurado o tiene formato incorrecto

**Solución:**
1. Verifica que `REDDIT_USER_AGENT` está en `.env.local`
2. Verifica que sigue el formato: `app_name/version by (username) - url`

---

## 📚 Referencias

- [Reddit API Documentation](https://www.reddit.com/dev/api)
- [Reddit OAuth Guide](https://github.com/reddit-archive/reddit/wiki/OAuth2)
- [Reddit API Rate Limits](https://www.reddit.com/dev/api#api_response_codes)

---

## 🚀 Próximos Pasos

1. **Configura credenciales** en `.dendrita/.env.local`
2. **Prueba autenticación** con un script simple
3. **Publica tu primer post** de prueba en un subreddit pequeño
4. **Revisa las reglas** de cada subreddit antes de publicar
5. **Implementa manejo de errores** y rate limiting

---

**¿Problemas?** Revisa los logs en `.dendrita/logs/` o consulta la documentación de Reddit API.

