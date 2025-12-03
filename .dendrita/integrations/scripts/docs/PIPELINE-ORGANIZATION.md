---
name: pipeline-organization
description: "Guía de Organización de Scripts por Pipelines"
type: documentation
created: 2025-11-06
updated: 2025-11-06
tags: ["documentation", "integration", "scripts"]
category: integration
---

# 🚀 Guía de Organización de Scripts por Pipelines

Esta guía establece los principios y patrones para organizar scripts en dendrita siguiendo el paradigma de pipelines.

---

## 📋 Principios Fundamentales

### 1. **Reutilización Primero**
- ✅ **Siempre buscar scripts existentes** antes de crear nuevos
- ✅ **Mejorar scripts existentes** en lugar de duplicar funcionalidad
- ✅ **Reutilizar utilidades comunes** entre pipelines

### 2. **Organización por Pipelines**
- ✅ **Agrupar scripts relacionados** en carpetas de pipeline
- ✅ **Un pipeline = un flujo de trabajo coherente**
- ✅ **Scripts independientes** solo si no pertenecen a ningún pipeline

### 3. **Configuración Externa**
- ✅ **Nunca hardcodear configuración** en scripts
- ✅ **Usar JSON, CSV o consultas** para configuración
- ✅ **Separar configuración de lógica**

---

## 🏗️ Estructura de Pipelines

### Estructura Estándar

```
.dendrita/integrations/scripts/
├── pipelines/
│   ├── [pipeline-name]/
│   │   ├── config.json              ← Configuración del pipeline (JSON)
│   │   ├── [pipeline-name].ts       ← Script principal del pipeline
│   │   ├── utils.ts                 ← Utilidades específicas del pipeline
│   │   ├── types.ts                 ← Tipos TypeScript (si aplica)
│   │   └── README.md                 ← Documentación del pipeline
│   │
│   ├── calendar-scraper-pipeline/
│   │   ├── config.json              ← Configuración de calendarios
│   │   ├── calendar-scraper.ts      ← Script principal
│   │   ├── utils.ts                 ← Utilidades (parsing, validación, etc.)
│   │   └── README.md
│   │
│   ├── drive-scraper-pipeline/
│   │   ├── config.json              ← Configuración de carpetas Drive
│   │   ├── drive-scraper.ts         ← Script principal
│   │   ├── utils.ts                 ← Utilidades (extracción, matching, etc.)
│   │   └── README.md
│   │
│   └── sync-pipeline/
│       ├── config.json              ← Configuración de sincronizaciones
│       ├── sync-documents.ts         ← Sincronización de documentos
│       ├── sync-user-services.ts    ← Sincronización de servicios
│       ├── utils.ts                  ← Utilidades compartidas
│       └── README.md
│
├── [standalone-scripts].ts           ← Solo si no pertenecen a un pipeline
└── README.md                          ← Documentación general
```

---

## 📝 Ejemplo: Calendar Scraper Pipeline

### Estructura

```
pipelines/calendar-scraper-pipeline/
├── config.json
├── calendar-scraper.ts
├── utils.ts
└── README.md
```

### `config.json`

```json
{
  "_comment": "Configuración del Calendar Scraper Pipeline",
  "default_settings": {
    "time_min_offset_days": -30,
    "time_max_offset_days": 90,
    "max_results": 2500,
    "single_events": true,
    "sync_attendees": true,
    "sync_metadata": true
  },
  "calendars": [
    {
      "calendar_id": "primary",
      "calendar_name": "Calendario principal",
      "enabled": true,
      "time_min_offset_days": -30,
      "time_max_offset_days": 365
    }
  ],
  "filters": {
    "exclude_all_day": true,
    "exclude_declined": true,
    "exclude_cancelled": true
  }
}
```

### `calendar-scraper.ts`

```typescript
import * as fs from 'fs';
import * as path from 'path';
import { CalendarService } from '../../services/google/calendar';
import { loadConfig } from './utils';

interface CalendarScraperConfig {
  default_settings: {
    time_min_offset_days: number;
    time_max_offset_days: number;
    max_results: number;
    single_events: boolean;
    sync_attendees: boolean;
    sync_metadata: boolean;
  };
  calendars: Array<{
    calendar_id: string;
    calendar_name: string;
    enabled: boolean;
    time_min_offset_days?: number;
    time_max_offset_days?: number;
  }>;
  filters: {
    exclude_all_day: boolean;
    exclude_declined: boolean;
    exclude_cancelled: boolean;
  };
}

async function main() {
  // 1. Cargar configuración desde JSON
  const config = loadConfig<CalendarScraperConfig>('config.json');
  
  // 2. Inicializar servicio
  const calendarService = new CalendarService();
  
  // 3. Ejecutar pipeline según configuración
  for (const calendar of config.calendars) {
    if (!calendar.enabled) continue;
    
    const settings = {
      ...config.default_settings,
      ...calendar
    };
    
    await scrapeCalendar(calendarService, settings, config.filters);
  }
}

async function scrapeCalendar(
  service: CalendarService,
  settings: any,
  filters: any
) {
  // Lógica de scraping usando configuración
  // ...
}

main().catch(console.error);
```

### `utils.ts`

```typescript
import * as fs from 'fs';
import * as path from 'path';

/**
 * Carga configuración desde archivo JSON en el mismo directorio del pipeline
 */
export function loadConfig<T>(filename: string): T {
  const configPath = path.join(__dirname, filename);
  
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }
  
  const configContent = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(configContent);
}

/**
 * Valida configuración de calendario
 */
export function validateCalendarConfig(config: any): boolean {
  // Validación de configuración
  return true;
}
```

---

## 🔄 Migración de Scripts Existentes

### Paso 1: Identificar Scripts Relacionados

Buscar scripts que:
- Comparten funcionalidad similar
- Usan las mismas fuentes de datos
- Tienen dependencias entre sí

**Ejemplo:**
- `calendar-scraper.ts`
- `scrape-calendar-events-sheet.ts`
- `test-calendar.ts`
- `verify-calendar-setup.ts`

→ Todos pertenecen a `calendar-scraper-pipeline/`

### Paso 2: Crear Estructura de Pipeline

```bash
mkdir -p pipelines/calendar-scraper-pipeline
```

### Paso 3: Mover y Reorganizar Scripts

```
pipelines/calendar-scraper-pipeline/
├── config.json              ← Nueva: extraer configuración
├── calendar-scraper.ts      ← Movido desde scripts/
├── scrape-events-sheet.ts   ← Movido desde scripts/
├── test-calendar.ts         ← Movido desde scripts/
├── verify-setup.ts           ← Movido desde scripts/
├── utils.ts                 ← Nueva: utilidades compartidas
└── README.md                 ← Nueva: documentación
```

### Paso 4: Extraer Configuración

**Antes (hardcoded):**
```typescript
const timeMinOffset = -30;
const timeMaxOffset = 90;
const maxResults = 2500;
```

**Después (config.json):**
```json
{
  "default_settings": {
    "time_min_offset_days": -30,
    "time_max_offset_days": 90,
    "max_results": 2500
  }
}
```

### Paso 5: Actualizar Imports

**Antes:**
```typescript
import { CalendarService } from '../../services/google/calendar';
```

**Después:**
```typescript
import { CalendarService } from '../../../services/google/calendar';
import { loadConfig } from './utils';
```

---

## 📊 Configuración: JSON vs CSV vs Queries

### Cuándo Usar JSON

✅ **Usar JSON para:**
- Configuración estructurada (objetos anidados)
- Configuración de pipelines
- Parámetros de ejecución
- Opciones de filtrado

**Ejemplo:**
```json
{
  "calendars": [
    {
      "calendar_id": "primary",
      "enabled": true,
      "settings": {
        "time_range": { "min": -30, "max": 90 }
      }
    }
  ]
}
```

### Cuándo Usar CSV

✅ **Usar CSV para:**
- Datos tabulares (mapping tables)
- Lookup tables
- Datos que se editan frecuentemente en Excel/Sheets
- Listas simples de valores

**Ejemplo:**
```csv
calendar_id,calendar_name,enabled
primary,Calendario principal,true
work@example.com,Calendario trabajo,true
```

### Cuándo Usar Queries (Supabase/Sheets)

✅ **Usar queries para:**
- Configuración dinámica que cambia frecuentemente
- Configuración compartida entre usuarios
- Configuración que requiere validación en tiempo real
- Configuración que depende de datos externos

**Ejemplo:**
```typescript
// Cargar desde Supabase
const configs = await supabase
  .from('calendar_scraping_configs')
  .select('*')
  .eq('user_id', userId)
  .eq('enabled', true);
```

---

## 🔍 Búsqueda de Scripts Existentes

### Antes de Crear un Nuevo Script

1. **Buscar por funcionalidad:**
   ```bash
   # Buscar scripts relacionados
   grep -r "calendar" .dendrita/integrations/scripts/
   ```

2. **Revisar pipelines existentes:**
   - ¿Existe un pipeline similar?
   - ¿Puedo extender un pipeline existente?
   - ¿Puedo reutilizar utilidades de otro pipeline?

3. **Revisar utilidades compartidas:**
   - `.dendrita/integrations/utils/` - Utilidades generales
   - `pipelines/[pipeline]/utils.ts` - Utilidades específicas

4. **Si no existe, crear siguiendo estructura:**
   - Crear carpeta de pipeline
   - Extraer configuración a JSON/CSV
   - Documentar en README.md

---

## 📚 Documentación de Pipelines

Cada pipeline debe tener un `README.md` que incluya:

```markdown
# [Pipeline Name]

## Propósito
Descripción breve del pipeline y qué hace.

## Configuración
Cómo configurar el pipeline (archivo config.json, variables, etc.)

## Uso
```bash
# Ejemplo de uso
ts-node pipelines/[pipeline-name]/[pipeline-name].ts
```

## Dependencias
- Servicios requeridos
- Credenciales necesarias
- Configuración previa

## Estructura
- `config.json` - Configuración del pipeline
- `[pipeline-name].ts` - Script principal
- `utils.ts` - Utilidades específicas

## Ejemplos
Ejemplos de configuración y uso
```

---

## ✅ Checklist de Creación de Pipeline

- [ ] Busqué scripts existentes similares
- [ ] Identifiqué scripts relacionados para agrupar
- [ ] Creé estructura de carpeta de pipeline
- [ ] Extraje configuración a JSON/CSV/query
- [ ] Moví scripts relacionados al pipeline
- [ ] Creé `utils.ts` con utilidades compartidas
- [ ] Actualicé imports y referencias
- [ ] Creé `README.md` con documentación
- [ ] Probé que el pipeline funciona con configuración externa
- [ ] Documenté dependencias y requisitos

---

## 🎯 Ejemplos de Pipelines Existentes

### Neuron Pipeline (Google Apps Script)
**Ubicación:** `_temp/neuron/gas/`

**Estructura:**
```
neuron/gas/
├── core.config.js           ← Configuración centralizada
├── pipeline.calendar.js     ← Pipeline de calendario
├── pipeline.email.js        ← Pipeline de email
├── pipeline.transcripts.js  ← Pipeline de transcripciones
└── ...
```

**Características:**
- ✅ Configuración centralizada en `core.config.js`
- ✅ Scripts organizados por funcionalidad (pipeline.*)
- ✅ Utilidades compartidas en `core.config.js`

---

## 🔗 Referencias

- `.dendrita/docs/integrations/SCRAPER-CONFIG-DESIGN.md` - Diseño de configuración de scrapers
- `.dendrita/docs/integrations/SCRAPER-ARCHITECTURE.md` - Arquitectura de scrapers
- `.dendrita/users/alvaro/work-modes/user-work-mode.md` - Preferencias de trabajo del usuario

---

**Última actualización:** 2025-11-06
**Versión:** 1.0

