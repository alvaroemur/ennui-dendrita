---
name: notion-setup
description: "Notion Setup Guide"
type: documentation
created:
  2025-11-06T00:00:00.000Z
  
updated:
  2025-11-06T00:00:00.000Z
  
tags: ["documentation", "integration"]
category: integration
---

# Notion Setup Guide

Guía paso a paso para configurar la integración con Notion.

## Requisitos

- Cuenta de Notion (gratuita o de pago)
- Integration Token de Notion

## Paso 1: Crear Notion Integration

1. Ve a [Notion Integrations](https://www.notion.so/my-integrations)
2. Haz clic en **New integration**
3. Completa los campos:
   - **Name**: `dendrita-integration` (o el nombre que prefieras)
   - **Workspace**: Selecciona tu workspace
   - **Type**: Internal (para uso personal)
   - **Capabilities**: Selecciona las capacidades que necesitas:
     - ✅ Read content
     - ✅ Update content
     - ✅ Insert content
4. Haz clic en **Submit**
5. Copia el **Internal Integration Token** (empieza con `secret_`)

**IMPORTANTE**: Este token solo se muestra una vez. Guárdalo de forma segura.

## Paso 2: Conectar Integration a Databases/Pages

1. Abre la página o database que quieres sincronizar
2. Haz clic en **···** (tres puntos) en la esquina superior derecha
3. Selecciona **Add connections**
4. Busca y selecciona tu integration (`dendrita-integration`)
5. Haz clic en **Confirm**

**IMPORTANTE**: La integration solo puede acceder a las páginas/databases que explícitamente le conectes.

## Paso 3: Configurar Credenciales

Agrega el token a tu archivo `.dendrita/.env.local`:

```env
# Notion
NOTION_INTEGRATION_TOKEN=secret_tu_token_aqui
```

**IMPORTANTE**: 
- Nunca hagas commit de este archivo
- El archivo `.env.local` está protegido por `.gitignore`
- Si accidentalmente lo commiteas, rota el token inmediatamente

## Paso 4: Verificar Configuración

Ejecuta el script de exploración para verificar que todo funciona:

```bash
npx ts-node _temp/dev-tools/explore/notion-explore.ts
```

O desde TypeScript:

```typescript
import { NotionClient } from './.dendrita/integrations/services/notion/client';

const client = new NotionClient();
if (client.isConfigured()) {
  console.log('✅ Notion configured');
  await client.authenticate();
  const databases = await client.listDatabases();
  console.log(`Found ${databases.length} database(s)`);
}
```

## Uso de la API

### Rate Limits

Notion tiene límites de rate:
- **3 requests por segundo** por defecto
- El cliente maneja automáticamente los errores 429 (Rate Limit Exceeded)

### Estructura de Notion

Notion organiza los datos en:
- **Database** → Equivale a un proyecto de dendrita
- **Page** → Equivale a una tarea en dendrita
- **Block** → Contenido de una página (texto, listas, etc.)

### Mapeo a Dendrita

- **Database** → `workspaces/[workspace]/active-projects/[project-name]/`
- **Page** → Tarea en `tasks.md`
- **Page Properties** → Propiedades de tarea (estado, fecha, asignado)
- **Page Blocks** → Descripción de tarea en markdown

## Ejemplo de Uso

```typescript
import { NotionClient } from './.dendrita/integrations/services/notion/client';
import { mapNotionPageToDendritaTask } from './.dendrita/integrations/services/notion/mapper';

const client = new NotionClient();
await client.authenticate();

// Obtener databases
const databases = await client.listDatabases();

// Obtener páginas de una database
const pages = await client.queryDatabase(databases[0].id);

// Mapear a dendrita
const dendritaTasks = pages.map(mapNotionPageToDendritaTask);
```

## Configuración de Database Schema

Para sincronizar correctamente, tu database de Notion debe tener estas propiedades:

- **Name** (Title) - Nombre de la tarea
- **Status** (Select) - Estado de la tarea (Pending, In Progress, Completed, Cancelled)
- **Due Date** (Date) - Fecha de vencimiento
- **Assignee** (People) - Persona asignada

Puedes agregar más propiedades según tus necesidades.

## Seguridad

### ❌ NUNCA hagas esto

```typescript
// ❌ MALO - Token hardcodeado
const token = 'secret_abc123...';

// ❌ MALO - Token en código
const client = new NotionClient({ token: 'secret_abc123...' });
```

### ✅ SIEMPRE haz esto

```typescript
// ✅ BUENO - Carga desde variables de entorno
import { NotionClient } from './.dendrita/integrations/services/notion/client';

const client = new NotionClient();
// El cliente carga automáticamente desde .env.local
```

## Troubleshooting

### Error: "Notion credentials not configured"

- Verifica que el archivo `.dendrita/.env.local` existe
- Verifica que contiene `NOTION_INTEGRATION_TOKEN=secret_...`
- Verifica que el token no tiene espacios extra

### Error: "401 Unauthorized"

- El token es inválido o fue revocado
- Genera un nuevo token en Notion Integrations
- Actualiza `.env.local` con el nuevo token

### Error: "403 Forbidden"

- La integration no tiene acceso a la página/database
- Conecta la integration a la página/database en Notion
- Verifica que la integration tiene los permisos correctos

### Error: "429 Rate Limit Exceeded"

- Has excedido el límite de 3 requests por segundo
- El cliente espera automáticamente según el header `Retry-After`
- Considera implementar throttling adicional si es necesario

## Referencias

- [Notion API Documentation](https://developers.notion.com/reference)
- [Notion Integrations](https://developers.notion.com/docs/getting-started)
- [Notion Rate Limits](https://developers.notion.com/reference/request-limits)

