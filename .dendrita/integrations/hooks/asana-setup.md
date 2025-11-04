# Asana Setup Guide

Guía paso a paso para configurar la integración con Asana.

## Requisitos

- Cuenta de Asana (gratuita o de pago)
- Personal Access Token de Asana

## Paso 1: Obtener Personal Access Token

1. Inicia sesión en [Asana](https://app.asana.com/)
2. Haz clic en tu avatar (esquina superior derecha)
3. Selecciona **My Profile Settings**
4. Ve a **Apps** → **Developer Console**
5. Haz clic en **Personal Access Tokens**
6. Haz clic en **Create New Token**
7. Dale un nombre al token (ej: "dendrita-integration")
8. Copia el token generado (empieza con `1/`)

**IMPORTANTE**: Este token solo se muestra una vez. Guárdalo de forma segura.

## Paso 2: Configurar Credenciales

Agrega el token a tu archivo `.dendrita/.env.local`:

```env
# Asana
ASANA_ACCESS_TOKEN=1/tu_token_aqui
```

**IMPORTANTE**: 
- Nunca hagas commit de este archivo
- El archivo `.env.local` está protegido por `.gitignore`
- Si accidentalmente lo commiteas, rota el token inmediatamente

## Paso 3: Verificar Configuración

Ejecuta el script de exploración para verificar que todo funciona:

```bash
npx ts-node .dendrita/integrations/explore/asana-explore.ts
```

O desde TypeScript:

```typescript
import { AsanaClient } from './.dendrita/integrations/services/asana/client';

const client = new AsanaClient();
if (client.isConfigured()) {
  console.log('✅ Asana configured');
  await client.authenticate();
  const workspaces = await client.getWorkspaces();
  console.log(`Found ${workspaces.length} workspace(s)`);
}
```

## Uso de la API

### Rate Limits

Asana tiene límites de rate:
- **150 requests por minuto** por defecto
- El cliente maneja automáticamente los errores 429 (Rate Limit Exceeded)

### Estructura de Asana

Asana organiza los datos en:
- **Workspace** → Equivale a un workspace de dendrita
- **Project** → Equivale a un proyecto de dendrita
- **Task** → Equivale a una tarea en dendrita

### Mapeo a Dendrita

- **Workspace** → `workspaces/[workspace-name]/`
- **Project** → `workspaces/[workspace]/active-projects/[project-name]/`
- **Task** → Tarea en `tasks.md`
- **Project Notes** → `master-plan.md` o `current-context.md`

## Ejemplo de Uso

```typescript
import { AsanaClient } from './.dendrita/integrations/services/asana/client';
import { mapAsanaTaskToDendrita } from './.dendrita/integrations/services/asana/mapper';

const client = new AsanaClient();
await client.authenticate();

// Obtener workspaces
const workspaces = await client.getWorkspaces();

// Obtener proyectos de un workspace
const projects = await client.getProjects(workspaces[0].gid);

// Obtener tareas de un proyecto
const tasks = await client.getTasks(projects[0].gid);

// Mapear a dendrita
const dendritaTasks = tasks.map(mapAsanaTaskToDendrita);
```

## Seguridad

### ❌ NUNCA hagas esto

```typescript
// ❌ MALO - Token hardcodeado
const token = '1/abc123...';

// ❌ MALO - Token en código
const client = new AsanaClient({ token: '1/abc123...' });
```

### ✅ SIEMPRE haz esto

```typescript
// ✅ BUENO - Carga desde variables de entorno
import { AsanaClient } from './.dendrita/integrations/services/asana/client';

const client = new AsanaClient();
// El cliente carga automáticamente desde .env.local
```

## Troubleshooting

### Error: "Asana credentials not configured"

- Verifica que el archivo `.dendrita/.env.local` existe
- Verifica que contiene `ASANA_ACCESS_TOKEN=1/...`
- Verifica que el token no tiene espacios extra

### Error: "401 Unauthorized"

- El token es inválido o fue revocado
- Genera un nuevo token en Asana Developer Console
- Actualiza `.env.local` con el nuevo token

### Error: "429 Rate Limit Exceeded"

- Has excedido el límite de 150 requests por minuto
- El cliente espera automáticamente según el header `Retry-After`
- Considera implementar throttling adicional si es necesario

## Referencias

- [Asana API Documentation](https://developers.asana.com/docs)
- [Asana Personal Access Tokens](https://developers.asana.com/docs/personal-access-token)
- [Asana Rate Limits](https://developers.asana.com/docs/rate-limits)

