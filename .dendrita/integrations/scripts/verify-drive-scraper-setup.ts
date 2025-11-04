#!/usr/bin/env npx ts-node
/**
 * Script de verificación de setup de Drive Scraper
 * Verifica que todas las tablas necesarias estén creadas en Supabase
 */

import { SupabaseService } from '../services/supabase/client';
import { credentials } from '../utils/credentials';
import { createLogger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('VerifyDriveScraperSetup');

interface VerificationResult {
  name: string;
  status: '✅' | '⚠️' | '❌';
  message: string;
  fix?: string;
}

const results: VerificationResult[] = [];

function addResult(name: string, status: '✅' | '⚠️' | '❌', message: string, fix?: string): void {
  results.push({ name, status, message, fix });
}

/**
 * Verifica que Google Workspace esté configurado
 */
function verifyGoogleWorkspace(): void {
  try {
    const google = credentials.getGoogleWorkspace();
    if (google.clientId && google.clientSecret && google.refreshToken) {
      addResult(
        'Google Workspace',
        '✅',
        'Credenciales de Google Workspace configuradas'
      );
    } else {
      addResult(
        'Google Workspace',
        '❌',
        'Faltan credenciales de Google Workspace',
        'Verifica .dendrita/.env.local o sigue .dendrita/integrations/hooks/google-auth-flow.md'
      );
    }
  } catch (error: any) {
    addResult(
      'Google Workspace',
      '❌',
      `Error al verificar Google Workspace: ${error.message}`,
      'Configura Google Workspace siguiendo .dendrita/integrations/hooks/google-auth-flow.md'
    );
  }
}

/**
 * Verifica que Supabase esté configurado
 */
function verifySupabase(): void {
  try {
    const supabase = credentials.getSupabase();
    if (supabase.url && supabase.anonKey) {
      if (supabase.serviceRoleKey) {
        addResult(
          'Supabase',
          '✅',
          'Credenciales de Supabase configuradas (incluye service role)'
        );
      } else {
        addResult(
          'Supabase',
          '⚠️',
          'Supabase configurado pero falta SERVICE_ROLE_KEY (necesaria para escritura)',
          'Agrega SUPABASE_SERVICE_ROLE_KEY a .dendrita/.env.local'
        );
      }
    } else {
      addResult(
        'Supabase',
        '❌',
        'Faltan credenciales de Supabase',
        'Verifica .dendrita/.env.local o sigue .dendrita/integrations/hooks/supabase-setup.md'
      );
    }
  } catch (error: any) {
    addResult(
      'Supabase',
      '❌',
      `Error al verificar Supabase: ${error.message}`,
      'Configura Supabase siguiendo .dendrita/integrations/hooks/supabase-setup.md'
    );
  }
}

/**
 * Verifica que las tablas de Drive scraper existan en Supabase
 */
async function verifyDriveScraperTables(): Promise<void> {
  try {
    const supabaseService = new SupabaseService();
    if (!supabaseService.isConfigured()) {
      addResult(
        'Tablas de Drive Scraper',
        '❌',
        'No se puede verificar: Supabase no está configurado',
        'Configura Supabase primero'
      );
      return;
    }

    // Intentar usar service role, si no está disponible usar anon key
    let db;
    try {
      db = supabaseService.db(true); // Intentar service role primero
    } catch {
      db = supabaseService.db(false); // Fallback a anon key
    }

    const tablesToCheck = [
      {
        name: 'drive_scraping_configs',
        description: 'Configuraciones de scraping por workspace',
      },
      {
        name: 'drive_files',
        description: 'Archivos sincronizados desde Drive',
      },
      {
        name: 'drive_file_permissions',
        description: 'Permisos de archivos',
      },
      {
        name: 'drive_file_revisions',
        description: 'Revisiones de archivos',
      },
    ];

    let allTablesExist = true;
    let missingTables: string[] = [];

    for (const table of tablesToCheck) {
      try {
        // Intentar hacer una consulta simple a la tabla
        const { data, error } = await db
          .from(table.name)
          .select('*')
          .limit(1);

        if (error) {
          // Si el error es que la tabla no existe
          if (error.code === '42P01' || error.message.includes('does not exist')) {
            allTablesExist = false;
            missingTables.push(table.name);
            addResult(
              `Tabla: ${table.name}`,
              '❌',
              `Tabla no existe: ${table.description}`,
              `Ejecuta .dendrita/integrations/services/google/drive-scraper-schema.sql en Supabase SQL Editor`
            );
          } else {
            // Otro tipo de error, pero la tabla existe
            addResult(
              `Tabla: ${table.name}`,
              '✅',
              `Tabla existe: ${table.description}`
            );
          }
        } else {
          // Sin error, la tabla existe
          addResult(
            `Tabla: ${table.name}`,
            '✅',
            `Tabla existe: ${table.description}`
          );
        }
      } catch (error: any) {
        if (error.message?.includes('does not exist') || error.code === '42P01') {
          allTablesExist = false;
          missingTables.push(table.name);
          addResult(
            `Tabla: ${table.name}`,
            '❌',
            `Tabla no existe: ${table.description}`,
            `Ejecuta .dendrita/integrations/services/google/drive-scraper-schema.sql en Supabase SQL Editor`
          );
        } else {
          addResult(
            `Tabla: ${table.name}`,
            '⚠️',
            `Error al verificar: ${error.message}`
          );
        }
      }
    }

    if (allTablesExist) {
      addResult(
        'Verificación de Tablas',
        '✅',
        'Todas las tablas de Drive scraper existen en Supabase'
      );
    } else {
      addResult(
        'Verificación de Tablas',
        '❌',
        `Faltan ${missingTables.length} tabla(s): ${missingTables.join(', ')}`,
        `Ejecuta .dendrita/integrations/services/google/drive-scraper-schema.sql en Supabase SQL Editor`
      );
    }
  } catch (error: any) {
    addResult(
      'Verificación de Tablas',
      '❌',
      `Error al verificar tablas: ${error.message}`,
      'Verifica que Supabase esté configurado correctamente'
    );
  }
}

/**
 * Verifica que el archivo de schema SQL exista
 */
function verifySchemaFile(): void {
  const schemaPath = path.join(
    process.cwd(),
    '.dendrita',
    'integrations',
    'services',
    'google',
    'drive-scraper-schema.sql'
  );

  if (fs.existsSync(schemaPath)) {
    const content = fs.readFileSync(schemaPath, 'utf-8');
    if (content.includes('CREATE TABLE') && content.includes('drive_scraping_configs')) {
      addResult(
        'Schema SQL',
        '✅',
        'Archivo de schema SQL encontrado y válido',
        'Ejecuta este archivo en Supabase SQL Editor'
      );
    } else {
      addResult(
        'Schema SQL',
        '⚠️',
        'Archivo de schema encontrado pero parece incompleto',
        'Verifica .dendrita/integrations/services/google/drive-scraper-schema.sql'
      );
    }
  } else {
    addResult(
      'Schema SQL',
      '❌',
      'Archivo de schema SQL no encontrado',
      'Verifica que .dendrita/integrations/services/google/drive-scraper-schema.sql existe'
    );
  }
}

/**
 * Verifica que las dependencias estén instaladas
 */
function verifyDependencies(): void {
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  const supabasePath = path.join(nodeModulesPath, '@supabase', 'supabase-js');

  if (fs.existsSync(nodeModulesPath) && fs.existsSync(supabasePath)) {
    addResult(
      'Dependencias',
      '✅',
      'Dependencias instaladas (@supabase/supabase-js)'
    );
  } else {
    addResult(
      'Dependencias',
      '❌',
      'Dependencias no instaladas',
      'Ejecuta: npm install'
    );
  }
}

/**
 * Función principal
 */
async function main(): Promise<void> {
  logger.info('=== Verificación de Setup de Drive Scraper ===\n');

  // Verificar credenciales
  verifyGoogleWorkspace();
  verifySupabase();
  verifyDependencies();
  verifySchemaFile();

  // Verificar tablas en Supabase
  await verifyDriveScraperTables();

  // Mostrar resultados
  console.log('\n📊 Resultados de Verificación:\n');
  console.log('─'.repeat(80));

  for (const result of results) {
    console.log(`${result.status} ${result.name}`);
    console.log(`   ${result.message}`);
    if (result.fix) {
      console.log(`   💡 ${result.fix}`);
    }
    console.log('');
  }

  console.log('─'.repeat(80));

  // Resumen
  const successCount = results.filter(r => r.status === '✅').length;
  const warningCount = results.filter(r => r.status === '⚠️').length;
  const errorCount = results.filter(r => r.status === '❌').length;

  console.log(`\n📈 Resumen:`);
  console.log(`   ✅ Exitosos: ${successCount}`);
  console.log(`   ⚠️  Advertencias: ${warningCount}`);
  console.log(`   ❌ Errores: ${errorCount}\n`);

  if (errorCount === 0) {
    logger.info('✅ Setup completo! Todas las verificaciones pasaron.');
    console.log('\n🎉 Puedes proceder a configurar el scraper:');
    console.log('   npx ts-node .dendrita/integrations/scripts/setup-drive-scraper.ts\n');
  } else {
    logger.warn('⚠️  Hay problemas que resolver antes de usar el scraper.');
    console.log('\n📝 Próximos pasos:');
    console.log('   1. Resuelve los errores marcados con ❌');
    console.log('   2. Revisa las advertencias marcadas con ⚠️');
    console.log('   3. Ejecuta este script nuevamente para verificar\n');
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(error => {
    logger.error('Error no manejado', error);
    process.exit(1);
  });
}

export { main };

