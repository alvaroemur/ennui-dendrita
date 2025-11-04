/**
 * Utilidades para consultar estadísticas de uso de integraciones
 */

import { usageLogger, UsageLogEntry, UsageStats } from './usage-logger';

export interface ServiceUsageReport {
  service: string;
  stats: UsageStats;
  recentLogs: UsageLogEntry[];
}

export interface OverallUsageReport {
  totalCalls: number;
  services: Record<string, UsageStats>;
  mostUsedServices: Array<{ service: string; calls: number }>;
  mostUsedOperations: Array<{ service: string; operation: string; calls: number }>;
  errorRate: number;
  averageDuration: number;
}

class UsageStatsCalculator {
  /**
   * Calcula estadísticas para un servicio específico
   */
  getServiceStats(service: string, days: number = 30): UsageStats {
    const logs = this.getLogsForPeriod(days).filter((log) => log.service === service);
    return this.calculateStatsFromLogs(service, logs);
  }

  /**
   * Obtiene estadísticas de todos los servicios
   */
  getAllServicesStats(days: number = 30): Record<string, UsageStats> {
    const logs = this.getLogsForPeriod(days);
    const services = new Set(logs.map((log) => log.service));
    const stats: Record<string, UsageStats> = {};

    for (const service of services) {
      const serviceLogs = logs.filter((log) => log.service === service);
      stats[service] = this.calculateStatsFromLogs(service, serviceLogs);
    }

    return stats;
  }

  /**
   * Genera un reporte completo de uso
   */
  getOverallReport(days: number = 30): OverallUsageReport {
    const logs = this.getLogsForPeriod(days);
    const services = this.getAllServicesStats(days);

    // Calcular totales
    const totalCalls = logs.length;
    const successCalls = logs.filter((log) => log.status === 'success').length;
    const errorCalls = logs.filter((log) => log.status === 'error').length;
    const errorRate = totalCalls > 0 ? (errorCalls / totalCalls) * 100 : 0;

    // Calcular duración promedio
    const durations = logs.filter((log) => log.duration !== undefined).map((log) => log.duration!);
    const averageDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

    // Servicios más usados
    const serviceCalls: Record<string, number> = {};
    for (const log of logs) {
      serviceCalls[log.service] = (serviceCalls[log.service] || 0) + 1;
    }
    const mostUsedServices = Object.entries(serviceCalls)
      .map(([service, calls]) => ({ service, calls }))
      .sort((a, b) => b.calls - a.calls)
      .slice(0, 10);

    // Operaciones más usadas
    const operationCalls: Record<string, number> = {};
    for (const log of logs) {
      const key = `${log.service}:${log.operation}`;
      operationCalls[key] = (operationCalls[key] || 0) + 1;
    }
    const mostUsedOperations = Object.entries(operationCalls)
      .map(([key, calls]) => {
        const [service, operation] = key.split(':');
        return { service, operation, calls };
      })
      .sort((a, b) => b.calls - a.calls)
      .slice(0, 10);

    return {
      totalCalls,
      services,
      mostUsedServices,
      mostUsedOperations,
      errorRate,
      averageDuration,
    };
  }

  /**
   * Genera un reporte para un servicio específico
   */
  getServiceReport(service: string, days: number = 30, recentLogsLimit: number = 20): ServiceUsageReport {
    const stats = this.getServiceStats(service, days);
    const recentLogs = usageLogger.readServiceLogs(service, recentLogsLimit);

    return {
      service,
      stats,
      recentLogs,
    };
  }

  /**
   * Calcula estadísticas desde un array de logs
   */
  private calculateStatsFromLogs(service: string, logs: UsageLogEntry[]): UsageStats {
    const totalCalls = logs.length;
    const successCalls = logs.filter((log) => log.status === 'success').length;
    const errorCalls = logs.filter((log) => log.status === 'error').length;

    // Calcular duración promedio
    const durations = logs.filter((log) => log.duration !== undefined).map((log) => log.duration!);
    const averageDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

    // Último uso
    const lastUsed = logs.length > 0 ? logs[0].timestamp : 'never';

    // Contar operaciones
    const operations: Record<string, number> = {};
    for (const log of logs) {
      operations[log.operation] = (operations[log.operation] || 0) + 1;
    }

    return {
      service,
      totalCalls,
      successCalls,
      errorCalls,
      averageDuration,
      lastUsed,
      operations,
    };
  }

  /**
   * Obtiene logs de un período específico
   */
  private getLogsForPeriod(days: number): UsageLogEntry[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const allLogs = usageLogger.readLogs();
    return allLogs.filter((log) => {
      const logDate = new Date(log.timestamp);
      return logDate >= cutoffDate;
    });
  }
}

export const usageStats = new UsageStatsCalculator();

/**
 * Helper para formatear estadísticas como texto
 */
export function formatStatsReport(report: OverallUsageReport): string {
  const lines: string[] = [];

  lines.push('📊 Reporte de Uso de Integraciones');
  lines.push('='.repeat(50));
  lines.push(`Total de llamadas: ${report.totalCalls}`);
  lines.push(`Tasa de error: ${report.errorRate.toFixed(2)}%`);
  lines.push(`Duración promedio: ${report.averageDuration.toFixed(0)}ms`);
  lines.push('');

  lines.push('🔝 Servicios más usados:');
  report.mostUsedServices.slice(0, 5).forEach((item, index) => {
    lines.push(`  ${index + 1}. ${item.service}: ${item.calls} llamadas`);
  });
  lines.push('');

  lines.push('🔝 Operaciones más usadas:');
  report.mostUsedOperations.slice(0, 5).forEach((item, index) => {
    lines.push(`  ${index + 1}. ${item.service}.${item.operation}: ${item.calls} llamadas`);
  });
  lines.push('');

  lines.push('📈 Estadísticas por servicio:');
  for (const [service, stats] of Object.entries(report.services)) {
    lines.push(`  ${service}:`);
    lines.push(`    Total: ${stats.totalCalls}`);
    lines.push(`    Éxitos: ${stats.successCalls}`);
    lines.push(`    Errores: ${stats.errorCalls}`);
    lines.push(`    Duración promedio: ${stats.averageDuration.toFixed(0)}ms`);
    lines.push(`    Último uso: ${new Date(stats.lastUsed).toLocaleString()}`);
    lines.push('');
  }

  return lines.join('\n');
}

