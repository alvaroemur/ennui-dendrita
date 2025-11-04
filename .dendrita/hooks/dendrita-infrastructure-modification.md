# Dendrita Infrastructure Modification Hook

Behavior reference for Cursor - modifications to dendrita infrastructure.

---

## What is this Hook?

This hook documents the expected behavior that Cursor must apply when detecting modifications to the dendrita infrastructure (`.dendrita/` folder).

**Purpose:** Guide Cursor to properly handle infrastructure changes, ensuring consistency, compatibility, and documentation updates.

---

## Expected Behavior

### 1. Detection of Infrastructure Modifications

Cursor must detect infrastructure modifications when:

- ✅ Files in `.dendrita/` are being edited (skills/, agents/, hooks/, integrations/, etc.)
- ✅ User explicitly mentions modifying dendrita infrastructure
- ✅ User mentions adding new skills, agents, or integrations
- ✅ User mentions changing workspace structure or standards
- ✅ User mentions modifying `.cursorrules` or `.dendrita/settings.json`

**Activation condition:**

```markdown
IF (editing .dendrita/**/*) OR (user mentions "modify dendrita") OR (user mentions "add skill/agent") OR (user mentions "change infrastructure")
THEN activate infrastructure modification behavior
```

### 2. Infrastructure Modification Process

When infrastructure modification is detected, Cursor must:

#### Step 1: Identify Change Type and Scope

```markdown
Identify what is being modified:
- Skills (.dendrita/users/[user-id]/skills/) - User-specific domain knowledge
- Agents (.dendrita/users/[user-id]/agents/) - User-specific domain knowledge
- Hooks (.dendrita/hooks/)
- Integrations (.dendrita/integrations/)
- Workspace structure (.dendrita/WORKSPACE-STRUCTURE.md)
- Settings (.dendrita/settings.json)
- User system (.dendrita/users/)
- Other infrastructure components
```

#### Step 2: Impact Assessment

Before making changes, Cursor must:

1. **Identify affected components:**
   - Which skills reference this change?
   - Which agents depend on this modification?
   - Which hooks need updates?
   - Which integrations are affected?
   - Which workspace projects might be impacted?

2. **Check for dependencies:**
   - Read `.dendrita/users/[user-id]/skills/skill-rules.json` to understand skill relationships
   - Review `.dendrita/hooks/README.md` to understand hook dependencies
   - Check `.dendrita/users/[user-id]/agents/README.md` for agent relationships
   - Review `.dendrita/integrations/README.md` for integration dependencies

3. **Assess compatibility:**
   - Will this break existing projects?
   - Will this affect existing workspaces?
   - Will this require updates to `.cursorrules`?
   - Will this require documentation updates?

#### Step 3: Review Before Modification

```markdown
Before making changes, Cursor must:

1. READ relevant documentation:
   - `.dendrita/hooks/README.md` for hook behavior
   - `.dendrita/users/[user-id]/skills/README.md` for skill structure
   - `.dendrita/users/[user-id]/agents/README.md` for agent structure
   - `.dendrita/WORKSPACE-STRUCTURE.md` for workspace standards
   - `.cursorrules` for project rules

2. Identify all files that need updates:
   - Direct modifications
   - Related documentation
   - Dependent configurations
   - Example files or templates

3. Warn user about potential impacts:
   - List affected components
   - Identify breaking changes
   - Suggest migration steps if needed
```

#### Step 4: Make Changes Systematically

When making changes:

1. **Follow established patterns:**
   - Use existing files as templates
   - Maintain consistency with current structure
   - Follow naming conventions
   - Follow file organization patterns

2. **Update related files:**
   - Update README files in relevant directories
   - Update `.dendrita/hooks/README.md` if adding/modifying hooks
   - Update `.dendrita/users/[user-id]/skills/README.md` if adding/modifying skills
   - Update `.dendrita/users/[user-id]/agents/README.md` if adding/modifying agents
   - Update `.cursorrules` if changing behavior rules
   - Update `.dendrita/ESTADO.md` if changing system status

3. **Maintain backward compatibility:**
   - If breaking changes are necessary, document them clearly
   - Provide migration guidance
   - Update examples and templates

#### Step 5: Verification and Documentation

After making changes:

1. **Verify consistency:**
   - Check that new files follow the same structure as existing ones
   - Verify that dependencies are correctly referenced
   - Ensure that naming conventions are followed
   - Confirm that all related files are updated

2. **Update documentation:**
   - Update relevant README files
   - Add examples if needed
   - Document any new patterns or conventions
   - Update version or status files if applicable

3. **Notify user:**
   ```markdown
   ✅ Infrastructure modification completed
   
   Changes made:
   - [List of changes]
   
   Files updated:
   - [List of files]
   
   Documentation updated:
   - [List of documentation files]
   
   ⚠️ Important notes:
   - [Any breaking changes or migration requirements]
   - [Any actions the user needs to take]
   ```

---

## Specific Modification Scenarios

### Adding a New Skill

When adding a new skill:

1. **Create skill structure:**
   ```
   .dendrita/users/[user-id]/skills/[skill-name]/
   ├── SKILL.md
   └── [other skill files if needed]
   ```

2. **Update skill-rules.json:**
   - Add new skill entry with keywords, intentPatterns, and fileTriggers
   - Follow existing pattern from other skills

3. **Update skills/README.md:**
   - Add skill to "Available Skills" section
   - Document purpose, covers, and use cases

4. **Update .cursorrules (if needed):**
   - Add skill trigger if it should be mentioned in rules

5. **Verify:**
   - Skill follows same structure as existing skills
   - Keywords and patterns are appropriate
   - Documentation is complete

### Modifying an Existing Skill

When modifying an existing skill:

1. **Read current skill:**
   - Read `SKILL.md` to understand current structure
   - Read `skill-rules.json` entry for this skill
   - Read `skills/README.md` section for this skill

2. **Assess impact:**
   - Which projects use this skill?
   - Which agents reference this skill?
   - Which hooks might be affected?

3. **Make changes:**
   - Update `SKILL.md` with new information
   - Update `skill-rules.json` if keywords/patterns change
   - Update `skills/README.md` if skill description changes

4. **Maintain backward compatibility:**
   - If breaking changes, document clearly
   - Provide migration guidance if needed

### Adding a New Agent

When adding a new agent:

1. **Create agent file:**
   ```
   .dendrita/users/[user-id]/agents/[agent-name].md
   ```

2. **Follow agent structure:**
   - Use existing agents as templates
   - Include: name, description, purpose, instructions, principles

3. **Update agents/README.md:**
   - Add agent to "Available Agents" section
   - Document purpose and use cases

4. **Update .cursorrules (if needed):**
   - Add agent mention if it should be in rules

### Modifying Workspace Structure

When modifying workspace structure:

1. **Read current structure:**
   - Read `.dendrita/WORKSPACE-STRUCTURE.md`
   - Review existing workspaces to understand current patterns

2. **Assess impact:**
   - Which workspaces will be affected?
   - Which projects might need updates?
   - Will this break existing projects?

3. **Make changes:**
   - Update `.dendrita/WORKSPACE-STRUCTURE.md`
   - Update `.cursorrules` if structure changes affect rules
   - Update workspace templates if needed

4. **Provide migration guidance:**
   - If breaking changes, document migration steps
   - List affected workspaces
   - Provide update scripts or guidance

### Adding a New Integration

When adding a new integration:

1. **Create integration structure:**
   ```
   .dendrita/integrations/
   ├── [integration-name]/
   │   ├── README.md
   │   ├── hooks/
   │   ├── scripts/
   │   ├── services/
   │   └── utils/
   ```

2. **Update integrations/README.md:**
   - Add integration to available integrations
   - Document setup and usage

3. **Create necessary files:**
   - README.md with documentation
   - Setup instructions
   - Example files if needed

4. **Update .gitignore (if needed):**
   - Add integration-specific ignore patterns

### Modifying Hooks

When modifying hooks:

1. **Read current hook:**
   - Read the hook file to understand current behavior
   - Read `.dendrita/hooks/README.md` to understand hook structure

2. **Assess impact:**
   - Which components depend on this hook behavior?
   - Which skills/agents reference this hook?

3. **Make changes:**
   - Update hook file with new behavior
   - Update `.dendrita/hooks/README.md` if hook description changes

4. **Maintain backward compatibility:**
   - Document behavior changes clearly
   - Ensure existing references still work

---

## Validations

Cursor must validate:

1. **Structure consistency:**
   - New files follow same structure as existing files
   - Naming conventions are followed
   - File organization matches patterns

2. **Dependency correctness:**
   - All references are valid
   - No broken links or missing files
   - Dependencies are properly documented

3. **Documentation completeness:**
   - All new components are documented
   - README files are updated
   - Examples are provided if needed

4. **Compatibility:**
   - Changes don't break existing functionality
   - Migration guidance is provided if needed
   - Backward compatibility is maintained when possible

---

## Special Cases

### Breaking Changes

If breaking changes are necessary:

```markdown
⚠️ BREAKING CHANGE DETECTED

This modification will break existing functionality:
- [List of breaking changes]

Affected components:
- [List of affected components]

Migration required:
- [Migration steps]

Would you like to:
1. Proceed with breaking changes (document migration)
2. Make changes backward compatible
3. Create new version/component instead
```

### Large Refactoring

If refactoring multiple components:

1. **Plan the refactoring:**
   - List all components to be modified
   - Identify dependencies and order of changes
   - Plan verification steps

2. **Execute systematically:**
   - Make changes in logical order
   - Verify after each major change
   - Update documentation incrementally

3. **Verify completeness:**
   - All planned changes are made
   - All documentation is updated
   - All dependencies are resolved

### Experimental Changes

If making experimental changes:

1. **Mark as experimental:**
   - Use clear naming (e.g., `experimental-` prefix)
   - Document experimental status
   - Add warnings in documentation

2. **Provide rollback guidance:**
   - Document how to revert changes
   - Keep backup of original files
   - Document experimental features clearly

---

## Integration with Other Hooks

This hook integrates with:

1. **skill-activation-prompt:**
   - Infrastructure changes might affect skill activation
   - New skills need to be added to skill-rules.json

2. **post-tool-use-tracker:**
   - Infrastructure changes should be tracked
   - Context should be identified as "infrastructure"

3. **repo-initialization:**
   - Infrastructure changes might affect initialization
   - New components need to be included in initialization

---

## Error Messages

### Invalid Structure

```markdown
⚠️ Invalid infrastructure structure detected.

The modification doesn't follow dendrita patterns:
- [List of issues]

Please review:
- .dendrita/WORKSPACE-STRUCTURE.md
- Existing examples in .dendrita/

Fix the structure before proceeding.
```

### Missing Dependencies

```markdown
⚠️ Missing dependencies detected.

The modification references components that don't exist:
- [List of missing dependencies]

Please:
- Create missing components first
- Or update references to existing components
```

### Breaking Changes

```markdown
⚠️ Breaking changes detected without migration plan.

This modification will break:
- [List of breaking changes]

Please:
- Document migration steps
- Or make changes backward compatible
- Or create new version instead
```

---

## Notes for Cursor

1. **Always review before modifying:**
   - Read relevant documentation first
   - Understand existing patterns
   - Assess impact before making changes

2. **Maintain consistency:**
   - Follow established patterns
   - Use existing files as templates
   - Maintain naming conventions

3. **Update documentation:**
   - Always update related README files
   - Document new patterns or conventions
   - Provide examples when needed

4. **Warn about breaking changes:**
   - Always identify breaking changes
   - Provide migration guidance
   - Get user confirmation before breaking changes

5. **Verify after changes:**
   - Check structure consistency
   - Verify dependencies
   - Confirm documentation is updated

---

## References

- `.dendrita/hooks/README.md` - General hooks documentation
- `.dendrita/users/[user-id]/skills/README.md` - Skills structure and patterns (user-specific domain knowledge)
- `.dendrita/users/[user-id]/agents/README.md` - Agents structure and patterns (user-specific domain knowledge)
- `.dendrita/WORKSPACE-STRUCTURE.md` - Workspace structure standards
- `.dendrita/integrations/README.md` - Integrations documentation
- `.cursorrules` - Project rules and behavior
- `.dendrita/ESTADO.md` - System status and configuration

---

**For Cursor:** This hook is a behavior reference. You must read this file and apply the documented logic when detecting infrastructure modifications. Do NOT execute scripts, apply the behavior reflexively.

