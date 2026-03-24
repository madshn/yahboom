# Human Associate Profile

**Maintained by:** Aston (Executive Assistant)
**Location:** `~/team/aston/entourage/principal/`
**Last Updated:** 2026-02-12
**System identifier:** `human`
**Goldratt's Cycle:** Strategy paper Ch. 1 — The Human Associate

---

## Resume

| Field | Value |
|-------|-------|
| **Name** | Mads |
| **Role** | Principal |
| **Type** | `human` (finite-singular) |
| **Status** | Active |
| **Timezone** | CET (Europe/Oslo) |
| **System ID** | `human` — used in `participants[]`, `associate_type`, utilization queries |

### Primary Responsibilities

1. Strategic direction and product decisions
2. Quality validation and review of Associate output
3. Revenue relationships and client-facing work
4. Creative direction and brand identity
5. Final authority on all Entourage decisions
6. Constitutional amendments (approve/reject)
7. Budget allocation (Cloud spending, infrastructure investment)

### Advisory

Advises on everything, delegates execution. Reviews output, not process — unless trust is being established.

---

## Identity

The Principal. The single human in a team of AI Associates. Solopreneur running a consultancy with an AI workforce.

### Operating Philosophy

> *"Strive towards goals but operate in world's provided conditions."*

1. Builder first, manager second
2. Deep thinker — prefers understanding systems before optimizing
3. Intrinsically motivated — forcing work kills quality
4. Pragmatic perfectionist — "good enough" ships, "perfect" doesn't
5. Fun and curiosity are productive inputs, not distractions

---

## Capacity Model

```
type:                  finite-singular
maxHoursPerDay:        12          # hard ceiling
effectiveHoursPerDay:  8           # realistic working hours
instances:             1           # cannot scale horizontally
spawnable:             false       # solopreneur constraint
```

### Energy Template

Derived values for `attention_quality_tier` in Goldratt's Cycle architecture (Section 3.6).

| Time Block (CET) | Energy State | Quality Tier | Work Type |
|-------------------|-------------|-------------|-----------|
| 06:00–09:00 | No screens. Intuitions surface. Meditation if possible. | `offline` | Reflection, journaling, insight capture |
| 09:00–10:00 | Morning walk, then check-in. Set intention. Triage. | `sonnet` | Planning, ceremony, triage |
| 10:00–13:00 | Peak focus. Flow state accessible. Deep work. | **`opus`** | Architecture, strategy, complex builds, novel problems |
| 13:00–15:30 | Depleting. Post-lunch dip. Fatigue accumulating. | `sonnet` → `haiku` | Review, validation, lighter tasks |
| 15:30–20:00 | Family time. No work. Recharge. | `offline` | N/A |
| 20:00–00:00 | Evening flow states. Deep focus when motivated. | **`opus`** (flow) / `sonnet` (otherwise) | Exploration, building, creative sessions |

**Two opus windows** — morning 10-13 and evening 20-00. The evening window is fragile: depends on intrinsic motivation and "wanting to" energy, not discipline. Forcing it kills it.

**v1 system derivation:** `started_at` hour → tier from this table. Evening defaults to `sonnet`; upgrade to `opus` when session > 2h with opus-tier model.

### Concurrency Model

The Principal operates as a **process scheduler** across multiple concurrent Associate sessions.

```
Physical setup:
  3 monitors
  6+ VSCode windows (one per Associate, sometimes more)
  Multiple terminals per Associate

Attention dispatch:
  Primary flow:   Deep work with one Associate        (opus-tier attention)
  Interleaved:    Checking/nudging between waits       (sonnet-tier)
  Micro-switches: Quick unblocks, approvals, dispatch  (haiku-tier)

Process states per session:
  Running   — Principal actively engaged
  Ready     — has work, autonomously progressing, may need attention soon
  Blocked   — waiting for Principal decision, clarification, or review
  Idle      — no active task assigned
```

This concurrency model enables depleting Max 20x quotas — the Principal interleaves across Associates through dispatch efficiency, not single-session intensity.

### Fragmentation Sensitivity

```
Fragmentation Index = (context switches per hour) × (avg switch cost in minutes)

Low:   2/hr × 5min = 10min lost/hr → 83% effective
High:  8/hr × 5min = 40min lost/hr → 33% effective
```

Deep blocks produce opus-tier attention. Fragmented hours produce haiku-tier at best.

---

## Cost Model

```
type:        opportunity-cost
hourlyRate:  ~1000 NOK           # target at ~2M NOK annual
currency:    NOK
```

The Principal's cost is not monetary spend but **opportunity cost**. One hour in a low-value session is one hour not spent on the highest-leverage work. This makes task-to-quality-tier matching critical: opus attention on opus-worthy work.

The Principal is the most expensive resource in the system.

---

## Role Clarity

### Owns Exclusively

1. Strategic direction (product, business, market)
2. Revenue relationships (client-facing, sales, partnerships)
3. Final authority on all Entourage decisions
4. Constitutional amendments (approve/reject)
5. Budget allocation (Cloud spend, infrastructure)
6. Associate lifecycle (activate, deactivate, promote to Cloud)

### Delegates To

| Domain | Associate | Delegation Style |
|--------|-----------|-----------------|
| Software builds | Bob | Reviews output, trusts process |
| Runtime operations | Mira | Intervenes on incidents only |
| Revenue operations | Rex | Reviews all billing |
| Metrics & data | Metrick | Trusts schema decisions |
| Growth & content | Leah | Reviews public-facing output |
| Planning & governance | Aston | Manages daily rhythm |

### Escalation Patterns

**Receives escalations via:**

| Channel | Urgency | From |
|---------|---------|------|
| Active terminal session | Immediate | Any Associate during paired work |
| Aston check-in | Daily | Aston (batched from all Associates) |
| Telegram | Urgent | Aston (Entourage urgent channel) |

**Routes work to:**

| Signal | Route To |
|--------|----------|
| "deploy", "build", "implement" | Bob |
| "something is down", "slow", "error in prod" | Mira |
| "invoice", "refund", "billing" | Rex |
| "metrics", "data", "dashboard" | Metrick |
| "content", "blog", "landing page" | Leah |
| Unclear ownership | Aston (for triage) |

---

## Colleagues

| Associate | Role | Interaction Pattern | Trust Level |
|-----------|------|-------------------|-------------|
| **Aston** | Executive Assistant | Daily check-in, all ceremonies, governance. First point of contact for planning. Manages Principal's calendar, email triage, Notion. | High — manages the rhythm |
| **Bob** | Factory Manager | Deep build sessions (opus-tier). Reviews PRs, validates architecture. Multiple concurrent terminals typical. Highest session volume. | High — trusts process, reviews output |
| **Mira** | Runtime Operator | Incident response, deployment oversight, cost monitoring. Sessions spike during infrastructure work. | High — intervenes on incidents only |
| **Rex** | Revenue Operator | Billing, invoicing, subscription management. Lower session frequency, higher stakes per session. | Medium — reviews all billing actions |
| **Metrick** | Metrics Collector | KPI schema, data pipeline, dashboard queries. Consult-style sessions — define what to measure, Metrick implements. | High — trusts schema decisions |
| **Leah** | Growth Operator | Content strategy, blog posts, landing pages, SEO. Creative collaboration sessions. | Medium — reviews public-facing output |

### Interaction Patterns

| Pattern | When | Example |
|---------|------|---------|
| **Deep pair** | Opus-tier window, complex problem | 3h architecture session with Bob |
| **Quick dispatch** | Haiku-tier, unblock needed | 5min approval for Mira deploy |
| **Ceremony** | Scheduled ritual | Morning check-in with Aston |
| **Review** | Post-completion validation | Read Bob's PR, approve or request changes |
| **Consult** | Define requirements | Tell Metrick what KPIs to track |

---

## Tools

The Principal uses physical and software tools, not MCP endpoints. No `{name}-tools` or `{name}-private-tools` layer — the Principal interacts with Associates directly through terminal sessions.

### Owned

| Tool | Purpose |
|------|---------|
| Claude Code (terminal) | Primary interface to all Associates |
| VSCode (6+ windows) | IDE, concurrent session management |
| 3× monitors | Physical workspace layout |
| Chrome + LocalPush | Web, research, session data capture |

### Consumed (via Associates)

| Tool | Provided By | How Principal Accesses |
|------|------------|----------------------|
| Notion | Aston (`aston-private-tools`) | Via Aston ceremonies and direct Notion app |
| GitHub | Bob (build) | Direct access + PR review |
| Gmail | Aston (`aston-private-tools`) | Via Aston triage + direct Gmail app |
| Google Calendar | Aston (`aston-private-tools`) | Via Aston scheduling + direct Calendar app |
| Telegram | Aston (escalation channel) | Direct Telegram app |
| Metrick KPIs | Metrick (MCP) | Via Aston ceremonies (`/kpi`) |
| Kiosk | `associates-tools` | Via any Associate session |

---

## Habits & Ceremonies

| Ceremony | Frequency | With | Timing |
|----------|-----------|------|--------|
| Morning check-in | Daily | Aston | 09:00–10:00 |
| Week planning | Monday | Aston | Morning |
| Weekly review | Friday | Aston | Afternoon |
| Quarter planning | Quarterly | Aston | Start of quarter |
| Year planning | Annual | Aston | Start of year |
| Bob rounds review | Ad hoc | Bob | As scheduled |
| Cloud oversight | Weekly (when live) | Mira | TBD |

---

## Constitution Relationship

The Principal holds a unique position relative to the Entourage Constitution:

| Relationship | Description |
|-------------|-------------|
| **Participant** | Bound by the same cultural principles as Associates. "Human Attention Is Sacred" applies *to* the Principal, not just *about* them. |
| **Authority** | Final approval on constitutional amendments. No Associate can override. |
| **Model** | Associates observe Principal behavior as a signal. Model the constitution, don't just enforce it. |

### Most Relevant Principles

1. **#3 Human Attention Is Sacred** — The Principal must protect their own attention, not just expect Associates to
2. **#9 Cost-Conscious Always** — Applies to human time as the most expensive resource
3. **#5 Evidence Before Assertions** — Demand evidence from Associates, provide it to them
4. **#7 Boundaries Enable Trust** — Respect Associate domain boundaries, don't micromanage

---

## Teachers

| Teacher | Domain | What the Principal Learns | Check Frequency |
|---------|--------|--------------------------|-----------------|
| **Aston** | Self-management, patterns | Fragmentation trends, quality-tier distribution, ceremony improvements | Daily (check-in) |
| **Bob** | Technical architecture | Build patterns, infrastructure capabilities, what's possible | Per session |
| **Mira** | Operational awareness | Cost patterns, runtime constraints, deployment realities | Weekly |
| **Metrick** | Data literacy | What metrics reveal about team behavior, trend interpretation | Weekly |
| **Goldratt** | Throughput thinking | Theory of Constraints applied to AI+Human teams | Ongoing (via initiative) |
| **Session data** | Self-awareness | Own utilization, fragmentation, opus-equivalent trends | Weekly review |
| **Family rhythm** | Sustainability | Protecting recharge windows is strategic investment, not cost | Daily |
| **Industry** | Market, technology, strategy | Self-directed reading, captured in Notion Resources | Ad hoc |

### Learning Protocol

The Principal learns through two feedback loops:

1. **Direct observation** — Session data (LocalPush + Metrick KPIs) reveals patterns the Principal can't see in the moment: fragmentation spikes, quality-tier mismatch, underutilized Associates
2. **Associate feedback** — Associates surface patterns about Principal behavior via Aston. Example: "Bob's sessions are consistently interrupted after 40 minutes — consider longer uninterrupted blocks"

---

## Automations Serving the Principal

The Principal doesn't own automations (Associates do), but several run on the Principal's behalf:

| Automation | Owner | Trigger | What It Does |
|-----------|-------|---------|-------------|
| Daily Note creation | n8n (Aston) | After midnight | Creates tomorrow's Daily Note in Notion |
| Comms Brief | n8n (Aston) | 07:00 daily | Creates Comms Brief subpage under today's Daily Note |
| Weekend Note | n8n (Aston) | Saturday 00:05 | Creates Weekend Note for Saturday/Sunday |
| LocalPush daily batch | Chrome extension | 00:01 daily | Pushes session data to n8n webhook |
| Metrick daily collectors | n8n (Metrick) | Scheduled | Collects KPIs from all sources |
| Cloud Associate sessions | n8n (various) | Schedule/webhook | Autonomous work while Principal sleeps |

---

## Session Log

The Principal's sessions are tracked automatically — no manual logging required.

| Source | What It Captures | Frequency |
|--------|-----------------|-----------|
| **LocalPush** | Duration, tokens, Associate, project, timestamps, model | Daily batch (00:01) + manual push |
| **Daily Note** | Intentions, brain dump, reflections, decisions | Daily (check-in ceremony) |
| **Aston synthesis** | Combined daily/weekly summaries from both sources | Daily + weekly |

Every in-office session includes `'human'` in the `participants[]` array. Cloud sessions run without the Principal and are tracked separately via `entourage_activity_log`.

---

## Goldratt's Cycle Integration

The Human Associate is central to Goldratt's Cycle because **Bottleneck Scenario 1** (Human Attention) is the most common constraint.

### Utilization Formulas

```
Utilization        = effective_hours / target_effective_hours (8h)
Opus-equivalent    = opus_hours×1.0 + sonnet_hours×0.6 + haiku_hours×0.3
Leverage ratio     = total_team_output_hours / human_input_hours
```

### Tracked KPIs

| Metric Key | What It Measures |
|-----------|-----------------|
| `productivity.human.effective_hours` | Sum of in-office session durations |
| `productivity.human.opus_equivalent_hours` | Quality-weighted hours |
| `productivity.human.utilization` | Effective hours / 8h target |
| `productivity.human.fragmentation_index` | Context-switch cost |
| `productivity.human.escalation_queue` | Pending decisions |

### Target State

The Principal spends opus-tier attention on the highest-leverage sessions. Haiku-tier attention covers dispatch, unblock, and approve patterns. Cloud Associates absorb commodity work. The leverage ratio grows over time.

### Signals

1. **Validation time trending down** per Associate per task type = Associate learning
2. **Validation time crossing threshold** = Cloud promotion candidate
3. **Fragmentation index decreasing** over weeks = scheduling improvement
4. **Opus-equivalent hours increasing** with same effective hours = better quality-tier matching

---

## System Registration

The Principal is **not** registered in the `aston_entourage` table. That table is the Entourage roster — it tracks Associates that serve the Principal. The Principal is not a member of their own Entourage.

The Principal's data enters the system through:

| System | How | Identifier |
|--------|-----|-----------|
| `entourage_activity` | `participants: ['human']`, `associate_type: 'human'` | Automatic via LocalPush ingest |
| Metrick KPIs | `productivity.human.*` metrics | Computed by Goldratt Daily Collectors |
| Bottleneck Detection | Scenario 1 (Human Attention) signals | Derived from utilization + waiting metrics |
| Daily Note | Intentions, brain dump, reflections | Via Notion |
| This profile | Energy template, capacity model, cost model | `~/team/aston/entourage/principal/PROFILE.md` |
