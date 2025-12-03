---
name: readme
description: "Dashboard System"
type: documentation
created: 2025-11-06
updated: 2025-11-06
tags: ["documentation", "infrastructure", "readme"]
category: infrastructure
---

# Dashboard System

Sistema modular de dashboards con estilos configurables por workspace basado en Material Design.

## Estructura

```
.dendrita/dashboards/
├── styles/
│   ├── material-base.css          # Material Design base styles
│   ├── dashboard-base.css         # Common dashboard components
│   └── workspace-themes.js       # Workspace theme definitions
├── config/
│   └── workspace-brand-config.json  # Brand configuration template
└── README.md
```

## Uso

### 1. Incluir estilos en tu dashboard

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mi Dashboard</title>
  
  <!-- Material Design Base -->
  <link rel="stylesheet" href=".dendrita/dashboards/styles/material-base.css">
  
  <!-- Dashboard Base Components -->
  <link rel="stylesheet" href=".dendrita/dashboards/styles/dashboard-base.css">
  
  <!-- Workspace Themes -->
  <script src=".dendrita/dashboards/styles/workspace-themes.js"></script>
</head>
<body>
  <div class="md-container">
    <div class="dashboard-header">
      <h1>Mi Dashboard</h1>
      <p>Descripción del dashboard</p>
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
    // Aplicar tema del workspace
    const workspace = new URLSearchParams(window.location.search).get('workspace') || 'default';
    applyWorkspaceTheme(workspace);
  </script>
</body>
</html>
```

### 2. Configurar tema por workspace

Los temas se pueden configurar de dos formas:

#### Opción A: Usar tema predefinido

```javascript
applyWorkspaceTheme('ennui');  // o 'iami', 'inspiro', etc.
```

#### Opción B: Cargar desde archivo de configuración

Crea un archivo `workspaces/[workspace]/brand-config.json`:

```json
{
  "workspace": "ennui",
  "brand": {
    "colors": {
      "primary": "#667eea",
      "primaryVariant": "#764ba2",
      "secondary": "#f093fb"
    },
    "gradient": {
      "primary": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    },
    "typography": {
      "fontFamily": "'Roboto', sans-serif"
    }
  }
}
```

Luego carga dinámicamente:

```javascript
async function loadWorkspaceBrand(workspace) {
  try {
    const response = await fetch(`workspaces/${workspace}/brand-config.json`);
    const config = await response.json();
    applyCustomTheme(config.brand);
  } catch (error) {
    // Fallback a tema predefinido
    applyWorkspaceTheme(workspace);
  }
}
```

### 3. Componentes disponibles

#### Cards

```html
<div class="md-card">
  <h3>Título</h3>
  <p>Contenido</p>
</div>
```

#### Buttons

```html
<button class="md-button md-button-primary">Primary</button>
<button class="md-button md-button-secondary">Secondary</button>
<button class="md-button md-button-outlined">Outlined</button>
<button class="md-button md-button-text">Text</button>
```

#### Inputs

```html
<input type="text" class="md-input" placeholder="Texto">
```

#### Stats Grid

```html
<div class="stats-grid">
  <div class="stat-card">
    <h3>Etiqueta</h3>
    <div class="value">123</div>
    <div class="subtitle">Descripción</div>
  </div>
</div>
```

#### Charts

```html
<div class="chart-container">
  <h2>Título del Gráfico</h2>
  <div class="chart-wrapper">
    <canvas id="myChart"></canvas>
  </div>
</div>
```

#### Tabs

```html
<div class="tabs">
  <button class="tab active" onclick="showTab('tab1')">Tab 1</button>
  <button class="tab" onclick="showTab('tab2')">Tab 2</button>
</div>

<div id="tab1" class="tab-content active">Contenido 1</div>
<div id="tab2" class="tab-content">Contenido 2</div>
```

### 4. Variables CSS personalizables

Todos los temas usan variables CSS que puedes sobrescribir:

```css
:root {
  --dashboard-primary: #667eea;
  --dashboard-primary-variant: #764ba2;
  --dashboard-secondary: #f093fb;
  --dashboard-on-primary: #ffffff;
  --dashboard-primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### 5. Responsive

El sistema es completamente responsive. Los grids se adaptan automáticamente:

- Desktop: múltiples columnas
- Tablet: 2 columnas
- Mobile: 1 columna

## Workspaces con temas predefinidos

- **ennui**: Gradiente púrpura/azul (#667eea → #764ba2)
- **iami**: Gradiente rojo/coral (#ff6b6b → #ee5a5a)
- **inspiro**: Gradiente púrpura (#6c5ce7 → #5f3dc4)
- **entre-rutas**: Gradiente gris/verde (#2d3436 → #636e72)
- **personal**: Gradiente azul (#0984e3 → #74b9ff)
- **default**: Material Design estándar (#6200ee)

## Personalización por proyecto

Los proyectos pueden tener su propio `brand-config.json` que sobrescribe el del workspace:

```
workspaces/[workspace]/active-projects/[proyecto]/brand-config.json
```
