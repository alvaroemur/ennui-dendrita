# Initialization of .dendrita

## Configuration Status

✅ **Complete configuration:**
- `settings.json` configured as reflective metadata
- Hooks documented as behavior references
- Skills defined in `skill-rules.json`
- Agents created in `.dendrita/agents/`
- User and profile system configured in `.dendrita/users/`

---

## What is .dendrita?

`.dendrita/` is a **reflective base** that contains metadata and documentation for Cursor. Cursor must READ these files to understand the project context and apply the documented behavior.

**IMPORTANT NOTE:** `.dendrita/` is NOT a code execution system. It is metadata and references that Cursor reads directly.

---

## Next Steps for Cursor

### 1. Review .cursorrules

Cursor should review `.cursorrules` in the project root first. This file instructs Cursor to:
- Review `.dendrita/` before any action
- Use the contents of `.dendrita/` as a reflective base
- Read hooks as references, do not execute them

### 2. Read .dendrita/settings.json

This file contains project metadata. It is NOT execution configuration, but reflective information that Cursor should use.

### 3. Use Skills Reflexively

When receiving a user prompt:

1. **Read `.dendrita/skills/skill-rules.json`**
   - Compare the prompt against `keywords` and `intentPatterns`
   - Identify relevant skills

2. **Read the corresponding `SKILL.md` file**
   - Apply the contextual knowledge of the skill

3. **Suggest to the user** if appropriate

### 4. Detect and Use Users

When starting a session or detecting an empty repository:

1. **Check `.dendrita/users/`**
   - If it doesn't exist or is empty: start initialization process (see `.dendrita/hooks/repo-initialization.md`)
   - If it exists: identify active user and load corresponding profile

2. **Apply user profile:**
   - Verify active workspace
   - Load workspace default profile (if exists) or user default profile
   - Apply profile preferences and work context

3. **Use profile to customize behavior:**
   - Prioritize skills from `frequently_used_skills`
   - Suggest work modes from `preferred_work_modes`
   - Adapt communication style according to preferences

**Documentation:** See `.dendrita/users/README.md` for complete details.

### 5. Use Hooks as References

Hooks in `.dendrita/hooks/` are behavior references:

- **repo-initialization**: Cursor should apply initialization logic when detecting empty repository
- **skill-activation-prompt**: Cursor should apply logic to identify relevant skills (considering active profile)
- **post-tool-use-tracker**: Cursor should apply logic to identify file context

**NOT executed** - they are references that Cursor reads and applies.

---

## Files Created

- `.dendrita/settings.json` - Reflective metadata of the project
- `.dendrita/settings.local.json` - Local metadata (you can customize)
- `.dendrita/hooks/` - Behavior references (NOT executable)
- `.dendrita/agents/` - Specialized agents
- `.dendrita/skills/` - Contextual knowledge skills
- `.dendrita/users/` - User and profile system (created during initialization)

---

## Reflective Usage

### For Cursor:

1. **When receiving a prompt:**
   - Review `.dendrita/skills/skill-rules.json`
   - Identify relevant skills
   - Read corresponding `SKILL.md`

2. **When editing files:**
   - Identify file context (project, practice, mode)
   - Maintain coherence with persistent documents
   - Consider context for future actions

3. **When working with projects:**
   - Read `current-context.md` before responding
   - Review `tasks.md` to understand status
   - Consult `master-plan.md` for general strategy
   - Update `current-context.md` after important decisions

---

## No Installation Required

✅ **NO need to install anything:**

- ❌ NO `npm install` required
- ❌ NO Node.js required
- ❌ NO execution permissions required
- ❌ NO special configuration required

**Cursor only needs to READ these files.**

---

## Troubleshooting

### Cursor is not applying the behavior

1. **Verify that Cursor has read `.cursorrules`:**
   - The file in the root must instruct Cursor to review `.dendrita/` first

2. **Verify that Cursor has read `skill-rules.json`:**
   - Should review `.dendrita/skills/skill-rules.json` when receiving prompts

3. **Verify that Cursor is reading hooks as references:**
   - Read `.dendrita/hooks/README.md` to understand expected behavior
   - NOT attempting to execute scripts

### Skills are not activating

1. **Verify that Cursor is reviewing `skill-rules.json`:**
   ```markdown
   - Is Cursor comparing the prompt against keywords and intentPatterns?
   - Is Cursor reading the corresponding SKILL.md files?
   ```

2. **Suggest explicitly:**
   - If you identify a relevant skill, suggest it explicitly to the user
   - Read the `SKILL.md` and apply contextual knowledge

3. **Verify that skills exist:**
   - Check `.dendrita/skills/[skill-name]/SKILL.md`

---

## Current Status

- ✅ Configuration: Complete (reflective metadata)
- ✅ Skills: Configured in `skill-rules.json`
- ✅ Agents: Ready in `.dendrita/agents/`
- ✅ Hooks: Documented as references (including repo-initialization)
- ✅ User system: Configured in `.dendrita/users/`
- ✅ NO installation required: Read-only

---

## Next Step

**Cursor should read `.cursorrules` in the project root first.**

This file instructs Cursor on how to use `.dendrita/` as a reflective base.

---

**For more information:** See `.cursorrules` in the root and `.dendrita/hooks/README.md`
