---
name: supabase-sync
description: "Sincronización Automática con Supabase"
type: documentation
created:
  2025-11-06T00:00:00.000Z
  
updated:
  2025-11-06T00:00:00.000Z
  
tags: ["documentation", "integration"]
category: integration
---

# 🔄 Sincronización Automática con Supabase

Cómo mantener dendrita sincronizado con Supabase automáticamente.

---

## ✅ Estado Actual

**Sincronización completa implementada:**
- ✅ Workspaces (7 sincronizados)
- ✅ Projects (3 sincronizados)
- ✅ Documents (16 sincronizados)
- ✅ Stakeholders (8 sincronizados)
- ✅ User Service Configs (configuración de servicios por usuario)

---

## 🚀 Sincronización Manual

### Ejecutar sincronización completa

```bash
cd /ruta/a/ennui-dendrita
npx ts-node .dendrita/integrations/scripts/sync/sync-all.ts
```

**Qué sincroniza:**
1. **Workspaces**: Todos los workspaces con su `config-estilo.json` y README
2. **Projects**: Proyectos activos y archivados
3. **Documents**: Todos los archivos `.md` de proyectos (con contenido)
4. **Stakeholders**: Todos los JSON en `stakeholders/fichas-json/`
5. **User Service Configs**: Configuración de servicios por usuario (sin exponer credenciales)

---

## 🤖 Sincronización Automática

### Opción 1: Git Hooks (Recomendado)

Crea un hook post-commit que sincronice automáticamente:

```bash
# Crear hook
cat > .git/hooks/post-commit << 'EOF'
#!/bin/bash
# Sincronizar con Supabase después de cada commit
cd "$(git rev-parse --show-toplevel)"
npx ts-node .dendrita/integrations/scripts/sync/sync-all.ts > /dev/null 2>&1 || true
EOF

chmod +x .git/hooks/post-commit
```

**Ventajas:**
- ✅ Se ejecuta automáticamente después de cada commit
- ✅ No requiere configuración adicional
- ✅ Solo sincroniza cuando hay cambios

### Opción 2: Cron Job (Servidor/Mac)

Ejecuta sincronización periódica:

```bash
# Editar crontab
crontab -e

# Agregar (cada hora)
0 * * * * cd /ruta/a/ennui-dendrita && npx ts-node .dendrita/integrations/scripts/sync/sync-all.ts >> /tmp/dendrita-sync.log 2>&1
```

### Opción 3: Watch Script

Ejecuta sincronización cuando detecta cambios:

```bash
# Instalar watchman (Mac)
brew install watchman

# Crear watch
watchman watch .
watchman -- trigger . dendrita-sync '**/*.md' -- npx ts-node .dendrita/integrations/scripts/sync/sync-all.ts
```

---

## 📋 Qué se Sincroniza

### 1. Workspaces

- **Código**: `workspaces/[nombre]/`
- **Config**: `config-estilo.json` → `style_config` en DB
- **Descripción**: `README.md` → `description` en DB
- **Metadata**: Info de estructura de archivos

### 2. Projects

- **Código**: `active-projects/[nombre]/` y `_archived-projects/[nombre]/`
- **Estado**: `active` o `archived` según ubicación
- **Metadata**: Ruta del proyecto

### 3. Documents

- **Archivos**: Todos los `.md` en proyectos
- **Contenido**: Texto completo del archivo
- **Tipo**: `current_context`, `master_plan`, `tasks`, `readme`, `other`
- **Slug**: `projectCode/filename` (único por workspace)

### 4. Stakeholders

- **Archivos**: `stakeholders/fichas-json/*.json`
- **Datos**: Nombre, tipo, contactos, metadata completa
- **Actualización**: Se actualiza si existe mismo nombre en workspace

---

## 🔄 Idempotencia

El script es **idempotente**: puedes ejecutarlo múltiples veces sin duplicar datos.

**Cómo funciona:**
- Workspaces: Identificados por `code` (único)
- Projects: Identificados por `workspace_id + code` (único)
- Documents: Identificados por `workspace_id + slug` (único)
- Stakeholders: Identificados por `workspace_id + name` (único)

Si existe, se actualiza; si no, se crea.

---

## ⚙️ Configuración

### Variables de Entorno

Asegúrate de tener en `.dendrita/.env.local`:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key  # Recomendado para upsert
```

### Verificar Sincronización

```bash
# Ver última sincronización
npx ts-node .dendrita/integrations/scripts/sync/sync-all.ts

# Ver logs
tail -f /tmp/dendrita-sync.log  # Si usas cron
```

---

## 🐛 Troubleshooting

### Error: "SUPABASE_URL required"

Verifica que `.dendrita/.env.local` existe y tiene las credenciales.

### Error: "401 Unauthorized"

- Verifica que `SUPABASE_ANON_KEY` es válida
- Si usas RLS, usa `SUPABASE_SERVICE_ROLE_KEY` para sincronización

### Error: "409 Conflict"

Normal - significa que el registro ya existe y se actualizará.

### Documentos no se sincronizan

- Verifica que el archivo `.md` existe y es legible
- Verifica que el proyecto está en `active-projects/` o `_archived-projects/`

---

## 📊 Monitoreo

### Verificar en Supabase

```sql
-- Ver workspaces sincronizados
SELECT code, name, updated_at FROM workspaces ORDER BY updated_at DESC;

-- Ver proyectos
SELECT w.code as workspace, p.code as project, p.status, p.updated_at
FROM projects p
JOIN workspaces w ON p.workspace_id = w.id
ORDER BY p.updated_at DESC;

-- Ver documentos
SELECT w.code as workspace, p.code as project, d.title, d.doc_type, d.updated_at
FROM documents d
JOIN projects p ON d.project_id = p.id
JOIN workspaces w ON d.workspace_id = w.id
ORDER BY d.updated_at DESC
LIMIT 20;

-- Ver stakeholders
SELECT w.code as workspace, s.name, s.kind, s.updated_at
FROM stakeholders s
JOIN workspaces w ON s.workspace_id = w.id
ORDER BY s.updated_at DESC;
```

---

## 🔐 Seguridad

- ✅ Script usa variables de entorno (nunca hardcodea credenciales)
- ✅ `.env.local` está en `.gitignore`
- ✅ Service role key solo para sincronización (no en cliente)
- ✅ Logs no contienen información sensible

---

## 📝 Próximos Pasos

1. **Configurar auto-sync**: Elige una opción (hooks, cron, watch)
2. **Monitorear**: Revisa logs periódicamente
3. **Actualizar**: Ejecuta sync manual antes de cambios importantes
4. **Verificar**: Consulta Supabase para confirmar sincronización

---

**Última actualización**: Sincronización completa funcionando ✅

