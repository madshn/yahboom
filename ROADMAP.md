# Roadmap: Building:bit Projects Gallery

**Created:** 2026-01-15
**Current Phase:** 1
**Status:** IN_PROGRESS

---

## Phase Model

| Phase | Goal | Gate |
|-------|------|------|
| 1: Validation | Proof of life | External signal (kid using site to build) |
| 2: Growth | Full catalog + features | Business decision |
| ∞: Sustain | Maintenance | Ongoing |

---

## Phase 1: Validation (ACTIVE)

**Status:** IN_PROGRESS
**Exit Criteria:** Kid successfully uses site to select and build a robot project

### Requirements

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| REQ-001 | Visual gallery with build cards | [x] | Complete |
| REQ-002 | Sensor/difficulty filtering | [x] | Complete |
| REQ-003 | Modal with build details | [x] | Complete |
| REQ-004 | Step-by-step assembly viewer | [x] | LEGO-app style |
| REQ-005 | Coding lesson viewer | [x] | MakeCode + Python |
| REQ-006 | Local optimized images | [x] | WebP via Sharp |
| REQ-007 | Deployed and accessible | [x] | Render static site |
| REQ-008 | Proof-of-life validation | [~] | In use by family |

### Scope Boundaries

**In Scope:**
- Gallery browsing and filtering
- Assembly instruction viewing
- Coding tutorial viewing
- Core build catalog (validation subset)

**Out of Scope (Phase 2+):**
- Full 32-build catalog
- Offline mode
- Progress tracking
- User accounts

### Work Log

| Date | What | Outcome |
|------|------|---------|
| 2025-01 | Initial gallery | 3 builds visible |
| 2025-01 | Step viewer | LEGO-app style navigation |
| 2025-01 | Lesson viewer | Tabbed MakeCode/Python |
| 2025-01 | Render deployment | Live at building-bit-superkit.onrender.com |
| 2026-01-15 | Bob adoption | Factory integration |

---
<!-- PHASE_GATE: Do not proceed until Phase 1 exit criteria met -->
---

## Phase 2: Growth (LOCKED)

**Status:** BLOCKED
**Prerequisite:** Phase 1 exit criteria achieved (sustained family use)
**Exit Criteria:** Business decision — continue/expand or sustain

### Requirements

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| REQ-009 | Full 32-build catalog | [ ] | All assembly courses |
| REQ-010 | Complete course mapping | [ ] | All MakeCode/Python links |
| REQ-011 | Offline image caching | [ ] | Service worker |
| REQ-012 | Build progress tracking | [ ] | localStorage |

### Scope Boundaries

**In Scope:**
- Full catalog expansion
- Performance optimization
- Offline capability
- Enhanced navigation

**Out of Scope:**
- User accounts
- Social features
- Monetization

---

## Phase ∞: Sustain

**Status:** FUTURE
**Trigger:** Business decision after Phase 2

### Maintenance Scope

- Yahboom site structure changes (scraper updates)
- Dependency updates
- Bug fixes
- Minor UI improvements

---

## Agentic Instructions

```
PHASE CHECK PROTOCOL:

Before starting work on any requirement:
1. Check current phase status (IN_PROGRESS vs BLOCKED)
2. Verify requirement belongs to active phase
3. If requirement is in LOCKED phase → STOP and flag

If working on Phase 2+ requirement while Phase 1 incomplete:
→ WARNING: "This requirement belongs to Phase [N] which is LOCKED"
→ ASK: "Phase 1 exit criteria not met. Continue anyway?"

Phase transition:
→ Only human can unlock next phase
→ Update status: IN_PROGRESS → COMPLETE
→ Update next phase: BLOCKED → IN_PROGRESS
```

---

## Version History

| Version | Date | Change |
|---------|------|--------|
| 0.1 | 2025-01 | Initial development |
| 0.2 | 2026-01-15 | Bob adoption, factory roadmap |
