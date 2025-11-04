/**
 * Script simple para probar la conexión a Reddit
 * 
 * Uso:
 *   npx ts-node .dendrita/integrations/examples/reddit-test-connection.ts
 */

import { RedditClient } from '../services/reddit/client';
import { credentials } from '../utils/credentials';
import { createLogger } from '../utils/logger';

const logger = createLogger('RedditTest');

async function testConnection() {
  try {
    console.log('\n🔴 Probando conexión a Reddit...\n');

    // 1. Verificar configuración
    console.log('1️⃣ Verificando configuración...');
    const isConfigured = credentials.hasReddit();
    
    if (!isConfigured) {
      console.log('❌ Reddit NO está configurado');
      console.log('\n📝 Para configurar Reddit:');
      console.log('   1. Ve a https://www.reddit.com/prefs/apps');
      console.log('   2. Crea una nueva aplicación (tipo "script")');
      console.log('   3. Agrega las credenciales a .dendrita/.env.local:');
      console.log('      REDDIT_CLIENT_ID=tu_client_id');
      console.log('      REDDIT_CLIENT_SECRET=tu_secret');
      console.log('      REDDIT_USER_AGENT=app_name/1.0 by (tu_username) - url');
      console.log('      REDDIT_USERNAME=tu_username');
      console.log('      REDDIT_PASSWORD=tu_password');
      console.log('\n📚 Ver documentación completa en:');
      console.log('   .dendrita/integrations/hooks/reddit-setup.md\n');
      process.exit(1);
    }

    console.log('✅ Reddit está configurado\n');

    // 2. Crear cliente
    console.log('2️⃣ Creando cliente de Reddit...');
    const reddit = new RedditClient();
    console.log('✅ Cliente creado\n');

    // 3. Autenticar
    console.log('3️⃣ Autenticando...');
    await reddit.authenticate();
    console.log('✅ Autenticación exitosa\n');

    // 4. Obtener información del usuario (si tiene username/password)
    try {
      console.log('4️⃣ Obteniendo información del usuario...');
      const me = await reddit.getMe();
      console.log(`✅ Usuario autenticado: ${me.name}`);
      console.log(`   Karma: ${me.total_karma || 'N/A'}`);
      console.log(`   Tipo de autenticación: ${me.name ? 'Password Grant (Escritura habilitada)' : 'Client Credentials (Solo lectura)'}\n`);
    } catch (error: any) {
      console.log('⚠️  No se pudo obtener información del usuario (modo solo lectura)\n');
    }

    // 5. Probar lectura (obtener info de un subreddit)
    console.log('5️⃣ Probando lectura (obtener info de subreddit)...');
    try {
      const subredditInfo = await reddit.getSubredditInfo('test');
      console.log(`✅ Lectura exitosa`);
      console.log(`   Subreddit: r/${subredditInfo.data.display_name}`);
      console.log(`   Suscriptores: ${subredditInfo.data.subscribers}\n`);
    } catch (error: any) {
      console.log(`⚠️  Error al leer subreddit: ${error.message}\n`);
    }

    console.log('🎉 ¡Conexión a Reddit exitosa!\n');
    console.log('📝 Próximos pasos:');
    console.log('   - Puedes crear posts usando: reddit.createPost()');
    console.log('   - Puedes comentar usando: reddit.createComment()');
    console.log('   - Ver ejemplo completo en: .dendrita/integrations/examples/reddit-post.ts\n');

  } catch (error: any) {
    console.error('\n❌ Error al conectar con Reddit:', error.message);
    console.error('\n🔍 Posibles causas:');
    console.error('   1. Credenciales incorrectas en .dendrita/.env.local');
    console.error('   2. REDDIT_USER_AGENT con formato incorrecto');
    console.error('   3. Username/password incorrectos');
    console.error('   4. Cuenta de Reddit suspendida');
    console.error('\n📚 Ver documentación: .dendrita/integrations/hooks/reddit-setup.md\n');
    process.exit(1);
  }
}

// Ejecutar
testConnection();


