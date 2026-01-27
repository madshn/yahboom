# Feature Input: Sensor Pages & Content Completion

**Project:** Building:bit Gallery
**Date:** 2026-01-18
**Status:** Ready for planning

---

## Part 1: Content Gap Analysis

### Current State Summary

| Asset Type | Coverage | Notes |
|------------|----------|-------|
| Gallery Images | 32/32 (100%) | Complete |
| Assembly Steps | 32/32 (100%) | Complete |
| Sensor Tags | 12/32 (38%) | Only advanced builds tagged |
| MakeCode Lessons | 7/32 (22%) | Only builds 1.3-1.9 |
| MakeCode Block Images | 7/32 (22%) | Same as above |
| Python Lessons | 3/32 (9%) | Only 1.1, 1.2, 1.7 |
| Wiring Diagrams | 4/32 (13%) | Only 1.2, 1.3, 1.4, 1.9 |
| Sensor Theory Links | 0/32 (0%) | Exists but not linked |

### Detailed Build Status

| ID | Name | Sensors | MakeCode | Python | Wiring |
|----|------|---------|----------|--------|--------|
| 1.1 | Mobile shooter | — | ✗ | ✓ (3) | ✗ |
| 1.2 | Pretty car | — | ✗ | ✓ (1) | ✓ |
| 1.3 | Clip robot | — | ✓ (3) | ✗ | ✓ |
| 1.4 | Proficient carrier | — | ✓ (6) | ✗ | ✓ |
| 1.5 | Skip car | — | ✓ (5) | ✗ | ✗ |
| 1.6 | Freestyle | — | ✓ (3) | ✗ | ✗ |
| 1.7 | Spider | PIR | ✓ (2) | ✓ (3) | ✗ |
| 1.8 | Lifting platform | — | ✓ (3) | ✗ | ✗ |
| 1.9 | Biped robot | — | ✓ (3) | ✗ | ✓ |
| 1.10 | Changing Face | — | ✗ | ✗ | ✗ |
| 1.11 | Carousel | — | ✗ | ✗ | ✗ |
| 1.12 | Oscillating fan | — | ✗ | ✗ | ✗ |
| 1.13 | Airplane | — | ✗ | ✗ | ✗ |
| 1.14 | Unicycle | — | ✗ | ✗ | ✗ |
| 1.15 | Auto-door | — | ✗ | ✗ | ✗ |
| 1.16 | Dragon knight | — | ✗ | ✗ | ✗ |
| 1.17 | Ultrasonic handheld rangefinder | ultrasonic | ✗ | ✗ | ✗ |
| 1.18 | Small flying car obstacle avoidance | ultrasonic | ✗ | ✗ | ✗ |
| 1.19 | Changing face | — | ✗ | ✗ | ✗ |
| 1.20 | Adjustable RGB light | — | ✗ | ✗ | ✗ |
| 1.21 | Adjustable fan | — | ✗ | ✗ | ✗ |
| 1.22 | Photosensitive emergency light | light | ✗ | ✗ | ✗ |
| 1.23 | Smart alarm clock | — | ✗ | ✗ | ✗ |
| 1.24 | Light-controlled bipedal robot | light | ✗ | ✗ | ✗ |
| 1.25 | Swimming robot avoid objects | — | ✗ | ✗ | ✗ |
| 1.26 | Fleeing spider | PIR | ✗ | ✗ | ✗ |
| 1.27 | Temperature humidity reminder | temperature, humidity | ✗ | ✗ | ✗ |
| 1.28 | Temperature-controlled fan | temperature | ✗ | ✗ | ✗ |
| 1.29 | Color recognition machine | color | ✗ | ✗ | ✗ |
| 1.30 | Color-recognizing automatic door | color | ✗ | ✗ | ✗ |
| 1.31 | Rocker color changing light | joystick | ✗ | ✗ | ✗ |
| 1.32 | Rocker transporter | joystick | ✗ | ✗ | ✗ |

### Content Tasks Required

1. **Verify MakeCode content exists at source** for builds 1.1-1.2 and 1.10-1.32
   - If exists: fix scraper mapping (Section 3 → build ID)
   - If not: mark as "no coding lesson" in UI

2. **Verify Python content exists at source** for builds 1.3-1.6, 1.8-1.32
   - Same approach as MakeCode

3. **Verify sensor tagging** for these builds:
   - 1.20 Adjustable RGB light → likely uses potentiometer
   - 1.21 Adjustable fan → likely uses potentiometer
   - 1.25 Swimming robot avoid objects → likely uses ultrasonic

4. **Extract wiring diagrams** from lesson content where available

---

## Part 2: New Feature - Sensor Detail Pages

### Concept

Create dedicated sensor pages that:
1. Explain how the sensor works (theory content from Section 5)
2. Show the physical sensor hardware (new image extraction needed)
3. Link to all builds that use this sensor

### User Flow

```
Landing Page (Gallery)
    │
    ├── Filter by sensor (show sensor mini-images on filter buttons)
    │
    └── Build Card
            │
            └── Sensor badge with mini-image
                    │
                    └── Click → Sensor Detail Page
                            │
                            ├── Sensor hardware image (large)
                            ├── "How it works" theory content
                            ├── Wiring diagram
                            └── "Builds using this sensor" list
```

### Build Detail Page Integration

On build pages for sensor-equipped projects, show:

```
┌─────────────────────────────────────────────────┐
│  🔧 This build uses: Ultrasonic Sensor          │
│  ┌──────┐                                       │
│  │ [img]│  Want to build with ultrasonic?       │
│  └──────┘  Learn how it works first →           │
└─────────────────────────────────────────────────┘
```

### Data Model Changes

**New file: `public/data/sensors.json`**

```json
{
  "sensors": [
    {
      "id": "ultrasonic",
      "name": "Ultrasonic Sensor",
      "description": "Measures distance using sound waves",
      "image": "/images/sensors/ultrasonic.webp",
      "imageMini": "/images/sensors/ultrasonic-mini.webp",
      "theoryLessons": ["5.1.1", "5.1.2"],
      "usedInBuilds": ["1.17", "1.18"]
    }
  ]
}
```

**Sensor types to support:**

| ID | Name | Theory Lessons | Builds |
|----|------|----------------|--------|
| ultrasonic | Ultrasonic Sensor | 1.1, 1.2 | 1.17, 1.18 |
| potentiometer | Potentiometer | 1.3, 1.4 | 1.20?, 1.21? |
| light | Photosensitive Sensor | 1.5, 1.6 | 1.22, 1.24 |
| infrared | Infrared Module | 1.7, 1.8 | — |
| PIR | Human IR Sensor (PIR) | 1.9, 1.10 | 1.7, 1.26 |
| temperature | Temperature Sensor | 1.11, 1.12 | 1.27, 1.28 |
| humidity | Humidity Sensor | 1.11, 1.12 | 1.27 |
| color | Color Recognition Sensor | 1.13, 1.14 | 1.29, 1.30 |
| joystick | Rocker/Joystick Module | 1.15, 1.16 | 1.31, 1.32 |

### Image Extraction Task

**Goal:** Extract sensor hardware images from Yahboom source

**Source location:** Section 5 theory lessons contain sensor images in the lesson content

**Approach:**
1. Scrape Section 5 lesson pages
2. Identify first image in each "About X sensor" lesson (1.1, 1.3, 1.5, 1.7, 1.9, 1.11, 1.13, 1.15)
3. Download and process with Sharp (same pipeline as gallery images)
4. Generate two sizes:
   - Full: 400x300 for sensor detail page
   - Mini: 48x48 for badges and filter buttons

**Image naming convention:**
```
/images/sensors/{sensor-id}.webp
/images/sensors/{sensor-id}-mini.webp
```

### New Pages/Components

1. **Sensor Detail Page** (`/sensor/{id}`)
   - Header with sensor image and name
   - "How it works" section (theory content)
   - Wiring diagram (if available)
   - "Projects using this sensor" grid

2. **Sensor Badge Component**
   - Mini sensor image + name
   - Clickable → navigates to sensor detail page
   - Used on build cards and build detail pages

3. **Sensor Filter Enhancement**
   - Replace text-only filter buttons with image+text
   - Show sensor mini-image on each filter option

---

## Part 3: Implementation Phases

### Phase 1: Content Verification
- [ ] Spot-check Yahboom source for MakeCode/Python content gaps
- [ ] Confirm sensor tagging accuracy for builds 1.20, 1.21, 1.25
- [ ] Document which content genuinely doesn't exist vs scraper gaps

### Phase 2: Sensor Image Extraction
- [ ] Update scraper to extract sensor images from Section 5
- [ ] Process images through Sharp pipeline
- [ ] Generate sensors.json data file

### Phase 3: Sensor Detail Pages
- [ ] Create sensor detail page template
- [ ] Link theory content from sensor-principles.json
- [ ] Add "builds using this sensor" section

### Phase 4: UI Integration
- [ ] Add sensor badges to build cards (gallery view)
- [ ] Add sensor callout to build detail pages
- [ ] Enhance filter UI with sensor images

### Phase 5: Content Scraping (if gaps confirmed)
- [ ] Fix MakeCode lesson scraper mapping
- [ ] Fix Python lesson scraper mapping
- [ ] Extract wiring diagrams from lesson content

---

## Acceptance Criteria

1. Every sensor-equipped build shows sensor badge with mini-image
2. Clicking sensor badge opens sensor detail page
3. Sensor detail page shows theory content and lists all builds using it
4. Gallery filter buttons show sensor images
5. Build detail pages show "Learn about this sensor first" callout
6. All 8 sensor types have extracted images (full + mini)

---

## Reference Files

- `docs/build-content-status.md` - Full validation table
- `public/data/builds.json` - Current build data
- `public/data/sensor-principles.json` - Existing theory content
- `scripts/generate-status-table.js` - Regenerate status report
