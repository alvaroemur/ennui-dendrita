# PM Tools Sync Pipeline

Pipeline para sincronización bidireccional con herramientas de gestión de proyectos (ClickUp, Asana, Notion).

## ⚠️ Estado: En Desarrollo

Este pipeline está en desarrollo activo. La funcionalidad básica está implementada, pero algunas características avanzadas aún están pendientes.

## Propósito

Este pipeline sincroniza proyectos y tareas entre dendrita y herramientas de gestión de proyectos externas:
- **ClickUp** - Sincronización bidireccional de proyectos y tareas
- **Asana** - Sincronización bidireccional de proyectos y tareas
- **Notion** - Sincronización bidireccional de databases y páginas

## Características

- ✅ Sincronización unidireccional: `tool_to_dendrita` (desde herramienta externa hacia dendrita)
- ⚠️ Sincronización bidireccional: `bidirectional` (parcialmente implementado)
- ✅ Resolución de conflictos cuando ambos lados cambian
- ✅ Mapeo automático entre estructuras de datos
- ⚠️ Sincronización incremental (pendiente)
- ⚠️ Sincronización programada (pendiente)

## Uso

```bash
# Ejemplo: Sincronizar desde ClickUp hacia dendrita
ts-node examples/clickup-sync-test.ts

# Ejemplo: Sincronizar desde Asana hacia dendrita
ts-node examples/asana-sync-test.ts

# Ejemplo: Sincronizar desde Notion hacia dendrita
ts-node examples/notion-sync-test.ts
```

## Estructura

```
pm-tools-sync-pipeline/
├── bidirectional-sync.ts    ← Motor de sincronización bidireccional genérico
├── conflict-resolution.ts    ← Resolución de conflictos
├── types.ts                  ← Tipos para sincronización bidireccional
└── README.md                 ← Esta documentación
```

## Referencias

- `.dendrita/integrations/services/clickup/` - Servicio de ClickUp
- `.dendrita/integrations/services/asana/` - Servicio de Asana
- `.dendrita/integrations/services/notion/` - Servicio de Notion
- `.dendrita/integrations/hooks/project-management-sync.md` - Setup detallado
- `.dendrita/integrations/examples/` - Ejemplos de uso

## Estado de Implementación

### Completado ✅
- [x] Autenticación para las tres herramientas
- [x] Clientes API para las tres herramientas
- [x] Mappers para convertir entre estructuras
- [x] Motor de sincronización básico (`tool_to_dendrita`)
- [x] Resolución de conflictos
- [x] Ejemplos de uso

### Pendiente ⚠️
- [ ] Sincronización `dendrita_to_tool` completa
- [ ] Sincronización bidireccional completa
- [ ] Tracking de última sincronización
- [ ] Sincronización incremental (solo cambios)
- [ ] Sincronización programada (cron)
- [ ] Manejo de errores más robusto
- [ ] Validación de datos antes de sincronizar
- [ ] Tests unitarios y de integración

