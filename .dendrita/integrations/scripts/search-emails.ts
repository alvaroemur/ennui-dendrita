/**
 * Script genérico para buscar correos de Gmail
 * Lee configuración desde un workspace y guarda resultados en el mismo workspace
 * 
 * Uso:
 *   npm run search-emails -- inspiro
 *   O directamente:
 *   npx ts-node .dendrita/integrations/scripts/search-emails.ts inspiro
 */

import { GmailService } from '../services/google/gmail';
import { credentials } from '../utils/credentials';
import { createLogger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('SearchEmails');

interface EmailSearchConfig {
  workspace: string;
  searchQueries: Array<{
    name: string;
    query: string;
  }>;
  maxResultsPerQuery?: number;
  outputFileName?: string;
}

interface SearchResult {
  query: string;
  emails: any[];
}

/**
 * Carga la configuración desde el workspace
 */
function loadConfig(workspaceName: string): EmailSearchConfig {
  const repoRoot = path.resolve(__dirname, '../../../');
  const configPath = path.join(
    repoRoot,
    'workspaces',
    workspaceName,
    'company-management',
    'email-search-config.json'
  );

  if (!fs.existsSync(configPath)) {
    throw new Error(
      `Archivo de configuración no encontrado: ${configPath}\n` +
      `Crea el archivo email-search-config.json en workspaces/${workspaceName}/company-management/`
    );
  }

  try {
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const config: EmailSearchConfig = JSON.parse(configContent);
    
    // Validar estructura mínima
    if (!config.searchQueries || !Array.isArray(config.searchQueries) || config.searchQueries.length === 0) {
      throw new Error('La configuración debe incluir al menos una búsqueda en searchQueries');
    }

    // Asegurar que workspace esté definido
    config.workspace = workspaceName;
    
    // Valores por defecto
    config.maxResultsPerQuery = config.maxResultsPerQuery || 50;
    config.outputFileName = config.outputFileName || `email-search-results-${Date.now()}.json`;

    return config;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Error al parsear JSON de configuración: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Busca correos usando la configuración
 */
async function searchEmails(config: EmailSearchConfig): Promise<void> {
  try {
    // Verificar que Google Workspace está configurado
    if (!credentials.hasGoogleWorkspace()) {
      logger.error('Google Workspace no está configurado.');
      logger.info('Por favor, configura las credenciales siguiendo: .dendrita/integrations/SETUP.md');
      process.exit(1);
    }

    const gmail = new GmailService();
    await gmail.authenticate();

    logger.info(`Buscando correos para workspace: ${config.workspace}...\n`);
    logger.info(`Total de búsquedas: ${config.searchQueries.length}\n`);

    const results: SearchResult[] = [];

    // Ejecutar cada búsqueda
    for (const { name, query } of config.searchQueries) {
      try {
        logger.info(`Buscando: ${name}...`);
        logger.debug(`  Query: ${query}`);
        const emails = await gmail.searchEmails(query, config.maxResultsPerQuery!);
        results.push({ query: name, emails });
        logger.info(`  ✓ Encontrados: ${emails.length} correos\n`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.warn(`  ✗ Error en búsqueda "${name}": ${errorMsg}\n`);
        results.push({ query: name, emails: [] });
      }
    }

    // Consolidar resultados únicos (por threadId)
    const uniqueEmails = new Map<string, any>();
    const emailSources = new Map<string, Set<string>>();

    for (const result of results) {
      for (const email of result.emails) {
        if (!uniqueEmails.has(email.threadId)) {
          uniqueEmails.set(email.threadId, email);
          emailSources.set(email.threadId, new Set());
        }
        emailSources.get(email.threadId)?.add(result.query);
      }
    }

    logger.info('\n═══════════════════════════════════════════════════════════');
    logger.info(`RESUMEN: ${uniqueEmails.size} conversaciones únicas encontradas`);
    logger.info('═══════════════════════════════════════════════════════════\n');

    // Mostrar resultados
    const sortedEmails = Array.from(uniqueEmails.values()).sort((a, b) => 
      b.date.getTime() - a.date.getTime()
    );

    for (const email of sortedEmails) {
      const sources = Array.from(emailSources.get(email.threadId) || []);
      const dateStr = email.date.toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      console.log(`\n📧 ${email.subject}`);
      console.log(`   De: ${email.from}`);
      console.log(`   Para: ${email.to.join(', ')}`);
      console.log(`   Fecha: ${dateStr}`);
      console.log(`   Thread ID: ${email.threadId}`);
      console.log(`   Criterios: ${sources.join(', ')}`);
      
      // Mostrar preview del cuerpo (primeras 200 caracteres)
      const bodyPreview = email.body.replace(/\n/g, ' ').substring(0, 200);
      if (bodyPreview.length > 0) {
        console.log(`   Preview: ${bodyPreview}...`);
      }
      console.log('   ───────────────────────────────────────────────────────');
    }

    // Guardar resultados en el workspace
    const repoRoot = path.resolve(__dirname, '../../../');
    const outputDir = path.join(
      repoRoot,
      'workspaces',
      config.workspace,
      'company-management'
    );

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, config.outputFileName!);

    const output = {
      workspace: config.workspace,
      searchDate: new Date().toISOString(),
      config: {
        searchQueries: config.searchQueries.map(q => ({ name: q.name, query: q.query })),
        maxResultsPerQuery: config.maxResultsPerQuery,
      },
      summary: {
        totalUniqueConversations: uniqueEmails.size,
        totalQueries: config.searchQueries.length,
        resultsPerQuery: results.map(r => ({ query: r.query, count: r.emails.length })),
      },
      emails: sortedEmails.map(email => ({
        id: email.id,
        threadId: email.threadId,
        subject: email.subject,
        from: email.from,
        to: email.to,
        date: email.date.toISOString(),
        bodyPreview: email.body.substring(0, 500),
        matchedQueries: Array.from(emailSources.get(email.threadId) || []),
      })),
    };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    logger.info(`\n✓ Resultados guardados en: ${outputPath}`);

  } catch (error) {
    logger.error('Error al buscar correos:', error);
    process.exit(1);
  }
}

/**
 * Función principal
 */
async function main(): Promise<void> {
  const workspaceName = process.argv[2];

  if (!workspaceName) {
    console.error('❌ Error: Debes especificar el nombre del workspace');
    console.error('');
    console.error('Uso:');
    console.error('  npm run search-emails -- <workspace-name>');
    console.error('  npx ts-node .dendrita/integrations/scripts/search-emails.ts <workspace-name>');
    console.error('');
    console.error('Ejemplo:');
    console.error('  npm run search-emails -- inspiro');
    process.exit(1);
  }

  try {
    const config = loadConfig(workspaceName);
    await searchEmails(config);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(`Error: ${errorMsg}`);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch((error) => {
    logger.error('Error fatal:', error);
    process.exit(1);
  });
}

export { searchEmails, loadConfig };

