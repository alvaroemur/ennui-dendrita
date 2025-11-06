---
name: install
description: "Referencias de Hooks - No Requiere Instalación"
type: hook
created: 2025-11-06
updated: 2025-11-06
tags: ["hook", "behavior-reference"]
category: behavior-reference
---

# Referencias de Hooks - No Requiere Instalación

## Importante: NO es necesario instalar nada

Los hooks en `.dendrita/hooks/` son **referencias de comportamiento**, NO scripts ejecutables. Cursor debe LEER estos archivos para entender el comportamiento esperado, pero NO se ejecutan.

---

## ¿Qué significa esto?

### Para Cursor:

1. **Lee los archivos** para entender la lógica
2. **Aplica el comportamiento** documentado reflexivamente
3. **NO ejecuta** los scripts

### No requiere:

- ❌ Instalación de dependencias (`npm install`)
- ❌ Node.js instalado
- ❌ Permisos de ejecución
- ❌ Configuración especial

---

## Archivos de Referencia

### skill-activation-prompt.ts

**Propósito:** Documenta la lógica de activación de skills

**Para Cursor:**
- Lee este archivo para entender cómo identificar skills relevantes
- Aplica la lógica: revisar `skill-rules.json`, comparar keywords e intentPatterns
- NO intentes ejecutarlo con `npx tsx` o similar

**Contenido:**
- Lógica TypeScript documentada para referencia
- Interfaces y funciones que muestran el comportamiento esperado
- Comentarios que explican la lógica

---

### skill-activation-prompt.sh

**Propósito:** Wrapper bash documentado (referencia)

**Para Cursor:**
- Lee este archivo para entender el flujo
- NO intentes ejecutarlo

**Contenido:**
- Comandos bash documentados para referencia
- Muestra cómo se llamaría el script TypeScript (si fuera ejecutable)

---

### post-tool-use-tracker.sh

**Propósito:** Documenta la lógica de rastreo de archivos

**Para Cursor:**
- Lee este archivo para entender cómo identificar contexto de archivos
- Aplica la lógica: identificar contexto basado en ruta, mantener registro
- NO intentes ejecutarlo

**Contenido:**
- Lógica bash documentada para referencia
- Funciones que muestran el comportamiento esperado
- Comentarios que explican la detección de contexto

---

## package.json (Referencia Futura)

**Propósito:** Documenta dependencias para referencia futura

**Nota:** Este archivo se mantiene por si en el futuro se requiere ejecución real de hooks. Por ahora, es solo referencia.

**No requiere:**
- `npm install` - NO es necesario
- Las dependencias listadas son solo para referencia documental

---

## Cómo Cursor Debe Usar Estas Referencias

### 1. Al recibir un prompt:

**Lee:** `skill-activation-prompt.ts` para entender la lógica
**Aplica:**
- Revisa `.dendrita/skills/skill-rules.json`
- Compara el prompt contra keywords e intentPatterns
- Identifica skills relevantes
- Lee los `SKILL.md` correspondientes

### 2. Después de editar archivos:

**Lee:** `post-tool-use-tracker.sh` para entender la lógica
**Aplica:**
- Identifica el contexto del archivo basado en su ruta
- Mantén registro del contexto afectado
- Considera este contexto para futuras acciones

---

## Información Técnica (Solo Referencia)

Si en el futuro se requiere ejecución real de estos hooks:

### Dependencias documentadas:

- `tsx` (v4.0.0+) - Para ejecutar TypeScript directamente
- `typescript` (v5.0.0+) - Compilador TypeScript
- `@types/node` (v20.0.0+) - Tipos de TypeScript para Node.js

### Para ejecución futura (NO necesario ahora):

```bash
cd .dendrita/hooks
npm install
```

**NOTA:** Esto NO es necesario actualmente porque los hooks son referencias, no scripts ejecutables.

---

## Verificación para Cursor

**Verificar que entiendes las referencias:**

1. ✅ ¿Entiendes que NO debes ejecutar estos scripts?
2. ✅ ¿Entiendes que debes LEER estos archivos para aplicar el comportamiento?
3. ✅ ¿Entiendes la lógica de `skill-activation-prompt.ts`?
4. ✅ ¿Entiendes la lógica de `post-tool-use-tracker.sh`?

**Si puedes responder "sí" a todas, entonces estás usando las referencias correctamente.**

---

## Resumen

- ✅ **NO requiere instalación** - Los hooks son referencias
- ✅ **NO requiere Node.js** - Solo lectura de archivos
- ✅ **NO requiere permisos de ejecución** - Solo lectura
- ✅ **Cursor debe LEER** estos archivos para entender el comportamiento
- ✅ **Cursor debe APLICAR** el comportamiento documentado
- ✅ **Cursor NO debe EJECUTAR** estos scripts

---

**Para más información:** Ver `.dendrita/hooks/README.md` y `.cursorrules` en la raíz del proyecto.
