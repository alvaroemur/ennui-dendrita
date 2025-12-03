---
name: setup
description: "Dendrita Integrations - Quick Start"
type: documentation
created:
  2025-11-06T00:00:00.000Z
  
updated:
  2025-11-06T00:00:00.000Z
  
tags: ["documentation", "integration"]
category: integration
---

# 🚀 Dendrita Integrations - Quick Start

Guía rápida para conectar Google Workspace y OpenAI sin exponer datos sensibles.

---

## 📋 Checklist Rápido

- [ ] Has leído `.dendrita/docs/integrations/README.md`
- [ ] Tienes cuenta de Google con Workspace
- [ ] Tienes cuenta de OpenAI con plan de pago
- [ ] Vas a seguir los pasos de setup sin saltar ninguno

---

## 🔧 Paso 1: Crear Archivo de Credenciales Local

```bash
# En la raíz del proyecto
touch .dendrita/.env.local
```

**IMPORTANTE**: Este archivo NUNCA debe ser commiteado. Está protegido por `.gitignore`.

---

## 🔐 Paso 2: Configurar Google Workspace

**Tiempo estimado**: 10-15 minutos (primera vez)

1. Lee la guía completa: `.dendrita/integrations/hooks/google-auth-flow.md`
2. Crea OAuth credentials en Google Cloud Console
3. Descarga las credenciales
4. Extrae `client_id` y `client_secret`
5. Agrega a `.dendrita/.env.local`:

```env
GOOGLE_WORKSPACE_CLIENT_ID=tu_client_id
GOOGLE_WORKSPACE_CLIENT_SECRET=tu_client_secret
GOOGLE_WORKSPACE_REFRESH_TOKEN=se_obtiene_en_el_paso_6_del_guia
```

6. Ejecuta el script de autenticación (ver `hooks/google-auth-flow.md`)

---

## 🤖 Paso 3: Configurar OpenAI

**Tiempo estimado**: 2-3 minutos

1. Lee la guía completa: `.dendrita/integrations/hooks/openai-key-management.md`
2. Obtén tu API Key desde https://platform.openai.com/api-keys
3. Agrega a `.dendrita/.env.local`:

```env
OPENAI_API_KEY=sk-...
```

---

## ✅ Paso 4: Verificar Setup

```bash
# Verifica que ambas APIs están configuradas
cd .dendrita/integrations

# Google
node -e "const c = require('./utils/credentials'); c.credentials.hasGoogleWorkspace() ? console.log('✅ Google') : console.log('❌ Google')"

# OpenAI
node -e "const c = require('./utils/credentials'); c.credentials.hasOpenAI() ? console.log('✅ OpenAI') : console.log('❌ OpenAI')"
```

---

## 📝 Usar en Tu Proyecto

```typescript
// ✅ CORRECTO - Usar servicios desde .dendrita
import { GmailService } from './.dendrita/integrations/services/google/gmail';
import { ChatService } from './.dendrita/integrations/services/openai/chat';

const gmail = new GmailService();
const chat = new ChatService();

// Usar...
```

```typescript
// ❌ INCORRECTO - Exponer credenciales
const apiKey = 'sk-...'; // NO HAGAS ESTO
```

---

## 📚 Ejemplos de Uso

### Buscar Emails

```typescript
import { GmailService } from './.dendrita/integrations/services/google/gmail';

const gmail = new GmailService();
await gmail.authenticate();

const emails = await gmail.searchEmails('from:cliente@example.com', 10);
```

### Usar ChatGPT

```typescript
import { ChatService } from './.dendrita/integrations/services/openai/chat';

const chat = new ChatService();

const response = await chat.sendMessage([
  { role: 'system', content: 'Eres un experto' },
  { role: 'user', content: 'Tu pregunta' }
]);
```

---

## 🚨 Seguridad: Mantén en Mente

| ✅ BIEN | ❌ MAL |
|--------|--------|
| Credenciales en `.env.local` | Credenciales en `.env` con commit |
| `.env.local` en `.gitignore` | `.env.local` no ignorado |
| Rotar keys regularmente | Reutilizar keys por años |
| Logs sin credenciales | Logs con tokens o keys |
| Variables de entorno | Hardcoding en código |

---

## 📞 Troubleshooting

### Credenciales no se cargan

```bash
# Verifica que el archivo existe y tiene permisos
ls -la .dendrita/.env.local

# Verifica que variables están bien formadas
cat .dendrita/.env.local
```

### API retorna 401 (Unauthorized)

- **Google**: El refresh token expiró. Vuelve a ejecutar el script de auth.
- **OpenAI**: El API key es inválido o fue rotado. Verifica en platform.openai.com

### Logs tiene información sensible

- Revisa que no estés loguando directamente credenciales
- El módulo `logger.ts` automáticamente redacta credenciales

---

## 🔄 Próximos Pasos

1. **Integra en tu workflow**: Importa servicios en tus scripts
2. **Implementa manejo de errores**: Usa `error-handler.ts`
3. **Agrega logging**: Usa `createLogger()`
4. **Expande servicios**: Agrega más funcionalidades según necesites

---

## 📖 Referencias

- [README.md](./README.md) - Visión general
- [hooks/google-auth-flow.md](./hooks/google-auth-flow.md) - Setup Google Workspace
- [hooks/openai-key-management.md](./hooks/openai-key-management.md) - Setup OpenAI
- [examples/](./examples/) - Código de ejemplo

