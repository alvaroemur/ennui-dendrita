/**
 * Utilidades para analizar logs de dendrita
 * Proporciona queries, reportes y estadísticas sobre el uso de la infraestructura
 */

import * as fs from 'fs';
import * as path from 'path';
import { dendritaLogger, DendritaLogEntry, DendritaComponentType } from './dendrita-logger';

export interface ComponentStats {
  component_type: DendritaComponentType;
  component_name: string;
  total_events: number;
  success_count: number;
  error_count: number;
  warning_count: number;
  skipped_count: number;
  average_duration?: number;
  last_used: string;
  first_used: string;
}

export interface UserStats {
  user_id: string;
  total_events: number;
  components_used: number;
  most_used_components: Array<{ component_name: string; count: number }>;
  last_activity: string;
}

export interface TimeRangeStats {
  start_date: string;
  end_date: string;
  total_events: number;
  by_component_type: Record<DendritaComponentType, number>;
  by_event_type: Record<string, number>;
  by_status: Record<string, number>;
  error_rate: number;
  average_duration?: number;
}

export interface DendritaReport {
  period: {
    start: string;
    end: string;
  };
  summary: {
    total_events: number;
    unique_components: number;
    unique_users: number;
    error_rate: number;
  };
  by_component_type: Record<DendritaComponentType, ComponentStats[]>;
  top_components: ComponentStats[];
  top_users: UserStats[];
  recent_errors: DendritaLogEntry[];
  time_range_stats: TimeRangeStats;
}

class DendritaLogAnalyzer {
  /**
   * Obtiene estadísticas de un componente específico
   */
  getComponentStats(
    componentType: DendritaComponentType,
    componentName: string,
    days?: number
  ): ComponentStats | null {
    const logs = dendritaLogger.readComponentLogs(componentType, componentName);
    
    let filteredLogs = logs;
    if (days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      filteredLogs = logs.filter(log => 
        new Date(log.timestamp) >= cutoffDate
      );
    }

    if (filteredLogs.length === 0) {
      return null;
    }

    const successCount = filteredLogs.filter(l => l.status === 'success').length;
    const errorCount = filteredLogs.filter(l => l.status === 'error').length;
    const warningCount = filteredLogs.filter(l => l.status === 'warning').length;
    const skippedCount = filteredLogs.filter(l => l.status === 'skipped').length;

    const durations = filteredLogs
      .map(l => l.duration)
      .filter((d): d is number => d !== undefined);
    const avgDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : undefined;

    const timestamps = filteredLogs.map(l => new Date(l.timestamp).getTime());
    const lastUsed = new Date(Math.max(...timestamps)).toISOString();
    const firstUsed = new Date(Math.min(...timestamps)).toISOString();

    return {
      component_type: componentType,
      component_name: componentName,
      total_events: filteredLogs.length,
      success_count: successCount,
      error_count: errorCount,
      warning_count: warningCount,
      skipped_count: skippedCount,
      average_duration: avgDuration,
      last_used: lastUsed,
      first_used: firstUsed,
    };
  }

  /**
   * Obtiene estadísticas de todos los componentes
   */
  getAllComponentStats(days?: number): ComponentStats[] {
    const allLogs = dendritaLogger.readLogs();
    
    let filteredLogs = allLogs;
    if (days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      filteredLogs = allLogs.filter(log => 
        new Date(log.timestamp) >= cutoffDate
      );
    }

    // Agrupar por componente
    const componentMap = new Map<string, DendritaLogEntry[]>();
    
    for (const log of filteredLogs) {
      const key = `${log.component_type}:${log.component_name}`;
      if (!componentMap.has(key)) {
        componentMap.set(key, []);
      }
      componentMap.get(key)!.push(log);
    }

    // Calcular estadísticas para cada componente
    const stats: ComponentStats[] = [];
    
    for (const [key, logs] of componentMap.entries()) {
      const [componentType, componentName] = key.split(':');
      const componentStats = this.getComponentStats(
        componentType as DendritaComponentType,
        componentName,
        days
      );
      if (componentStats) {
        stats.push(componentStats);
      }
    }

    return stats.sort((a, b) => b.total_events - a.total_events);
  }

  /**
   * Obtiene estadísticas de un usuario
   */
  getUserStats(userId: string, days?: number): UserStats | null {
    const logs = dendritaLogger.readUserLogs(userId);
    
    let filteredLogs = logs;
    if (days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      filteredLogs = logs.filter(log => 
        new Date(log.timestamp) >= cutoffDate
      );
    }

    if (filteredLogs.length === 0) {
      return null;
    }

    // Componentes únicos usados
    const componentSet = new Set<string>();
    const componentCounts = new Map<string, number>();
    
    for (const log of filteredLogs) {
      const key = `${log.component_type}:${log.component_name}`;
      componentSet.add(key);
      componentCounts.set(key, (componentCounts.get(key) || 0) + 1);
    }

    const mostUsed = Array.from(componentCounts.entries())
      .map(([key, count]) => {
        const [, componentName] = key.split(':');
        return { component_name: componentName, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const timestamps = filteredLogs.map(l => new Date(l.timestamp).getTime());
    const lastActivity = new Date(Math.max(...timestamps)).toISOString();

    return {
      user_id: userId,
      total_events: filteredLogs.length,
      components_used: componentSet.size,
      most_used_components: mostUsed,
      last_activity: lastActivity,
    };
  }

  /**
   * Obtiene estadísticas por rango de tiempo
   */
  getTimeRangeStats(startDate: Date, endDate: Date): TimeRangeStats {
    const allLogs = dendritaLogger.readLogs();
    
    const filteredLogs = allLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= startDate && logDate <= endDate;
    });

    const byComponentType: Record<DendritaComponentType, number> = {} as any;
    const byEventType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    let totalDuration = 0;
    let durationCount = 0;
    let errorCount = 0;

    for (const log of filteredLogs) {
      // Por tipo de componente
      byComponentType[log.component_type] = 
        (byComponentType[log.component_type] || 0) + 1;

      // Por tipo de evento
      byEventType[log.event_type] = (byEventType[log.event_type] || 0) + 1;

      // Por status
      const status = log.status || 'unknown';
      byStatus[status] = (byStatus[status] || 0) + 1;

      // Duración
      if (log.duration !== undefined) {
        totalDuration += log.duration;
        durationCount++;
      }

      // Errores
      if (log.status === 'error') {
        errorCount++;
      }
    }

    const avgDuration = durationCount > 0 ? totalDuration / durationCount : undefined;
    const errorRate = filteredLogs.length > 0 
      ? (errorCount / filteredLogs.length) * 100 
      : 0;

    return {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      total_events: filteredLogs.length,
      by_component_type: byComponentType,
      by_event_type: byEventType,
      by_status: byStatus,
      error_rate: errorRate,
      average_duration: avgDuration,
    };
  }

  /**
   * Genera un reporte completo
   */
  generateReport(days: number = 30): DendritaReport {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const allLogs = dendritaLogger.readLogs();
    
    const filteredLogs = allLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= startDate && logDate <= endDate;
    });

    // Componentes únicos
    const componentSet = new Set<string>();
    const userSet = new Set<string>();
    
    for (const log of filteredLogs) {
      componentSet.add(`${log.component_type}:${log.component_name}`);
      if (log.user_id) {
        userSet.add(log.user_id);
      }
    }

    // Estadísticas por tipo de componente
    const byComponentType: Record<DendritaComponentType, ComponentStats[]> = {} as any;
    const allComponentStats = this.getAllComponentStats(days);
    
    for (const stat of allComponentStats) {
      if (!byComponentType[stat.component_type]) {
        byComponentType[stat.component_type] = [];
      }
      byComponentType[stat.component_type].push(stat);
    }

    // Top componentes
    const topComponents = allComponentStats
      .sort((a, b) => b.total_events - a.total_events)
      .slice(0, 10);

    // Top usuarios
    const userStatsMap = new Map<string, UserStats>();
    for (const userId of userSet) {
      const stats = this.getUserStats(userId, days);
      if (stats) {
        userStatsMap.set(userId, stats);
      }
    }
    const topUsers = Array.from(userStatsMap.values())
      .sort((a, b) => b.total_events - a.total_events)
      .slice(0, 10);

    // Errores recientes
    const recentErrors = filteredLogs
      .filter(log => log.status === 'error')
      .sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 20);

    // Tasa de error
    const errorCount = filteredLogs.filter(log => log.status === 'error').length;
    const errorRate = filteredLogs.length > 0 
      ? (errorCount / filteredLogs.length) * 100 
      : 0;

    // Time range stats
    const timeRangeStats = this.getTimeRangeStats(startDate, endDate);

    return {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      summary: {
        total_events: filteredLogs.length,
        unique_components: componentSet.size,
        unique_users: userSet.size,
        error_rate: errorRate,
      },
      by_component_type: byComponentType,
      top_components: topComponents,
      top_users: topUsers,
      recent_errors: recentErrors,
      time_range_stats: timeRangeStats,
    };
  }

  /**
   * Exporta reporte a JSON
   */
  exportReportToJSON(days: number = 30, outputPath?: string): string {
    const report = this.generateReport(days);
    const json = JSON.stringify(report, null, 2);
    
    if (outputPath) {
      fs.writeFileSync(outputPath, json, 'utf8');
    }
    
    return json;
  }

  /**
   * Exporta reporte a formato legible (markdown)
   */
  exportReportToMarkdown(days: number = 30, outputPath?: string): string {
    const report = this.generateReport(days);
    
    let markdown = `# Dendrita Infrastructure Report\n\n`;
    markdown += `**Period:** ${new Date(report.period.start).toLocaleDateString()} - ${new Date(report.period.end).toLocaleDateString()}\n\n`;
    
    markdown += `## Summary\n\n`;
    markdown += `- **Total Events:** ${report.summary.total_events}\n`;
    markdown += `- **Unique Components:** ${report.summary.unique_components}\n`;
    markdown += `- **Unique Users:** ${report.summary.unique_users}\n`;
    markdown += `- **Error Rate:** ${report.summary.error_rate.toFixed(2)}%\n\n`;
    
    markdown += `## Top Components\n\n`;
    for (const component of report.top_components.slice(0, 10)) {
      markdown += `### ${component.component_name} (${component.component_type})\n`;
      markdown += `- **Total Events:** ${component.total_events}\n`;
      markdown += `- **Success:** ${component.success_count}\n`;
      markdown += `- **Errors:** ${component.error_count}\n`;
      if (component.average_duration) {
        markdown += `- **Avg Duration:** ${component.average_duration.toFixed(2)}ms\n`;
      }
      markdown += `- **Last Used:** ${new Date(component.last_used).toLocaleString()}\n\n`;
    }
    
    markdown += `## Recent Errors\n\n`;
    for (const error of report.recent_errors.slice(0, 10)) {
      markdown += `### ${error.component_name} - ${new Date(error.timestamp).toLocaleString()}\n`;
      markdown += `- **Type:** ${error.component_type}\n`;
      markdown += `- **Event:** ${error.event_type}\n`;
      if (error.error) {
        markdown += `- **Error:** ${error.error}\n`;
      }
      markdown += `\n`;
    }
    
    if (outputPath) {
      fs.writeFileSync(outputPath, markdown, 'utf8');
    }
    
    return markdown;
  }
}

// Singleton instance
export const dendritaLogAnalyzer = new DendritaLogAnalyzer();

