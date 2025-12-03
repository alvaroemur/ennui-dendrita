#!/usr/bin/env npx ts-node
/**
 * Script para inspeccionar el esquema de una tabla específica en Supabase
 * Muestra columnas, tipos, constraints y relaciones
 */

import { SupabaseService } from '../services/supabase/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('InspectTableSchema');

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length: number | null;
  numeric_precision: number | null;
  numeric_scale: number | null;
}

interface ForeignKeyInfo {
  constraint_name: string;
  column_name: string;
  foreign_table_name: string;
  foreign_column_name: string;
}

/**
 * Intenta obtener información de la tabla mediante una muestra
 */
async function inspectTableBySample(db: any, tableName: string): Promise<ColumnInfo[]> {
  try {
    // Obtener una muestra de datos para inferir estructura
    const { data, error } = await db
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error || !data || data.length === 0) {
      return [];
    }

    // Inferir tipos desde la muestra
    const sample = data[0];
    const columns: ColumnInfo[] = [];
    
    for (const [key, value] of Object.entries(sample)) {
      let dataType = 'unknown';
      
      if (value === null) {
        dataType = 'unknown (null)';
      } else if (typeof value === 'string') {
        // Intentar detectar UUIDs, timestamps, etc.
        if (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          dataType = 'uuid';
        } else if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
          dataType = 'timestamptz';
        } else if (value.length > 100) {
          dataType = 'text';
        } else {
          dataType = 'varchar';
        }
      } else if (typeof value === 'number') {
        dataType = Number.isInteger(value) ? 'integer' : 'numeric';
      } else if (typeof value === 'boolean') {
        dataType = 'boolean';
      } else if (Array.isArray(value)) {
        dataType = 'array';
      } else if (typeof value === 'object') {
        dataType = 'jsonb';
      }
      
      columns.push({
        column_name: key,
        data_type: dataType,
        is_nullable: value === null ? 'YES' : 'NO',
        column_default: null,
        character_maximum_length: null,
        numeric_precision: null,
        numeric_scale: null,
      });
    }

    return columns;
  } catch (error: any) {
    logger.warn(`Could not inspect table by sample: ${error.message}`);
    return [];
  }
}

/**
 * Obtiene el conteo de filas de una tabla
 */
async function getRowCount(db: any, tableName: string): Promise<number | null> {
  try {
    const { count } = await db
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    return count || null;
  } catch {
    return null;
  }
}

/**
 * Intenta obtener información de foreign keys analizando nombres de columnas
 */
function inferForeignKeys(columns: ColumnInfo[]): Partial<ForeignKeyInfo>[] {
  const foreignKeys: Partial<ForeignKeyInfo>[] = [];
  
  for (const col of columns) {
    if (!col.column_name) continue;
    const colName = col.column_name;
    
    // Patrones comunes de foreign keys
    if (colName.endsWith('_id') && (col.data_type === 'uuid' || col.data_type === 'text')) {
      const baseName = colName.replace(/_id$/, '');
      const possibleTable = baseName.endsWith('s') 
        ? baseName 
        : `${baseName}s`;
      
      foreignKeys.push({
        column_name: colName,
        foreign_table_name: possibleTable,
        foreign_column_name: 'id',
      });
    }
  }
  
  return foreignKeys;
}

/**
 * Inspecciona el esquema de una tabla
 */
async function inspectTableSchema(tableName: string): Promise<void> {
  const supa = new SupabaseService();

  if (!supa.isConfigured()) {
    throw new Error('Supabase not configured. Set SUPABASE_URL and keys in .env.local');
  }

  // Intentar usar service role, si no está disponible usar anon key
  let db;
  try {
    db = supa.db(true); // Intentar service role primero
  } catch {
    logger.warn('Service role key not available, using anon key');
    db = supa.db(false); // Fallback a anon key
  }

  try {
    // Verificar que la tabla existe
    const { error: accessError } = await db
      .from(tableName)
      .select('*')
      .limit(0);
    
    if (accessError) {
      if (accessError.code === '42P01' || accessError.message.includes('does not exist')) {
        throw new Error(`Table '${tableName}' does not exist`);
      }
      throw new Error(`Cannot access table: ${accessError.message}`);
    }

    // Obtener información de la tabla
    const rowCount = await getRowCount(db, tableName);
    const columns = await inspectTableBySample(db, tableName);
    const foreignKeys = inferForeignKeys(columns);

    // Mostrar resultados
    console.log('\n📊 Esquema de Tabla:', tableName);
    console.log('─'.repeat(80));
    
    if (rowCount !== null) {
      console.log(`\n📈 Filas: ${rowCount.toLocaleString()}`);
    }
    
    console.log(`\n📋 Columnas (${columns.length}):`);
    console.log('─'.repeat(80));
    
    if (columns.length === 0) {
      console.log('  ⚠️  No se pudo obtener información de columnas');
      console.log('  💡 La tabla puede estar vacía o no ser accesible');
    } else {
      for (const col of columns) {
        if (!col.column_name) continue;
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const length = col.character_maximum_length 
          ? `(${col.character_maximum_length})` 
          : '';
        const precision = col.numeric_precision 
          ? `(${col.numeric_precision}${col.numeric_scale ? ',' + col.numeric_scale : ''})` 
          : '';
        
        console.log(`\n  • ${col.column_name}`);
        console.log(`    Tipo: ${col.data_type || 'unknown'}${length}${precision}`);
        console.log(`    Nullable: ${nullable}`);
        if (col.column_default) {
          console.log(`    Default: ${col.column_default}`);
        }
      }
    }

    // Mostrar foreign keys inferidos
    if (foreignKeys.length > 0) {
      console.log(`\n🔗 Relaciones Inferidas (${foreignKeys.length}):`);
      console.log('─'.repeat(80));
      
      for (const fk of foreignKeys) {
        if (!fk.column_name || !fk.foreign_table_name || !fk.foreign_column_name) continue;
        console.log(`\n  • ${fk.column_name}`);
        console.log(`    → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        console.log(`    (Nota: Inferido por nombre, verificar con SQL directo)`);
      }
    }

    // Mostrar muestra de datos
    console.log(`\n📄 Muestra de Datos:`);
    console.log('─'.repeat(80));
    
    const { data: sample, error: sampleError } = await db
      .from(tableName)
      .select('*')
      .limit(3);
    
    if (sampleError) {
      console.log(`  ⚠️  Error al obtener muestra: ${sampleError.message}`);
    } else if (sample && sample.length > 0) {
      console.log(`\n  ${JSON.stringify(sample, null, 2)}`);
    } else {
      console.log('  (Tabla vacía)');
    }

    console.log('\n─'.repeat(80));
    console.log('\n💡 Para obtener esquema completo (con constraints reales):');
    console.log('   Ejecuta en Supabase SQL Editor:');
    console.log(`   SELECT column_name, data_type, is_nullable, column_default`);
    console.log(`   FROM information_schema.columns`);
    console.log(`   WHERE table_name = '${tableName}';`);
    console.log(`\n   SELECT`);
    console.log(`     tc.constraint_name,`);
    console.log(`     kcu.column_name,`);
    console.log(`     ccu.table_name AS foreign_table_name,`);
    console.log(`     ccu.column_name AS foreign_column_name`);
    console.log(`   FROM information_schema.table_constraints AS tc`);
    console.log(`   JOIN information_schema.key_column_usage AS kcu`);
    console.log(`     ON tc.constraint_name = kcu.constraint_name`);
    console.log(`   JOIN information_schema.constraint_column_usage AS ccu`);
    console.log(`     ON ccu.constraint_name = tc.constraint_name`);
    console.log(`   WHERE tc.constraint_type = 'FOREIGN KEY'`);
    console.log(`     AND tc.table_name = '${tableName}';`);
    console.log('');

  } catch (error: any) {
    logger.error('Error inspecting table', error);
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

/**
 * Función principal
 */
async function main(): Promise<void> {
  const tableName = process.argv[2];

  if (!tableName) {
    console.error('\n❌ Error: Debes especificar el nombre de la tabla');
    console.log('\n📖 Uso:');
    console.log('   npx ts-node .dendrita/integrations/scripts/inspect-table-schema.ts <table_name>');
    console.log('\n📝 Ejemplo:');
    console.log('   npx ts-node .dendrita/integrations/scripts/inspect-table-schema.ts contacts');
    console.log('   npx ts-node .dendrita/integrations/scripts/inspect-table-schema.ts whatsapp_messages');
    process.exit(1);
  }

  logger.info(`=== Inspeccionando Tabla: ${tableName} ===\n`);
  
  await inspectTableSchema(tableName);
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch((error) => {
    logger.error('Fatal error', error);
    process.exit(1);
  });
}

export { inspectTableSchema };

