# Templates Directory

This directory contains templates for creating new workspaces and users in dendrita.

## Structure

```
.dendrita/templates/
├── workspace-template/        # Template for creating new workspaces
│   └── README.md              # Workspace template documentation
└── README.md                  # This file
```

## Available Templates

### workspace-template
**Location:** `.dendrita/templates/workspace-template/`  
**Purpose:** Template for creating new workspaces

**Usage:**
```bash
cp -r .dendrita/templates/workspace-template workspaces/[new-workspace-name]
```

**Contains:**
- Standard workspace folder structure
- README.md files for each folder
- Example configuration files
- Documentation on workspace structure

### User Templates
**Location:** `.dendrita/users/example-user/`  
**Purpose:** Template for creating new users

**Usage:**
```bash
cp -r .dendrita/users/example-user .dendrita/users/[new-user-id]
```

**Contains:**
- User profile template
- Agent examples
- Skill examples
- Work-mode template

## Purpose

Templates are separated from active workspaces to:
- Keep workspace directories clean (only real workspaces)
- Make templates easily identifiable
- Prevent confusion between templates and active content
- Allow templates to be versioned separately

## See Also

- `.dendrita/users/example-user/` - User template
- `.dendrita/WORKSPACE-STRUCTURE.md` - Workspace structure standard
- `.dendrita/templates/workspace-template/` - Workspace template reference

---

**Last updated:** 2025-11-04  
**Version:** 1.0

