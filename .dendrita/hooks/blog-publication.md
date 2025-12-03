---
name: blog-publication
description: "blog-publication (BlogPublication)"
type: hook
created:
  2025-11-06T00:00:00.000Z
  
updated:
  2025-11-06T00:00:00.000Z
  
tags: ["hook", "behavior-reference"]
category: behavior-reference
---

# blog-publication (BlogPublication)

**Behavior reference:** Logic to validate and publish blog posts under `.dendrita/blog/`, update the blog index (`.dendrita/blog/README.md`), perform a scoped deploy (Git commit/push only for blog changes), and register journaling/tasks derived from the post.

This is a reference for Cursor. It documents expected behavior to APPLY, not executable code.

---

## Triggers

- Manual activation only, when the user requests it explicitly.
- Example prompts:
  - "publica el blog"
  - "publica el post de hoy"
  - "publica el post 2025-11-04"
  - "publica el post `.dendrita/blog/posts/2025-11-04-de-fork-a-metodologia.md`"

---

## Scope

- Location: `.dendrita/blog/`
- Affects:
  - `.dendrita/blog/posts/*.md`
  - `.dendrita/blog/posts/*.clippings.json` (clippings memory per post)
  - `.dendrita/blog/README.md` (index)
  - `.dendrita/blog/clippings/**/*.md` (clipping status updates)
- Deploy scope: commit y push SOLO de cambios del blog (no tocar otros directorios/archivos fuera de `.dendrita/blog/`)

---

## Validation Rules

When the hook is triggered, validate each target post (or the most recent one if none specified):

1. Filename pattern: `YYYY-MM-DD-slug.md`
   - `YYYY` in [1900, 2099]
   - `MM` in [01, 12]
   - `DD` in [01, 31]
2. Required metadata (at least one of these formats):
   - YAML front matter with: `title`, `date`, `author`, `categories` (array), optional `description`
   - OR Markdown header section with lines containing: `Fecha:`, `Autor:`, `Categorías:`. Title is taken from `#` H1.
3. Date consistency:
   - Date in filename must match the date in metadata.
4. Title presence:
   - First H1 (`# ...`) is the canonical title if `title` is not in front matter.
5. Description fallback:
   - If no explicit `description`, use the first non-empty paragraph after metadata as the description (truncate to ~160 chars for index).

If validation fails, stop and show a concise error list with guidance to fix.

---

## Index Update Rules (.dendrita/blog/README.md)

- Maintain a markdown table with columns: Date | Title | Description
- Insert or update the row for the post ensuring the table is sorted in reverse chronological order (newest first).
- Link title to the relative post path `./posts/YYYY-MM-DD-slug.md`.
- Normalize date to `YYYY-MM-DD`.
- Preserve existing rows and formatting.

Example row:

| 2025-11-04 | [De Fork a Metodología: El Origen de ennui-dendrita](./posts/2025-11-04-de-fork-a-metodologia.md) | Breve descripción del post (máx ~160 caracteres) |

---

## Deploy (scoped to blog)

- Goal: "actualizar GitHub con el blog, no tocar lo demás".
- Steps (conceptual, not executed here):
  1. Stage only blog files changed: `.dendrita/blog/README.md`, `.dendrita/blog/posts/…`
  2. Commit message: `blog: publish YYYY-MM-DD <slug>`
  3. Push current branch.
- Do NOT stage or commit non-blog changes.
- If CI/CD or static site host exists, this push can trigger a build; otherwise, the repo becomes the publication source.

---

## Clippings Memory Integration

After successful validation and index update:

1. Review clippings memory for the post:
   - Check if `[post-slug].clippings.json` exists in `.dendrita/blog/posts/`.
   - If exists, verify all referenced clippings are accessible and update their status to `used` if not already updated.
   - If clippings were used, update their status in the clipping files themselves.
   - Optionally archive used clippings (move status to `archived`).

2. If no clippings memory file exists:
   - Check if any clippings were referenced in the post content (search for clipping IDs or paths).
   - If found, create or update `[post-slug].clippings.json` with used clippings.
   - Update clipping statuses accordingly.

## Journaling Integration

After successful validation and index update:

1. Register an entry in journaling for the day (create if absent) or append to the open entry.
   - Entry content: brief summary of publication (date, title, slug, link).
   - Path and naming follow the existing journaling setup (see `journaling` hook). If unknown, ask user once and cache in profile.
2. Extract tasks from the post content (see Task Extraction) and register them:
   - Identify target workspace/project based on explicit mentions in the post.
   - If unambiguous: add to the project's `tasks.md` in appropriate section.
   - If ambiguous: ask the user to choose destination.
   - Add comment with origin: `<!-- Extracted from blog: YYYY-MM-DD, <slug> -->`.

---

## Task Extraction

Detect actionable tasks in the post using these patterns:

- Checklists: `- [ ] …`
- Imperatives: sentences starting with verbs ("definir", "preparar", "actualizar") with clear objects.
- Sections like "Próximos pasos", "Pendientes", "Acciones".
- Phrases: "Necesito …", "Debo …", "Voy a …".

For each task:
- Create a concise, verb-led item.
- Assign to the referenced workspace/project if specified; otherwise ask.
- Avoid duplicates by matching similar text recently added (same day/window).

---

## Output Summary (what Cursor should report)

After running the hook, provide a short summary:
- Validated post(s): filenames.
- Updated index: `.dendrita/blog/README.md` row(s) changed/added.
- Clippings: reviewed and updated clipping statuses (if any were used).
- Deploy action: commit message and push confirmation (or instructions if manual).
- Journaling: entry updated/created with date.
- Tasks: list of tasks created and their destination files.

---

## Safety and Idempotency

- Non-destructive edits: only update the blog index and targeted post metadata if needed.
- Re-running should not duplicate index rows.
- Abort if validation fails; do not modify files.
- Scope staging to `.dendrita/blog/**` on deploy.

---

## Related Documentation

- `.dendrita/hooks/README.md` — Hooks overview
- `.dendrita/hooks/journaling.md` — Journaling behavior and task registration
- `.dendrita/hooks/blog-clipping-creation.md` — Clipping creation and memory system
- `.dendrita/WORKSPACE-STRUCTURE.md` — Workspace standards
- `.dendrita/users/[user-id]/profile.json` — For caching journaling target and preferences

---

## Notes for Cursor

- This file is a behavior reference. Read and apply the documented logic when the user requests blog publication.
- Do not attempt to execute deploy; describe the commit/push steps and perform only file edits in-repo.
- Respect the user's instruction: publish only blog-related changes.


