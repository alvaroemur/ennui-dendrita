---
name: dendrita-comunicacion
description: "Dendrita Comunicación Hook"
type: hook
created: 2025-11-06
updated: 2025-11-06
tags: ["hook", "behavior-reference"]
category: behavior-reference
---

# Dendrita Comunicación Hook

Behavior reference for Cursor - automatic logging of infrastructure changes as "tweets" in timeline.

---

## What is this Hook?

This hook documents the expected behavior that Cursor must apply when detecting changes to dendrita infrastructure components (hooks, skills, agents, scripts).

**Purpose:** Automatically log all changes to dendrita infrastructure components as "tweets" in a timeline, creating a communication channel for dendrita to document its evolution.

**"Comunicación" means:** The communication channel through which dendrita documents its own changes and evolution.

---

## Expected Behavior

### 1. Activation of the Hook

Cursor must activate dendrita-comunicacion behavior when:

- ✅ Files in `.dendrita/hooks/` are created, modified, or deleted
- ✅ Files in `.dendrita/users/[user-id]/skills/` are created, modified, or deleted
- ✅ Files in `.dendrita/users/[user-id]/agents/` are created, modified, or deleted
- ✅ Files in `.dendrita/integrations/scripts/` are created, modified, or deleted
- ✅ User explicitly requests logging a change

**Activation condition:**

```markdown
IF (editing .dendrita/hooks/**/*) OR 
   (editing .dendrita/users/[user-id]/skills/**/*) OR
   (editing .dendrita/users/[user-id]/agents/**/*) OR
   (editing .dendrita/integrations/scripts/**/*) OR
   (user requests "log change" or "registrar cambio")
THEN activate dendrita-comunicacion behavior
```

### 2. Comunicación Process

When dendrita-comunicacion behavior is activated, Cursor must:

#### Step 1: Detect Change Type

Identify what type of change occurred:

1. **Hook changes:**
   - Created: New hook file in `.dendrita/hooks/`
   - Modified: Existing hook file updated
   - Deleted: Hook file removed

2. **Skill changes:**
   - Created: New skill in `.dendrita/users/[user-id]/skills/[skill-name]/`
   - Modified: Existing skill file updated (SKILL.md or skill-rules.json)
   - Deleted: Skill removed

3. **Agent changes:**
   - Created: New agent in `.dendrita/users/[user-id]/agents/`
   - Modified: Existing agent file updated
   - Deleted: Agent removed

4. **Script changes:**
   - Created: New script in `.dendrita/integrations/scripts/`
   - Modified: Existing script updated
   - Deleted: Script removed

#### Step 2: Gather Change Information

For each change, gather:

1. **Timestamp:** Current date and time (ISO 8601 format: `YYYY-MM-DDTHH:mm:ssZ`)
2. **Change type:** `created`, `modified`, or `deleted`
3. **Component type:** `hook`, `skill`, `agent`, or `script`
4. **File path:** Relative path from `.dendrita/` root
5. **Component name:** Name of the hook/skill/agent/script
6. **Brief description:** What changed (extracted from file content or git diff)
7. **User context:** If available, what the user was working on

#### Step 3: Generate Tweet

Create a "tweet" entry with the following format:

```markdown
**YYYY-MM-DD HH:mm** | [TYPE] [ACTION] [COMPONENT]

[Brief description of change]

📁 `[file-path]`
```

**Tweet format rules:**

- **Timestamp:** ISO 8601 format, human-readable (`YYYY-MM-DD HH:mm`)
  - **CRITICAL:** Timestamp appears ONLY ONCE at the beginning of the tweet line
  - **DO NOT** duplicate the timestamp anywhere else in the tweet
  - Format: `**2025-11-06 14:30** | [TYPE] [ACTION] [COMPONENT]`
- **Type badge:** `[HOOK]`, `[SKILL]`, `[AGENT]`, or `[SCRIPT]`
- **Action:** `created`, `modified`, or `deleted`
- **Component name:** Name of the component (filename without extension)
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

**Example 1: First tweet (no previous context)**
```markdown
**2025-11-06 14:30** | [HOOK] created dendrita-comunicacion

Creando un canal de comunicación para que dendrita documente su propia evolución. Este hook detecta cambios en hooks, skills, agents y scripts, registrándolos automáticamente en el timeline.

📁 `hooks/dendrita-comunicacion.md`
```

**Example 2: Following tweet (with narrative connection)**
```markdown
**2025-11-06 15:45** | [SKILL] modified gestion-proyectos

Mejorando la detección de prompts relacionados con gestión de proyectos. Agregué nuevos keywords al skill-rules.json para capturar mejor las solicitudes del usuario.

📁 `users/ennui/skills/gestion-proyectos/skill-rules.json`
```

**Example 3: Related changes (narrative thread)**
```markdown
**2025-11-06 16:20** | [AGENT] created analista-mel

Siguiendo con la expansión de capacidades, creé un nuevo agente especializado en análisis de sistemas MEL. Esto complementa el skill de gestión de proyectos que acabamos de mejorar.

📁 `users/ennui/agents/analista-mel.md`
```

**Example 4: Improvement (natural progression)**
```markdown
**2025-11-06 17:10** | [SCRIPT] modified verify-markdown-source-of-truth.ts

Mejorando la detección de discrepancias entre markdown y datos fuente. Ahora el script soporta múltiples formatos de datos, lo que hace la verificación más robusta.

📁 `integrations/scripts/verify-markdown-source-of-truth.ts`
```

#### Step 4: Append to Timeline

Append the tweet to `.dendrita/comunicacion/timeline.md`:

1. **Read timeline file:**
   - If file doesn't exist, create it with header
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

**Timeline structure:**

```markdown
# Dendrita Timeline - Comunicación

**Última actualización:** YYYY-MM-DD HH:mm

---

## 📅 Timeline

**2025-11-06 17:10** | [SCRIPT] modified verify-markdown-source-of-truth.ts

Mejorada detección de discrepancias entre markdown y datos fuente. Ahora soporta múltiples formatos de datos.

📁 `integrations/scripts/verify-markdown-source-of-truth.ts`

---

**2025-11-06 16:20** | [AGENT] created analista-mel

Nuevo agente especializado en análisis de sistemas de Monitoreo, Evaluación y Aprendizaje (MEL).

📁 `users/ennui/agents/analista-mel.md`

---

**2025-11-06 15:45** | [SKILL] modified gestion-proyectos

Actualizado skill-rules.json con nuevos keywords para detección de prompts relacionados con gestión de proyectos.

📁 `users/ennui/skills/gestion-proyectos/skill-rules.json`

---

**2025-11-06 14:30** | [HOOK] created dendrita-comunicacion

Nuevo hook para registrar cambios automáticamente en timeline. Detecta modificaciones en hooks, skills, agents y scripts.

📁 `hooks/dendrita-comunicacion.md`

---
```

### 3. Change Detection Logic

#### Detecting File Changes

Cursor must detect changes by:

1. **File operations:**
   - `write` tool → New file created
   - `search_replace` tool → File modified
   - `delete_file` tool → File deleted

2. **Path matching:**
   - Match paths against patterns:
     - `.dendrita/hooks/**/*.md` → Hook changes
     - `.dendrita/users/*/skills/**/*` → Skill changes
     - `.dendrita/users/*/agents/*.md` → Agent changes
     - `.dendrita/integrations/scripts/**/*.ts` → Script changes

3. **Content analysis:**
   - For modifications, compare old vs new content
   - Extract meaningful changes (not just whitespace)
   - Generate brief description from changes

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

1. **New files:**
   - Read file content (especially README or first section)
   - Extract purpose/description from content
   - Generate tweet from purpose using natural language
   - Connect with related recent changes if applicable

2. **Modified files:**
   - Compare old vs new content
   - Identify key changes (new sections, updated logic, etc.)
   - Generate tweet describing main changes naturally
   - Reference what was improved or why it changed

3. **Deleted files:**
   - Use filename and component type
   - Note that component was removed
   - Explain context if relevant (e.g., "Reemplazado por...", "Consolidado en...")

---

## Integration with Other Hooks

This hook integrates with:

1. **dendrita-infrastructure-modification:**
   - This hook triggers when infrastructure is modified
   - dendrita-comunicacion logs those changes
   - Both hooks work together: one guides modification, other logs it

2. **post-tool-use-tracker:**
   - post-tool-use-tracker identifies file context
   - dendrita-comunicacion uses that context for better descriptions

3. **working-context:**
   - working-context tracks current work
   - dendrita-comunicacion can include work context in tweets

---

## Timeline File Management

### Timeline Location

**File:** `.dendrita/comunicacion/timeline.md`

**Structure:**
```
.dendrita/
└── comunicacion/
    └── timeline.md
```

### Timeline Format

1. **Header:**
   - Title: `# Dendrita Timeline - Comunicación`
   - Last update timestamp
   - Brief description

2. **Timeline entries:**
   - Each entry is a tweet
   - Separated by `---` horizontal rule
   - Most recent at top
   - Chronological order (newest first)

3. **Entry format:**
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
   - If changes are related (e.g., adding a skill and updating skill-rules.json), create one tweet
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

2. **Include:**
   - New sections or features
   - Updated logic or behavior
   - Configuration changes
   - Documentation updates (if significant)

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
   - Monitor file operations in `.dendrita/` infrastructure
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

---

## References

- `.dendrita/hooks/dendrita-infrastructure-modification.md` - Infrastructure modification hook
- `.dendrita/hooks/post-tool-use-tracker.sh` - File tracking reference
- `.dendrita/hooks/working-context.md` - Working context hook
- `.dendrita/comunicacion/timeline.md` - Timeline file (created by this hook)

---

**For Cursor:** This hook is a behavior reference. You must read this file and apply the documented logic when detecting changes to dendrita infrastructure components. Automatically log all changes as tweets in the timeline. This creates a communication channel for dendrita to document its own evolution.

