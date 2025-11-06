# ennui-dendrita

**dendrita**

<p align="center">
  <a href="https://github.com/ennui-dendrita/ennui-dendrita/blob/main/.dendrita/blog/README.md"><img alt="Blog Índice" src="https://img.shields.io/badge/BLOG-%C3%8DNDICE-0a84ff?style=for-the-badge&logo=rss&logoColor=white"></a>
  <a href="https://github.com/ennui-dendrita/ennui-dendrita/tree/main/.dendrita/blog/posts"><img alt="Blog Posts" src="https://img.shields.io/badge/BLOG-POSTS-0a84ff?style=for-the-badge"></a>
  <a href="README.es.md"><img alt="README Español" src="https://img.shields.io/badge/README-ESPA%C3%91OL-0a84ff?style=for-the-badge"></a>
</p>

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Latest Commit](https://img.shields.io/github/last-commit/ennui-dendrita/ennui-dendrita)](https://github.com/ennui-dendrita/ennui-dendrita)
[![Platform](https://img.shields.io/badge/Platform-Google%20Apps%20Script%20%7C%20Cursor%20%7C%20ChatGPT-blue.svg)](https://github.com/ennui-dendrita/ennui-dendrita)
[![Code of Conduct](https://img.shields.io/badge/Contributor%20Covenant-v1.4%20adopted-ff69b4.svg)](CODE_OF_CONDUCT.md)

Project management and business operations system adapted from infrastructure best practices, designed specifically for managing multiple business operations projects.

The coordinating center of the work ecosystem is a dendrite that integrates information into structured decisions and actions.

---

## 🙏 Acknowledgments & Credits

**ennui-dendrita** is inspired by and adapted from the [**Claude Code Infrastructure Showcase**](https://github.com/claude-code-infrastructure-showcase) project, which provided the foundational patterns and infrastructure concepts that made this system possible.

The original project, developed over 6 months of real-world use managing complex TypeScript microservices, solved critical problems like automatic skill activation and scalable AI-assisted development. We adapted these patterns to create a methodology focused on business operations, project management, and multi-workspace coordination.

**Key adaptations:**
- Adapted `.claude/` infrastructure patterns to `.dendrita/` for business context
- Transformed development-focused skills into business operation methodologies
- Extended the workspace concept to support multiple companies/organizations
- Added project-specific structures (`master-plan.md`, `current-context.md`, `tasks.md`)
- Integrated domain-specific knowledge (sustainability, MEL, fundraising, stakeholder management)

**Original Work:**
- Repository: [Claude Code Infrastructure Showcase](https://github.com/claude-code-infrastructure-showcase)
- License: MIT License
- Original Contributors: Claude Code Infrastructure Contributors

We are grateful to the original developers for sharing these patterns and making this adaptation possible.

---

## 🌟 Philosophy & Vision

### Bridging the Gap: From No-Code to Hybrid-Code

**ennui-dendrita** was created with a clear intention: to close the gap for people who don't know how to program or only dare to use no-code tools.

Once you understand:
- **Code logic** (ability to write pseudo-code)
- **Basic nomenclature** (understanding what variables, functions, and files mean)
- **A lot of curiosity** (the desire to learn and experiment)

...you can make things happen with a **hybrid of code and a very organized way of working**.

**Anyone can use a system like this.**

### Who This Is For

If someone looks at this and thinks "this is garbage," they might be looking at it with "programmer eyes" (or maybe I'm pre-judging). 

**This is NOT a repository for programmers** (or at least not directed at them). It's for everyone else who always thinks that knowing how to use tools like Docs, Sheets, Slides, any Office suite tool, email, and other things from consultative life or professional life in general with skill is something for nerds.

We want someone like them to **"dare" to download Cursor** (something they probably don't know, or if they do, they see it as an alien tool) and **pay for a $20 monthly account** to have the best productivity tool of their life.

**If you already use ChatGPT for everything, imagine what you could do if you already had all the context at your disposal.**

> "Look at the proposal Daniel asked me for and check if it meets the objectives Angela told me about"

...becomes not just an ephemeral wish, but a **powerful actionable phrase**.

### Building a Community & Methodology

We hope this is seen as that and to generate a **community of people who build a WORK METHODOLOGY, a way of operating** (and also make applications on top of this, why not?).

This is not just about tools—it's about **developing a systematic approach to work** that combines:
- The power of AI-assisted development
- The structure of well-organized documentation
- The flexibility of a methodology that adapts to your context
- The community knowledge that emerges from shared practices

---

## 💼 Commercial Vision & Partnerships

**ennui-dendrita** is also a form of **self-employment** for its creator. We are developing applications with the intention of serving as **monetizable business modules**:

### Planned Products

1. **SaaS - Web Application**
   - Full-featured project management platform based on dendrita methodology
   - Multi-workspace management
   - Team collaboration features
   - Integration with external tools

2. **End-User Products**
   - **Chrome Extension** - Browser-based productivity tool
   - **Mobile App** (potential) - On-the-go project management

### Seeking Partners

We value **support and collaboration**. If you're interested in:
- **Technical partnership** - Development, architecture, or engineering expertise
- **Business partnership** - Go-to-market, sales, or business development
- **Investment** - Funding for product development and scaling
- **Community building** - Helping grow the methodology and user base

**Let's talk.** Reach out: [alvaro.e.mur@gmail.com](mailto:alvaro.e.mur@gmail.com)

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

### Generate Optimized Prompts for External Platforms

Dendrita can automatically generate optimized prompts for external AI platforms (ChatGPT, Claude, Gemini, etc.) based on your active context.

**How to use:**

1. **Ask Cursor to generate a prompt:**
   - "genérame el contexto para trabajar este documento en ChatGPT"
   - "vamos a trabajar la línea gráfica, genérame el prompt para hacer logos con Stable Diffusion"
   - "hazme un agente para analizar en ChatGPT las transcripciones"

2. **Cursor will automatically:**
   - Detect your request for external platform prompt
   - Identify active workspace, project, and relevant agent
   - Recopile relevant information from dendrita documents
   - Generate a markdown file ready to copy/paste
   - Save it in `_working-export/` with format `[workspace]-[proyecto]-[agent]-YYYY-MM-DD.md`

3. **The generated prompt includes:**
   - Role and purpose instructions
   - Project context (if active project exists)
   - Relevant agent methodology
   - Ennui principles (La Brújula)
   - References to source files

**For more details:** See `.dendrita/hooks/external-prompt-generator.md`

### Manual Integration (Alternative)

If you prefer to manually create prompts for ChatGPT:

1. **Identify the company and project:** `workspaces/[workspace-name]/active-projects/[project-name]/`
2. **Upload the complete folder** of the active project
3. **Include** `.dendrita/users/[user-id]/agents/[agent-name].md` if you need expertise
4. **Include** `.dendrita/templates/workspace-template/best-practices/[type]/` as reference
5. ChatGPT will read all context and maintain continuity

**Note:** The old `INSTRUCTION.md` file has been archived. Use the automatic prompt generator instead for optimized prompts.

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

