# Agents for Example User

Specialized agents for complex multi-step tasks.

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

### example-agent
**Purpose:** Example agent demonstrating structure and content

**When to use:**
- Example task type 1
- Example task type 2
- Example task type 3

**Integration:** ✅ Copy as is, then customize

---

## Creating Your Own Agents

1. **Copy the example:**
   ```bash
   cp .dendrita/users/example-user/agents/example-agent.md \
      .dendrita/users/[your-user-id]/agents/[your-agent-name].md
   ```

2. **Customize the content:**
   - Update YAML frontmatter (name, description)
   - Define purpose and use cases
   - Add your domain-specific principles
   - Create instructions for your tasks
   - Define expected outputs

3. **Follow naming conventions:**
   - Format: `[rol]-[área].md` (e.g., `analista-mel.md`, `estratega-sostenibilidad.md`)
   - All lowercase, hyphens as separators
   - See `.dendrita/config-estilo.json` for details

---

**This is an example README. Replace with your own agent documentation.**

