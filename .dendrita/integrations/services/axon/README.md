---
name: readme
description: "Servicio de Integración con Axon"
type: documentation
created:
  2025-11-06T00:00:00.000Z
  
updated:
  2025-11-06T00:00:00.000Z
  
tags: ["documentation", "integration", "readme"]
category: integration
---

# Servicio de Integración con Axon

Este servicio permite acceder a datos de Axon (Chrome extension de scraping de WhatsApp) desde ennui-dendrita.

## ¿Qué es Axon?

Axon es una Chrome extension que hace scraping de WhatsApp por `contacto@axon`. Es el "brazo de la neurona" que captura información de conversaciones desde múltiples fuentes.

## Estructura

```
.dendrita/integrations/services/axon/
├── README.md              # Este archivo
├── SCHEMA.md              # Documentación del esquema de tablas
├── AXON-MODIFICATIONS.md  # Recomendaciones para mejorar Axon
└── connector.ts          # Servicio TypeScript para acceder a datos
```

## Uso Rápido

### 1. Verificar Tablas en Supabase

Primero, verifica qué tablas existen en Supabase:

```bash
npx ts-node .dendrita/integrations/scripts/list-supabase-tables.ts
```

Esto mostrará todas las tablas, identificando cuáles pertenecen a Axon.

### 2. Inspeccionar Esquema de Tablas

Para ver el esquema de una tabla específica:

```bash
npx ts-node .dendrita/integrations/scripts/inspect-table-schema.ts contacts
npx ts-node .dendrita/integrations/scripts/inspect-table-schema.ts whatsapp_messages
```

### 3. Usar el Conector

```typescript
import { AxonConnector } from '.dendrita/integrations/services/axon/connector';

// Inicializar
const axon = new AxonConnector();

// Detectar nombres de tablas automáticamente
await axon.detectTableNames();

// Obtener contactos
const contacts = await axon.getContacts({ limit: 50 });

// Obtener mensajes
const messages = await axon.getMessages({ limit: 100 });

// Obtener conversaciones
const conversations = await axon.getConversations({ limit: 20 });
```

## Documentación

- **[SCHEMA.md](./SCHEMA.md)**: Documentación completa del esquema de tablas de Axon
- **[AXON-MODIFICATIONS.md](./AXON-MODIFICATIONS.md)**: Recomendaciones para mejorar la estructura de datos de Axon

## Características

- ✅ Detección automática de nombres de tablas
- ✅ Mapeo flexible de columnas
- ✅ Soporte para búsqueda y filtrado
- ✅ Tipos TypeScript para type safety
- ✅ Integración con Supabase existente

## Requisitos

- Supabase configurado en `.dendrita/.env.local`
- Acceso a las tablas de Axon en Supabase
- Permisos RLS (Row Level Security) configurados apropiadamente

## Próximos Pasos

1. Ejecutar `list-supabase-tables.ts` para identificar tablas reales
2. Ejecutar `inspect-table-schema.ts` para cada tabla de Axon
3. Revisar `AXON-MODIFICATIONS.md` para sugerencias de mejoras
4. Actualizar `SCHEMA.md` con la estructura real encontrada
5. Usar `AxonConnector` en tus scripts/proyectos

