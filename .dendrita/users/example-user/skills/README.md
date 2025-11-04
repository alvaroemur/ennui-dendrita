# Skills for Example User

Contextual knowledge and inline guidance for development work.

---

## What are Skills?

Skills provide contextual knowledge and inline guidance during development. Unlike agents (which execute standalone tasks), skills:
- Provide patterns and best practices
- Offer inline guidance during work
- Contain domain-specific methodology
- Are activated automatically based on prompts and files

**Key advantage:** Skills give you **contextual knowledge** when you need it, without interrupting your workflow.

---

## Available Skills

### example-skill
**Purpose:** Example skill demonstrating structure and content

**When to use:**
- Working on example tasks
- Following example methodology
- Requiring example patterns

**Activation:** Automatically triggered by keywords and file patterns in `skill-rules.json`

---

## Creating Your Own Skills

1. **Create skill directory:**
   ```bash
   mkdir -p .dendrita/users/[your-user-id]/skills/[skill-name]
   ```

2. **Create SKILL.md:**
   ```bash
   cp .dendrita/users/example-user/skills/example-skill/SKILL.md \
      .dendrita/users/[your-user-id]/skills/[skill-name]/SKILL.md
   ```

3. **Customize the content:**
   - Update YAML frontmatter (name, description)
   - Define purpose and use cases
   - Add your domain-specific methodology
   - Include patterns and best practices
   - Reference related agents and templates

4. **Update skill-rules.json:**
   - Add skill entry with activation rules
   - Define keywords and intent patterns
   - Configure file triggers

---

**This is an example README. Replace with your own skill documentation.**

