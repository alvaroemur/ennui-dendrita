---
name: readme
description: "User and Profile System"
type: documentation
created:
  2025-11-06T00:00:00.000Z
  
updated:
  2025-11-06T00:00:00.000Z
  
tags: ["documentation", "infrastructure", "user-specific", "readme"]
category: infrastructure
---

# User and Profile System

User and profile management system for ennui-dendrita that allows customizing Cursor behavior according to user and work context.

---

## What is this system?

This system allows:

- ✅ **Identify repository users**
- ✅ **Save preferences** and custom configuration
- ✅ **Create profiles** specific to different contexts or workspaces
- ✅ **Configure default profiles** per workspace
- ✅ **Activate profiles** according to work needs

---

## Folder Structure

```
.dendrita/users/
├── README.md                              # This file
├── example-user/                          # User template (contains all .example files)
│   ├── profile.json                       # Template base profile
│   ├── profile.example.json               # Example structure for user profile
│   ├── context.json.example               # Example structure for user context
│   ├── workspace-defaults.example.json     # Example structure for workspace defaults
│   ├── scrapers-config.json.example       # Example structure for scrapers config
│   ├── reddit-comments-monitoring.json.example  # Example structure for Reddit monitoring
│   ├── profiles/                          # Profile templates
│   │   └── profile-workspace.example.json  # Example structure for workspace profile
│   ├── agents/                            # Agent templates
│   ├── skills/                            # Skill templates
│   └── work-modes/                        # Work-mode templates
└── [user-id]/                             # Folder per user
    ├── profile.json                       # User default profile
    ├── profiles/                          # Additional profiles
    │   ├── [profile-name].json            # Specific profile
    │   └── workspace-[workspace-name].json # Profile per workspace
    ├── agents/                            # User-specific domain knowledge: specialized agents
    │   ├── README.md
    │   └── [agent-name].md
    ├── skills/                            # User-specific domain knowledge: contextual skills
    │   ├── README.md
    │   ├── skill-rules.json
    │   └── [skill-name]/SKILL.md
    └── workspace-defaults.json           # Default profiles configuration per workspace
```

**IMPORTANT PARADIGM:** Agents and skills are user-specific domain knowledge (sustainability, social impact, project management methodologies) and are stored in `.dendrita/users/[user-id]/`. This reflects that they contain private, domain-specific knowledge rather than generic infrastructure (which belongs in `.dendrita/integrations/`).

---

## User Identification

### Initialization

When Cursor detects an empty repository or unconfigured users, it should:

1. **Ask the user** for basic data:
   - Name or unique identifier
   - Primary workspace (create any name you prefer)
   - Primary work type
   - Communication preferences

2. **Create the structure** of the user in `.dendrita/users/[user-id]/`

3. **Generate the default profile** `profile.json`

### Structure of `profile.json`

```json
{
  "user_id": "user-1",
  "name": "User Name",
  "email": "user@example.com",
  "primary_workspace": "my-workspace",
  "preferences": {
    "language": "es",
    "communication_style": "direct",
    "update_frequency": "frequent"
  },
  "work_context": {
    "primary_roles": ["project-manager", "sustainability-strategist"],
    "frequently_used_skills": ["gestion-proyectos", "diagnostico-sostenibilidad"]
  },
  "metadata": {
    "created_at": "2024-01-01",
    "last_updated": "2024-01-01"
  }
}
```

---

## Profiles

### Default Profile

The `profile.json` file in `.dendrita/users/[user-id]/` is the user's default profile. This profile is used when no other profile or workspace is specified.

### Additional Profiles

Additional profiles are saved in `.dendrita/users/[user-id]/profiles/` and can be:

1. **Workspace profiles**: `workspace-[workspace-name].json`
   - Automatically activate when working in that workspace
   - Can be configured as default in `workspace-defaults.json`

2. **Custom profiles**: `[profile-name].json`
   - Profiles created for specific contexts
   - Activated manually according to need

### Profile Structure

```json
{
  "profile_id": "workspace-ennui",
  "profile_name": "ennui Profile",
  "workspace": "ennui",
  "is_default_for_workspace": true,
  "preferences": {
    "language": "es",
    "communication_style": "professional",
    "update_frequency": "frequent"
  },
  "work_context": {
    "primary_roles": ["sustainability-strategist", "project-manager"],
    "frequently_used_skills": ["diagnostico-sostenibilidad", "gestion-proyectos"],
    "preferred_agents": ["sustainability-strategist", "project-manager"]
  },
  "workspace_settings": {
    "default_project_type": "sustainability-diagnostic",
    "preferred_templates": ["sustainability-diagnostic", "project-pipeline"]
  },
  "metadata": {
    "created_at": "2024-01-01",
    "last_updated": "2024-01-01"
  }
}
```

---

## Default Profiles Configuration

The `workspace-defaults.json` file allows configuring which profile to use by default in each workspace:

```json
{
  "workspace_profiles": {
    "ennui": "workspace-ennui",
    "inspiro": "profile-default",
    "entre-rutas": "workspace-entre-rutas",
    "horizontes": "workspace-horizontes",
    "iami": "profile-default",
    "otros": "profile-default"
  },
  "default_profile": "profile.json"
}
```

---

## Usage Rules

### 1. User Detection

Cursor must identify the active user:

1. **When starting a session:**
   - If only one user: use that user
   - If multiple users: ask which to use
   - If no users: start initialization process

2. **During a session:**
   - Keep user identified
   - Use user default profile or profile configured for active workspace

### 2. Profile Activation

Cursor must apply the correct profile according to context:

1. **When working in a workspace:**
   - Check `workspace-defaults.json` for workspace default profile
   - If it exists, use that profile
   - If not, use user default profile (`profile.json`)

2. **When switching workspaces:**
   - Check if profile is configured for new workspace
   - Switch to corresponding profile
   - Notify user of profile change (optional)

3. **Manual activation:**
   - User can request using a specific profile
   - Cursor should load that profile and apply it during the session

### 3. Profile Application

When a profile is active, Cursor must:

1. **Read preferences:**
   - Use specified communication style
   - Apply update frequency
   - Use preferred language

2. **Apply work context:**
   - Suggest skills according to `frequently_used_skills`
   - Activate agents according to `preferred_agents`
   - Use templates according to `preferred_templates`

3. **Customize suggestions:**
   - Prioritize skills and modes relevant to profile
   - Adapt responses to communication style
   - Use workspace as primary context

---

## Repository Initialization

### Initialization Process

When Cursor detects an empty repository (no users in `.dendrita/users/`):

1. **Ask the user:**
   ```
   Welcome to ennui-dendrita! 
   
   It looks like this is a new repository. To set it up, I need some basic information:
   
   1. What is your name or unique identifier? (ex: user-1, juan, team-1)
   2. What is your primary workspace? (create any name you prefer)
   3. What is your primary work type? (project-manager, sustainability-strategist, mel-analyst, stakeholder-facilitator, fundraising-specialist)
   4. Do you prefer direct or detailed communication? (direct, detailed)
   5. How often should we update current-context.md? (frequent, normal, minimal)
   ```

2. **Create user structure:**
   - Create `.dendrita/users/[user-id]/`
   - Create `profile.json` with responses
   - Create `profiles/` and `workspace-defaults.json`

3. **Confirm configuration:**
   - Show configuration summary
   - Offer to create profile specific to primary workspace

---

## Usage Examples

### Example 1: User with single workspace

```
User: user-1
Primary workspace: my-workspace
Default profile: profile.json
Profile for my-workspace: workspace-my-workspace.json (default for my-workspace)
```

When working in `workspaces/my-workspace/`, Cursor uses `workspace-my-workspace.json`.
When working in other workspaces, uses `profile.json`.

### Example 2: User with multiple workspaces

```
User: user-1
Primary workspace: my-workspace
Configured profiles:
  - workspace-my-workspace.json (default for my-workspace)
  - workspace-another-workspace.json (default for another-workspace)
  - workspace-other.json (default for other)
```

When switching between workspaces, Cursor automatically switches to corresponding profile.

### Example 3: Activate profile manually

```
User: "I want to use the 'audit' profile"
Cursor: Loads .dendrita/users/user-1/profiles/audit.json and applies it during the session.
```

---

## Integration with Other Systems

### Skills

Profile system integrates with `.dendrita/users/[user-id]/skills/`:

- Profiles can specify `frequently_used_skills`
- Cursor prioritizes these skills when suggesting activation
- `skill-activation-prompt` hook considers active profile
- Skills are user-specific domain knowledge stored per user

### Agents

Profile system integrates with `.dendrita/users/[user-id]/agents/`:

- Agents contain user-specific domain knowledge (sustainability, social impact, project management)
- Agents are stored per user to reflect domain-specific knowledge
- Cursor can activate agents based on profile context

### Preferred Agents

Profiles can specify `preferred_agents`:

- Cursor suggests these agents when relevant
- Facilitates activation of frequent agents

### Workspace Structure

System respects workspace structure:

- Each workspace can have its profile configured
- Profiles can specify workspace-specific preferences
- Consistency is maintained with standard structure

## Paradigm: User-Specific Domain Knowledge

**Agents and skills are user-specific domain knowledge**, not generic infrastructure:

- **Agents** (`.dendrita/users/[user-id]/agents/`): Contain domain-specific methodologies (ESG, sustainability, MEL, fundraising)
- **Skills** (`.dendrita/users/[user-id]/skills/`): Contain domain-specific patterns and best practices
- **Integrations** (`.dendrita/integrations/`): Contain generic technical infrastructure (Google APIs, Supabase, etc.)

This separation ensures that:
- Domain knowledge stays with the user who owns it
- Technical infrastructure remains generic and reusable
- Users can have their own specialized agents and skills

---

## Privacy and Security

### Excluded Files

The `.dendrita/users/.gitignore` file excludes:

```
*.json
!workspace-defaults.json.example
```

**Note:** Profiles contain personal information and should not be shared in repository by default. If a user wants to share a profile as template, they can create an `.example` file.

### Sensitive Data

Profiles can contain:
- Contact information (optional)
- Personal preferences
- Work configuration

**Recommendation:** Keep sensitive data to minimum necessary.

---

## Maintenance

### Update Profile

User can update their profile at any time:

1. Directly modify `profile.json` or corresponding profile
2. Ask Cursor to update profile
3. Cursor updates `last_updated` in metadata

### Create New Profile

User can create a new profile:

1. Request to create profile with specific name
2. Cursor asks for preferences or uses default profile as base
3. Save in `profiles/[profile-name].json`

### Delete Profile

User can delete a profile:

1. Request to delete profile
2. Cursor verifies it's not configured as default
3. Delete corresponding file

---

## Troubleshooting

### User not detected

1. Verify that `.dendrita/users/[user-id]/profile.json` exists
2. If not, start initialization process
3. If exists but not detected, verify read permissions

### Profile not applying correctly

1. Check `workspace-defaults.json` for active workspace
2. Verify profile exists in `profiles/`
3. Verify JSON format of profile

### Multiple users

1. If multiple users exist, Cursor should ask which to use
2. Consider saving active user in `settings.local.json` (not versioned)

---

## References

- `.dendrita/hooks/repo-initialization.md` - Initialization hook
- `.dendrita/settings.json` - General system configuration
- `.dendrita/WORKSPACE-STRUCTURE.md` - Standard workspace structure

---

**For more information:** See `.dendrita/hooks/repo-initialization.md` and `.dendrita/settings.json`

