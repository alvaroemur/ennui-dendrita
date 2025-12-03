---
name: readme
description: "Hooks for ennui-dendrita"
type: hook
created:
  2025-11-06T00:00:00.000Z
  
updated:
  2025-11-06T00:00:00.000Z
  
tags: ["hook", "behavior-reference", "readme", "documentation"]
category: behavior-reference
---

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

### new-development-init (NewDevelopmentInit)

**Behavior reference:** Logic to initialize new development projects within dendrita

**Expected behavior that Cursor should apply:**

1. When user indicates they want to start a new development project:
   - Identify workspace and project context
   - Create project structure in `workspaces/[workspace]/🚀 active-projects/[project-name]/`
   - Create base project files (README.md, master-plan.md, current-context.md, tasks.md)
   - Create detailed plan in `.cursor/plans/@[project-name].plan.md`
   - Ensure plan includes ALL necessary details:
     - Exact references to existing code (full paths)
     - Specific configuration (parameters, thresholds, models)
     - Complete AI prompts (if applicable)
     - Complete SQL schemas (if applicable)
     - Specific dependencies with versions
     - End-to-end workflow
   - Document references with exact paths
   - Create basic folder structure
   - Create initial configuration files

2. Plan validation:
   - Verify plan has exact references to existing code
   - Verify plan has specific configuration
   - Verify plan has complete schemas (if applicable)
   - Verify plan has specific dependencies
   - Verify plan has end-to-end workflow
   - Verify plan is sufficient for a new Cursor session

**Reference files:**
- `new-development-init.md` - Documented initialization logic

**For Cursor:**
- Read this file to understand the logic
- NOT attempt to execute it
- Apply documented behavior reflexively when user wants to start new development

**Related documentation:**
- `.dendrita/templates/workspace-template/` - Project templates
- `README.md` - General project structure

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
- `skill-activation-prompt.ts` - Documented TypeScript logic (executable for future orchestrators)

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

### dendrita-communication (DendritaCommunication)

**Behavior reference:** Logic to automatically log infrastructure changes as "tweets" in timeline

**Expected behavior that Cursor should apply:**

1. When detecting changes to dendrita infrastructure:
   - Detect changes in `.dendrita/hooks/` (hooks created, modified, deleted)
   - Detect changes in `.dendrita/users/[user-id]/skills/` (skills created, modified, deleted)
   - Detect changes in `.dendrita/users/[user-id]/agents/` (agents created, modified, deleted)
   - Detect changes in `.dendrita/integrations/scripts/` (scripts created, modified, deleted)

2. For each change detected:
   - Gather change information (timestamp, type, component, file path, description)
   - Generate a "tweet" entry with format: `**YYYY-MM-DD HH:mm** | [TYPE] [ACTION] [COMPONENT]`
   - Extract brief description from file content or changes
   - Include file path reference

3. Update timeline:
   - Append tweet to `.dendrita/blog/posts/dev-timeline.md`
   - Prepend new tweet at top (most recent first)
   - Maintain chronological order
   - Update last update timestamp and frontmatter `updated` field

4. Tweet format:
   - Timestamp in ISO 8601 format
   - Type badge: `[HOOK]`, `[SKILL]`, `[AGENT]`, or `[SCRIPT]`
   - Action: `created`, `modified`, or `deleted`
   - Component name and brief description
   - File path in code format

**Reference files:**
- `dendrita-communication.md` - Documented communication/logging logic

**For Cursor:**
- Read this file to understand the logic
- NOT attempt to execute it
- Apply documented behavior reflexively when detecting infrastructure changes
- Automatically log all changes as tweets in timeline

**Related documentation:**
- `.dendrita/hooks/dendrita-infrastructure-modification.md` - Infrastructure modification hook (triggers this hook)
- `.dendrita/blog/posts/dev-timeline.md` - Timeline file where tweets are logged
- `.dendrita/hooks/post-tool-use-tracker.sh` - File tracking reference (provides context)

**Integration:**
- This hook works together with `dendrita-infrastructure-modification`
- When infrastructure is modified, this hook automatically logs the change
- Creates a communication channel for dendrita to document its own evolution

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

### working-context (WorkingContext)

**Behavior reference:** Logic to automatically create and update working-context.md files for temporary work context tracking

**Expected behavior that Cursor should apply:**

1. When working-context behavior is activated:
   - User explicitly requests creating or updating `working-context.md`
   - User mentions "working context" or "resumen temporal"
   - Working in `_temp/` directory with multiple related files
   - Starting a new work session with multiple tasks

2. When creating or updating working-context.md:
   - Identify context location (default: `_temp/working-context.md`)
   - Gather information about current work (active files, work areas, tasks, objectives)
   - Create or update file with template structure
   - Include sections: Trabajo Actual, Objetivos, Estructura de Archivos, Flujo de Trabajo, Notas, Próximos Pasos

3. During work session:
   - Update when significant changes occur
   - Keep updates non-intrusive
   - Maintain accuracy by removing completed work and updating status

**Reference files:**
- `working-context.md` - Documented working context behavior logic

**For Cursor:**
- Read this file to understand the logic
- NOT attempt to execute it
- Apply documented behavior reflexively when working with temporary context files

**Related documentation:**
- `.dendrita/hooks/dendritify.md` - Dendritification process (may trigger working-context)
- `.dendrita/hooks/post-tool-use-tracker.sh` - File tracking reference
- `.dendrita/integrations/scripts/update-working-context.ts` - Script for automatic updates

**Difference from other hooks:**
- This hook focuses on maintaining temporary work context
- Updates proactively during work sessions
- Tracks work areas, objectives, and file structure
- Emphasizes temporal nature of working context

---

### dendritify (Dendritify)

**Behavior reference:** Logic to convert components into dendrita system components following dendrita patterns and conventions

**Expected behavior that Cursor must apply:**

1. When dendritify behavior is activated:
   - User explicitly requests "dendritify" something
   - User mentions "convertir en hook/agent/skill"
   - User wants to make something "parte del sistema dendrita"
   - User requests to "estructurar como dendrita"

2. When dendritifying:
   - Identify what to dendritify (script, process, workflow, concept)
   - Determine component type (hook, agent, skill, script, integration)
   - Analyze current state (read files, review patterns, identify requirements)
   - Plan conversion (structure, dependencies, documentation, naming)
   - Execute conversion (create structure, convert content, update related files)
   - Verify and clean up (check structure, update working context, clean temporary files)

3. Component-specific conversion:
   - **Hook:** Create `.dendrita/hooks/[hook-name].md` following hook structure
   - **Agent:** Create `.dendrita/users/[user-id]/agents/[rol]-[área].md` with YAML frontmatter
   - **Skill:** Create `.dendrita/users/[user-id]/skills/[skill-name]/SKILL.md` and update skill-rules.json
   - **Script:** Create `.dendrita/integrations/scripts/[script-name].ts` with proper structure

**Reference files:**
- `dendritify.md` - Documented dendritification process logic

**For Cursor:**
- Read this file to understand the logic
- NOT attempt to execute it
- Apply documented behavior reflexively when user requests to dendritify something

**Related documentation:**
- `.dendrita/users/[user-id]/config-estilo.json` - Naming conventions and style rules (user-specific)
- `.dendrita/hooks/working-context.md` - Working context hook
- `.dendrita/hooks/dendrita-infrastructure-modification.md` - Infrastructure modification hook
- `.dendrita/users/[user-id]/agents/README.md` - Agent structure
- `.dendrita/users/[user-id]/skills/README.md` - Skill structure

**Difference from other hooks:**
- This hook is a meta-hook that guides the conversion process
- Follows systematic process: analyze → plan → execute → verify
- Ensures components follow dendrita patterns and conventions
- Updates all related files (README, skill-rules.json, etc.)

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
   - Move files to `.archived/` structure:
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
- `.dendrita/integrations/scripts/utils/archive-tools/identify-test-debug-files.ts` - Script to identify archive candidates
- `.dendrita/hooks/code-debugging-archiving.md` - Archive process documentation
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

### list-system-components (ListSystemComponents)

**Behavior reference:** Logic to list all system components: hooks, agents, skills (verbal layer) and scripts (logical layer)

**Expected behavior that Cursor should apply:**

1. **Activation Phase:**
   - User explicitly requests "listar el sistema"
   - User asks "qué hooks/agents/skills/scripts hay"
   - User mentions "sistema de hooks, agentes y skills"
   - User requests "mostrar componentes del sistema"
   - User wants to see "la capa verbal y la capa lógica"

2. **Listing Process:**
   - **Identify active user:** Read `.dendrita/users/` to identify available users
   - **List Hooks (Verbal Layer):** Read `.dendrita/hooks/` and list all `.md` files (excluding README.md and config files)
   - **List Agents (Verbal Layer):** For each user, read `.dendrita/users/[user-id]/agents/` and list all `.md` files (excluding README.md)
   - **List Skills (Verbal Layer):** For each user, read `skill-rules.json` and list all skills with their descriptions
   - **List Scripts (Logical Layer):** Read `.dendrita/integrations/scripts/` and list all executable files (`.ts`, `.js`, `.py`, `.sh`)

3. **Output Format:**
   - Organize by layer: Verbal (hooks, agents, skills) vs Logical (scripts)
   - Group by category when possible (initialization, activation, tracking, etc.)
   - Group agents and skills by user
   - Provide summary with counts

**Reference files:**
- `list-system-components.md` - Documented system listing logic

**For Cursor:**
- Read this file to understand the listing logic
- NOT attempt to execute it
- Apply documented behavior reflexively when user requests to list the system

**Related documentation:**
- `.dendrita/hooks/README.md` - Hooks documentation
- `.dendrita/users/[user-id]/agents/README.md` - Agents documentation (user-specific domain knowledge)
- `.dendrita/users/[user-id]/skills/README.md` - Skills documentation (user-specific domain knowledge)
- `.dendrita/integrations/README.md` - Integrations documentation

**Difference from other hooks:**
- This hook is query-only: Only lists components, doesn't modify anything
- No automatic activation: Only executes when user explicitly requests it
- Informative: Provides complete system view for reference

---

### dendrita-openup (DendritaOpenup)

**Behavior reference:** Logic to reveal hidden insights, patterns, and non-obvious connections in the dendrita system

**Expected behavior that Cursor should apply:**

1. **Activation Phase (MANDATORY when triggered):**
   - User says "dendrita openup" or "openup"
   - User says "destápate" or "dendrita destápate"
   - User requests "muéstrame insights ocultos"
   - User asks "qué conexiones hay que no veo"
   - User mentions "revela patrones" or "muéstrame lo que no es obvio"
   - User requests "análisis profundo" or "insights ocultos"
   - User asks "qué me estoy perdiendo" or "qué debería saber"
   - **CRITICAL:** This hook MUST be executed IMMEDIATELY when ANY trigger is detected. DO NOT skip it.

2. **Revelation Process:**
   - **Analyze patterns:** Identify projects without recent updates, unused skills/agents, scripts with issues
   - **Identify connections:** Find relationships between projects, stakeholders, workspaces, components
   - **Generate insights:** Create insights about system, projects, stakeholders
   - **Reveal hidden information:** Uncover non-obvious information, temporal patterns, opportunities

3. **Output Format:**
   - Organize by category: Hidden Insights, Connections, Areas of Attention, Opportunities
   - Provide actionable recommendations
   - Prioritize by impact and urgency

**Reference files:**
- `dendrita-openup.md` - Documented revelation logic

**For Cursor:**
- Read this file to understand the revelation logic
- NOT attempt to execute it
- Apply documented behavior reflexively when user requests dendrita to "open up"

**Related documentation:**
- `.dendrita/hooks/list-system-components.md` - System components listing
- `.dendrita/hooks/working-context.md` - Working context

**Difference from other hooks:**
- This hook is revelation-focused: Reveals hidden information, not just lists
- Generates insights: Creates new perspectives on the system
- Identifies connections: Finds non-obvious relationships
- Provides recommendations: Suggests actions based on analysis

---

### dendrita-memory (DendritaMemory)

**Behavior reference:** Logic to retrieve historical information and past context from the dendrita system

**Expected behavior that Cursor should apply:**

1. **Activation Phase:**
   - User says "dendrita memoria" or "muéstrame la memoria"
   - User asks "qué decidimos antes sobre X"
   - User requests "historial de decisiones"
   - User mentions "contexto pasado" or "información histórica"

2. **Recovery Process:**
   - **Identify context:** Determine what historical information is requested
   - **Search historical information:** Look in historical files, clippings, journaling
   - **Reconstruct context:** Rebuild historical context, identify key points, show evolution
   - **Present memory:** Organize historical information, provide context, highlight relevant information

3. **Output Format:**
   - Organize by chronology, theme, project, or type
   - Provide context with dates and states
   - Highlight important information
   - Show lessons learned and patterns

**Reference files:**
- `dendrita-memory.md` - Documented memory recovery logic

**For Cursor:**
- Read this file to understand the memory recovery logic
- NOT attempt to execute it
- Apply documented behavior reflexively when user requests memory

**Related documentation:**
- `.dendrita/hooks/journaling.md` - Historical narrative capture
- `.dendrita/hooks/working-context.md` - Current working context

**Difference from other hooks:**
- This hook is historical recovery: Accesses past information
- Reconstructs context: Shows how the system was before
- Shows evolution: Presents changes over time
- Provides perspective: Helps understand present from past

---

### dendrita-connections (DendritaConnections)

**Behavior reference:** Logic to identify and visualize connections between dendrita system components

**Expected behavior that Cursor should apply:**

1. **Activation Phase:**
   - User says "dendrita conexiones" or "muéstrame las conexiones"
   - User asks "qué proyectos están relacionados"
   - User requests "red de stakeholders" or "mapa de conexiones"
   - User mentions "dependencias" or "relaciones entre componentes"

2. **Connection Identification Process:**
   - **Identify connection type:** Determine what type of connections are requested
   - **Analyze connections:** Analyze connections between projects, stakeholders, workspaces, components
   - **Visualize connections:** Create connection map, organize by type, highlight important connections
   - **Network analysis:** Identify central nodes, clusters, gaps

3. **Output Format:**
   - Organize by connection type: Direct, Indirect, Potential
   - Show central nodes and clusters
   - Identify opportunities and gaps
   - Provide network perspective

**Reference files:**
- `dendrita-connections.md` - Documented connection visualization logic

**For Cursor:**
- Read this file to understand the connection logic
- NOT attempt to execute it
- Apply documented behavior reflexively when user requests connections

**Related documentation:**
- `.dendrita/hooks/dendrita-openup.md` - Hidden insights revelation
- `.dendrita/hooks/list-system-components.md` - System components listing

**Difference from other hooks:**
- This hook is network visualization: Shows system as interconnected network
- Identifies relationships: Finds connections between components
- Shows dependencies: Visualizes dependencies and synergies
- Provides network perspective: Helps understand system as a whole

---

### dendrita-suggestion (DendritaSuggestion)

**Behavior reference:** Logic to generate intelligent suggestions based on dendrita system context

**Expected behavior that Cursor should apply:**

1. **Activation Phase:**
   - User says "dendrita sugerencia" or "qué me sugieres"
   - User asks "qué debería hacer ahora"
   - User requests "recomendaciones" or "sugerencias"
   - User mentions "próximos pasos" or "qué sigue"

2. **Suggestion Generation Process:**
   - **Analyze current context:** Analyze current system state, recent work, patterns
   - **Identify opportunities:** Find improvement opportunities, growth opportunities, optimization opportunities
   - **Generate suggestions:** Generate suggestions by category, prioritize by impact and urgency
   - **Present suggestions:** Organize suggestions, provide details, make actionable

3. **Output Format:**
   - Organize by priority: Urgent, Important, Optional
   - Provide context: Reason, impact, effort, next steps
   - Make actionable: Specific suggestions with concrete steps
   - Prioritize by impact and urgency

**Reference files:**
- `dendrita-suggestion.md` - Documented suggestion generation logic

**For Cursor:**
- Read this file to understand the suggestion logic
- NOT attempt to execute it
- Apply documented behavior reflexively when user requests suggestions

**Related documentation:**
- `.dendrita/hooks/dendrita-openup.md` - Hidden insights revelation
- `.dendrita/hooks/working-context.md` - Current working context

**Difference from other hooks:**
- This hook is proactive: Generates suggestions without explicit user request
- Context-based: Analyzes current state to propose actions
- Prioritized: Organizes suggestions by impact and urgency
- Actionable: Provides concrete steps for each suggestion

---

### dendrita-work-status (DendritaWorkStatus)

**Behavior reference:** Logic to generate consolidated work status reports from all project contexts

**Expected behavior that Cursor should apply:**

1. **Activation Phase:**
   - User asks "muéstrame todas las tareas pendientes" or "show me all pending tasks"
   - User requests "estado de todos los proyectos" or "status of all projects"
   - User asks "qué tareas tengo pendientes" or "what tasks do I have pending"
   - User requests "reporte de trabajo" or "work report"
   - User asks "resumen de proyectos" or "projects summary"

2. **Report Generation Process:**
   - **Execute script:** Run `generate-work-status-report.ts` to consolidate all project contexts
   - **Read report:** Load generated report from `.dendrita/dashboards/work-status-report.md`
   - **Present information:** Show summary, projects by workspace, and all tasks organized by status
   - **Update contexts if needed:** Check if project contexts are outdated and update before generating report

3. **Output Format:**
   - Summary: Total projects, tasks by status
   - By Workspace: Projects organized by workspace with status and task counts
   - All Pending Tasks: Complete list organized by workspace and project
   - All In Progress Tasks: Complete list organized by workspace and project
   - All Blocked Tasks: Complete list organized by workspace and project

**Reference files:**
- `dendrita-work-status.md` - Documented work status report generation logic

**For Cursor:**
- Read this file to understand the work status logic
- Execute the report generation script when user requests work status
- Present the consolidated information in a clear, organized format

**Related documentation:**
- `.dendrita/integrations/scripts/pipelines/context-pipeline/generate-work-status-report.ts` - Report generation script
- `.dendrita/integrations/scripts/pipelines/context-pipeline/update-project-context.ts` - Project context update script
- `.dendrita/hooks/dendrita-openup.md` - Related hook for insights
- `.dendrita/hooks/dendrita-suggestion.md` - Related hook for suggestions

**Difference from other hooks:**
- This hook is automatic: Uses existing `project_context.json` files to generate reports
- Consolidates information: Aggregates data from all projects automatically
- No manual entry: All information comes from existing project contexts
- Can be filtered: Supports workspace filtering for focused reports

---

### content-management (ContentManagement)

**Behavior reference:** Logic to create and manage content across multiple channels (blog, Reddit, LinkedIn, GitHub, etc.), including clippings creation, draft management, publication workflow, and tracking of published content.

**Expected behavior that Cursor should apply:**

1. **Content Flow:**
   - Clippings → Drafts → Published → Tracking
   - Support multiple channels: blog, reddit, linkedin, github, etc.
   - Support multiple subchannels per channel (e.g., blog: dendrita, iami)

2. **Clipping Creation:**
   - Save clippings in project's content structure: `comms/content/clippings/[channel]/[YYYY-MM]/`
   - Filename format: `YYYY-MM-DD-HHmm-[descripcion]-clipping.md`
   - Include `channel` and `subchannel` in frontmatter

3. **Draft Creation:**
   - Save drafts in `comms/content/drafts/[channel]/[subchannel]/[slug].md`
   - **CRITICAL:** Drafts NEVER have date in filename
   - Include `created` and `updated` in frontmatter
   - Date in filename is added ONLY when publishing

4. **Publication:**
   - Validate draft according to channel-specific rules
   - Migrate draft to published location with channel-specific format
   - Blog: `YYYY-MM-DD-[slug].md` (date from `created` or publication date)
   - Reddit/LinkedIn/GitHub: `[slug].md` (no date, uses platform ID)
   - Update `published/tracking.json` with slug/URL and metrics

5. **Tracking:**
   - Maintain centralized registry in `published/tracking.json`
   - Include: channel, subchannel, title, slug, URL, published_at, metrics
   - Update metrics when available (score, comments, views, etc.)

**Reference files:**
- `content-management.md` - Documented content management logic

**For Cursor:**
- Read this file to understand content management workflow
- Apply documented behavior when user requests clipping creation, draft creation, or publication
- **CRITICAL:** Never add date to draft filenames; only add when publishing
- Always update tracking.json when publishing content

**Related documentation:**
- `.dendrita/blog/README.md` - Blog structure (for blog channel)
- `.dendrita/WORKSPACE-STRUCTURE.md` - Workspace standards
- `workspaces/[workspace]/🚀 active-projects/[project]/comms/config/channels.json` - Channel definitions

**Difference from old hooks:**
- Replaces `blog-clipping-creation.md` and `blog-publication.md`
- Generalizes to support multiple channels (not just blog)
- Adds tracking system for all published content
- Separates drafts (no date) from published (date when published)

---

### date-handling-guidelines (DateHandlingGuidelines)

**Behavior reference:** Guidelines for correctly handling dates in dendrita documents and scripts

**Expected behavior that Cursor should apply:**

1. **CRITICAL: Always verify current date before writing:**
   - In agent mode: Execute `date +"%Y-%m-%d"` to get current date in ISO format
   - In agent mode: Execute `date +"%d de %B de %Y"` and translate month to Spanish for Spanish format
   - In ask mode: Ask user for current date if date is critical, or use placeholder `[FECHA]` if not critical
   - **Never assume dates** - always verify from system or user

2. **Use correct format for context:**
   - ISO format (`YYYY-MM-DD`) for technical documents, JSON, frontmatter
   - Spanish format (`DD de mes de AAAA`) for human-readable documents
   - ISO with time (`YYYY-MM-DD HH:mm`) for timelines

3. **Use utility functions when available:**
   - Import from `utils/common.ts`: `getCurrentDateISO()`, `formatDateSpanish()`, `formatDateISO()`
   - Use utilities in scripts to ensure consistency

4. **Verify dates make sense:**
   - Check if date is in the future (shouldn't be)
   - Check if date is too far in the past (might be wrong)
   - Compare with dates in related documents

**Reference files:**
- `date-handling-guidelines.md` - Documented date handling guidelines

**For Cursor:**
- Read this file to understand date handling requirements
- Always verify current date before writing dates in documents
- Use appropriate format for context
- Never assume dates without verification

**Related documentation:**
- `.dendrita/integrations/scripts/pipelines/context-pipeline/utils/common.ts` - Date utility functions
- `.dendrita/hooks/project-wrap-up.md` - Wrap-up process (uses dates)
- `.dendrita/hooks/work-timeline.md` - Timeline format (uses dates with time)

---

## Included Files (References)

- `repo-initialization.md` - Reference: Logic for initializing empty repositories
- `skill-activation-prompt.ts` - Reference: Documented skill activation logic (executable for future orchestrators)
- `post-tool-use-tracker.sh` - Reference: Documented file tracking logic
- `dendrita-infrastructure-modification.md` - Reference: Documented infrastructure modification logic
- `dendrita-alias-activation.md` - Reference: Documented alias activation and workspace context logic
- `session-initialization-verification.md` - Reference: Documented session initialization verification and soft-initialization logic
- `journaling.md` - Reference: Documented journaling behavior and automatic extraction logic
- `code-debugging-archiving.md` - Reference: Documented code debugging and archiving process
- `list-system-components.md` - Reference: Documented system listing logic
- `dendrita-openup.md` - Reference: Documented revelation logic for hidden insights
- `dendrita-memory.md` - Reference: Documented memory recovery logic
- `dendrita-connections.md` - Reference: Documented connection visualization logic
- `dendrita-suggestion.md` - Reference: Documented suggestion generation logic
- `dendrita-work-status.md` - Reference: Documented work status report generation logic
- `date-handling-guidelines.md` - Reference: Documented date handling guidelines and best practices
- `content-management.md` - Reference: Documented content management logic (replaces blog-clipping-creation and blog-publication)

**NOTE:** These files are references. Cursor should read them to understand expected behavior, but they are NOT executed.

---

## Customization for ennui-dendrita

Hooks are adapted to recognize:
- Project structure (`active-projects/`, `_archived-projects/`)
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

### How to apply working-context behavior:

1. **When working with temporary context:**
   ```markdown
   - Identify context location (default: _temp/working-context.md)
   - Gather information about current work (active files, work areas, tasks, objectives)
   - Create or update file with template structure
   - Include sections: Trabajo Actual, Objetivos, Estructura de Archivos, Flujo de Trabajo, Notas, Próximos Pasos
   - Update when significant changes occur during work session
   - Keep updates non-intrusive and maintain accuracy
   ```

### How to apply dendritify behavior:

1. **When user requests to dendritify something:**
   ```markdown
   - Identify what to dendritify (script, process, workflow, concept)
   - Determine component type (hook, agent, skill, script, integration)
   - Analyze current state (read files, review patterns, identify requirements)
   - Plan conversion (structure, dependencies, documentation, naming)
   - Execute conversion (create structure, convert content, update related files)
   - Verify and clean up (check structure, update working context, clean temporary files)
   - Follow component-specific conversion patterns (hook, agent, skill, script)
   - Update all related files (README, skill-rules.json, etc.)
   ```

### How to apply code-debugging-archiving behavior:

1. **When archiving or debugging code:**
   ```markdown
   - Identify test/debug files matching patterns
   - Review files for relevance and status
   - Check for deprecated or duplicate functionality
   - Create timestamped archive directory
   - Move files to .archived/ structure
   - Create ARCHIVE-README.md with reason and restoration instructions
   - Update references in package.json and documentation
   - Remove archived files from original locations
   - Verify no broken references or imports
   ```

### How to apply list-system-components behavior:

1. **When user requests to list the system:**
   ```markdown
   - Identify active user from .dendrita/users/
   - List all hooks from .dendrita/hooks/ (excluding README.md and config files)
   - List all agents from .dendrita/users/[user-id]/agents/ (grouped by user)
   - List all skills from .dendrita/users/[user-id]/skills/ (grouped by user)
   - List all scripts from .dendrita/integrations/scripts/ (executable files only)
   - Organize by layer: Verbal (hooks, agents, skills) vs Logical (scripts)
   - Group by category when possible
   - Provide summary with counts
   ```

### How to apply dendrita-openup behavior:

1. **When user requests dendrita to "open up":**
   ```markdown
   - Analyze projects to identify patterns
   - Identify connections between components
   - Generate insights about the system
   - Reveal hidden information
   - Provide actionable recommendations
   - Present in structured format
   ```

### How to apply dendrita-memory behavior:

1. **When user requests memory:**
   ```markdown
   - Identify what historical information is requested
   - Search historical files, clippings, journaling
   - Reconstruct historical context
   - Present past decisions with dates and reasons
   - Show evolution of projects/components
   - Highlight lessons learned
   ```

### How to apply dendrita-connections behavior:

1. **When user requests connections:**
   ```markdown
   - Identify type of connections requested
   - Analyze connections between projects, stakeholders, workspaces, components
   - Create connection map
   - Identify central nodes and clusters
   - Show opportunities and gaps
   - Provide network perspective
   ```

### How to apply dendrita-suggestion behavior:

1. **When user requests suggestions:**
   ```markdown
   - Analyze current context of the system
   - Identify improvement opportunities
   - Generate prioritized suggestions
   - Provide reasons and context
   - Include concrete next steps
   - Present in structured format
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
2. Review `.cursorrules` in root for instructions

---

## Important Note

**These hooks are behavior references, NOT executable code.**

- Cursor must READ these files
- Cursor must APPLY documented behavior
- Cursor must NOT EXECUTE these scripts

---

**For more information:** See `.cursorrules` in project root and `.dendrita/users/[user-id]/agents/` and `.dendrita/users/[user-id]/skills/`

**IMPORTANT PARADIGM:** Agents and skills are user-specific domain knowledge stored in `.dendrita/users/[user-id]/`, not generic infrastructure. This reflects that they contain private, domain-specific knowledge (sustainability, social impact, project management) rather than generic technical infrastructure (which belongs in `.dendrita/integrations/`).

---

## Backlinks

**2025-11-06 19:09** | [System Behavior](../docs/SYSTEM-BEHAVIOR.md)

Documento que muestra la jerarquía y relaciones entre hooks, agentes, skills y scripts. Menciona este README en la sección "Ver también".

---
