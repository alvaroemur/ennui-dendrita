---
name: work-paradigm
description: "Work Paradigm for dendrita Workspaces"
type: documentation
created: 2025-12-02
updated: 2025-12-02
tags: ["documentation", "paradigm", "work", "workspace"]
category: infrastructure
---

# Work Paradigm for dendrita Workspaces

This document describes the unified work paradigm that governs how work is organized across all workspace areas in dendrita: projects, company management, commercial management, products, stakeholders, and tools.

---

## Overview

The dendrita work paradigm organizes work across six main areas:

1. **Project Management** (🚀 active-projects) - Active project execution
2. **Company Management** (⚙️ company-management) - General workspace management
3. **Commercial Management** (💼 commercial-management) - Sales and proposals
4. **Products** (📦 products) - Product portfolio
5. **Stakeholders** (🤝 stakeholders) - Allies and stakeholder management
6. **Tools & Templates** (🛠️ tools-templates) - Reusable tools

All areas follow consistent principles while serving distinct purposes.

---

## 1. Project Management

### Location

`workspaces/[workspace]/🚀 active-projects/[project]/`

### Structure

Each project must have:

- **`master-plan.md`** - Strategic plan and project vision
- **`tasks.md`** - Task list with status tracking
- **`project_context.json`** - Unified project context (generated from master-plan.md and tasks.md)
- **`current-context.md`** - (Optional, legacy) Current context (being migrated to project_context.json)

### Workflow

1. **Project Creation:**
   - Create project folder in `🚀 active-projects/`
   - Create `master-plan.md` with strategic vision
   - Create `tasks.md` with initial tasks
   - Generate `project_context.json` using `update-project-context.ts`

2. **Project Execution:**
   - Update `tasks.md` as work progresses
   - Update `master-plan.md` for strategic changes
   - Run `update-project-context.ts` to sync JSON context
   - Context propagates to user and workspace contexts

3. **Project Completion:**
   - Move project to `.archived-projects/`
   - Final context update
   - Archive project documents

### Context System

Projects use the unified context system:

- **Source files:** `master-plan.md`, `tasks.md` (and optionally `current-context.md`)
- **Generated:** `project_context.json` (combines all source files)
- **Propagation:** Project context → User context → Workspace context
- **Update command:** `tsx .dendrita/integrations/scripts/pipelines/context-pipeline/update-project-context.ts`

### Key Principles

- **Strategic planning:** `master-plan.md` defines the vision
- **Task tracking:** `tasks.md` tracks execution
- **Context continuity:** `project_context.json` maintains context across sessions
- **Status tracking:** Tasks have clear status (pending, in-progress, blocked, completed)

---

## 2. Company Management

### Location

`workspaces/[workspace]/⚙️ company-management/`

### Purpose

General management documents that don't belong to a specific project:
- Project dashboard and pipeline
- Strategic planning
- Workspace-level documentation
- Best practices and methodologies

### Structure

```
⚙️ company-management/
├── 📚 best-practices/       # Templates and methodologies
│   └── [project-type]/      # Folders by project type
│       └── README.md        # Methodology documentation
├── config/                  # Configuration files
├── data/                    # Generated data files
├── dashboards/              # HTML dashboards
└── docs/                    # Additional documentation
```

### Best Practices

**Location:** `⚙️ company-management/📚 best-practices/`

- **Purpose:** Templates and workspace-specific methodologies
- **Content:** Folders by project type with README.md explaining the methodology
- **Example:** `sustainability-diagnostic/README.md` documents the sustainability diagnostic methodology

### Key Principles

- **Reusability:** Best practices can be applied across multiple projects
- **Documentation:** Each methodology should have clear README.md
- **Workspace-specific:** Tailored to the workspace's domain and needs

---

## 3. Commercial Management

### Location

`workspaces/[workspace]/💼 commercial-management/`

### Purpose

Commercial management, sales proposals, and CRM organization following industry-standard pipeline patterns.

### Structure

```
💼 commercial-management/
├── templates/               # Reusable proposal templates
├── process/                 # Commercial process documentation
└── proposals/               # Proposals organized by pipeline stage
    ├── 0-radar/
    ├── 1-contact-initial/
    ├── 2-diagnosis/
    ├── 3-proposal-design/
    ├── 4-negotiation/
    ├── parking/
    ├── won/
    └── lost/
```

### Fundamental Principles

#### 1. Separation of Templates and Active Proposals

**Templates** (`templates/`):
- Reusable documents
- Base structures for creating new proposals
- Methodologies and writing guides
- Do not contain client-specific information

**Proposals** (`proposals/`):
- Client/opportunity-specific documents
- Organized by pipeline stage
- Organized by client/opportunity folders
- Contain confidential commercial information
- Move between folders as process advances

#### 2. Organization by Pipeline Stage and Client/Opportunity

Proposals are organized in folders that reflect their state in the commercial process, with **each opportunity having its own folder** containing all related documents:

```
proposals/
├── 0-radar/
│   └── [client-opportunity]/
│       └── [all documents for this opportunity]
├── 1-contact-initial/
│   └── [client-opportunity]/
│       └── [all documents for this opportunity]
├── 2-diagnosis/
│   └── [client-opportunity]/
│       └── [all documents for this opportunity]
├── 3-proposal-design/
│   └── [client-opportunity]/
│       ├── proposal-[client].md
│       ├── proposal-[client]-brochure.md
│       └── [other related documents]
├── 4-negotiation/
│   └── [client-opportunity]/
│       └── [all documents for this opportunity]
├── parking/
│   └── [client-opportunity]/
│       └── [all documents for this opportunity]
├── won/
│   └── [client-opportunity]/
│       └── [all documents for this opportunity]
└── lost/
    └── [client-opportunity]/
        └── [all documents for this opportunity]
```

#### 3. Alignment with CRM Standards

This paradigm follows common patterns from CRM systems (Salesforce, HubSpot, Pipedrive):

- **Numbered stages** for logical process order
- **Won/lost separation** for conversion analysis
- **Parking folder** for paused opportunities
- **English names** for system folders
- **Client/opportunity folders** for complete case organization

### Workflow

#### Creating a Proposal

1. **Create client/opportunity folder** in appropriate pipeline stage: `proposals/[stage]/[client-opportunity]/`
2. **Copy template** from `templates/` to the new folder
3. **Rename** with format: `proposal-[client]-[date].md`
4. **Complete** client-specific information
5. **Add** all related documents (emails, notes, versions) to the same folder

#### Moving Between Stages

When an opportunity advances, **move the entire client/opportunity folder** between pipeline stages:

```
0-radar/[client-opportunity]/ 
  → 1-contact-initial/[client-opportunity]/ 
  → 2-diagnosis/[client-opportunity]/ 
  → 3-proposal-design/[client-opportunity]/ 
  → 4-negotiation/[client-opportunity]/ 
  → won/[client-opportunity]/ or lost/[client-opportunity]/
```

Or move to `parking/[client-opportunity]/` if temporarily paused.

**Key benefit:** All documents for a single case stay together and move as one unit.

#### Final Archiving

When an opportunity closes:
- **Won**: Move entire folder to `won/[client-opportunity]/` (may convert to active project)
- **Lost**: Move entire folder to `lost/[client-opportunity]/` (useful for analysis and learning)

### Conventions

#### Client/Opportunity Folder Naming

**Format:**
```
[client]-[opportunity]
[client]
```

**Examples:**
- `grifos-espinoza/` - Clear client name
- `norsac-sop-improvement/` - Client and specific opportunity
- `empresa-conservera-erika-riepl/` - Full company name

**Rules:**
- Use lowercase
- Hyphens as separators
- Descriptive but concise
- Include opportunity name if multiple opportunities with same client

#### File Naming

**Format:**
```
proposal-[client]-[date].md
proposal-[client]-v[version].md
proposal-[client]-[type].md
```

**Examples:**
- `proposal-norsac-2025-01.md`
- `proposal-grifos-espinoza-v2.md`
- `proposal-cliente-x-brochure.md`

### Advantages

- **Complete case organization:** All documents for a single opportunity in one place
- **Easy movement:** Move entire opportunity folder with one action
- **Traceability:** Easy tracking of each opportunity's state
- **Scalability:** Easy to add new opportunities without disorganization
- **Analysis:** History in `won/` and `lost/` enables conversion analysis
- **Industry standard:** Aligned with common CRM practices

### Use Cases

- **Workspace with active commercial activity:** Use complete structure with all stages
- **Workspace with sporadic commercial activity:** Minimal structure sufficient
- **Workspace without commercial activity:** Not necessary to create this structure

---

## 4. Products

### Location

`workspaces/[workspace]/📦 products/`

### Purpose

Products portfolio and product documentation. Products are reusable offerings (services, tools, content, etc.) that can be delivered across multiple projects.

### Structure

```
📦 products/
├── [product-name]/
│   └── README.md            # Product documentation
└── README.md                 # Products portfolio overview
```

### Key Principles

- **Reusability:** Products can be delivered across multiple projects
- **Documentation:** Each product should have clear README.md
- **Portfolio view:** Products folder provides overview of all offerings

---

## 5. Stakeholders

### Location

`workspaces/[workspace]/🤝 stakeholders/`

### Purpose

Allies management, stakeholders, and governance.

### Structure

```
🤝 stakeholders/
├── allies-mapping.md         # Mapping of allies and relationships
├── projects-governance.md    # Governance documentation
└── README.md                 # Stakeholder management overview
```

### Key Principles

- **Relationship mapping:** Track relationships with allies and stakeholders
- **Governance:** Document governance structures and agreements
- **Strategic alignment:** Align stakeholders with workspace goals

---

## 6. Tools & Templates

### Location

`workspaces/[workspace]/🛠️ tools-templates/`

### Purpose

Reusable templates and tools that can be used across projects and work areas.

### Structure

```
🛠️ tools-templates/
├── [tool-name]/              # Tool folders
│   └── README.md            # Tool documentation
└── README.md                 # Tools overview
```

### Key Principles

- **Reusability:** Tools can be used across multiple projects
- **Documentation:** Each tool should have clear documentation
- **Workspace-specific:** Tools tailored to workspace needs

---

## Cross-Area Principles

### 1. Consistent Structure

All areas follow consistent naming and organization:
- **English** for system folder names
- **README.md** for documentation
- **Clear purpose** for each area

### 2. Context Integration

All areas integrate with the context system:
- Projects generate `project_context.json`
- Context propagates to user and workspace levels
- Work status reports consolidate information

### 3. Documentation Standards

All areas require documentation:
- README.md files explain purpose
- Best practices are documented
- Processes are clearly defined

### 4. Separation of Concerns

Each area has a distinct purpose:
- **Projects:** Execution and delivery
- **Company:** General management
- **Commercial:** Sales and proposals
- **Products:** Reusable offerings
- **Stakeholders:** Relationship management
- **Tools:** Reusable utilities

---

## Workflow Integration

### Creating New Work

1. **Identify area:** Determine which area the work belongs to
2. **Follow structure:** Use the appropriate structure for that area
3. **Document:** Create necessary README.md files
4. **Update context:** Run context update scripts if applicable

### Moving Work Between Areas

- **Proposal → Project:** Move from `won/` to `🚀 active-projects/`
- **Project → Archive:** Move from `🚀 active-projects/` to `.archived-projects/`
- **Best Practice → Template:** Extract methodology to `📚 best-practices/`

---

## References

- **Workspace Structure:** `.dendrita/docs/WORKSPACE-STRUCTURE.md` - Standard workspace structure
- **Context System:** `.dendrita/docs/CONTEXT-SYSTEM-COMPARISON.md` - Context system documentation
- **Workspace Template:** `.dendrita/templates/workspace-template/` - Reference template
- **Commercial Example:** `workspaces/🌸 inspiro/💼 commercial-management/` - Implemented example

---

**Last updated:** 2025-12-02  
**Version:** 1.0

