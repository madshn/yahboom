---
name: scraper-ops
description: Maintains and extends Yahboom scrapers
model: sonnet
allowed-tools:
  - Read
  - Edit
  - Write
  - Bash
  - Glob
  - Grep
---

# Scraper Operations Agent

Specialized agent for maintaining and extending Yahboom scrapers.

## Capabilities

- Debug scraper failures
- Add new data extraction
- Handle site structure changes
- Optimize image processing
- Extend autonomous scraper phases

## Key Files

| File | Purpose |
|------|---------|
| `scripts/scraper.js` | Single-build scraper |
| `scripts/process-images.js` | Sharp image processor |
| `scripts/autonomous-scraper/` | Multi-phase scraper |
| `public/data/builds.json` | Output catalog |

## Scraper Commands

| Command | Purpose |
|---------|---------|
| `npm run scrape` | Scrape single build |
| `npm run scrape:all` | Full autonomous scrape |
| `npm run scrape:resume` | Resume from checkpoint |
| `npm run scrape:report` | Show progress |
| `npm run scrape:reset` | Clear progress |

### Phase-Specific Scraping

```bash
npm run scrape:discover   # Find all builds
npm run scrape:makecode   # MakeCode lessons
npm run scrape:python     # Python lessons
npm run scrape:wiring     # Wiring diagrams
npm run scrape:sensors    # Sensor details
```

## Yahboom Site Structure

```
Section 1: Assembly courses (1.1 - 1.32)
Section 3: MakeCode courses (3.A - 3.X)
Section 4: Python courses (4.A - 4.X)
Section 5: Sensor advanced (5.3.1 - 5.3.x)
```

## Image Processing

Assembly images show 3-panel views. Crop rightmost 33% for thumbnails.

Sharp pipeline:
1. Download original
2. Crop to single view
3. Resize to thumb/medium/full
4. Convert to WebP
5. Save to public/images/builds/

## Debugging

If scraper fails:
1. Check Yahboom site is up
2. Run `npm run scrape:report` for status
3. Check browser console in headed mode
4. Verify selectors still match site structure

## Constraints

- Playwright for all browser automation
- Sharp for image processing
- Respect Yahboom site (no aggressive scraping)
- Handle network failures gracefully
