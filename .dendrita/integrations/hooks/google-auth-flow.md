# 🔐 Google Workspace Authentication Flow

Guía paso a paso para configurar Google Workspace con dendrita.

## ¿Por qué esto es seguro?

✅ Credenciales **nunca en código**
✅ Refresh token guardado **solo localmente** en `.env.local`
✅ Access tokens **se generan dinámicamente** desde refresh token
✅ **Sin exponer** nombres de archivos o estructura del sistema

---

## Requisitos Previos

1. Cuenta de Google (Gmail, Google Drive, etc.)
2. Acceso a [Google Cloud Console](https://console.cloud.google.com/)

---

## Paso 1: Crear Proyecto en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto:
   - Click "New Project"
   - Nombre: `dendrita-integrations`
   - Click "Create"

---

## Paso 2: Habilitar APIs necesarias

1. En el menú, ve a **APIs & Services** → **Library**
2. **Busca e habilita** estas APIs:
   - ✅ Gmail API
   - ✅ Google Calendar API
   - ✅ Google Drive API

Para cada API:
- Haz click en ella
- Presiona "Enable"

---

## Paso 3: Crear OAuth 2.0 Credentials

1. Ve a **APIs & Services** → **Credentials**
2. Click "Create Credentials" → "OAuth client ID"
3. Te pedirá crear OAuth consent screen:
   - User Type: "External"
   - Fill required fields (app name, email, etc.)
   - En scopes, agrega:
     - `gmail.readonly`
     - `gmail.compose`
     - `calendar`
     - `drive.readonly`

4. De vuelta en Credentials:
   - Type: "Web application"
   - Name: `dendrita-client`
   - Authorized redirect URIs: `http://localhost:3000/auth/google/callback`
   - Click "Create"

---

## Paso 4: Descargar y Guardar Credenciales

1. Ve a Credentials → tu OAuth client
2. Click en el ícono de descargar
3. **Guarda el JSON** como `google-credentials-temp.json`

El archivo contendrá:
```json
{
  "client_id": "...",
  "client_secret": "...",
  ...
}
```

---

## Paso 5: Configurar `.env.local`

En `.dendrita/.env.local`:

```env
# Google Workspace - Obtenidas de google-credentials-temp.json
GOOGLE_WORKSPACE_CLIENT_ID=tu_client_id_aqui
GOOGLE_WORKSPACE_CLIENT_SECRET=tu_client_secret_aqui
GOOGLE_WORKSPACE_REFRESH_TOKEN=se_genera_en_proximo_paso
```

**IMPORTANTE**: Nunca comitees este archivo.

---

## Paso 6: Obtener Refresh Token

Esta es la **única vez que necesitas interacción manual**:

```bash
# En la raíz del proyecto
cd .dendrita/integrations

# Ejecuta script de autenticación (requiere Node.js)
node scripts/get-refresh-token.js
```

Este script:
1. Genera una URL de autorización
2. Abre tu navegador
3. Pide permiso a Google
4. Recibe un authorization code
5. Lo intercambia por refresh token
6. **Lo agrega automáticamente** a `.env.local`

---

## Paso 7: Verificar Configuración

```bash
# Verifica que el refresh token se cargó correctamente
node -e "require('./utils/credentials').credentials.getGoogleWorkspace() && console.log('✅ Google Workspace configured')"
```

---

## Uso

Ahora puedes usar los servicios:

```typescript
import { GmailService } from './.dendrita/integrations/services/google/gmail';

const gmail = new GmailService();
await gmail.authenticate();

// Buscar emails
const emails = await gmail.searchEmails('from:cliente@example.com', 5);

// Obtener un email específico
const email = await gmail.getEmail('messageId123');

// Enviar email
await gmail.sendEmail(
  ['recipient@example.com'],
  'Subject',
  'Email body'
);
```

---

## Seguridad: Checklist

- [ ] `.env.local` está en `.gitignore`
- [ ] `google-credentials-temp.json` NO está en repo
- [ ] Refresh token guardado SOLO en `.env.local`
- [ ] No expones credenciales en logs
- [ ] Acceso tokenss se generan de forma ephemeral

---

## Troubleshooting

### "Google Workspace credentials not configured"
- Verifica que `GOOGLE_WORKSPACE_CLIENT_ID`, `CLIENT_SECRET` y `REFRESH_TOKEN` están en `.env.local`
- Revisa que no tienen espacios en blanco

### "Invalid or expired credentials"
- El refresh token expiró
- Vuelve a ejecutar `scripts/get-refresh-token.js` para obtener uno nuevo

### "Authorization failed"
- Verifica que Google OAuth consent screen está correctamente configurada
- Verifica que las APIs están habilitadas

---

## Referencias

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [Google Calendar API](https://developers.google.com/calendar/api)
