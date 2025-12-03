---
name: quick-start
description: "Quick Start Guide for dendrita"
type: documentation
created: 2025-12-02
updated: 2025-12-02
tags: ["documentation", "getting-started", "guide"]
category: infrastructure
---

# Quick Start Guide for dendrita

This guide consolidates initialization, current status, and verification information to help you get started with dendrita.

---

## What is .dendrita?

`.dendrita/` is a **reflective base** that contains metadata and documentation for Cursor. Cursor must READ these files to understand the project context and apply the documented behavior.

**IMPORTANT NOTE:** `.dendrita/` is NOT a code execution system. It is metadata and references that Cursor reads directly.

### System Name

The system is called **"dendrita"** or **"dendrita system"**. The collection of hooks, agents, skills, and scripts is collectively referred to as:

- **"dendrita system"** - The complete system
- **"dendrita components"** - Hooks, agents, skills, and scripts
- **"dendrita infrastructure"** - Technical components of the system

The system is organized into two main layers:

1. **Verbal Layer**: hooks, agents, skills (documentation and behavior references)
2. **Logical Layer**: scripts (executable code for integrations)

For more details, see `.dendrita/docs/SYSTEM-BEHAVIOR.md`.

---

## System Initialization

### Configuration Status

✅ **Complete configuration:**
- `settings.json` configured as reflective metadata
- Hooks documented as behavior references
- Skills defined in `skill-rules.json` (located in `.dendrita/users/[user-id]/skills/`)
- Agents created in `.dendrita/users/[user-id]/agents/`
- User and profile system configured in `.dendrita/users/`

### Files Created

- `.dendrita/settings.json` - Reflective metadata of the project
- `.dendrita/settings.local.json` - Local metadata (you can customize)
- `.dendrita/hooks/` - Behavior references (NOT executable)
- `.dendrita/users/[user-id]/agents/` - Specialized agents (user-specific)
- `.dendrita/users/[user-id]/skills/` - Contextual knowledge skills (user-specific)
- `.dendrita/users/` - User and profile system (created during initialization)

---

## Current Status

**Date:** 2025-12-02  
**Status:** ✅ Complete configuration as reflective base

### Configured Components

#### Structure

- **Main folders:** hooks, users, integrations
- **Reference files:** Behavior references (not executable)
- **Skills:** Configured in `.dendrita/users/[user-id]/skills/skill-rules.json`
- **Agents:** Available in `.dendrita/users/[user-id]/agents/`
- **Configuration:** `settings.json` as reflective metadata

#### Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Structure | ✅ Complete | Main folders configured |
| Reference files | ✅ Available | All files exist and are readable |
| Configuration | ✅ Complete | `settings.json` as reflective metadata |
| Skills | ✅ Configured | In `skill-rules.json` |
| Agents | ✅ Ready | Available in user directories |
| .cursorrules | ✅ Created | Instructions for Cursor in root |
| Dependencies | ✅ Not required | File read only |
| Installation | ✅ Not required | Immediate reflective system |

---

## Next Steps for Cursor

### 1. Review .cursorrules

Cursor should review `.cursorrules` in the project root first. This file instructs Cursor to:
- Review `.dendrita/` before any action
- Use the contents of `.dendrita/` as a reflective base
- Read hooks as references, do not execute them

### 2. Read .dendrita/settings.json

This file contains project metadata. It is NOT execution configuration, but reflective information that Cursor should use.

### 3. Use Skills Reflexively

When receiving a user prompt:

1. **Read `.dendrita/users/[user-id]/skills/skill-rules.json`**
   - Compare the prompt against `keywords` and `intentPatterns`
   - Identify relevant skills

2. **Read the corresponding `SKILL.md` file**
   - Apply the contextual knowledge of the skill

3. **Suggest to the user** if appropriate

### 4. Detect and Use Users

When starting a session or detecting an empty repository:

1. **Check `.dendrita/users/`**
   - If it doesn't exist or is empty: start initialization process (see `.dendrita/hooks/repo-initialization.md`)
   - If it exists: identify active user and load corresponding profile

2. **Apply user profile:**
   - Verify active workspace
   - Load workspace default profile (if exists) or user default profile
   - Apply profile preferences and work context

3. **Use profile to customize behavior:**
   - Prioritize skills from `frequently_used_skills`
   - Suggest agents from `preferred_agents`
   - Adapt communication style according to preferences

**Documentation:** See `.dendrita/users/README.md` for complete details.

### 5. Use Hooks as References

Hooks in `.dendrita/hooks/` are behavior references:

- **session-initialization-verification**: Cursor should verify configuration at session start
- **repo-initialization**: Cursor should apply initialization logic when detecting empty repository
- **skill-activation-prompt**: Cursor should apply logic to identify relevant skills (considering active profile)
- **post-tool-use-tracker**: Cursor should apply logic to identify file context

**NOT executed** - they are references that Cursor reads and applies.

---

## Reflective Usage

### For Cursor:

1. **When receiving a prompt:**
   - Review `.dendrita/users/[user-id]/skills/skill-rules.json`
   - Identify relevant skills
   - Read corresponding `SKILL.md`

2. **When editing files:**
   - Identify file context (project, practice, mode)
   - Maintain coherence with persistent documents
   - Consider context for future actions

3. **When working with projects:**
   - Read `project_context.json` before responding (or `master-plan.md` and `tasks.md` if JSON doesn't exist)
   - Review `tasks.md` to understand status
   - Consult `master-plan.md` for general strategy
   - Update `project_context.json` after important decisions (run `update-project-context.ts`)

---

## No Installation Required

✅ **NO need to install anything:**

- ❌ NO `npm install` required
- ❌ NO Node.js required (for reading documentation)
- ❌ NO execution permissions required (for reading)
- ❌ NO special configuration required

**Cursor only needs to READ these files.**

---

## Benefits of the Reflective System

### No Installation Required

- ✅ NO `npm install` required
- ✅ NO Node.js installation required
- ✅ NO execution permissions required
- ✅ NO special configuration required

### Read-Only Requirement

- ✅ Cursor only needs to READ the files
- ✅ Cursor applies documented behavior
- ✅ No external dependencies
- ✅ Works immediately without setup

### Simplified Maintenance

- ✅ Reference files easy to maintain
- ✅ Logic clearly documented
- ✅ No dependency issues
- ✅ No permission issues

---

## Verification

### How to Verify Cursor is Reading Correctly?

#### Test 1: Verify Cursor reviews .cursorrules

**Instructions:**
1. Cursor should review `.cursorrules` in the root first
2. This file instructs Cursor to review `.dendrita/` before any action

**Verify:**
- Does Cursor mention having reviewed `.dendrita/`?
- Does Cursor apply documented behavior?

#### Test 2: Verify Cursor reads skill-rules.json

**Instructions:**
1. Write a prompt that activates a skill (ex: "create new project")
2. Cursor should:
   - Review `.dendrita/users/[user-id]/skills/skill-rules.json`
   - Identify relevant skills
   - Suggest or apply the corresponding skill

**Expected:**
- Cursor identifies relevant skills based on keywords and intentPatterns
- Cursor reads corresponding `SKILL.md`
- Cursor applies contextual knowledge

#### Test 3: Verify Cursor reads hooks as references

**Instructions:**
1. Cursor should read `.dendrita/hooks/README.md`
2. Cursor should understand that hooks are references, not executables
3. Cursor should apply documented behavior

**Expected:**
- Cursor does NOT attempt to execute scripts
- Cursor YES applies documented logic reflexively

---

## Troubleshooting

### Cursor is not applying the behavior

1. **Verify that Cursor has read `.cursorrules`:**
   - The file in the root must instruct Cursor to review `.dendrita/` first
   - Cursor should mention having read it

2. **Verify that Cursor reviews `.dendrita/`:**
   - Cursor should review `.dendrita/users/[user-id]/skills/skill-rules.json` when receiving prompts
   - Cursor should read hooks as references

3. **Verify that Cursor is NOT attempting to execute hooks:**
   - Hooks are references, NOT executable scripts
   - Cursor should read them and apply logic, not execute them

### Skills are not activating

1. **Verify that Cursor is reviewing `skill-rules.json`:**
   ```markdown
   - Is Cursor comparing the prompt against keywords and intentPatterns?
   - Is Cursor identifying relevant skills?
   - Is Cursor reading the corresponding SKILL.md files?
   ```

2. **Suggest explicitly:**
   - If you identify a relevant skill, suggest it explicitly to the user
   - Read the `SKILL.md` and apply contextual knowledge

3. **Verify that skills exist:**
   - Check `.dendrita/users/[user-id]/skills/[skill-name]/SKILL.md`

---

## Conclusion

**Status:** Everything is correctly configured as reflective base. `.dendrita/` is ready for Cursor to use reflexively.

**Does NOT require:**
- ❌ Installation of dependencies
- ❌ Special configuration
- ❌ Execution permissions

**Only requires:**
- ✅ Cursor to read `.cursorrules` first
- ✅ Cursor to review `.dendrita/` before important actions
- ✅ Cursor to apply documented behavior

**Next step:** Verify that Cursor reads and applies behavior correctly.

---

**For more information:** 
- See `.cursorrules` in the root
- See `.dendrita/hooks/README.md` for hooks documentation
- See `.dendrita/docs/SYSTEM-BEHAVIOR.md` for component relationships
- See `.dendrita/docs/TECHNICAL-PARADIGMS.md` for design principles

---

**Last updated:** 2025-12-02

