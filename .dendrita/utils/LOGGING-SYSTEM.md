---
name: logging-system
description: "Sistema de Logging Unificado para Infraestructura Dendrita"
type: documentation
created: 2025-11-06
updated: 2025-11-06
tags: ["documentation", "logging", "infrastructure", "analytics"]
category: infrastructure
---

# 📊 Sistema de Logging Unificado para Infraestructura Dendrita

Sistema centralizado que registra y analiza todos los eventos de la infraestructura de dendrita: hooks, agents, skills, scripts y cambios de infraestructura.

---

## 🎯 Objetivo

Proporcionar visibilidad completa y analizable de toda la actividad de dendrita para:
- **Entender el uso** de componentes
- **Identificar problemas** y errores
- **Optimizar** componentes más usados
- **Auditar** cambios en infraestructura
- **Analizar** patrones de uso

---

## 🏗️ Arquitectura

### Componentes del Sistema

```
.dendrita/
├── utils/
│   ├── dendrita-logger.ts          ← Logger principal
│   ├── dendrita-log-analyzer.ts    ← Utilidades de análisis
│   └── LOGGING-SYSTEM.md           ← Esta documentación
│
└── logs/
    ├── dendrita.jsonl              ← Logs principales (JSONL)
    ├── dendrita.jsonl.1            ← Logs rotados
    ├── dendrita.jsonl.2
    └── ...
```

### Formato de Logs

Los logs se almacenan en formato **JSONL** (JSON Lines) - un JSON por línea:

```json
{"timestamp":"2025-11-06T10:30:00.000Z","id":"1234567890-abc123","level":"info","component_type":"hook","component_name":"session-initialization-verification","component_path":".dendrita/hooks/session-initialization-verification.md","event_type":"read","event_description":"Hook \"session-initialization-verification\" was read","status":"success","metadata":{}}
```

---

## 📝 Tipos de Eventos Registrados

### 1. Hooks (Behavior References)

Cuando Cursor lee y aplica un hook:

```typescript
import { dendritaLogger } from '.dendrita/utils/dendrita-logger';

dendritaLogger.logHookRead(
  'session-initialization-verification',
  '.dendrita/hooks/session-initialization-verification.md',
  {
    user_id: 'alvaro',
    status: 'success',
    duration: 150,
    metadata: {
      scrapers_checked: 2,
      scrapers_executed: 1,
    },
  }
);
```

### 2. Skills (Modular Knowledge)

Cuando se activa un skill:

```typescript
dendritaLogger.logSkillActivation(
  'gestion-proyectos',
  '.dendrita/users/alvaro/skills/gestion-proyectos/SKILL.md',
  {
    user_id: 'alvaro',
    triggered_by: 'skill-activation-prompt-hook-id',
    status: 'success',
    metadata: {
      keywords_matched: ['proyecto', 'tarea'],
    },
  }
);
```

### 3. Agents (Autonomous)

Cuando se activa un agent:

```typescript
dendritaLogger.logAgentActivation(
  'gestor-proyectos',
  '.dendrita/users/alvaro/agents/gestor-proyectos.md',
  {
    user_id: 'alvaro',
    triggered_by: 'gestion-proyectos-skill-id',
    status: 'success',
    metadata: {
      suggested_by: 'skill',
    },
  }
);
```

### 4. Scripts (Executable)

Cuando se ejecuta un script:

```typescript
dendritaLogger.logScriptExecution(
  'calendar-scraper',
  '.dendrita/integrations/scripts/pipelines/calendar-scraper-pipeline/calendar-scraper.ts',
  {
    user_id: 'alvaro',
    workspace: 'ennui',
    status: 'success',
    duration: 5000,
    metadata: {
      events_scraped: 150,
      calendars_processed: 2,
    },
  }
);
```

### 5. Cambios de Infraestructura

Cuando se modifica un componente de dendrita:

```typescript
dendritaLogger.logInfrastructureChange(
  'hook',
  'session-initialization-verification',
  '.dendrita/hooks/session-initialization-verification.md',
  'modify',
  {
    user_id: 'alvaro',
    metadata: {
      changes: ['Added scraper verification'],
    },
  }
);
```

---

## 🔍 Análisis de Logs

### Consultas Básicas

```typescript
import { dendritaLogger } from '.dendrita/utils/dendrita-logger';
import { dendritaLogAnalyzer } from '.dendrita/utils/dendrita-log-analyzer';

// Leer logs recientes
const recentLogs = dendritaLogger.readLogs(100);

// Leer logs de un componente
const hookLogs = dendritaLogger.readComponentLogs('hook', 'session-initialization-verification');

// Leer logs de un usuario
const userLogs = dendritaLogger.readUserLogs('alvaro');
```

### Estadísticas de Componentes

```typescript
// Estadísticas de un componente específico
const stats = dendritaLogAnalyzer.getComponentStats(
  'hook',
  'session-initialization-verification',
  30 // últimos 30 días
);

// Estadísticas de todos los componentes
const allStats = dendritaLogAnalyzer.getAllComponentStats(30);
```

### Estadísticas de Usuarios

```typescript
const userStats = dendritaLogAnalyzer.getUserStats('alvaro', 30);
console.log(`Total events: ${userStats.total_events}`);
console.log(`Components used: ${userStats.components_used}`);
console.log(`Most used:`, userStats.most_used_components);
```

### Reportes Completos

```typescript
// Generar reporte de últimos 30 días
const report = dendritaLogAnalyzer.generateReport(30);

console.log(`Total events: ${report.summary.total_events}`);
console.log(`Error rate: ${report.summary.error_rate}%`);
console.log(`Top components:`, report.top_components);
console.log(`Recent errors:`, report.recent_errors);
```

### Exportar Reportes

```typescript
// Exportar a JSON
dendritaLogAnalyzer.exportReportToJSON(
  30,
  '.dendrita/logs/report-2025-11-06.json'
);

// Exportar a Markdown
dendritaLogAnalyzer.exportReportToMarkdown(
  30,
  '.dendrita/logs/report-2025-11-06.md'
);
```

---

## 🛠️ Integración en Componentes

### En Hooks (Cursor debe aplicar)

Cuando Cursor lee un hook, debe registrar:

```typescript
// En la lógica de aplicación del hook
const hookId = dendritaLogger.logHookRead(
  'session-initialization-verification',
  '.dendrita/hooks/session-initialization-verification.md',
  {
    user_id: detectedUserId,
    status: 'success',
    duration: executionTime,
  }
);
```

### En Scripts

Al inicio del script:

```typescript
import { dendritaLogger } from '../../utils/dendrita-logger';

const scriptId = dendritaLogger.logScriptExecution(
  'calendar-scraper',
  __filename,
  {
    user_id: process.argv[2],
    workspace: process.argv[3],
    status: 'success',
  }
);

// Al finalizar
try {
  // ... ejecución del script ...
  dendritaLogger.log({
    level: 'info',
    component_type: 'script',
    component_name: 'calendar-scraper',
    component_path: __filename,
    event_type: 'execute',
    event_description: 'Script completed',
    status: 'success',
    duration: Date.now() - startTime,
    triggered_by: scriptId,
  });
} catch (error) {
  dendritaLogger.log({
    level: 'error',
    component_type: 'script',
    component_name: 'calendar-scraper',
    component_path: __filename,
    event_type: 'execute',
    event_description: 'Script failed',
    status: 'error',
    error: error.message,
    triggered_by: scriptId,
  });
}
```

---

## 📊 Estructura de Log Entry

```typescript
interface DendritaLogEntry {
  // Identificación
  timestamp: string;        // ISO 8601
  id: string;               // UUID único
  level: LogLevel;          // 'debug' | 'info' | 'warn' | 'error'
  
  // Componente
  component_type: DendritaComponentType;  // 'hook' | 'agent' | 'skill' | 'script' | ...
  component_name: string;                // Nombre del componente
  component_path?: string;               // Ruta relativa
  
  // Contexto
  user_id?: string;         // Usuario relacionado
  workspace?: string;        // Workspace relacionado
  project?: string;         // Proyecto relacionado
  
  // Evento
  event_type: string;       // 'read' | 'activate' | 'execute' | 'modify' | ...
  event_description: string; // Descripción legible
  
  // Detalles
  status?: 'success' | 'error' | 'warning' | 'skipped';
  duration?: number;        // Milisegundos
  error?: string;           // Mensaje de error (sin credenciales)
  
  // Metadata
  metadata?: Record<string, unknown>; // Datos adicionales (sin credenciales)
  
  // Relaciones
  triggered_by?: string;    // ID del evento que lo activó
  related_components?: string[]; // IDs de componentes relacionados
}
```

---

## 🔒 Seguridad

### Redacción Automática

El sistema redacta automáticamente:
- ✅ Tokens de OpenAI (`sk-...`)
- ✅ Bearer tokens (`Bearer ...`)
- ✅ Cualquier campo que contenga palabras clave sensibles:
  - `token`, `password`, `secret`, `key`, `credential`, `apiKey`, `accessToken`, `refreshToken`, `authorization`, `auth`, `clientId`, `clientSecret`
- ✅ Strings largos que parezcan credenciales

### Ejemplo de Redacción

```typescript
// Input:
dendritaLogger.log({
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

---

## 📈 Rotación de Logs

Los logs se rotan automáticamente cuando el archivo alcanza 50MB:
- `dendrita.jsonl` → `dendrita.jsonl.1`
- `dendrita.jsonl.1` → `dendrita.jsonl.2`
- ...
- Se mantienen máximo 20 archivos rotados

---

## 🔍 Queries Útiles

### Componentes más usados

```typescript
const stats = dendritaLogAnalyzer.getAllComponentStats(30);
const top10 = stats.slice(0, 10);
```

### Tasa de error por componente

```typescript
const stats = dendritaLogAnalyzer.getComponentStats('script', 'calendar-scraper', 30);
const errorRate = (stats.error_count / stats.total_events) * 100;
```

### Actividad por usuario

```typescript
const userStats = dendritaLogAnalyzer.getUserStats('alvaro', 30);
```

### Eventos en rango de tiempo

```typescript
const startDate = new Date('2025-11-01');
const endDate = new Date('2025-11-06');
const timeStats = dendritaLogAnalyzer.getTimeRangeStats(startDate, endDate);
```

---

## 📝 Ejemplos de Uso

### Script para generar reporte diario

```typescript
#!/usr/bin/env ts-node
import { dendritaLogAnalyzer } from '.dendrita/utils/dendrita-log-analyzer';
import * as path from 'path';

const report = dendritaLogAnalyzer.generateReport(1); // Últimas 24 horas
const outputPath = path.join(
  __dirname,
  '../logs',
  `report-${new Date().toISOString().split('T')[0]}.md`
);

dendritaLogAnalyzer.exportReportToMarkdown(1, outputPath);
console.log(`Report generated: ${outputPath}`);
```

### Dashboard de uso

```typescript
const report = dendritaLogAnalyzer.generateReport(7); // Última semana

console.log('=== Dendrita Usage Dashboard ===\n');
console.log(`Total Events: ${report.summary.total_events}`);
console.log(`Error Rate: ${report.summary.error_rate.toFixed(2)}%\n`);

console.log('Top 5 Components:');
report.top_components.slice(0, 5).forEach((comp, i) => {
  console.log(`${i + 1}. ${comp.component_name} (${comp.total_events} events)`);
});

console.log('\nRecent Errors:');
report.recent_errors.slice(0, 5).forEach(error => {
  console.log(`- ${error.component_name}: ${error.error}`);
});
```

---

## 🚀 Próximos Pasos

1. **Integrar logging en hooks** - Cursor debe registrar cuando lee hooks
2. **Integrar logging en scripts** - Todos los scripts deben registrar ejecución
3. **Integrar logging en skills/agents** - Registrar activaciones
4. **Crear dashboard visual** - Interfaz web para analizar logs
5. **Alertas automáticas** - Notificar sobre errores o patrones anómalos

---

## 📚 Referencias

- `.dendrita/utils/dendrita-logger.ts` - Implementación del logger
- `.dendrita/utils/dendrita-log-analyzer.ts` - Utilidades de análisis
- `.dendrita/integrations/utils/USAGE-LOGGING.md` - Sistema de logging de integraciones (similar)

---

**Última actualización:** 2025-11-06  
**Versión:** 1.0

