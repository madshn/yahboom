# Tasks: Sensor Pages

**Feature:** sensor-pages
**Status:** Task Breakdown
**Created:** 2026-01-18

---

## Task Overview

| Phase | Tasks | Estimated |
|-------|-------|-----------|
| Data Layer | 3 | - |
| Image Extraction | 2 | - |
| Sensor Detail Page | 3 | - |
| Gallery Integration | 4 | - |
| Testing | 2 | - |
| **Total** | **14** | - |

---

## Phase 1: Data Layer

### T1.1: Create sensors.json data file
**Status:** pending

Create `public/data/sensors.json` with all 9 sensor types.

**Acceptance Criteria:**
- [ ] File exists at `public/data/sensors.json`
- [ ] Contains all 9 sensors with id, name, description
- [ ] Has placeholder image paths (will be filled in T2.2)
- [ ] Maps theoryLessons to sensor-principles.json entries
- [ ] Maps usedInBuilds to build IDs

**Files:** `public/data/sensors.json`

---

### T1.2: Update builds.json with sensor arrays
**Status:** pending

Ensure all sensor-equipped builds have `sensors` array populated.

**Acceptance Criteria:**
- [ ] Build 1.7 has sensors: ["PIR"]
- [ ] Build 1.17 has sensors: ["ultrasonic"]
- [ ] Build 1.18 has sensors: ["ultrasonic"]
- [ ] Build 1.20 has sensors: ["potentiometer"]
- [ ] Build 1.21 has sensors: ["potentiometer"]
- [ ] Build 1.22 has sensors: ["light"]
- [ ] Build 1.24 has sensors: ["light"]
- [ ] Build 1.25 has sensors: ["ultrasonic"]
- [ ] Build 1.26 has sensors: ["PIR"]
- [ ] Build 1.27 has sensors: ["temperature", "humidity"]
- [ ] Build 1.28 has sensors: ["temperature"]
- [ ] Build 1.29 has sensors: ["color"]
- [ ] Build 1.30 has sensors: ["color"]
- [ ] Build 1.31 has sensors: ["joystick"]
- [ ] Build 1.32 has sensors: ["joystick"]

**Files:** `public/data/builds.json`

---

### T1.3: Verify sensor-principles.json content
**Status:** pending

Check theory content availability and document gaps.

**Acceptance Criteria:**
- [ ] List which theory lessons have valid sourceUrl
- [ ] List which have errors ("No iframe URL")
- [ ] Document fallback strategy for missing content

**Files:** None (research task)

---

## Phase 2: Image Extraction

### T2.1: Create sensor image extraction script
**Status:** pending

Build script to extract sensor hardware images from Yahboom theory lessons.

**Acceptance Criteria:**
- [ ] Script at `scripts/extract-sensor-images.js`
- [ ] Reads sensor-principles.json for source URLs
- [ ] Constructs full image URLs from relative paths
- [ ] Downloads first "content" image from each "About X" lesson
- [ ] Uses Sharp to create full (400x300) and mini (48x48) sizes
- [ ] Saves to `public/images/sensors/`
- [ ] Handles missing/errored lessons gracefully

**Files:** `scripts/extract-sensor-images.js`

---

### T2.2: Run extraction and update sensors.json
**Status:** pending

Execute extraction script and update data with real paths.

**Acceptance Criteria:**
- [ ] Images exist for: potentiometer, light, infrared, PIR, temperature, color, joystick
- [ ] Each sensor has both .webp and -mini.webp versions
- [ ] sensors.json updated with actual image paths
- [ ] Placeholder used for ultrasonic (missing source)

**Files:** `public/images/sensors/*`, `public/data/sensors.json`

---

## Phase 3: Sensor Detail Page

### T3.1: Create sensor.html page structure
**Status:** pending

Build the sensor detail page HTML.

**Acceptance Criteria:**
- [ ] File at `public/sensor.html`
- [ ] Header with cosmic gradient background
- [ ] Back button to gallery
- [ ] Sensor header section with image placeholder
- [ ] Theory section placeholder
- [ ] Builds grid section placeholder
- [ ] Links to styles.css and sensor-page.js

**Files:** `public/sensor.html`

---

### T3.2: Create sensor-page.js logic
**Status:** pending

Implement sensor page JavaScript.

**Acceptance Criteria:**
- [ ] Reads sensor ID from URL query param
- [ ] Fetches sensors.json and finds sensor
- [ ] Fetches sensor-principles.json for theory
- [ ] Fetches builds.json for related builds
- [ ] Renders sensor header with image and description
- [ ] Renders theory content (or placeholder if missing)
- [ ] Renders build grid with clickable cards
- [ ] Handles invalid sensor ID with redirect

**Files:** `public/sensor-page.js`

---

### T3.3: Add sensor page styles
**Status:** pending

CSS for sensor detail page components.

**Acceptance Criteria:**
- [ ] `.sensor-header` layout (image + text)
- [ ] `.sensor-header-image` sizing
- [ ] `.sensor-title` and `.sensor-description` typography
- [ ] `.theory-section` glass card
- [ ] `.theory-content` text styling
- [ ] `.builds-grid` responsive grid
- [ ] Mobile-responsive layout

**Files:** `public/styles.css`

---

## Phase 4: Gallery Integration

### T4.1: Create sensor badge component
**Status:** pending

Reusable sensor badge with image and link.

**Acceptance Criteria:**
- [ ] `renderSensorBadge(sensorId, size)` function in app.js
- [ ] Renders mini image + sensor name
- [ ] Links to `/sensor.html?id={sensorId}`
- [ ] Supports 'small' and 'large' size variants
- [ ] Falls back to icon if image missing

**Files:** `public/app.js`

---

### T4.2: Update gallery cards with sensor badges
**Status:** pending

Replace current sensor tags with image badges.

**Acceptance Criteria:**
- [ ] Load sensors.json on page init
- [ ] Replace `.sensor-tag` spans with sensor badges
- [ ] Badges are clickable (navigate to sensor page)
- [ ] Multiple sensors render correctly

**Files:** `public/app.js`

---

### T4.3: Update build modal with sensor section
**Status:** pending

Enhance modal sensor display.

**Acceptance Criteria:**
- [ ] Sensor section shows larger badges
- [ ] "Learn about this sensor" link to sensor page
- [ ] Section hidden if build has no sensors

**Files:** `public/app.js`

---

### T4.4: Update filter buttons with sensor images
**Status:** pending

Replace icon-only filter buttons with image+text.

**Acceptance Criteria:**
- [ ] Filter buttons show sensor mini-image
- [ ] Images lazy-loaded for performance
- [ ] Active state still visible with image
- [ ] "All" button unchanged

**Files:** `public/index.html`, `public/app.js`

---

## Phase 5: Testing

### T5.1: Create sensor page Playwright tests
**Status:** pending

E2E tests for sensor functionality.

**Acceptance Criteria:**
- [ ] Test: sensor filter shows images
- [ ] Test: sensor badge links to sensor page
- [ ] Test: sensor page loads correct content
- [ ] Test: sensor page shows related builds
- [ ] Test: invalid sensor ID redirects

**Files:** `scripts/test-sensor-pages.js`

---

### T5.2: Update existing gallery tests
**Status:** pending

Ensure existing tests pass with new components.

**Acceptance Criteria:**
- [ ] Gallery card tests pass with badges
- [ ] Modal tests pass with sensor section
- [ ] Filter tests pass with images

**Files:** `scripts/test-gallery.js`

---

## Dependency Graph

```
T1.1 ─────────────────────────┐
                              │
T1.2 ─────────────────────────┤
                              ▼
T1.3 ───────────────────► T2.1 ──► T2.2
                                    │
                    ┌───────────────┤
                    ▼               ▼
                  T3.1 ──────► T3.2 ──► T3.3
                    │               │
                    └───────────────┤
                                    ▼
                    ┌───────────────┤
                    ▼               │
                  T4.1 ──────► T4.2 │
                    │               │
                    ▼               │
                  T4.3 ◄────────────┤
                    │               │
                    ▼               ▼
                  T4.4 ──────► T5.1 ──► T5.2
```

---

## Execution Order

1. **T1.1** Create sensors.json
2. **T1.2** Update builds.json
3. **T1.3** Verify sensor-principles.json
4. **T2.1** Create extraction script
5. **T2.2** Run extraction
6. **T3.1** Create sensor.html
7. **T3.2** Create sensor-page.js
8. **T3.3** Add sensor page styles
9. **T4.1** Create sensor badge component
10. **T4.2** Update gallery cards
11. **T4.3** Update build modal
12. **T4.4** Update filter buttons
13. **T5.1** Create sensor tests
14. **T5.2** Update gallery tests

---

## Completion Criteria

- [ ] All 14 tasks marked complete
- [ ] `npm run build` succeeds
- [ ] `npm run test` passes (including new tests)
- [ ] All 9 sensors have pages accessible
- [ ] All 15 sensor-equipped builds show badges
- [ ] Filter buttons display sensor images
