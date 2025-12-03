# Dendrita Utils

Utilidades centralizadas para la infraestructura de dendrita.

## Sistema de Logging

### Archivos

- `dendrita-logger.ts` - Logger principal para registrar eventos de dendrita
- `dendrita-log-analyzer.ts` - Utilidades para analizar logs
- `LOGGING-SYSTEM.md` - Documentación completa del sistema de logging
- `integrations/scripts/utils/generate-dendrita-report.ts` - Script para generar reportes

### Uso Rápido

```typescript
import { dendritaLogger } from '.dendrita/utils/dendrita-logger';
import { dendritaLogAnalyzer } from '.dendrita/utils/dendrita-log-analyzer';

// Registrar evento
dendritaLogger.logHookRead('session-initialization-verification', '.dendrita/hooks/session-initialization-verification.md', {
  user_id: 'alvaro',
  status: 'success',
});

// Generar reporte
const report = dendritaLogAnalyzer.generateReport(30);
```

### Generar Reporte

```bash
ts-node .dendrita/integrations/scripts/utils/generate-dendrita-report.ts 30 markdown
```

## Documentación

Ver `.dendrita/utils/LOGGING-SYSTEM.md` para documentación completa.

