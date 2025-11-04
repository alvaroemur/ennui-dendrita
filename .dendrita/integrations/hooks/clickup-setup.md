# ClickUp Setup Guide

Guía paso a paso para configurar la integración con ClickUp.

## Requisitos

- Cuenta de ClickUp (gratuita o de pago)
- Personal Access Token de ClickUp

## Paso 1: Obtener Personal Access Token

1. Inicia sesión en [ClickUp](https://app.clickup.com/)
2. Haz clic en tu avatar (esquina superior derecha)
3. Selecciona **Settings**
4. En el menú lateral, ve a **Apps** → **API**
5. En la sección **Personal API Token**, haz clic en **Generate**
6. Copia el token generado (empieza con `pk_`)

**IMPORTANTE**: Este token solo se muestra una vez. Guárdalo de forma segura.

## Paso 2: Configurar Credenciales

Agrega el token a tu archivo `.dendrita/.env.local`:

```env
# ClickUp
CLICKUP_ACCESS_TOKEN=pk_tu_token_aqui
```

**IMPORTANTE**: 
- Nunca hagas commit de este archivo
- El archivo `.env.local` está protegido por `.gitignore`
- Si accidentalmente lo commiteas, rota el token inmediatamente

## Paso 3: Verificar Configuración

Ejecuta el script de exploración para verificar que todo funciona:

```bash
npx ts-node .dendrita/integrations/explore/clickup-explore.ts
```

O desde TypeScript:

```typescript
import { ClickUpClient } from './.dendrita/integrations/services/clickup/client';

const client = new ClickUpClient();
if (client.isConfigured()) {
  console.log('✅ ClickUp configured');
  await client.authenticate();
  const workspaces = await client.getWorkspaces();
  console.log(`Found ${workspaces.length} workspace(s)`);
}
```

## Uso de la API

### Rate Limits

ClickUp tiene límites de rate:
- **100 requests por minuto** por defecto
- El cliente maneja automáticamente los errores 429 (Rate Limit Exceeded)

### Estructura de ClickUp

ClickUp organiza los datos en:
- **Workspace** (Team) → Equivale a un workspace de dendrita
- **Space** → Equivale a un proyecto de dendrita
- **List** → Equivale a una fase del proyecto
- **Task** → Equivale a una tarea en dendrita

### Mapeo a Dendrita

- **Workspace** → `workspaces/[workspace-name]/`
- **Space** → `workspaces/[workspace]/active-projects/[project-name]/`
- **List** → Fase en `master-plan.md`
- **Task** → Tarea en `tasks.md`

## Ejemplo de Uso

```typescript
import { ClickUpClient } from './.dendrita/integrations/services/clickup/client';
import { mapClickUpTaskToDendrita } from './.dendrita/integrations/services/clickup/mapper';

const client = new ClickUpClient();
await client.authenticate();

// Obtener workspaces
const workspaces = await client.getWorkspaces();

// Obtener spaces de un workspace
const spaces = await client.getSpaces(workspaces[0].id);

// Obtener lists de un space
const lists = await client.getLists(spaces[0].id);

// Obtener tasks de una list
const tasks = await client.getTasks(lists[0].id);

// Mapear a dendrita
const dendritaTasks = tasks.map(mapClickUpTaskToDendrita);
```

## Seguridad

### ❌ NUNCA hagas esto

```typescript
// ❌ MALO - Token hardcodeado
const token = 'pk_abc123...';

// ❌ MALO - Token en código
const client = new ClickUpClient({ token: 'pk_abc123...' });
```

### ✅ SIEMPRE haz esto

```typescript
// ✅ BUENO - Carga desde variables de entorno
import { ClickUpClient } from './.dendrita/integrations/services/clickup/client';

const client = new ClickUpClient();
// El cliente carga automáticamente desde .env.local
```

## Troubleshooting

### Error: "ClickUp credentials not configured"

- Verifica que el archivo `.dendrita/.env.local` existe
- Verifica que contiene `CLICKUP_ACCESS_TOKEN=pk_...`
- Verifica que el token no tiene espacios extra

### Error: "401 Unauthorized"

- El token es inválido o fue revocado
- Genera un nuevo token en ClickUp Settings → Apps → API
- Actualiza `.env.local` con el nuevo token

### Error: "429 Rate Limit Exceeded"

- Has excedido el límite de 100 requests por minuto
- El cliente espera automáticamente según el header `Retry-After`
- Considera implementar throttling adicional si es necesario

## Referencias

- [ClickUp API Documentation](https://clickup.com/api)
- [ClickUp Personal API Tokens](https://docs.clickup.com/en/articles/1367130-getting-started-with-the-clickup-api)
- [ClickUp Rate Limits](https://clickup.com/api/developer-portal/rate-limits)

