---
name: readme
description: "Active Projects"
type: template
project: README.md
created:
  2025-11-06T00:00:00.000Z
  
updated:
  2025-11-06T00:00:00.000Z
  
tags: ["template", "active-project", "readme", "documentation"]
category: template
---

# Active Projects

This folder contains active projects for the workspace.

## Purpose

Store all active projects here. Each project should follow the standard structure:
- `master_plan.md` - Project master plan
- `current_context.md` - Current state and decisions
- `tasks.md` - Task list with status
- `project_context.json` - Generated context JSON (auto-generated)
- `README.md` - Project documentation (optional)

## Structure

```
active-projects/
├── [project-name-1]/
│   ├── master_plan.md
│   ├── current_context.md
│   ├── tasks.md
│   └── project_context.json
└── [project-name-2]/
    └── ...
```

## Usage

1. Create a new folder for each project
2. Copy templates from `best-practices/` if available
3. Initialize with the three standard files
4. Update `current_context.md` frequently during work
5. Generate `project_context.json` by running: `tsx .dendrita/integrations/scripts/pipelines/context-pipeline/update-project-context.ts`

---

**This is a template folder. Customize according to your workspace needs.**

