---
name: workspace-structure
description: "Workspace Structure Standard"
type: documentation
created: 2025-12-02
updated: 2025-12-02
tags: ["documentation", "infrastructure", "workspace"]
category: infrastructure
---

# Workspace Structure Standard

This document defines the standard structure that **all workspaces** must follow in dendrita.

---

## Mandatory Structure

Each workspace **must** have the following structure:

```
workspaces/[workspace-name]/
├── 🚀 active-projects/          # Active projects
├── .archived-projects/          # Archived projects (hidden)
├── ⚙️ company-management/        # General management (optional, can be empty)
│   └── 📚 best-practices/       # Templates and workspace methodologies
│       └── README.md            # Documentation of purpose
├── 💼 commercial-management/     # Commercial management (optional)
│   ├── templates/               # Reusable proposal templates
│   ├── process/                 # Commercial process documentation
│   └── proposals/               # Proposals organized by pipeline stage and client/opportunity
├── 📦 products/                 # Products portfolio
│   └── README.md                # Documentation of purpose
├── 🤝 stakeholders/             # Allies and stakeholder management
│   └── README.md                # Documentation of purpose
├── 🛠️ tools-templates/          # Reusable tools and templates
│   └── README.md                # Documentation of purpose
├── config-estilo.json           # Style and brand configuration (optional)
└── README.md                    # Workspace documentation
```

---

## Naming Convention

**IMPORTANT:** All folder and file names describing system logic must be in English:
- Folders: `best-practices/`, `products/`, `stakeholders/`, `tools-templates/`, `company-management/`, `commercial-management/`, `active-projects/`, `archived-projects/`
- System folders with emojis: `🚀 active-projects/`, `⚙️ company-management/`, `📚 best-practices/`, `💼 commercial-management/`, `📦 products/`, `🤝 stakeholders/`, `🛠️ tools-templates/`, `.archived-projects/` (hidden)
- System files: `master-plan.md`, `project_context.json`, `tasks.md`, `allies-mapping.md`, `projects-governance.md`, `projects-dashboard.md`, etc.

**Can be in any language (including emojis):**
- Workspace names: Any name you choose (e.g., `workspace-1`, `my-company`, `example-workspace`)
- Project names within `active-projects/`: Any name you choose (e.g., `project-1`, `example-project`, `✅ Proyecto Activo`, etc.)
- Files in `company-management/`: Any name you choose (e.g., `✅ Participantes aceptados.md`)
- Files within project folders (except system files): Any name you choose

**Backup System:**
- Files and folders with emojis or special characters automatically get hidden backup versions
- Backup files are prefixed with `.` (dot) and use sanitized names (emojis removed, spaces replaced with hyphens)
- Example: `✅ Participantes aceptados.md` → `.participantes-aceptados.md`
- Backups are updated on-demand when requested by user
- See `.dendrita/hooks/emoji-files-backup.md` for details

---

## Folder Explanation

### `🚀 active-projects/` and `.archived-projects/`

- **Mandatory**: Yes
- **Purpose**: Organize active and completed projects
- **Internal structure**: Each project must have `master-plan.md`, `project_context.json`, and `tasks.md`
- **Note**: `archived-projects/` is hidden (prefixed with `.`) and located at workspace root level

**Project Files:**
- **`master-plan.md`** - Strategic plan and project vision
- **`tasks.md`** - Task list with status tracking
- **`project_context.json`** - Unified project context (generated from master-plan.md and tasks.md)
- **`current-context.md`** - (Optional, legacy) Current context (being migrated to project_context.json)

**Context Update:**
- Run `tsx .dendrita/integrations/scripts/pipelines/context-pipeline/update-project-context.ts` to generate/update `project_context.json`
- Context propagates from project → user → workspace

### `⚙️ company-management/`

- **Mandatory**: No (structure can be empty)
- **Purpose**: General management documents that don't belong to a specific project
- **Examples**: Project dashboard, pipeline, strategic planning
- **Contains**: 
  - `📚 best-practices/` - Templates and methodologies
  - `config/` - Configuration files (scrapers, drive, email)
  - `data/` - Generated data files (scraped content, search results)
  - `dashboards/` - HTML dashboards and visualizations
  - `docs/` - Additional documentation (workspace-specific)

### `📚 best-practices/`

- **Location**: Inside `⚙️ company-management/`
- **Mandatory**: Yes (with README.md)
- **Purpose**: Templates and workspace-specific methodologies
- **Content**: Folders by project type with README.md explaining the methodology
- **Example**: `⚙️ company-management/📚 best-practices/sustainability-diagnostic/README.md`

### `📦 products/`

- **Mandatory**: Yes (with README.md)
- **Purpose**: Products portfolio and product documentation
- **Content**: Product folders with README.md describing each product
- **Example**: `📦 products/bootcamp-fundraising/README.md`
- **Note**: Products are reusable offerings (services, tools, content, etc.) that can be delivered across multiple projects

### `🤝 stakeholders/`

- **Mandatory**: Yes (with README.md)
- **Purpose**: Allies management, stakeholders, and governance
- **Content**: Allies mapping, contract templates, governance
- **Common files**: `allies-mapping.md`, `projects-governance.md`

### `🛠️ tools-templates/`

- **Mandatory**: Yes (with README.md)
- **Purpose**: Reusable templates and tools
- **Content**: Report templates, matrices, checklists

### `💼 commercial-management/`

- **Mandatory**: No (optional, for workspaces with commercial/sales activities)
- **Purpose**: Commercial management, sales proposals, and CRM organization
- **Structure**:
  - `templates/` - Reusable proposal templates
  - `process/` - Commercial process documentation
  - `proposals/` - Proposals organized by pipeline stage and client/opportunity:
    - Each pipeline stage contains client/opportunity folders
    - `0-radar/` - Initial exploration opportunities
    - `1-contact-initial/` - First interaction
    - `2-diagnosis/` - Needs analysis
    - `3-proposal-design/` - Solution development
    - `4-negotiation/` - Active negotiation
    - `parking/` - Paused opportunities
    - `won/` - Won proposals (CRM standard)
    - `lost/` - Lost proposals (CRM standard)
- **Paradigm**: Organization by pipeline stages and client/opportunity folders, aligned with CRM standards (Salesforce, HubSpot)
- **Note**: Follows industry-standard CRM organization patterns. Each opportunity has its own folder containing all related documents, making it easy to move entire cases between pipeline stages.
- **See**: `.dendrita/docs/WORK-PARADIGM.md` for detailed paradigm documentation

### `config-estilo.json`

- **Mandatory**: No
- **Purpose**: Workspace-specific style rules and brand configuration
- **Scope**: Applies to all files within workspace
- **Contains**: Style rules (`reglas_estilo`) and brand configuration (`brand`) unified in a single file
- **Note**: Previously separated into `brand-config.json` and `config-estilo.json`, now unified

---

## Reference Workspace

The workspace template in `.dendrita/templates/workspace-template/` serves as **standard reference** and contains:

- Complete templates in `⚙️ company-management/📚 best-practices/`
- Commercial management structure in `💼 commercial-management/` (with templates and proposal organization)
- Product portfolio structure in `📦 products/`
- Tool examples in `🛠️ tools-templates/`
- Complete stakeholder structure in `🤝 stakeholders/`

**New workspaces can:**
1. Copy and adapt content from the template as starting point
2. Develop specific content for their needs
3. Maintain minimal structures if specific content not required

---

## How to Create a New Workspace

1. **Use the workspace template:**
   ```bash
   cp -r .dendrita/templates/workspace-template workspaces/[new-workspace-name]
   ```

2. **Or create basic folder structure manually:**
   ```bash
   mkdir -p workspaces/[new-workspace]/"🚀 active-projects"
   mkdir -p workspaces/[new-workspace]/".archived-projects"
   mkdir -p workspaces/[new-workspace]/"⚙️ company-management/📚 best-practices"
   mkdir -p workspaces/[new-workspace]/"💼 commercial-management/templates"
   mkdir -p workspaces/[new-workspace]/"💼 commercial-management/proposals/0-radar"
   mkdir -p workspaces/[new-workspace]/"💼 commercial-management/proposals/1-contact-initial"
   mkdir -p workspaces/[new-workspace]/"💼 commercial-management/proposals/2-diagnosis"
   mkdir -p workspaces/[new-workspace]/"💼 commercial-management/proposals/3-proposal-design"
   mkdir -p workspaces/[new-workspace]/"💼 commercial-management/proposals/4-negotiation"
   mkdir -p workspaces/[new-workspace]/"💼 commercial-management/proposals/parking"
   mkdir -p workspaces/[new-workspace]/"💼 commercial-management/proposals/won"
   mkdir -p workspaces/[new-workspace]/"💼 commercial-management/proposals/lost"
   mkdir -p workspaces/[new-workspace]/"📦 products"
   mkdir -p workspaces/[new-workspace]/"🤝 stakeholders"
   mkdir -p workspaces/[new-workspace]/"🛠️ tools-templates"
   ```

3. Create README.md in each main folder:
   - `⚙️ company-management/📚 best-practices/README.md`
   - `💼 commercial-management/README.md` (if using commercial management)
   - `💼 commercial-management/templates/README.md` (if using commercial management)
   - `💼 commercial-management/proposals/README.md` (if using commercial management)
   - `📦 products/README.md`
   - `🤝 stakeholders/README.md`
   - `🛠️ tools-templates/README.md`

4. Create main `README.md` for workspace with description

5. (Optional) Copy relevant content from `.dendrita/templates/workspace-template/` and adapt it

**Note:** Work-modes are now in `.dendrita/users/[user-id]/work-modes/`. See `.dendrita/users/example-user/` for reference.

---

## Validation

Cursor should verify that each workspace follows this structure when:
- Creating a new workspace
- Working with workspace files
- Detecting references to workspaces in documentation

---

## Notes for Cursor

- **Always** verify structure exists before referencing folders
- **Suggest** creating missing structure if workspace doesn't have it
- **Use** `.dendrita/templates/workspace-template/` as reference when workspace doesn't have specific content
- **Document** in README.md the purpose of each folder in workspace

---

## Related Documentation

- **Work Paradigm:** `.dendrita/docs/WORK-PARADIGM.md` - Detailed work paradigm for all workspace areas
- **Context System:** `.dendrita/docs/CONTEXT-SYSTEM-COMPARISON.md` - Context system documentation
- **Workspace Template:** `.dendrita/templates/workspace-template/` - Reference template

---

**Last updated:** 2025-12-02
