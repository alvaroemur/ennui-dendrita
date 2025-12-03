---
name: sync-google-workspace
description: "Sincronización General de Google Workspace"
type: script-documentation
created: 2025-11-06
updated: 2025-11-06
tags: ["script-documentation", "integration"]
category: integration
---

# Sincronización General de Google Workspace

Script general para sincronizar Sheets, Docs, Drive y otros archivos de Google Workspace con el repositorio local.

---

## 🎯 Propósito

Este script permite sincronizar automáticamente archivos de Google Workspace (Sheets, Docs, Drive) con archivos locales en el repositorio, manteniendo la información actualizada y organizada.

---

## 📋 Características

- ✅ **Sincronización de Sheets:** Extrae datos de Google Sheets y genera Markdown o JSON
- ✅ **Sincronización de Docs:** Extrae contenido de Google Docs como texto plano
- ✅ **Sincronización de Drive:** Sincroniza carpetas completas o archivos específicos
- ✅ **Configuración centralizada:** Archivo JSON para definir múltiples sincronizaciones
- ✅ **Procesadores personalizados:** Soporte para procesadores específicos (ej: experiencia-carrera)
- ✅ **Múltiples formatos:** Markdown, JSON o ambos

---

## 🚀 Uso Rápido

### Sincronizar todas las configuraciones predefinidas

```bash
npx tsx .dendrita/integrations/scripts/sync-google-workspace.ts --all
```

### Sincronizar configuración específica

```bash
npx tsx .dendrita/integrations/scripts/sync-google-workspace.ts --config experiencia-carrera
```

### Sincronizar Sheet específico

```bash
npx tsx .dendrita/integrations/scripts/sync-google-workspace.ts \
  --type sheets \
  --file-id 1r-yIuqjZ6FKjDzo4wxakJkoLnpA-lwFYTC6P-P6NwOE \
  --output workspaces/personal/data \
  --format markdown
```

### Sincronizar Doc específico

```bash
npx tsx .dendrita/integrations/scripts/sync-google-workspace.ts \
  --type docs \
  --file-id <doc-id> \
  --output workspaces/personal/docs \
  --format markdown
```

### Sincronizar carpeta de Drive

```bash
npx tsx .dendrita/integrations/scripts/sync-google-workspace.ts \
  --type drive \
  --folder-id <folder-id> \
  --output workspaces/personal/drive-sync \
  --format both
```

---

## ⚙️ Configuración

### Archivo de configuración

Las sincronizaciones se configuran en `.dendrita/integrations/config/sync-config.json`:

```json
{
  "syncs": [
    {
      "name": "experiencia-carrera",
      "enabled": true,
      "type": "sheets",
      "source": {
        "fileId": "1r-yIuqjZ6FKjDzo4wxakJkoLnpA-lwFYTC6P-P6NwOE",
        "name": "Experiencia Álvaro Mur",
        "sheetName": "Proyectos"
      },
      "destination": {
        "path": "workspaces/personal/active-projects/experiencia-carrera",
        "format": "markdown",
        "filename": "experiencia-profesional.md"
      },
      "options": {
        "extractContent": true,
        "extractMetadata": true,
        "updateExisting": true,
        "customProcessor": "sync-experience-from-sheets"
      }
    }
  ],
  "defaults": {
    "format": "markdown",
    "extractContent": true,
    "extractMetadata": true,
    "updateExisting": true
  }
}
```

### Agregar nueva sincronización

1. **Editar `sync-config.json`** y agregar una nueva entrada en `syncs`:

```json
{
  "name": "mi-sincronizacion",
  "enabled": true,
  "type": "sheets",
  "source": {
    "fileId": "<file-id>",
    "name": "Mi Sheet",
    "sheetName": "Datos"
  },
  "destination": {
    "path": "workspaces/personal/data",
    "format": "markdown",
    "filename": "mi-datos.md"
  }
}
```

2. **Ejecutar sincronización:**

```bash
npx tsx .dendrita/integrations/scripts/sync-google-workspace.ts --config mi-sincronizacion
```

---

## 📝 Opciones de Línea de Comandos

### Opciones principales

- `--all`: Sincronizar todas las configuraciones predefinidas
- `--config <nombre>`: Sincronizar configuración predefinida específica
- `--type <tipo>`: Tipo de sincronización (`sheets`|`docs`|`drive`|`all`)
- `--file-id <id>`: ID del archivo de Google
- `--folder-id <id>`: ID de la carpeta de Google Drive
- `--query <query>`: Query de búsqueda de Google Drive
- `--output <path>`: Ruta de destino
- `--format <formato>`: Formato de salida (`markdown`|`json`|`both`)

### Ejemplos de queries de Drive

```bash
# Buscar todos los Sheets
--query "mimeType = 'application/vnd.google-apps.spreadsheet'"

# Buscar Docs con nombre específico
--query "mimeType = 'application/vnd.google-apps.document' and name contains 'Reporte'"

# Buscar archivos modificados recientemente
--query "modifiedTime > '2025-01-01T00:00:00'"
```

---

## 🔧 Procesadores Personalizados

Para sincronizaciones complejas, puedes usar procesadores personalizados:

```json
{
  "options": {
    "customProcessor": "sync-experience-from-sheets"
  }
}
```

El script buscará un archivo `sync-<nombre-procesador>.ts` en el directorio de scripts y lo ejecutará.

---

## 📊 Formatos de Salida

### Markdown

Genera archivos `.md` con el contenido formateado:
- Para Sheets: Tabla con los datos
- Para Docs: Texto plano del documento

### JSON

Genera archivos `.json` con los datos estructurados:
- Para Sheets: Array de objetos con los datos
- Para Docs: Objeto con metadatos y contenido

### Both

Genera ambos formatos (Markdown y JSON).

---

## 🔄 Automatización

### Git Hook (post-commit)

Agregar sincronización automática después de cada commit:

```bash
cat > .git/hooks/post-commit << 'EOF'
#!/bin/bash
cd "$(git rev-parse --show-toplevel)"
npx tsx .dendrita/integrations/scripts/sync-google-workspace.ts --all > /dev/null 2>&1 || true
EOF

chmod +x .git/hooks/post-commit
```

### Cron Job

Sincronización periódica (cada hora):

```bash
crontab -e

# Agregar:
0 * * * * cd /ruta/a/ennui-dendrita && npx tsx .dendrita/integrations/scripts/sync-google-workspace.ts --all >> /tmp/dendrita-sync.log 2>&1
```

---

## 📌 Notas Importantes

1. **Autenticación:** Requiere Google Workspace configurado (ver `.dendrita/docs/integrations/SETUP.md`)
2. **Permisos:** Los archivos de Google deben ser accesibles con las credenciales configuradas
3. **Actualización:** Los archivos existentes se actualizan si `updateExisting: true`
4. **Procesadores personalizados:** Deben exportar una función que acepte la configuración

---

## 🔗 Referencias

- **Configuración:** `.dendrita/integrations/config/sync-config.json`
- **Script:** `.dendrita/integrations/scripts/sync-google-workspace.ts`
- **Setup:** `.dendrita/docs/integrations/SETUP.md`
- **Ejemplo específico:** `.dendrita/integrations/scripts/sync-experience-from-sheets.ts`

---

*Este script facilita la sincronización automática de archivos de Google Workspace con el repositorio local.*

