# Example User Structure

This is an **example user structure** demonstrating how to set up a user in the dendrita system. This structure is public and can be used as a template for creating new users.

## Structure

```
.dendrita/users/example-user/
├── profile.json              # User profile and preferences
├── agents/                   # Specialized agents (domain knowledge)
│   ├── example-agent.md      # Example agent template
│   └── README.md             # Agent documentation (optional)
├── skills/                   # Contextual knowledge skills (domain knowledge)
│   ├── skill-rules.json      # Skill activation rules
│   ├── example-skill/         # Example skill
│   │   └── SKILL.md          # Skill documentation
│   └── README.md             # Skills documentation (optional)
├── work-modes/               # General work preferences
│   ├── user-work-mode.md     # General work preferences
│   └── README.md             # Work-modes documentation (optional)
└── README.md                 # This file
```

## Components

### profile.json
User profile containing:
- Basic information (name, email, workspace)
- Work preferences (language, communication style)
- Professional context (experience, expertise, skills)
- Dendrita settings (alias, name, auto-activation)
- Integration settings

### agents/
Specialized agents for complex multi-step tasks:
- Each agent is a standalone `.md` file
- Contains instructions, principles, and expected outputs
- Domain-specific knowledge (user-specific)
- **Location:** `.dendrita/users/[user-id]/agents/`

### skills/
Contextual knowledge and inline guidance:
- Each skill has its own folder with `SKILL.md`
- Contains methodology, patterns, and best practices
- Domain-specific knowledge (user-specific)
- Activated based on `skill-rules.json`
- **Location:** `.dendrita/users/[user-id]/skills/`

### work-modes/
General work preferences:
- `user-work-mode.md` defines general work preferences
- Applied to all sessions as base behavior
- User-specific preferences
- **Location:** `.dendrita/users/[user-id]/work-modes/`

## Paradigm

**Agents and skills are user-specific domain knowledge**, not generic technical infrastructure. They contain:
- User-specific methodologies
- Domain knowledge (sustainability, social impact, etc.)
- Personal work patterns and preferences

They are stored in `.dendrita/users/[user-id]/` to reflect that they contain private, domain-specific knowledge rather than generic infrastructure.

## How to Use This Template

1. **Copy the structure:**
   ```bash
   cp -r .dendrita/users/example-user .dendrita/users/[your-user-id]
   ```

2. **Update profile.json:**
   - Replace example information with your own
   - Configure your preferences and settings

3. **Customize agents:**
   - Replace `example-agent.md` with your own agents
   - Each agent should be domain-specific to your work

4. **Create your skills:**
   - Replace `example-skill` with your own skills
   - Update `skill-rules.json` with activation rules

5. **Customize work-mode:**
   - Edit `user-work-mode.md` with your personal preferences
   - Define how you prefer to work and communicate

## Integration with dendrita

This user structure integrates with:
- `.cursorrules` - Configuration for Cursor
- `.dendrita/settings.json` - System metadata
- `.dendrita/hooks/` - Behavior references

## Notes

- This is a **public example** for demonstration purposes
- Replace all example content with your own domain knowledge
- Maintain consistency with dendrita system structure
- Keep domain knowledge separate from generic infrastructure

---

**Last updated:** 2025-11-04  
**Version:** 1.0

