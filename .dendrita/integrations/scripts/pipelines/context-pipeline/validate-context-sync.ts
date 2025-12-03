#!/usr/bin/env tsx
/**
 * Script para validar sincronización entre sistemas de contexto
 * 
 * Este script verifica que:
 * - project_context.json esté actualizado
 * - context.json refleje cambios de proyectos
 * - work-status-report.json esté sincronizado
 * - Detecta inconsistencias entre sistemas
 * 
 * Uso:
 *   tsx .dendrita/integrations/scripts/pipelines/context-pipeline/validate-context-sync.ts
 *   tsx .dendrita/integrations/scripts/pipelines/context-pipeline/validate-context-sync.ts --verbose
 * 
 * Flags:
 *   --verbose  - Mostrar detalles de validación
 */

import * as fs from 'fs';
import * as path from 'path';
import { ProjectContext, UserContext } from '../../utils/context-types';
import { PROJECT_ROOT, getUserId, findAllProjects, loadProjectContext } from './utils/common';

interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  details?: string;
}

interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  summary: {
    projectsChecked: number;
    projectsValid: number;
    projectsOutdated: number;
    userContextValid: boolean;
    workStatusReportValid: boolean;
  };
}

/**
 * Verifica si un archivo está actualizado comparando con sus fuentes
 */
function isProjectContextUpToDate(workspace: string, project: string): { upToDate: boolean; reason?: string } {
  const projectPath = path.join(PROJECT_ROOT, 'workspaces', workspace, '🚀 active-projects', project);
  const contextPath = path.join(projectPath, 'project_context.json');
  
  if (!fs.existsSync(contextPath)) {
    return { upToDate: false, reason: 'project_context.json does not exist' };
  }

  try {
    const context: ProjectContext = JSON.parse(fs.readFileSync(contextPath, 'utf-8'));
    const lastUpdate = new Date(context.lastUpdate);
    
    // Verificar archivos fuente
    const masterPlanPath = path.join(projectPath, 'master-plan.md');
    const currentContextPath = path.join(projectPath, 'current-context.md');
    const tasksPath = path.join(projectPath, 'tasks.md');
    
    let mostRecentSource = lastUpdate;
    let sourceFile = '';
    
    if (fs.existsSync(masterPlanPath)) {
      const stats = fs.statSync(masterPlanPath);
      if (stats.mtime > mostRecentSource) {
        mostRecentSource = stats.mtime;
        sourceFile = 'master-plan.md';
      }
    }
    
    if (fs.existsSync(currentContextPath)) {
      const stats = fs.statSync(currentContextPath);
      if (stats.mtime > mostRecentSource) {
        mostRecentSource = stats.mtime;
        sourceFile = 'current-context.md';
      }
    }
    
    if (fs.existsSync(tasksPath)) {
      const stats = fs.statSync(tasksPath);
      if (stats.mtime > mostRecentSource) {
        mostRecentSource = stats.mtime;
        sourceFile = 'tasks.md';
      }
    }
    
    if (mostRecentSource > lastUpdate) {
      return { upToDate: false, reason: `${sourceFile} is newer than project_context.json` };
    }
    
    return { upToDate: true };
  } catch (error: any) {
    return { upToDate: false, reason: `Error reading project_context.json: ${error.message}` };
  }
}

/**
 * Valida user context
 */
function validateUserContext(userId: string): { valid: boolean; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const contextPath = path.join(PROJECT_ROOT, '.dendrita', 'users', userId, 'context.json');
  
  if (!fs.existsSync(contextPath)) {
    issues.push({
      type: 'error',
      message: 'User context.json does not exist',
      details: `Expected at: ${contextPath}`,
    });
    return { valid: false, issues };
  }
  
  try {
    const context: UserContext = JSON.parse(fs.readFileSync(contextPath, 'utf-8'));
    
    // Verificar que tenga estructura básica
    if (!context.quickReference) {
      issues.push({
        type: 'error',
        message: 'User context missing quickReference',
      });
    }
    
    if (!context.memories || !Array.isArray(context.memories)) {
      issues.push({
        type: 'error',
        message: 'User context missing or invalid memories array',
      });
    }
    
    if (!context.summary) {
      issues.push({
        type: 'warning',
        message: 'User context missing summary',
      });
    }
    
    // Verificar referencia a work-status-report
    if (context.metadata?.workStatusReport) {
      const reportPath = context.metadata.workStatusReport.path;
      if (!fs.existsSync(reportPath)) {
        issues.push({
          type: 'warning',
          message: 'User context references work-status-report that does not exist',
          details: `Referenced path: ${reportPath}`,
        });
      }
    }
    
    return { valid: issues.filter(i => i.type === 'error').length === 0, issues };
  } catch (error: any) {
    issues.push({
      type: 'error',
      message: `Error reading user context: ${error.message}`,
    });
    return { valid: false, issues };
  }
}

/**
 * Valida work status report
 */
function validateWorkStatusReport(): { valid: boolean; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const reportPath = path.join(PROJECT_ROOT, '.dendrita', 'dashboards', 'work-status-report.json');
  
  if (!fs.existsSync(reportPath)) {
    issues.push({
      type: 'warning',
      message: 'work-status-report.json does not exist',
      details: `Expected at: ${reportPath}`,
    });
    return { valid: false, issues };
  }
  
  try {
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    
    // Verificar estructura básica
    if (!report.generatedAt) {
      issues.push({
        type: 'error',
        message: 'work-status-report missing generatedAt',
      });
    }
    
    if (!report.summary) {
      issues.push({
        type: 'error',
        message: 'work-status-report missing summary',
      });
    }
    
    // Verificar referencia a user context
    if (report.references?.userContext) {
      const contextPath = report.references.userContext.path;
      if (!fs.existsSync(contextPath)) {
        issues.push({
          type: 'warning',
          message: 'work-status-report references user context that does not exist',
          details: `Referenced path: ${contextPath}`,
        });
      }
    }
    
    return { valid: issues.filter(i => i.type === 'error').length === 0, issues };
  } catch (error: any) {
    issues.push({
      type: 'error',
      message: `Error reading work-status-report: ${error.message}`,
    });
    return { valid: false, issues };
  }
}

/**
 * Función principal de validación
 */
function validateAll(verbose: boolean = false): ValidationResult {
  const issues: ValidationIssue[] = [];
  let projectsChecked = 0;
  let projectsValid = 0;
  let projectsOutdated = 0;
  
  console.log('🔍 Validating context synchronization...\n');
  
  // Validar project contexts
  console.log('📦 Validating project contexts...');
  const projects = findAllProjects();
  projectsChecked = projects.length;
  
  for (const { workspace, project } of projects) {
    const validation = isProjectContextUpToDate(workspace, project);
    if (validation.upToDate) {
      projectsValid++;
      if (verbose) {
        console.log(`   ✅ ${workspace}/${project}: Up to date`);
      }
    } else {
      projectsOutdated++;
      issues.push({
        type: 'warning',
        message: `Project context outdated: ${workspace}/${project}`,
        details: validation.reason,
      });
      if (verbose) {
        console.log(`   ⚠️  ${workspace}/${project}: ${validation.reason}`);
      }
    }
  }
  
  console.log(`   ✅ Valid: ${projectsValid}/${projectsChecked}`);
  if (projectsOutdated > 0) {
    console.log(`   ⚠️  Outdated: ${projectsOutdated}/${projectsChecked}\n`);
  } else {
    console.log('');
  }
  
  // Validar user context
  console.log('👤 Validating user context...');
  let userId: string;
  try {
    userId = getUserId();
    const validation = validateUserContext(userId);
    if (validation.valid) {
      console.log('   ✅ User context is valid\n');
    } else {
      console.log('   ❌ User context has issues\n');
    }
    issues.push(...validation.issues);
  } catch (error: any) {
    issues.push({
      type: 'error',
      message: `Cannot validate user context: ${error.message}`,
    });
    console.log('   ❌ Cannot validate user context\n');
  }
  
  // Validar work status report
  console.log('📊 Validating work status report...');
  const reportValidation = validateWorkStatusReport();
  if (reportValidation.valid) {
    console.log('   ✅ Work status report is valid\n');
  } else {
    console.log('   ⚠️  Work status report has issues\n');
  }
  issues.push(...reportValidation.issues);
  
  // Resumen
  const hasErrors = issues.filter(i => i.type === 'error').length > 0;
  const hasWarnings = issues.filter(i => i.type === 'warning').length > 0;
  
  return {
    valid: !hasErrors && projectsOutdated === 0,
    issues,
    summary: {
      projectsChecked,
      projectsValid,
      projectsOutdated,
      userContextValid: !issues.some(i => i.message.includes('User context') && i.type === 'error'),
      workStatusReportValid: reportValidation.valid,
    },
  };
}

/**
 * Función principal
 */
function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose');
  
  try {
    const result = validateAll(verbose);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Validation Summary:\n');
    console.log(`   Projects checked: ${result.summary.projectsChecked}`);
    console.log(`   Projects valid: ${result.summary.projectsValid}`);
    if (result.summary.projectsOutdated > 0) {
      console.log(`   Projects outdated: ${result.summary.projectsOutdated}`);
    }
    console.log(`   User context: ${result.summary.userContextValid ? '✅ Valid' : '❌ Invalid'}`);
    console.log(`   Work status report: ${result.summary.workStatusReportValid ? '✅ Valid' : '⚠️  Issues'}`);
    
    if (result.issues.length > 0) {
      console.log(`\n   Issues found: ${result.issues.length}`);
      const errors = result.issues.filter(i => i.type === 'error');
      const warnings = result.issues.filter(i => i.type === 'warning');
      const infos = result.issues.filter(i => i.type === 'info');
      
      if (errors.length > 0) {
        console.log(`   ❌ Errors: ${errors.length}`);
      }
      if (warnings.length > 0) {
        console.log(`   ⚠️  Warnings: ${warnings.length}`);
      }
      if (infos.length > 0) {
        console.log(`   ℹ️  Info: ${infos.length}`);
      }
      
      if (verbose || errors.length > 0) {
        console.log('\n   Details:');
        result.issues.forEach(issue => {
          const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
          console.log(`   ${icon} ${issue.message}`);
          if (issue.details) {
            console.log(`      ${issue.details}`);
          }
        });
      }
    }
    
    if (result.valid) {
      console.log('\n✅ All context systems are synchronized!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some context systems need synchronization.');
      console.log('   Run: tsx .dendrita/integrations/scripts/pipelines/context-pipeline/sync-all-context.ts');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Error during validation:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { main, validateAll, isProjectContextUpToDate, validateUserContext, validateWorkStatusReport };

