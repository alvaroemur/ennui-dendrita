---
name: commercial-management
displayName: 💼 commercial-management
description: "Commercial management and proposals"
type: workspace-folder
created: 2025-01-19
updated: 2025-01-19
tags: ["workspace-folder", "sales", "proposals", "commercial-management", "CRM"]
category: company-management
---

# 💼 Commercial Management

This folder contains all commercial management documentation for the workspace, including proposal templates and proposals organized by pipeline stage and client/opportunity.

## Structure

```
💼 commercial-management/
├── templates/          # Reusable proposal templates
├── process/            # Commercial process documentation
└── proposals/          # Proposals organized by pipeline stage and client/opportunity
```

## Purpose

- **Centralize** all commercial documentation for the workspace
- **Organize** proposals by pipeline stage and client/opportunity
- **Facilitate** access to templates and reference documents
- **Maintain** clear history of won and lost proposals
- **Enable** easy movement of all documents for a single case between states

## Organization Paradigm

### Client/Opportunity Folders

Each proposal and its related documents are organized in folders by **client/opportunity** within each pipeline stage:

```
proposals/
├── 3-proposal-design/
│   └── [client-opportunity]/
│       ├── proposal-[client].md
│       └── [other related documents]
└── parking/
    └── [client-opportunity]/
        └── [all documents for this opportunity]
```

**Benefits:**
- All documents for a single case stay together
- Easy to move entire opportunity between pipeline stages
- Clear organization and traceability
- Scalable structure

### Pipeline Stages

Proposals are organized according to commercial process phases (adjust according to specific workspace process):

- **0-radar/** - Initial exploration opportunities
- **1-contact-initial/** - First interaction, identifying needs
- **2-diagnosis/** - Needs analysis and proposal preparation
- **3-proposal-design/** - Solution development and negotiation
- **4-negotiation/** - Active presentation and negotiation
- **parking/** - Paused or waiting opportunities
- **won/** - Won proposals (CRM standard)
- **lost/** - Lost proposals (CRM standard)

## Workflow

### Creating New Opportunity

1. **Create folder** in appropriate pipeline stage: `proposals/[stage]/[client-opportunity]/`
2. **Copy template** from `templates/` to the new folder
3. **Rename** proposal file with appropriate name
4. **Add** all related documents to the same folder

### Moving Between Stages

When an opportunity advances:
1. **Move entire folder** from current stage to new stage
2. **Update** pipeline document in `⚙️ company-management/🔄 pipeline.md` (if exists)
3. **Keep** all documents together in the same folder

## References

- **Pipeline of opportunities:** Document in `⚙️ company-management/` according to workspace needs
- **Commercial process:** Document in `process/` folder

## Conventions

- **Folder names:** Use format `[client]-[opportunity]` or `[client]` if clear
- **File names:** Use format `proposal-[client]-[date].md` or `proposal-[client]-[version].md`
- **Templates:** Keep in `templates/` for reuse
- **Process docs:** Keep in `process/` for commercial process documentation
- **Archiving:** Move entire opportunity folder to `won/` or `lost/` when closing
- **Folder names:** In English for system folders (consistent with WORKSPACE-STRUCTURE.md)

---

**Last updated:** 2025-01-19
