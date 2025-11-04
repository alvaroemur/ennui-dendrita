# 🔐 Sincronización de Configuración de Servicios - Guía Rápida

## ✅ Tabla Creada

Si ya creaste la tabla `user_service_configs` en Supabase, puedes ejecutar la sincronización.

---

## 🚀 Ejecutar Sincronización

### Opción 1: Sincronización Completa (Recomendado)

```bash
# Desde la raíz del proyecto
python3 .dendrita/integrations/scripts/sync-all.py
```

Esto sincroniza:
- ✅ Workspaces
- ✅ Projects  
- ✅ Documents
- ✅ Stakeholders
- ✅ **User Service Configs** (nuevo)

### Opción 2: Solo Servicios de Usuario

```bash
# Desde la raíz del proyecto
npx ts-node .dendrita/integrations/scripts/sync-user-services.ts
```

---

## 📋 Qué se Sincroniza

Para cada usuario encontrado en `.dendrita/users/`, se sincroniza:

| Servicio | Detectado si existe |
|----------|-------------------|
| **Google Workspace** | `GOOGLE_WORKSPACE_CLIENT_ID` |
| **OpenAI** | `OPENAI_API_KEY` |
| **Supabase** | `SUPABASE_URL` |
| **Reddit** | `REDDIT_CLIENT_ID` |

**Importante:** Solo se almacena si está configurado (boolean), **NUNCA las credenciales reales**.

---

## ✅ Verificar Sincronización

### En Supabase

```sql
-- Ver configuración de todos los usuarios
SELECT 
  user_id,
  service_name,
  is_configured,
  last_checked,
  updated_at
FROM user_service_configs
ORDER BY user_id, service_name;

-- Ver estadísticas
SELECT 
  service_name,
  COUNT(*) FILTER (WHERE is_configured = true) as configured_count,
  COUNT(*) FILTER (WHERE is_configured = false) as not_configured_count
FROM user_service_configs
GROUP BY service_name;
```

---

## 🔍 Troubleshooting

### Error: "table user_service_configs does not exist"

Ejecuta el SQL de creación de tabla en `.dendrita/integrations/hooks/user-services-sync.md` (sección Schema).

### No se detectan usuarios

Verifica que `.dendrita/users/[user-id]/profile.json` existe y tiene `user_id`.

### No se detectan servicios

Verifica que `.dendrita/.env.local` tiene las variables de entorno correspondientes.

---

## 📚 Documentación Completa

Ver `.dendrita/integrations/hooks/user-services-sync.md` para documentación completa.

---

**¡Listo para sincronizar!** 🎉

