# 🔄 Deployment Sync Hook

Sistema de sincronización y ejecución automática de scripts de dendrita desde Google Drive local al servidor remoto.

## Descripción

Este hook implementa un sistema que:
1. Detecta cambios en la carpeta raíz de dendrita (Google Drive local)
2. Sincroniza archivos al servidor remoto según configuración
3. Ejecuta scripts automáticamente según un manifiesto de opciones

## Componentes

### 1. Deployment Manifest (`.dendrita/users/[user-id]/config/deployment-manifest.json`)

Archivo de configuración que define:
- Qué archivos sincronizar (include/exclude)
- Qué scripts ejecutar y cuándo
- Configuración de retry y timeouts
- Configuración de logging

### 2. Sync Script (`.dendrita/integrations/scripts/sync-to-server.ts`)

Script local que:
- Lee el deployment manifest
- Detecta archivos a sincronizar
- Sincroniza archivos al servidor remoto vía SSH
- Ejecuta scripts según configuración

### 3. Server Sync Watcher (`_temp/dev-tools/server/server-sync-watcher.ts`)

Servicio en el servidor remoto que:
- Monitorea cambios en el deployment manifest
- Ejecuta scripts según el schedule configurado
- Maneja retries y errores
- Registra logs

## Uso

### Configuración Inicial

1. **Configurar el manifest**:
   ```bash
   # Editar .dendrita/users/[user-id]/config/deployment-manifest.json
   # Configurar qué scripts ejecutar y cuándo
   ```

2. **Sincronizar inicialmente**:
   ```bash
   npx ts-node .dendrita/integrations/scripts/sync-to-server.ts
   ```

3. **Configurar servicio en servidor**:
   ```bash
   ssh dev "cd /app/dendrita && bash .dendrita/integrations/scripts/setup-server-sync.sh"
   ```

### Sincronización Manual

```bash
# Sincronizar todos los archivos configurados
npx ts-node .dendrita/integrations/scripts/sync-to-server.ts

# Sincronizar archivos específicos
npx ts-node .dendrita/integrations/scripts/sync-to-server.ts file1.ts file2.ts
```

### Sincronización Automática

El sistema puede configurarse para sincronizar automáticamente cuando detecta cambios:

1. **Usando file watcher** (requiere watchman):
   ```bash
   watchman watch .
   watchman -- trigger . dendrita-sync '**/*.ts' -- npx ts-node .dendrita/integrations/scripts/sync-to-server.ts
   ```

2. **Usando git hooks**:
   ```bash
   # Agregar a .git/hooks/post-commit
   npx ts-node .dendrita/integrations/scripts/sync-to-server.ts
   ```

## Configuración del Manifest

### Ejemplo de Script Config

```json
{
  "id": "sync-documents",
  "name": "Sincronizar Documentos",
  "script": ".dendrita/integrations/scripts/sync-documents.ts",
  "enabled": true,
  "schedule": {
    "type": "interval",
    "interval_hours": 24,
    "run_on_sync": true
  },
  "timeout": 300000,
  "retry": {
    "enabled": true,
    "max_attempts": 3,
    "delay_seconds": 60
  }
}
```

### Tipos de Schedule

- **interval**: Ejecuta cada X horas
- **manual**: Solo ejecuta manualmente
- **run_on_sync**: Ejecuta cuando se sincronizan archivos

## Monitoreo

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

## Seguridad

- Las credenciales SSH se cargan desde `.dendrita/.env.local`
- El manifest define qué archivos sincronizar (no todo)
- Los scripts se ejecutan en el servidor con permisos controlados

## Troubleshooting

### El servicio no inicia

1. Verificar que el manifest existe en el servidor
2. Verificar permisos del directorio
3. Verificar logs: `journalctl -u dendrita-sync-watcher`

### Los scripts no se ejecutan

1. Verificar que `enabled: true` en el manifest
2. Verificar que el schedule permite ejecución
3. Verificar logs del servicio

### La sincronización falla

1. Verificar conexión SSH al servidor
2. Verificar que los paths existen
3. Verificar permisos de archivos

