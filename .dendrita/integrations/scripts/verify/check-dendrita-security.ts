/**
 * Script para verificar que los componentes dendrita no expongan datos del usuario
 * ni de los workspaces. Este script debe ejecutarse durante el proceso de dendritificación
 * para asegurar que las capas del sistema no contengan información sensible.
 */

import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from '../utils/logger';

const logger = createLogger('CheckDendritaSecurity');

interface SecurityIssue {
  type: 'user-data' | 'workspace-data' | 'sensitive-data' | 'hardcoded-path';
  severity: 'error' | 'warning';
  file: string;
  line?: number;
  description: string;
  suggestion: string;
}

interface SecurityCheckResult {
  passed: boolean;
  issues: SecurityIssue[];
  checkedFiles: number;
  checkedDirectories: string[];
  metadata: {
    checkDate: string;
    dendritaRoot: string;
  };
}

// Patrones que NO deben aparecer en componentes dendrita
const FORBIDDEN_PATTERNS = {
  // IDs de usuario específicos (excepto example-user)
  userIds: {
    pattern: /\.dendrita\/users\/(?!example-user)[^/]+/gi,
    description: 'Referencia a directorio de usuario específico (no example-user)',
    suggestion: 'Usar variables o placeholders como [user-id] en lugar de IDs reales',
  },
  
  // Nombres de workspaces específicos (excepto template)
  workspaceNames: {
    pattern: /workspaces\/(?!template)[a-z-]+/gi,
    description: 'Referencia a workspace específico (no template)',
    suggestion: 'Usar placeholders como [workspace] o referencias genéricas',
  },
  
  // Rutas hardcodeadas a archivos de usuario
  userPaths: {
    pattern: /\.dendrita\/users\/[^/]+\/(?!example-user)[^/\s"']+/gi,
    description: 'Ruta hardcodeada a archivo de usuario específico',
    suggestion: 'Usar variables o placeholders para rutas de usuario',
  },
  
  // Rutas hardcodeadas a archivos de workspace
  workspacePaths: {
    pattern: /workspaces\/[a-z-]+\/[^/\s"']+\.(json|md|ts|js)/gi,
    description: 'Ruta hardcodeada a archivo de workspace específico',
    suggestion: 'Usar placeholders o referencias genéricas',
  },
  
  // Credenciales o tokens
  credentials: {
    pattern: /(api[_-]?key|secret|token|password|credential|auth)[\s=:]+['"][^'"]{10,}['"]/gi,
    description: 'Posible credencial o token hardcodeado',
    suggestion: 'Usar variables de entorno o placeholders, nunca valores reales',
  },
  
  // IDs de Google Drive, Gmail, etc. (solo si parecen IDs de Google)
  googleIds: {
    pattern: /[0-9a-zA-Z_-]{25,}(?=\s|"|'|`|,|;|\)|$)/g, // IDs largos que podrían ser de Google
    description: 'Posible ID de Google (Drive, Gmail, etc.)',
    suggestion: 'Verificar si es un ID real y reemplazar con placeholder o variable de entorno',
    // Este patrón es más permisivo, solo marca como warning
    // Solo verifica si el ID parece ser de Google (muy largo, alfanumérico)
  },
};

// Directorios que SÍ pueden contener referencias a usuarios/workspaces (son templates)
const ALLOWED_EXCEPTIONS = [
  '.dendrita/users/example-user/',
  'workspaces/template/',
  '.dendrita/templates/',
];

// Extensiones de archivos a verificar
const CHECKED_EXTENSIONS = ['.ts', '.js', '.md', '.json', '.yaml', '.yml'];

/**
 * Verifica si un archivo está en una excepción permitida
 */
function isAllowedException(filePath: string): boolean {
  const normalizedPath = filePath.replace(/\\/g, '/');
  return ALLOWED_EXCEPTIONS.some(exception => normalizedPath.includes(exception));
}

/**
 * Verifica si un patrón está en un contexto permitido (comentarios, documentación genérica)
 */
function isInAllowedContext(
  content: string,
  matchIndex: number,
  pattern: RegExp
): boolean {
  // Verificar si está en un comentario de ejemplo o documentación
  const beforeMatch = content.substring(Math.max(0, matchIndex - 100), matchIndex);
  const afterMatch = content.substring(matchIndex, Math.min(content.length, matchIndex + 100));
  
  // Si está en un comentario con "example" o "placeholder"
  if (beforeMatch.match(/example|placeholder|template|sample/i)) {
    return true;
  }
  
  // Si está en documentación markdown con código de ejemplo
  if (beforeMatch.match(/```|example|ejemplo/i)) {
    return true;
  }
  
  return false;
}

/**
 * Verifica un archivo en busca de datos sensibles
 */
function checkFile(filePath: string): SecurityIssue[] {
  const issues: SecurityIssue[] = [];
  
  // Saltar si está en excepciones permitidas
  if (isAllowedException(filePath)) {
    return issues;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Verificar cada patrón prohibido
    for (const [key, config] of Object.entries(FORBIDDEN_PATTERNS)) {
      const matches = [...content.matchAll(config.pattern)];
      
      for (const match of matches) {
        if (!match.index) continue;
        
        // Verificar si está en contexto permitido
        if (isInAllowedContext(content, match.index, config.pattern)) {
          continue;
        }
        
        // Calcular número de línea
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const lineContent = lines[lineNumber - 1] || '';
        
        // Determinar severidad
        const severity = key === 'credentials' || key === 'userIds' || key === 'workspaceNames' 
          ? 'error' 
          : 'warning';
        
        issues.push({
          type: key.includes('user') ? 'user-data' 
            : key.includes('workspace') ? 'workspace-data'
            : key === 'credentials' ? 'sensitive-data'
            : 'hardcoded-path',
          severity,
          file: filePath,
          line: lineNumber,
          description: `${config.description} encontrado: "${match[0].substring(0, 50)}${match[0].length > 50 ? '...' : ''}"`,
          suggestion: config.suggestion,
        });
      }
    }
  } catch (error) {
    logger.warn(`Error reading file ${filePath}: ${error}`);
  }
  
  return issues;
}

/**
 * Verifica un directorio recursivamente
 */
function checkDirectory(
  dirPath: string,
  checkedFiles: string[],
  issues: SecurityIssue[]
): void {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      // Saltar directorios comunes que no necesitan verificación
      if (entry.isDirectory()) {
        // Saltar node_modules, .git, dist, build, etc.
        if (['node_modules', '.git', 'dist', 'build', '.cache', 'logs'].includes(entry.name)) {
          continue;
        }
        
        // Verificar recursivamente
        checkDirectory(fullPath, checkedFiles, issues);
        continue;
      }
      
      // Verificar solo archivos con extensiones relevantes
      const ext = path.extname(entry.name);
      if (!CHECKED_EXTENSIONS.includes(ext)) {
        continue;
      }
      
      // Verificar archivo
      checkedFiles.push(fullPath);
      const fileIssues = checkFile(fullPath);
      issues.push(...fileIssues);
    }
  } catch (error) {
    logger.warn(`Error reading directory ${dirPath}: ${error}`);
  }
}

/**
 * Verifica componentes dendrita en busca de datos sensibles
 */
export function checkDendritaSecurity(
  targetPath?: string,
  options: {
    strict?: boolean;
    excludePatterns?: string[];
  } = {}
): SecurityCheckResult {
  const dendritaRoot = path.resolve(__dirname, '../../..');
  const target = targetPath 
    ? path.resolve(targetPath)
    : path.join(dendritaRoot, '.dendrita');
  
  const issues: SecurityIssue[] = [];
  const checkedFiles: string[] = [];
  const checkedDirectories: string[] = [];
  
  logger.info(`Checking dendrita security in: ${target}`);
  
  // Verificar si es un archivo o directorio
  if (fs.statSync(target).isFile()) {
    // Verificar un solo archivo
    checkedFiles.push(target);
    const fileIssues = checkFile(target);
    issues.push(...fileIssues);
  } else {
    // Verificar directorio recursivamente
    checkDirectory(target, checkedFiles, issues);
    checkedDirectories.push(target);
  }
  
  // Filtrar issues según opciones
  let filteredIssues = issues;
  if (options.excludePatterns) {
    filteredIssues = issues.filter(issue => 
      !options.excludePatterns!.some(pattern => issue.file.includes(pattern))
    );
  }
  
  // En modo estricto, cualquier error hace fallar
  const passed = options.strict
    ? filteredIssues.filter(i => i.severity === 'error').length === 0
    : filteredIssues.filter(i => i.severity === 'error').length === 0;
  
  return {
    passed,
    issues: filteredIssues,
    checkedFiles: checkedFiles.length,
    checkedDirectories: checkedDirectories.length,
    metadata: {
      checkDate: new Date().toISOString(),
      dendritaRoot,
    },
  };
}

/**
 * Muestra el resultado de la verificación de forma legible
 */
export function printSecurityCheckResult(result: SecurityCheckResult): void {
  console.log('\n=== Verificación de Seguridad Dendrita ===\n');
  console.log(`Archivos verificados: ${result.checkedFiles}`);
  console.log(`Directorios verificados: ${result.checkedDirectories.length}`);
  console.log(`Fecha de verificación: ${result.metadata.checkDate}\n`);
  
  if (result.issues.length === 0) {
    console.log('✅ No se encontraron problemas de seguridad.\n');
    return;
  }
  
  // Agrupar por severidad
  const errors = result.issues.filter(i => i.severity === 'error');
  const warnings = result.issues.filter(i => i.severity === 'warning');
  
  if (errors.length > 0) {
    console.log(`❌ Errores encontrados: ${errors.length}\n`);
    errors.forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.type.toUpperCase()}] ${issue.file}${issue.line ? `:${issue.line}` : ''}`);
      console.log(`   ${issue.description}`);
      console.log(`   💡 Sugerencia: ${issue.suggestion}\n`);
    });
  }
  
  if (warnings.length > 0) {
    console.log(`⚠️  Advertencias encontradas: ${warnings.length}\n`);
    warnings.forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.type.toUpperCase()}] ${issue.file}${issue.line ? `:${issue.line}` : ''}`);
      console.log(`   ${issue.description}`);
      console.log(`   💡 Sugerencia: ${issue.suggestion}\n`);
    });
  }
  
  console.log(`\n${result.passed ? '✅' : '❌'} Verificación ${result.passed ? 'exitosa' : 'fallida'}\n`);
}

/**
 * Función principal para ejecutar desde CLI
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const targetPath = args.find(arg => !arg.startsWith('--')) || undefined;
  const strict = args.includes('--strict');
  const excludePatterns = args
    .filter(arg => arg.startsWith('--exclude='))
    .map(arg => arg.replace('--exclude=', ''));
  
  try {
    const result = checkDendritaSecurity(targetPath, {
      strict,
      excludePatterns: excludePatterns.length > 0 ? excludePatterns : undefined,
    });
    
    printSecurityCheckResult(result);
    
    // Exit code basado en resultado
    process.exit(result.passed ? 0 : 1);
  } catch (error: any) {
    logger.error('Security check failed', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

export { SecurityIssue, SecurityCheckResult };

