#!/usr/bin/env npx ts-node
/**
 * EJEMPLO: Usar AxonConnector para acceder a datos de Axon
 */

import { AxonConnector } from '../services/axon/connector';
import { createLogger } from '../utils/logger';

const logger = createLogger('AxonConnectorExample');

async function main(): Promise<void> {
  logger.info('=== Ejemplo de Uso de AxonConnector ===\n');

  try {
    // Inicializar el conector
    const axon = new AxonConnector();

    if (!axon.isConfigured()) {
      logger.warn('Supabase not configured. Set SUPABASE_URL and keys in .env.local');
      return;
    }

    logger.info('1. Detectando nombres de tablas...');
    await axon.detectTableNames();

    logger.info('2. Obteniendo contactos...');
    const contacts = await axon.getContacts({ limit: 10 });
    console.log(`   Encontrados ${contacts.length} contactos`);
    
    if (contacts.length > 0) {
      console.log(`   Primer contacto: ${contacts[0].name || 'Sin nombre'} (${contacts[0].phone})`);
    }

    logger.info('3. Obteniendo mensajes recientes...');
    const messages = await axon.getMessages({ limit: 10 });
    console.log(`   Encontrados ${messages.length} mensajes`);
    
    if (messages.length > 0) {
      const firstMessage = messages[0];
      console.log(`   Último mensaje: ${firstMessage.message_text?.substring(0, 50)}...`);
      console.log(`   De: ${firstMessage.from}, Fecha: ${firstMessage.timestamp}`);
    }

    logger.info('4. Obteniendo conversaciones...');
    const conversations = await axon.getConversations({ limit: 10 });
    console.log(`   Encontradas ${conversations.length} conversaciones`);
    
    if (conversations.length > 0) {
      const firstConv = conversations[0];
      console.log(`   Primera conversación: ${firstConv.name || 'Sin nombre'}`);
      console.log(`   Mensajes: ${firstConv.message_count || 0}`);
    }

    logger.info('\n✅ Ejemplo completado exitosamente');

  } catch (error: any) {
    logger.error('Error en ejemplo', error);
    console.error('\n❌ Error:', error.message);
    
    if (error.message.includes('table name not set')) {
      console.log('\n💡 Tip: Las tablas de Axon no fueron detectadas automáticamente.');
      console.log('   Configura los nombres de tablas manualmente:');
      console.log('   axon.setTableNames({');
      console.log('     contacts: "tu_tabla_contactos",');
      console.log('     messages: "tu_tabla_mensajes",');
      console.log('     conversations: "tu_tabla_conversaciones"');
      console.log('   });');
    }
  }
}

if (require.main === module) {
  main().catch((error) => {
    logger.error('Fatal error', error);
    process.exit(1);
  });
}

