# Workspace Template

This is a **workspace template** for creating new workspaces within dendrita.

**Location:** `.dendrita/templates/workspace-template/`  
**Purpose:** Reference template for creating new workspaces

## Structure

Each workspace must contain the following folders:

- `active-projects/` - Active projects
- `archived-projects/` - Completed projects
- `best-practices/` - Templates and company-specific methodologies
- `company-management/` - General company management (optional)
- `stakeholders/` - Allies and stakeholder management
- `tools-templates/` - Reusable tools and templates

**Note:** Specialized work-modes have been consolidated into agents and skills in `.dendrita/users/[user-id]/`. See `.dendrita/users/example-user/` for reference structure.

## Optional Files

- `config-estilo.json` - Company-specific style rules
- `scrapers-config.json.example` - Scraper configuration template

## Project Structure

Each project within `active-projects/` or `archived-projects/` must follow the standard structure:

- `master-plan.md` - Project master plan
- `current-context.md` - Current state and decisions
- `tasks.md` - Task list with status
- `README.md` - Project documentation (optional)

## How to Use This Template

1. **Copy the template structure:**
   ```bash
   cp -r .dendrita/templates/workspace-template workspaces/[new-workspace-name]
   ```

2. **Customize the workspace:**
   - Replace "Template" references with your company name
   - Customize README.md files in each folder according to company needs
   - Add specific content in each folder as needed

3. **Set up your workspace:**
   - Create projects in `active-projects/`
   - Add methodologies in `best-practices/`
   - Configure products in `products/`
   - Set up stakeholder management in `stakeholders/`

## See Also

- `.dendrita/users/example-user/` - User template structure
- `.dendrita/WORKSPACE-STRUCTURE.md` - Complete workspace structure standard
- `.dendrita/templates/workspace-template/` - This template serves as the reference

---

**Last updated:** 2025-11-04  
**Version:** 2.0

