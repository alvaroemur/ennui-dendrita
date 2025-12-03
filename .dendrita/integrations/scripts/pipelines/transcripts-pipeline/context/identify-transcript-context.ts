#!/usr/bin/env npx ts-node
/**
 * Script para identificar el contexto de una transcripción
 * 
 * Identifica el tipo de reunión (comercial, proyecto, company-management)
 * y valida/crea la carpeta destino apropiada.
 */

import { createLogger } from '../../../../utils/logger';
import { extractWorkspace, extractProject } from '../utils/context-loader';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('IdentifyTranscriptContext');

export type TranscriptType = 'commercial' | 'project' | 'company-management' | 'unknown';

export interface TranscriptContext {
  type: TranscriptType;
  workspace: string;
  project?: string;
  destinationPath: string;
  validated: boolean;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Encuentra el directorio raíz del proyecto
 */
function findProjectRoot(): string {
  let currentDir = process.cwd();
  
  while (currentDir !== path.dirname(currentDir)) {
    const dendritaPath = path.join(currentDir, '.dendrita');
    if (fs.existsSync(dendritaPath)) {
      const workspacesPath = path.join(currentDir, 'workspaces');
      if (fs.existsSync(workspacesPath)) {
        return currentDir;
      }
    }
    currentDir = path.dirname(currentDir);
  }
  
  return process.cwd();
}

/**
 * Analiza el contenido de la transcripción para identificar el tipo
 */
function analyzeTranscriptType(
  transcriptText: string,
  transcriptPath: string,
  eventInfo?: any
): { type: TranscriptType; confidence: 'high' | 'medium' | 'low' } {
  const text = transcriptText.toLowerCase();
  const pathLower = transcriptPath.toLowerCase();
  
  // Indicadores de gestión comercial
  const commercialIndicators = [
    'cliente', 'propuesta', 'comercial', 'venta', 'oferta',
    'presupuesto', 'cotización', 'necesidades del cliente',
    'pain point', 'oportunidad', 'stakeholder externo'
  ];
  
  // Indicadores de proyecto activo
  const projectIndicators = [
    'proyecto', 'sprint', 'tarea', 'milestone', 'alcance',
    'timeline del proyecto', 'master plan', 'tasks.md',
    'seguimiento de proyecto', 'avance del proyecto'
  ];
  
  // Indicadores de company-management
  const managementIndicators = [
    'reunión interna', 'equipo interno', 'governance',
    'estrategia', 'gestión', 'stakeholders internos',
    'decisión estratégica', 'política'
  ];
  
  // Contar indicadores
  const commercialScore = commercialIndicators.filter(ind => 
    text.includes(ind) || pathLower.includes(ind)
  ).length;
  
  const projectScore = projectIndicators.filter(ind => 
    text.includes(ind) || pathLower.includes(ind)
  ).length;
  
  const managementScore = managementIndicators.filter(ind => 
    text.includes(ind) || pathLower.includes(ind)
  ).length;
  
  // Verificar ruta del archivo
  if (pathLower.includes('gestion-comercial') || pathLower.includes('proposals')) {
    return { type: 'commercial', confidence: 'high' };
  }
  
  if (pathLower.includes('active-projects') || pathLower.includes('🚀')) {
    return { type: 'project', confidence: 'high' };
  }
  
  if (pathLower.includes('company-management') && !pathLower.includes('gestion-comercial')) {
    return { type: 'company-management', confidence: 'high' };
  }
  
  // Decidir basado en scores
  const maxScore = Math.max(commercialScore, projectScore, managementScore);
  
  if (maxScore === 0) {
    return { type: 'unknown', confidence: 'low' };
  }
  
  let type: TranscriptType = 'unknown';
  let confidence: 'high' | 'medium' | 'low' = 'low';
  
  if (commercialScore === maxScore && commercialScore > 0) {
    type = 'commercial';
    confidence = commercialScore >= 3 ? 'high' : 'medium';
  } else if (projectScore === maxScore && projectScore > 0) {
    type = 'project';
    confidence = projectScore >= 3 ? 'high' : 'medium';
  } else if (managementScore === maxScore && managementScore > 0) {
    type = 'company-management';
    confidence = managementScore >= 3 ? 'high' : 'medium';
  }
  
  return { type, confidence };
}

/**
 * Construye la ruta destino según el tipo identificado
 */
function buildDestinationPath(
  type: TranscriptType,
  workspace: string,
  project?: string,
  transcriptPath?: string
): string {
  const projectRoot = findProjectRoot();
  const workspacePath = path.join(projectRoot, 'workspaces', workspace);
  
  switch (type) {
    case 'commercial':
      // Intentar detectar proyecto de propuesta desde la ruta
      if (transcriptPath) {
        const proposalMatch = transcriptPath.match(/proposals[\/\\]([^\/\\]+)/i);
        if (proposalMatch) {
          const proposalProject = proposalMatch[1];
          return path.join(
            workspacePath,
            '⚙️ company-management',
            '💼 gestion-comercial',
            'proposals',
            proposalProject,
            'transcripts'
          );
        }
      }
      return path.join(
        workspacePath,
        '⚙️ company-management',
        '💼 gestion-comercial',
        'transcripts'
      );
      
    case 'project':
      if (!project) {
        // Intentar extraer de la ruta
        if (transcriptPath) {
          const projectMatch = transcriptPath.match(/active-projects[\/\\]([^\/\\]+)/i);
          if (projectMatch) {
            project = projectMatch[1];
          }
        }
      }
      
      if (project) {
        return path.join(
          workspacePath,
          '🚀 active-projects',
          project,
          'transcripts'
        );
      }
      return path.join(
        workspacePath,
        '⚙️ company-management',
        'data',
        'scraped-content',
        'transcripts'
      );
      
    case 'company-management':
      return path.join(
        workspacePath,
        '⚙️ company-management',
        'data',
        'scraped-content',
        'transcripts'
      );
      
    default:
      return path.join(
        workspacePath,
        '⚙️ company-management',
        'data',
        'scraped-content',
        'transcripts'
      );
  }
}

/**
 * Valida y crea la estructura de carpetas si es necesario
 */
function validateDestinationPath(destinationPath: string): boolean {
  try {
    if (!fs.existsSync(destinationPath)) {
      fs.mkdirSync(destinationPath, { recursive: true });
      logger.info(`✅ Carpeta destino creada: ${destinationPath}`);
    }
    return true;
  } catch (error: any) {
    logger.error(`Error al crear carpeta destino: ${error.message}`);
    return false;
  }
}

/**
 * Identifica el contexto de una transcripción
 */
async function identifyTranscriptContext(
  transcriptPath: string,
  transcriptText: string,
  eventInfo?: any
): Promise<TranscriptContext> {
  try {
    // Extraer workspace y project de la ruta
    const workspace = extractWorkspace(transcriptPath) || 'ennui';
    const project = extractProject(transcriptPath);
    
    // Analizar tipo de transcripción
    const { type, confidence } = analyzeTranscriptType(transcriptText, transcriptPath, eventInfo);
    
    // Construir ruta destino
    const destinationPath = buildDestinationPath(type, workspace, project, transcriptPath);
    
    // Validar y crear estructura
    const validated = validateDestinationPath(destinationPath);
    
    const context: TranscriptContext = {
      type,
      workspace,
      project,
      destinationPath,
      validated,
      confidence,
    };
    
    logger.info(`📊 Contexto identificado: ${type} (confianza: ${confidence})`);
    logger.info(`📂 Carpeta destino: ${destinationPath}`);
    
    return context;
  } catch (error: any) {
    logger.error('Error al identificar contexto', error);
    throw error;
  }
}

/**
 * Función principal para uso desde línea de comandos
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error('Uso: ts-node identify-transcript-context.ts <transcript-file>');
    process.exit(1);
  }
  
  const transcriptPath = args[0];
  
  if (!fs.existsSync(transcriptPath)) {
    console.error(`Error: Archivo no encontrado: ${transcriptPath}`);
    process.exit(1);
  }
  
  const transcriptText = fs.readFileSync(transcriptPath, 'utf-8');
  
  // Extraer texto del frontmatter si existe
  let text = transcriptText;
  const frontmatterMatch = transcriptText.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (frontmatterMatch) {
    text = frontmatterMatch[2];
  }
  
  try {
    const context = await identifyTranscriptContext(transcriptPath, text);
    
    console.log('\n✅ Contexto identificado:');
    console.log(`   Tipo: ${context.type}`);
    console.log(`   Workspace: ${context.workspace}`);
    if (context.project) {
      console.log(`   Proyecto: ${context.project}`);
    }
    console.log(`   Carpeta destino: ${context.destinationPath}`);
    console.log(`   Validado: ${context.validated ? '✅' : '❌'}`);
    console.log(`   Confianza: ${context.confidence}`);
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { identifyTranscriptContext, TranscriptContext, TranscriptType };

