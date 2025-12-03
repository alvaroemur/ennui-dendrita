---
name: working-context
description: "Working Context Hook"
type: hook
created:
  2025-11-06T00:00:00.000Z
  
updated:
  2025-11-06T00:00:00.000Z
  
tags: ["hook", "behavior-reference"]
category: behavior-reference
---

# Working Context Hook

Behavior reference for Cursor - automatic creation and update of context files.

---

## What is this Hook?

This hook documents the expected behavior that Cursor must apply when working with the unified JSON context system:

- **`context.json`** in `.dendrita/users/[user-id]/context.json` - Unified user context with quickReference for fast lookup
- **`context.json`** in `workspaces/[workspace]/context.json` - Workspace-specific context
- **`project_context.json`** in `workspaces/[workspace]/🚀 active-projects/[project]/project_context.json` - Project context combining master-plan.md, current-context.md, and tasks.md

**Purpose:** Automatically maintain summaries of current work context in JSON format to help track progress and maintain continuity across sessions. The system uses a "resumen del resumen" (quickReference) for fast lookup when the user mentions something new.

**Paradigm:** 
- **User context** tracks all work across all workspaces with quickReference for fast search
- **Workspace contexts** track work specific to each workspace (filtered from user context)
- **Project contexts** combine master-plan.md, current-context.md, and tasks.md into a single JSON
- **quickReference** provides fast lookup of recent memories, active workspaces, recent files, and quickLinks
- **Data propagation**: Project → Workspace → User (memories flow from granular to general)

---

## Expected Behavior

### 1. Activation of the Hook

Cursor must activate context behavior when:

- ✅ User explicitly requests creating or updating context
- ✅ User mentions "context", "resumen temporal", or "update context"
- ✅ Working in `_temp/` directory and creating multiple related files (dev-context)
- ✅ Working in `workspaces/` and making changes to projects (working-context for professional workspaces, personal-context for personal workspace)
- ✅ User requests "dendritify" something (which should trigger this hook)
- ✅ Starting a new work session that involves multiple files or tasks

**Activation condition:**

```markdown
IF (user mentions "context" OR "resumen temporal" OR "update context") OR 
   (working in _temp/ with multiple files) OR 
   (working in workspaces/ with project changes) OR
   (user requests "dendritify") OR
   (starting new work session with multiple tasks)
THEN activate context behavior

ALWAYS check quickReference first when user mentions something new to find related memories, links, and references quickly
```

### 2. Working Context Process

When working-context behavior is activated, Cursor must:

#### Step 1: Identify Context Location

1. **Determine context file location:**
   - **User context:** `.dendrita/users/[user-id]/context.json` - Unified context for all workspaces
   - **Workspace context:** `workspaces/[workspace]/context.json` - Workspace-specific context
   - **Project context:** `workspaces/[workspace]/🚀 active-projects/[project]/project_context.json` - Project-specific context
   - If user specifies a different location, use that

2. **Check if file exists:**
   - If exists: Read JSON to understand existing context
   - If not exists: Run migration script or create new JSON with initial structure
   - **Always check quickReference first** when user mentions something new

3. **Check if context needs update:**
   - **For project_context.json:** Check if `master-plan.md`, `current-context.md`, or `tasks.md` were modified after `lastUpdate`
   - **For user/workspace context.json:** Check if projects changed or `context-input.md` exists
   - **If context is outdated:**
     - **CRITICAL (auto-update):** If user is actively working on the project and context is needed for accurate responses → Automatically run update script
     - **IMPORTANT (suggest):** If context might be outdated but not blocking → Suggest update with command
     - **Show update note:** Display `_update_note` from context JSON template if available

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

#### Step 3: Using quickReference for Fast Lookup

**CRITICAL:** When the user mentions something new, ALWAYS check `quickReference` first:

1. **Search quickReference.recentMemories** for related memories
2. **Check quickReference.activeWorkspaces** for active workspaces
3. **Look at quickReference.recentFiles** for recently worked files
4. **Use quickReference.quickLinks** to navigate to project/workspace contexts
5. **Check quickReference.recentTags** for relevant tags

This allows finding related context quickly without searching through all memories.

#### Step 4: Create or Update Context Files

When creating or updating context files, follow the propagation flow from granular to general:

**Flujo de propagación: Proyecto → Workspace → Usuario**

1. **For project context (`workspaces/[workspace]/🚀 active-projects/[project]/project_context.json`):**
   - Parse `master-plan.md`, `current-context.md` (if exists), and `tasks.md`
   - Combine into single JSON structure with `quickReference`
   - Calculate task statistics
   - Determine project status (active/paused/completed)
   - Generate `quickReference` with decisions, next steps, priority tasks
   - **Archive `current-context.md` after generating JSON** (move to `.archived/` directory)
   - **This is the granular level - data flows UP from here**

2. **For user context (`.dendrita/users/[user-id]/context.json`):**
   - **Read all `project_context.json` files** from active projects (propagation from projects)
   - **Extract memories from project contexts**: decisions, next steps, priority tasks, blockers
   - Read `_temp/context-input.md` or `.txt` if exists (manual input)
   - Parse input to extract ideas, tasks, references
   - Create new memories from input
   - **Merge all memories**: project memories + input memories + existing memories
   - Clean obsolete memories (archived > 30 days, low relevance > 14 days)
   - Update quickReference with recent memories, active workspaces, recent files, quickLinks
   - Update summary statistics
   - **This is the general level - aggregates data from all projects**

3. **For workspace context (`workspaces/[workspace]/context.json`):**
   - **Filter user context memories by workspace** (propagation from user context)
   - Create workspace-specific quickReference
   - Update workspace summary
   - **This is the intermediate level - filters data from user context**

4. **Always use JSON:**
   - Only JSON files are generated (no MD files)
   - JSON is the source of truth
   - **Recommended:** Use the master sync script: `sync-all-context.ts`
   - **Alternative:** Use individual scripts: `update-context.ts` and `update-project-context.ts`

#### Step 5: Update During Session

During the work session, Cursor should:

1. **Update when significant changes occur:**
   - User adds content to `_temp/context-input.md` or `.txt`
   - Project changes in workspaces, new projects, status updates
   - Priorities change (urgent, in progress, next)
   - New tasks identified
   - Files modified in projects

2. **Context Update Detection and Action:**
   
   **When reading context files, check if update is needed:**
   
   - **Project context (`project_context.json`):**
     - Check if `master-plan.md`, `current-context.md`, or `tasks.md` modified after `lastUpdate`
     - **If outdated and user is working on project:**
       - **Auto-update:** Run `tsx .dendrita/integrations/scripts/pipelines/context-pipeline/update-project-context.ts --workspace [workspace] --project [project]`
       - Show message: `🔄 Project context updated from source files`
     - **If outdated but not actively working:**
       - **Suggest:** Show `_update_note` from template: "To update: Run 'tsx .dendrita/integrations/scripts/pipelines/context-pipeline/update-project-context.ts --workspace [workspace] --project [project]'"
   
   - **User/Workspace context (`context.json`):**
     - Check if projects changed or `context-input.md` exists
     - Check if `project_context.json` files are newer than `lastUpdate`
     - **If outdated and user needs accurate context:**
       - **Auto-update:** Run master sync script (recommended):
         - `tsx .dendrita/integrations/scripts/pipelines/context-pipeline/sync-all-context.ts`
       - **Alternative:** Run update scripts in order:
         1. `tsx .dendrita/integrations/scripts/pipelines/context-pipeline/update-project-context.ts` (if projects changed)
         2. `tsx .dendrita/integrations/scripts/pipelines/context-pipeline/update-context.ts`
       - Show message: `🔄 Context updated - memories propagated from projects`
     - **If outdated but not critical:**
       - **Suggest:** Show `_update_note` from template: "To update: Run 'tsx .dendrita/integrations/scripts/pipelines/context-pipeline/sync-all-context.ts'"

3. **Keep updates non-intrusive:**
   - Don't update on every small change
   - Update when user explicitly requests
   - Update when transitioning between major work areas
   - **Auto-update only when:**
     - User is actively working on the project/workspace
     - Context is needed for accurate responses
     - Context is significantly outdated (> 1 day)
   - **Suggest update when:**
     - Context might be outdated but not blocking
     - User is reading context files
     - Context hasn't been updated in a while

4. **Maintain accuracy:**
   - Heuristically clean obsolete memories (archived > 30 days, low relevance > 14 days)
   - Update status of ongoing work
   - Add new memories as they emerge
   - **Always update quickReference** with most recent information
   - **Only JSON files are used** (no MD files)

---

## Integration with Other Hooks

This hook integrates with:

1. **dendritify hook:**
   - When user requests "dendritify" something, this hook should be activated
   - Working context should track the dendritification process

2. **post-tool-use-tracker:**
   - Use tracked file edits to identify work context
   - Consider context of edited files when updating context.json
   - Add edited files to memory metadata

3. **dendrita-infrastructure-modification:**
   - When modifying dendrita infrastructure, update working context
   - Track infrastructure changes in working context

---

## JSON Structure

### User Context Structure

The `context.json` file in `.dendrita/users/[user-id]/context.json` has this structure:

```json
{
  "lastUpdate": "2025-11-06T...",
  "type": "user-context",
  "quickReference": {
    "recentMemories": [
      {
        "id": "memory-uuid",
        "content": "Memoria corta",
        "workspace": "ennui",
        "project": "dendrita-comunicacion",
        "updatedAt": "2025-11-06T..."
      }
    ],
    "activeWorkspaces": [
      {
        "name": "ennui",
        "activeProjects": ["dendrita-comunicacion"],
        "lastActivity": "2025-11-06T..."
      }
    ],
    "recentFiles": [
      {
        "path": "path/to/file1.md",
        "workspace": "ennui",
        "project": "dendrita-comunicacion",
        "lastModified": "2025-11-06T..."
      }
    ],
    "recentTags": ["infrastructure", "refactoring"],
    "quickLinks": {
      "projects": {
        "dendrita-comunicacion": {
          "workspace": "ennui",
          "path": "workspaces/ennui/🚀 active-projects/dendrita-comunicacion/",
          "contextPath": "workspaces/ennui/🚀 active-projects/dendrita-comunicacion/project_context.json"
        }
      },
      "workspaces": {
        "ennui": {
          "contextPath": "workspaces/ennui/context.json",
          "activeProjects": 3
        }
      }
    }
  },
  "memories": [
    {
      "id": "memory-uuid",
      "content": "Memoria corta y concisa",
      "metadata": {
        "workspace": "ennui",
        "project": "dendrita-comunicacion",
        "files": ["path/to/file1.md"],
        "tags": ["infrastructure"],
        "createdAt": "2025-11-06T...",
        "updatedAt": "2025-11-06T...",
        "relevance": "high",
        "status": "active"
      }
    }
  ],
  "summary": {
    "totalMemories": 0,
    "activeMemories": 0,
    "byWorkspace": {},
    "byProject": {}
  }
}
```

### Project Context Structure

The `project_context.json` file combines master-plan.md, current-context.md, and tasks.md:

```json
{
  "lastUpdate": "2025-11-06T...",
  "project": "project-name",
  "workspace": "workspace-name",
  "masterPlan": { /* parsed from master-plan.md */ },
  "currentContext": { /* parsed from current-context.md */ },
  "tasks": { /* parsed from tasks.md */ },
  "quickReference": {
    "recentMemories": [
      {
        "id": "decision-0",
        "content": "Decisión: ...",
        "workspace": "workspace-name",
        "project": "project-name",
        "updatedAt": "2025-11-06T..."
      }
    ],
    "activeWorkspaces": [],
    "recentFiles": [
      {
        "path": "workspaces/workspace/🚀 active-projects/project/master-plan.md",
        "workspace": "workspace-name",
        "project": "project-name",
        "lastModified": "2025-11-06T..."
      }
    ],
    "recentTags": ["fases", "en-progreso"],
    "quickLinks": {
      "projects": {
        "project-name": {
          "workspace": "workspace-name",
          "path": "workspaces/workspace/🚀 active-projects/project/",
          "contextPath": "workspaces/workspace/🚀 active-projects/project/project_context.json"
        }
      },
      "workspaces": {
        "workspace-name": {
          "contextPath": "workspaces/workspace/context.json",
          "activeProjects": 1
        }
      }
    }
  },
  "summary": {
    "status": "active",
    "lastActivity": "2025-11-06T...",
    "tasksCount": {
      "total": 0,
      "completed": 0,
      "pending": 0,
      "inProgress": 0,
      "blocked": 0
    }
  }
}
```

---

## Error Handling

### File Already Exists

If `context.json` already exists:

1. **Read existing JSON**
2. **Merge new memories** with existing memories (update duplicates, add new)
3. **Update timestamp**
4. **Update quickReference** with most recent information
5. **Clean obsolete memories** heuristically

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

1. **Always check quickReference first** when user mentions something new to find related memories, links, and references quickly

2. **Context Update Detection:**
   - **When reading context files:** Check if source files (MD files) are newer than `lastUpdate` in JSON
   - **Show update note:** If context JSON has `_update_note` field, display it to user when context is outdated
   - **Auto-update when CRITICAL:**
     - User is actively working on the project/workspace
     - Context is needed for accurate responses (e.g., user asks about project status, tasks, decisions)
     - Context is significantly outdated (> 1 day) and user needs current information
     - Run update script automatically and show: `🔄 Context updated from source files`
   - **Suggest update when IMPORTANT:**
     - Context might be outdated but not blocking current work
     - User is reading context files but not actively working
     - Show: `💡 Context might be outdated. To update: [command from _update_note]`

3. **Update commands (from `_update_note` in templates):**
   - **Recommended:** `tsx .dendrita/integrations/scripts/pipelines/context-pipeline/sync-all-context.ts` (updates everything in correct order)
   - **Project context:** `tsx .dendrita/integrations/scripts/pipelines/context-pipeline/update-project-context.ts --workspace [workspace] --project [project]`
   - **User/Workspace context:** `tsx .dendrita/integrations/scripts/pipelines/context-pipeline/update-context.ts`
   - **Order matters:** Always run `update-project-context.ts` first, then `update-context.ts` for proper propagation

4. **Always update timestamp** when modifying context files
   - **CRITICAL:** Use actual current date from system, never assume
   - In agent mode: Execute `date` command to get current date
   - In ask mode: Ask user for current date or use placeholder
   - See `.dendrita/hooks/date-handling-guidelines.md` for date handling guidelines

5. **Keep memories concise** - short and focused, with rich metadata

6. **Only JSON files** - no MD files are generated

7. **Use scripts to update** - recommended: `sync-all-context.ts` (updates everything) or individual scripts: `update-context.ts` and `update-project-context.ts`

8. **Update quickReference** with most recent information (last 20 memories, active workspaces, recent files, top 10 tags)

9. **Clean obsolete memories** heuristically (archived > 30 days, low relevance > 14 days)

10. **Merge memories** - update duplicates instead of creating new ones

11. **Read context-input.md** before running update script to incorporate user's ideas and tasks

12. **Project contexts** combine master-plan.md, current-context.md, and tasks.md into single JSON (stored as `project_context.json`)

13. **Workspace contexts** filter user context by workspace

14. **User context** is the unified context for all workspaces with quickReference for fast lookup

---

## References

- `.dendrita/hooks/dendritify.md` - Dendritification process hook
- `.dendrita/hooks/post-tool-use-tracker.sh` - File tracking reference
- `.dendrita/hooks/dendrita-infrastructure-modification.md` - Infrastructure modification hook

---

## Backlinks

**2025-11-06 18:30** | [Backlinks Discovery Hook](backlinks-discovery.md)

Este hook documenta el comportamiento esperado para buscar y añadir backlinks entre documentos de desarrollo y trabajo. Se menciona en la sección References.

---

**2025-11-06 18:30** | [Dendrita Communication Hook](dendrita-communication.md)

Este hook documenta el comportamiento esperado para registrar cambios automáticamente en timeline. Se menciona en la sección References.

---

**For Cursor:** This hook is a behavior reference. You must read this file and apply the documented logic when working with context files. Always check `quickReference` first when the user mentions something new. **Recommended:** Use the master sync script `sync-all-context.ts` to update all context systems together. **Alternative:** Use individual scripts `update-context.ts` and `update-project-context.ts` to update JSON files. Only JSON files are used - no MD files are generated. See `.dendrita/docs/CONTEXT-SYSTEM-COMPARISON.md` for differences between `work-status-report` and `context.json`.


