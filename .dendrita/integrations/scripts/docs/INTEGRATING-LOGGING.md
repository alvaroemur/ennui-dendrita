---
name: integrating-logging
description: "Guía para integrar logging de dendrita en scripts"
type: documentation
created: 2025-11-06
updated: 2025-11-06
tags: ["documentation", "logging", "scripts", "integration"]
category: integration
---

# 🔧 Guía para Integrar Logging de Dendrita en Scripts

Guía paso a paso para integrar el sistema de logging unificado de dendrita en scripts existentes.

---

## 📋 Resumen

El sistema de logging de dendrita registra automáticamente:
- **Inicio de ejecución** de scripts
- **Éxito o error** al finalizar
- **Duración** de ejecución
- **Metadata** relevante (archivos procesados, errores, etc.)

---

## 🚀 Integración Básica

### Paso 1: Importar dendritaLogger

```typescript
import { dendritaLogger } from '../../utils/dendrita-logger';
import * as path from 'path';
```

### Paso 2: Agregar logging al inicio de main()

```typescript
async function main(): Promise<void> {
  const startTime = Date.now();
  const scriptPath = __filename;
  const scriptName = path.basename(scriptPath, path.extname(scriptPath));
  
  let scriptId: string | undefined;

  try {
    // Registrar inicio de ejecución
    scriptId = dendritaLogger.logScriptExecution(
      scriptName,
      scriptPath,
      {
        user_id: process.argv[2], // Si aplica
        workspace: process.argv[3], // Si aplica
        status: 'success',
      }
    );

    // ... resto del código ...
```

### Paso 3: Registrar éxito al finalizar

```typescript
    // ... código del script ...

    // Registrar éxito
    dendritaLogger.log({
      level: 'info',
      component_type: 'script',
      component_name: scriptName,
      component_path: scriptPath,
      user_id: userId, // Si aplica
      workspace: workspace, // Si aplica
      event_type: 'execute',
      event_description: 'Script completed successfully',
      status: 'success',
      duration: Date.now() - startTime,
      triggered_by: scriptId,
      metadata: {
        // Metadata relevante
        files_processed: 10,
        errors: 0,
      },
    });
  } catch (error: any) {
    // Registrar error
    dendritaLogger.log({
      level: 'error',
      component_type: 'script',
      component_name: scriptName,
      component_path: scriptPath,
      user_id: userId, // Si aplica
      workspace: workspace, // Si aplica
      event_type: 'execute',
      event_description: 'Script failed',
      status: 'error',
      duration: Date.now() - startTime,
      error: error.message,
      triggered_by: scriptId,
    });

    logger.error('Script failed', error);
    throw error;
  }
}
```

---

## 📝 Ejemplo Completo

### Antes (sin logging)

```typescript
import { createLogger } from '../utils/logger';

const logger = createLogger('MyScript');

async function main(): Promise<void> {
  try {
    logger.info('Starting script...');
    // ... código ...
    logger.info('Script completed');
  } catch (error) {
    logger.error('Script failed', error);
    process.exit(1);
  }
}
```

### Después (con logging de dendrita)

```typescript
import { createLogger } from '../utils/logger';
import { dendritaLogger } from '../../utils/dendrita-logger';
import * as path from 'path';

const logger = createLogger('MyScript');

async function main(): Promise<void> {
  const startTime = Date.now();
  const scriptPath = __filename;
  const scriptName = path.basename(scriptPath, path.extname(scriptPath));
  
  let scriptId: string | undefined;

  try {
    // Registrar inicio
    scriptId = dendritaLogger.logScriptExecution(
      scriptName,
      scriptPath,
      {
        status: 'success',
      }
    );

    logger.info('Starting script...');
    // ... código ...
    
    const filesProcessed = 10;
    const errors = 0;

    // Registrar éxito
    dendritaLogger.log({
      level: 'info',
      component_type: 'script',
      component_name: scriptName,
      component_path: scriptPath,
      event_type: 'execute',
      event_description: 'Script completed successfully',
      status: 'success',
      duration: Date.now() - startTime,
      triggered_by: scriptId,
      metadata: {
        files_processed: filesProcessed,
        errors,
      },
    });

    logger.info('Script completed');
  } catch (error: any) {
    // Registrar error
    dendritaLogger.log({
      level: 'error',
      component_type: 'script',
      component_name: scriptName,
      component_path: scriptPath,
      event_type: 'execute',
      event_description: 'Script failed',
      status: 'error',
      duration: Date.now() - startTime,
      error: error.message,
      triggered_by: scriptId,
    });

    logger.error('Script failed', error);
    process.exit(1);
  }
}
```

---

## 🛠️ Usando el Helper (Opcional)

Para scripts más simples, puedes usar el helper `withDendritaLogging`:

```typescript
import { withDendritaLogging } from '../utils/script-logging-helper';

async function main(): Promise<void> {
  return await withDendritaLogging(async () => {
    // Tu código aquí
    const result = await doSomething();
    return result;
  }, {
    user_id: process.argv[2],
    workspace: process.argv[3],
    metadata: {
      custom_field: 'value',
    },
  });
}
```

---

## ✅ Checklist de Integración

- [ ] Importar `dendritaLogger` y `path`
- [ ] Agregar variables `startTime`, `scriptPath`, `scriptName`, `scriptId`
- [ ] Registrar inicio con `logScriptExecution()`
- [ ] Registrar éxito al finalizar con `dendritaLogger.log()`
- [ ] Registrar error en `catch` con `dendritaLogger.log()`
- [ ] Incluir metadata relevante (archivos procesados, errores, etc.)
- [ ] Incluir `user_id` y `workspace` si aplica
- [ ] Incluir `triggered_by: scriptId` en eventos de éxito/error

---

## 📊 Metadata Recomendada

Incluye metadata relevante según el tipo de script:

### Scripts de Scraping
```typescript
metadata: {
  total_items_scraped: 150,
  items_created: 100,
  items_updated: 50,
  errors: 0,
  sources_processed: 2,
}
```

### Scripts de Sincronización
```typescript
metadata: {
  total_files_synced: 50,
  files_created: 10,
  files_updated: 40,
  workspaces_processed: 3,
  projects_processed: 5,
}
```

### Scripts de Análisis
```typescript
metadata: {
  documents_analyzed: 20,
  relationships_detected: 15,
  tags_generated: 30,
  errors: 0,
}
```

---

## 🔗 Referencias

- `.dendrita/utils/dendrita-logger.ts` - Implementación del logger
- `.dendrita/utils/LOGGING-SYSTEM.md` - Documentación completa del sistema
- `.dendrita/integrations/scripts/utils/script-logging-helper.ts` - Helper opcional
- Ejemplos integrados:
  - `calendar-scraper.ts` - Script de scraping
  - `drive-scraper.ts` - Script de scraping
  - `sync-documents.ts` - Script de sincronización
  - `sync-user-services.ts` - Script de sincronización
  - `enrich-documents-with-ai.ts` - Script de análisis

---

**Última actualización:** 2025-11-06  
**Versión:** 1.0

