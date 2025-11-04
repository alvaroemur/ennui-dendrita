# Archived Files Index

This directory contains archived code, rules, and configurations that are no longer actively used but may be useful for reference.

---

## Archive Structure

```
archived/
├── code/
│   ├── scripts/        # Archived scripts
│   ├── examples/       # Archived examples
│   └── tests/          # Archived test files
├── rules/
│   ├── skills/         # Archived skills
│   ├── agents/         # Archived agents
│   └── hooks/          # Archived hooks
└── configs/            # Archived configurations
```

---

## Archive Process

### Automatic Identification

The system automatically identifies test and debug files every 24 hours:

**Manual execution:**
```bash
bash .dendrita/archived/scripts/run-identify.sh
```

**Setup automatic execution (already configured):**
```bash
bash .dendrita/archived/scripts/setup-auto-run.sh
```

This creates a launchd job (macOS) or cron job (Linux) that runs daily at 2:00 AM.

**View reports:**
- Check `.dendrita/archived/test-debug-report.md` for the latest report
- Check `.dendrita/archived/logs/identify.log` for execution logs

### 1. Identify Files to Archive

Files to archive include:
- Test files that are no longer relevant
- Debug scripts that are obsolete
- Examples that are outdated
- Deprecated rules or configurations

The automated script identifies:
- Files matching patterns: `test-*.ts`, `*-test.ts`, `debug-*.ts`, `*-debug.ts`
- Files not modified in 6+ months (deprecated)
- Duplicate or redundant functionality

### 2. Create Archive Directory

Create timestamped directory: `YYYY-MM-DD-[description]`

Example: `2025-01-15-deprecated-test-scripts`

### 3. Move Files

Move files to archive directory and create `ARCHIVE-README.md` with:
- Reason for archiving
- Date archived
- Original location
- Dependencies
- Restoration instructions

### 4. Update References

- Remove from `package.json` scripts
- Update documentation
- Remove from active directories
- Verify no broken references

---

## Current Archives

### Code Archives

#### Scripts
- `scripts/archived/cleanup-duplicates.py` - Archived in `.dendrita/integrations/scripts/archived/`

### Examples
- None yet

### Tests
- None yet

---

## Rules Archives

### Skills
- None yet

### Agents
- None yet

### Hooks
- None yet

---

## Archive Maintenance

### Automatic Execution

The identification script runs automatically every 24 hours at 2:00 AM:
- **macOS**: Uses launchd (configured in `~/Library/LaunchAgents/com.dendrita.debug-identify.plist`)
- **Linux**: Uses cron (configured in crontab)

**To disable automatic execution:**
```bash
# macOS
launchctl unload ~/Library/LaunchAgents/com.dendrita.debug-identify.plist

# Linux
crontab -e  # Remove the entry manually
```

**To re-enable:**
```bash
bash .dendrita/archived/scripts/setup-auto-run.sh
```

**To check status:**
```bash
# macOS
launchctl list | grep com.dendrita.debug-identify

# Linux
crontab -l | grep dendrita
```

### Review Frequency
- Quarterly review of archived files
- Remove archives older than 2 years unless still needed for reference
- Document removal in `ARCHIVE-README.md`
- Check automated reports weekly in `.dendrita/archived/test-debug-report.md`

### Restoration Process
1. Check `ARCHIVE-README.md` in archive directory
2. Review dependencies and related files
3. Restore files to original location
4. Update references and documentation
5. Test restored functionality

---

## Related Documentation

- `.dendrita/hooks/code-debugging-archiving.md` - Archiving process
- `.dendrita/integrations/README.md` - Integration documentation

