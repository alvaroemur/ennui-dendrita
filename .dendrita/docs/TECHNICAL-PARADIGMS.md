---
name: technical-paradigms
description: "Technical Design Paradigms for dendrita"
type: documentation
created: 2025-12-02
updated: 2025-12-02
tags: ["documentation", "paradigm", "design", "organization"]
category: infrastructure
---

# Technical Paradigms for dendrita

This document consolidates the technical design and organization paradigms that guide how dendrita is structured and configured.

---

## Overview

dendrita follows three core technical paradigms:

1. **Design Paradigm**: Configuration in local files, not databases
2. **Organization Paradigm**: User-specific vs generic infrastructure
3. **Integration Paradigm**: How components relate and interact

---

## 1. Design Paradigm

### Fundamental Principle

**Configuration in local files, not in databases.**

Configuration for scrapers and other integrations must be in local JSON files, not in Supabase. Supabase is only used to store scraped data (results), not configuration.

### Configuration Structure

#### Single Configuration Files

**Format:** `[name]-config.json`

**Location:**
- **User configuration:** `.dendrita/users/[user-id]/[name]-config.json`
- **Workspace configuration:** `workspaces/[workspace]/[name]-config.json`

**Examples:**
- `.dendrita/users/[user-id]/scrapers-config.json` - Calendar scraper configuration
- `workspaces/[workspace-name]/scrapers-config.json` - Drive/Gmail scrapers configuration
- `workspaces/[workspace-name]/config-estilo.json` - Workspace style configuration

### Context Separation

#### Calendar Scraper → `.dendrita/users/[user-id]/scrapers-config.json`

**Reason:** Calendar scraper fetches **ALL** events from user calendars. It doesn't require workspace-specific filters, as it's a complete scraping of personal calendars.

**Location:** `.dendrita/users/[user-id]/scrapers-config.json`

**Structure:**
```json
{
  "user_id": "[user-id]",
  "calendar": {
    "default_settings": { ... },
    "calendars": [ ... ]
  }
}
```

#### Drive/Gmail Scrapers → `workspaces/[workspace]/scrapers-config.json`

**Reason:** Drive and Gmail scrapers require **specific rules** (filters by words, labels, specific IDs, specific folders) that are associated with a specific workspace/company.

**Location:** `workspaces/[workspace]/scrapers-config.json`

**Structure:**
```json
{
  "workspace": "ennui",
  "drive": {
    "configs": [ ... ]
  },
  "gmail": {
    "configs": [ ... ]
  }
}
```

### Security Principles

#### Personal Information NOT in Git

**CRITICAL:** All personal information must be excluded from git:

- `.dendrita/users/` → In `.gitignore`
- `.dendrita/logs/` → In `.gitignore`
- `workspaces/[company]/` → In `.gitignore` (already there)
- Configuration files with sensitive data → In `.gitignore`

#### Verification

**Must NEVER be in git:**
- ✅ `.dendrita/users/` (user profiles, personal configurations)
- ✅ `.dendrita/logs/` (logs that may contain sensitive information)
- ✅ `workspaces/[company]/` (company/client data)
- ✅ Configuration files with folder IDs, search queries, etc.

**Can be in git:**
- ✅ `.dendrita/integrations/services/` (code, not data)
- ✅ `.dendrita/integrations/scripts/` (code, not data)
- ✅ `workspaces/template/` (example structure without real data)
- ✅ SQL schemas (database structure, not data)

### Advantages

1. **Clear Separation**
   - User configuration vs. workspace configuration
   - Local configuration vs. data in Supabase
   - Single files vs. multiple scattered files

2. **Security**
   - Personal information excluded from git
   - Configurations with sensitive data not in repository
   - Easy to verify with `.gitignore`

3. **Maintainability**
   - Configurations in readable JSON files
   - Easy to edit without needing Supabase
   - Local versioning (outside git)

4. **Scalability**
   - Each workspace can have its own configurations
   - Easy to add new configurations without modifying code
   - Configurations can be shared between users (local copy)

### Implementation in Services

#### Loading Configuration

**Calendar Scraper:**
```typescript
async loadConfigFromUser(userId: string): Promise<ScrapingConfig[]> {
  const configPath = path.join('.dendrita', 'users', userId, 'scrapers-config.json');
  // Read JSON file...
}
```

**Drive/Gmail Scrapers:**
```typescript
async loadConfigFromWorkspace(workspace: string): Promise<ScrapingConfig[]> {
  const configPath = path.join('workspaces', workspace, 'scrapers-config.json');
  // Read JSON file...
}
```

#### Saving Configuration

**Calendar Scraper:**
```typescript
async saveConfig(userId: string, configs: ScrapingConfig[]): Promise<void> {
  const configPath = path.join('.dendrita', 'users', userId, 'scrapers-config.json');
  // Write JSON file...
}
```

**Drive/Gmail Scrapers:**
```typescript
async saveConfig(workspace: string, configs: ScrapingConfig[]): Promise<void> {
  const configPath = path.join('workspaces', workspace, 'scrapers-config.json');
  // Write JSON file...
}
```

### Application

This paradigm applies to:

1. **Scrapers** (Calendar, Drive, Gmail)
2. **Future integrations** (Slack, Notion, etc.)
3. **Workspace configurations** (style, rules, etc.)
4. **User configurations** (preferences, aliases, etc.)

**General rule:** If it's configuration, it goes in a local file. If it's scraped data/results, it goes in Supabase.

---

## 2. Organization Paradigm

### Fundamental Principle

**Agents and skills are user-specific domain knowledge, not generic technical infrastructure.**

This paradigm clearly separates:
- **Domain knowledge** (user-specific): Methodologies, patterns, best practices of the user
- **Technical infrastructure** (generic): Code, APIs, reusable technical tools

### Organization Structure

#### Domain Knowledge (User-Specific)

**Location:** `.dendrita/users/[user-id]/`

##### Agents (`.dendrita/users/[user-id]/agents/`)
- **Content:** Specialized agents with domain methodologies
- **Examples:** `estratega-sostenibilidad.md`, `analista-mel.md`, `especialista-fundraising.md`
- **Nature:** User-specific knowledge about sustainability, social impact, project management
- **Purpose:** Provide autonomous agents that encapsulate user domain methodologies

##### Skills (`.dendrita/users/[user-id]/skills/`)
- **Content:** Patterns and domain best practices
- **Examples:** `gestion-proyectos/`, `diagnostico-sostenibilidad/`, `sistema-mel/`
- **Nature:** User-specific contextual knowledge about how to work in their domain
- **Purpose:** Provide inline guides during development that reflect user methodology

#### Technical Infrastructure (Generic)

**Location:** `.dendrita/integrations/`

##### Integrations (`.dendrita/integrations/`)
- **Content:** Code to connect with external services
- **Examples:** Google Workspace APIs, Supabase, OpenAI
- **Nature:** Generic and reusable technical infrastructure
- **Purpose:** Provide technical tools without user-specific domain knowledge

##### Hooks (`.dendrita/hooks/`)
- **Content:** System behavior references
- **Nature:** dendrita system behavior logic
- **Purpose:** Document how Cursor should behave when applying system logic

### Visual Comparison

| Component | Location | Nature | Content | User-Specific |
|-----------|----------|--------|---------|---------------|
| **Agents** | `.dendrita/users/[user-id]/agents/` | Domain knowledge | ESG, MEL, fundraising methodologies | ✅ Yes |
| **Skills** | `.dendrita/users/[user-id]/skills/` | Domain knowledge | User work patterns | ✅ Yes |
| **Integrations** | `.dendrita/integrations/` | Technical infrastructure | API code, scrapers | ❌ No |
| **Hooks** | `.dendrita/hooks/` | System behavior | dendrita logic | ⚠️ Partial |

### Benefits of This Separation

1. **Purpose Clarity**
   - Easy to identify what is domain knowledge vs. technical infrastructure
   - Makes explicit that agents and skills are user-specific

2. **Multi-User Scalability**
   - Each user can have their own agents and skills
   - Domain knowledge doesn't mix with technical infrastructure
   - Easy to share technical infrastructure without exposing domain knowledge

3. **Maintainability**
   - Clear separation of responsibilities
   - Easy to identify where to make changes
   - Domain knowledge evolves independently from technical infrastructure

4. **Privacy and Security**
   - Domain knowledge can remain private per user
   - Technical infrastructure can be shared and versioned

### Organization Rules

#### ✅ DO

1. **Agents and skills go in `.dendrita/users/[user-id]/`**
   - Each user has their own folder
   - Contains user-specific domain knowledge

2. **Integrations go in `.dendrita/integrations/`**
   - Generic technical infrastructure
   - Reusable code without domain knowledge

3. **Hooks go in `.dendrita/hooks/`**
   - dendrita system behavior
   - Logic references, not executables

#### ❌ DON'T

1. **Don't mix domain knowledge with technical infrastructure**
   - Agents and skills don't go in `.dendrita/integrations/`
   - Integrations don't contain domain methodologies

2. **Don't put agents and skills directly in `.dendrita/`**
   - Must be under `.dendrita/users/[user-id]/`
   - Reflects that they are user-specific knowledge

3. **Don't hardcode old paths in documentation**
   - Use `.dendrita/users/[user-id]/agents/` and `.dendrita/users/[user-id]/skills/`
   - Don't use `.dendrita/agents/` or `.dendrita/skills/`

### Migration from Previous Structure

#### Previous Structure (v1.0)
```
.dendrita/
├── agents/          ← Domain knowledge (incorrect location)
├── skills/          ← Domain knowledge (incorrect location)
└── integrations/    ← Technical infrastructure (correct location)
```

#### Current Structure (v2.0)
```
.dendrita/
├── users/[user-id]/
│   ├── agents/      ← Domain knowledge (correct location)
│   └── skills/      ← Domain knowledge (correct location)
└── integrations/    ← Technical infrastructure (correct location)
```

---

## 3. Integration Paradigm

### How Components Relate

The dendrita system integrates components through clear relationships:

1. **Hooks activate Skills**
   - Hooks read skill rules and activate relevant skills based on user prompts
   - Skills are user-specific domain knowledge

2. **Skills can suggest Agents**
   - Skills may suggest using specific agents for complex tasks
   - Agents encapsulate autonomous methodologies

3. **Agents can use Scripts**
   - Agents may use technical infrastructure scripts for execution
   - Scripts are generic technical tools

4. **Data Flow**
   - Project context → User context → Workspace context
   - Configuration files → Services → Data storage

### Component Interaction Flow

```
User Prompt
    ↓
Hooks (behavior references)
    ↓
Skills (domain knowledge)
    ↓
Agents (autonomous methodologies)
    ↓
Scripts (technical execution)
    ↓
Results
```

### Integration Points

1. **Configuration → Services**
   - Local JSON files configure services
   - Services read configuration and execute

2. **Services → Data Storage**
   - Services store results in Supabase
   - Configuration remains in local files

3. **Context Propagation**
   - Project context flows to user context
   - User context filters to workspace context
   - All contexts reference each other

---

## References

- `.dendrita/docs/integrations/SCRAPER-CONFIG-DESIGN.md` - Specific scraper configuration design
- `.dendrita/docs/integrations/SCRAPER-ARCHITECTURE.md` - Scraper architecture
- `.dendrita/docs/WORKSPACE-STRUCTURE.md` - Standard workspace structure
- `.dendrita/docs/SYSTEM-BEHAVIOR.md` - System behavior and component relationships
- `.gitignore` - Git exclusion rules

---

## Implementation Notes

- Design Paradigm established: 2025-01-28
- Organization Paradigm established: 2025-11-04
- All agents and skills must be under `.dendrita/users/[user-id]/`
- Technical infrastructure remains in `.dendrita/integrations/`
- These paradigms apply to all new components created

---

**IMPORTANT:** These paradigms must be followed strictly. Agents and skills are user-specific domain knowledge and must be organized in `.dendrita/users/[user-id]/`, not as generic infrastructure in `.dendrita/`.

---

**Last updated:** 2025-12-02  
**Version:** 2.0

