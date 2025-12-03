#!/usr/bin/env ts-node
/**
 * Script de verificación para setup de calendar scraping
 * Verifica que todos los requisitos estén cumplidos antes de ejecutar el scraping
 */

import { credentials } from '../../utils/credentials';
import { createLogger } from '../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('CalendarSetupVerifier');

interface VerificationResult {
  check: string;
  status: '✅' | '❌' | '⚠️';
  message: string;
  action?: string;
}

const results: VerificationResult[] = [];

function addResult(check: string, status: '✅' | '❌' | '⚠️', message: string, action?: string): void {
  results.push({ check, status, message, action });
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
 * Verifica que las dependencias estén instaladas
 */
function verifyDependencies(): void {
  const nodeModulesPath = path.join(process.cwd(), 'node_modules', '@supabase', 'supabase-js');
  
  if (fs.existsSync(nodeModulesPath)) {
    addResult(
      'Dependencias',
      '✅',
      '@supabase/supabase-js instalado'
    );
  } else {
    addResult(
      'Dependencias',
      '❌',
      '@supabase/supabase-js no está instalado',
      'Ejecuta: npm install'
    );
  }

  const tsNodePath = path.join(process.cwd(), 'node_modules', 'ts-node');
  if (fs.existsSync(tsNodePath)) {
    addResult(
      'Dependencias',
      '✅',
      'ts-node instalado'
    );
  } else {
    addResult(
      'Dependencias',
      '❌',
      'ts-node no está instalado',
      'Ejecuta: npm install'
    );
  }
}

/**
 * Verifica que el schema SQL exista
 */
function verifySchemaFile(): void {
  const schemaPath = path.join(
    process.cwd(),
    '.dendrita',
    'integrations',
    'services',
    'google',
    'calendar-scraper-schema.sql'
  );

  if (fs.existsSync(schemaPath)) {
    const content = fs.readFileSync(schemaPath, 'utf-8');
    if (content.includes('CREATE TABLE') && content.includes('calendar_scraping_configs')) {
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
        'Verifica .dendrita/integrations/services/google/calendar-scraper-schema.sql'
      );
    }
  } else {
    addResult(
      'Schema SQL',
      '❌',
      'Archivo de schema SQL no encontrado',
      'Verifica que .dendrita/integrations/services/google/calendar-scraper-schema.sql existe'
    );
  }
}

/**
 * Verifica que el usuario tenga perfil configurado
 */
function verifyUserProfile(userId: string): void {
  const profilePath = path.join(
    process.cwd(),
    '.dendrita',
    'users',
    userId,
    'profile.json'
  );

  if (fs.existsSync(profilePath)) {
    try {
      const content = fs.readFileSync(profilePath, 'utf-8');
      const profile = JSON.parse(content);
      if (profile.user_id === userId) {
        addResult(
          'Perfil de Usuario',
          '✅',
          `Perfil de usuario '${userId}' encontrado y válido`
        );
      } else {
        addResult(
          'Perfil de Usuario',
          '⚠️',
          `Perfil encontrado pero user_id no coincide`,
          'Verifica el contenido del perfil'
        );
      }
    } catch (error: any) {
      addResult(
        'Perfil de Usuario',
        '❌',
        `Error al leer perfil: ${error.message}`,
        'Verifica que el JSON sea válido'
      );
    }
  } else {
    addResult(
      'Perfil de Usuario',
      '❌',
      `Perfil de usuario '${userId}' no encontrado`,
      `Verifica que .dendrita/users/${userId}/profile.json existe`
    );
  }
}

/**
 * Función principal
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const userId = args[0] || '[user-id]';

  console.log('\n🔍 Verificando requisitos para Calendar Scraping Setup\n');
  console.log(`Usuario: ${userId}\n`);

  // Ejecutar verificaciones
  verifyGoogleWorkspace();
  verifySupabase();
  verifyDependencies();
  verifySchemaFile();
  verifyUserProfile(userId);

  // Mostrar resultados
  console.log('📋 Resultados de Verificación:\n');
  
  let allPassed = true;
  for (const result of results) {
    console.log(`${result.status} ${result.check}`);
    console.log(`   ${result.message}`);
    if (result.action) {
      console.log(`   💡 Acción: ${result.action}`);
    }
    console.log('');

    if (result.status === '❌' || result.status === '⚠️') {
      allPassed = false;
    }
  }

  // Resumen
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('\n✅ Todos los requisitos están cumplidos!');
    console.log('\n🚀 Puedes ejecutar el scraping con:');
    console.log(`   node node_modules/.bin/ts-node .dendrita/integrations/scripts/calendar-scraper.ts ${userId}\n`);
  } else {
    console.log('\n⚠️  Hay requisitos pendientes.');
    console.log('\n📖 Revisa las acciones sugeridas arriba y consulta:');
    console.log('   .dendrita/integrations/scripts/SETUP-CALENDAR-SCRAPING.md\n');
  }
  console.log('='.repeat(60) + '\n');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch((error) => {
    console.error('Error en verificación:', error);
    process.exit(1);
  });
}

export { main as verifyCalendarSetup };

