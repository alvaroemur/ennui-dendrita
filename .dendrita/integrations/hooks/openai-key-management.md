---
name: openai-key-management
description: "OpenAI API Key Management"
type: documentation
created:
  2025-11-06T00:00:00.000Z
  
updated:
  2025-11-06T00:00:00.000Z
  
tags: ["documentation", "integration"]
category: integration
---

# 🔐 OpenAI API Key Management

Guía simple para configurar OpenAI en dendrita.

---

## Requisitos Previos

1. Cuenta en [OpenAI Platform](https://platform.openai.com)
2. Acceso a [API Keys page](https://platform.openai.com/api-keys)
3. Plan de pago configurado (para usar APIs)

---

## Paso 1: Crear API Key

1. Ve a [OpenAI Platform](https://platform.openai.com)
2. Login con tu cuenta
3. Navigate to **API keys** in the left sidebar
4. Click "Create new secret key"
5. Dale un nombre descriptivo: `dendrita-workspace`
6. **Copia el key** (comienza con `sk-`)

---

## Paso 2: Guardar en `.env.local`

En `.dendrita/.env.local`:

```env
OPENAI_API_KEY=sk-tu_api_key_aqui
```

**IMPORTANTE**:
- ❌ NUNCA compartas este key
- ❌ NUNCA lo comitees
- ❌ NUNCA lo pases por chat o email
- ✅ Guárdalo SOLO en `.env.local`
- ✅ Ese archivo está en `.gitignore`

---

## Paso 3: Verificar Configuración

```bash
# Verifica que se cargó correctamente
node -e "require('./utils/credentials').credentials.getOpenAIKey() && console.log('✅ OpenAI configured')"
```

---

## Uso

```typescript
import { ChatService } from './.dendrita/integrations/services/openai/chat';

const chat = new ChatService();

// Enviar mensaje
const response = await chat.sendMessage([
  {
    role: 'system',
    content: 'Eres un asistente útil'
  },
  {
    role: 'user',
    content: '¿Cuál es la capital de Perú?'
  }
]);

console.log(response); // "La capital de Perú es Lima"

// Crear embeddings
const embedding = await chat.createEmbedding('texto para vectorizar');
```

---

## Seguridad

### ✅ Buenas prácticas

```typescript
// ✅ BIEN - Carga desde credenciales
import { ChatService } from './services/openai/chat';
const chat = new ChatService();
```

### ❌ Nunca hagas

```javascript
// ❌ MAL - Hardcodear key
const apiKey = 'sk-abc123...';
const client = new OpenAI({ apiKey });

// ❌ MAL - Subir a GitHub
// .env.local expuesto en commit
```

---

## Administración de Keys

### Ver todas tus keys

En [API Keys page](https://platform.openai.com/api-keys):
- ✅ Ver última 4 dígitos
- ✅ Ver fecha de creación
- ✅ Ver último uso

### Rotar keys (cambiar periódicamente)

1. En API Keys page:
   - Click ⋯ junto a la key
   - "Delete"
2. Crea una nueva key
3. Actualiza `.env.local`

**Frecuencia recomendada**: Cada 3-6 meses

### Si la key se expone accidentalmente

1. **INMEDIATAMENTE** ve a API Keys page
2. Delete la key comprometida
3. Crea una nueva key
4. Actualiza `.env.local`
5. Commit `git` para limpiar historial

---

## Costos y Límites

- **Modelos**: `gpt-4`, `gpt-4-turbo`, `gpt-3.5-turbo`, etc.
- **Pricing**: Por token (input + output)
- **Rate limits**: Configurables en tu cuenta

Estimaciones de costo:
- `gpt-3.5-turbo`: $0.0005 / 1K input tokens
- `gpt-4-turbo`: $0.03 / 1K input tokens
- `gpt-4`: $0.03 / 1K input tokens

---

## Troubleshooting

### "401 Invalid Authentication"
- API key es inválida o expirada
- Verifica en `OPENAI_API_KEY` en `.env.local`
- Comprueba que no tiene espacios en blanco

### "Rate limit exceeded"
- Usaste demasiadas requests en poco tiempo
- Usa exponential backoff retry
- Verifica tu límite en platform.openai.com

### "Insufficient quota"
- Tu plan no tiene crédito suficiente
- Agrega crédito en [Billing](https://platform.openai.com/account/billing/overview)

---

## Referencias

- [OpenAI API Docs](https://platform.openai.com/docs)
- [Chat Completions](https://platform.openai.com/docs/guides/gpt)
- [Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [Pricing](https://openai.com/pricing)
