#!/usr/bin/env npx ts-node
/**
 * Script para listar todas las tablas en Supabase
 * Identifica tablas relacionadas con Axon y otras funcionalidades
 */

import { SupabaseService } from '../services/supabase/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('ListSupabaseTables');

interface TableInfo {
  table_schema: string;
  table_name: string;
  table_type: string;
  estimated_rows?: number;
}

interface TableGroup {
  category: string;
  tables: TableInfo[];
}

/**
 * Lista todas las tablas en Supabase
 */
async function listAllTables(): Promise<TableInfo[]> {
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
    // Consultar information_schema.tables
    // Nota: Supabase PostgREST no expone information_schema directamente
    // Necesitamos usar una query SQL directa o acceder vía extension
    // Alternativa: intentar listar tablas accesibles y obtener metadatos
    
    // Primero, intentar obtener tablas del esquema público
    let tables: any = null;
    let error: any = { message: 'Function not available, using direct query' };
    
    try {
      const result = await db.rpc('get_tables', {});
      if (result.data) {
        tables = result.data;
        error = result.error;
      }
    } catch {
      // Si no existe la función, usar query directa a information_schema
      error = { message: 'Function not available, using direct query' };
    }

    if (error && error.message.includes('Function not available')) {
      // Usar query SQL directa si tenemos acceso a DB_URL
      logger.warn('RPC function not available, attempting direct SQL query');
      
      // Lista de tablas conocidas de dendrita
      const knownTables = [
        'workspaces',
        'projects',
        'documents',
        'stakeholders',
        'drive_scraping_configs',
        'drive_files',
        'drive_file_permissions',
        'drive_file_revisions',
        'user_service_configs',
        'calendar_events',
        'calendar_calendars',
      ];

      // Lista de tablas posibles de Axon
      const axonTables = [
        'contacts',
        'axon_contacts',
        'whatsapp_contacts',
        'whatsapp_contact',
        'whatsapp_messages',
        'axon_messages',
        'messages',
        'whatsapp_message',
        'conversations',
        'axon_conversations',
        'chats',
        'whatsapp_conversations',
        'axon_media',
        'whatsapp_media',
        'media',
      ];

      // Intentar acceder a cada tabla conocida para verificar si existe
      const existingTables: TableInfo[] = [];
      const allTables = [...knownTables, ...axonTables];
      
      for (const tableName of allTables) {
        try {
          const { error: selectError } = await db
            .from(tableName)
            .select('*')
            .limit(0);
          
          if (!selectError) {
            existingTables.push({
              table_schema: 'public',
              table_name: tableName,
              table_type: 'BASE TABLE',
            });
          }
        } catch {
          // Tabla no existe o no accesible
        }
      }

      return existingTables;
    }

    return tables || [];
  } catch (error: any) {
    logger.error('Error listing tables', error);
    throw error;
  }
}

/**
 * Categoriza las tablas encontradas
 */
function categorizeTables(tables: TableInfo[]): TableGroup[] {
  const axonKeywords = ['axon', 'whatsapp', 'contact', 'message', 'conversation', 'chat'];
  const dendritaKeywords = ['workspace', 'project', 'document', 'stakeholder', 'drive', 'calendar', 'user_service'];
  
  const groups: TableGroup[] = [
    { category: 'Axon (WhatsApp Scraping)', tables: [] },
    { category: 'dendrita (Project Management)', tables: [] },
    { category: 'Other', tables: [] },
  ];

  for (const table of tables) {
    const tableNameLower = table.table_name.toLowerCase();
    
    const isAxon = axonKeywords.some(keyword => tableNameLower.includes(keyword));
    const isDendrita = dendritaKeywords.some(keyword => tableNameLower.includes(keyword));
    
    if (isAxon) {
      groups[0].tables.push(table);
    } else if (isDendrita) {
      groups[1].tables.push(table);
    } else {
      groups[2].tables.push(table);
    }
  }

  return groups.filter(group => group.tables.length > 0);
}

/**
 * Obtiene estimación de filas para una tabla
 */
async function estimateTableRows(db: any, tableName: string): Promise<number | undefined> {
  try {
    // Intentar contar filas (limitado a performance)
    const { count } = await db
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    return count || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Función principal
 */
async function main(): Promise<void> {
  logger.info('=== Verificando Tablas en Supabase ===\n');

  try {
    const tables = await listAllTables();
    
    if (tables.length === 0) {
      logger.warn('No se encontraron tablas. Verifica la conexión a Supabase.');
      console.log('\n💡 Tip: Puede que necesites usar una query SQL directa para listar todas las tablas.');
      console.log('   Ejecuta en Supabase SQL Editor:');
      console.log('   SELECT table_schema, table_name, table_type');
      console.log('   FROM information_schema.tables');
      console.log('   WHERE table_schema = \'public\';');
      return;
    }

    // Obtener estimaciones de filas para tablas relevantes
    const supa = new SupabaseService();
    let dbForCount;
    try {
      dbForCount = supa.db(true);
    } catch {
      dbForCount = supa.db(false);
    }
    
    for (const table of tables) {
      const rowCount = await estimateTableRows(dbForCount, table.table_name);
      table.estimated_rows = rowCount;
    }

    // Categorizar tablas
    const groups = categorizeTables(tables);

    // Mostrar resultados
    console.log('\n📊 Tablas Encontradas:\n');
    console.log('─'.repeat(80));

    for (const group of groups) {
      if (group.tables.length > 0) {
        console.log(`\n📁 ${group.category} (${group.tables.length} tabla(s))`);
        console.log('─'.repeat(80));
        
        for (const table of group.tables) {
          const rowInfo = table.estimated_rows !== undefined 
            ? ` (~${table.estimated_rows.toLocaleString()} filas)` 
            : '';
          console.log(`  • ${table.table_name}${rowInfo}`);
          console.log(`    Schema: ${table.table_schema} | Type: ${table.table_type}`);
        }
      }
    }

    console.log('\n─'.repeat(80));
    console.log(`\n📈 Total: ${tables.length} tabla(s) encontrada(s)\n`);

    // Resumen de tablas de Axon
    const axonTables = groups.find(g => g.category.includes('Axon'));
    if (axonTables && axonTables.tables.length > 0) {
      console.log('🔍 Tablas de Axon identificadas:');
      axonTables.tables.forEach(t => console.log(`   - ${t.table_name}`));
      console.log('\n💡 Para inspeccionar el esquema de una tabla:');
      console.log(`   npx ts-node .dendrita/integrations/scripts/inspect-table-schema.ts <table_name>\n`);
    }

  } catch (error: any) {
    logger.error('Error al listar tablas', error);
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 Verifica:');
    console.log('   1. Que Supabase esté configurado en .dendrita/.env.local');
    console.log('   2. Que tengas SERVICE_ROLE_KEY configurada');
    console.log('   3. Que las credenciales sean correctas');
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch((error) => {
    logger.error('Fatal error', error);
    process.exit(1);
  });
}

export { listAllTables, categorizeTables };

