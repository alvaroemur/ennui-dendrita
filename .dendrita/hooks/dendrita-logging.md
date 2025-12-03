---
name: dendrita-logging
description: "Hook para registrar eventos de infraestructura dendrita"
type: hook
created:
  2025-11-06T00:00:00.000Z
  
updated:
  2025-11-06T00:00:00.000Z
  
tags: ["hook", "logging", "infrastructure", "analytics"]
category: behavior-reference
---

# 📊 Dendrita Logging Hook

Hook que define el comportamiento esperado para registrar eventos de la infraestructura de dendrita.

---

## 🎯 Propósito

Este hook documenta el comportamiento esperado para que Cursor registre automáticamente todos los eventos de la infraestructura de dendrita usando el sistema de logging unificado.

---

## 📋 Comportamiento Esperado

### 1. Cuando Cursor lee un Hook

**Comportamiento esperado:**

Cuando Cursor lee un hook de `.dendrita/hooks/`, debe registrar el evento:

```typescript
import { dendritaLogger } from '.dendrita/utils/dendrita-logger';

// Al leer un hook
const hookId = dendritaLogger.logHookRead(
  'session-initialization-verification',
  '.dendrita/hooks/session-initialization-verification.md',
  {
    user_id: detectedUserId,
    status: 'success',
    duration: executionTime,
    metadata: {
      scrapers_checked: 2,
      scrapers_executed: 1,
    },
  }
);
```

**Ejemplos de hooks que deben registrarse:**
- `session-initialization-verification` - Al inicio de cada conversación
- `skill-activation-prompt` - Al evaluar activación de skills
- `dendrita-alias-activation` - Al detectar mención de alias
- `dendrita-infrastructure-modification` - Al detectar cambios en infraestructura
- `dendrita-communication` - Al registrar cambios en timeline

---

### 2. Cuando se Activa un Skill

**Comportamiento esperado:**

Cuando un skill se activa según `skill-rules.json`, registrar:

```typescript
const skillId = dendritaLogger.logSkillActivation(
  'gestion-proyectos',
  '.dendrita/users/alvaro/skills/gestion-proyectos/SKILL.md',
  {
    user_id: 'alvaro',
    triggered_by: hookId, // ID del hook que lo activó
    status: 'success',
    metadata: {
      keywords_matched: ['proyecto', 'tarea'],
      intent_matched: 'project-management',
    },
  }
);
```

---

### 3. Cuando se Activa un Agent

**Comportamiento esperado:**

Cuando un agent se activa (sugerido por skill o explícitamente), registrar:

```typescript
const agentId = dendritaLogger.logAgentActivation(
  'gestor-proyectos',
  '.dendrita/users/alvaro/agents/gestor-proyectos.md',
  {
    user_id: 'alvaro',
    triggered_by: skillId, // ID del skill que lo sugirió
    status: 'success',
    metadata: {
      suggested_by: 'skill',
      skill_name: 'gestion-proyectos',
    },
  }
);
```

---

### 4. Cuando se Ejecuta un Script

**Comportamiento esperado:**

Al inicio de la ejecución de un script, registrar:

```typescript
import { dendritaLogger } from '../../utils/dendrita-logger';

const startTime = Date.now();
const scriptId = dendritaLogger.logScriptExecution(
  'calendar-scraper',
  __filename,
  {
    user_id: process.argv[2],
    workspace: process.argv[3],
    status: 'success',
  }
);

try {
  // ... ejecución del script ...
  
  // Al finalizar exitosamente
  dendritaLogger.log({
    level: 'info',
    component_type: 'script',
    component_name: 'calendar-scraper',
    component_path: __filename,
    event_type: 'execute',
    event_description: 'Script completed successfully',
    status: 'success',
    duration: Date.now() - startTime,
    triggered_by: scriptId,
    metadata: {
      events_scraped: 150,
      calendars_processed: 2,
    },
  });
} catch (error) {
  // Al fallar
  dendritaLogger.log({
    level: 'error',
    component_type: 'script',
    component_name: 'calendar-scraper',
    component_path: __filename,
    event_type: 'execute',
    event_description: 'Script failed',
    status: 'error',
    duration: Date.now() - startTime,
    error: error.message,
    triggered_by: scriptId,
  });
  throw error;
}
```

---

### 5. Cuando se Modifica Infraestructura

**Comportamiento esperado:**

Cuando se detecta un cambio en `.dendrita/` (hook, agent, skill, script), registrar:

```typescript
dendritaLogger.logInfrastructureChange(
  'hook', // o 'agent', 'skill', 'script'
  'session-initialization-verification',
  '.dendrita/hooks/session-initialization-verification.md',
  'modify', // o 'create', 'delete'
  {
    user_id: 'alvaro',
    metadata: {
      changes: ['Added scraper verification'],
      files_modified: ['.dendrita/hooks/session-initialization-verification.md'],
    },
  }
);
```

**Nota:** Este registro debe hacerse automáticamente cuando se detecta un cambio, antes de que el hook `dendrita-communication` registre el cambio en timeline.

---

## 🔄 Flujo de Registro

### Flujo Típico de Activación

```
1. Usuario inicia conversación
   └──> Cursor lee session-initialization-verification
        └──> dendritaLogger.logHookRead(...) [ID: hook-1]

2. Usuario envía prompt
   └──> Cursor lee skill-activation-prompt
        └──> dendritaLogger.logHookRead(...) [ID: hook-2]
        └──> Detecta match con skill "gestion-proyectos"
             └──> dendritaLogger.logSkillActivation(..., triggered_by: hook-2) [ID: skill-1]
             └──> Skill sugiere agent "gestor-proyectos"
                  └──> dendritaLogger.logAgentActivation(..., triggered_by: skill-1) [ID: agent-1]

3. Agent ejecuta script
   └──> dendritaLogger.logScriptExecution(...) [ID: script-1]
        └──> Script ejecuta
             └──> dendritaLogger.log({ ..., triggered_by: script-1 })
```

---

## 📊 Análisis de Logs

### Consultar Logs

```typescript
import { dendritaLogger } from '.dendrita/utils/dendrita-logger';
import { dendritaLogAnalyzer } from '.dendrita/utils/dendrita-log-analyzer';

// Leer logs recientes
const recentLogs = dendritaLogger.readLogs(100);

// Estadísticas de un componente
const stats = dendritaLogAnalyzer.getComponentStats('hook', 'session-initialization-verification', 30);

// Generar reporte
const report = dendritaLogAnalyzer.generateReport(30);
```

### Generar Reporte

```bash
# Generar reporte de últimos 30 días en markdown
ts-node .dendrita/integrations/scripts/utils/generate-dendrita-report.ts 30 markdown

# Generar reporte de últimos 7 días en JSON
ts-node .dendrita/integrations/scripts/utils/generate-dendrita-report.ts 7 json
```

---

## ✅ Checklist de Implementación

Para cada componente de dendrita:

- [ ] **Hooks**: Registrar cuando Cursor lee un hook
- [ ] **Skills**: Registrar cuando se activa un skill
- [ ] **Agents**: Registrar cuando se activa un agent
- [ ] **Scripts**: Registrar al inicio y fin de ejecución
- [ ] **Infraestructura**: Registrar cambios en `.dendrita/`

---

## 🔗 Referencias

- `.dendrita/utils/dendrita-logger.ts` - Implementación del logger
- `.dendrita/utils/dendrita-log-analyzer.ts` - Utilidades de análisis
- `.dendrita/utils/LOGGING-SYSTEM.md` - Documentación completa del sistema
- `.dendrita/integrations/scripts/utils/generate-dendrita-report.ts` - Script para generar reportes

---

## 📝 Notas Importantes

1. **Los logs son seguros**: El sistema redacta automáticamente credenciales e información sensible.

2. **Los logs son analizables**: Formato JSONL permite análisis fácil con herramientas estándar.

3. **Los logs se rotan automáticamente**: Cuando alcanzan 50MB, se rotan automáticamente.

4. **Los logs están en `.gitignore`**: No se incluyen en el repositorio por defecto.

---

**Última actualización:** 2025-11-06  
**Versión:** 1.0

