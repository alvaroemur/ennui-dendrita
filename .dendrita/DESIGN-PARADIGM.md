# Paradigma de Diseño de .dendrita

Principios de diseño y organización de configuración en dendrita.

---

## Principio Fundamental

**Configuración en archivos locales únicos, no en base de datos.**

La configuración de scrapers y otras integraciones debe estar en archivos JSON locales, no en Supabase. Supabase solo se usa para almacenar datos scrapeados (resultados), no configuración.

---

## Estructura de Configuración

### Archivos de Configuración Únicos

**Formato:** `[nombre]-config.json`

**Ubicación:**
- **Configuración de usuario:** `.dendrita/users/[user-id]/[nombre]-config.json`
- **Configuración de workspace:** `workspaces/[workspace]/[nombre]-config.json`

**Ejemplos:**
- `.dendrita/users/[user-id]/scrapers-config.json` - Configuración de Calendar scraper
- `workspaces/[workspace-name]/scrapers-config.json` - Configuración de Drive/Gmail scrapers
- `workspaces/[workspace-name]/config-estilo.json` - Configuración de estilo del workspace

---

## Separación por Contexto

### Calendar Scraper → `.dendrita/users/[user-id]/scrapers-config.json`

**Razón:** Calendar scraper busca **TODOS** los eventos de los calendarios del usuario. No requiere filtros específicos por workspace, ya que es un scraping completo de calendarios personales.

**Ubicación:** `.dendrita/users/[user-id]/scrapers-config.json`

**Estructura:**
```json
{
  "user_id": "[user-id]",
  "calendar": {
    "default_settings": { ... },
    "calendars": [ ... ]
  }
}
```

### Drive/Gmail Scrapers → `workspaces/[workspace]/scrapers-config.json`

**Razón:** Drive y Gmail scrapers requieren **reglas específicas** (filtros por palabras, etiquetas, IDs específicos, carpetas específicas) que están asociadas a un workspace/empresa específico.

**Ubicación:** `workspaces/[workspace]/scrapers-config.json`

**Estructura:**
```json
{
  "workspace": "ennui",
  "drive": {
    "configs": [ ... ]
  },
  "gmail": {
    "configs": [ ... ]
  }
}
```

---

## Principios de Seguridad

### Información Personal NO en Git

**CRÍTICO:** Toda información personal debe estar excluida de git:

- `.dendrita/users/` → En `.gitignore`
- `.dendrita/logs/` → En `.gitignore`
- `workspaces/[empresa]/` → En `.gitignore` (ya está)
- Archivos de configuración con datos sensibles → En `.gitignore`

### Verificación

**Nunca deben estar en git:**
- ✅ `.dendrita/users/` (perfiles de usuario, configuraciones personales)
- ✅ `.dendrita/logs/` (logs que pueden contener información sensible)
- ✅ `workspaces/[empresa]/` (datos de empresas/clientes)
- ✅ Archivos de configuración con IDs de carpetas, queries de búsqueda, etc.

**Pueden estar en git:**
- ✅ `.dendrita/integrations/services/` (código, no datos)
- ✅ `.dendrita/integrations/scripts/` (código, no datos)
- ✅ `workspaces/template/` (estructura de ejemplo sin datos reales)
- ✅ Schemas SQL (estructura de base de datos, no datos)

---

## Ventajas del Paradigma

### 1. **Separación Clara**
- ✅ Configuración de usuario vs. configuración de workspace
- ✅ Configuración local vs. datos en Supabase
- ✅ Archivos únicos vs. múltiples archivos dispersos

### 2. **Seguridad**
- ✅ Información personal excluida de git
- ✅ Configuraciones con datos sensibles no en repositorio
- ✅ Fácil de verificar con `.gitignore`

### 3. **Mantenibilidad**
- ✅ Configuraciones en archivos JSON legibles
- ✅ Fácil de editar sin necesidad de Supabase
- ✅ Versionado local (fuera de git)

### 4. **Escalabilidad**
- ✅ Cada workspace puede tener sus propias configuraciones
- ✅ Fácil agregar nuevas configuraciones sin modificar código
- ✅ Configuraciones pueden ser compartidas entre usuarios (copia local)

---

## Implementación en Servicios

### Carga de Configuración

**Calendar Scraper:**
```typescript
async loadConfigFromUser(userId: string): Promise<ScrapingConfig[]> {
  const configPath = path.join('.dendrita', 'users', userId, 'scrapers-config.json');
  // Leer archivo JSON...
}
```

**Drive/Gmail Scrapers:**
```typescript
async loadConfigFromWorkspace(workspace: string): Promise<ScrapingConfig[]> {
  const configPath = path.join('workspaces', workspace, 'scrapers-config.json');
  // Leer archivo JSON...
}
```

### Guardado de Configuración

**Calendar Scraper:**
```typescript
async saveConfig(userId: string, configs: ScrapingConfig[]): Promise<void> {
  const configPath = path.join('.dendrita', 'users', userId, 'scrapers-config.json');
  // Escribir archivo JSON...
}
```

**Drive/Gmail Scrapers:**
```typescript
async saveConfig(workspace: string, configs: ScrapingConfig[]): Promise<void> {
  const configPath = path.join('workspaces', workspace, 'scrapers-config.json');
  // Escribir archivo JSON...
}
```

---

## Aplicación del Paradigma

Este paradigma debe aplicarse a:

1. **Scrapers** (Calendar, Drive, Gmail)
2. **Otras integraciones futuras** (Slack, Notion, etc.)
3. **Configuraciones de workspace** (estilo, reglas, etc.)
4. **Configuraciones de usuario** (preferencias, aliases, etc.)

**Regla general:** Si es configuración, va en archivo local. Si son datos scrapeados/resultados, van en Supabase.

---

## Referencias

- `.dendrita/integrations/SCRAPER-CONFIG-DESIGN.md` - Diseño específico de configuración de scrapers
- `.dendrita/integrations/SCRAPER-ARCHITECTURE.md` - Arquitectura de scrapers
- `.dendrita/WORKSPACE-STRUCTURE.md` - Estructura estándar de workspaces
- `.gitignore` - Reglas de exclusión de git

---

**Última actualización:** 2025-01-28
**Versión:** 1.0
**Estado:** Paradigma establecido

