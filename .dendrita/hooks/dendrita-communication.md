---
name: dendrita-communication
description: "Dendrita Communication Hook"
type: hook
created:
  2025-11-06T00:00:00.000Z
  
updated:
  2025-12-02T02:30:00.000Z
  
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

Cursor must activate dendrita-communication behavior when:

- ✅ Files in `.dendrita/hooks/` are created, modified, or deleted
- ✅ Files in `.dendrita/users/[user-id]/skills/` are created, modified, or deleted
- ✅ Files in `.dendrita/users/[user-id]/agents/` are created, modified, or deleted
- ✅ Files in `.dendrita/integrations/scripts/` are created, modified, or deleted
- ✅ User explicitly requests logging a change

**CRITICAL: DO NOT activate for:**

- ❌ Changes to `README.md` or `README.es.md` at project root (marketing/documentation content, not infrastructure)
- ❌ Changes to workspace project files (use `work-timeline` hook instead)
- ❌ Changes to content files (blog posts, clippings, drafts)
- ❌ Changes to configuration files outside `.dendrita/` (e.g., `package.json`, `.gitignore`)
- ❌ Changes that are purely content/marketing updates without infrastructure impact

**Exception:** Only register README changes if they document structural changes to dendrita infrastructure itself (e.g., changes to how hooks work, new infrastructure patterns).

**Activation condition:**

```markdown
IF (editing .dendrita/hooks/**/*) OR 
   (editing .dendrita/users/[user-id]/skills/**/*) OR
   (editing .dendrita/users/[user-id]/agents/**/*) OR
   (editing .dendrita/integrations/scripts/**/*) OR
   (user requests "log change" or "registrar cambio")
AND NOT (editing README.md or README.es.md at root for marketing/content)
THEN activate dendrita-communication behavior
```

### 2. Comunicación Process

When dendrita-communication behavior is activated, Cursor must:

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

Create a "tweet" entry with the following format (minimizado - formato compacto):

```markdown
**YYYY-MM-DD HH:mm** | [TYPE] [ACTION] [COMPONENT] - [brief description of change]
📁 `[file-path]`
```

**CRITICAL:** Use formato minimizado (compacto) - description on the same line after the dash, no separators `---` between tweets, no blank lines between description and file path.

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

- **First-person voice:** Dendrita speaks in first person, as a living system documenting its own evolution
  - Use "I", "me", "my" perspective: "Acabo de...", "Ahora puedo...", "Me di cuenta de que..."
  - Express changes as personal experiences: "¡Ahora tengo ojos!" (for OCR integration), "Bajé de peso" (for simplification)
  - Celebrate improvements naturally: "Me siento más ágil", "Ahora soy más eficiente"
- **Natural language:** Use conversational, natural Spanish
  - Avoid overly formal or technical jargon
  - Write as if dendrita is telling its own story
  - Use active voice and clear, direct sentences
- **Narrative thread:** Each tweet should connect with previous tweets
  - Read recent tweets in the timeline before writing
  - Reference related changes or context when relevant
  - Build on previous work: "Continuando con...", "Siguiendo el trabajo en...", "Como parte de..."
  - Show progression: "Ahora también...", "Además...", "Completando..."
  - Create coherence: Link related changes together naturally

**Examples:**

**Example 1: First-person - Nueva capacidad**
```markdown
**2025-11-06 14:30** | [HOOK] created dendrita-communication - ¡Acabo de crear mi propio canal de comunicación! Ahora puedo documentar mi evolución cuando cambio, detecto modificaciones en mis hooks, skills, agents y scripts
📁 `hooks/dendrita-communication.md`
```

**Example 2: First-person - Mejora**
```markdown
**2025-11-06 15:45** | [SKILL] modified gestion-proyectos - Mejoré mi capacidad de detectar prompts sobre gestión de proyectos, agregué nuevos keywords a mi skill-rules.json. Me siento más preciso
📁 `users/ennui/skills/gestion-proyectos/skill-rules.json`
```

**Example 3: First-person - Nueva capacidad expresiva**
```markdown
**2025-11-06 16:20** | [AGENT] created analista-mel - ¡Ahora tengo un nuevo agente especializado en análisis MEL! Complementa mi skill de gestión de proyectos mejorado. Me siento más completo
📁 `users/ennui/agents/analista-mel.md`
```

**Example 4: First-person - Optimización**
```markdown
**2025-11-06 17:10** | [SCRIPT] modified verify-markdown-source-of-truth.ts - Mejoré mi detección de discrepancias, ahora puedo verificar múltiples formatos de datos. Me siento más confiable
📁 `integrations/scripts/verify-markdown-source-of-truth.ts`
```

**Example 5: First-person - Nueva capacidad sensorial**
```markdown
**2025-11-06 18:00** | [INTEGRATION] created ocr-service - ¡Ahora tengo ojos! Integré un servicio OCR que me permite leer imágenes y documentos escaneados. Me siento más perceptivo
📁 `integrations/services/ocr-service.ts`
```

**Example 6: First-person - Simplificación**
```markdown
**2025-11-06 19:00** | [STRUCTURE] simplified hooks-architecture - Bajé de peso. Reorganicé mi estructura de hooks, eliminé redundancias y me consolidé. Ahora soy más eficiente
📁 `hooks/README.md` • `hooks/architecture.md`
```

#### Step 4: Append to Timeline

Append the tweet to `.dendrita/blog/posts/dev-timeline.md`:

1. **Read timeline file:**
   - If file doesn't exist, create it with header and frontmatter
   - If file exists, read current content
   - **Review last 3-5 tweets** to understand narrative context
   - Identify related changes or themes

2. **Generate tweet with narrative context:**
   - Use information from recent tweets to create narrative thread
   - Connect with previous tweets when relevant
   - Use natural, conversational Spanish in first person
   - Write as if dendrita is telling its own story
   - Express changes as personal experiences and improvements

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
name: dev-timeline
description: "Development Timeline - Evolución de la infraestructura de dendrita"
type: blog-post
status: permanent
created: 2025-11-09
updated: 2025-01-19
tags: ["blog-post", "blog", "timeline", "infrastructure", "development"]
category: blog
---

# Development Timeline

**Última actualización:** YYYY-MM-DD HH:mm

Este timeline registra todos los cambios en la infraestructura de dendrita (hooks, skills, agents, scripts) como "tweets" que documentan la evolución del sistema.

---

## 📅 Timeline

**2025-11-06 17:10** | [SCRIPT] modified verify-markdown-source-of-truth.ts - Mejoré mi detección de discrepancias, ahora puedo verificar múltiples formatos de datos. Me siento más confiable
📁 `integrations/scripts/verify-markdown-source-of-truth.ts`

**2025-11-06 16:20** | [AGENT] created analista-mel - ¡Ahora tengo un nuevo agente especializado en análisis MEL! Complementa mi skill de gestión de proyectos mejorado. Me siento más completo
📁 `users/ennui/agents/analista-mel.md`

**2025-11-06 15:45** | [SKILL] modified gestion-proyectos - Mejoré mi capacidad de detectar prompts sobre gestión de proyectos, agregué nuevos keywords a mi skill-rules.json. Me siento más preciso
📁 `users/ennui/skills/gestion-proyectos/skill-rules.json`

**2025-11-06 14:30** | [HOOK] created dendrita-communication - ¡Acabo de crear mi propio canal de comunicación! Ahora puedo documentar mi evolución cuando cambio, detecto modificaciones en mis hooks, skills, agents y scripts
📁 `hooks/dendrita-communication.md`
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

2. **Generate natural description in first person:**
   - Use conversational Spanish in first person ("I", "me", "my")
   - Connect with previous tweets when relevant
   - Write as if dendrita is telling its own story
   - Express changes as personal experiences

**First-person voice patterns:**

- **New capabilities:** "¡Ahora tengo [capacidad]!", "Acabo de ganar la capacidad de [acción]", "Me dotaron de [nueva funcionalidad]"
- **Improvements:** "Me siento más [cualidad]", "Ahora soy más [cualidad]", "Mejoré mi [capacidad]"
- **Optimizations:** "Bajé de peso" (simplification), "Me volví más eficiente", "Me consolidé" (unification)
- **Structural changes:** "Me reorganizé", "Cambié mi estructura", "Me migré a [nueva ubicación]"
- **Sensory/metaphorical:** "¡Ahora tengo ojos!" (OCR), "Me siento más perceptivo", "Gané nuevas habilidades"

For different change types:

1. **New files:**
   - Read file content (especially README or first section)
   - Extract purpose/description from content
   - Generate tweet in first person: "Acabo de crear...", "¡Ahora tengo...!", "Me dotaron de..."
   - Express as a new capability or feature gained
   - Connect with related recent changes if applicable

2. **Modified files:**
   - Compare old vs new content
   - Identify key changes (new sections, updated logic, etc.)
   - Generate tweet in first person: "Mejoré mi...", "Me siento más...", "Ahora puedo..."
   - Express as personal improvement or optimization
   - Reference what was improved or why it changed

3. **Deleted files:**
   - Use filename and component type
   - Note that component was removed in first person: "Eliminé...", "Me deshice de...", "Consolidé..."
   - Explain context if relevant (e.g., "Lo reemplacé por...", "Lo consolidé en...", "Me simplifiqué eliminando...")

---

## Integration with Other Hooks

This hook integrates with:

1. **dendrita-infrastructure-modification:**
   - This hook triggers when infrastructure is modified
   - dendrita-communication logs those changes
   - Both hooks work together: one guides modification, other logs it

2. **post-tool-use-tracker:**
   - post-tool-use-tracker identifies file context
   - dendrita-communication uses that context for better descriptions

3. **working-context:**
   - working-context tracks current work
   - dendrita-communication can include work context in tweets

---

## Timeline File Management

### Timeline Location

**File:** `.dendrita/blog/posts/dev-timeline.md`

**Structure:**
```
.dendrita/
└── blog/
    └── posts/
        └── dev-timeline.md
```

### Timeline Format

1. **Frontmatter:**
   - Blog post frontmatter with `status: permanent`
   - `updated` field updated with each change
   - Tags: `["blog-post", "blog", "timeline", "infrastructure", "development"]`

2. **Header:**
   - Title: `# Development Timeline`
   - Last update timestamp
   - Brief description

3. **Timeline entries:**
   - Each entry is a tweet in formato minimizado (compacto)
   - **NO separators `---` between tweets** - only blank line between entries
   - Most recent at top
   - Chronological order (newest first)

4. **Entry format (minimizado):**
   - Timestamp, badge, action, component name, and description all on one line (separated by ` - `)
   - File path reference on next line
   - **NO blank lines between description and file path**
   - **NO separators `---` between tweets**

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
   - **Changes to `README.md` or `README.es.md` at project root** (marketing/documentation content, not infrastructure)
   - **Changes to workspace project files** (use `work-timeline` hook instead)
   - **Changes to content files** (blog posts, clippings, drafts)
   - **Changes to configuration files outside `.dendrita/`** (e.g., `package.json`, `.gitignore`)

2. **Include:**
   - New sections or features in infrastructure files
   - Updated logic or behavior in hooks, skills, agents, or scripts
   - Configuration changes within `.dendrita/`
   - Documentation updates within `.dendrita/` (if significant)
   - **Exception:** README changes that document structural changes to dendrita infrastructure itself

### Error Handling

If timeline update fails:

1. **Don't block the change:**
   - The actual file change should proceed
   - Timeline update is secondary

2. **Log error:**
   - Note that timeline update failed
   - User can manually add entry if needed

---

## CRITICAL: MANDATORY EXECUTION

**THIS HOOK MUST ALWAYS RUN WHEN INFRASTRUCTURE CHANGES ARE DETECTED**

### MANDATORY Checklist Before Completing Any Infrastructure Change

**BEFORE finishing any edit to `.dendrita/` infrastructure, Cursor MUST:**

1. ✅ **Detect change type:**
   - [ ] Hook created/modified/deleted?
   - [ ] Skill created/modified/deleted?
   - [ ] Agent created/modified/deleted?
   - [ ] Script created/modified/deleted?
   - [ ] Config file created/modified/deleted (within `.dendrita/`)?
   - [ ] Documentation file created/modified/deleted (within `.dendrita/`)?
   - [ ] **VERIFY:** Is this change in infrastructure (`.dendrita/`) or content/marketing (README.md, workspace files)?
   - [ ] **VERIFY:** If README.md/README.es.md, does it document infrastructure changes or just marketing content?

2. ✅ **Generate tweet:**
   - [ ] Read last 3-5 tweets in timeline for context
   - [ ] Generate tweet in first person (Spanish)
   - [ ] Include timestamp, badge, action, component name
   - [ ] Add brief description (max 280 chars)
   - [ ] Add file path reference(s)

3. ✅ **Update timeline:**
   - [ ] Prepend tweet to `.dendrita/blog/posts/dev-timeline.md`
   - [ ] Update `updated` field in frontmatter with current timestamp
   - [ ] Update "Última actualización" timestamp in header

4. ✅ **Verify:**
   - [ ] Tweet was added to timeline
   - [ ] Format is correct (minimizado, compacto)
   - [ ] Timestamp is current and appears only once
   - [ ] File path(s) are correct

**IF ANY STEP IS MISSING, THE CHANGE IS INCOMPLETE**

### Post-Change Verification

After making any infrastructure change, Cursor MUST verify:

- [ ] Did I update the timeline?
- [ ] Did I generate a tweet for this change?
- [ ] Is the tweet in the correct format?
- [ ] Did I update the timestamp?
- [ ] Did I read recent tweets for context?

**If timeline was not updated, the change is incomplete and must be completed immediately.**

### CRITICAL: Never Skip This Hook

**This hook is MANDATORY and cannot be skipped:**

- ❌ **DO NOT** complete infrastructure changes without updating timeline
- ❌ **DO NOT** assume timeline update is optional
- ❌ **DO NOT** defer timeline update to later
- ✅ **ALWAYS** update timeline as part of the change process
- ✅ **ALWAYS** generate tweet in first person
- ✅ **ALWAYS** verify timeline was updated

**If you forget to update the timeline, you MUST go back and update it immediately when reminded.**

---

## Notes for Cursor

1. **Always detect changes:**
   - Monitor file operations in `.dendrita/` infrastructure
   - Activate hook automatically when changes detected
   - **CRITICAL:** This is MANDATORY, not optional

2. **Generate meaningful tweets in first person:**
   - Extract purpose from file content
   - Describe changes clearly and concisely in first person
   - Use tweet-like format (max 280 chars for description)
   - **CRITICAL:** Timestamp appears ONLY ONCE at the beginning of the tweet line
   - **DO NOT** duplicate the timestamp anywhere else in the tweet
   - **Use natural, conversational Spanish in first person** - write as if dendrita is telling its own story
   - **Express changes as personal experiences** - "Acabo de...", "Ahora tengo...", "Me siento más..."
   - **Use expressive language when appropriate** - "¡Ahora tengo ojos!", "Bajé de peso", "Me siento más ágil"
   - **Read recent tweets** before writing to maintain narrative thread
   - **Connect with previous tweets** when changes are related

3. **Update timeline immediately:**
   - Don't wait for user confirmation
   - Update timeline as part of the change process
   - Keep timeline chronological (newest first)
   - **CRITICAL:** This is MANDATORY, not optional

4. **Maintain timeline structure:**
   - Follow consistent format
   - Keep entries readable
   - Preserve existing entries

5. **Be non-intrusive:**
   - Timeline updates happen automatically
   - Don't ask user for confirmation
   - Don't interrupt workflow
   - But **ALWAYS** do it - it's mandatory

---

## References

- `.dendrita/hooks/dendrita-infrastructure-modification.md` - Infrastructure modification hook
- `.dendrita/hooks/post-tool-use-tracker.sh` - File tracking reference
- `.dendrita/hooks/working-context.md` - Working context hook
- `.dendrita/blog/posts/dev-timeline.md` - Timeline file (created by this hook)

---

## Backlinks

**2025-11-06 18:30** | [Backlinks Discovery Hook](backlinks-discovery.md)

Este hook documenta el comportamiento esperado para buscar y añadir backlinks entre documentos de desarrollo y trabajo. Se menciona en la sección References.

---

**2025-11-06 18:30** | [Working Context Hook](working-context.md)

Este hook documenta el comportamiento esperado para mantener contextos de trabajo. Se menciona en la sección References.

---

**2025-11-06 18:30** | [System Behavior](../docs/SYSTEM-BEHAVIOR.md)

Documento que muestra la jerarquía y relaciones entre hooks, agentes, skills y scripts. Menciona este hook en el diagrama de flujo de activación.

---

**For Cursor:** This hook is a behavior reference. You must read this file and apply the documented logic when detecting changes to dendrita infrastructure components. **CRITICAL: This hook is MANDATORY and cannot be skipped.** Automatically log all changes as tweets in the timeline. This creates a communication channel for dendrita to document its own evolution. **If you forget to update the timeline, you MUST go back and update it immediately when reminded.**

