# Project Learnings

Local learnings captured from this project. Bob pulls these during rounds.

---

## How to Capture

```
/bob learn "Your learning here"
/bob learn --category stack "Stack-specific learning"
```

Learnings are written to this folder and pulled by Bob during `/bob rounds`.

---

## Categories

| Category | File | What to Capture |
|----------|------|-----------------|
| `stack` | `stack.md` | Framework gotchas, library patterns, build issues |
| `ops` | `ops.md` | Deployment, CI/CD, automation patterns |
| `universal` | `universal.md` | Cross-cutting patterns, architecture insights |

---

## Format

Each learning entry follows this format:

```markdown
### [YYYY-MM-DD] Title

**Category:** [category]
**Tags:** [comma, separated]
**Confidence:** [high/medium/low]

[Description — 2-4 sentences]

**Pattern:** (optional)
[Code or config example]

**Anti-pattern:** (optional)
[What NOT to do]
```

---

## Pulled by Bob

During `/bob rounds`, Bob checks this folder for new learnings since his last visit. Approved learnings are promoted to the factory knowledge base at `~/ops/bob/learnings/`.
