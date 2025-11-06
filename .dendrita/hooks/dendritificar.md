---
name: dendritificar
description: "Dendritificar Hook"
type: hook
created: 2025-11-06
updated: 2025-11-06
tags: ["hook", "behavior-reference"]
category: behavior-reference
---

# Dendritificar Hook

Behavior reference for Cursor - process of converting components into dendrita system components.

---

## What is this Hook?

This hook documents the expected behavior that Cursor must apply when the user requests to "dendritificar" something (convert it into a dendrita system component).

**Purpose:** Guide Cursor through the systematic process of converting ad-hoc work, scripts, or processes into properly structured dendrita components (hooks, agents, skills, scripts, integrations).

**"Dendritificar" means:** To convert something into a dendrita system component, following dendrita patterns, structure, and conventions.

---

## Expected Behavior

### 1. Activation of the Hook

Cursor must activate dendritificar behavior when:

- ✅ User explicitly requests "dendritificar" something
- ✅ User mentions "convertir en hook/agent/skill"
- ✅ User wants to make something "parte del sistema dendrita"
- ✅ User requests to "estructurar como dendrita"
- ✅ Working with temporary files that should become permanent dendrita components

**Activation condition:**

```markdown
IF (user mentions "dendritificar") OR 
   (user mentions "convertir en hook/agent/skill") OR
   (user wants to make something "parte del sistema dendrita") OR
   (user requests "estructurar como dendrita")
THEN activate dendritificar behavior
```

### 2. Dendritificar Process

When dendritificar behavior is activated, Cursor must:

#### Step 1: Identify What to Dendritificar

1. **Identify the target:**
   - What is the user trying to dendritificar?
   - Is it a script, process, workflow, or concept?
   - What files or components are involved?

2. **Determine component type:**
   - **Hook:** Behavior reference for Cursor
   - **Agent:** Specialized agent for complex tasks
   - **Skill:** Contextual knowledge for specific work types
   - **Script:** Executable script in `.dendrita/integrations/scripts/`
   - **Integration:** New integration service
   - **Other:** Document, template, or configuration

3. **Ask for clarification if needed:**
   - What type of component should this become?
   - What is the purpose of this component?
   - Where should it live in the dendrita structure?

#### Step 2: Analyze Current State

Before converting, Cursor must:

1. **Read current files:**
   - Read all files related to what's being dendritificado
   - Understand current structure and purpose
   - Identify dependencies and relationships

2. **Review dendrita patterns:**
   - Read relevant examples from `.dendrita/`
   - Review naming conventions from `.dendrita/config-estilo.json`
   - Check structure patterns from existing components

3. **Identify requirements:**
   - What functionality should the component have?
   - What dependencies does it need?
   - What documentation is required?

#### Step 3: Plan the Conversion

Cursor must create a conversion plan:

1. **Determine structure:**
   - Where should the component live?
   - What files need to be created?
   - What existing files need to be updated?

2. **Identify dependencies:**
   - Which other components does this depend on?
   - Which components depend on this?
   - What integrations are needed?

3. **Plan documentation:**
   - What README files need updates?
   - What documentation needs to be created?
   - What examples or templates are needed?

4. **Check naming conventions:**
   - Verify name follows `.dendrita/config-estilo.json` conventions
   - Ensure YAML frontmatter matches filename (for agents)
   - Confirm skill structure follows patterns

#### Step 4: Execute the Conversion

When converting:

1. **Create component structure:**
   - Create files in appropriate locations
   - Follow dendrita naming conventions
   - Use existing components as templates

2. **Convert content:**
   - Adapt content to dendrita format
   - Add required metadata (YAML frontmatter for agents)
   - Include proper documentation

3. **Update related files:**
   - Update `skill-rules.json` if creating a skill
   - Update `agents/README.md` if creating an agent
   - Update `hooks/README.md` if creating a hook
   - Update `.cursorrules` if needed

4. **Create documentation:**
   - Add component to relevant README
   - Document purpose and usage
   - Provide examples if needed

#### Step 5: Verify Security

**CRITICAL:** Before completing dendritificar, Cursor must verify that the component does not expose user or workspace data:

1. **Execute security check:**
   - Run `.dendrita/integrations/scripts/check-dendrita-security.ts` on the new component
   - Verify that no user IDs (except "example-user") are exposed
   - Verify that no workspace names (except "template") are exposed
   - Verify that no hardcoded paths to user/workspace files exist
   - Verify that no credentials or sensitive data are present

2. **Fix security issues:**
   - If issues are found, fix them before completing dendritificar
   - Replace hardcoded user IDs with placeholders like `[user-id]`
   - Replace hardcoded workspace names with placeholders like `[workspace]`
   - Replace hardcoded paths with generic references or variables
   - Remove any credentials or sensitive data

3. **Re-verify after fixes:**
   - Run security check again to confirm all issues are resolved
   - Only proceed if security check passes

**Security check command:**
```bash
ts-node .dendrita/integrations/scripts/check-dendrita-security.ts [path-to-component] --strict
```

#### Step 6: Verify and Clean Up

After conversion:

1. **Verify structure:**
   - Check naming conventions are followed
   - Verify file structure matches patterns
   - Confirm dependencies are correct

2. **Update working context:**
   - Update `_temp/working-context.md` with conversion
   - Document what was dendritificado
   - Note any follow-up actions needed

3. **Clean up temporary files:**
   - Move or remove temporary files if appropriate
   - Archive original files if needed
   - Update references to new location

---

## Component-Specific Conversion

### Converting to a Hook

When converting to a hook:

1. **Create hook file:**
   ```
   .dendrita/hooks/[hook-name].md
   ```

2. **Follow hook structure:**
   - Title and description
   - Expected behavior section
   - Activation conditions
   - Process steps
   - Integration with other hooks
   - Notes for Cursor

3. **Update hooks/README.md:**
   - Add hook to available hooks list
   - Document purpose and behavior

4. **Follow naming:**
   - Use kebab-case
   - Be descriptive but concise
   - Follow pattern: `[action]-[object].md`

### Converting to an Agent

When converting to an agent:

1. **Create agent file:**
   ```
   .dendrita/users/[user-id]/agents/[rol]-[área].md
   ```

2. **Follow agent structure:**
   - YAML frontmatter with `name` matching filename
   - Description in English
   - Purpose and instructions
   - Principles and guidelines

3. **Update agents/README.md:**
   - Add agent to available agents list
   - Document purpose and use cases

4. **Follow naming:**
   - Format: `[rol]-[área].md`
   - Use Spanish for role and area
   - All lowercase, hyphens as separators

### Converting to a Skill

When converting to a skill:

1. **Create skill structure:**
   ```
   .dendrita/users/[user-id]/skills/[skill-name]/
   ├── SKILL.md
   └── [other files if needed]
   ```

2. **Update skill-rules.json:**
   - Add skill entry with keywords
   - Add intentPatterns
   - Add fileTriggers

3. **Update skills/README.md:**
   - Add skill to available skills list
   - Document purpose and coverage

4. **Follow naming:**
   - Use kebab-case
   - Use Spanish
   - Be descriptive

### Converting to a Script

When converting to a script:

1. **Create script file:**
   ```
   .dendrita/integrations/scripts/[script-name].ts
   ```

2. **Follow script structure:**
   - TypeScript with proper types
   - Error handling
   - Documentation comments
   - Usage examples

3. **Update integrations/README.md:**
   - Add script to available scripts
   - Document purpose and usage

4. **Follow naming:**
   - Use kebab-case
   - Be descriptive
   - Use `.ts` extension

---

## Integration with Other Hooks

This hook integrates with:

1. **working-context:**
   - Update working context when dendritificando
   - Track conversion process in working context

2. **dendrita-infrastructure-modification:**
   - Dendritificar is a type of infrastructure modification
   - Follow infrastructure modification guidelines
   - Assess impact before converting

3. **post-tool-use-tracker:**
   - Track files being converted
   - Identify context of conversion

---

## Validation Checklist

Before completing dendritificar, verify:

- ✅ **Security check passed** (CRITICAL - no user/workspace data exposed)
- ✅ Component follows naming conventions
- ✅ Component structure matches dendrita patterns
- ✅ Documentation is complete
- ✅ Related files are updated (README, skill-rules.json, etc.)
- ✅ Dependencies are documented
- ✅ Examples or templates are provided if needed
- ✅ Working context is updated
- ✅ Temporary files are cleaned up

---

## Error Handling

### Unclear Target

If it's unclear what to dendritificar:

1. **Ask user for clarification:**
   - What exactly should be dendritificado?
   - What type of component should it become?
   - What is the purpose?

2. **Analyze available context:**
   - Current files in editor
   - Recent file edits
   - User's previous requests

### Invalid Structure

If conversion doesn't follow dendrita patterns:

1. **Review patterns:**
   - Read `.dendrita/config-estilo.json`
   - Check existing examples
   - Review structure requirements

2. **Fix structure:**
   - Adjust naming
   - Fix file organization
   - Update content format

### Missing Dependencies

If dependencies are missing:

1. **Identify missing components:**
   - List required dependencies
   - Check if they exist

2. **Create or reference:**
   - Create missing dependencies first
   - Or update references to existing components

---

## Notes for Cursor

1. **Always review patterns first:**
   - Read `.dendrita/config-estilo.json` for naming
   - Review existing components as examples
   - Check structure requirements

2. **Ask for clarification:**
   - If unclear what to convert
   - If unclear what type of component
   - If unclear where it should live

3. **Follow systematic process:**
   - Analyze current state
   - Plan conversion
   - Execute conversion
   - Verify and clean up

4. **Update all related files:**
   - README files
   - Configuration files
   - Working context

5. **Maintain consistency:**
   - Follow dendrita patterns strictly
   - Use existing components as templates
   - Keep naming consistent

---

## References

- `.dendrita/config-estilo.json` - Naming conventions and style rules
- `.dendrita/hooks/working-context.md` - Working context hook
- `.dendrita/hooks/dendrita-infrastructure-modification.md` - Infrastructure modification hook
- `.dendrita/users/[user-id]/agents/README.md` - Agent structure
- `.dendrita/users/[user-id]/skills/README.md` - Skill structure
- `.dendrita/hooks/README.md` - Hook structure
- `.dendrita/integrations/scripts/check-dendrita-security.ts` - Security verification script
- `.dendrita/DESIGN-PARADIGM.md` - Security principles and data exclusion rules

---

**For Cursor:** This hook is a behavior reference. You must read this file and apply the documented logic when the user requests to "dendritificar" something. Follow the systematic process to convert components into proper dendrita system components.

