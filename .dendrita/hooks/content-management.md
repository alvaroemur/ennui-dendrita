---
name: content-management
description: "content-management (ContentManagement)"
type: hook
created: 2025-12-02T00:00:00.000Z
updated: 2025-12-02T00:00:00.000Z
tags: ["hook", "behavior-reference"]
category: behavior-reference
---

# content-management (ContentManagement)

**Behavior reference:** Logic to create and manage content across multiple channels (blog, Reddit, LinkedIn, GitHub, etc.), including clippings creation, draft management, publication workflow, and tracking of published content.

This is a reference for Cursor. It documents expected behavior to APPLY, not executable code.

---

## Overview

This hook generalizes content creation and publication across multiple channels:
- **Clippings**: Ideas and notes extracted from work sessions
- **Drafts**: Content in development (NO date in filename)
- **Published**: Published content (date/slug format depends on channel)
- **Tracking**: Centralized registry of all publications with URLs/slugs

---

## Concepts

### Channels

A **channel** is a platform or medium where content is published:
- `blog` - Blog posts (e.g., dendrita blog, iami blog)
- `reddit` - Reddit posts and comments
- `linkedin` - LinkedIn posts and articles
- `github` - GitHub issues, PRs, releases, discussions
- `twitter` - Twitter/X posts
- `instagram` - Instagram posts
- Custom channels as needed

### Subchannels

A **subchannel** is a specific instance within a channel:
- Blog: `dendrita`, `iami`, `ennui`
- Reddit: `r/projectmanagement`, `r/opensource`
- LinkedIn: `personal`, `company`
- GitHub: `issues`, `releases`, `discussions`

### Content Flow

```
Clippings → Drafts → Published → Tracking
```

1. **Clippings**: Ideas extracted from work sessions
2. **Drafts**: Content being developed (no date in filename)
3. **Published**: Content published to channel (format depends on channel)
4. **Tracking**: Registry with slug/URL and metrics

---

## Structure

### Standard Content Structure

```
workspaces/[workspace]/🚀 active-projects/[project]/
└── comms/                          # Communication area (optional)
    └── content/
        ├── clippings/              # Ideas and notes
        │   └── [channel]/          # Optional: clippings by channel
        │       └── [YYYY-MM]/
        │           └── YYYY-MM-DD-HHmm-[descripcion]-clipping.md
        ├── drafts/                 # Content in development
        │   ├── blog/
        │   │   └── [subchannel]/   # e.g., dendrita, iami
        │   │       └── [slug].md   # NO date in filename
        │   ├── reddit/
        │   │   └── [slug].md
        │   ├── linkedin/
        │   │   └── [slug].md
        │   └── [other-channel]/
        ├── published/               # Published content
        │   ├── blog/
        │   │   └── [subchannel]/
        │   │       └── YYYY-MM-DD-[slug].md  # WITH date when published
        │   ├── reddit/
        │   │   └── [slug].md       # Format depends on channel
        │   ├── linkedin/
        │   │   └── [slug].md
        │   └── tracking.json       # Centralized publication registry
        └── config/
            ├── channels.json       # Channel definitions
            └── [channel]-config.md # Channel-specific config
```

---

## Part 1: Clippings Creation

### CRITICAL: Clipping Location

**Clippings MUST be saved in the project's content structure, organized by channel.**

### Location Detection Logic

1. **Identify project context:**
   - From source reference: `workspaces/[workspace]/🚀 active-projects/[project-name]/...`
   - From current working directory
   - From user prompt (if explicitly mentioned)

2. **Determine channel:**
   - **Explicit:** If user specifies channel (e.g., "clipping para blog dendrita")
   - **Inference:** From context tags, categories, or metadata
   - **Default:** `blog` if project has blog structure

3. **Determine base path:**
   - **Priority 1:** `workspaces/[workspace]/🚀 active-projects/[project]/comms/content/clippings/[channel]/`
   - **Priority 2:** `workspaces/[workspace]/🚀 active-projects/[project]/content/clippings/[channel]/`
   - **Priority 3:** `workspaces/[workspace]/🚀 active-projects/[project]/clippings/[channel]/`

### Clipping File Structure

**Filename format:**
- `YYYY-MM-DD-HHmm-[descripcion]-clipping.md`
- `YYYY-MM-DD`: Date of creation
- `HHmm`: Time of creation in 24-hour format without separator
- `[descripcion]`: Descriptive slug (kebab-case, max 50 chars)

**Frontmatter:**
```yaml
---
id: [hash]
created: YYYY-MM-DDTHH:mm:ssZ
updated: YYYY-MM-DDTHH:mm:ssZ
source: [filepath]
source_context: [workspace/project/document description]
channel: blog|reddit|linkedin|github|...
subchannel: [subchannel-name]  # Optional
tags: [array of tags]
categories: [array of categories]
status: draft
---
```

### Update Clipping Index

**Location:** `clippings/[channel]/README.md` (if channel-specific) or `clippings/README.md` (general)

Maintain a markdown table with columns: Date | Source | Channel | Purpose | Tags | Status | Link

---

## Part 2: Draft Creation

### Draft Location

**Drafts MUST be saved without date in filename. Date information goes in frontmatter.**

### Location Detection

1. **Identify project:**
   - From source reference or current context
   - Ask user if ambiguous

2. **Determine channel:**
   - **Explicit:** User specifies channel in prompt
   - **From metadata:** `channel` field in frontmatter
   - **Inference:** From context or content type
   - **Default:** `blog` if ambiguous

3. **Determine subchannel (if applicable):**
   - **Blog:** Determine blog name (e.g., `dendrita`, `iami`)
   - **Reddit:** Determine subreddit (optional, can be set later)
   - **LinkedIn:** Determine account type (optional)

4. **Final path:**
   ```
   content/drafts/[channel]/[subchannel]/[slug].md
   ```
   Or for channels without subchannels:
   ```
   content/drafts/[channel]/[slug].md
   ```

### Draft File Structure

**Filename format:**
- `[slug].md` - NO date in filename
- `[slug]`: Descriptive slug derived from title (kebab-case)

**Frontmatter:**
```yaml
---
title: "Título del contenido"
description: "Descripción breve"
channel: blog|reddit|linkedin|github|...
subchannel: [subchannel-name]  # Optional
status: draft
created: YYYY-MM-DDTHH:mm:ssZ
updated: YYYY-MM-DDTHH:mm:ssZ
tags: []
categories: []
---
```

**IMPORTANT:**
- Drafts NEVER have date in filename
- `created` and `updated` are in frontmatter
- Date in filename is added ONLY when publishing

---

## Part 3: Publication

### Publication Workflow

1. **Validate draft:**
   - Check required fields in frontmatter
   - Validate channel-specific requirements
   - Ensure content is complete

2. **Determine publication format:**
   - Each channel has its own format rules
   - See "Channel-Specific Rules" below

3. **Migrate draft to published:**
   - Copy from `drafts/[channel]/[subchannel]/[slug].md`
   - To `published/[channel]/[subchannel]/[formato-segun-canal]`
   - Update frontmatter with publication metadata

4. **Update tracking:**
   - Add entry to `published/tracking.json`
   - Include slug/URL if available
   - Include metrics if available

5. **Update channel-specific indexes:**
   - Blog: Update `.dendrita/blog/README.md`
   - Reddit: Update `published/reddit/README.md` (if exists)
   - Other channels: Update their respective indexes

### Channel-Specific Publication Rules

#### Blog Channel

**Draft location:** `drafts/blog/[subchannel]/[slug].md`

**Published location:** 
- `.dendrita/blog/posts/YYYY-MM-DD-[slug].md` (for dendrita blog)
- OR `published/blog/[subchannel]/YYYY-MM-DD-[slug].md` (for other blogs)

**Filename format:** `YYYY-MM-DD-[slug].md`
- Date comes from `created` field in draft frontmatter
- Or use publication date if different

**Frontmatter (published):**
```yaml
---
title: "Título"
description: "Descripción"
channel: blog
subchannel: dendrita
status: published
created: 2025-11-06T00:00:00.000Z
updated: 2025-12-02T00:00:00.000Z
published_at: 2025-12-02T10:00:00.000Z
date: 2025-12-02
author: [author-name]
categories: []
tags: []
slug: "2025-12-02-dendrita-para-amigos"
url: "./posts/2025-12-02-dendrita-para-amigos.md"  # Relative or absolute
---
```

**Validation:**
- Filename must match `YYYY-MM-DD-[slug].md` pattern
- Date in filename must match `date` or `published_at` in frontmatter
- Title is required
- Description is recommended

#### Reddit Channel

**Draft location:** `drafts/reddit/[slug].md`

**Published location:** `published/reddit/[slug].md` (same name, updated with metadata)

**Filename format:** `[slug].md` (no date, uses Reddit post ID as slug)

**Frontmatter (published):**
```yaml
---
title: "Post title"
channel: reddit
subchannel: r/projectmanagement
status: published
created: 2025-11-04T00:00:00.000Z
updated: 2025-11-04T04:27:39.000Z
published_at: 2025-11-04T04:27:39.000Z
slug: "1ony5uo"  # Reddit post ID
url: "https://reddit.com/r/projectmanagement/comments/1ony5uo/..."
permalink: "/r/projectmanagement/comments/1ony5uo/..."
score: 0
num_comments: 4
---
```

**Validation:**
- `subchannel` (subreddit) is required
- Title is required
- Content is required
- Slug should be Reddit post ID if available

#### LinkedIn Channel

**Draft location:** `drafts/linkedin/[slug].md`

**Published location:** `published/linkedin/[slug].md`

**Filename format:** `[slug].md` (no date, uses LinkedIn post ID or slug)

**Frontmatter (published):**
```yaml
---
title: "Post title"
channel: linkedin
subchannel: personal|company
status: published
created: 2025-12-02T00:00:00.000Z
updated: 2025-12-02T10:00:00.000Z
published_at: 2025-12-02T10:00:00.000Z
slug: "linkedin-post-id"
url: "https://linkedin.com/posts/..."
---
```

#### GitHub Channel

**Draft location:** `drafts/github/[slug].md`

**Published location:** `published/github/[slug].md`

**Filename format:** `[slug].md` (uses issue/PR number or release tag)

**Frontmatter (published):**
```yaml
---
title: "Issue/PR/Release title"
channel: github
subchannel: issues|prs|releases|discussions
status: published
created: 2025-12-02T00:00:00.000Z
updated: 2025-12-02T10:00:00.000Z
published_at: 2025-12-02T10:00:00.000Z
slug: "123"  # Issue/PR number or release tag
url: "https://github.com/owner/repo/issues/123"
repository: "owner/repo"
---
```

---

## Part 4: Tracking

### Tracking File Structure

**Location:** `content/published/tracking.json`

**Structure:**
```json
{
  "publications": [
    {
      "id": "unique-id",
      "channel": "blog|reddit|linkedin|github|...",
      "subchannel": "dendrita|r/projectmanagement|...",
      "title": "Título del contenido",
      "slug": "slug-o-id-del-contenido",
      "url": "https://...",
      "published_at": "2025-12-02T10:00:00.000Z",
      "draft_file": "drafts/[channel]/[subchannel]/[slug].md",
      "published_file": "published/[channel]/[subchannel]/[formato].md",
      "metrics": {
        "score": 0,
        "comments": 0,
        "views": 0,
        "likes": 0
      },
      "last_updated": "2025-12-02T10:00:00.000Z"
    }
  ],
  "last_updated": "2025-12-02T10:00:00.000Z"
}
```

### Tracking Rules

1. **On publication:**
   - Create new entry in `publications` array
   - Generate unique `id` (UUID or hash)
   - Include all available metadata
   - Set `published_at` to current timestamp

2. **On update:**
   - Find entry by `id` or `slug`
   - Update `metrics` if available
   - Update `last_updated` timestamp
   - Preserve original `published_at`

3. **Slug/URL priority:**
   - **Blog:** Slug = `YYYY-MM-DD-[slug]`, URL = relative path or absolute if hosted
   - **Reddit:** Slug = Reddit post ID, URL = Reddit permalink
   - **LinkedIn:** Slug = LinkedIn post ID, URL = LinkedIn post URL
   - **GitHub:** Slug = issue/PR number or release tag, URL = GitHub URL

---

## Triggers

### Clipping Creation
- "crea un clipping de esto"
- "guarda esto como idea para [canal]"
- "clipping de esta sesión"
- "crea nota de [canal] de [contexto específico]"

### Draft Creation
- "crea un borrador para [canal]"
- "draft de [título] para [canal]"
- "prepara contenido para [canal]"

### Publication
- "publica [draft] en [canal]"
- "publica el post de [canal]"
- "publica [slug] en [canal]"

---

## Examples

### Example 1: Blog Publication Flow

1. **Clipping created:**
   - Location: `comms/content/clippings/blog/2025-11/2025-11-06-0957-dendrita-para-amigos-clipping.md`
   - Frontmatter includes `channel: blog`, `subchannel: dendrita`

2. **Draft created from clipping:**
   - Location: `comms/content/drafts/blog/dendrita/dendrita-para-amigos.md`
   - Frontmatter: `created: 2025-11-06T00:00:00.000Z`, `status: draft`

3. **Draft published:**
   - Migrated to: `.dendrita/blog/posts/2025-12-02-dendrita-para-amigos.md`
   - Frontmatter updated: `published_at: 2025-12-02T10:00:00.000Z`, `status: published`
   - Tracking entry: `{ channel: "blog", subchannel: "dendrita", slug: "2025-12-02-dendrita-para-amigos", url: "./posts/2025-12-02-dendrita-para-amigos.md" }`

### Example 2: Reddit Publication Flow

1. **Draft created:**
   - Location: `comms/content/drafts/reddit/intro-dendrita.md`
   - Frontmatter: `channel: reddit`, `subchannel: r/projectmanagement`

2. **Draft published:**
   - Migrated to: `comms/content/published/reddit/intro-dendrita.md` (same name)
   - Frontmatter updated with Reddit post ID and URL
   - Tracking entry: `{ channel: "reddit", subchannel: "r/projectmanagement", slug: "1ony5uo", url: "https://reddit.com/..." }`

### Example 3: iami Content (Future)

```
workspaces/🍪 iami/🚀 active-projects/[project]/comms/content/
├── drafts/
│   ├── blog/
│   │   └── iami/
│   │       └── energy-balls-receta.md
│   └── instagram/
│       └── post-producto-nuevo.md
└── published/
    └── tracking.json
```

---

## Safety and Idempotency

- Non-destructive: drafts are copied (not moved) when publishing
- Re-running publication should not duplicate tracking entries
- Validate all required fields before publication
- Abort if validation fails; do not modify files

---

## Related Documentation

- `.dendrita/hooks/README.md` — Hooks overview
- `.dendrita/blog/README.md` — Blog structure (for blog channel)
- `.dendrita/WORKSPACE-STRUCTURE.md` — Workspace standards

---

## Notes for Cursor

- This file is a behavior reference. Read and apply the documented logic when the user requests content management operations.
- **CRITICAL:** Drafts NEVER have date in filename. Date is added ONLY when publishing.
- Always update `tracking.json` when publishing content.
- Support multiple channels and subchannels per project.
- Maintain channel-specific validation rules and formats.

---

**Last Updated:** 2025-12-02

