---
name: proposals-commercial-management
displayName: Commercial Proposals
description: "Proposals organized by pipeline stage and client/opportunity"
type: workspace-folder
created: 2025-01-19
updated: 2025-01-19
tags: ["workspace-folder", "proposals", "sales", "pipeline"]
category: company-management
---

# Commercial Proposals

This folder contains all commercial proposals, organized by pipeline stage and client/opportunity.

## Organization Structure

Each proposal and its related documents are organized in **client/opportunity folders** within each pipeline stage:

```
proposals/
├── 0-radar/
│   └── [client-opportunity]/
│       └── [documents...]
├── 1-contact-initial/
│   └── [client-opportunity]/
│       └── [documents...]
├── 2-diagnosis/
│   └── [client-opportunity]/
│       └── [documents...]
├── 3-proposal-design/
│   └── [client-opportunity]/
│       └── [documents...]
├── 4-negotiation/
│   └── [client-opportunity]/
│       └── [documents...]
├── parking/
│   └── [client-opportunity]/
│       └── [documents...]
├── won/
│   └── [client-opportunity]/
│       └── [documents...]
└── lost/
    └── [client-opportunity]/
        └── [documents...]
```

## Pipeline Stages

### 0-radar/
Initial exploration opportunities. Contacts and leads that haven't entered the formal commercial process yet.

### 1-contact-initial/
First interaction with potential client. Initial needs identification and fit validation.

### 2-diagnosis/
Deep analysis of client needs. Information preparation for proposal. Includes interviews, requirements, and preliminary analysis.

### 3-proposal-design/
Solution development and proposal design. Includes methodological drafts, costing, and internal validation.

### 4-negotiation/
Proposals sent and in negotiation process. Client presentation, doubt resolution, and final adjustments.

### parking/
Paused or waiting opportunities. Clients who have requested to postpone decision or projects on stand-by.

### won/
Won proposals. Projects that have been approved and are in execution process or already executed.

### lost/
Lost proposals. Opportunities that didn't materialize. Useful for analysis and learning.

## Client/Opportunity Folder Naming

**Format:**
```
[client]-[opportunity]
[client]
```

**Examples:**
- `grifos-espinoza/` - Clear client name
- `norsac-sop-improvement/` - Client and specific opportunity
- `empresa-conservera-erika-riepl/` - Full company name

## Workflow

### Creating New Opportunity

1. **Create folder** in appropriate pipeline stage: `proposals/[stage]/[client-opportunity]/`
2. **Copy template** from `../templates/` to the new folder
3. **Rename** proposal file appropriately
4. **Add** all related documents (emails, notes, versions) to the same folder

### Moving Between Stages

When an opportunity advances:
1. **Move entire folder** from current stage to new stage
2. **Update** pipeline in `⚙️ company-management/🔄 pipeline.md` (if exists)
3. **All documents** stay together in the same folder

### Final Archiving

When opportunity closes:
- **Won**: Move folder to `won/`
- **Lost**: Move folder to `lost/`

## Benefits of Client/Opportunity Organization

- **All documents together**: All files for a single case in one place
- **Easy movement**: Move entire opportunity between stages with one action
- **Clear traceability**: Complete history of each opportunity
- **Scalable**: Structure grows in organized way
- **No document loss**: Related documents always stay together

## References

- **Pipeline:** Document in `⚙️ company-management/` according to workspace needs
- **Commercial process:** Document in `../process/` folder
- **Templates:** `../templates/`

---

**Last updated:** 2025-01-19
