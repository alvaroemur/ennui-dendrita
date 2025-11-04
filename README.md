# ennui-dendrita

**dendrita**

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Latest Commit](https://img.shields.io/github/last-commit/ennui-dendrita/ennui-dendrita)](https://github.com/ennui-dendrita/ennui-dendrita)
[![Platform](https://img.shields.io/badge/Platform-Google%20Apps%20Script%20%7C%20Cursor%20%7C%20ChatGPT-blue.svg)](https://github.com/ennui-dendrita/ennui-dendrita)
[![Code of Conduct](https://img.shields.io/badge/Contributor%20Covenant-v1.4%20adopted-ff69b4.svg)](CODE_OF_CONDUCT.md)

Project management and business operations system adapted from infrastructure best practices, designed specifically for managing multiple business operations projects.

The coordinating center of the work ecosystem is a dendrite that integrates information into structured decisions and actions.

---

## 📌 Using as Template

**ennui-dendrita** is designed to be used as a template for other projects and organizations. You can:

1. **Use it directly:** Clone or fork this repository as a starting point for your own multi-project management system
2. **Adapt it:** Modify the structure, methodologies, and workspaces to fit your company or context
3. **Contribute back:** If you improve the methodology, consider contributing your enhancements via [Pull Request](CONTRIBUTING.md)

### Quick Start for Template Users

1. **Fork this repository** to your account
2. **Update the LICENSE** with your organization's information
3. **Create your company workspace:** `workspaces/[your-company]/`
4. **Customize:**
   - `README.md` - Update for your context
   - `.dendrita/settings.json` - Add your project metadata
   - `workspaces/[your-company]/config-estilo.json` - Define your style guidelines
5. **Start creating projects** following the structure in `.dendrita/templates/workspace-template/`

### Topics & Tags

This project is tagged with: `template` `project-management` `impact` `melt` `sustainability` `workspaces` `docs-as-code` `cursor` `chatgpt`

---

## 🎯 What is this?

A practical methodology that allows you to:

- ✅ **Manage multiple projects simultaneously** without losing track
- ✅ **Maintain continuity between sessions** with ChatGPT or other tools
- ✅ **Apply best practices** automatically based on project type
- ✅ **Report and document** systematically and consistently
- ✅ **Orchestrate teams and partners** with clarity and governance

---

## 🚀 Quick Start

### For a new project

1. **Identify the company you're working under:**
   - Create your own workspace name (e.g., `my-company`, `workspace-1`)
   - Use any name that identifies your organization or context

2. **Create the project folder:**
   ```
   workspaces/[nombre-empresa]/active-projects/[nombre-proyecto]/
   ```

3. **Create the 3 base files:**
   - `master-plan.md` - Project master plan
   - `current-context.md` - Current status and decisions
   - `tasks.md` - Task list with status

4. **Use the corresponding template:**
   - Review `.dendrita/templates/workspace-template/best-practices/` for your project type
   - Copy the template as a base

### First-time setup (Repository initialization)

When you first open this repository or when Cursor detects it's empty:

1. **Cursor will ask you basic questions:**
   - Your user identifier (e.g., `user-1`, `juan`, `team-1`)
   - Your primary workspace (create any name you prefer)
   - Your primary work type (project-manager, sustainability-strategist, mel-analyst, stakeholder-facilitator, fundraising-specialist)
   - Communication style preferences
   - Update frequency preferences

2. **A user profile will be created:**
   - Saved in `.dendrita/users/[user-id]/`
   - Contains your preferences and work context
   - Allows Cursor to personalize its behavior

3. **Workspace-specific profiles:**
   - You can create profiles for specific workspaces
   - Profiles activate automatically when working in that workspace
   - See `.dendrita/users/README.md` for more information

**For more details:** See `.dendrita/hooks/repo-initialization.md` and `.dendrita/users/README.md`

### For general business management

Use `company-management/` for topics that don't belong to a specific project:
- Annual strategic planning
- Human resources management
- Internal process improvement
- Financial planning

---

## 📁 Folder Structure

```
ennui-dendrita/
├── README.md                           # This file
│
├── workspaces/                           # Projects organized by company
│   ├── [workspace-name]/                # Your workspace
│   │   ├── active-projects/
│   │   ├── archived-projects/
│   │   ├── best-practices/              # Templates and methodologies
│   │   ├── products/                    # Products portfolio
│   │   ├── stakeholders/                # Relationship management
│   │   ├── tools-templates/            # Reusable tools
│   │   └── company-management/         # General management
│   └── template/                        # Workspace template (reference)
│
├── .dendrita/templates/workspace-template/  # Workspace template reference
│   ├── best-practices/                 # Example methodologies
│   ├── products/                      # Example products structure
│   ├── stakeholders/                  # Example stakeholder structure
│   └── tools-templates/               # Example tools
│
├── .dendrita/users/[user-id]/agents/  # Specialized agents (per user)
│   ├── sustainability-strategist.md
│   ├── project-manager.md
│   ├── mel-analyst.md
│   ├── stakeholder-facilitator.md
│   └── fundraising-specialist.md
│
└── .dendrita/                       # Reflexive metadata (ALWAYS review first)
    ├── users/                       # User profiles and preferences
    │   ├── [user-id]/               # User folders (created during initialization)
    │   │   ├── profile.json         # Default user profile
    │   │   ├── profiles/            # Additional profiles
    │   │   └── workspace-defaults.json
    │   └── README.md                 # User system documentation
    ├── skills/                      # Contextual knowledge skills
    ├── agents/                      # Specialized agents
    ├── hooks/                       # Behavior references (NOT executable)
    └── settings.json                # Project metadata
```

---

## 🔄 Workflow

### 1. Project Initiation

```
1. Identify the company you're working under (create your workspace name)
2. Identify the project type
3. Review the template in `.dendrita/templates/workspace-template/best-practices/`
4. Create folder in `workspaces/[workspace-name]/active-projects/[project-name]/`
5. Generate the 3 files using the template
6. Update current-context.md frequently
```

### 2. During Execution

```
1. Review current-context.md at the start of each session
2. Mark completed tasks in tasks.md
3. Update current-context.md after important decisions
4. Use `.dendrita/users/[user-id]/agents/` when you need specific expertise
```

### 3. Project Completion

```
1. Complete final reports
2. Archive the project: mv workspaces/[empresa]/active-projects/[proyecto] workspaces/[empresa]/archived-projects/
3. Document learnings in best-practices/
4. Update partner mapping if applicable
```

---

## 📋 Persistent Documents System

Each project uses **3 key files** that maintain state:

### `master-plan.md`
- Executive summary
- Project phases
- Success metrics
- Timeline
- Risks and mitigations

### `current-context.md` ⚠️ UPDATE FREQUENTLY
- **SESSION PROGRESS** (date)
  - ✅ Completed
  - 🟡 In progress
  - ⚠️ Blockers
- Key decisions
- Important files
- Next steps

### `tasks.md`
- Checklist by phases
- Task status
- Acceptance criteria
- Responsible parties

---

## 🎨 Best Practices by Project Type

### Fundraising Bootcamp
- See: `.dendrita/templates/workspace-template/best-practices/` for examples

### Sustainability Diagnostic (Phase 1)
- See: `.dendrita/templates/workspace-template/best-practices/` for examples

### Project and Alliance Pipeline
- See: `.dendrita/templates/workspace-template/best-practices/` for examples

### MEL System (Monitoring, Evaluation, and Learning)
- See: `.dendrita/templates/workspace-template/best-practices/` for examples

### Sustainability Implementation (Phases 2-4)
- See: `.dendrita/templates/workspace-template/best-practices/` for examples

---

## 🤖 Work Modes

Activate a specialized agent by loading the corresponding file in `.dendrita/users/[user-id]/agents/`:

- **sustainability-strategist.md** - For ESG strategic planning
- **project-manager.md** - For operational coordination
- **mel-analyst.md** - For data and impact analysis
- **stakeholder-facilitator.md** - For stakeholder management
- **fundraising-specialist.md** - For financial proposal design

---

## 🔗 ChatGPT Integration

### Recommended General Instruction

Create an `INSTRUCTION.md` file to use as initial context:

```
You are my project management assistant for my organization.

When you detect these situations:
- **Diagnostic/Planning:** If I mention "diagnostic", "mapping", "plan"
  → Use .dendrita/users/[user-id]/agents/sustainability-strategist.md
  
- **Execution:** If I mention "implementation", "execution", "tracking"
  → Use .dendrita/users/[user-id]/agents/project-manager.md
  
- **Analysis:** If I mention "metrics", "report", "MEL", "impact"
  → Use .dendrita/users/[user-id]/agents/mel-analyst.md
  
- **Partners:** If I mention "partners", "stakeholders", "governance"
  → Use .dendrita/users/[user-id]/agents/stakeholder-facilitator.md

Always read the current-context.md file from the active project to 
understand the current status before responding.
```

### Using with ChatGPT

1. **Identify the company and project:** `workspaces/[workspace-name]/active-projects/[project-name]/`
2. **Upload the complete folder** of the active project
3. **Include** `.dendrita/users/[user-id]/agents/[agent-name].md` if you need expertise
4. **Include** `.dendrita/templates/workspace-template/best-practices/[type]/` as reference
5. ChatGPT will read all context and maintain continuity

---

## 📊 Multiple Projects Management

### Projects Dashboard

Create a `workspaces/[workspace-name]/company-management/projects-dashboard.md` file:

```markdown
# Projects Dashboard

## Active Projects

| Project | Status | Phase | Responsible | Next Milestone |
|---------|--------|-------|-------------|----------------|
| Project A | 🟡 In progress | Phase 1 | Team Member | Milestone 1 |
| Project B | 🟡 In progress | Phase 2 | Team Member | Milestone 2 |

## Archived Projects

- Project X (completed Q4 2024)
- Project Y (completed Q3 2024)
```

Update weekly.

---

## 🎯 ennui Principles (The Compass)

All projects must follow:

- ✅ **Utility over ornamentation:** each deliverable must enable a decision
- ✅ **Honest evidence:** we measure what matters
- ✅ **Collaboration with responsibility:** clear partnerships, simple governance
- ✅ **Continuous learning:** short cycles of testing and adjustment
- ✅ **Public value and business aligned:** impact that strengthens operations and reputation

---

## 🔄 Frequent Updates

### Current Context
**Update whenever:**
- You complete an important task
- You make a key decision
- You identify a blocker
- Project status changes

### Task Tracking
**Update when:**
- You mark a task as completed
- You add a new task
- A task status changes

### Strategic Plan
**Update when:**
- Project scope changes
- You discover new phases
- You significantly adjust the timeline

---

## 📚 Next Steps

1. **Review** the templates in `.dendrita/templates/workspace-template/best-practices/`
2. **Create** your first project following the structure
3. **Customize** work modes as needed
4. **Keep** `current-context.md` updated

---

## 🆘 Help

If you have questions about:
- **Which template to use:** Review the description in `.dendrita/templates/workspace-template/best-practices/`
- **How to structure a new project:** Use any template as a base
- **Multiple projects management:** Create `workspaces/[workspace-name]/company-management/projects-dashboard.md`
- **Reporting:** Use templates from `.dendrita/templates/workspace-template/tools-templates/`
- **User profiles and initialization:** See `.dendrita/users/README.md` and `.dendrita/hooks/repo-initialization.md`
- **How .dendrita works:** See `.dendrita/INIT.md` and `.dendrita/hooks/README.md`

### Contributing & Governance

- **Want to contribute?** See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines
- **Code of Conduct:** Review [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for community standards
- **Security Issues:** Report privately using [SECURITY.md](SECURITY.md) guidelines
- **Ask a question?** Use [Issues - Questions](https://github.com/ennui-dendrita/ennui-dendrita/issues) or [Discussions](https://github.com/ennui-dendrita/ennui-dendrita/discussions)
- **Found a bug?** Create an [Issue - Bug Report](https://github.com/ennui-dendrita/ennui-dendrita/issues/new?template=bug_report.md)
- **Want a feature?** Create an [Issue - Feature Request](https://github.com/ennui-dendrita/ennui-dendrita/issues/new?template=feature_request.md)

---

## 👨‍💻 About the Developer

**Álvaro E. Mur** is the creator and maintainer of ennui-dendrita. He specializes in:

- 🌱 **Impact & Sustainability:** Designing and implementing ESG and social impact programs
- 📊 **Project Management:** Multi-stakeholder coordination and complex project orchestration
- 🤖 **AI & Automation:** Leveraging AI tools for strategic decision-making and document management
- 💡 **Innovation:** Building systems that integrate business operations with social value

**Contact:** [alvaro.e.mur@gmail.com](mailto:alvaro.e.mur@gmail.com)

---

## 🏢 About ennui

**ennui** is a social and environmental consulting firm registered in Peru that specializes in:

- 🌍 **Sustainability Diagnostics:** Comprehensive ESG assessments for organizations
- 💰 **Fundraising Strategy:** Design and implementation of funding strategies for social enterprises
- 🎯 **Impact Measurement:** MEL (Monitoring, Evaluation, and Learning) systems for social programs
- 🤝 **Stakeholder Management:** Facilitating collaboration between organizations and partners
- 🚀 **Project Implementation:** End-to-end execution of sustainability and social impact initiatives

**Core Philosophy:** Utility over ornamentation. Every action, every measurement, every deliverable must enable informed decisions and create measurable value.

**ennui-dendrita** represents the evolution of ennui's internal project management methodology into a scalable, template-based system that can be adapted by other organizations managing multiple complex initiatives.

---

**ennui(); – purpose is also managed**

