/**
 * Ejemplo de uso del sistema de logging interno de integraciones
 */

import { logIntegrationUsage } from '../utils/usage-logger';
import { usageStats, formatStatsReport } from '../utils/usage-stats';
import { UsageTracker, trackUsage } from '../utils/usage-tracker';

// ============================================
// Ejemplo 1: Registro manual básico
// ============================================

async function example1_ManualLogging() {
  console.log('=== Ejemplo 1: Registro Manual ===');

  // Registrar uso exitoso
  logIntegrationUsage('OpenAI', 'chatCompletion', {
    status: 'success',
    duration: 150,
    metadata: {
      model: 'gpt-4',
      tokens: 150,
    },
  });

  // Registrar error
  logIntegrationUsage('Supabase', 'query', {
    status: 'error',
    duration: 50,
    error: new Error('Connection timeout'),
    metadata: {
      table: 'users',
    },
  });
}

// ============================================
// Ejemplo 2: Uso con UsageTracker
// ============================================

async function example2_UsageTracker() {
  console.log('=== Ejemplo 2: UsageTracker ===');

  const tracker = new UsageTracker('Supabase', 'syncDocuments', {
    workspace: 'ennui',
  });

  try {
    // Simular operación
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Registrar éxito
    tracker.success({ documentsSynced: 10 });
  } catch (error) {
    // Registrar error
    tracker.error(error as Error);
  }
}

// ============================================
// Ejemplo 3: Wrapper automático
// ============================================

async function example3_AutoWrapper() {
  console.log('=== Ejemplo 3: Wrapper Automático ===');

  // Método original
  async function fetchData() {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return { data: 'example' };
  }

  // Envolver con tracking automático
  const trackedFetchData = trackUsage('MyService', 'fetchData', fetchData);

  // Usar método tracked
  await trackedFetchData();
}

// ============================================
// Ejemplo 4: Consultar estadísticas
// ============================================

async function example4_Statistics() {
  console.log('=== Ejemplo 4: Estadísticas ===');

  // Estadísticas de un servicio específico
  const stats = usageStats.getServiceStats('OpenAI', 30);
  console.log('Estadísticas de OpenAI:');
  console.log(`  Total de llamadas: ${stats.totalCalls}`);
  console.log(`  Éxitos: ${stats.successCalls}`);
  console.log(`  Errores: ${stats.errorCalls}`);
  console.log(`  Duración promedio: ${stats.averageDuration.toFixed(0)}ms`);
  console.log(`  Último uso: ${stats.lastUsed}`);

  // Reporte completo
  const report = usageStats.getOverallReport(30);
  console.log('\n=== Reporte Completo ===');
  console.log(formatStatsReport(report));

  // Servicios más usados
  console.log('\n=== Servicios Más Usados ===');
  report.mostUsedServices.slice(0, 5).forEach((item, index) => {
    console.log(`${index + 1}. ${item.service}: ${item.calls} llamadas`);
  });

  // Operaciones más usadas
  console.log('\n=== Operaciones Más Usadas ===');
  report.mostUsedOperations.slice(0, 5).forEach((item, index) => {
    console.log(`${index + 1}. ${item.service}.${item.operation}: ${item.calls} llamadas`);
  });
}

// ============================================
// Ejemplo 5: Integración en un servicio
// ============================================

class ExampleService {
  private name = 'ExampleService';

  // Método con tracking manual
  async processData(data: string) {
    const tracker = new UsageTracker(this.name, 'processData', {
      dataLength: data.length,
    });

    try {
      // Simular procesamiento
      await new Promise((resolve) => setTimeout(resolve, 200));
      const result = { processed: data.toUpperCase() };

      tracker.success({ resultLength: result.processed.length });
      return result;
    } catch (error) {
      tracker.error(error as Error);
      throw error;
    }
  }

  // Método con wrapper automático
  async fetchData() {
    // ... implementación ...
    return { data: 'example' };
  }
}

// Aplicar wrapper automático
const service = new ExampleService();
const trackedFetchData = trackUsage('ExampleService', 'fetchData', service.fetchData.bind(service));

// ============================================
// Ejecutar ejemplos
// ============================================

async function runExamples() {
  try {
    await example1_ManualLogging();
    await example2_UsageTracker();
    await example3_AutoWrapper();
    await example4_Statistics();
  } catch (error) {
    console.error('Error en ejemplos:', error);
  }
}

// Descomentar para ejecutar:
// runExamples();

export { example1_ManualLogging, example2_UsageTracker, example3_AutoWrapper, example4_Statistics };

