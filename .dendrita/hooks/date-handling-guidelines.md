---
name: date-handling-guidelines
description: "Date Handling Guidelines - Guías para manejo correcto de fechas en dendrita"
type: hook
created:
  2025-12-02T00:00:00.000Z
  
updated:
  2025-12-02T00:00:00.000Z
  
tags: ["hook", "behavior-reference", "guidelines", "dates", "formatting"]
category: behavior-reference
---

# Date Handling Guidelines

Behavior reference for Cursor - guidelines for correctly handling dates in dendrita system.

---

## What is this Hook?

This hook documents the expected behavior that Cursor must apply when working with dates in dendrita documents and scripts.

**Purpose:** Ensure consistent and correct date formatting across all dendrita documents, preventing date errors that occur frequently when dates are assumed without verification.

**Problem addressed:** Dates are frequently incorrect because Cursor doesn't have direct access to system date in "ask mode" and may assume dates without verification.

---

## Expected Behavior

### 1. CRITICAL: Always Verify Current Date

**Before writing any date in documents, Cursor MUST:**

1. **In agent mode:**
   - Execute: `date +"%Y-%m-%d"` to get current date in ISO format
   - Execute: `date +"%d de %B de %Y"` and translate month to Spanish for Spanish format
   - Use the actual system date, never assume

2. **In ask mode:**
   - **If date is critical:** Ask user for current date
   - **If date is not critical:** Use placeholder `[FECHA]` and note that date needs verification
   - **Alternative:** Use relative dates ("hoy", "ayer") that can be resolved later

3. **Never assume dates:**
   - ❌ Don't use dates from training data
   - ❌ Don't guess based on context
   - ❌ Don't use dates from other documents without verification

### 2. Date Format Standards

#### For Markdown Documents

**ISO Format (preferred for technical documents):**
- Format: `YYYY-MM-DD`
- Example: `2025-12-02`
- Use in: `master-plan.md`, `tasks.md`, frontmatter `updated:` fields

**Spanish Format (for human-readable documents):**
- Format: `DD de mes de AAAA`
- Example: `2 de diciembre de 2025`
- Use in: `current-context.md`, wrap-up documents, human-facing content

**ISO with Time (for timelines):**
- Format: `YYYY-MM-DD HH:mm`
- Example: `2025-12-02 14:30`
- Use in: `work-timeline.md`, `dendrita-communication.md`

#### For JSON Files

**ISO 8601 Format:**
- Format: `YYYY-MM-DDTHH:mm:ss.sssZ`
- Example: `2025-12-02T14:30:00.000Z`
- Use in: `project_context.json`, `context.json`, all JSON timestamps

#### For Scripts

**Use utility functions from `utils/common.ts`:**
- `getCurrentDateISO()` - Returns `YYYY-MM-DD`
- `formatDateSpanish(date?)` - Returns `DD de mes de AAAA`
- `formatDateISO(date?)` - Returns `YYYY-MM-DD`

### 3. Date Update Patterns

#### When Updating Documents

**For `tasks.md`:**
```markdown
**Última actualización:** [FECHA_ACTUAL]
```

**For `master-plan.md`:**
```markdown
**Última actualización:** [FECHA_ACTUAL]
```

**For `current-context.md`:**
```markdown
**Última actualización:** [FECHA_ACTUAL]
```

**For frontmatter:**
```yaml
updated:
  [FECHA_ACTUAL]T00:00:00.000Z
```

#### When Creating New Documents

**Always include:**
- Creation date in frontmatter
- Last update date in document body
- Use actual current date, never assume

### 4. Date Verification Process

**Before writing dates:**

1. **Get current date:**
   ```bash
   date +"%Y-%m-%d"  # ISO format
   date +"%d de %B de %Y"  # Spanish format (translate month)
   ```

2. **Verify date makes sense:**
   - Check if date is in the future (shouldn't be)
   - Check if date is too far in the past (might be wrong)
   - Compare with dates in related documents

3. **Use appropriate format:**
   - Technical documents → ISO format
   - Human-readable → Spanish format
   - JSON/scripts → ISO 8601

### 5. Common Date Errors to Avoid

**❌ DON'T:**
- Assume dates from context
- Use dates from training data
- Copy dates from other documents without verification
- Use placeholder dates like "2025-01-19" without checking

**✅ DO:**
- Always get current date from system
- Verify date before writing
- Use correct format for context
- Ask user if date is unclear

---

## Integration with Scripts

### Using Date Utilities

Scripts should use date utilities from `utils/common.ts`:

```typescript
import { getCurrentDateISO, formatDateSpanish, formatDateISO } from './utils/common';

// Get current date in ISO format
const today = getCurrentDateISO(); // "2025-12-02"

// Format date in Spanish
const spanishDate = formatDateSpanish(); // "2 de diciembre de 2025"

// Format specific date
const specificDate = formatDateISO(new Date('2025-12-02')); // "2025-12-02"
```

### Date in Script Output

When scripts generate documents:
- Use `getCurrentDateISO()` for ISO format
- Use `formatDateSpanish()` for human-readable format
- Never hardcode dates

---

## Examples

### Example 1: Updating tasks.md

**Before (incorrect):**
```markdown
**Última actualización:** 19 de enero de 2025
```

**After (correct):**
```markdown
**Última actualización:** 2 de diciembre de 2025
```

### Example 2: Creating Wrap-up Document

**Before (incorrect):**
```markdown
**Fecha:** 19 de enero de 2025
```

**After (correct):**
```markdown
**Fecha:** 2 de diciembre de 2025
```

### Example 3: Updating Frontmatter

**Before (incorrect):**
```yaml
updated:
  2025-01-19T00:00:00.000Z
```

**After (correct):**
```yaml
updated:
  2025-12-02T00:00:00.000Z
```

---

## Notes for Cursor

1. **CRITICAL:** Always verify current date before writing
   - In agent mode: Execute `date` command
   - In ask mode: Ask user or use placeholder

2. **Use correct format:**
   - ISO for technical/JSON
   - Spanish for human-readable
   - ISO with time for timelines

3. **Never assume dates:**
   - Always get from system
   - Always verify before writing
   - Ask user if unclear

4. **Use utility functions:**
   - Import from `utils/common.ts`
   - Use `getCurrentDateISO()`, `formatDateSpanish()`, `formatDateISO()`

5. **Check related documents:**
   - Compare dates with related files
   - Ensure consistency
   - Verify dates make sense

---

## References

- `.dendrita/integrations/scripts/pipelines/context-pipeline/utils/common.ts` - Date utility functions
- `.dendrita/hooks/project-wrap-up.md` - Wrap-up process (uses dates)
- `.dendrita/hooks/work-timeline.md` - Timeline format (uses dates with time)

---

**For Cursor:** This hook is a behavior reference. You must read this file and apply the documented logic when working with dates. Always verify current date before writing, never assume dates, and use appropriate format for context.

