# 📊 Sistema de Logging Interno de Integraciones

Sistema de logging interno que registra automáticamente el uso de todas las integraciones sin exponer credenciales.

## Características

✅ **Seguro**: Nunca expone credenciales o información sensible  
✅ **Automático**: Registra cada uso de integraciones  
✅ **Estructurado**: Almacena en formato JSONL para fácil análisis  
✅ **Estadísticas**: Permite consultar estadísticas de uso  
✅ **Rotación**: Rota logs automáticamente cuando crecen demasiado  

## Estructura

```
.dendrita/integrations/
├── utils/
│   ├── usage-logger.ts      ← Módulo principal de logging
│   ├── usage-stats.ts       ← Utilidades para estadísticas
│   └── usage-tracker.ts     ← Helpers para tracking automático
└── logs/
    └── usage/
        ├── usage.jsonl      ← Logs de uso (JSONL)
        ├── usage.jsonl.1    ← Logs rotados
        └── ...
```

## Uso Básico

### 1. Registro Manual

```typescript
import { logIntegrationUsage } from './utils/usage-logger';

// Registrar uso exitoso
logIntegrationUsage('OpenAI', 'chatCompletion', {
  status: 'success',
  duration: 150,
  metadata: {
    model: 'gpt-4',
    tokens: 150,
  },
});

// Registrar error
logIntegrationUsage('Supabase', 'query', {
  status: 'error',
  duration: 50,
  error: new Error('Connection timeout'),
});
```

### 2. Wrapper Automático

```typescript
import { trackUsage } from './utils/usage-tracker';

class MyService {
  // Método asíncrono
  async fetchData() {
    // ... código ...
  }
}

// Envolver método para tracking automático
const trackedFetchData = trackUsage('MyService', 'fetchData', myService.fetchData.bind(myService));
```

### 3. Usando UsageTracker

```typescript
import { UsageTracker } from './utils/usage-tracker';

async function myOperation() {
  const tracker = new UsageTracker('Supabase', 'syncDocuments', {
    workspace: 'ennui',
  });

  try {
    // ... operación ...
    tracker.success({ documentsSynced: 10 });
  } catch (error) {
    tracker.error(error);
  }
}
```

## Consultar Estadísticas

### Estadísticas de un Servicio

```typescript
import { usageStats } from './utils/usage-stats';

// Estadísticas de OpenAI en los últimos 30 días
const stats = usageStats.getServiceStats('OpenAI', 30);

console.log(`Total de llamadas: ${stats.totalCalls}`);
console.log(`Éxitos: ${stats.successCalls}`);
console.log(`Errores: ${stats.errorCalls}`);
console.log(`Duración promedio: ${stats.averageDuration}ms`);
console.log(`Último uso: ${stats.lastUsed}`);
```

### Reporte Completo

```typescript
import { usageStats, formatStatsReport } from './utils/usage-stats';

// Reporte completo de los últimos 30 días
const report = usageStats.getOverallReport(30);

console.log(formatStatsReport(report));
```

### Reporte de un Servicio Específico

```typescript
const report = usageStats.getServiceReport('OpenAI', 30, 20);

console.log(`Servicio: ${report.service}`);
console.log(`Total: ${report.stats.totalCalls}`);
console.log(`Últimos logs:`, report.recentLogs);
```

## Formato de Logs

Los logs se almacenan en formato JSONL (JSON Lines) en `.dendrita/integrations/logs/usage/usage.jsonl`:

```json
{"timestamp":"2025-01-15T10:30:00.000Z","service":"OpenAI","operation":"chatCompletion","status":"success","duration":150,"metadata":{"model":"gpt-4"}}
{"timestamp":"2025-01-15T10:31:00.000Z","service":"Supabase","operation":"query","status":"error","duration":50,"error":"Connection timeout"}
```

### Estructura de Entrada

```typescript
interface UsageLogEntry {
  timestamp: string;           // ISO 8601
  service: string;              // Nombre del servicio
  operation: string;            // Operación realizada
  status: 'success' | 'error' | 'warning';
  duration?: number;            // Milisegundos
  error?: string;              // Mensaje de error (sin credenciales)
  metadata?: Record<string, unknown>; // Datos adicionales (sin credenciales)
}
```

## Seguridad

### Redacción Automática

El sistema redacta automáticamente:

- ✅ Tokens de OpenAI (`sk-...`)
- ✅ Bearer tokens (`Bearer ...`)
- ✅ Cualquier campo que contenga palabras clave sensibles:
  - `token`, `password`, `secret`, `key`, `credential`, `apiKey`, `accessToken`, `refreshToken`, `authorization`, `auth`
- ✅ Strings largos que parezcan credenciales

### Ejemplo de Redacción

```typescript
// Input:
logIntegrationUsage('OpenAI', 'test', {
  metadata: {
    apiKey: 'sk-abc123...',
    model: 'gpt-4',
  },
});

// Output en log:
{
  "metadata": {
    "apiKey": "[REDACTED]",
    "model": "gpt-4"
  }
}
```

## Rotación de Logs

Los logs se rotan automáticamente cuando el archivo alcanza 10MB:

- `usage.jsonl` → `usage.jsonl.1`
- `usage.jsonl.1` → `usage.jsonl.2`
- ...
- Se mantienen máximo 10 archivos rotados

## Limpieza de Logs Antiguos

```typescript
import { usageLogger } from './utils/usage-logger';

// Mantener solo logs de los últimos 30 días
usageLogger.cleanOldLogs(30);
```

## Lectura de Logs

### Leer Todos los Logs

```typescript
import { usageLogger } from './utils/usage-logger';

// Últimos 100 logs
const logs = usageLogger.readLogs(100);

// Todos los logs
const allLogs = usageLogger.readLogs();
```

### Leer Logs de un Servicio

```typescript
// Últimos 50 logs de OpenAI
const openaiLogs = usageLogger.readServiceLogs('OpenAI', 50);
```

## Integración en Servicios

### Ejemplo: Integración en SupabaseService

```typescript
import { trackUsage } from '../utils/usage-tracker';

export class SupabaseService extends BaseService {
  name = 'Supabase';

  // Método original
  async query(table: string) {
    const client = this.db();
    return client.from(table).select('*');
  }

  // Método con tracking
  query = trackUsage('Supabase', 'query', async (table: string) => {
    const client = this.db();
    return client.from(table).select('*');
  });
}
```

### Ejemplo: Integración en ChatService

```typescript
import { UsageTracker } from '../utils/usage-tracker';

export class ChatService extends BaseService {
  async complete(prompt: string, options?: ChatCompletionOptions) {
    const tracker = new UsageTracker('OpenAI', 'chatCompletion', {
      model: options?.model || 'gpt-4',
    });

    try {
      const result = await this.callAPI(prompt, options);
      tracker.success({ tokens: result.usage?.total_tokens });
      return result;
    } catch (error) {
      tracker.error(error);
      throw error;
    }
  }
}
```

## Ejemplos de Consultas

### Servicios más usados

```typescript
const report = usageStats.getOverallReport(30);
const topServices = report.mostUsedServices.slice(0, 5);

topServices.forEach(({ service, calls }) => {
  console.log(`${service}: ${calls} llamadas`);
});
```

### Operaciones más usadas

```typescript
const report = usageStats.getOverallReport(30);
const topOperations = report.mostUsedOperations.slice(0, 5);

topOperations.forEach(({ service, operation, calls }) => {
  console.log(`${service}.${operation}: ${calls} llamadas`);
});
```

### Tasa de error por servicio

```typescript
const report = usageStats.getOverallReport(30);

for (const [service, stats] of Object.entries(report.services)) {
  const errorRate = (stats.errorCalls / stats.totalCalls) * 100;
  console.log(`${service}: ${errorRate.toFixed(2)}% errores`);
}
```

## Configuración

Los logs se almacenan automáticamente en `.dendrita/integrations/logs/usage/`.

**IMPORTANTE**: Los logs están en `.gitignore` y no se incluyen en el repositorio.

## Referencias

- [usage-logger.ts](./usage-logger.ts) - Implementación del logger
- [usage-stats.ts](./usage-stats.ts) - Utilidades de estadísticas
- [usage-tracker.ts](./usage-tracker.ts) - Helpers para tracking

