# 🔐 Sincronización de Configuración de Servicios por Usuario

Sistema que sincroniza qué servicios/APIs tiene configurado cada usuario en Supabase **sin exponer credenciales**.

---

## 🎯 Objetivo

Mantener un registro en Supabase de qué servicios están configurados para cada usuario, permitiendo:
- Ver qué usuarios tienen qué servicios configurados
- Analizar adopción de servicios
- Facilitar troubleshooting
- **NUNCA exponer credenciales reales**

---

## 🔒 Seguridad

### ✅ Lo que SÍ se almacena

- **Metadatos de configuración**: Qué servicios están configurados (boolean)
- **Service name**: Nombre del servicio (Google Workspace, OpenAI, etc.)
- **User ID**: Identificador del usuario
- **Last checked**: Última vez que se verificó la configuración
- **Metadata**: Información adicional no sensible

### ❌ Lo que NUNCA se almacena

- **API Keys**: Nunca se almacenan claves de API
- **Client IDs/Secrets**: Nunca se almacenan credenciales OAuth
- **Passwords**: Nunca se almacenan contraseñas
- **Tokens**: Nunca se almacenan tokens de acceso
- **Cualquier credencial**: Nada que pueda usarse para autenticación

---

## 📊 Schema de Base de Datos

### Tabla: `user_service_configs`

```sql
CREATE TABLE IF NOT EXISTS user_service_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  is_configured BOOLEAN NOT NULL DEFAULT false,
  last_checked TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, service_name)
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_user_service_configs_user_id ON user_service_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_service_configs_service_name ON user_service_configs(service_name);
CREATE INDEX IF NOT EXISTS idx_user_service_configs_is_configured ON user_service_configs(is_configured);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_service_configs_updated_at
  BEFORE UPDATE ON user_service_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Campos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | ID único del registro |
| `user_id` | TEXT | ID del usuario (de `.dendrita/users/[user-id]/profile.json`) |
| `service_name` | TEXT | Nombre del servicio (Google Workspace, OpenAI, Supabase, Reddit) |
| `is_configured` | BOOLEAN | Si el servicio está configurado para este usuario |
| `last_checked` | TIMESTAMPTZ | Última vez que se verificó |
| `metadata` | JSONB | Metadatos adicionales (no sensibles) |
| `created_at` | TIMESTAMPTZ | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | Fecha de última actualización |

---

## 🚀 Uso

### Sincronización Manual

```bash
# Desde la raíz del proyecto
npx ts-node .dendrita/integrations/scripts/sync-user-services.ts
```

### Sincronización Automática

Agrega a `sync-all.py` o ejecuta periódicamente:

```python
# En sync-all.py, después de sync stakeholders
print("\n🔐 Syncing user service configs...")
# Ejecutar: npx ts-node .dendrita/integrations/scripts/sync-user-services.ts
```

### Integración con Git Hooks

```bash
# Agregar a post-commit hook
npx ts-node .dendrita/integrations/scripts/sync-user-services.ts > /dev/null 2>&1 || true
```

---

## 📋 Qué Servicios se Detectan

Actualmente detecta:

1. **Google Workspace** (`hasGoogleWorkspace()`)
   - Verifica: `GOOGLE_WORKSPACE_CLIENT_ID`, `GOOGLE_WORKSPACE_CLIENT_SECRET`, `GOOGLE_WORKSPACE_REFRESH_TOKEN`

2. **OpenAI** (`hasOpenAI()`)
   - Verifica: `OPENAI_API_KEY`

3. **Supabase** (`hasSupabase()`)
   - Verifica: `SUPABASE_URL`, `SUPABASE_ANON_KEY`

4. **Reddit** (`hasReddit()`)
   - Verifica: `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USER_AGENT`

---

## 🔍 Consultas Útiles

### Ver configuración de un usuario

```sql
SELECT 
  service_name,
  is_configured,
  last_checked,
  updated_at
FROM user_service_configs
WHERE user_id = '[user-id]'
ORDER BY service_name;
```

### Ver qué usuarios tienen un servicio configurado

```sql
SELECT 
  user_id,
  last_checked,
  updated_at
FROM user_service_configs
WHERE service_name = 'OpenAI' AND is_configured = true
ORDER BY last_checked DESC;
```

### Estadísticas de adopción

```sql
SELECT 
  service_name,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE is_configured = true) as configured_count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE is_configured = true) / COUNT(*), 2) as adoption_rate
FROM user_service_configs
GROUP BY service_name
ORDER BY adoption_rate DESC;
```

### Usuarios con todos los servicios configurados

```sql
SELECT user_id
FROM user_service_configs
WHERE is_configured = true
GROUP BY user_id
HAVING COUNT(*) = (
  SELECT COUNT(DISTINCT service_name) 
  FROM user_service_configs
);
```

---

## 🔄 Idempotencia

El script es **idempotente**: puedes ejecutarlo múltiples veces sin duplicar datos.

**Cómo funciona:**
- Usa `upsert` con `onConflict: 'user_id,service_name'`
- Si existe, actualiza `is_configured` y `last_checked`
- Si no existe, crea nuevo registro

---

## ⚙️ Configuración

### Variables de Entorno

Asegúrate de tener en `.dendrita/.env.local`:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key  # Recomendado para escritura
```

### Verificar Sincronización

```bash
# Ver última sincronización
npx ts-node .dendrita/integrations/scripts/sync-user-services.ts

# Ver en Supabase
# SQL: SELECT * FROM user_service_configs ORDER BY updated_at DESC;
```

---

## 🐛 Troubleshooting

### Error: "Supabase not configured"

Verifica que `.dendrita/.env.local` existe y tiene las credenciales de Supabase.

### Error: "table user_service_configs does not exist"

Ejecuta el SQL de creación de tabla en Supabase (ver sección Schema).

### No se detectan servicios

- Verifica que las variables de entorno están en `.dendrita/.env.local`
- Verifica que el script tiene acceso a leer `.dendrita/.env.local`
- Revisa logs para ver qué servicios se detectan

### Usuarios no encontrados

- Verifica que `.dendrita/users/[user-id]/profile.json` existe
- Verifica que el JSON es válido
- Verifica permisos de lectura

---

## 📊 Monitoreo

### Verificar en Supabase

```sql
-- Ver configuración de todos los usuarios
SELECT 
  user_id,
  service_name,
  is_configured,
  last_checked
FROM user_service_configs
ORDER BY user_id, service_name;

-- Ver últimas actualizaciones
SELECT 
  user_id,
  service_name,
  updated_at
FROM user_service_configs
ORDER BY updated_at DESC
LIMIT 20;
```

---

## 🔐 Seguridad Adicional

### Row Level Security (RLS)

Si implementas RLS en Supabase:

```sql
-- Permitir que usuarios solo vean su propia configuración
ALTER TABLE user_service_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own service configs"
  ON user_service_configs
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- Permitir que service role pueda escribir (para sincronización)
CREATE POLICY "Service role can write"
  ON user_service_configs
  FOR ALL
  USING (auth.role() = 'service_role');
```

---

## 📝 Notas

### Limitación Actual

**Importante:** Actualmente, el script detecta servicios configurados en el **sistema** (`.dendrita/.env.local`), no por usuario individual. Esto significa que todos los usuarios comparten la misma configuración de servicios.

### Futuro: Credenciales por Usuario

Si en el futuro se implementa almacenamiento de credenciales por usuario (ej: `.dendrita/users/[user-id]/.env.local`), el script puede adaptarse para detectar servicios por usuario.

---

**Última actualización**: Sistema de sincronización de servicios implementado ✅

