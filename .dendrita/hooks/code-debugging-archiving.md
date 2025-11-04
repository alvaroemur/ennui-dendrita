---
name: code-debugging-archiving
description: Process for debugging, testing, and archiving code and rules in the dendrita system
---

# Code Debugging and Archiving Hook

## Purpose

This hook documents the expected behavior for debugging, testing, and archiving code, rules, and infrastructure components in the dendrita system.

**Behavior reference:** Logic to identify, debug, test, and archive code and rules that are no longer needed or require maintenance.

---

## Expected Behavior

### 1. Identification Phase

When receiving prompts about debugging, testing, or archiving:

1. **Identify test/debug files:**
   - Files matching patterns: `test-*.ts`, `*-test.ts`, `debug-*.ts`, `*-debug.ts`
   - Files in `.dendrita/integrations/scripts/` and `.dendrita/integrations/examples/`
   - Files in `.dendrita/logs/` (log files)
   - Files with `.spec.` or `.test.` extensions

2. **Identify deprecated rules:**
   - Review `.dendrita/users/[user-id]/skills/skill-rules.json` for unused skills
   - Review `.dendrita/users/[user-id]/agents/` for deprecated agents
   - Review `.dendrita/hooks/` for obsolete hooks
   - Check for outdated configuration files

3. **Check for duplicate functionality:**
   - Compare similar test files
   - Identify redundant scripts
   - Find duplicate implementations

### 2. Debugging Phase

When debugging code or rules:

1. **Review test files:**
   - Check if test files are still relevant
   - Verify if tests are passing or failing
   - Identify broken or outdated tests
   - Document test status and purpose

2. **Check dependencies:**
   - Verify if scripts depend on deprecated services
   - Check if npm scripts in `package.json` reference non-existent files
   - Identify unused dependencies

3. **Validate configuration:**
   - Check if config files reference deprecated paths
   - Verify environment variables are still used
   - Review integration status

### 3. Archiving Phase

When archiving code or rules:

1. **Create archive structure:**
   ```
   .dendrita/archived/
   ├── code/
   │   ├── scripts/
   │   │   └── [timestamp]-[description]/
   │   ├── examples/
   │   │   └── [timestamp]-[description]/
   │   └── tests/
   │       └── [timestamp]-[description]/
   ├── rules/
   │   ├── skills/
   │   ├── agents/
   │   └── hooks/
   └── configs/
       └── [timestamp]-[description]/
   ```

2. **Archive process:**
   - Create timestamped directory: `YYYY-MM-DD-[description]`
   - Move files to archive directory
   - Create `ARCHIVE-README.md` with:
     - Reason for archiving
     - Date archived
     - Original location
     - Dependencies or related files
     - Restoration instructions if needed

3. **Update references:**
   - Remove from `package.json` scripts if archived
   - Update documentation to reflect archived status
   - Remove from active directories
   - Update `.gitignore` if needed

### 4. Cleanup Phase

After archiving:

1. **Remove from active code:**
   - Delete archived files from original locations
   - Clean up empty directories
   - Remove unused npm scripts

2. **Update documentation:**
   - Update `.dendrita/hooks/README.md` if hooks archived
   - Update `.dendrita/users/[user-id]/skills/skill-rules.json` if skills archived
   - Update `.dendrita/integrations/README.md` if integrations archived

3. **Verify no broken references:**
   - Check for import errors
   - Verify no broken links in documentation
   - Test remaining functionality

---

## Archive Location Structure

### Code Archives

**Location:** `.dendrita/archived/code/`

**Structure:**
```
archived/code/
├── scripts/
│   └── YYYY-MM-DD-[description]/
│       ├── [original-files]
│       └── ARCHIVE-README.md
├── examples/
│   └── YYYY-MM-DD-[description]/
│       ├── [original-files]
│       └── ARCHIVE-README.md
└── tests/
    └── YYYY-MM-DD-[description]/
        ├── [original-files]
        └── ARCHIVE-README.md
```

### Rules Archives

**Location:** `.dendrita/archived/rules/`

**Structure:**
```
archived/rules/
├── skills/
│   └── YYYY-MM-DD-[skill-name]/
│       ├── [skill-files]
│       └── ARCHIVE-README.md
├── agents/
│   └── YYYY-MM-DD-[agent-name]/
│       ├── [agent-files]
│       └── ARCHIVE-README.md
└── hooks/
    └── YYYY-MM-DD-[hook-name]/
        ├── [hook-files]
        └── ARCHIVE-README.md
```

---

## Archive README Template

When archiving files, create an `ARCHIVE-README.md` with:

```markdown
# Archive: [Name/Description]

**Date Archived:** YYYY-MM-DD
**Original Location:** [path]
**Archived By:** [reason]

## Reason for Archiving

[Explain why this was archived]

## Dependencies

- [List dependencies]
- [Related files]

## Restoration

If needed, restore by:
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Notes

[Any additional notes]
```

---

## When to Archive

### Archive Code When:
- ✅ Test files are no longer relevant
- ✅ Scripts are superseded by newer versions
- ✅ Debug scripts are no longer needed
- ✅ Examples are outdated
- ✅ Code is deprecated but might be useful for reference

### Archive Rules When:
- ✅ Skills are no longer used
- ✅ Agents are deprecated
- ✅ Hooks are obsolete
- ✅ Configuration is outdated
- ✅ Rules conflict with new system architecture

### DO NOT Archive When:
- ❌ Code is actively used
- ❌ Tests are part of CI/CD
- ❌ Rules are referenced in documentation
- ❌ Files are examples for current patterns
- ❌ Code is part of active integrations

---

## For Cursor

- Read this file to understand the archiving logic
- NOT attempt to execute it
- Apply documented behavior reflexively when:
  - User asks to archive or debug code
  - User wants to clean up test files
  - User requests to deprecate rules
  - System maintenance is needed

---

## Related Documentation

- `.dendrita/integrations/README.md` - Integration documentation
- `.dendrita/hooks/README.md` - Hooks documentation
- `.dendrita/users/[user-id]/skills/README.md` - Skills documentation (user-specific domain knowledge)
- `.dendrita/users/[user-id]/agents/README.md` - Agents documentation (user-specific domain knowledge)

