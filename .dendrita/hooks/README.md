# Hooks for ennui-dendrita

Behavior references for Cursor - project reflective base.

---

## What are Hooks?

Hooks in `.dendrita/hooks/` are **behavior references**, NOT executable scripts.

**Purpose:** They document the expected behavior that Cursor must READ and apply reflexively, not execute as code.

### Key points:

- ✅ **Cursor must READ these files** to understand expected behavior
- ✅ **They document the logic** that Cursor should apply
- ❌ **NOT executed** - they are references, not executable code
- ✅ **Maintained for future implementations** if real execution is required

---

## Hooks as References

### repo-initialization (RepoInitialization)

**Behavior reference:** Logic to initialize new dendrita repositories when detected as empty

**Expected behavior that Cursor should apply:**

1. When detecting empty repository (`.dendrita/users/` does not exist or is empty):
   - Start interactive initialization process
   - Ask user for basic data (identifier, primary workspace, roles, preferences)
   - Create user structure in `.dendrita/users/[user-id]/`
   - Generate default profile `profile.json`
   - Offer to create profile specific to primary workspace

2. During initialization:
   - Ask questions one at a time
   - Validate responses
   - Show summary before creating
   - Confirm with user before creating files

**Reference files:**
- `repo-initialization.md` - Documented initialization logic

**For Cursor:**
- Read this file to understand the logic
- NOT attempt to execute it
- Apply documented behavior reflexively when detecting empty repository

**Related documentation:**
- `.dendrita/users/README.md` - Complete user and profile system

---

### skill-activation-prompt (UserPromptSubmit)

**Behavior reference:** Logic to suggest relevant skills based on user prompts and file context

**Expected behavior that Cursor should apply:**

1. When receiving a user prompt:
   - Identify active user profile (check `.dendrita/users/` and active workspace)
   - Read `.dendrita/skills/skill-rules.json`
   - Compare prompt against `promptTriggers.keywords` and `promptTriggers.intentPatterns`
   - Consider `frequently_used_skills` from active profile for prioritization
   - Identify which skills are relevant
   - Read corresponding `SKILL.md` file in `.dendrita/skills/[skill-name]/SKILL.md`
   - Suggest to user activating the skill if appropriate

**Reference files:**
- `skill-activation-prompt.ts` - Documented TypeScript logic
- `skill-activation-prompt.sh` - Bash wrapper (reference)

**For Cursor:**
- Read these files to understand the logic
- NOT attempt to execute them
- Apply documented behavior reflexively

---

### post-tool-use-tracker (PostToolUse)

**Behavior reference:** Logic to track file changes and maintain context between sessions

**Expected behavior that Cursor should apply:**

1. After editing a file (Edit, Write, MultiEdit):
   - Identify context of edited file:
     - `workspaces/[company]/active-projects/[project]/` → Active project
     - `best-practices/[project-type]/` → Best practices
     - `work-modes/[mode].md` → Work mode
   - Maintain mental record of affected context
   - Consider this context for future related actions

**Reference files:**
- `post-tool-use-tracker.sh` - Documented bash logic

**For Cursor:**
- Read this file to understand the logic
- NOT attempt to execute it
- Apply documented behavior reflexively

---

## Included Files (References)

- `repo-initialization.md` - Reference: Logic for initializing empty repositories
- `skill-activation-prompt.sh` - Reference: Bash wrapper for TypeScript hook
- `skill-activation-prompt.ts` - Reference: Documented skill activation logic
- `post-tool-use-tracker.sh` - Reference: Documented file tracking logic
- `package.json` - Reference: Node.js dependencies (for future reference)
- `tsconfig.json` - Reference: TypeScript configuration (for future reference)

**NOTE:** These files are references. Cursor should read them to understand expected behavior, but they are NOT executed.

---

## Customization for ennui-dendrita

Hooks are adapted to recognize:
- Project structure (`active-projects/`, `archived-projects/`)
- Work modes (`work-modes/`)
- Best practices (`best-practices/`)
- Business management (`company-management/`)

**For Cursor:** When applying documented behavior, use these structures to identify file context.

---

## Usage for Cursor

### How to apply repo-initialization behavior:

1. **When detecting empty repository:**
   ```markdown
   - Verify if .dendrita/users/ exists and has users
   - If empty or doesn't exist, start initialization process
   - Ask user for basic data
   - Create user structure and default profile
   - Offer to create profile specific to workspace
   ```

### How to apply skill-activation-prompt behavior:

1. **When receiving a user prompt:**
   ```markdown
   - Identify active user profile (check workspace and defaults)
   - Read .dendrita/skills/skill-rules.json
   - Compare prompt against keywords and intentPatterns
   - Prioritize skills from frequently_used_skills in active profile
   - If there are matches, read corresponding SKILL.md
   - Suggest to user activating the skill if appropriate
   ```

### How to apply post-tool-use-tracker behavior:

1. **After editing a file:**
   ```markdown
   - Identify context based on file path
   - Maintain record of affected context
   - Consider this context for future related actions
   ```

---

## Maintenance of References

These files are maintained for:
- ✅ **Documenting expected behavior** for Cursor
- ✅ **Future reference** if real hook execution is implemented
- ✅ **Understanding logic** without need for execution

**Do NOT require:**
- ❌ Installation of dependencies (`npm install`)
- ❌ Special execution permissions
- ❌ Hook configuration in settings.json for execution

---

## Troubleshooting

### Cursor is not applying the behavior

**Verify:**
1. Has Cursor read `.cursorrules` in root? (Should review `.dendrita/` first)
2. Has Cursor read `.dendrita/skills/skill-rules.json`?
3. Has Cursor read relevant `SKILL.md` files?

**Solution:**
- Ensure Cursor reviews `.dendrita/` at startup
- Explicitly read reference files if necessary

### Unclear references

**Verify:**
1. Read reference files directly
2. Check `.dendrita/hooks/INSTALL.md` for more context
3. Review `.cursorrules` in root for instructions

---

## Important Note

**These hooks are behavior references, NOT executable code.**

- Cursor must READ these files
- Cursor must APPLY documented behavior
- Cursor must NOT EXECUTE these scripts

---

**For more information:** See `.cursorrules` in project root and `.dendrita/agents/` and `.dendrita/skills/`
