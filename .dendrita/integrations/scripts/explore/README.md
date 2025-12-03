---
name: readme
description: "Scripts de Exploración"
type: documentation
created: 2025-11-06
updated: 2025-11-06
tags: ["documentation", "integration", "readme"]
category: integration
---

# Scripts de Exploración

Scripts para explorar qué se puede sincronizar entre dendrita y herramientas de gestión de proyectos.

## Uso

### ClickUp

```bash
# Ejecutar exploración de ClickUp
npx ts-node .dendrita/integrations/explore/clickup-explore.ts
```

O desde TypeScript:

```typescript
import { exploreClickUp } from './.dendrita/integrations/explore/clickup-explore';

await exploreClickUp();
```

### Asana

```bash
# Ejecutar exploración de Asana
npx ts-node .dendrita/integrations/explore/asana-explore.ts
```

### Notion

```bash
# Ejecutar exploración de Notion
npx ts-node .dendrita/integrations/explore/notion-explore.ts
```

## Qué Hacen

Cada script de exploración:

1. Se autentica con la herramienta
2. Lista la estructura disponible (workspaces, projects, tasks, etc.)
3. Muestra cómo se mapearía a la estructura de dendrita
4. Identifica qué se puede sincronizar y qué no
5. Muestra limitaciones y consideraciones

## Requisitos

- Credenciales configuradas en `.env.local`
- Ver documentación de setup en `hooks/[tool]-setup.md`

