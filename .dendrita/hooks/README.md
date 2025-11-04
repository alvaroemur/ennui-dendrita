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
   - Read `.dendrita/users/[user-id]/skills/skill-rules.json` (skills are user-specific domain knowledge)
   - Compare prompt against `promptTriggers.keywords` and `promptTriggers.intentPatterns`
   - Consider `frequently_used_skills` from active profile for prioritization
   - Identify which skills are relevant
   - Read corresponding `SKILL.md` file in `.dendrita/users/[user-id]/skills/[skill-name]/SKILL.md`
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

### dendrita-infrastructure-modification (InfrastructureModification)

**Behavior reference:** Logic to handle modifications to dendrita infrastructure (`.dendrita/` folder)

**Expected behavior that Cursor should apply:**

1. When detecting infrastructure modifications:
   - Identify change type and scope (skills, agents, hooks, integrations, etc.)
   - Assess impact on affected components
   - Check for dependencies and compatibility issues
   - Review relevant documentation before making changes

2. Before making changes:
   - Read relevant documentation (README files, structure docs)
   - Identify all files that need updates
   - Warn user about potential impacts and breaking changes
   - Get confirmation for breaking changes

3. When making changes:
   - Follow established patterns and consistency
   - Update related files (README, documentation, examples)
   - Maintain backward compatibility when possible
   - Document breaking changes and provide migration guidance

4. After making changes:
   - Verify consistency and structure
   - Update all related documentation
   - Notify user of changes and any required actions

**Reference files:**
- `dendrita-infrastructure-modification.md` - Documented infrastructure modification logic

**For Cursor:**
- Read this file to understand the logic
- NOT attempt to execute it
- Apply documented behavior reflexively when modifying `.dendrita/` infrastructure

**Related documentation:**
- `.dendrita/WORKSPACE-STRUCTURE.md` - Workspace structure standards
- `.dendrita/users/[user-id]/skills/README.md` - Skills structure (user-specific domain knowledge)
- `.dendrita/users/[user-id]/agents/README.md` - Agents structure (user-specific domain knowledge)
- `.dendrita/integrations/README.md` - Integrations documentation (generic technical infrastructure)

---

### dendrita-alias-activation (DendritaAliasActivation)

**Behavior reference:** Logic to detect mentions of dendrita alias and activate workspace context

**Expected behavior that Cursor should apply:**

1. When receiving a user prompt:
   - Read active user profile to get dendrita alias (from `dendrita_alias` field)
   - Search for mentions of the alias in the prompt
   - Detect patterns like "mételo en mi [alias]" or "[alias], qué es esto"
   - Validate that the mention is intentional (not casual)

2. When alias is detected:
   - Activate full dendrita workspace context
   - Load information from user's workspaces
   - Load information from active projects
   - Load information from best-practices, stakeholders, products, etc.

3. When responding:
   - Respond as if talking with the user's dendrita system
   - Use workspace-specific information
   - Use project-specific information
   - Consider best-practices and work modes
   - Provide contextual responses based on user's dendrita data

4. Pattern recognition:
   - **Save pattern:** "mételo en mi [alias]", "guárdalo en [alias]" → Save information to dendrita
   - **Question pattern:** "[alias], qué es esto", "[alias], explica esto" → Query dendrita for information
   - **Context pattern:** "según [alias]", "como dice [alias]" → Use dendrita context for response

**Reference files:**
- `dendrita-alias-activation.md` - Documented alias activation logic

**For Cursor:**
- Read this file to understand the logic
- NOT attempt to execute it
- Apply documented behavior reflexively when detecting alias mentions

**Related documentation:**
- `.dendrita/users/README.md` - User and profile system (where alias is stored)
- `.dendrita/hooks/repo-initialization.md` - Initialization (where alias is configured)

**Difference from other hooks:**
- This hook focuses on activating workspace context via alias mentions
- This is different from `dendrita-infrastructure-modification` which handles editing dendrita configuration
- This hook is about using dendrita as a knowledge base, not modifying it

---

### session-initialization-verification (SessionInitializationVerification)

**Behavior reference:** Logic to verify dendrita configuration at the start of each new conversation and perform soft-initialization of missing items

**Expected behavior that Cursor should apply:**

1. When starting a new conversation:
   - Verify if user exists and is configured
   - Verify if `dendrita_alias` is configured in user profile
   - Verify if enabled integrations have credentials configured
   - Identify missing configuration elements

2. If configuration is complete:
   - Show brief confirmation message
   - Continue with the session normally

3. If configuration is incomplete:
   - Show summary of missing elements
   - Offer to configure missing items (soft-initialization)
   - Only configure what's missing, not full initialization

4. Soft-initialization process:
   - **If alias missing:** Ask only for alias, update profile.json
   - **If integration missing:** Guide user through setup process
   - **If user missing:** Redirect to full initialization (repo-initialization.md)
   - Respect user's choice to skip (don't ask again in same session)

5. Integration verification:
   - Read `.dendrita/integrations/config.template.json` for enabled services
   - Check for required environment variables for each enabled service
   - Verify if credentials exist (without reading values)
   - Mark services as "enabled but not connected" if credentials missing

**Reference files:**
- `session-initialization-verification.md` - Documented verification and soft-initialization logic

**For Cursor:**
- Read this file to understand the logic
- NOT attempt to execute it
- Apply documented behavior reflexively at the start of each new conversation

**Related documentation:**
- `.dendrita/hooks/repo-initialization.md` - Full repository initialization (used if no users exist)
- `.dendrita/hooks/dendrita-alias-activation.md` - Alias activation (uses alias if configured)
- `.dendrita/integrations/config.template.json` - Integration configuration reference
- `.dendrita/integrations/hooks/` - Integration setup hooks

**Difference from repo-initialization:**
- `repo-initialization.md` runs only when no users exist (full initialization)
- `session-initialization-verification.md` runs at start of each conversation (partial initialization)
- This hook verifies existing configuration and completes only what's missing
- This hook is non-intrusive and respects user's choice to skip

---

### journaling (Journaling)

**Behavior reference:** Logic to capture work narratives and automatically extract insights and tasks

**Expected behavior that Cursor should apply:**

1. When detecting journaling activity:
   - User is narrating work in conversation
   - User explicitly mentions wanting to do journaling
   - User describes their work day/session narratively
   - Narrative patterns detected: "today I worked on...", "I realized...", "I need to..."

2. When journaling is activated:
   - Create or update session entry in journaling project
   - Capture narrative without interrupting
   - Automatically extract insights (decisions, learnings, patterns, blockers)
   - Automatically extract tasks from narrative
   - Register tasks in appropriate workspace `tasks.md` files

3. Insight extraction:
   - Detect patterns: "I decided...", "I learned...", "I realized...", "I can't..."
   - Format as list in "Insights identified" section
   - Register in monthly insights file

4. Task extraction:
   - Detect actions: "I need to...", "I should...", "I must..."
   - Identify workspace/project context from narrative
   - If no context: ask user where task should go
   - Add task to workspace `tasks.md` file
   - Register in journaling entry and monthly tasks file

5. Integration with other workspaces:
   - Read `tasks.md` of destination workspace/project
   - Add task to appropriate section (Quick Wins, Current Sprint, Upcoming)
   - Include comment with origin date: `<!-- Extracted from journaling: YYYY-MM-DD -->`

**Reference files:**
- `journaling.md` - Documented journaling behavior logic

**For Cursor:**
- Read this file to understand the logic
- NOT attempt to execute it
- Apply documented behavior reflexively when detecting work narratives or journaling mentions

**Related documentation:**
- `.dendrita/hooks/skill-activation-prompt.md` - Skill activation (may suggest journaling)
- `.dendrita/hooks/post-tool-use-tracker.md` - File change tracking
- `.dendrita/hooks/dendrita-alias-activation.md` - Workspace context activation
- `.dendrita/users/[user-id]/skills/gestion-proyectos/SKILL.md` - Project and task management

**Difference from other hooks:**
- This hook focuses on capturing work narratives reflexively
- Automatically extracts actionable information (insights and tasks)
- Integrates with other workspaces to add tasks to their work plans
- Workspace personal and journaling project name must be identified from user profile or asked to user

---

### code-debugging-archiving (CodeDebuggingArchiving)

**Behavior reference:** Logic to identify, debug, test, and archive code, rules, and infrastructure components that are no longer needed or require maintenance

**Expected behavior that Cursor should apply:**

1. **Identification Phase:**
   - Identify test/debug files matching patterns: `test-*.ts`, `*-test.ts`, `debug-*.ts`, `*-debug.ts`
   - Find files in `.dendrita/integrations/scripts/` and `.dendrita/integrations/examples/`
   - Review log files in `.dendrita/logs/`
   - Check for deprecated rules in `.dendrita/users/[user-id]/skills/`, `.dendrita/users/[user-id]/agents/`, `.dendrita/hooks/`
   - Identify duplicate or redundant functionality

2. **Debugging Phase:**
   - Review test files for relevance and status
   - Check if scripts depend on deprecated services
   - Verify npm scripts in `package.json` reference existing files
   - Validate configuration files and environment variables

3. **Archiving Phase:**
   - Create timestamped archive directory: `YYYY-MM-DD-[description]`
   - Move files to `.dendrita/archived/` structure:
     - Code → `archived/code/scripts/`, `archived/code/examples/`, `archived/code/tests/`
     - Rules → `archived/rules/skills/`, `archived/rules/agents/`, `archived/rules/hooks/`
   - Create `ARCHIVE-README.md` with reason, date, original location, dependencies, and restoration instructions
   - Update references in `package.json`, documentation, and related files

4. **Cleanup Phase:**
   - Remove archived files from original locations
   - Clean up empty directories
   - Remove unused npm scripts
   - Update documentation to reflect archived status
   - Verify no broken references or imports

**Reference files:**
- `code-debugging-archiving.md` - Documented archiving process and structure

**For Cursor:**
- Read this file to understand the archiving logic
- NOT attempt to execute it
- Apply documented behavior reflexively when:
  - User asks to archive or debug code
  - User wants to clean up test files
  - User requests to deprecate rules
  - System maintenance is needed

**Related documentation:**
- `.dendrita/archived/INDEX.md` - Archive index and maintenance
- `.dendrita/archived/scripts/identify-test-debug-files.ts` - Script to identify archive candidates
- `.dendrita/integrations/README.md` - Integration documentation
- `.dendrita/hooks/README.md` - Hooks documentation
- `.dendrita/users/[user-id]/skills/README.md` - Skills documentation (user-specific domain knowledge)
- `.dendrita/users/[user-id]/agents/README.md` - Agents documentation (user-specific domain knowledge)

**When to Archive:**
- ✅ Test files are no longer relevant
- ✅ Scripts are superseded by newer versions
- ✅ Debug scripts are no longer needed
- ✅ Examples are outdated
- ✅ Rules conflict with new system architecture
- ❌ DO NOT archive if code is actively used or part of CI/CD

---

## Included Files (References)

- `repo-initialization.md` - Reference: Logic for initializing empty repositories
- `skill-activation-prompt.sh` - Reference: Bash wrapper for TypeScript hook
- `skill-activation-prompt.ts` - Reference: Documented skill activation logic
- `post-tool-use-tracker.sh` - Reference: Documented file tracking logic
- `dendrita-infrastructure-modification.md` - Reference: Documented infrastructure modification logic
- `dendrita-alias-activation.md` - Reference: Documented alias activation and workspace context logic
- `session-initialization-verification.md` - Reference: Documented session initialization verification and soft-initialization logic
- `journaling.md` - Reference: Documented journaling behavior and automatic extraction logic
- `code-debugging-archiving.md` - Reference: Documented code debugging and archiving process
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
   - Read .dendrita/users/[user-id]/skills/skill-rules.json
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

### How to apply dendrita-infrastructure-modification behavior:

1. **When modifying infrastructure:**
   ```markdown
   - Identify change type and affected components
   - Read relevant documentation before making changes
   - Assess impact and check dependencies
   - Follow established patterns and maintain consistency
   - Update related documentation and files
   - Verify changes and notify user of impacts
   ```

### How to apply dendrita-alias-activation behavior:

1. **When receiving a user prompt:**
   ```markdown
   - Read active user profile to get dendrita alias
   - Search for mentions of the alias in the prompt
   - Detect patterns like "mételo en mi [alias]" or "[alias], qué es esto"
   - If alias is detected, activate workspace context
   - Load information from user's workspaces and projects
   - Respond using dendrita context
   ```

### How to apply session-initialization-verification behavior:

1. **When starting a new conversation:**
   ```markdown
   - Verify if user exists and is configured
   - Verify if dendrita_alias is configured
   - Verify if enabled integrations have credentials
   - If everything is configured, show brief confirmation
   - If something is missing, show summary and offer to configure
   - Perform soft-initialization only for missing items
   - Respect user's choice to skip (don't ask again in same session)
   ```

### How to apply journaling behavior:

1. **When detecting journaling activity:**
   ```markdown
   - Detect work narratives or explicit journaling mentions
   - Create or update session entry in journaling project
   - Capture narrative without interrupting
   - Automatically extract insights (decisions, learnings, patterns, blockers)
   - Automatically extract tasks from narrative
   - Identify workspace/project context for tasks
   - Add tasks to appropriate workspace tasks.md files
   - Register insights and tasks in journaling entry and monthly files
   ```

### How to apply code-debugging-archiving behavior:

1. **When archiving or debugging code:**
   ```markdown
   - Identify test/debug files matching patterns
   - Review files for relevance and status
   - Check for deprecated or duplicate functionality
   - Create timestamped archive directory
   - Move files to .dendrita/archived/ structure
   - Create ARCHIVE-README.md with reason and restoration instructions
   - Update references in package.json and documentation
   - Remove archived files from original locations
   - Verify no broken references or imports
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
2. Has Cursor read `.dendrita/users/[user-id]/skills/skill-rules.json`?
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

**For more information:** See `.cursorrules` in project root and `.dendrita/users/[user-id]/agents/` and `.dendrita/users/[user-id]/skills/`

**IMPORTANT PARADIGM:** Agents and skills are user-specific domain knowledge stored in `.dendrita/users/[user-id]/`, not generic infrastructure. This reflects that they contain private, domain-specific knowledge (sustainability, social impact, project management) rather than generic technical infrastructure (which belongs in `.dendrita/integrations/`).
