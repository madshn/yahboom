# Building:bit Projects

A kid-friendly local documentation site for the Yahboom Building:bit Super Kit (LEGO-compatible micro:bit robotics kit).

## Why This Exists

The official Yahboom documentation site is:
- **Slow** - hosted on distant servers with heavy page loads
- **Poorly organized** - assembly course 1.18 maps to sensor course 5.3.1, with no clear navigation
- **Not kid-friendly** - hard for a 9-year-old to find what they want to build
- **Unhelpful thumbnails** - assembly courses show multi-view step images, not the finished model

This project reorganizes the content into a visual gallery where kids can:
1. Browse completed builds and pick something cool
2. See what sensors/features each build uses
3. Access assembly instructions and coding tutorials in one place

## Current Features

- **Visual Gallery** - Cards showing finished builds with difficulty badges
- **Sensor Tags** - Filter builds by components (ultrasonic, PIR, etc.)
- **One-liner Descriptions** - Quick summary of what each build does
- **Wiring Diagrams** - Circuit connection overviews for sensor builds
- **Local Images** - Optimized WebP images served locally for speed
- **Difficulty Filters** - Beginner / Intermediate / Advanced

## Tech Stack

- **Vite** - Dev server (port 3000)
- **Playwright** - Browser automation for scraping and testing
- **Sharp** - Image processing (crop, resize, WebP conversion)
- **Vanilla JS** - No framework, just clean HTML/CSS/JS

## Project Structure

```
yahboom/
├── public/
│   ├── index.html          # Main gallery page
│   ├── app.js              # Gallery logic
│   ├── styles.css          # Styling
│   ├── data/
│   │   └── builds.json     # Scraped build data
│   └── images/
│       └── builds/         # Processed local images
├── scripts/
│   ├── scraper.js          # Playwright scraper for Yahboom site
│   ├── process-images.js   # Sharp image processor
│   └── test-gallery.js     # Playwright validation tests
└── package.json
```

## Scripts

```bash
npm run dev              # Start dev server on port 3000
npm run scrape           # Scrape build data from Yahboom
npm run process-images   # Download and optimize images
npm run test             # Run gallery validation tests
```

## Roadmap

### Phase 1: Gallery (Complete)
- [x] Scrape assembly courses with final build images
- [x] Process images (crop single-view, convert to WebP)
- [x] Gallery UI with filtering and modal details
- [x] Sensor tags and wiring diagrams
- [x] Descriptions on gallery cards
- [x] Validation test suite

### Phase 2: Native Build Instructions (Planned)
LEGO-app-style step-by-step assembly viewer:
- [ ] Scrape all step images from assembly courses
- [ ] Full-screen step viewer with navigation
- [ ] Progress indicator and thumbnail strip
- [ ] Keyboard/swipe navigation
- [ ] Offline image storage

### Phase 3: Native Coding Courses (Planned)
Local coding tutorial viewer:
- [ ] Scrape MakeCode and Python lesson content
- [ ] Split-pane viewer (instructions + code)
- [ ] Syntax-highlighted code blocks
- [ ] Lesson navigation with progress
- [ ] Optional MakeCode editor integration

### Phase 4: Full Catalog
- [ ] Expand from 3 validation builds to all 32 builds
- [ ] Complete sensor/course mapping for entire catalog

## Development Notes

### Image Processing
Assembly images from Yahboom show 3-panel views (different angles). We crop the rightmost 33% for a clean single-view thumbnail. Some builds (like Spider 1.7) have vertically stacked views requiring additional bottom-crop logic.

### Course Mapping
The Yahboom site structure is non-obvious:
- Section 1: Assembly courses (1.1 - 1.32)
- Section 3: MakeCode courses (3.A - 3.X)
- Section 4: Python courses (4.A - 4.X)
- Section 5: Sensor advanced courses (5.3.1 - 5.3.x)

Mapping between assembly builds and coding courses is maintained in `scraper.js`.

## License

Personal project for family use. Yahboom content belongs to Yahboom.
