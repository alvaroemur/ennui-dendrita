# Drive Scraper Pipeline

Pipeline para scraping de archivos y carpetas de Google Drive.

## Propósito

Este pipeline sincroniza archivos y carpetas de Google Drive a Supabase, permitiendo:
- Sincronización automática de archivos
- Gestión de múltiples carpetas por workspace
- Configuración flexible por workspace
- Extracción de metadatos, permisos y contenido

## Configuración

### Archivo `config.json`

Configuración centralizada del pipeline con valores por defecto.

### Configuración del Workspace

La configuración específica del workspace se carga desde:
- `workspaces/[workspace]/scrapers-config.json` - Configuración de carpetas Drive

## Uso

```bash
# Scraping para un workspace
ts-node pipelines/drive-scraper-pipeline/drive-scraper.ts [workspace]
```

## Estructura

```
pipelines/drive-scraper-pipeline/
├── config.json              ← Configuración del pipeline
├── drive-scraper.ts          ← Script principal
├── utils.ts                 ← Utilidades compartidas
└── README.md                 ← Esta documentación
```

## Referencias

- `.dendrita/docs/integrations/SCRAPER-CONFIG-DESIGN.md` - Diseño de configuración
- `.dendrita/docs/integrations/SCRAPER-ARCHITECTURE.md` - Arquitectura de scrapers
- `.dendrita/integrations/hooks/drive-scraper-setup.md` - Setup detallado

