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
├── [user-id]/                             # Folder per user
│   ├── profile.json                       # User default profile
│   ├── profiles/                          # Additional profiles
│   │   ├── [profile-name].json            # Specific profile
│   │   └── workspace-[workspace-name].json # Profile per workspace
│   └── workspace-defaults.json           # Default profiles configuration per workspace
└── .gitignore                             # To exclude personal data from repository
```

---

## User Identification

### Initialization

When Cursor detects an empty repository or unconfigured users, it should:

1. **Ask the user** for basic data:
   - Name or unique identifier
   - Primary workspace (ennui, inspiro, entre-rutas, horizontes, iami, otros)
   - Primary work type
   - Communication preferences

2. **Create the structure** of the user in `.dendrita/users/[user-id]/`

3. **Generate the default profile** `profile.json`

### Structure of `profile.json`

```json
{
  "user_id": "alvaro",
  "name": "Álvaro",
  "email": "alvaro.e.mur@gmail.com",
  "primary_workspace": "ennui",
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
    "preferred_work_modes": ["sustainability-strategist", "project-manager"]
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
   - Activate work modes according to `preferred_work_modes`
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
   
   1. What is your name or unique identifier? (ex: alvaro, juan, team-1)
   2. What is your primary workspace? (ennui, inspiro, entre-rutas, horizontes, iami, otros)
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
User: alvaro
Primary workspace: ennui
Default profile: profile.json
Profile for ennui: workspace-ennui.json (default for ennui)
```

When working in `workspaces/ennui/`, Cursor uses `workspace-ennui.json`.
When working in other workspaces, uses `profile.json`.

### Example 2: User with multiple workspaces

```
User: alvaro
Primary workspace: ennui
Configured profiles:
  - workspace-ennui.json (default for ennui)
  - workspace-inspiro.json (default for inspiro)
  - workspace-otros.json (default for otros)
```

When switching between workspaces, Cursor automatically switches to corresponding profile.

### Example 3: Activate profile manually

```
User: "I want to use the 'audit' profile"
Cursor: Loads .dendrita/users/alvaro/profiles/audit.json and applies it during the session.
```

---

## Integration with Other Systems

### Skills

Profile system integrates with `.dendrita/skills/`:

- Profiles can specify `frequently_used_skills`
- Cursor prioritizes these skills when suggesting activation
- `skill-activation-prompt` hook considers active profile

### Work Modes

Profiles can specify `preferred_work_modes`:

- Cursor suggests these work modes when relevant
- Facilitates activation of frequent work modes

### Workspace Structure

System respects workspace structure:

- Each workspace can have its profile configured
- Profiles can specify workspace-specific preferences
- Consistency is maintained with standard structure

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

