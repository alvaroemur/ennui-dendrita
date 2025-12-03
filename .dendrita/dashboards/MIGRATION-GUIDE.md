---
name: migration-guide
description: "Guía de Migración de Dashboards"
type: documentation
created: 2025-11-06
updated: 2025-11-06
tags: ["documentation", "infrastructure"]
category: infrastructure
---

# Guía de Migración de Dashboards

Guía para migrar dashboards existentes al nuevo sistema de estilos modular basado en Material Design.

## Pasos de Migración

### 1. Reemplazar estilos inline

**Antes:**
```html
<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
  }
  
  .container {
    max-width: 1400px;
    margin: 0 auto;
  }
  
  .header {
    background: white;
    border-radius: 12px;
    padding: 30px;
  }
</style>
```

**Después:**
```html
<head>
  <!-- Material Design Base -->
  <link rel="stylesheet" href=".dendrita/dashboards/styles/material-base.css">
  
  <!-- Dashboard Base Components -->
  <link rel="stylesheet" href=".dendrita/dashboards/styles/dashboard-base.css">
  
  <!-- Workspace Themes -->
  <script src=".dendrita/dashboards/styles/workspace-themes.js"></script>
</head>
```

### 2. Actualizar clases CSS

#### Container
```html
<!-- Antes -->
<div class="container">

<!-- Después -->
<div class="md-container">
```

#### Header
```html
<!-- Antes -->
<div class="header">
  <h1>Título</h1>
</div>

<!-- Después -->
<div class="dashboard-header">
  <h1>Título</h1>
  <p>Descripción</p>
</div>
```

#### Cards
```html
<!-- Antes -->
<div class="stat-card">
  <h3>Label</h3>
  <div class="value">123</div>
</div>

<!-- Después -->
<div class="stat-card">
  <h3>Label</h3>
  <div class="value">123</div>
  <div class="subtitle">Description</div>
</div>
```

#### Buttons
```html
<!-- Antes -->
<button class="file-input-label">Click me</button>

<!-- Después -->
<button class="md-button md-button-primary">Click me</button>
```

### 3. Aplicar tema del workspace

Agregar al final del `<body>` o en un `<script>`:

```html
<script>
  // Detectar workspace desde URL o parámetro
  const workspace = new URLSearchParams(window.location.search).get('workspace') || 
                   'default';
  
  // Aplicar tema
  applyWorkspaceTheme(workspace);
  
  // O cargar desde archivo de configuración
  // applyWorkspaceThemeWithConfig(workspace);
</script>
```

### 4. Usar variables CSS para colores personalizados

Si necesitas colores específicos, usa las variables CSS:

```css
/* En lugar de valores hardcodeados */
.custom-element {
  color: var(--dashboard-primary);
  background: var(--dashboard-primary-gradient);
  border-color: var(--dashboard-accent);
}
```

### 5. Actualizar grids y layouts

```html
<!-- Antes -->
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">

<!-- Después -->
<div class="stats-grid">
```

O usar clases de utilidad:

```html
<div class="md-grid md-grid-3">
```

## Ejemplo Completo

### Dashboard Antes
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #667eea;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      padding: 30px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Mi Dashboard</h1>
  </div>
</body>
</html>
```

### Dashboard Después
```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mi Dashboard</title>
  
  <link rel="stylesheet" href=".dendrita/dashboards/styles/material-base.css">
  <link rel="stylesheet" href=".dendrita/dashboards/styles/dashboard-base.css">
  <script src=".dendrita/dashboards/styles/workspace-themes.js"></script>
</head>
<body>
  <div class="md-container">
    <div class="dashboard-header">
      <h1>Mi Dashboard</h1>
      <p>Descripción</p>
    </div>
    
    <div class="stats-grid">
      <div class="stat-card">
        <h3>Estadística</h3>
        <div class="value">123</div>
        <div class="subtitle">Descripción</div>
      </div>
    </div>
  </div>
  
  <script>
    const workspace = new URLSearchParams(window.location.search).get('workspace') || 'default';
    applyWorkspaceTheme(workspace);
  </script>
</body>
</html>
```

## Rutas Relativas

Si el dashboard está en una subcarpeta, ajusta las rutas:

```html
<!-- Desde raíz del proyecto -->
<link rel="stylesheet" href=".dendrita/dashboards/styles/material-base.css">

<!-- Desde workspaces/ennui/company-management/ -->
<link rel="stylesheet" href="../../../.dendrita/dashboards/styles/material-base.css">

<!-- O usar rutas absolutas desde la raíz -->
<link rel="stylesheet" href="/.dendrita/dashboards/styles/material-base.css">
```

## Configuración de Workspace

Si quieres definir un tema personalizado para tu workspace:

1. Crea `workspaces/[workspace-name]/brand-config.json`
2. Copia el template de `.dendrita/dashboards/config/workspace-brand-config.json.example`
3. Personaliza los colores y estilos

El sistema cargará automáticamente este archivo si existe.

## Beneficios

- ✅ Estilos consistentes en todos los dashboards
- ✅ Temas configurables por workspace
- ✅ Fácil mantenimiento
- ✅ Responsive por defecto
- ✅ Basado en Material Design
- ✅ Variables CSS para personalización

