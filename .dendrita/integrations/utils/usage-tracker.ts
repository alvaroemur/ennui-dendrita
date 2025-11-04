/**
 * Helper para registrar automáticamente el uso de integraciones
 * Wrapper que puede usarse para envolver métodos de servicios
 */

import { logIntegrationUsage } from './usage-logger';

/**
 * Wrapper que registra automáticamente el uso de un método
 */
export function trackUsage<T extends (...args: unknown[]) => Promise<unknown>>(
  service: string,
  operation: string,
  fn: T
): T {
  return (async (...args: unknown[]) => {
    const startTime = Date.now();
    let status: 'success' | 'error' | 'warning' = 'success';
    let error: Error | undefined;

    try {
      const result = await fn(...args);
      return result;
    } catch (err) {
      status = 'error';
      error = err instanceof Error ? err : new Error(String(err));
      throw err;
    } finally {
      const duration = Date.now() - startTime;
      logIntegrationUsage(service, operation, {
        status,
        duration,
        error,
      });
    }
  }) as T;
}

/**
 * Wrapper síncrono para métodos que no retornan promesas
 */
export function trackUsageSync<T extends (...args: unknown[]) => unknown>(
  service: string,
  operation: string,
  fn: T
): T {
  return ((...args: unknown[]) => {
    const startTime = Date.now();
    let status: 'success' | 'error' | 'warning' = 'success';
    let error: Error | undefined;

    try {
      const result = fn(...args);
      return result;
    } catch (err) {
      status = 'error';
      error = err instanceof Error ? err : new Error(String(err));
      throw err;
    } finally {
      const duration = Date.now() - startTime;
      logIntegrationUsage(service, operation, {
        status,
        duration,
        error,
      });
    }
  }) as T;
}

/**
 * Helper para registrar manualmente el inicio y fin de una operación
 */
export class UsageTracker {
  private service: string;
  private operation: string;
  private startTime: number;
  private metadata?: Record<string, unknown>;

  constructor(service: string, operation: string, metadata?: Record<string, unknown>) {
    this.service = service;
    this.operation = operation;
    this.startTime = Date.now();
    this.metadata = metadata;
  }

  /**
   * Registra éxito de la operación
   */
  success(additionalMetadata?: Record<string, unknown>): void {
    const duration = Date.now() - this.startTime;
    logIntegrationUsage(this.service, this.operation, {
      status: 'success',
      duration,
      metadata: { ...this.metadata, ...additionalMetadata },
    });
  }

  /**
   * Registra error de la operación
   */
  error(err: Error | string, additionalMetadata?: Record<string, unknown>): void {
    const duration = Date.now() - this.startTime;
    logIntegrationUsage(this.service, this.operation, {
      status: 'error',
      duration,
      error: err,
      metadata: { ...this.metadata, ...additionalMetadata },
    });
  }

  /**
   * Registra warning de la operación
   */
  warning(message: string, additionalMetadata?: Record<string, unknown>): void {
    const duration = Date.now() - this.startTime;
    logIntegrationUsage(this.service, this.operation, {
      status: 'warning',
      duration,
      error: message,
      metadata: { ...this.metadata, ...additionalMetadata },
    });
  }
}

