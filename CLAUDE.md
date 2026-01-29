# Building:bit Projects Gallery

**Location:** `~/fun/yahboom`
**Role:** Kid-friendly documentation site for Yahboom Building:bit Super Kit

---

## Purpose

Reorganizes slow, poorly-organized Yahboom docs into a visual gallery where kids can:

1. Browse completed builds and pick something cool
2. See what sensors/features each build uses
3. Access assembly instructions and coding tutorials in one place

**Live Site:** https://building-bit-superkit.onrender.com
**Original Source:** https://www.yahboom.net/study/buildingbit-super-kit

---

## Coordinator Protocol

This CLAUDE.md is the **Tier 1 Coordinator** for this project. Workers in `.claude/agents/` handle specialized tasks and return structured results.

### Routing

When a task can be delegated:
1. Identify applicable worker(s) from `.claude/agents/`
2. Provide minimal context (do not over-share)
3. Dispatch via Task tool, await structured result
4. Interpret result and continue or return to user

### Worker Results

| Result | Signal | Action |
|--------|--------|--------|
| `success` | Task done | Continue or return to user |
| `blocked` | Cannot proceed | Try alternative or ask user |
| `escalate` | Needs decision | Present to user, await input |

### Error Containment

- Never propagate raw errors — interpret and contextualize
- One worker failure does not crash the operation
- Graceful degradation — continue with what succeeded

---

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (port 3000) |
| `npm run build` | Build for production (dist/) |
| `npm run test` | Run Playwright gallery tests |
| `npm run scrape` | Scrape build data from Yahboom |
| `npm run process-images` | Download and optimize images |
| `npm run scrape:all` | Run full autonomous scraper |
| `npm run scrape:resume` | Resume interrupted scrape |
| `npm run scrape:report` | Show scraper progress report |

---

## Key Files

| File | Purpose |
|------|---------|
| `public/index.html` | Main gallery page |
| `public/app.js` | Gallery logic (filtering, modals) |
| `public/step-viewer.js` | LEGO-app-style assembly viewer |
| `public/lesson-viewer.js` | Coding tutorial viewer |
| `public/data/builds.json` | Scraped build catalog |
| `scripts/scraper.js` | Playwright scraper (single build) |
| `scripts/autonomous-scraper/` | Multi-phase scraper with resume |
| `scripts/test-gallery.js` | Playwright validation tests |
| `render.yaml` | Render deployment config |

---

## Stack

| Tool | Purpose |
|------|---------|
| **Vite** | Dev server and build tool |
| **Playwright** | Browser automation (scraping + testing) |
| **Sharp** | Image processing (crop, resize, WebP) |
| **Tailwind CSS** | Styling with custom design system |
| **Vanilla JS** | No framework (clean HTML/CSS/JS) |

---

## Architecture

```
yahboom/
├── public/              # Static site root
│   ├── index.html       # Gallery entry point
│   ├── app.js           # Main gallery logic
│   ├── step-viewer.js   # Assembly step navigation
│   ├── lesson-viewer.js # Code tutorial viewer
│   ├── styles.css       # Compiled Tailwind
│   ├── data/            # Build catalog JSON
│   └── images/          # Optimized local images
├── scripts/             # Automation tools
│   ├── scraper.js       # Single-build scraper
│   ├── process-images.js # Sharp image processor
│   ├── test-gallery.js  # Playwright tests
│   └── autonomous-scraper/ # Multi-phase scraper
└── dist/                # Production build output
```

---

## Deployment

| Field | Value |
|-------|-------|
| **Platform** | Render (static site) |
| **Dashboard** | https://dashboard.render.com/static/srv-d5jv1htactks73chuc40 |
| **Live URL** | https://building-bit-superkit.onrender.com |
| **Auto-deploy** | Pushes to `main` trigger builds |

---

## Development Notes

### Image Processing

Assembly images from Yahboom show 3-panel views (different angles). We crop the rightmost 33% for a clean single-view thumbnail. Some builds have vertically stacked views requiring additional bottom-crop logic.

### Course Mapping

Yahboom site structure:
- Section 1: Assembly courses (1.1 - 1.32)
- Section 3: MakeCode courses (3.A - 3.X)
- Section 4: Python courses (4.A - 4.X)
- Section 5: Sensor advanced courses (5.3.1 - 5.3.x)

Mapping between assembly builds and coding courses is maintained in scraper files.

---

## Factory Parent

**Bob:** `~/ops/bob/`
**Adopted:** 2026-01-15
**Phase:** 1 (Validation)

---

## License

Personal project for family use. Yahboom content belongs to Yahboom.
