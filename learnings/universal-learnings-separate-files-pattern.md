# Learnings: Separate files for visibility and processing

**Date:** 2026-01-22
**Category:** universal
**Tags:** bob, learnings, organization, files
**Source:** Bob factory (distributed 2026-01-24)
**Confidence:** high

---

## Problem

Storing all learnings in a single category file (e.g., `universal.md`) makes it hard to:
- See what learnings exist at a glance
- Process specific learnings programmatically
- Find relevant patterns quickly
- Track when individual learnings were added/updated

## Pattern

Store each learning in its own file with **category prefix** for sorting:

```
learnings/
├── ops-render-deploy-clear-cache.md
├── stack-nextjs-middleware-edge-runtime.md
├── universal-learnings-separate-files-pattern.md
└── universal-notion-mention-no-curly-brackets.md
```

**Naming convention:** `{category}-{topic}-{specific-issue}.md`
- **Category FIRST** for alphabetical sorting by type
- Categories: `universal`, `stack`, `ops`, `testing`
- Lowercase, hyphen-separated
- Descriptive enough to understand without opening
- **Max 80 characters** (including `.md`) for cross-platform safety

**File structure:**
```markdown
# Title

**Date:** YYYY-MM-DD
**Category:** universal | stack | ops | testing
**Tags:** comma, separated, tags
**Source:** where this was learned
**Confidence:** high | medium | low

---

## Problem
[What goes wrong]

## Pattern
[What to do instead]

## Anti-pattern
[What NOT to do]

## Related
[Links to related files/docs]
```

## Benefits

1. **Visibility:** `ls learnings/` shows all patterns instantly, sorted by category
2. **Processing:** Glob by category (`universal-*.md`) or topic (`*-notion-*.md`)
3. **Git history:** Individual file history shows when each learning evolved
4. **Modularity:** Edit one learning without touching others

## Migration

1. Extract learnings from category files into individual files
2. Name with `{category}-{topic}-{issue}.md` convention
3. Delete category files when empty
4. Category files should NOT be kept as indexes — the filesystem IS the index
