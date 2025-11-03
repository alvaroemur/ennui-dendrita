# Workspace Structure Standard

This document defines the standard structure that **all workspaces** must follow in ennui-dendrita.

## Mandatory Structure

Each workspace (ennui, inspiro, entre-rutas, horizontes, iami, otros) **must** have the following structure:

```
workspaces/[workspace-name]/
├── active-projects/          # Active projects
├── archived-projects/        # Archived projects
├── company-management/        # General management (optional, can be empty)
├── best-practices/           # Templates and workspace methodologies
│   └── README.md             # Documentation of purpose
├── work-modes/               # Specialized work modes
│   └── README.md             # Documentation of purpose
├── stakeholders/             # Allies and stakeholder management
│   └── README.md             # Documentation of purpose
├── tools-templates/          # Reusable tools and templates
│   └── README.md             # Documentation of purpose
├── config-estilo.json        # Style rules (optional)
└── README.md                 # Workspace documentation
```

## Naming Convention

**IMPORTANT:** All folder and file names describing system logic must be in English:
- Folders: `best-practices/`, `work-modes/`, `stakeholders/`, `tools-templates/`, `company-management/`, `active-projects/`, `archived-projects/`
- System files: `master-plan.md`, `current-context.md`, `tasks.md`, `allies-mapping.md`, `projects-governance.md`, `projects-dashboard.md`, etc.

**Can be in any language:**
- Workspace names: `ennui`, `inspiro`, `entre-rutas`, `horizontes`, `iami`, `otros`
- Project names within `active-projects/`: `diagnostico-sostenibilidad`, `EJEMPLO-proyecto`, etc.

## Folder Explanation

### `active-projects/` and `archived-projects/`
- **Mandatory**: Yes
- **Purpose**: Organize active and completed projects
- **Internal structure**: Each project must have `master-plan.md`, `current-context.md`, and `tasks.md`

### `company-management/`
- **Mandatory**: No (structure can be empty)
- **Purpose**: General management documents that don't belong to a specific project
- **Examples**: Project dashboard, pipeline, strategic planning

### `best-practices/`
- **Mandatory**: Yes (with README.md)
- **Purpose**: Templates and workspace-specific methodologies
- **Content**: Folders by project type with README.md explaining the methodology
- **Example**: `best-practices/sustainability-diagnostic/README.md`

### `work-modes/`
- **Mandatory**: Yes (with README.md)
- **Purpose**: Specialized work modes (agents) for workspace
- **Content**: `.md` files that document work modes
- **Example**: `work-modes/sustainability-strategist.md`

**IMPORTANT:** All folder and file names describing system logic must be in English. Only workspace and project names can be in any language.

### `stakeholders/`
- **Mandatory**: Yes (with README.md)
- **Purpose**: Allies management, stakeholders, and governance
- **Content**: Allies mapping, contract templates, governance
- **Common files**: `allies-mapping.md`, `projects-governance.md`

### `tools-templates/`
- **Mandatory**: Yes (with README.md)
- **Purpose**: Reusable templates and tools
- **Content**: Report templates, matrices, checklists

### `config-estilo.json`
- **Mandatory**: No
- **Purpose**: Workspace-specific style rules
- **Scope**: Applies to all files within workspace

## Reference Workspace: ennui

The `ennui` workspace serves as **standard reference** and contains:

- Complete templates in `best-practices/`
- Complete work modes in `work-modes/`
- Tool examples in `tools-templates/`
- Complete stakeholder structure in `stakeholders/`

**Other workspaces can:**
1. Copy and adapt content from `ennui` as starting point
2. Develop specific content for their needs
3. Maintain minimal structures if specific content not required

## How to Create a New Workspace

1. Create basic folder structure:
   ```bash
   mkdir -p workspaces/[new-workspace]/{active-projects,archived-projects,company-management,best-practices,work-modes,stakeholders,tools-templates}
   ```

2. Create README.md in each main folder:
   - `best-practices/README.md`
   - `work-modes/README.md`
   - `stakeholders/README.md`
   - `tools-templates/README.md`

3. Create main `README.md` for workspace with description

4. (Optional) Copy relevant content from `workspaces/ennui/` and adapt it

## Validation

Cursor should verify that each workspace follows this structure when:
- Creating a new workspace
- Working with workspace files
- Detecting references to workspaces in documentation

## Notes for Cursor

- **Always** verify structure exists before referencing folders
- **Suggest** creating missing structure if workspace doesn't have it
- **Use** `workspaces/ennui/` as reference when workspace doesn't have specific content
- **Document** in README.md the purpose of each folder in workspace

