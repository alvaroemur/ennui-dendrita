---
name: readme
description: "Templates Directory"
type: template
created:
  2025-11-06T00:00:00.000Z
  
updated:
  2025-11-06T00:00:00.000Z
  
tags: ["template", "readme", "documentation"]
category: template
---

# Templates Directory

This directory contains templates for creating new workspaces and users in dendrita.

## Structure

```
.dendrita/templates/
├── workspace-template/        # Template for creating new workspaces
│   ├── project-files/         # Templates for project files (master-plan, current-context, tasks)
│   │   ├── master-plan-template.md
│   │   ├── current-context-template.md
│   │   ├── tasks-template.md
│   │   ├── project-context.json.example
│   │   └── README.md
│   ├── workspace-context.json.example  # Example structure for workspace context
│   ├── config-estilo.json.example
│   ├── scrapers-config.json.example
│   └── README.md              # Workspace template documentation
└── README.md                  # This file
```

## Available Templates

### workspace-template
**Location:** `.dendrita/templates/workspace-template/`  
**Purpose:** Template for creating new workspaces

**Usage:**
```bash
cp -r .dendrita/templates/workspace-template workspaces/[new-workspace-name]
```

**Contains:**
- Standard workspace folder structure
- README.md files for each folder
- Example configuration files
- Documentation on workspace structure
- **Project file templates** in `project-files/` with explicit parsing requirements

### User Templates
**Location:** `.dendrita/users/example-user/`  
**Purpose:** Template for creating new users

**Usage:**
```bash
cp -r .dendrita/users/example-user .dendrita/users/[new-user-id]
```

**Contains:**
- User profile template (`profile.json`)
- User context template (`context.json.example`)
- Agent examples
- Skill examples
- Work-mode template

## Purpose

Templates are separated from active workspaces to:
- Keep workspace directories clean (only real workspaces)
- Make templates easily identifiable
- Prevent confusion between templates and active content
- Allow templates to be versioned separately

## Project File Templates

**Location:** `.dendrita/templates/workspace-template/project-files/`

Templates for the three standard project files (`master-plan.md`, `current-context.md`, `tasks.md`) that are automatically parsed by `update-project-context.ts`.

**Key Features:**
- **Explicit parsing requirements** documented in each template
- **Comments explain** what the parser looks for
- **Variants accepted** are documented
- **Examples provided** for clarity

**See:** `.dendrita/templates/workspace-template/project-files/README.md` for detailed documentation

## See Also

- `.dendrita/users/example-user/` - User template
- `.dendrita/WORKSPACE-STRUCTURE.md` - Workspace structure standard
- `.dendrita/templates/workspace-template/` - Workspace template reference
- `.dendrita/templates/workspace-template/project-files/` - Project file templates with parsing requirements

---

**Last updated:** 2025-11-04  
**Version:** 1.0

