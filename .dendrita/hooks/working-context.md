---
name: working-context
description: "Working Context Hook"
type: hook
created: 2025-11-06
updated: 2025-11-06
tags: ["hook", "behavior-reference"]
category: behavior-reference
---

# Working Context Hook

Behavior reference for Cursor - automatic creation and update of context files.

---

## What is this Hook?

This hook documents the expected behavior that Cursor must apply when working with context files:

- **`dev-context.md`** in `_temp/` - Development and infrastructure context
- **`working-context.md`** in `_temp/` - Workspace work context (excludes personal workspace)
- **`personal-context.md`** in `_temp/` - Personal workspace work context

**Purpose:** Automatically maintain summaries of current work context to help track progress and maintain continuity across sessions.

**Paradigm:** 
- **working-context.md** tracks work in professional workspaces (ennui, inspiro, iami, entre-rutas, otros)
- **personal-context.md** tracks work in the personal workspace (personal projects, career development, personal goals)
- This separation allows for clear distinction between professional and personal work contexts

---

## Expected Behavior

### 1. Activation of the Hook

Cursor must activate context behavior when:

- ✅ User explicitly requests creating or updating `dev-context.md`, `working-context.md`, or `personal-context.md`
- ✅ User mentions "dev context", "working context", "personal context", or "resumen temporal"
- ✅ Working in `_temp/` directory and creating multiple related files (dev-context)
- ✅ Working in `workspaces/` and making changes to projects (working-context for professional workspaces, personal-context for personal workspace)
- ✅ User requests "dendritificar" something (which should trigger this hook)
- ✅ Starting a new work session that involves multiple files or tasks

**Activation condition:**

```markdown
IF (user mentions "dev-context" OR "working-context" OR "personal-context" OR "resumen temporal") OR 
   (working in _temp/ with multiple files) OR 
   (working in workspaces/ with project changes) OR
   (user requests "dendritificar") OR
   (starting new work session with multiple tasks)
THEN activate context behavior

IF working in workspaces/personal/ THEN use personal-context.md
IF working in workspaces/[other]/ THEN use working-context.md
```

### 2. Working Context Process

When working-context behavior is activated, Cursor must:

#### Step 1: Identify Context Location

1. **Determine context file location:**
   - **Dev context:** `_temp/dev-context.md` (development and infrastructure)
   - **Working context:** `_temp/working-context.md` (professional workspace work - ennui, inspiro, iami, entre-rutas, otros)
   - **Personal context:** `_temp/personal-context.md` (personal workspace work - personal projects, career development)
   - If user specifies a different location, use that
   - **Rule:** If working in `workspaces/personal/`, use `personal-context.md`. Otherwise, use `working-context.md`

2. **Check if file exists:**
   - If exists: Read current content and JSON to understand existing context
   - If not exists: Create new file with template structure

#### Step 2: Gather Current Work Context

Cursor must gather information about current work:

1. **Identify active files:**
   - Files currently open in editor
   - Files recently edited in this session
   - Files in `_temp/` directory related to current work

2. **Identify work areas:**
   - Blog drafts in `_working-export/`
   - Analysis reports in `_temp/sheets-analysis/`
   - Scripts in `.dendrita/integrations/scripts/`
   - Other relevant work files

3. **Identify tasks and objectives:**
   - Current tasks being worked on
   - Objectives mentioned by user
   - Related projects or workspaces

4. **Identify related components:**
   - Hooks being created or modified
   - Agents or skills being developed
   - Scripts being written
   - Integrations being configured

#### Step 3: Create or Update Context Files

When creating or updating context files:

1. **For dev-context.md (development/infrastructure):**
   - Use template structure with priorities (urgent, in progress, next)
   - List current work areas with files and status
   - Document infrastructure (hooks, scripts, config)
   - Update both `.md` and `.json` files

2. **For working-context.md (professional workspace work):**
   - Use template structure with priorities (urgent, in progress, next)
   - List professional workspaces with active projects (ennui, inspiro, iami, entre-rutas, otros)
   - **Exclude** personal workspace from this file
   - Include summary by work type (projects, products, stakeholders)
   - Update both `.md` and `.json` files

3. **For personal-context.md (personal workspace work):**
   - Use template structure with priorities (urgent, in progress, next)
   - List personal projects with status and context
   - Include summary by work type (projects, products, stakeholders)
   - Focus on personal development, career management, and personal projects
   - Update both `.md` and `.json` files

4. **Always update JSON:**
   - All context files have corresponding `.json` files
   - Keep JSON in sync with Markdown
   - JSON is the source of truth for structured data

#### Step 4: Update During Session

During the work session, Cursor should:

1. **Update when significant changes occur:**
   - **Dev context:** New files in `_temp/`, infrastructure changes, script updates
   - **Working context:** Project changes in professional workspaces, new projects, status updates
   - **Personal context:** Project changes in personal workspace, new personal projects, status updates
   - Priorities change (urgent, in progress, next)
   - New tasks identified

2. **Keep updates non-intrusive:**
   - Don't update on every small change
   - Update when user explicitly requests
   - Update when transitioning between major work areas

3. **Maintain accuracy:**
   - Remove completed work areas
   - Update status of ongoing work
   - Add new work areas as they emerge
   - **Always update both `.md` and `.json` files together**

---

## Integration with Other Hooks

This hook integrates with:

1. **dendritificar hook:**
   - When user requests "dendritificar" something, this hook should be activated
   - Working context should track the dendritification process

2. **post-tool-use-tracker:**
   - Use tracked file edits to identify work context
   - Consider context of edited files when updating working-context.md

3. **dendrita-infrastructure-modification:**
   - When modifying dendrita infrastructure, update working context
   - Track infrastructure changes in working context

---

## Template Structure

### Dev Context Structure

The `dev-context.md` file should follow this structure:

```markdown
# Dev Context - Desarrollo e Infraestructura

**Última actualización:** YYYY-MM-DD

---

## 🎯 Acciones Prioritarias

### 🔴 Urgente
- (action items)

### 🟡 En Progreso
- (action items)

### 🟢 Próximas
- (action items)

---

## 📝 Trabajo Actual

### [Work Area Name]
**Estado:** [status]
**Archivos:**
- file1.ts
- file2.ts

**Próximos pasos:**
- Action items

---

## 🔧 Infraestructura

### Hooks y Agents
- hook-name (status): description

### Scripts
- script-name (status): description

### Configuración
- config-file.json

---

## 📂 Archivos Temporales

```
_temp/
├── dev-context.md          ← Este archivo
├── [subdirectory]/
└── ...
```

---

## 📌 Notas

- This file is for development and infrastructure topics
- Files in `_temp/` are work files
- Keep this file updated with work in progress
```

### Working Context Structure

The `working-context.md` file should follow this structure:

```markdown
# Working Context - Temas de Trabajo en Workspaces

**Última actualización:** YYYY-MM-DD

---

## 🎯 Acciones Prioritarias

### 🔴 Urgente
- (action items)

### 🟡 En Progreso
- (action items)

### 🟢 Próximas
- (action items)

---

## 📝 Trabajo Actual por Workspace

### [workspace-name]
**Estado:** activo
**Proyectos activos:**
- project1
- project2

**Próximos pasos:**
- Action items

---

## 📊 Resumen por Tipo de Trabajo

### Proyectos
- **Total:** X (excluye workspace personal)
- **En progreso:** Y
- **Pendientes:** Z

### Productos
- **Total:** X
- **En desarrollo:** Y

### Aliados
- **Total:** X
- **Activos:** Y

---

## 📌 Notas

- This file is for workspace work topics (excluye workspace personal)
- For personal workspace topics, see `_temp/personal-context.md`
- Review `current-context.md` of each project for detailed status
- Update this context when there are significant changes in workspaces
```

### Personal Context Structure

The `personal-context.md` file should follow this structure:

```markdown
# Personal Context - Temas de Trabajo en Workspace Personal

**Última actualización:** YYYY-MM-DD

---

## 🎯 Acciones Prioritarias

### 🔴 Urgente
- (action items)

### 🟡 En Progreso
- (action items)

### 🟢 Próximas
- (action items)

---

## 📝 Trabajo Actual por Proyecto

### [project-name]
**Estado:** [status]
**Tipo:** [project type]
**Contexto:**
- (project context)

**Próximos pasos:**
- Action items

---

## 📊 Resumen por Tipo de Trabajo

### Proyectos
- **Total:** X
- **Activos:** Y
- **Detenidos:** Z

### Productos
- **Total:** X
- **En desarrollo:** Y

### Aliados
- **Total:** X
- **Activos:** Y

---

## 📌 Notas

- This file is for personal workspace work topics
- Review `current-context.md` of each project for detailed status
- Update this context when there are significant changes in personal projects
```

---

## Error Handling

### File Already Exists

If `working-context.md` already exists:

1. **Read existing content**
2. **Merge new information** with existing content
3. **Update timestamp**
4. **Preserve important notes** from existing file

### Missing Context

If context is unclear:

1. **Ask user for clarification:**
   - What are you working on?
   - What files are involved?
   - What are the main objectives?

2. **Use available information:**
   - Open files in editor
   - Recent file edits
   - Current directory structure

---

## Notes for Cursor

1. **Always update timestamp** when modifying context files
2. **Keep it concise** - these are summaries, not detailed documentation
3. **Update both `.md` and `.json`** - keep them in sync
4. **Prioritize actions** - use urgent, in progress, next structure
5. **Update proactively** when significant changes occur
6. **Use consistent structure** - follow template format
7. **Track work areas** - organize by work area, not chronologically
8. **Dev context** is for development/infrastructure topics
9. **Working context** is for professional workspace work topics (excludes personal workspace)
10. **Personal context** is for personal workspace work topics (personal projects, career development)
11. **Separation:** Keep professional and personal work contexts separate for clarity

---

## References

- `.dendrita/hooks/dendritificar.md` - Dendritification process hook
- `.dendrita/hooks/post-tool-use-tracker.sh` - File tracking reference
- `.dendrita/hooks/dendrita-infrastructure-modification.md` - Infrastructure modification hook

---

**For Cursor:** This hook is a behavior reference. You must read this file and apply the documented logic when working with context files. Update `dev-context.md` and `working-context.md` proactively during work sessions, keeping both `.md` and `.json` files in sync.


