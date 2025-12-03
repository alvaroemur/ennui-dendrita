#!/usr/bin/env ts-node

/**
 * Script para generar un diagrama Mermaid que representa la arquitectura de dendrita
 * 
 * Uso:
 *   ts-node .dendrita/integrations/scripts/utils/generate-architecture-diagram.ts [--output <archivo>]
 * 
 * Opciones:
 *   --output <archivo>  Guarda el diagrama en un archivo (por defecto: .dendrita/dashboards/architecture-diagram.md)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as pako from 'pako';

interface ArchitectureComponent {
  name: string;
  type: string;
  description?: string;
  children?: ArchitectureComponent[];
}

class ArchitectureDiagramGenerator {
  private dendritaPath: string;
  private workspacesPath: string;
  private outputPath: string;

  constructor(outputPath?: string) {
    this.dendritaPath = path.join(process.cwd(), '.dendrita');
    this.workspacesPath = path.join(process.cwd(), 'workspaces');
    this.outputPath = outputPath || path.join(this.dendritaPath, 'dashboards', 'architecture-diagram.md');
  }

  /**
   * Genera el diagrama Mermaid completo
   */
  generate(): { markdown: string; mermaid: string } {
    const dendritaComponents = this.scanDendrita();
    const workspaces = this.scanWorkspaces();
    
    const mermaid = this.buildMermaidDiagram(dendritaComponents, workspaces);
    const markdown = this.buildMarkdownDocument(mermaid);
    
    return { markdown, mermaid };
  }

  /**
   * Escanea la estructura de .dendrita/
   */
  private scanDendrita(): ArchitectureComponent {
    const components: ArchitectureComponent = {
      name: '.dendrita',
      type: 'root',
      description: 'Reflexive metadata base',
      children: []
    };

    // Users
    const usersPath = path.join(this.dendritaPath, 'users');
    if (fs.existsSync(usersPath)) {
      const users = fs.readdirSync(usersPath)
        .filter(item => {
          const itemPath = path.join(usersPath, item);
          return fs.statSync(itemPath).isDirectory() && !item.startsWith('.');
        });

      components.children!.push({
        name: 'users',
        type: 'directory',
        description: 'User profiles and preferences',
        children: users.map(userId => ({
          name: userId,
          type: 'user',
          children: this.scanUserDirectory(path.join(usersPath, userId))
        }))
      });
    }

    // Hooks
    const hooksPath = path.join(this.dendritaPath, 'hooks');
    if (fs.existsSync(hooksPath)) {
      const hooks = fs.readdirSync(hooksPath)
        .filter(item => item.endsWith('.md'))
        .map(hook => hook.replace('.md', ''));

      components.children!.push({
        name: 'hooks',
        type: 'directory',
        description: 'Behavior references (NOT executable)',
        children: hooks.map(hook => ({
          name: hook,
          type: 'hook'
        }))
      });
    }

    // Integrations
    const integrationsPath = path.join(this.dendritaPath, 'integrations');
    if (fs.existsSync(integrationsPath)) {
      const services = fs.existsSync(path.join(integrationsPath, 'services'))
        ? fs.readdirSync(path.join(integrationsPath, 'services'))
            .filter(item => {
              const itemPath = path.join(integrationsPath, 'services', item);
              return fs.statSync(itemPath).isDirectory();
            })
        : [];

      components.children!.push({
        name: 'integrations',
        type: 'directory',
        description: 'Technical infrastructure (generic)',
        children: [
          {
            name: 'services',
            type: 'directory',
            children: services.map(service => ({
              name: service,
              type: 'service'
            }))
          },
          {
            name: 'scripts',
            type: 'directory',
            description: 'Integration scripts'
          },
          {
            name: 'hooks',
            type: 'directory',
            description: 'Integration setup hooks'
          }
        ]
      });
    }

    // Templates
    const templatesPath = path.join(this.dendritaPath, 'templates');
    if (fs.existsSync(templatesPath)) {
      components.children!.push({
        name: 'templates',
        type: 'directory',
        description: 'Workspace and user templates'
      });
    }

    // Communication
    const comunicacionPath = path.join(this.dendritaPath, 'comunicacion');
    if (fs.existsSync(comunicacionPath)) {
      components.children!.push({
        name: 'comunicacion',
        type: 'directory',
        description: 'Timeline and communication logs'
      });
    }

    // Dashboards
    const dashboardsPath = path.join(this.dendritaPath, 'dashboards');
    if (fs.existsSync(dashboardsPath)) {
      components.children!.push({
        name: 'dashboards',
        type: 'directory',
        description: 'System dashboards'
      });
    }

    // Config files
    components.children!.push({
      name: 'config-estilo.json',
      type: 'config',
      description: 'Style and naming conventions'
    });

    components.children!.push({
      name: 'settings.json',
      type: 'config',
      description: 'Project metadata'
    });

    return components;
  }

  /**
   * Escanea el directorio de un usuario
   */
  private scanUserDirectory(userPath: string): ArchitectureComponent[] {
    const components: ArchitectureComponent[] = [];

    // Agents
    const agentsPath = path.join(userPath, 'agents');
    if (fs.existsSync(agentsPath)) {
      const agents = fs.readdirSync(agentsPath)
        .filter(item => item.endsWith('.md') && item !== 'README.md')
        .map(agent => agent.replace('.md', ''));

      components.push({
        name: 'agents',
        type: 'directory',
        description: 'Specialized agents (user-specific domain knowledge)',
        children: agents.map(agent => ({
          name: agent,
          type: 'agent'
        }))
      });
    }

    // Skills
    const skillsPath = path.join(userPath, 'skills');
    if (fs.existsSync(skillsPath)) {
      const skills = fs.readdirSync(skillsPath)
        .filter(item => {
          const itemPath = path.join(skillsPath, item);
          return fs.statSync(itemPath).isDirectory();
        });

      components.push({
        name: 'skills',
        type: 'directory',
        description: 'Contextual knowledge skills (user-specific domain knowledge)',
        children: skills.map(skill => ({
          name: skill,
          type: 'skill'
        }))
      });
    }

    // Work modes
    const workModesPath = path.join(userPath, 'work-modes');
    if (fs.existsSync(workModesPath)) {
      components.push({
        name: 'work-modes',
        type: 'directory',
        description: 'General work modes and user preferences'
      });
    }

    // Profile
    if (fs.existsSync(path.join(userPath, 'profile.json'))) {
      components.push({
        name: 'profile.json',
        type: 'config',
        description: 'User profile'
      });
    }

    return components;
  }

  /**
   * Escanea la estructura de workspaces/
   */
  private scanWorkspaces(): ArchitectureComponent[] {
    if (!fs.existsSync(this.workspacesPath)) {
      return [];
    }

    const workspaces = fs.readdirSync(this.workspacesPath)
      .filter(item => {
        const itemPath = path.join(this.workspacesPath, item);
        return fs.statSync(itemPath).isDirectory();
      })
      .map(workspace => ({
        name: workspace,
        type: 'workspace',
        children: this.scanWorkspace(path.join(this.workspacesPath, workspace))
      }));

    return workspaces;
  }

  /**
   * Escanea un workspace individual
   */
  private scanWorkspace(workspacePath: string): ArchitectureComponent[] {
    const components: ArchitectureComponent[] = [];

    // Active projects
    const activeProjectsPath = path.join(workspacePath, '🚀 active-projects');
    if (fs.existsSync(activeProjectsPath)) {
      const projects = fs.readdirSync(activeProjectsPath)
        .filter(item => {
          const itemPath = path.join(activeProjectsPath, item);
          return fs.statSync(itemPath).isDirectory();
        });

      components.push({
        name: '🚀 active-projects',
        type: 'directory',
        description: 'Active projects',
        children: projects.map(project => ({
          name: project,
          type: 'project'
        }))
      });
    }

    // Archived projects
    const archivedProjectsPath = path.join(workspacePath, '.archived-projects');
    if (fs.existsSync(archivedProjectsPath)) {
      components.push({
        name: '.archived-projects',
        type: 'directory',
        description: 'Archived projects (hidden)'
      });
    }

    // Company management
    const companyManagementPath = path.join(workspacePath, '⚙️ company-management');
    if (fs.existsSync(companyManagementPath)) {
      components.push({
        name: '⚙️ company-management',
        type: 'directory',
        description: 'General management',
        children: [
          {
            name: '📚 best-practices',
            type: 'directory',
            description: 'Templates and methodologies'
          }
        ]
      });
    }

    // Products
    const productsPath = path.join(workspacePath, '📦 products');
    if (fs.existsSync(productsPath)) {
      components.push({
        name: '📦 products',
        type: 'directory',
        description: 'Products portfolio'
      });
    }

    // Stakeholders
    const stakeholdersPath = path.join(workspacePath, '🤝 stakeholders');
    if (fs.existsSync(stakeholdersPath)) {
      components.push({
        name: '🤝 stakeholders',
        type: 'directory',
        description: 'Allies and stakeholder management'
      });
    }

    // Tools templates
    const toolsTemplatesPath = path.join(workspacePath, '🛠️ tools-templates');
    if (fs.existsSync(toolsTemplatesPath)) {
      components.push({
        name: '🛠️ tools-templates',
        type: 'directory',
        description: 'Reusable tools and templates'
      });
    }

    // Config
    if (fs.existsSync(path.join(workspacePath, 'config-estilo.json'))) {
      components.push({
        name: 'config-estilo.json',
        type: 'config',
        description: 'Style and brand configuration'
      });
    }

    return components;
  }

  /**
   * Construye el diagrama Mermaid
   */
  private buildMermaidDiagram(dendrita: ArchitectureComponent, workspaces: ArchitectureComponent[]): string {
    let mermaid = 'graph TB\n';
    mermaid += '    %% Dendrita Core Structure\n';
    
    // Main dendrita node
    mermaid += '    dendrita[".dendrita<br/>Reflexive Metadata Base"]\n\n';
    
    // Dendrita subcomponents
    mermaid += '    %% Dendrita Components\n';
    mermaid += '    subgraph dendrita_components["Dendrita Components"]\n';
    mermaid += '        direction TB\n';
    
    // Users
    const users = dendrita.children?.find(c => c.name === 'users');
    if (users) {
      const userCount = users.children?.length || 0;
      mermaid += `        users["users/<br/>User Profiles<br/>(${userCount} users)"]\n`;
      
      // User subcomponents
      if (users.children && users.children.length > 0) {
        users.children.forEach(user => {
          const userId = user.name.replace(/[^a-zA-Z0-9]/g, '_');
          const agents = user.children?.find(c => c.name === 'agents');
          const skills = user.children?.find(c => c.name === 'skills');
          const workModes = user.children?.find(c => c.name === 'work-modes');
          
          const agentCount = agents?.children?.length || 0;
          const skillCount = skills?.children?.length || 0;
          
          mermaid += `        user_${userId}["${user.name}"]\n`;
          mermaid += `        user_${userId}_agents["agents/<br/>${agentCount} agents"]\n`;
          mermaid += `        user_${userId}_skills["skills/<br/>${skillCount} skills"]\n`;
          mermaid += `        user_${userId}_workmodes["work-modes/"]\n`;
          
          mermaid += `        user_${userId} --> user_${userId}_agents\n`;
          mermaid += `        user_${userId} --> user_${userId}_skills\n`;
          mermaid += `        user_${userId} --> user_${userId}_workmodes\n`;
        });
        mermaid += `        users --> user_${users.children[0].name.replace(/[^a-zA-Z0-9]/g, '_')}\n`;
      }
    }
    
    // Hooks
    const hooks = dendrita.children?.find(c => c.name === 'hooks');
    if (hooks) {
      const hookCount = hooks.children?.length || 0;
      mermaid += `        hooks["hooks/<br/>Behavior References<br/>(${hookCount} hooks)"]\n`;
    }
    
    // Integrations
    const integrations = dendrita.children?.find(c => c.name === 'integrations');
    if (integrations) {
      const services = integrations.children?.find(c => c.name === 'services');
      const serviceCount = services?.children?.length || 0;
      mermaid += `        integrations["integrations/<br/>Technical Infrastructure"]\n`;
      mermaid += `        integrations_services["services/<br/>${serviceCount} services"]\n`;
      mermaid += `        integrations_scripts["scripts/"]\n`;
      mermaid += `        integrations_hooks["hooks/"]\n`;
      mermaid += `        integrations --> integrations_services\n`;
      mermaid += `        integrations --> integrations_scripts\n`;
      mermaid += `        integrations --> integrations_hooks\n`;
    }
    
    // Templates
    const templates = dendrita.children?.find(c => c.name === 'templates');
    if (templates) {
      mermaid += `        templates["templates/<br/>Workspace Templates"]\n`;
    }
    
    // Blog (Development Blog & Timeline)
    const blog = dendrita.children?.find(c => c.name === 'blog');
    if (blog) {
      mermaid += `        blog["blog/<br/>Development Blog<br/>& Timeline"]\n`;
    }
    
    // Config files
    mermaid += `        config_estilo["config-estilo.json<br/>Style Conventions"]\n`;
    mermaid += `        settings["settings.json<br/>Project Metadata"]\n`;
    
    mermaid += '    end\n\n';
    
    // Workspaces
    mermaid += '    %% Workspaces\n';
    mermaid += '    subgraph workspaces["workspaces/ - Workspace Data"]\n';
    mermaid += '        direction TB\n';
    
    workspaces.forEach(workspace => {
      const workspaceId = workspace.name.replace(/[^a-zA-Z0-9]/g, '_');
      const activeProjects = workspace.children?.find(c => c.name === '🚀 active-projects');
      const projectCount = activeProjects?.children?.length || 0;
      
      mermaid += `        workspace_${workspaceId}["${workspace.name}"]\n`;
      mermaid += `        workspace_${workspaceId}_projects["🚀 active-projects/<br/>${projectCount} projects"]\n`;
      mermaid += `        workspace_${workspaceId}_archived[".archived-projects/"]\n`;
      mermaid += `        workspace_${workspaceId}_management["⚙️ company-management/"]\n`;
      mermaid += `        workspace_${workspaceId}_products["📦 products/"]\n`;
      mermaid += `        workspace_${workspaceId}_stakeholders["🤝 stakeholders/"]\n`;
      mermaid += `        workspace_${workspaceId}_tools["🛠️ tools-templates/"]\n`;
      
      mermaid += `        workspace_${workspaceId} --> workspace_${workspaceId}_projects\n`;
      mermaid += `        workspace_${workspaceId} --> workspace_${workspaceId}_archived\n`;
      mermaid += `        workspace_${workspaceId} --> workspace_${workspaceId}_management\n`;
      mermaid += `        workspace_${workspaceId} --> workspace_${workspaceId}_products\n`;
      mermaid += `        workspace_${workspaceId} --> workspace_${workspaceId}_stakeholders\n`;
      mermaid += `        workspace_${workspaceId} --> workspace_${workspaceId}_tools\n`;
    });
    
    mermaid += '    end\n\n';
    
    // Relationships
    mermaid += '    %% Relationships\n';
    mermaid += '    dendrita --> dendrita_components\n';
    if (users) {
      mermaid += '    dendrita_components --> users\n';
    }
    if (integrations) {
      mermaid += '    dendrita_components --> integrations\n';
    }
    mermaid += '    dendrita -->|"applies to"| workspaces\n';
    mermaid += '    users -.->|"user-specific<br/>domain knowledge"| dendrita_components\n';
    mermaid += '    integrations -.->|"generic<br/>technical infrastructure"| dendrita_components\n';
    
    // Styling
    mermaid += '\n    %% Styling\n';
    mermaid += '    classDef dendritaStyle fill:#e1f5ff,stroke:#01579b,stroke-width:3px\n';
    mermaid += '    classDef userStyle fill:#f3e5f5,stroke:#4a148c,stroke-width:2px\n';
    mermaid += '    classDef workspaceStyle fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px\n';
    mermaid += '    classDef genericStyle fill:#fff3e0,stroke:#e65100,stroke-width:2px\n';
    
    mermaid += '    class dendrita,dendrita_components dendritaStyle\n';
    if (users) {
      mermaid += '    class users,user_* userStyle\n';
    }
    mermaid += '    class workspace_* workspaceStyle\n';
    if (integrations) {
      mermaid += '    class integrations,integrations_* genericStyle\n';
    }
    
    return mermaid;
  }

  /**
   * Construye el documento Markdown completo
   */
  private buildMarkdownDocument(mermaid: string): string {
    const timestamp = new Date().toISOString();
    
    // Generar URL de mermaid.live con el formato correcto
    // Mermaid Live Editor espera un JSON con {code, mermaid: {theme}} comprimido con pako
    const mermaidConfig = {
      code: mermaid,
      mermaid: { theme: 'default' }
    };
    
    // Convertir a JSON y luego a bytes
    const jsonString = JSON.stringify(mermaidConfig);
    const jsonBytes = new TextEncoder().encode(jsonString);
    
    // Comprimir con pako (raw deflate, compatible con mermaid.live)
    const compressed = pako.deflate(jsonBytes);
    
    // Convertir a base64 y hacer URL-safe (reemplazar + por - y / por _)
    const compressedBase64 = Buffer.from(compressed).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    
    const mermaidLiveUrl = `https://mermaid.live/edit#pako:${compressedBase64}`;
    
    return `---
name: architecture-diagram
description: "dendrita Architecture - Automatically generated diagram"
type: documentation
created: ${timestamp.split('T')[0]}
updated: ${timestamp.split('T')[0]}
tags: ["documentation", "architecture", "diagram", "dashboard"]
category: infrastructure
---

# 🏗️ dendrita Architecture

This diagram represents the complete architecture of the dendrita system. It was automatically generated by the script \`generate-architecture-diagram.ts\`.

**Last updated:** ${timestamp}

---

## 📊 Architecture Diagram

🔗 **[View diagram in Mermaid Live Editor](${mermaidLiveUrl})** (click to visualize immediately)

\`\`\`mermaid
${mermaid}
\`\`\`

---

## 🔄 Regenerate the Diagram

To regenerate this diagram with the current structure:

\`\`\`bash
ts-node .dendrita/integrations/scripts/utils/generate-architecture-diagram.ts
\`\`\`

Or specify a different output file:

\`\`\`bash
ts-node .dendrita/integrations/scripts/utils/generate-architecture-diagram.ts --output path/file.md
\`\`\`

**Note:** The script generates two files:
- \`architecture-diagram.md\` - Complete Markdown document with documentation
- \`architecture-diagram.mmd\` - Pure Mermaid file (diagram code only)

---

## 📝 Notes

- **.dendrita/**: Contains reflective metadata of the system (user-specific and generic)
- **workspaces/**: Contains workspace data (projects, products, stakeholders)
- **User-specific**: Agents, skills and work-modes are user-specific domain knowledge
- **Generic**: Integrations contains generic and reusable technical infrastructure

---

**Generated by:** \`generate-architecture-diagram.ts\`  
**Date:** ${timestamp}
`;
  }

  /**
   * Guarda el diagrama en archivos (Markdown y Mermaid)
   */
  save(markdown: string, mermaid: string): void {
    // Guardar archivo Markdown
    const dir = path.dirname(this.outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(this.outputPath, markdown, 'utf-8');
    console.log(`✅ Diagrama Markdown guardado en: ${this.outputPath}`);
    
    // Guardar archivo Mermaid separado
    const mermaidPath = this.outputPath.replace(/\.md$/, '.mmd');
    fs.writeFileSync(mermaidPath, mermaid, 'utf-8');
    console.log(`✅ Diagrama Mermaid guardado en: ${mermaidPath}`);
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  let outputPath: string | undefined;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output' && i + 1 < args.length) {
      outputPath = args[i + 1];
      i++;
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
Uso: ts-node generate-architecture-diagram.ts [opciones]

Opciones:
  --output <archivo>  Guarda el diagrama en un archivo específico
                      (default: .dendrita/dashboards/architecture-diagram.md)
  --help, -h          Muestra esta ayuda

Ejemplos:
  ts-node generate-architecture-diagram.ts
  ts-node generate-architecture-diagram.ts --output docs/arquitectura.md
`);
      process.exit(0);
    }
  }

  try {
    const generator = new ArchitectureDiagramGenerator(outputPath);
    const { markdown, mermaid } = generator.generate();
    generator.save(markdown, mermaid);
    
    console.log('\n✅ Diagrama de arquitectura generado exitosamente');
  } catch (error) {
    console.error('❌ Error al generar el diagrama:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

