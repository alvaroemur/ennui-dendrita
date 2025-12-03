---
name: check-dendrita-security
description: "Verificación de Seguridad Dendrita"
type: script-documentation
created: 2025-11-06
updated: 2025-11-06
tags: ["script-documentation", "integration"]
category: integration
---

# Verificación de Seguridad Dendrita

Script para verificar que los componentes dendrita no expongan datos del usuario ni de los workspaces.

---

## 🎯 Propósito

Este script verifica que los componentes dendrita (hooks, agents, skills, scripts) no contengan:
- IDs de usuario específicos (excepto "example-user")
- Nombres de workspaces específicos (excepto "template")
- Rutas hardcodeadas a archivos de usuario o workspace
- Credenciales o datos sensibles

**CRÍTICO:** Este script debe ejecutarse durante el proceso de dendritificación para asegurar que las capas del sistema no expongan información sensible.

---

## 🚀 Uso Rápido

### Verificar un componente específico

```bash
ts-node .dendrita/integrations/scripts/check-dendrita-security.ts [path-to-component]
```

### Verificar todo el sistema dendrita

```bash
ts-node .dendrita/integrations/scripts/check-dendrita-security.ts .dendrita
```

### Modo estricto (falla con cualquier error)

```bash
ts-node .dendrita/integrations/scripts/check-dendrita-security.ts [path] --strict
```

### Excluir patrones específicos

```bash
ts-node .dendrita/integrations/scripts/check-dendrita-security.ts [path] --exclude=node_modules --exclude=.git
```

---

## 📋 Qué Verifica

### 1. IDs de Usuario Específicos

**Problema:** Referencias a directorios de usuario específicos (excepto "example-user")

**Ejemplo de problema:**
```typescript
// ❌ MALO
const userPath = '.dendrita/users/alvaro-mur/profile.json';
```

**Ejemplo de solución:**
```typescript
// ✅ BUENO
const userPath = `.dendrita/users/[user-id]/profile.json`;
// o
const userPath = path.join('.dendrita', 'users', userId, 'profile.json');
```

### 2. Nombres de Workspaces Específicos

**Problema:** Referencias a workspaces específicos (excepto "template")

**Ejemplo de problema:**
```typescript
// ❌ MALO
const workspacePath = 'workspaces/ennui/active-projects/';
```

**Ejemplo de solución:**
```typescript
// ✅ BUENO
const workspacePath = `workspaces/[workspace]/active-projects/`;
// o
const workspacePath = path.join('workspaces', workspaceName, 'active-projects');
```

### 3. Rutas Hardcodeadas

**Problema:** Rutas completas a archivos de usuario o workspace

**Ejemplo de problema:**
```typescript
// ❌ MALO
const configPath = 'workspaces/ennui/scrapers-config.json';
```

**Ejemplo de solución:**
```typescript
// ✅ BUENO
const configPath = path.join('workspaces', workspace, 'scrapers-config.json');
```

### 4. Credenciales o Tokens

**Problema:** Credenciales, tokens o claves API hardcodeadas

**Ejemplo de problema:**
```typescript
// ❌ MALO
const apiKey = 'sk-abc123def456...';
const token = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

**Ejemplo de solución:**
```typescript
// ✅ BUENO
const apiKey = process.env.OPENAI_API_KEY;
const token = loadCredentials().token;
```

### 5. IDs de Google (Drive, Gmail, etc.)

**Problema:** IDs largos que podrían ser de Google (marcado como warning)

**Ejemplo de problema:**
```typescript
// ⚠️ WARNING
const folderId = '1r-yIuqjZ6FKjDzo4wxakJkoLnpA-lwFYTC6P-P6NwOE';
```

**Ejemplo de solución:**
```typescript
// ✅ BUENO
const folderId = process.env.DRIVE_FOLDER_ID || '[folder-id]';
```

---

## 🔍 Excepciones Permitidas

El script permite referencias en estos contextos:

1. **Templates y ejemplos:**
   - `.dendrita/users/example-user/`
   - `workspaces/template/`
   - `.dendrita/templates/`

2. **Documentación con ejemplos:**
   - Código en bloques de ejemplo
   - Comentarios con "example", "placeholder", "template"

3. **Comentarios explicativos:**
   - Referencias en documentación markdown
   - Ejemplos en comentarios de código

---

## 📊 Resultado de la Verificación

El script genera un reporte con:

- **Archivos verificados:** Número total de archivos analizados
- **Errores:** Problemas críticos que deben corregirse
- **Advertencias:** Problemas menores que deberían revisarse
- **Sugerencias:** Cómo corregir cada problema encontrado

### Ejemplo de salida

```
=== Verificación de Seguridad Dendrita ===

Archivos verificados: 45
Directorios verificados: 3
Fecha de verificación: 2025-01-15T10:30:00.000Z

❌ Errores encontrados: 2

1. [USER-DATA] .dendrita/hooks/example-hook.md:42
   Referencia a directorio de usuario específico (no example-user) encontrado: ".dendrita/users/alvaro-mur/"
   💡 Sugerencia: Usar variables o placeholders como [user-id] en lugar de IDs reales

2. [WORKSPACE-DATA] .dendrita/integrations/scripts/example-script.ts:15
   Referencia a workspace específico (no template) encontrado: "workspaces/ennui/"
   💡 Sugerencia: Usar placeholders como [workspace] o referencias genéricas

⚠️  Advertencias encontradas: 1

1. [HARDCODED-PATH] .dendrita/integrations/scripts/example-script.ts:28
   Posible ID de Google (Drive, Gmail, etc.) encontrado: "1r-yIuqjZ6FKjDzo4wxakJkoLnpA-lwFYTC6P-P6NwOE"
   💡 Sugerencia: Verificar si es un ID real y reemplazar con placeholder

❌ Verificación fallida
```

---

## 🔗 Integración con Dendritificación

Este script se ejecuta automáticamente durante el proceso de dendritificación:

1. **Durante la conversión:** El hook `dendritify.md` ejecuta este script en el Step 5
2. **Verificación obligatoria:** La dendritificación no se completa hasta que el check de seguridad pase
3. **Corrección automática:** Si se encuentran problemas, se deben corregir antes de continuar

**Ver:** `.dendrita/hooks/dendritify.md` para más detalles sobre la integración.

---

## 🛠️ Uso Programático

También puedes usar el script desde TypeScript:

```typescript
import { checkDendritaSecurity, printSecurityCheckResult } from '.dendrita/integrations/scripts/check-dendrita-security';

// Verificar un componente
const result = checkDendritaSecurity('./.dendrita/hooks/my-hook.md', {
  strict: true,
  excludePatterns: ['node_modules', '.git'],
});

// Mostrar resultado
printSecurityCheckResult(result);

// Verificar si pasó
if (!result.passed) {
  console.error('Security check failed!');
  process.exit(1);
}
```

---

## 📝 Notas Importantes

1. **Siempre ejecutar antes de commit:** Verifica que no se expongan datos sensibles
2. **Modo estricto en CI/CD:** Usa `--strict` en pipelines de CI/CD
3. **Revisar advertencias:** Aunque no bloquean, deberían revisarse
4. **Contexto permitido:** El script es inteligente y permite ejemplos en documentación

---

## 🔗 Referencias

- `.dendrita/hooks/dendritify.md` - Proceso de dendritificación
- `.dendrita/docs/TECHNICAL-PARADIGMS.md` - Security principles
- `.dendrita/docs/integrations/SECURITY.md` - Políticas de seguridad generales

---

**Para Cursor:** Este script debe ejecutarse automáticamente durante el proceso de dendritificación para asegurar que los componentes no expongan datos sensibles.

