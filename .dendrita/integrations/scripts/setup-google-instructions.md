# 🔐 Instrucciones para Conectar Google Calendar

## Estado Actual

El script de configuración está listo y esperando que ingreses tus credenciales de Google OAuth 2.0.

## Pasos para Configurar

### 1. Obtener Credenciales de Google Cloud Console

Si aún no tienes las credenciales:

1. **Ve a Google Cloud Console**: https://console.cloud.google.com/
2. **Crea o selecciona un proyecto**
3. **Habilita las APIs necesarias**:
   - Ve a **"APIs & Services"** → **"Library"**
   - Busca y habilita:
     - ✅ Gmail API
     - ✅ Google Calendar API
     - ✅ Google Drive API
4. **Crea OAuth 2.0 Credentials**:
   - Ve a **"APIs & Services"** → **"Credentials"**
   - Click en **"Create Credentials"** → **"OAuth client ID"**
   - Si es la primera vez, te pedirá configurar el OAuth consent screen:
     - User Type: **"External"**
     - Completa los campos requeridos (app name, email, etc.)
     - En scopes, agrega:
       - `gmail.readonly`
       - `gmail.compose`
       - `calendar`
       - `drive.readonly`
   - De vuelta en Credentials:
     - Type: **"Web application"**
     - Name: `dendrita-client`
     - Authorized redirect URIs: `http://localhost:3000/auth/google/callback`
     - Click **"Create"**
5. **Copia las credenciales**:
   - Client ID: (lo verás en la pantalla)
   - Client Secret: (haz click en el ícono de ojo para verlo)

### 2. Ejecutar el Script de Configuración

En tu terminal, ejecuta:

```bash
npm run setup-google
```

O directamente:

```bash
./node_modules/.bin/ts-node .dendrita/integrations/scripts/get-refresh-token.ts
```

El script te pedirá:
1. **Client ID**: Pega el Client ID que copiaste
2. **Client Secret**: Pega el Client Secret que copiaste
3. **URL de autorización**: El script generará una URL
4. **Autorizar**: Abre la URL en tu navegador y autoriza el acceso
5. **Código de autorización**: Copia el código de la URL de redirección (después de `code=`)
6. **Pegar código**: Pega el código en el script

El script guardará automáticamente todo en `.dendrita/.env.local`.

### 3. Probar la Conexión

Una vez configurado, ejecuta:

```bash
npm run test-calendar
```

O directamente:

```bash
./node_modules/.bin/ts-node .dendrita/integrations/scripts/test-calendar.ts
```

Esto mostrará:
- ✅ Tus calendarios disponibles
- 📅 Eventos próximos (próximos 7 días)
- ✅ Confirmación de conexión exitosa

## Resumen de Archivos

- **Script de configuración**: `.dendrita/integrations/scripts/get-refresh-token.ts`
- **Script de prueba**: `.dendrita/integrations/scripts/test-calendar.ts`
- **Credenciales**: `.dendrita/.env.local` (nunca se commitea)

## Comandos Rápidos

```bash
# Configurar Google OAuth
npm run setup-google

# Probar conexión con Calendar
npm run test-calendar
```

