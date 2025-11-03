# Skills for ennui-dendrita

Modular knowledge skills that Claude loads when needed. They provide:
- Domain-specific guides
- Best practices
- Code/structure examples
- Anti-patterns to avoid

**Problem:** Skills do not activate automatically by default.

**Solution:** This infrastructure includes hooks + configuration to make them activate automatically.

---

## Available Skills

### gestion-proyectos
**Purpose:** Project management patterns for ennui-dendrita

**Files:** Multiple resource files

**Covers:**
- Project structure (master-plan, current-context, tasks)
- Managing multiple simultaneous projects
- Operational rhythms (scrums, reviews)
- Task and deliverable tracking
- Persistent documentation

**Use when:**
- Creating/modifying project structures
- Need to follow best practices for documentation
- Managing multiple projects
- Updating contexts and tasks

**Customization:** ✅ None needed - adapted to ennui-dendrita

**[See Skill →](gestion-proyectos/)**

---

### diagnostico-sostenibilidad
**Purpose:** Patterns for ESG and sustainability initiative diagnostics

**Files:** Multiple resource files

**Covers:**
- Mapping of current initiatives
- Evidence gap identification
- Key allies mapping
- Analysis of connection with business core
- Creation of value maps

**Use when:**
- Conducting sustainability diagnostics
- Mapping ESG initiatives
- Analyzing evidence gaps
- Designing value maps

**Customization:** ✅ None needed

**[See Skill →](diagnostico-sostenibilidad/)**

---

### pipeline-proyectos
**Purpose:** Patterns for project and alliance pipeline

**Files:** Multiple resource files

**Covers:**
- Opportunity identification
- Proposal design with allies
- Coordinated funding applications
- Pipeline management

**Use when:**
- Working on project pipeline
- Designing proposals with allies
- Applying for funds coordinately

**Customization:** ✅ None needed

**[See Skill →](pipeline-proyectos/)**

---

### sistema-mel
**Purpose:** Patterns for MEL systems (Monitoring, Evaluation, and Learning)

**Files:** Multiple resource files

**Covers:**
- Theory of change design
- Capture systems (quantitative + qualitative)
- Data and impact analysis
- MEL reports generation
- Technology and AI integration

**Use when:**
- Designing MEL systems
- Analyzing impact data
- Generating quarterly reports
- Integrating quantitative and qualitative metrics

**Customization:** ✅ None needed

**[See Skill →](sistema-mel/)**

---

### bootcamp-fundraising
**Purpose:** Patterns for fundraising bootcamps and training

**Files:** Multiple resource files

**Covers:**
- Bootcamp structure (4 modules, 8 weeks)
- Capacity strengthening
- Applied learning
- Proposal templates

**Use when:**
- Designing fundraising bootcamps
- Strengthening fundraising capabilities
- Creating training programs

**Customization:** ✅ None needed

**[See Skill →](bootcamp-fundraising/)**

---

## How to Add a Skill to Your Project

Skills are already configured in `skill-rules.json`. You only need to:

1. **Verify that the skill exists** in `.dendrita/skills/[skill-name]/`
2. **Hooks are installed** (see `.dendrita/hooks/README.md`)
3. **settings.json is configured** (see `.dendrita/settings.json`)

The skill will activate automatically when:
- Your prompt contains relevant keywords
- You're editing files in relevant directories
- File content matches specific patterns

---

## skill-rules.json Configuration

### What It Does

Defines when skills should activate based on:
- **Keywords** in user prompts ("diagnostic", "MEL", "fundraising")
- **Intent patterns** (regex matching user intent)
- **File path patterns** (editing files in active-projects/)
- **Content patterns** (code contains certain patterns)

### Enforcement Levels

- **suggest**: Skill appears as suggestion, does not block
- **block**: Skill must be used before continuing (guardrail)

**Use "block" for:**
- Preventing changes that break project structure
- Critical database operations
- Security-sensitive code

**Use "suggest" for:**
- General best practices
- Domain guidance
- Code organization

---

## Troubleshooting

### Skill not activating

**Verify:**
1. Does the skill exist in `.dendrita/skills/`?
2. Is it listed in `skill-rules.json`?
3. Do `pathPatterns` match your files?
4. Are hooks installed and working?
5. Is settings.json configured correctly?

**Debug:**
```bash
# Verify skill exists
ls -la .dendrita/skills/

# Validate skill-rules.json
cat .dendrita/skills/skill-rules.json | jq .

# Verify hooks are executable
ls -la .dendrita/hooks/*.sh

# Test hook manually
./.dendrita/hooks/skill-activation-prompt.sh
```

### Skill activates too frequently

Update skill-rules.json:
- Make keywords more specific
- Narrow `pathPatterns`
- Increase specificity of `intentPatterns`

### Skill never activates

Update skill-rules.json:
- Add more keywords
- Broaden `pathPatterns`
- Add more `intentPatterns`

---

**For more information:** See `README.md` in `.dendrita/agents/` and `.dendrita/hooks/`

