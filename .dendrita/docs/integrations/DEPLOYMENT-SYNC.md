# 🔄 Sistema de Sincronización y Ejecución Automática

Sistema que detecta cambios en dendrita (Google Drive local) y sincroniza automáticamente al servidor remoto, ejecutando scripts según un manifiesto de configuración.

## 📋 Descripción

Este sistema permite:
1. **Detectar cambios** en la carpeta raíz de dendrita (Google Drive local)
2. **Sincronizar archivos** al servidor remoto automáticamente
3. **Ejecutar scripts** según un manifiesto de opciones configurable

## 🏗️ Arquitectura

```
┌─────────────────────────────────────┐
│  Google Drive (Local)               │
│  ┌───────────────────────────────┐ │
│  │ dendrita/                     │ │
│  │ ├── .dendrita/                │ │
│  │ │   ├── deployment-manifest   │ │
│  │ │   └── integrations/         │ │
│  │ └── ...                       │ │
│  └───────────────────────────────┘ │
└──────────────┬──────────────────────┘
               │
               │ watch-and-sync.ts
               │ (detecta cambios)
               │
               ▼
┌─────────────────────────────────────┐
│  sync-to-server.ts                   │
│  (sincroniza vía SSH)                │
└──────────────┬──────────────────────┘
               │
               │ SSH
               │
               ▼
┌─────────────────────────────────────┐
│  Servidor Remoto                     │
│  ┌───────────────────────────────┐ │
│  │ /app/dendrita/                │ │
│  │ ├── .dendrita/                │ │
│  │ │   ├── deployment-manifest   │ │
│  │ │   └── integrations/         │ │
│  │ └── ...                       │ │
│  └───────────────────────────────┘ │
│                                      │
│  server-sync-watcher.ts              │
│  (monitorea y ejecuta scripts)      │
└─────────────────────────────────────┘
```

## 🚀 Configuración Inicial

### 1. Configurar el Deployment Manifest

Edita `.dendrita/deployment-manifest.json`:

```json
{
  "sync": {
    "enabled": true,
    "target": {
      "host": "dev",
      "path": "/app/dendrita"
    },
    "include": [
      ".dendrita/integrations/scripts/**/*.ts",
      ".dendrita/deployment-manifest.json"
    ]
  },
  "scripts": {
    "enabled": true,
    "scripts": [
      {
        "id": "sync-documents",
        "enabled": true,
        "schedule": {
          "type": "interval",
          "interval_hours": 24,
          "run_on_sync": true
        }
      }
    ]
  }
}
```

### 2. Sincronización Inicial

```bash
# Sincronizar archivos al servidor
npx ts-node .dendrita/integrations/scripts/sync-to-server.ts
```

### 3. Configurar Servicio en Servidor

```bash
# Subir script de setup al servidor
scp .dendrita/integrations/scripts/setup-server-sync.sh dev:/app/dendrita/.dendrita/integrations/scripts/

# Ejecutar setup en servidor
ssh dev "cd /app/dendrita && bash .dendrita/integrations/scripts/setup-server-sync.sh"

# Iniciar servicio
ssh dev "systemctl start dendrita-sync-watcher"
```

## 📝 Uso

### Sincronización Manual

```bash
# Sincronizar todos los archivos configurados
npx ts-node .dendrita/integrations/scripts/sync-to-server.ts

# Sincronizar archivos específicos
npx ts-node .dendrita/integrations/scripts/sync-to-server.ts file1.ts file2.ts
```

### Sincronización Automática (File Watching)

```bash
# Iniciar watcher que detecta cambios automáticamente
npx ts-node .dendrita/integrations/scripts/watch-and-sync.ts
```

El watcher:
- Detecta cambios en `.dendrita/` y archivos raíz
- Espera 5 segundos (debounce) antes de sincronizar
- Sincroniza automáticamente al servidor
- Ejecuta scripts según `run_on_sync: true`

### Sincronización con Git Hooks

Agregar a `.git/hooks/post-commit`:

```bash
#!/bin/bash
npx ts-node .dendrita/integrations/scripts/sync-to-server.ts
```

### Sincronización con Cron

```bash
# Sincronizar cada hora
0 * * * * cd /path/to/dendrita && npx ts-node .dendrita/integrations/scripts/sync-to-server.ts
```

## ⚙️ Configuración del Manifest

### Tipos de Schedule

1. **interval**: Ejecuta cada X horas
   ```json
   {
     "type": "interval",
     "interval_hours": 24,
     "run_on_sync": true
   }
   ```

2. **manual**: Solo ejecuta manualmente
   ```json
   {
     "type": "manual",
     "run_on_sync": false
   }
   ```

### Configuración de Retry

```json
{
  "retry": {
    "enabled": true,
    "max_attempts": 3,
    "delay_seconds": 60
  }
}
```

### Configuración de Timeout

```json
{
  "timeout": 300000  // 5 minutos en milisegundos
}
```

## 📊 Monitoreo

### Ver Logs del Servicio

```bash
ssh dev "tail -f /app/dendrita/.dendrita/logs/sync-watcher.log"
```

### Ver Estado del Servicio

```bash
ssh dev "systemctl status dendrita-sync-watcher"
```

### Reiniciar Servicio

```bash
ssh dev "systemctl restart dendrita-sync-watcher"
```

## 🔧 Troubleshooting

### El servicio no inicia

1. Verificar que el manifest existe:
   ```bash
   ssh dev "ls -la /app/dendrita/.dendrita/deployment-manifest.json"
   ```

2. Verificar logs:
   ```bash
   ssh dev "journalctl -u dendrita-sync-watcher -n 50"
   ```

### Los scripts no se ejecutan

1. Verificar que `enabled: true` en el manifest
2. Verificar que el schedule permite ejecución
3. Verificar logs del servicio

### La sincronización falla

1. Verificar conexión SSH:
   ```bash
   ssh dev "echo 'Connection OK'"
   ```

2. Verificar que los paths existen en el servidor
3. Verificar permisos de archivos

## 📁 Archivos del Sistema

- `.dendrita/deployment-manifest.json` - Configuración principal
- `.dendrita/integrations/scripts/sync-to-server.ts` - Script de sincronización local
- `.dendrita/integrations/scripts/watch-and-sync.ts` - File watcher
- `.dendrita/integrations/scripts/server-sync-watcher.ts` - Servicio en servidor
- `.dendrita/integrations/scripts/setup-server-sync.sh` - Setup del servicio
- `.dendrita/integrations/hooks/deployment-sync.md` - Documentación del hook

## 🔐 Seguridad

- Las credenciales SSH se cargan desde `.dendrita/.env.local`
- El manifest define qué archivos sincronizar (no todo)
- Los scripts se ejecutan en el servidor con permisos controlados
- Los logs no contienen información sensible

