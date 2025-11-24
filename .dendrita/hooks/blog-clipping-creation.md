---
name: blog-clipping-creation
description: "blog-clipping-creation (ClippingCreation)"
type: hook
created:
  2025-11-06T00:00:00.000Z
  
updated:
  2025-11-07T00:00:00.000Z
  
tags: ["hook", "behavior-reference"]
category: behavior-reference
---

# blog-clipping-creation (ClippingCreation)

**Behavior reference:** Logic to create and manage clippings (notes/ideas) from work sessions, storing textual context, source references, and brief reflections for future use in blog posts, documentation, projects, or other contexts.

This is a reference for Cursor. It documents expected behavior to APPLY, not executable code.

---

## CRITICAL: Clipping Location

**ALL clippings MUST be saved in `_clippings/` at the project root.**

- **Location:** `_clippings/` (absolute path from project root)
- **Index:** `_clippings/README.md` (MUST be updated when creating clippings)
- **Structure:** `_clippings/[YYYY-MM]/YYYY-MM-DD-HHmm-[descripcion]-clipping.md`

This is a shared location for all clippings across all users and workspaces. Do NOT create user-specific clipping directories.

---

## Triggers

- Manual activation when the user requests creating a clipping from current context.
- Example prompts:
  - "crea un clipping de esto"
  - "guarda esto como idea para el blog"
  - "clipping de esta sesión"
  - "crea nota de blog de [contexto específico]"
  - "guarda esto como referencia"
  - "clipping para documentación"

---

## Scope

- Location: `_clippings/` (root directory)
- Affects:
  - `_clippings/[YYYY-MM]/YYYY-MM-DD-HHmm-[descripcion]-clipping.md` (individual clippings)
  - `_clippings/README.md` (index)
  - `.dendrita/blog/posts/[post-slug].clippings.json` (memory of used/discarded clippings per post)

---

## Clipping Creation Process

### 1. Gather Context

When the hook is triggered, collect the following information:

1. **Textual Content** (required):
   - Extract the relevant text from the current context
   - Include surrounding context if needed for clarity
   - Capture the specific fragment or section being referenced

2. **Source Reference** (required):
   - Identify the source file/document (e.g., `workspaces/[workspace]/active-projects/[project-name]/master-plan.md`)
   - Include specific line numbers or section references if applicable
   - Format: `[filepath]:[line-range]` or `[filepath]#[section]`
   - Context description: workspace, project, document type

3. **Brief Reflection** (required):
   - Why this is important for the blog context
   - What insight or learning it represents
   - How it relates to broader themes or narratives
   - Suggested tags or categories for organization

4. **Metadata** (auto-generated):
   - Creation date/time
   - Source session context (if available)
   - Clipping hash (short identifier)

### 2. Create Clipping File

**Location:** `_clippings/[YYYY-MM]/YYYY-MM-DD-HHmm-[descripcion]-clipping.md`

**CRITICAL:** All clippings MUST be saved in `_clippings/` at the project root. This is the single source of truth for all clippings regardless of user or workspace context.

**Filename format:**
- `YYYY-MM-DD-HHmm-[descripcion]-clipping.md`
- `YYYY-MM-DD`: Date of creation
- `HHmm`: Time of creation in 24-hour format without separator (e.g., `0957`, `2054`)
- `[descripcion]`: Descriptive slug derived from the clipping title (kebab-case, max 50 chars)
  - If title is available: slugified version of the title
  - If no title: short hash (first 6-8 chars) as fallback
- Examples:
  - `2025-11-06-0957-workflow-dendritificacion-clipping.md`
  - `2025-11-04-2054-cursor-journaling-automatizacion-clipping.md`
  - `2025-11-05-1404-ironia-buscar-google-buscador-clipping.md`

**File structure:**

```markdown
---
id: [hash]
created: YYYY-MM-DDTHH:mm:ssZ
source: [filepath]
source_context: [workspace/project/document description]
tags: [array of tags]
categories: [array of categories]
status: draft
---

# Clipping: [Brief descriptive title]

## Context

[Textual content extracted from source]

## Source Reference

**File:** `[filepath]`
**Reference:** `[line-range or section]`
**Workspace:** `[workspace]`
**Project:** `[project]` (if applicable)
**Document:** `[document type/name]`

## Reflection

[Brief reflection on why this is important for the blog context]

## Notes

[Additional notes or thoughts]
```

### 3. Update Clipping Index

**Location:** `_clippings/README.md`

**CRITICAL:** Always update `_clippings/README.md` in the root directory. This is the central index for all clippings.

Maintain a markdown table with columns: Date | Source | Workflow | Purpose | Tags | Status | Link

- Insert or update the row for the clipping
- Sort by date (newest first)
- Link to the relative clipping path `./[YYYY-MM]/YYYY-MM-DD-HHmm-[descripcion]-clipping.md`
- Include tags and status for quick filtering

Example row:

| 2025-11-04 | `workspaces/[workspace]/active-projects/[project-name]/master-plan.md` | blog | blog-idea | metodología, desarrollo | draft | [Ver clipping](./2025-11/2025-11-04-2054-metodologia-desarrollo-clipping.md) |

---

## Clipping Organization

### Directory Structure

**CRITICAL:** Clippings are stored in `_clippings/` at the project root. This is a shared location for all clippings across all users and workspaces.

```
_clippings/
├── README.md                    # Main index (CRITICAL: always update this)
├── [YYYY-MM]/                   # Monthly organization
│   ├── YYYY-MM-DD-HHmm-[descripcion]-clipping.md
│   └── ...
└── _imported-manually/          # Manually imported clippings (optional)
```

**IMPORTANT:** 
- All clippings go to `_clippings/` regardless of user or workspace
- The index `_clippings/README.md` is the single source of truth
- Monthly folders organize clippings chronologically

### Tagging System

Clippings should be tagged with:
- **Workspace** tags: `[workspace-name]`, etc.
- **Project** tags: `[project-name]`, `bootcamp-fundraising`, etc.
- **Theme** tags: `metodología`, `desarrollo`, `sostenibilidad`, `mel`, etc.
- **Status** tags: `draft`, `ready`, `used`, `archived`

---

## Memory System (Clippings Usage Tracking)

### Per-Post Memory

**Location:** `.dendrita/blog/posts/[post-slug].clippings.json` (references clippings from `_clippings/`)

**CRITICAL:** When referencing clippings in memory files, use paths relative to project root: `_clippings/[YYYY-MM]/YYYY-MM-DD-HHmm-[descripcion]-clipping.md`

This file tracks which clippings were used or discarded for each blog post.

**Structure:**

```json
{
  "post_slug": "2025-11-04-de-fork-a-metodologia",
  "post_title": "De Fork a Metodología: El Origen de ennui-dendrita",
  "updated": "2025-11-04T19:23:00Z",
  "used": [
    {
      "clipping_id": "[hash]",
      "clipping_path": "_clippings/2025-11/2025-11-04-2054-metodologia-desarrollo-clipping.md",
      "used_in_section": "Origen del proyecto",
      "used_date": "2025-11-04T19:23:00Z",
      "notes": "Used to explain the fork origin"
    }
  ],
  "discarded": [
    {
      "clipping_id": "[hash]",
      "clipping_path": "_clippings/2025-11/2025-11-04-2054-otro-tema-clipping.md",
      "discarded_date": "2025-11-04T19:23:00Z",
      "reason": "Not relevant for this post, but keep for future"
    }
  ]
}
```

### Updating Memory

When creating or editing a blog post:

1. **Identify clippings to consider:**
   - Search clippings by tags, workspace, or content
   - Present relevant clippings to user for review

2. **Track usage:**
   - When a clipping is used in a post:
     - Add to `used` array in `[post-slug].clippings.json`
     - Update clipping status to `used` in clipping file
     - Add reference in post metadata (optional)

3. **Track discards:**
   - When a clipping is reviewed but not used:
     - Add to `discarded` array with reason
     - Keep status as `draft` or `ready` for future consideration

4. **Archive old clippings:**
   - Clippings used in published posts can be archived
   - Clippings older than 6 months without use can be archived

---

## Integration with Blog Publication

When publishing a blog post (via `blog-publication` hook):

1. **Review clippings memory:**
   - Check `[post-slug].clippings.json` for used clippings
   - Verify all referenced clippings exist and are accessible
   - Update clipping statuses to `used` if not already updated

2. **Archive used clippings:**
   - Optionally move used clippings to archived status
   - Keep reference in memory file for traceability

---

## Search and Discovery

When user requests to review clippings for a post:

1. **Search by context:**
   - Search clippings by workspace, project, or tags
   - Show clippings matching the post's theme or categories

2. **Show recent clippings:**
   - Display clippings from last 30 days
   - Prioritize `ready` status clippings

3. **Show unused clippings:**
   - Display clippings with `draft` or `ready` status that haven't been used
   - Sort by creation date (newest first)

---

## Output Summary (what Cursor should report)

After creating a clipping, provide a short summary:
- Created clipping: filename and path in `_clippings/[YYYY-MM]/`
- Updated index: `_clippings/README.md` row added
- Source reference: original file and context
- Tags assigned: list of tags
- Next steps: suggestions for organizing or using the clipping

---

## Safety and Idempotency

- Non-destructive: only creates new clipping files
- Re-running should not duplicate clippings (check by content hash)
- Validate source references exist before creating clipping
- Abort if required information (text, source, reflection) is missing

---

## Related Documentation

- `.dendrita/hooks/README.md` — Hooks overview
- `.dendrita/hooks/blog-publication.md` — Blog publication behavior
- `.dendrita/blog/README.md` — Blog structure and organization

---

## Notes for Cursor

- This file is a behavior reference. Read and apply the documented logic when the user requests clipping creation.
- **CRITICAL:** Always save clippings to `_clippings/` at the project root, never to user-specific directories.
- Always gather the three required components: textual content, source reference, and brief reflection.
- Always update `_clippings/README.md` when creating a new clipping.
- Maintain the memory system to track which clippings are used in which posts.
- Organize clippings by month for easy navigation and management.
- Use tags consistently for better search and discovery.

