---
name: backlinks-discovery
description: "Backlinks Discovery Hook"
type: hook
created:
  2025-11-06T00:00:00.000Z
  
updated:
  2025-11-06T00:00:00.000Z
  
tags: ["hook", "behavior-reference"]
category: behavior-reference
---

# Backlinks Discovery Hook

Behavior reference for Cursor - automatic discovery and creation of backlinks between development documents (`.dendrita/`) and work documents (`workspaces/`).

---

## What is this Hook?

This hook documents the expected behavior that Cursor must apply when detecting references between development documents (`.dendrita/`) and work documents (`workspaces/`) to automatically create bidirectional backlinks.

**Purpose:** Automatically discover and create backlinks between documents to maintain a connected knowledge graph across the system, enabling easy navigation between related documents.

**Context:** Documents in `.dendrita/` (hooks, skills, agents, documentation) often reference work documents in `workspaces/` (projects, products, stakeholders), and vice versa. This hook ensures these relationships are bidirectional and discoverable.

**Integration with Wikilinks Signatures:** This hook works in conjunction with `wikilinks-signature-editing.md` to track content origins. When scripts or manual editing add wikilink signatures to content, this hook automatically creates backlinks from the referenced files back to the source document.

---

## Expected Behavior

### 1. Activation of the Hook

Cursor must activate backlinks-discovery behavior when:

- ✅ Reading or editing a document in `.dendrita/` that mentions files, projects, or workspaces
- ✅ Reading or editing a document in `workspaces/` that mentions hooks, skills, agents, or dendrita components
- ✅ User explicitly requests "buscar backlinks" or "añadir backlinks"
- ✅ User mentions "enlazar documentos" or "conectar documentos"
- ✅ After creating or modifying a document that references other documents

**Activation condition:**

```markdown
IF (reading/editing .dendrita/**/*.md) AND (document mentions workspaces/ files/projects) OR
   (reading/editing workspaces/**/*.md) AND (document mentions .dendrita/ components) OR
   (user requests "backlinks" OR "enlazar" OR "conectar") OR
   (document created/modified with references to other documents)
THEN activate backlinks-discovery behavior
```

### 2. Backlinks Discovery Process

When backlinks-discovery behavior is activated, Cursor must:

#### Step 1: Identify Document References

Analyze the current document to identify references:

1. **References from `.dendrita/` to `workspaces/`:**
   - File paths: `workspaces/[workspace]/**/*.md`
   - Project names: Mentions of projects in `🚀 active-projects/`
   - Workspace names: Mentions of workspace directories
   - Product names: Mentions of products in `📦 products/`
   - Stakeholder names: Mentions of stakeholders in `🤝 stakeholders/`

2. **References from `workspaces/` to `.dendrita/`:**
   - Hook references: Mentions of hooks in `.dendrita/hooks/`
   - Skill references: Mentions of skills in `.dendrita/users/[user-id]/skills/`
   - Agent references: Mentions of agents in `.dendrita/users/[user-id]/agents/`
   - Documentation references: Mentions of `.dendrita/` documentation files
   - Integration references: Mentions of scripts or integrations

3. **Wikilink signatures:**
   - Extract wikilinks from signatures: `*Generado con gpt-4o a partir de [[archivo1.md]]*`
   - Extract wikilinks from copy signatures: `*Copiado de [[archivo.md]], líneas 10-25*`
   - Extract wikilinks from integration signatures: `*Integrado con gpt-5 a partir de [[archivo1.md]], [[archivo2.md]]*`
   - Extract wikilinks from scrape signatures: `*Extraído de Google Sheet: [[archivo.md]]*`

**Pattern detection:**

```markdown
1. Search for markdown links: [text](path/to/file.md)
2. Search for file paths: workspaces/... or .dendrita/...
3. Search for project/workspace names in context
4. Search for component names (hooks, skills, agents)
5. Search for relative paths or partial paths
6. Search for wikilinks in signatures: [[archivo.md]]
7. Extract wikilinks from signature text
```

#### Step 2: Validate References

For each identified reference:

1. **Check if target file exists:**
   - Resolve relative paths from current document location
   - Check if file exists in filesystem
   - Handle emoji file names (check both emoji and backup versions)

2. **Extract reference context:**
   - Identify the section where reference appears
   - Extract surrounding text for context
   - Determine reference type (explicit link, mention, or implicit reference)

3. **Determine reference direction:**
   - From `.dendrita/` → `workspaces/`: Development document references work document
   - From `workspaces/` → `.dendrita/`: Work document references development document

#### Step 3: Create Backlinks

For each valid reference, create bidirectional backlinks:

1. **Add forward link (if not present):**
   - If document already has markdown link `[text](path)`, keep it
   - If document mentions file but no link, add markdown link
   - Format: `[Descriptive Text](relative/path/to/file.md)`

2. **Add backlink in target document:**
   - Read target document
   - Check if backlink section exists (e.g., "## Backlinks" or "## Related Documents")
   - If section doesn't exist, create it at the end of document
   - Add backlink entry with:
     - Link to source document
     - Brief context (extracted from source document)
     - Timestamp of when backlink was added

**Backlink format:**

```markdown
## Backlinks

**YYYY-MM-DD HH:mm** | [Source Document Name](relative/path/to/source.md)

[Context from source document where reference appears]

---
```

**Example backlink entry:**

```markdown
## Backlinks

**2025-11-06 14:30** | [Working Context Hook](.dendrita/hooks/working-context.md)

Este hook documenta el comportamiento esperado para mantener contextos de trabajo. Se menciona en el proyecto [project-name].

---
```

#### Step 4: Update Documents

1. **Update source document:**
   - Ensure forward link is properly formatted
   - If link was added, inform user in a non-intrusive way

2. **Update target document:**
   - Add or update backlink section
   - Append new backlink entry (most recent first)
   - Preserve existing backlinks
   - Maintain chronological order

3. **Handle conflicts:**
   - If backlink already exists, update timestamp if context changed
   - If multiple references from same source, consolidate into one entry
   - If backlink section is too long, consider archiving old entries

### 3. Reference Types

#### Explicit References

**Markdown links:**
- `[Project Name](workspaces/[workspace]/🚀 active-projects/[project-name]/master-plan.md)`
- `[Working Context Hook](.dendrita/hooks/working-context.md)`

**Action:** Verify link target exists, create backlink if missing.

#### Implicit References

**File path mentions:**
- "See `workspaces/[workspace]/🚀 active-projects/[project-name]/current-context.md`"
- "Documented in `.dendrita/hooks/working-context.md`"

**Action:** Convert to markdown link, create backlink.

#### Contextual References

**Project/workspace names:**
- "This hook is used in the [project-name] project"
- "See the ennui workspace for examples"

**Action:** Search for related files, suggest links, create backlinks if user confirms.

### 4. Backlink Section Management

#### Section Location

**Standard location:** At the end of the document, before any appendices or metadata.

**Format:**

```markdown
---

## Backlinks

[Backlink entries, most recent first]

---
```

#### Entry Format

Each backlink entry should include:

1. **Timestamp:** When the backlink was created/updated
2. **Source link:** Markdown link to source document
3. **Context:** Brief excerpt from source document showing where reference appears
4. **Separator:** Horizontal rule between entries

**Full example:**

```markdown
## Backlinks

**2025-11-06 15:45** | [Backlinks Discovery Hook](.dendrita/hooks/backlinks-discovery.md)

Este hook documenta el comportamiento esperado para buscar y añadir backlinks entre documentos de desarrollo y trabajo.

---

**2025-11-06 14:30** | [Working Context Hook](.dendrita/hooks/working-context.md)

Este hook documenta el comportamiento esperado para mantener contextos de trabajo. Se menciona en el proyecto [project-name].

---
```

### 5. Special Cases

#### Emoji File Names

When handling files with emojis:

1. **Check both versions:**
   - Emoji version: `workspaces/[workspace]/🚀 active-projects/[project-name]/`
   - Backup version: `workspaces/[workspace]/.active-projects/[project-name]/`

2. **Use emoji version for links:**
   - Always link to emoji version in markdown
   - System handles backup automatically

#### Relative Path Resolution

When resolving relative paths:

1. **From `.dendrita/` to `workspaces/`:**
   - Current: `.dendrita/hooks/backlinks-discovery.md`
   - Target: `workspaces/[workspace]/🚀 active-projects/[project-name]/master-plan.md`
   - Relative: `../../workspaces/[workspace]/🚀 active-projects/[project-name]/master-plan.md`

2. **From `workspaces/` to `.dendrita/`:**
   - Current: `workspaces/[workspace]/🚀 active-projects/[project-name]/master-plan.md`
   - Target: `.dendrita/hooks/backlinks-discovery.md`
   - Relative: `../../../../.dendrita/hooks/backlinks-discovery.md`

#### Circular References

If document A references document B, and document B references document A:

1. **Create both backlinks:**
   - Document A gets backlink to Document B
   - Document B gets backlink to Document A

2. **Avoid infinite loops:**
   - Only process each document pair once per session
   - Track processed pairs to prevent recursion

#### Multiple References from Same Source

If source document references target multiple times:

1. **Consolidate into one backlink entry:**
   - Include all relevant context
   - Use most recent timestamp
   - Mention multiple references if significant

### 6. Integration with Other Hooks

This hook integrates with:

1. **[project-name]:**
   - When backlinks are created, log to timeline
   - Format: `[BACKLINK] created [source] ↔ [target]`

2. **post-tool-use-tracker:**
   - Track which documents were updated with backlinks
   - Maintain context of backlink operations

3. **working-context:**
   - Include backlink operations in working context
   - Track relationships discovered

---

## Backlink Discovery Strategies

### Strategy 1: Proactive Discovery

**When:** Reading a document for the first time in session

**Action:**
1. Scan document for references
2. Validate all references
3. Create missing backlinks automatically
4. Inform user: "✅ Created X backlinks in related documents"

### Strategy 2: On-Demand Discovery

**When:** User explicitly requests backlink discovery

**Action:**
1. Ask user which documents to scan
2. Scan specified documents
3. Show discovered references
4. Ask user to confirm before creating backlinks
5. Create confirmed backlinks

### Strategy 3: Incremental Discovery

**When:** Document is created or modified

**Action:**
1. Scan only the modified document
2. Identify new references
3. Create backlinks for new references only
4. Update existing backlinks if context changed

---

## Notes for Cursor

1. **Always validate references:**
   - Check if target files exist before creating backlinks
   - Handle emoji file names correctly
   - Resolve relative paths accurately

2. **Create meaningful backlinks:**
   - Include context from source document
   - Use descriptive link text
   - Maintain chronological order (newest first)

3. **Be non-intrusive:**
   - Create backlinks automatically when safe
   - Inform user briefly about backlinks created
   - Don't interrupt workflow unnecessarily

4. **Maintain backlink sections:**
   - Keep entries organized and readable
   - Archive old entries if section becomes too long
   - Preserve existing backlinks when updating

5. **Handle edge cases:**
   - Emoji file names
   - Circular references
   - Multiple references from same source
   - Missing target files

6. **Integrate with other hooks:**
   - Log backlink creation to [project-name] timeline
   - Track operations in working-context
   - Update post-tool-use-tracker
   - Work with wikilinks-signature-editing to track content origins
   - Extract wikilinks from signatures automatically

---

## Examples

### Example 1: Creating Backlink from Hook to Project

**Source document:** `.dendrita/hooks/working-context.md`

**Content excerpt:**
```markdown
Este hook se utiliza en el proyecto [project-name] para mantener
el contexto de trabajo actualizado.
```

**Action:**
1. Detect reference to `[project-name]` project
2. Resolve path: `workspaces/[workspace]/🚀 active-projects/[project-name]/`
3. Add link in source: `[proyecto [project-name]](workspaces/[workspace]/🚀 active-projects/[project-name]/)`
4. Add backlink in target project's `current-context.md` or `master-plan.md`

**Backlink added to target:**
```markdown
## Backlinks

**2025-11-06 16:00** | [Working Context Hook](.dendrita/hooks/working-context.md)

Este hook se utiliza en el proyecto [project-name] para mantener el contexto de trabajo actualizado.

---
```

### Example 2: Creating Backlink from Project to Hook

**Source document:** `workspaces/[workspace]/🚀 active-projects/[project-name]/master-plan.md`

**Content excerpt:**
```markdown
Para más información sobre el comportamiento esperado, ver el hook
working-context en .dendrita/hooks/working-context.md
```

**Action:**
1. Detect explicit reference to hook
2. Verify link target exists
3. Add backlink in hook document

**Backlink added to hook:**
```markdown
## Backlinks

**2025-11-06 16:05** | [Master Plan - [project-name]](workspaces/[workspace]/🚀 active-projects/[project-name]/master-plan.md)

Para más información sobre el comportamiento esperado, ver el hook working-context.

---
```

---

## References

- `.dendrita/hooks/[project-name].md` - Communication hook for logging changes
- `.dendrita/hooks/post-tool-use-tracker.sh` - File tracking reference
- `.dendrita/hooks/working-context.md` - Working context hook
- `.dendrita/users/[user-id]/config-estilo.json` - Style and naming conventions (user-specific)

---

## Backlinks

**2025-11-06 18:30** | [Working Context Hook](working-context.md)

Este hook documenta el comportamiento esperado para mantener contextos de trabajo. Se menciona en la sección References.

---

**2025-11-06 18:30** | [Dendrita Comunicación Hook]([project-name].md)

Este hook documenta el comportamiento esperado para registrar cambios automáticamente en timeline. Se menciona en la sección References.

---

**For Cursor:** This hook is a behavior reference. You must read this file and apply the documented logic when detecting references between development documents (`.dendrita/`) and work documents (`workspaces/`). Automatically discover and create bidirectional backlinks to maintain a connected knowledge graph across the system.

