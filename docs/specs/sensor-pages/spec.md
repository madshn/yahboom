# Sensor Pages & Content Completion

**Feature ID:** sensor-pages
**Status:** Specification
**Created:** 2026-01-18

---

## Problem Statement

The Building:bit gallery currently shows sensor filter buttons but:

1. Sensor badges on builds lack visual representation (icons only)
2. Users cannot learn what a sensor is or how it works before building
3. Sensor theory content exists (sensor-principles.json) but is not surfaced in the UI
4. Only 12/32 builds have sensor tags populated

Kids browsing the gallery may select a sensor-equipped build without understanding what the sensor does or how to wire it.

---

## Solution Overview

Create dedicated sensor detail pages that explain each sensor type, show the physical hardware, and link to builds that use it. Enhance the gallery with sensor badges featuring mini-images.

---

## User Stories

### US1: Curious Builder
**As a** kid browsing builds
**I want to** see what sensors a build uses with a visual badge
**So that** I can quickly understand what makes each build special

### US2: Sensor Learner
**As a** kid who clicked on a sensor badge
**I want to** see a page explaining how the sensor works
**So that** I can understand the theory before building

### US3: Sensor Explorer
**As a** kid interested in a specific sensor
**I want to** see all builds that use that sensor
**So that** I can pick the coolest one to build

### US4: Filter User
**As a** kid using the gallery filter
**I want to** see sensor images on filter buttons
**So that** I can recognize sensors visually

---

## Functional Requirements

### FR1: Sensor Data File
Create `public/data/sensors.json` with:
- Sensor ID, name, description
- Full-size and mini image paths
- Links to theory lesson IDs (from sensor-principles.json)
- List of build IDs that use this sensor

### FR2: Sensor Detail Page
URL pattern: `/sensor.html?id={sensor-id}`

Content:
- Large header image of the sensor hardware
- "How It Works" section pulling from sensor-principles.json
- Wiring diagram (if available in theory content)
- "Projects Using This Sensor" grid with build cards

### FR3: Sensor Badge Component
Displayed on:
- Build cards in gallery view
- Build detail modal

Visual: Mini sensor image (32x32 or 48x48) with sensor name
Interaction: Click navigates to sensor detail page

### FR4: Enhanced Sensor Filter
Replace icon-only filter buttons with image+text buttons showing sensor hardware image

### FR5: Build-to-Sensor Linkage
On build detail modal for sensor-equipped builds, show:
- Sensor section with hardware image
- "Learn about this sensor" link to sensor detail page

---

## Data Model

### sensors.json Schema

```json
{
  "sensors": [
    {
      "id": "ultrasonic",
      "name": "Ultrasonic Sensor",
      "description": "Measures distance using sound waves",
      "image": "/images/sensors/ultrasonic.webp",
      "imageMini": "/images/sensors/ultrasonic-mini.webp",
      "theoryLessons": ["1.1", "1.2"],
      "usedInBuilds": ["1.17", "1.18"]
    }
  ]
}
```

### Sensor Types

| ID | Name | Theory Lessons | Builds |
|----|------|----------------|--------|
| ultrasonic | Ultrasonic Sensor | 1.1, 1.2 | 1.17, 1.18, 1.25 |
| potentiometer | Potentiometer | 1.3, 1.4 | 1.20, 1.21 |
| light | Light Sensor | 1.5, 1.6 | 1.22, 1.24 |
| infrared | Infrared Module | 1.7, 1.8 | — |
| PIR | Human IR Sensor | 1.9, 1.10 | 1.7, 1.26 |
| temperature | Temperature Sensor | 1.11, 1.12 | 1.27, 1.28 |
| humidity | Humidity Sensor | 1.11, 1.12 | 1.27 |
| color | Color Sensor | 1.13, 1.14 | 1.29, 1.30 |
| joystick | Joystick Module | 1.15, 1.16 | 1.31, 1.32 |

---

## Non-Functional Requirements

### NFR1: Image Performance
- Full sensor images: max 400x300, WebP format, <50KB
- Mini sensor images: 48x48, WebP format, <5KB
- Lazy load sensor images on filter bar

### NFR2: Accessibility
- Alt text for all sensor images
- Keyboard-navigable sensor badges
- Screen reader friendly sensor detail pages

### NFR3: Mobile Responsive
- Sensor detail page works on mobile
- Badge images scale appropriately
- Filter bar horizontal scroll on mobile

---

## Out of Scope

1. Content gap fixes (MakeCode/Python lesson scraping) - separate task
2. Wiring diagram extraction from lessons - future enhancement
3. Video content for sensor tutorials
4. Interactive sensor simulators

---

## Acceptance Criteria

1. [ ] `sensors.json` created with all 8 sensor types
2. [ ] Sensor images extracted from Yahboom source (8 full + 8 mini)
3. [ ] `/sensor.html?id={id}` page displays sensor info and theory
4. [ ] Build cards show clickable sensor badges with mini images
5. [ ] Build detail modal shows sensor section with "Learn about this sensor" link
6. [ ] Gallery filter buttons display sensor images
7. [ ] All 12 sensor-equipped builds show correct sensor badges
8. [ ] Sensor detail page shows all builds using that sensor
9. [ ] Playwright tests pass for sensor page navigation

---

## Dependencies

- sensor-principles.json (existing) - Contains theory content
- builds.json (existing) - Contains sensor tags per build
- Sharp image processing (existing) - For sensor image extraction
- Playwright scraper (existing) - For extracting sensor images from source

---

## UX Design Notes

### Design System Alignment

The project uses:
- **Cosmic gradient** background (pink → purple → blue)
- **Glassmorphism** cards with backdrop blur
- **Tailwind CSS** for utility styling
- **Material Symbols** for icons
- **White cards** for content, glass cards for UI elements

### Sensor Badge Design

**Gallery View (on build cards):**
- Small rounded pill with sensor mini-image (24x24) + name
- Similar to existing `.sensor-tag` class but with image
- Purple accent color to match existing sensor filter styling

**Build Modal:**
- Larger badge with sensor image (48x48)
- "Learn about this sensor" link styled as secondary action

### Sensor Detail Page Layout

```
┌─────────────────────────────────────────────────────────┐
│  [Back ←] Sensor Detail                    (header)     │
├─────────────────────────────────────────────────────────┤
│  ┌─────────┐                                            │
│  │         │  ULTRASONIC SENSOR                         │
│  │ [image] │  Measures distance using sound waves       │
│  │         │                                            │
│  └─────────┘                                            │
├─────────────────────────────────────────────────────────┤
│  ## How It Works                                        │
│  [Theory content from sensor-principles.json]           │
│                                                         │
│  [Wiring diagram if available]                          │
├─────────────────────────────────────────────────────────┤
│  ## Projects Using This Sensor                          │
│  ┌────────┐ ┌────────┐ ┌────────┐                       │
│  │ Build  │ │ Build  │ │ Build  │                       │
│  │  Card  │ │  Card  │ │  Card  │                       │
│  └────────┘ └────────┘ └────────┘                       │
└─────────────────────────────────────────────────────────┘
```

### Filter Bar Enhancement

Replace icon-only sensor buttons with image+text:
```html
<button class="filter-btn sensor-btn">
  <img src="/images/sensors/ultrasonic-mini.webp" alt="" class="w-6 h-6">
  Ultrasonic
</button>
```

### Navigation Flow

1. **Gallery → Sensor Detail:** Click sensor badge on card OR filter button
2. **Build Modal → Sensor Detail:** Click sensor badge in modal
3. **Sensor Detail → Build:** Click build card in "Projects Using" section
4. **Sensor Detail → Gallery:** Back button or header logo

---

## Technical Notes

### Image Extraction Source

The sensor-principles.json contains image references from Yahboom's theory lessons:
- "1.3 About potentiometers" has `1667458812691833.png`
- "1.15 About rocker module" has `1667448895451660.png`

These are relative paths to the Yahboom HTML embed source URL. Full URLs can be constructed by combining the sourceUrl base with the image filename.

### Missing Content

Some theory lessons (1.1 "About ultrasonic sensors", 1.2 "Ultrasonic ranging") have errors in sensor-principles.json:
```json
{"title": "1.1 About ultrasonic sensors", "buildId": "15652", "error": "No iframe URL"}
```

These need to be re-scraped or manually extracted.
