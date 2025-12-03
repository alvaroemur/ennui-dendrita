---
name: install-dependencies
description: "Instalación de Dependencias"
type: script-documentation
created: 2025-11-06
updated: 2025-11-06
tags: ["script-documentation", "integration"]
category: integration
---

# 📦 Instalación de Dependencias

## ⚠️ Problema

npm no funciona correctamente en este sistema. Para completar la instalación de dependencias, necesitas ejecutar `npm install` desde otra terminal donde npm funcione.

## ✅ Solución Rápida

### Opción 1: Ejecutar npm install en otra terminal

Abre una nueva terminal y ejecuta:

```bash
cd "/path/to/ennui-dendrita"
npm install
```

Esto instalará todas las dependencias necesarias, incluyendo:
- `@supabase/supabase-js` y todas sus dependencias anidadas
- `ts-node`
- `typescript`
- `@types/node`

### Opción 2: Usar yarn (si está disponible)

```bash
cd "/path/to/ennui-dendrita"
yarn install
```

### Opción 3: Usar pnpm (si está disponible)

```bash
cd "/path/to/ennui-dendrita"
pnpm install
```

## 📋 Dependencias Necesarias

El `package.json` ya tiene configuradas las dependencias necesarias:

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "ts-node": "^10.9.0"
  }
}
```

## ✅ Verificar Instalación

Después de ejecutar `npm install`, verifica que todo funciona:

```bash
node -e "try { require('@supabase/supabase-js'); console.log('✅ @supabase/supabase-js instalado correctamente'); } catch(e) { console.log('❌ Error:', e.message); }"
```

## 🚀 Siguiente Paso

Una vez instaladas las dependencias, puedes ejecutar el scraping:

```bash
npm run calendar-scraper -- [user-id]
```

---

**Nota:** Ya hemos instalado manualmente algunas dependencias (@supabase/supabase-js y varios paquetes relacionados), pero faltan dependencias anidadas que npm resolvería automáticamente.

