---
name: wikilinks-conversion
description: "Wikilinks Conversion Hook"
type: hook
created:
  2025-11-06T00:00:00.000Z
  
updated:
  2025-11-06T00:00:00.000Z
  
tags: ["hook", "behavior-reference"]
category: behavior-reference
---

# Wikilinks Conversion Hook

Behavior reference for Cursor - automatic conversion of file references to wikilinks format in workspace documents.

---

## What is this Hook?

This hook documents the expected behavior that Cursor must apply when converting file references in workspace documents to wikilinks format.

**Purpose:** Automatically convert markdown links, path mentions, and other file references to wikilinks format (`[[ruta/archivo]]`) to enable better navigation and linking between documents in the workspace system.

**Context:** Documents in `workspaces/` often reference other documents using various formats (markdown links, backtick paths, plain paths). This hook ensures all references are converted to a consistent wikilink format that works with knowledge graph systems.

---

## Expected Behavior

### 1. Activation of the Hook

Cursor must activate wikilinks-conversion behavior when:

- ✅ User explicitly requests "convertir links a wikilinks" or "usar wikilinks"
- ✅ User mentions "wikilinks" or "enlaces wiki"
- ✅ User requests "vincular documentos con wikilinks"
- ✅ After creating or modifying documents in `workspaces/` that reference other files
- ✅ When user explicitly runs the conversion script

**Activation condition:**

```markdown
IF (user requests "wikilinks" OR "convertir links" OR "enlaces wiki") OR
   (creating/modifying workspaces/**/*.md with file references) OR
   (user runs convert-links-to-wikilinks.ts script)
THEN activate wikilinks-conversion behavior
```

### 2. Wikilinks Conversion Process

When wikilinks-conversion behavior is activated, Cursor must:

#### Step 1: Identify File References

Analyze the document to identify references to other files:

1. **Markdown links:**
   - Pattern: `[text](path/to/file.md)`
   - Example: `[master plan](workspaces/[workspace]/🚀 active-projects/[project-name]/master-plan.md)`
   - Convert to: `[[workspaces/[workspace]/🚀 active-projects/[project-name]/master-plan.md]]` or `text [[workspaces/...]]` if text is descriptive

2. **Backtick paths:**
   - Pattern: `` `workspaces/.../file.md` ``
   - Example: `` `workspaces/[workspace]/⚙️ company-management/📝 meeting-notes.md` ``
   - Convert to: `[[workspaces/[workspace]/⚙️ company-management/📝 meeting-notes.md]]`

3. **Plain path mentions:**
   - Pattern: `workspaces/.../file.md` (without backticks or markdown link syntax)
   - Example: `workspaces/[workspace]/🚀 active-projects/[project-name]/current-context.md`
   - Convert to: `[[workspaces/[workspace]/🚀 active-projects/[project-name]/current-context.md]]`

**Pattern detection:**

```markdown
1. Search for markdown links: [text](path/to/file.md)
2. Search for backtick paths: `workspaces/.../file.md`
3. Search for plain paths: workspaces/.../file.md (not in code blocks)
4. Validate that target file exists
5. Resolve relative paths correctly
```

#### Step 2: Validate References

For each identified reference:

1. **Check if target file exists:**
   - Resolve relative paths from current document location
   - Check if file exists in filesystem
   - Handle emoji file names (check both emoji and backup versions)
   - Verify path is within `workspaces/` directory

2. **Extract reference context:**
   - Identify the section where reference appears
   - Determine reference type (markdown link, backtick path, plain path)
   - Extract link text if available (for markdown links)

3. **Determine conversion strategy:**
   - **Markdown links with descriptive text:** Keep text, add wikilink: `text [[path]]`
   - **Markdown links with path as text:** Replace with wikilink only
   - **Backtick paths:** Replace with wikilink
   - **Plain paths:** Replace with wikilink

#### Step 3: Convert to Wikilinks

For each valid reference, convert to wikilink format:

1. **Format:**
   - Wikilink format: `[[ruta/completa/al/archivo.md]]`
   - Use forward slashes `/` (not backslashes)
   - Include full path from project root
   - Preserve emojis in file/folder names

2. **Conversion rules:**
   - **Markdown links:**
     - If link text is descriptive (not just filename): `Descriptive Text [[path/to/file.md]]`
     - If link text is filename or path: `[[path/to/file.md]]`
   
   - **Backtick paths:**
     - Replace entire backtick path with wikilink: `` `path` `` → `[[path]]`
   
   - **Plain paths:**
     - Replace path with wikilink: `path/to/file.md` → `[[path/to/file.md]]`

3. **Preserve context:**
   - Don't break existing formatting
   - Maintain line structure
   - Preserve surrounding text

#### Step 4: Update Documents

1. **Update source document:**
   - Replace identified references with wikilinks
   - Maintain document structure and formatting
   - Preserve YAML frontmatter if present

2. **Handle edge cases:**
   - **Code blocks:** Don't convert references inside code blocks (```)
   - **Inline code:** Don't convert references in inline code (`code`)
   - **URLs:** Don't convert HTTP/HTTPS URLs
   - **Relative paths:** Resolve correctly from document location

3. **Validation:**
   - Verify all converted wikilinks point to existing files
   - Check that no broken links were created
   - Ensure emoji file names are handled correctly

### 3. Reference Types

#### Explicit Markdown Links

**Format:** `[text](path/to/file.md)`

**Conversion:**
- If `text` is descriptive: `text [[path/to/file.md]]`
- If `text` is filename/path: `[[path/to/file.md]]`

**Example:**
```markdown
Before: [master plan](workspaces/[workspace]/🚀 active-projects/[project-name]/master-plan.md)
After: master plan [[workspaces/[workspace]/🚀 active-projects/[project-name]/master-plan.md]]
```

#### Backtick Path References

**Format:** `` `workspaces/.../file.md` ``

**Conversion:**
- Replace entire backtick path with wikilink

**Example:**
```markdown
Before: Ver `workspaces/[workspace]/⚙️ company-management/📝 meeting-notes.md` para detalles
After: Ver [[workspaces/[workspace]/⚙️ company-management/📝 meeting-notes.md]] para detalles
```

#### Plain Path Mentions

**Format:** `workspaces/.../file.md` (not in code)

**Conversion:**
- Replace path with wikilink

**Example:**
```markdown
Before: Revisar workspaces/[workspace]/🚀 active-projects/[project-name]/current-context.md
After: Revisar [[workspaces/[workspace]/🚀 active-projects/[project-name]/current-context.md]]
```

### 4. Special Cases

#### Emoji File Names

When handling files with emojis:

1. **Check both versions:**
   - Emoji version: `workspaces/[workspace]/🚀 active-projects/🎓 [project-name]/`
   - Backup version: `workspaces/[workspace]/.active-projects/.[project-name]/`

2. **Use emoji version for wikilinks:**
   - Always link to emoji version in wikilinks
   - System handles backup automatically

#### Relative Path Resolution

When resolving relative paths:

1. **From workspace document:**
   - Current: `workspaces/[workspace]/🚀 active-projects/[project-name]/current-context.md`
   - Target: `../master-plan.md`
   - Resolved: `workspaces/[workspace]/🚀 active-projects/[project-name]/master-plan.md`

2. **From project root:**
   - Always use absolute paths from project root in wikilinks
   - Format: `[[workspaces/workspace/path/to/file.md]]`

#### Code Blocks and Inline Code

**Don't convert references in:**
- Code blocks (```)
- Inline code (`code`)
- YAML frontmatter (unless explicitly requested)

**Example:**
```markdown
# This is converted
See [[workspaces/[workspace]/🚀 active-projects/project/README.md]]

# This is NOT converted
```bash
cd workspaces/[workspace]/🚀 active-projects/project/
```

# This is NOT converted
Use `workspaces/[workspace]/🚀 active-projects/project/script.sh`
```

### 5. Integration with Other Hooks

This hook integrates with:

1. **backlinks-discovery:**
   - After converting to wikilinks, backlinks can be discovered more easily
   - Wikilinks make bidirectional linking simpler

2. **post-tool-use-tracker:**
   - Track which files were updated with wikilinks
   - Maintain context of conversion operations

3. **working-context:**
   - Include wikilink conversion operations in working context
   - Track relationships discovered through conversion

---

## Script Usage

The conversion can be performed using the script:

```bash
# Convert all files in workspaces/
tsx .dendrita/integrations/scripts/convert-links-to-wikilinks.ts

# Dry run (preview changes without applying)
tsx .dendrita/integrations/scripts/convert-links-to-wikilinks.ts --dry-run

# Convert files in specific workspace
tsx .dendrita/integrations/scripts/convert-links-to-wikilinks.ts --workspace ennui

# Convert specific file
tsx .dendrita/integrations/scripts/convert-links-to-wikilinks.ts --file workspaces/[workspace]/🚀 active-projects/project/README.md
```

---

## Benefits of Wikilinks

1. **Consistent format:** All file references use the same format
2. **Better navigation:** Works with knowledge graph systems (Obsidian, LogSeq, etc.)
3. **Bidirectional linking:** Easier to discover backlinks
4. **Simpler syntax:** `[[path]]` is cleaner than `[text](path)`
5. **Tool compatibility:** Works with markdown tools that support wikilinks

---

## Notes

- **This hook is a behavior reference:** Cursor should read this to understand expected behavior
- **Script is executable:** The TypeScript script can be run directly to perform conversions
- **Preserve existing links:** Don't break existing markdown links that work well
- **Validate targets:** Always verify that target files exist before converting
- **Handle emojis:** Support both emoji and backup versions of file names

---

**For Cursor:**
- Read this file to understand the logic
- NOT attempt to execute it
- Apply documented behavior when user requests wikilink conversion
- Use the script for automated bulk conversions

**Related documentation:**
- `.dendrita/hooks/backlinks-discovery.md` - Backlinks discovery (works with wikilinks)
- `.dendrita/integrations/scripts/convert-links-to-wikilinks.ts` - Conversion script

