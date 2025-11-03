# Integrations System - API Connections

## Overview

This directory contains the configuration and logic for connecting dendrita with external APIs. The system is designed to:

- ✅ **Keep secrets secure** - All credentials stored in `.dendrita/settings.local.json` (gitignored)
- ✅ **Never expose system information** - Account names, file paths, and work details remain private
- ✅ **Centralize API logic** - All integrations managed in one place
- ✅ **Be extensible** - Easy to add new providers

---

## Architecture

### File Structure

```
.dendrita/integrations/
├── README.md                          ← You are here
├── providers/                         ← Provider implementations
│   ├── google/
│   │   ├── config.schema.json        ← Configuration schema
│   │   ├── README.md                 ← Provider documentation
│   │   └── connector.ts              ← Connection logic
│   ├── openai/
│   │   ├── config.schema.json
│   │   ├── README.md
│   │   └── connector.ts
│   └── [provider]/
├── core/                              ← Shared integration logic
│   ├── base-connector.ts             ← Abstract connector interface
│   ├── auth-manager.ts               ← Authentication handling
│   └── integration-registry.ts       ← Provider registry
├── types.ts                           ← TypeScript type definitions
├── integrations.local.schema.json    ← Local secrets schema (example)
└── integrations.config.json          ← Public configuration
```

---

## How It Works

### 1. Configuration Hierarchy

**Public Configuration** (tracked in git):
- `.dendrita/integrations/integrations.config.json` - Public settings, provider availability, scopes

**Private Configuration** (NOT tracked, in `.gitignore`):
- `.dendrita/settings.local.json` - Your credentials and secrets

### 2. Secret Management

All secrets are stored in **`.dendrita/settings.local.json`** with this structure:

```json
{
  "integrations": {
    "google": {
      "credentials": {
        "client_id": "your-client-id",
        "client_secret": "your-client-secret",
        "redirect_uri": "http://localhost:3000/auth/google/callback"
      },
      "tokens": {
        "access_token": "cached-token",
        "refresh_token": "refresh-token",
        "expires_at": 1234567890
      }
    },
    "openai": {
      "api_key": "sk-your-key-here"
    }
  }
}
```

**⚠️ IMPORTANT:** This file is in `.gitignore` and should NEVER be committed.

### 3. Provider Registration

Providers are automatically discovered and registered in `.dendrita/integrations/integrations.config.json`:

```json
{
  "providers": {
    "google": {
      "enabled": true,
      "type": "oauth2",
      "scopes": ["drive", "calendar", "gmail"]
    },
    "openai": {
      "enabled": true,
      "type": "api_key",
      "model": "gpt-4"
    }
  }
}
```

---

## Available Providers

### Google Workspace

**Status:** 🟢 Configured  
**Type:** OAuth 2.0  
**Services:**
- Gmail
- Calendar
- Drive

See: `.dendrita/integrations/providers/google/README.md`

### OpenAI

**Status:** 🟢 Configured  
**Type:** API Key  
**Features:**
- Chat completions
- Embeddings
- Vision (if enabled)

See: `.dendrita/integrations/providers/openai/README.md`

---

## Usage Examples

### In Cursor/Scripting Context

```typescript
// Import the integration manager
import { IntegrationManager } from './.dendrita/integrations/core/integration-registry';

// Initialize
const manager = new IntegrationManager();

// Connect to Google
const googleConnector = await manager.getConnector('google');
const emails = await googleConnector.listEmails({ limit: 10 });

// Connect to OpenAI
const openaiConnector = await manager.getConnector('openai');
const response = await openaiConnector.chat({
  message: "What are my upcoming calendar events?"
});
```

### In Apps Script

Google Apps Script can also leverage these integrations through the Integrations API.

---

## Adding a New Provider

To add a new provider (e.g., Slack, Notion, etc.):

1. Create directory: `.dendrita/integrations/providers/[provider-name]/`
2. Create required files:
   - `README.md` - Provider documentation
   - `config.schema.json` - Configuration schema
   - `connector.ts` - Implementation
3. Update `integrations.config.json` to register the provider
4. Add credentials to `.dendrita/settings.local.json`

See `.dendrita/integrations/providers/google/` for reference implementation.

---

## Security Checklist

- ✅ Never commit `.dendrita/settings.local.json`
- ✅ Never log or expose credentials
- ✅ All tokens cached with expiration
- ✅ Use environment-specific configuration
- ✅ Validate all API responses
- ✅ Implement proper error handling without exposing secrets

---

## Troubleshooting

### Provider Not Found
Check that `.dendrita/integrations/integrations.config.json` has the provider enabled.

### Authentication Failed
Verify credentials in `.dendrita/settings.local.json` are correct and not expired.

### Missing Scopes
Update the provider configuration and re-authenticate to get new token with expanded scopes.

---

## Next Steps

1. Configure your Google OAuth credentials
2. Add your OpenAI API key
3. Run initialization: `node .dendrita/integrations/setup.js`
4. Test connections: `node .dendrita/integrations/test.js`
