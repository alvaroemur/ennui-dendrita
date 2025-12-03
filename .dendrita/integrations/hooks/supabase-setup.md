---
name: supabase-setup
description: "Supabase Setup"
type: documentation
created:
  2025-11-06T00:00:00.000Z
  
updated:
  2025-11-06T00:00:00.000Z
  
tags: ["documentation", "integration"]
category: integration
---

# 🔐 Supabase Setup

Configura Supabase en dendrita sin exponer claves.

---

## Requisitos

- Proyecto en `https://app.supabase.com`
- Tu `Project URL` (ej: `https://wqedbcxitjzfuidjswrb.supabase.co`)
- Tus keys: `anon` (cliente) y `service_role` (servidor)
- (Opcional) URL de base de datos PostgreSQL para tareas server-side

---

## Variables en `.dendrita/.env.local`

Ejemplo (reemplaza con tus datos):

```env
# Supabase
SUPABASE_URL=https://wqedbcxitjzfuidjswrb.supabase.co
SUPABASE_ANON_KEY=sk_pon_aqui_tu_anon_key
# Si usarás scripts del lado servidor (NUNCA en cliente)
SUPABASE_SERVICE_ROLE_KEY=sk_pon_aqui_tu_service_role_key
# (Opcional) conexión directa a Postgres
SUPABASE_DB_URL=postgresql://postgres:YOUR_PASSWORD@db.wqedbcxitjzfuidjswrb.supabase.co:5432/postgres
```

Notas importantes:
- La `anon key` puede usarse en cliente (respeta RLS)
- La `service_role key` es sensible; úsala solo en servidor/scripting
- `.env.local` está en `.gitignore` → nunca se comitea

---

## Cliente de Supabase

En código, usa el servicio incluido:

```ts
import { SupabaseService } from './.dendrita/integrations/services/supabase/client';

const supa = new SupabaseService();
if (!supa.isConfigured()) throw new Error('Supabase not configured');

// Cliente con anon key (cliente)
const client = supa.db(false);

// Cliente con service role (solo servidor)
const serverClient = supa.db(true);
```

---

## Ejemplo rápido (query)

```ts
import { SupabaseService } from './.dendrita/integrations/services/supabase/client';

const supa = new SupabaseService();
const db = supa.db(false);
const { data, error } = await db.from('your_table').select('*').limit(5);
if (error) throw error;
console.log(data);
```

---

## MCP (opcional)

Si usas MCP con Supabase:

- Endpoint de ejemplo (no sensible):
  `https://mcp.supabase.com/mcp?project_ref=wqedbcxitjzfuidjswrb`

Mantén cualquier token/credencial de MCP también en `.env.local`.

---

## Seguridad

- ❌ Nunca hardcodees keys
- ✅ Usa `.env.local` o variables de entorno del sistema
- ✅ Revisa logs; tokens se redactan automáticamente
- ✅ Rota keys cada 3–6 meses

---

## Troubleshooting

- "Supabase not configured": falta `SUPABASE_URL` o keys
- 401/403: revisa RLS, roles y qué key usas (anon vs service_role)
- Conexión DB: valida `SUPABASE_DB_URL` (password correcto)
