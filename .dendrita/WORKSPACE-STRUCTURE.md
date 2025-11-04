# Workspace Structure Standard

This document defines the standard structure that **all workspaces** must follow in dendrita.

## Mandatory Structure

Each workspace **must** have the following structure:

```
workspaces/[workspace-name]/
├── active-projects/          # Active projects
├── archived-projects/        # Archived projects
├── company-management/        # General management (optional, can be empty)
├── best-practices/           # Templates and workspace methodologies
│   └── README.md             # Documentation of purpose
├── products/                 # Products portfolio
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
- Folders: `best-practices/`, `products/`, `stakeholders/`, `tools-templates/`, `company-management/`, `active-projects/`, `archived-projects/`
- System files: `master-plan.md`, `current-context.md`, `tasks.md`, `allies-mapping.md`, `projects-governance.md`, `projects-dashboard.md`, etc.

**Can be in any language:**
- Workspace names: Any name you choose (e.g., `workspace-1`, `my-company`, `example-workspace`)
- Project names within `active-projects/`: Any name you choose (e.g., `project-1`, `example-project`, etc.)

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

### `products/`
- **Mandatory**: Yes (with README.md)
- **Purpose**: Products portfolio and product documentation
- **Content**: Product folders with README.md describing each product
- **Example**: `products/bootcamp-fundraising/README.md`
- **Note**: Products are reusable offerings (services, tools, content, etc.) that can be delivered across multiple projects

**IMPORTANT:** All folder and file names describing system logic must be in English. Only workspace and project names can be in any language.

**Note:** Work-modes are now user-specific and located in `.dendrita/users/[user-id]/work-modes/`. See `.dendrita/users/example-user/` for reference.

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

## Reference Workspace

The workspace template in `.dendrita/templates/workspace-template/` serves as **standard reference** and contains:

- Complete templates in `best-practices/`
- Product portfolio structure in `products/`
- Tool examples in `tools-templates/`
- Complete stakeholder structure in `stakeholders/`

**New workspaces can:**
1. Copy and adapt content from the template as starting point
2. Develop specific content for their needs
3. Maintain minimal structures if specific content not required

## How to Create a New Workspace

1. **Use the workspace template:**
   ```bash
   cp -r .dendrita/templates/workspace-template workspaces/[new-workspace-name]
   ```

2. **Or create basic folder structure manually:**
   ```bash
   mkdir -p workspaces/[new-workspace]/{active-projects,archived-projects,company-management,best-practices,products,stakeholders,tools-templates}
   ```

3. Create README.md in each main folder:
   - `best-practices/README.md`
   - `products/README.md`
   - `stakeholders/README.md`
   - `tools-templates/README.md`

4. Create main `README.md` for workspace with description

5. (Optional) Copy relevant content from `.dendrita/templates/workspace-template/` and adapt it

**Note:** Work-modes are now in `.dendrita/users/[user-id]/work-modes/`. See `.dendrita/users/example-user/` for reference.

## Validation

Cursor should verify that each workspace follows this structure when:
- Creating a new workspace
- Working with workspace files
- Detecting references to workspaces in documentation

## Notes for Cursor

- **Always** verify structure exists before referencing folders
- **Suggest** creating missing structure if workspace doesn't have it
- **Use** `.dendrita/templates/workspace-template/` as reference when workspace doesn't have specific content
- **Document** in README.md the purpose of each folder in workspace

