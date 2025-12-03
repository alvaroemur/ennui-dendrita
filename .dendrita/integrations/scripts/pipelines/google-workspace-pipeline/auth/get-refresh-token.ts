/**
 * Script para obtener el refresh token de Google Workspace
 * Este script guía al usuario a través del flujo OAuth 2.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { GoogleAuth } from '../../../services/google/auth';
import { credentials } from '../../../utils/credentials';
import { createLogger } from '../../../utils/logger';
import * as readline from 'readline';

const logger = createLogger('GetRefreshToken');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function getRefreshToken(): Promise<void> {
  try {
    logger.info('🔐 Configuración de Google Workspace OAuth 2.0');
    logger.info('');

    // Verificar si ya hay client ID y secret
    let clientId: string;
    let clientSecret: string;

    try {
      const creds = credentials.getGoogleWorkspace();
      clientId = creds.clientId;
      clientSecret = creds.clientSecret;
      logger.info('✅ Credenciales encontradas en .env.local');
      logger.info('');
    } catch {
      logger.info('📝 Necesitas configurar tus credenciales de Google OAuth 2.0');
      logger.info('');
      logger.info('Pasos:');
      logger.info('1. Ve a https://console.cloud.google.com/');
      logger.info('2. Crea un proyecto o selecciona uno existente');
      logger.info('3. Habilita las APIs: Gmail API, Google Calendar API, Google Drive API');
      logger.info('4. Ve a "APIs & Services" → "Credentials"');
      logger.info('5. Crea "OAuth client ID" tipo "Web application"');
      logger.info('6. Agrega redirect URI: http://localhost:3000/auth/google/callback');
      logger.info('7. Copia el Client ID y Client Secret');
      logger.info('');

      clientId = await question('Client ID: ');
      clientSecret = await question('Client Secret: ');

      // Guardar temporalmente en .env.local
      const envPath = path.join(__dirname, '../../.env.local');
      let envContent = '';
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf-8');
      }

      // Agregar o actualizar credenciales
      if (envContent.includes('GOOGLE_WORKSPACE_CLIENT_ID')) {
        envContent = envContent.replace(
          /GOOGLE_WORKSPACE_CLIENT_ID=.*/,
          `GOOGLE_WORKSPACE_CLIENT_ID=${clientId}`
        );
        envContent = envContent.replace(
          /GOOGLE_WORKSPACE_CLIENT_SECRET=.*/,
          `GOOGLE_WORKSPACE_CLIENT_SECRET=${clientSecret}`
        );
      } else {
        envContent += `\n# Google Workspace\n`;
        envContent += `GOOGLE_WORKSPACE_CLIENT_ID=${clientId}\n`;
        envContent += `GOOGLE_WORKSPACE_CLIENT_SECRET=${clientSecret}\n`;
      }

      fs.writeFileSync(envPath, envContent, 'utf-8');
      logger.info('✅ Credenciales guardadas en .env.local');
      logger.info('');
    }

    // Recargar credenciales desde archivo
    // Necesitamos recargar el módulo de credenciales para que lea el archivo actualizado
    delete require.cache[require.resolve('../utils/credentials')];
    const { credentials: freshCreds } = require('../utils/credentials');

    // Constante para redirect URI
    const redirectUri = 'http://localhost:3000/auth/google/callback';

    // Generar URL de autorización
    logger.info('🔗 Generando URL de autorización...');
    
    // Construir URL manualmente ya que las credenciales pueden no estar cargadas aún
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.compose',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.file',
    ].join(' ');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      access_type: 'offline',
      prompt: 'consent',
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    logger.info('');
    logger.info('📋 Sigue estos pasos:');
    logger.info('1. Abre este URL en tu navegador:');
    logger.info('');
    logger.info(`   ${authUrl}`);
    logger.info('');
    logger.info('2. Autoriza el acceso a tu cuenta de Google');
    logger.info('3. Copia el código de autorización de la URL de redirección');
    logger.info('   (Busca el parámetro "code=" en la URL)');
    logger.info('');

    const authCode = await question('Pega el código de autorización aquí: ');

    logger.info('');
    logger.info('🔄 Intercambiando código por tokens...');

    // Intercambiar código por tokens manualmente
    const tokenEndpoint = 'https://oauth2.googleapis.com/token';
    
    const body = new URLSearchParams({
      code: authCode.trim(),
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to exchange code: ${response.status} - ${errorText}`);
    }

    const tokenData = await response.json();

    if (!tokenData.access_token || !tokenData.refresh_token) {
      throw new Error('Invalid token response from Google');
    }

    const tokens = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in || 3600,
    };

    logger.info('✅ Tokens obtenidos exitosamente');
    logger.info('');

    // Guardar refresh token en .env.local
    const envPath = path.join(__dirname, '../../.env.local');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }

    // Agregar o actualizar refresh token
    if (envContent.includes('GOOGLE_WORKSPACE_REFRESH_TOKEN')) {
      envContent = envContent.replace(
        /GOOGLE_WORKSPACE_REFRESH_TOKEN=.*/,
        `GOOGLE_WORKSPACE_REFRESH_TOKEN=${tokens.refreshToken}`
      );
    } else {
      envContent += `GOOGLE_WORKSPACE_REFRESH_TOKEN=${tokens.refreshToken}\n`;
    }

    fs.writeFileSync(envPath, envContent, 'utf-8');

    logger.info('✅ Refresh token guardado en .env.local');
    logger.info('');
    logger.info('🎉 ¡Configuración completada!');
    logger.info('');
    logger.info('Ahora puedes usar los servicios de Google Workspace:');
    logger.info('  - Gmail');
    logger.info('  - Calendar');
    logger.info('  - Drive');
    logger.info('');
    logger.info('Prueba la conexión ejecutando:');
    logger.info('  npm run test-calendar');
    logger.info('');

    rl.close();
  } catch (error) {
    logger.error('❌ Error durante la configuración', error);
    if (error instanceof Error) {
      logger.error(`   Mensaje: ${error.message}`);
    }
    rl.close();
    process.exit(1);
  }
}

// Ejecutar
getRefreshToken();

