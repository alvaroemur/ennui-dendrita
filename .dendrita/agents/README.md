# Agents for ennui-dendrita

Specialized agents for complex multi-step tasks in sustainability and social impact project management.

---

## What are Agents?

Agents are autonomous Claude instances that handle specific complex tasks. Unlike skills (which provide inline guidance), agents:
- Execute as separate sub-tasks
- Work autonomously with minimal supervision
- Have specialized tool access
- Return comprehensive reports when complete

**Key advantage:** Agents are **standalone** - just copy the `.md` file and use it immediately.

---

## Available Agents

### estratega-sostenibilidad
**Purpose:** ESG strategic planning, sustainability initiative diagnostics, roadmap design

**When to use:**
- ESG strategic planning
- Sustainability initiative diagnostics
- Implementation roadmap design
- Initiative prioritization
- Business cases for impact

**Integration:** ✅ Copy as is

---

### gestor-proyectos
**Purpose:** Operational coordination, task tracking, schedule management

**When to use:**
- Daily operational coordination
- Task and deliverable tracking
- Schedule management
- Team and ally coordination
- Blocker resolution

**Integration:** ✅ Copy as is

---

### analista-mel
**Purpose:** Data analysis, impact metrics, MEL reports (Monitoring, Evaluation, and Learning)

**When to use:**
- Metrics and impact analysis
- MEL report generation
- Quantitative and qualitative data analysis
- Quarterly and executive reports
- Learning documentation

**Integration:** ✅ Copy as is

---

### facilitador-aliados
**Purpose:** Stakeholder management, collaboration agreement design, project governance

**When to use:**
- Ally and stakeholder management
- Collaboration agreement design
- Operational routine establishment
- Integration with entrepreneurs/organizations
- Governance management

**Integration:** ✅ Copy as is

---

### especialista-fundraising
**Purpose:** Financial proposal design, fund applications, fundraising bootcamps

**When to use:**
- Financial proposal design
- Fund and donor applications
- Fundraising bootcamps
- Business cases for investment
- Donor documents

**Integration:** ✅ Copy as is

---

### web-research-specialist
**Purpose:** Research information on the internet, especially for debugging, technical solutions, or comprehensive information

**When to use:**
- Research sustainability best practices
- Find examples of ESG implementations
- Compare social impact approaches
- Find solutions to specific problems
- Gather information from multiple sources

**Integration:** ✅ Copy as is

---

## How to Use an Agent

### Standard Integration

**Step 1: Copy the file**
```bash
cp .dendrita/agents/agent-name.md your-project/.dendrita/agents/
```

**Step 2: Use it**
Ask Claude: "Use the [agent-name] agent for [task]"

That's it. Agents work immediately.

---

## When to Use Agents vs Skills

| Use Agents When... | Use Skills When... |
|-------------------|------------------|
| Task requires multiple steps | Need inline guidance |
| Complex analysis needed | Checking best practices |
| Autonomous work preferred | Want to maintain control |
| Task has clear objective | Development work in progress |
| Example: "Review all active projects" | Example: "Create a new project" |

**Both can work together:**
- Skill provides patterns during development
- Agent reviews result when complete

---

## Quick Reference

| Agent | Complexity | Customization | Requires Auth |
|-------|-----------|---------------|---------------|
| estratega-sostenibilidad | High | ✅ None | No |
| gestor-proyectos | Medium | ✅ None | No |
| analista-mel | Medium | ✅ None | No |
| facilitador-aliados | Medium | ✅ None | No |
| especialista-fundraising | Medium | ✅ None | No |
| web-research-specialist | Low | ✅ None | No |

---

## Create Your Own Agents

Agents are markdown files with optional YAML frontmatter:

```markdown
---
name: my-agent
description: What this agent does
---

# Agent Name

## Purpose
What this agent does

## Instructions
Step-by-step instructions for autonomous execution

## Available Tools
List of tools it can use

## Expected Output
What format to use for returning results
```

**Tips:**
- Be very specific in instructions
- Break complex tasks into numbered steps
- Specify exactly what to return
- Include examples of good output
- List available tools explicitly

---

## Troubleshooting

### Agent not found

**Verify:**
```bash
# Does the agent file exist?
ls -la .dendrita/agents/[agent-name].md
```

### Agent fails with path errors

**Check for hardcoded paths:**
```bash
grep "~/\|/root/\|/Users/" .dendrita/agents/[agent-name].md
```

**Fix:**
```bash
sed -i 's|~/git/.*project|\$CLAUDE_PROJECT_DIR|g' .dendrita/agents/[agent-name].md
```

---

**For more information:** See `README.md` in `.dendrita/skills/` and `.dendrita/hooks/`

