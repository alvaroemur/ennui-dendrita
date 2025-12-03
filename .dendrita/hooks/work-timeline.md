---
name: work-timeline
description: "Work Timeline Hook"
type: hook
created:
  2025-11-06T00:00:00.000Z
  
updated:
  2025-11-06T00:00:00.000Z
  
tags: ["hook", "behavior-reference"]
category: behavior-reference
---

# Work Timeline Hook

Behavior reference for Cursor - automatic logging of work changes as "tweets" in workspace timelines.

---

## What is this Hook?

This hook documents the expected behavior that Cursor must apply when detecting changes to work projects in workspaces.

**Purpose:** Automatically log all changes to work projects as "tweets" in workspace timelines, creating a communication channel to document work evolution.

**"Work Timeline" means:** The communication channel through which work progress and changes are documented in each workspace.

---

## Expected Behavior

### 1. Activation of the Hook

Cursor must activate work-timeline behavior when:

- ✅ Files in `workspaces/[workspace]/🚀 active-projects/**/*` are created, modified, or deleted
- ✅ Project files (`master-plan.md`, `project_context.json`, `tasks.md`) are modified
- ✅ New projects are created in `workspaces/[workspace]/🚀 active-projects/`
- ✅ Projects are archived (moved to `_archived-projects/`)
- ✅ Important documents in projects are created or modified
- ✅ Tasks are completed or status changes significantly
- ✅ User explicitly requests logging a work event

**Activation condition:**

```markdown
IF (editing workspaces/[workspace]/🚀 active-projects/**/*) OR 
   (editing workspaces/[workspace]/🚀 active-projects/[project]/master-plan.md) OR
   (editing workspaces/[workspace]/🚀 active-projects/[project]/project_context.json) OR
   (editing workspaces/[workspace]/🚀 active-projects/[project]/tasks.md) OR
   (creating new project in workspaces/[workspace]/🚀 active-projects/) OR
   (archiving project to _archived-projects/) OR
   (user requests "log work event" or "registrar evento de trabajo")
THEN activate work-timeline behavior
```

### 2. Work Timeline Process

When work-timeline behavior is activated, Cursor must:

#### Step 1: Detect Change Type

Identify what type of change occurred:

1. **Project changes:**
   - Created: New project folder in `workspaces/[workspace]/🚀 active-projects/`
   - Modified: Project files updated (master-plan.md, project_context.json, tasks.md)
   - Archived: Project moved to `_archived-projects/`
   - Status changed: Significant status change in project

2. **Document changes:**
   - Created: New important document in project
   - Modified: Existing document updated (master-plan.md, project_context.json, tasks.md, README.md)
   - Deleted: Document removed

3. **Task changes:**
   - Completed: Important task marked as completed
   - Created: New important task added
   - Status changed: Task status changed significantly

4. **Milestone changes:**
   - Milestone reached: Important milestone achieved
   - Decision made: Key decision documented
   - Blockers resolved: Important blocker resolved

#### Step 2: Gather Change Information

For each change, gather:

1. **Timestamp:** Current date and time (ISO 8601 format: `YYYY-MM-DDTHH:mm:ssZ`)
2. **Change type:** `created`, `modified`, `completed`, `archived`, `milestone`, `decision`, etc.
3. **Component type:** `project`, `document`, `task`, `milestone`, `decision`
4. **Workspace:** Name of the workspace
5. **Project name:** Name of the project (if applicable)
6. **File path:** Relative path from workspace root
7. **Brief description:** What changed (extracted from file content or git diff)
8. **User context:** If available, what the user was working on

#### Step 3: Generate Tweet

Create a "tweet" entry with the following format:

```markdown
**YYYY-MM-DD HH:mm** | [TYPE] [ACTION] [PROJECT/COMPONENT]

[Brief description of change]

📁 `[file-path]`
```

**Tweet format rules:**

- **Timestamp:** ISO 8601 format, human-readable (`YYYY-MM-DD HH:mm`)
  - **CRITICAL:** Timestamp appears ONLY ONCE at the beginning of the tweet line
  - **DO NOT** duplicate the timestamp anywhere else in the tweet
  - Format: `**2025-11-06 14:30** | [TYPE] [ACTION] [COMPONENT]`
- **Type badge:** `[PROJECT]`, `[DOCUMENT]`, `[TASK]`, `[MILESTONE]`, `[DECISION]`, `[STATUS]`
- **Action:** `created`, `modified`, `completed`, `archived`, `reached`, `made`, etc.
- **Project/Component name:** Name of the project or component
- **Description:** Brief, tweet-like description (max 280 characters)
- **File path:** Relative path in code format

**Communication style:**

- **Natural language:** Use conversational, natural Spanish
  - Avoid overly formal or technical jargon
  - Write as if telling a story about what happened
  - Use active voice and clear, direct sentences
- **Narrative thread:** Each tweet should connect with previous tweets
  - Read recent tweets in the timeline before writing
  - Reference related changes or context when relevant
  - Build on previous work: "Continuando con...", "Siguiendo el trabajo en...", "Como parte de..."
  - Show progression: "Ahora también...", "Además...", "Completando..."
  - Create coherence: Link related changes together naturally

**Examples:**

**Example 1: New project created**
```markdown
**2025-11-06 14:30** | [PROJECT] created [project-name]

Iniciando nuevo proyecto. El proyecto incluirá desarrollo de metodología, materiales de capacitación y estrategias de implementación.

📁 `workspaces/[workspace]/🚀 active-projects/[project]/`
```

**Example 2: Document modified**
```markdown
**2025-11-06 15:45** | [DOCUMENT] modified [project-name]/master-plan.md

Actualizando el master-plan con nuevas estrategias. Incluyendo enfoque en mejoras y actualizaciones para ampliar el alcance.

📁 `workspaces/[workspace]/🚀 active-projects/[project]/master-plan.md`
```

**Example 3: Task completed**
```markdown
**2025-11-06 16:20** | [TASK] completed [project-name]/[task-name]

Completada la primera versión de la funcionalidad. Incluye componentes principales y materiales de apoyo.

📁 `workspaces/[workspace]/🚀 active-projects/[project]/tasks.md`
```

**Example 4: Milestone reached**
```markdown
**2025-11-06 17:10** | [MILESTONE] reached [project-name]/[milestone-name]

Completada la fase piloto del proyecto. Resultados positivos: 85% de satisfacción y 70% de implementación de estrategias aprendidas.

📁 `workspaces/[workspace]/🚀 active-projects/[project]/project_context.json`
```

**Example 5: Project archived**
```markdown
**2025-11-06 18:00** | [PROJECT] archived [project-name]

Proyecto completado exitosamente. Movido a archivo después de 6 meses de implementación activa. Resultados: metodología documentada y objetivos alcanzados.

📁 `workspaces/[workspace]/.archived-projects/[project]/`
```

#### Step 4: Append to Timeline

Append the tweet to `workspaces/[workspace]/📊 work-timeline.md`:

1. **Read timeline file:**
   - If file doesn't exist, create it with header and frontmatter
   - If file exists, read current content
   - **Review last 3-5 tweets** to understand narrative context
   - Identify related changes or themes

2. **Generate tweet with narrative context:**
   - Use information from recent tweets to create narrative thread
   - Connect with previous tweets when relevant
   - Use natural, conversational Spanish
   - Tell a story about what happened

3. **Prepend new tweet:**
   - Add new tweet at the top of the timeline (most recent first)
   - Maintain chronological order (newest at top)

4. **Update timeline:**
   - Write updated timeline to file
   - Preserve existing tweets
   - Update `updated` field in frontmatter with current timestamp

**Timeline structure:**

```markdown
---
name: work-timeline
description: "Work Timeline - Evolución del trabajo en [workspace]"
type: timeline
status: permanent
created: 2025-11-06
updated: 2025-01-19
tags: ["timeline", "work", "projects", "progress"]
workspace: [workspace-name]
---

# Work Timeline - [Workspace Name]

**Última actualización:** YYYY-MM-DD HH:mm

Este timeline registra todos los cambios y eventos importantes en los proyectos de trabajo de [workspace] como "tweets" que documentan la evolución del trabajo.

---

## 📅 Timeline

**2025-11-06 17:10** | [MILESTONE] reached bootcamp-fundraising/fase-piloto

Completada la fase piloto del bootcamp con 3 organizaciones. Resultados positivos: 85% de satisfacción.

📁 `workspaces/[workspace]/🚀 active-projects/[project]/project_context.json`

---

**2025-11-06 16:20** | [TASK] completed bootcamp-fundraising/desarrollo-metodologia

Completada la primera versión de la metodología del bootcamp. Incluye 5 módulos principales.

📁 `workspaces/[workspace]/🚀 active-projects/[project]/tasks.md`

---

**2025-11-06 15:45** | [DOCUMENT] modified bootcamp-fundraising/master-plan.md

Actualizando el master-plan con nuevas estrategias de fundraising. Incluyendo enfoque en donantes corporativos.

📁 `workspaces/[workspace]/🚀 active-projects/[project]/master-plan.md`

---

**2025-11-06 14:30** | [PROJECT] created bootcamp-fundraising

Iniciando nuevo proyecto de bootcamp de fundraising. El proyecto incluirá desarrollo de metodología y materiales.

📁 `workspaces/[workspace]/🚀 active-projects/[project]/`

---
```

### 3. Change Detection Logic

#### Detecting File Changes

Cursor must detect changes by:

1. **File operations:**
   - `write` tool → New file created
   - `search_replace` tool → File modified
   - `delete_file` tool → File deleted
   - `run_terminal_cmd` with `mv` → Project archived

2. **Path matching:**
   - Match paths against patterns:
     - `workspaces/[workspace]/🚀 active-projects/**/*` → Project changes
     - `workspaces/[workspace]/🚀 active-projects/[project]/master-plan.md` → Document changes
     - `workspaces/[workspace]/🚀 active-projects/[project]/project_context.json` → Context changes
     - `workspaces/[workspace]/🚀 active-projects/[project]/tasks.md` → Task changes

3. **Content analysis:**
   - For modifications, compare old vs new content
   - Extract meaningful changes (not just whitespace)
   - Generate brief description from changes
   - Detect task completions (checkboxes marked, status changed)
   - Detect milestone completions (status updates, goal achievements)

#### Generating Descriptions

**Before generating a tweet:**

1. **Read recent timeline entries:**
   - Review last 3-5 tweets in the timeline
   - Identify related changes or context
   - Understand the narrative thread

2. **Generate natural description:**
   - Use conversational Spanish
   - Connect with previous tweets when relevant
   - Tell a story about what happened

For different change types:

1. **New projects:**
   - Read project files (master-plan.md, README.md)
   - Extract purpose/description from content
   - Generate tweet from purpose using natural language
   - Connect with related recent changes if applicable

2. **Modified documents:**
   - Compare old vs new content
   - Identify key changes (new sections, updated goals, etc.)
   - Generate tweet describing main changes naturally
   - Reference what was improved or why it changed

3. **Completed tasks:**
   - Read task description from tasks.md
   - Note completion and any results
   - Generate tweet celebrating completion
   - Reference impact or next steps

4. **Milestones:**
   - Read project_context.json or master-plan.md
   - Extract milestone description
   - Generate tweet celebrating achievement
   - Include results or impact if available

5. **Archived projects:**
   - Read final project status
   - Note completion and results
   - Generate tweet summarizing project completion
   - Include key achievements or learnings

---

## Integration with Other Hooks

This hook integrates with:

1. **post-tool-use-tracker:**
   - post-tool-use-tracker identifies file context
   - work-timeline uses that context for better descriptions

2. **working-context:**
   - working-context tracks current work
   - work-timeline can include work context in tweets

3. **project_context.json:**
   - project_context.json maintains project state
   - work-timeline can reference project context for better descriptions

---

## Timeline File Management

### Timeline Location

**File:** `workspaces/[workspace]/📊 work-timeline.md`

**Structure:**
```
workspaces/
└── [workspace]/
    └── 📊 work-timeline.md
```

### Timeline Format

1. **Frontmatter:**
   - Timeline frontmatter with `status: permanent`
   - `updated` field updated with each change
   - Tags: `["timeline", "work", "projects", "progress"]`
   - `workspace` field with workspace name

2. **Header:**
   - Title: `# Work Timeline - [Workspace Name]`
   - Last update timestamp
   - Brief description

3. **Timeline entries:**
   - Each entry is a tweet
   - Separated by `---` horizontal rule
   - Most recent at top
   - Chronological order (newest first)

4. **Entry format:**
   - Timestamp and badge
   - Description
   - File path reference

### Timeline Maintenance

1. **Automatic updates:**
   - Timeline is updated automatically when changes are detected
   - No manual intervention required

2. **Size management:**
   - Timeline grows indefinitely
   - Consider archiving old entries if needed (future enhancement)
   - For now, keep all entries

3. **Readability:**
   - Keep descriptions concise (tweet-like)
   - Use clear formatting
   - Maintain consistent structure

---

## Special Cases

### Multiple Changes in Same Session

If multiple files are changed in the same session:

1. **Group related changes:**
   - If changes are related (e.g., updating master-plan.md and tasks.md), create one tweet
   - If changes are unrelated, create separate tweets

2. **Batch updates:**
   - For large refactorings, create one summary tweet
   - Or create multiple tweets if each change is significant

### Detecting Meaningful Changes

Not all file modifications are meaningful:

1. **Ignore:**
   - Whitespace-only changes
   - Comment-only changes (unless significant)
   - Formatting-only changes
   - Minor typo corrections

2. **Include:**
   - New sections or features
   - Updated goals or strategies
   - Task completions
   - Status changes
   - Milestone achievements
   - Key decisions
   - Project creation/archiving

### Error Handling

If timeline update fails:

1. **Don't block the change:**
   - The actual file change should proceed
   - Timeline update is secondary

2. **Log error:**
   - Note that timeline update failed
   - User can manually add entry if needed

---

## Notes for Cursor

1. **Always detect changes:**
   - Monitor file operations in `workspaces/[workspace]/🚀 active-projects/`
   - Activate hook automatically when changes detected

2. **Generate meaningful tweets:**
   - Extract purpose from file content
   - Describe changes clearly and concisely
   - Use tweet-like format (max 280 chars for description)
   - **CRITICAL:** Timestamp appears ONLY ONCE at the beginning of the tweet line
   - **DO NOT** duplicate the timestamp anywhere else in the tweet
   - **Use natural, conversational Spanish** - write as if telling a story
   - **Read recent tweets** before writing to maintain narrative thread
   - **Connect with previous tweets** when changes are related

3. **Update timeline immediately:**
   - Don't wait for user confirmation
   - Update timeline as part of the change process
   - Keep timeline chronological (newest first)

4. **Maintain timeline structure:**
   - Follow consistent format
   - Keep entries readable
   - Preserve existing entries

5. **Be non-intrusive:**
   - Timeline updates happen automatically
   - Don't ask user for confirmation
   - Don't interrupt workflow

6. **Identify workspace:**
   - Extract workspace name from file path
   - Update timeline in correct workspace
   - If workspace cannot be determined, ask user or use context

---

## References

- `.dendrita/hooks/dendrita-communication.md` - Infrastructure timeline hook (similar pattern)
- `.dendrita/hooks/post-tool-use-tracker.sh` - File tracking reference
- `.dendrita/hooks/working-context.md` - Working context hook
- `workspaces/[workspace]/📊 work-timeline.md` - Timeline file (created by this hook)

---

**For Cursor:** This hook is a behavior reference. You must read this file and apply the documented logic when detecting changes to work projects in workspaces. Automatically log all changes as tweets in the workspace timeline. This creates a communication channel to document work evolution.

