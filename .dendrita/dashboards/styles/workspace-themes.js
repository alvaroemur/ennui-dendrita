/**
 * Workspace Theme Configuration
 * Defines brand colors and styles for each workspace
 */

const workspaceThemes = {
  'ennui': {
    name: 'ennui',
    displayName: 'ennui',
    colors: {
      primary: '#667eea',
      primaryVariant: '#764ba2',
      secondary: '#f093fb',
      secondaryVariant: '#4facfe',
      accent: '#43e97b',
      background: '#ffffff',
      surface: '#ffffff',
      surfaceVariant: '#f5f5f5',
      onPrimary: '#ffffff',
      onSecondary: '#000000',
      onBackground: '#000000',
      onSurface: '#000000',
      error: '#f44336',
      warning: '#ffc107',
      success: '#4caf50',
      info: '#2196f3'
    },
    typography: {
      fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      headingFont: "'Roboto', sans-serif"
    },
    gradient: {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      secondary: 'linear-gradient(135deg, #f093fb 0%, #4facfe 100%)',
      accent: 'linear-gradient(135deg, #43e97b 0%, #4facfe 100%)'
    }
  },
  
  'iami': {
    name: 'iami',
    displayName: 'iami',
    colors: {
      primary: '#ff6b6b',
      primaryVariant: '#ee5a5a',
      secondary: '#4ecdc4',
      secondaryVariant: '#44a08d',
      accent: '#ffe66d',
      background: '#ffffff',
      surface: '#ffffff',
      surfaceVariant: '#fff5f5',
      onPrimary: '#ffffff',
      onSecondary: '#000000',
      onBackground: '#000000',
      onSurface: '#000000',
      error: '#f44336',
      warning: '#ffc107',
      success: '#4caf50',
      info: '#2196f3'
    },
    typography: {
      fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      headingFont: "'Roboto', sans-serif"
    },
    gradient: {
      primary: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)',
      secondary: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)',
      accent: 'linear-gradient(135deg, #ffe66d 0%, #ff6b6b 100%)'
    }
  },
  
  'inspiro': {
    name: 'inspiro',
    displayName: 'Inspiro',
    colors: {
      primary: '#6c5ce7',
      primaryVariant: '#5f3dc4',
      secondary: '#00b894',
      secondaryVariant: '#00a085',
      accent: '#fdcb6e',
      background: '#ffffff',
      surface: '#ffffff',
      surfaceVariant: '#f8f9fa',
      onPrimary: '#ffffff',
      onSecondary: '#000000',
      onBackground: '#000000',
      onSurface: '#000000',
      error: '#f44336',
      warning: '#ffc107',
      success: '#4caf50',
      info: '#2196f3'
    },
    typography: {
      fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      headingFont: "'Roboto', sans-serif"
    },
    gradient: {
      primary: 'linear-gradient(135deg, #6c5ce7 0%, #5f3dc4 100%)',
      secondary: 'linear-gradient(135deg, #00b894 0%, #00a085 100%)',
      accent: 'linear-gradient(135deg, #fdcb6e 0%, #6c5ce7 100%)'
    }
  },
  
  'entre-rutas': {
    name: 'entre-rutas',
    displayName: 'Entre Rutas',
    colors: {
      primary: '#2d3436',
      primaryVariant: '#636e72',
      secondary: '#00b894',
      secondaryVariant: '#00a085',
      accent: '#fdcb6e',
      background: '#ffffff',
      surface: '#ffffff',
      surfaceVariant: '#f1f2f6',
      onPrimary: '#ffffff',
      onSecondary: '#000000',
      onBackground: '#000000',
      onSurface: '#000000',
      error: '#f44336',
      warning: '#ffc107',
      success: '#4caf50',
      info: '#2196f3'
    },
    typography: {
      fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      headingFont: "'Roboto', sans-serif"
    },
    gradient: {
      primary: 'linear-gradient(135deg, #2d3436 0%, #636e72 100%)',
      secondary: 'linear-gradient(135deg, #00b894 0%, #00a085 100%)',
      accent: 'linear-gradient(135deg, #fdcb6e 0%, #2d3436 100%)'
    }
  },
  
  'personal': {
    name: 'personal',
    displayName: 'Personal',
    colors: {
      primary: '#0984e3',
      primaryVariant: '#74b9ff',
      secondary: '#00b894',
      secondaryVariant: '#00a085',
      accent: '#fdcb6e',
      background: '#ffffff',
      surface: '#ffffff',
      surfaceVariant: '#e3f2fd',
      onPrimary: '#ffffff',
      onSecondary: '#000000',
      onBackground: '#000000',
      onSurface: '#000000',
      error: '#f44336',
      warning: '#ffc107',
      success: '#4caf50',
      info: '#2196f3'
    },
    typography: {
      fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      headingFont: "'Roboto', sans-serif"
    },
    gradient: {
      primary: 'linear-gradient(135deg, #0984e3 0%, #74b9ff 100%)',
      secondary: 'linear-gradient(135deg, #00b894 0%, #00a085 100%)',
      accent: 'linear-gradient(135deg, #fdcb6e 0%, #0984e3 100%)'
    }
  },
  
  'default': {
    name: 'default',
    displayName: 'Default',
    colors: {
      primary: '#6200ee',
      primaryVariant: '#3700b3',
      secondary: '#03dac6',
      secondaryVariant: '#018786',
      accent: '#ff6f00',
      background: '#ffffff',
      surface: '#ffffff',
      surfaceVariant: '#f5f5f5',
      onPrimary: '#ffffff',
      onSecondary: '#000000',
      onBackground: '#000000',
      onSurface: '#000000',
      error: '#b00020',
      warning: '#ffc107',
      success: '#4caf50',
      info: '#2196f3'
    },
    typography: {
      fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      headingFont: "'Roboto', sans-serif"
    },
    gradient: {
      primary: 'linear-gradient(135deg, #6200ee 0%, #3700b3 100%)',
      secondary: 'linear-gradient(135deg, #03dac6 0%, #018786 100%)',
      accent: 'linear-gradient(135deg, #ff6f00 0%, #6200ee 100%)'
    }
  }
};

/**
 * Apply workspace theme to the document
 * @param {string} workspaceName - Name of the workspace
 */
function applyWorkspaceTheme(workspaceName) {
  const theme = workspaceThemes[workspaceName] || workspaceThemes['default'];
  const root = document.documentElement;
  
  // Apply CSS variables
  root.style.setProperty('--dashboard-primary', theme.colors.primary);
  root.style.setProperty('--dashboard-primary-variant', theme.colors.primaryVariant);
  root.style.setProperty('--dashboard-secondary', theme.colors.secondary);
  root.style.setProperty('--dashboard-secondary-variant', theme.colors.secondaryVariant);
  root.style.setProperty('--dashboard-accent', theme.colors.accent);
  root.style.setProperty('--dashboard-background', theme.colors.background);
  root.style.setProperty('--dashboard-surface', theme.colors.surface);
  root.style.setProperty('--dashboard-surface-variant', theme.colors.surfaceVariant);
  root.style.setProperty('--dashboard-on-primary', theme.colors.onPrimary);
  root.style.setProperty('--dashboard-on-secondary', theme.colors.onSecondary);
  root.style.setProperty('--dashboard-on-background', theme.colors.onBackground);
  root.style.setProperty('--dashboard-on-surface', theme.colors.onSurface);
  root.style.setProperty('--dashboard-error', theme.colors.error);
  root.style.setProperty('--dashboard-warning', theme.colors.warning);
  root.style.setProperty('--dashboard-success', theme.colors.success);
  root.style.setProperty('--dashboard-info', theme.colors.info);
  root.style.setProperty('--dashboard-primary-gradient', theme.gradient.primary);
  root.style.setProperty('--dashboard-secondary-gradient', theme.gradient.secondary);
  root.style.setProperty('--dashboard-accent-gradient', theme.gradient.accent);
  root.style.setProperty('--dashboard-font-family', theme.typography.fontFamily);
  root.style.setProperty('--dashboard-heading-font', theme.typography.headingFont);
  
  // Apply RGB values for rgba() usage
  const primaryRgb = hexToRgb(theme.colors.primary);
  if (primaryRgb) {
    root.style.setProperty('--dashboard-primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
  }
  
  const onSurfaceRgb = hexToRgb(theme.colors.onSurface);
  if (onSurfaceRgb) {
    root.style.setProperty('--md-on-surface-rgb', `${onSurfaceRgb.r}, ${onSurfaceRgb.g}, ${onSurfaceRgb.b}`);
  }
  
  return theme;
}

/**
 * Convert hex color to RGB
 * @param {string} hex - Hex color code
 * @returns {Object|null} RGB object or null
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Detect workspace from URL path
 * @returns {string} Workspace name
 */
function detectWorkspaceFromPath() {
  const path = window.location.pathname;
  const match = path.match(/workspaces\/([^\/]+)/);
  return match ? match[1] : 'default';
}

/**
 * Load brand configuration from JSON file
 * @param {string} workspaceName - Name of the workspace
 * @returns {Promise<Object>} Brand configuration
 */
async function loadBrandConfig(workspaceName) {
  try {
    const response = await fetch(`workspaces/${workspaceName}/brand-config.json`);
    if (response.ok) {
      const config = await response.json();
      return config.brand || config;
    }
  } catch (error) {
    console.log(`No brand config found for ${workspaceName}, using default theme`);
  }
  return null;
}

/**
 * Apply custom theme from brand configuration
 * @param {Object} brandConfig - Brand configuration object
 */
function applyCustomTheme(brandConfig) {
  const root = document.documentElement;
  
  if (brandConfig.colors) {
    Object.entries(brandConfig.colors).forEach(([key, value]) => {
      const varName = key === 'primary' ? 'dashboard-primary' : 
                     key === 'primaryVariant' ? 'dashboard-primary-variant' :
                     key === 'secondary' ? 'dashboard-secondary' :
                     key === 'secondaryVariant' ? 'dashboard-secondary-variant' :
                     `dashboard-${key}`;
      root.style.setProperty(`--${varName}`, value);
    });
  }
  
  if (brandConfig.gradient) {
    Object.entries(brandConfig.gradient).forEach(([key, value]) => {
      root.style.setProperty(`--dashboard-${key}-gradient`, value);
    });
  }
  
  if (brandConfig.typography) {
    if (brandConfig.typography.fontFamily) {
      root.style.setProperty('--dashboard-font-family', brandConfig.typography.fontFamily);
    }
    if (brandConfig.typography.headingFont) {
      root.style.setProperty('--dashboard-heading-font', brandConfig.typography.headingFont);
    }
  }
  
  // Convert primary color to RGB for rgba() usage
  if (brandConfig.colors && brandConfig.colors.primary) {
    const primaryRgb = hexToRgb(brandConfig.colors.primary);
    if (primaryRgb) {
      root.style.setProperty('--dashboard-primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
    }
  }
}

/**
 * Apply workspace theme with brand config fallback
 * @param {string} workspaceName - Name of the workspace
 */
async function applyWorkspaceThemeWithConfig(workspaceName) {
  // Try to load brand config first
  const brandConfig = await loadBrandConfig(workspaceName);
  
  if (brandConfig) {
    applyCustomTheme(brandConfig);
  } else {
    // Fallback to predefined theme
    applyWorkspaceTheme(workspaceName);
  }
}

// Auto-apply theme on load
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', async () => {
    const workspace = detectWorkspaceFromPath() || 
                     new URLSearchParams(window.location.search).get('workspace') || 
                     'default';
    await applyWorkspaceThemeWithConfig(workspace);
  });
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    workspaceThemes, 
    applyWorkspaceTheme, 
    applyWorkspaceThemeWithConfig,
    loadBrandConfig,
    applyCustomTheme,
    detectWorkspaceFromPath 
  };
}

