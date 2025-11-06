# blog-clipping-creation (BlogClippingCreation)

**Behavior reference:** Logic to create and manage blog clippings (notes/ideas) from work sessions, storing textual context, source references, and brief reflections for future blog posts.

This is a reference for Cursor. It documents expected behavior to APPLY, not executable code.

---

## Triggers

- Manual activation when the user requests creating a clipping from current context.
- Example prompts:
  - "crea un clipping de esto"
  - "guarda esto como idea para el blog"
  - "clipping de esta sesión"
  - "crea nota de blog de [contexto específico]"

---

## Scope

- Location: `.dendrita/blog/clippings/`
- Affects:
  - `.dendrita/blog/clippings/[YYYY-MM]/YYYY-MM-DD-[hash]-clipping.md` (individual clippings)
  - `.dendrita/blog/clippings/README.md` (index)
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
   - Identify the source file/document (e.g., `workspaces/ennui/active-projects/dendrita-comms/master-plan.md`)
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

**Location:** `.dendrita/blog/clippings/[YYYY-MM]/YYYY-MM-DD-[hash]-clipping.md`

**Filename format:**
- `YYYY-MM-DD-[hash]-clipping.md`
- `YYYY-MM-DD`: Date of creation
- `[hash]`: Short hash (first 6-8 chars of content hash) for uniqueness

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

**Location:** `.dendrita/blog/clippings/README.md`

Maintain a markdown table with columns: Date | Source | Tags | Status | Link

- Insert or update the row for the clipping
- Sort by date (newest first)
- Link to the relative clipping path `./[YYYY-MM]/YYYY-MM-DD-[hash]-clipping.md`
- Include tags and status for quick filtering

Example row:

| 2025-11-04 | `workspaces/ennui/active-projects/dendrita-comms/master-plan.md` | metodología, desarrollo | draft | [Ver clipping](./2025-11/2025-11-04-a3b2c1-clipping.md) |

---

## Clipping Organization

### Directory Structure

```
.dendrita/blog/clippings/
├── README.md                    # Main index
├── [YYYY-MM]/                   # Monthly organization
│   ├── YYYY-MM-DD-[hash]-clipping.md
│   └── ...
└── [post-slug].clippings.json   # Memory per post (in posts directory)
```

### Tagging System

Clippings should be tagged with:
- **Workspace** tags: `ennui`, `iami`, `personal`, etc.
- **Project** tags: `dendrita-comms`, `bootcamp-fundraising`, etc.
- **Theme** tags: `metodología`, `desarrollo`, `sostenibilidad`, `mel`, etc.
- **Status** tags: `draft`, `ready`, `used`, `archived`

---

## Memory System (Clippings Usage Tracking)

### Per-Post Memory

**Location:** `.dendrita/blog/posts/[post-slug].clippings.json`

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
      "clipping_path": "clippings/2025-11/2025-11-04-a3b2c1-clipping.md",
      "used_in_section": "Origen del proyecto",
      "used_date": "2025-11-04T19:23:00Z",
      "notes": "Used to explain the fork origin"
    }
  ],
  "discarded": [
    {
      "clipping_id": "[hash]",
      "clipping_path": "clippings/2025-11/2025-11-04-b4c5d6-clipping.md",
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
- Created clipping: filename and path
- Updated index: `.dendrita/blog/clippings/README.md` row added
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
- Always gather the three required components: textual content, source reference, and brief reflection.
- Maintain the memory system to track which clippings are used in which posts.
- Organize clippings by month for easy navigation and management.
- Use tags consistently for better search and discovery.

