---
name: status-reporter
description: Quick status checks for Yahboom project
model: haiku
allowed-tools:
  - Bash
  - Read
  - Glob
---

# Agent: Status Reporter

## Purpose

Generate quick status report for Yahboom project. Used for daily check-ins or progress reviews.

---

## Execution

### Check 1: Build Status
```bash
npm run build 2>&1 | tail -5
```
Report: pass/fail

### Check 2: Test Status
```bash
npm run test 2>&1 | tail -10
```
Report: X passed, Y failed

### Check 3: Data Status
```bash
cat public/data/builds.json | jq '. | length'
```
Report: N builds in catalog

### Check 4: Git Status
```bash
git status --short
git log --oneline -3
```
Report: uncommitted changes, recent commits

---

## Output Format

```markdown
# Yahboom Status — [Date]

## Build
✓ Production build passing

## Tests
✓ 12/12 tests passing

## Data
📊 32 builds in catalog
📸 Latest scrape: 2026-01-20

## Git
- Branch: main
- Uncommitted: 2 files
- Last commit: "feat: add sensor filter"
```

---

## Constraints

- Complete within 30 seconds
- Report only — no fixes
- Keep output concise
- Include actionable items if issues found
