/**
 * Helper para facilitar la integración de logging de dendrita en scripts
 * 
 * Uso:
 *   import { withDendritaLogging } from '../utils/script-logging-helper';
 *   
 *   async function main() {
 *     return await withDendritaLogging(async () => {
 *       // Tu código aquí
 *       return { result: 'success', count: 10 };
 *     });
 *   }
 */

import * as path from 'path';
import { dendritaLogger } from '../../../utils/dendrita-logger';

interface ScriptLoggingOptions {
  user_id?: string;
  workspace?: string;
  project?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Wrapper que automáticamente registra inicio y fin de ejecución de un script
 */
export async function withDendritaLogging<T>(
  fn: () => Promise<T>,
  options: ScriptLoggingOptions = {}
): Promise<T> {
  const startTime = Date.now();
  const scriptPath = __filename;
  const scriptName = path.basename(scriptPath, path.extname(scriptPath));
  
  let scriptId: string | undefined;

  try {
    // Registrar inicio de ejecución
    scriptId = dendritaLogger.logScriptExecution(
      scriptName,
      scriptPath,
      {
        user_id: options.user_id,
        workspace: options.workspace,
        project: options.project,
        status: 'success',
      }
    );

    // Ejecutar función
    const result = await fn();

    // Registrar éxito
    dendritaLogger.log({
      level: 'info',
      component_type: 'script',
      component_name: scriptName,
      component_path: scriptPath,
      user_id: options.user_id,
      workspace: options.workspace,
      project: options.project,
      event_type: 'execute',
      event_description: `Script "${scriptName}" completed successfully`,
      status: 'success',
      duration: Date.now() - startTime,
      triggered_by: scriptId,
      metadata: {
        ...options.metadata,
        result_type: typeof result,
      },
    });

    return result;
  } catch (error: any) {
    // Registrar error
    dendritaLogger.log({
      level: 'error',
      component_type: 'script',
      component_name: scriptName,
      component_path: scriptPath,
      user_id: options.user_id,
      workspace: options.workspace,
      project: options.project,
      event_type: 'execute',
      event_description: `Script "${scriptName}" failed`,
      status: 'error',
      duration: Date.now() - startTime,
      error: error.message,
      triggered_by: scriptId,
      metadata: options.metadata,
    });

    throw error;
  }
}

/**
 * Helper para registrar eventos intermedios en un script
 */
export function logScriptEvent(
  eventType: string,
  description: string,
  options: {
    status?: 'success' | 'error' | 'warning';
    metadata?: Record<string, unknown>;
    triggered_by?: string;
  } = {}
): string {
  const scriptPath = __filename;
  const scriptName = path.basename(scriptPath, path.extname(scriptPath));

  return dendritaLogger.log({
    level: options.status === 'error' ? 'error' : options.status === 'warning' ? 'warn' : 'info',
    component_type: 'script',
    component_name: scriptName,
    component_path: scriptPath,
    event_type: eventType,
    event_description: description,
    status: options.status || 'success',
    triggered_by: options.triggered_by,
    metadata: options.metadata,
  });
}

