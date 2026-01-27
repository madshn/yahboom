# Technical Plan: Sensor Pages

**Feature:** sensor-pages
**Status:** Planning
**Created:** 2026-01-18

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                   │
├─────────────────────────────────────────────────────────────────────┤
│  sensors.json (new)         sensor-principles.json (existing)       │
│  - Sensor metadata          - Theory content                         │
│  - Image paths              - Python code examples                   │
│  - Build linkages           - Scraped lesson HTML                    │
│                                                                      │
│  builds.json (existing)                                              │
│  - Add sensors[] array to all builds                                 │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       PRESENTATION LAYER                             │
├─────────────────────────────────────────────────────────────────────┤
│  index.html                 sensor.html (new)                        │
│  - Enhanced filter bar      - Sensor detail page                     │
│  - Sensor badges on cards   - Theory content display                 │
│                             - Build grid                             │
│  app.js                     sensor-page.js (new)                     │
│  - renderSensorBadge()      - loadSensor()                           │
│  - Updated modal            - renderTheory()                         │
│                             - renderBuilds()                         │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       SCRAPER LAYER                                  │
├─────────────────────────────────────────────────────────────────────┤
│  scripts/extract-sensor-images.js (new)                              │
│  - Fetch theory lesson HTML from sensor-principles.json sourceUrl    │
│  - Extract first content image as sensor hardware image              │
│  - Process with Sharp (full + mini sizes)                            │
│  - Output to /images/sensors/                                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Model

### sensors.json (new file)

```json
{
  "sensors": [
    {
      "id": "ultrasonic",
      "name": "Ultrasonic Sensor",
      "description": "Measures distance using sound waves like a bat",
      "image": "/images/sensors/ultrasonic.webp",
      "imageMini": "/images/sensors/ultrasonic-mini.webp",
      "icon": "radar",
      "theoryLessons": ["1.1", "1.2"],
      "usedInBuilds": ["1.17", "1.18", "1.25"]
    }
  ]
}
```

### Sensor Definitions

| ID | Name | Icon | Theory | Builds |
|----|------|------|--------|--------|
| ultrasonic | Ultrasonic Sensor | radar | 1.1, 1.2 | 1.17, 1.18, 1.25 |
| potentiometer | Potentiometer | tune | 1.3, 1.4 | 1.20, 1.21 |
| light | Light Sensor | light_mode | 1.5, 1.6 | 1.22, 1.24 |
| infrared | Infrared Sensor | sensors | 1.7, 1.8 | — |
| PIR | PIR Motion Sensor | motion_sensor_active | 1.9, 1.10 | 1.7, 1.26 |
| temperature | Temperature Sensor | thermostat | 1.11, 1.12 | 1.27, 1.28 |
| humidity | Humidity Sensor | humidity_mid | 1.11, 1.12 | 1.27 |
| color | Color Sensor | palette | 1.13, 1.14 | 1.29, 1.30 |
| joystick | Joystick Module | gamepad | 1.15, 1.16 | 1.31, 1.32 |

---

## Image Extraction Strategy

### Source Analysis

The sensor-principles.json contains theory lessons with image references:

```json
{
  "title": "1.3 About potentiometers",
  "sourceUrl": "https://www.yahboom.net/public/upload/upload-html/1753439621/1.3 About potentiometers.html",
  "images": [{"type": "content", "url": "1667458812691833.png"}]
}
```

The first image in "About X" lessons shows the sensor hardware. The image filename is relative to a Yahboom CDN path.

### Image URL Construction

```javascript
// Extract base path from sourceUrl
const sourceUrl = "https://www.yahboom.net/public/upload/upload-html/1753439621/1.3 About potentiometers.html";
const basePath = sourceUrl.substring(0, sourceUrl.lastIndexOf('/') + 1);
// "https://www.yahboom.net/public/upload/upload-html/1753439621/"

const imageUrl = basePath + "1667458812691833.png";
// Full image URL
```

### Missing Lessons

Theory lessons 1.1 and 1.2 (ultrasonic) have errors:
```json
{"title": "1.1 About ultrasonic sensors", "error": "No iframe URL"}
```

**Fallback:** Use placeholder or manually extract ultrasonic sensor image from a different source (e.g., build 1.17's wiring diagram may show it).

### Output Sizes

| Size | Dimensions | Quality | Use Case |
|------|-----------|---------|----------|
| Full | 400x300 (max) | 85 | Sensor detail page header |
| Mini | 48x48 | 80 | Badges on cards, filter buttons |

---

## File Structure

### New Files

```
public/
├── sensor.html              # Sensor detail page
├── sensor-page.js           # JS for sensor page
├── data/
│   └── sensors.json         # Sensor catalog
└── images/
    └── sensors/             # Sensor images (new directory)
        ├── ultrasonic.webp
        ├── ultrasonic-mini.webp
        ├── potentiometer.webp
        └── ...

scripts/
└── extract-sensor-images.js # Image extraction script
```

### Modified Files

| File | Changes |
|------|---------|
| `public/index.html` | Update filter buttons with images |
| `public/app.js` | Add sensor badge rendering, update modal |
| `public/styles.css` | Add sensor badge styles, sensor page styles |
| `public/data/builds.json` | Ensure all sensor-equipped builds have sensors[] |

---

## Component Design

### Sensor Badge (app.js)

```javascript
function renderSensorBadge(sensorId, size = 'small') {
  const sensor = sensors.find(s => s.id === sensorId);
  if (!sensor) return '';

  const imgSrc = size === 'small' ? sensor.imageMini : sensor.image;
  const imgSize = size === 'small' ? 'w-6 h-6' : 'w-12 h-12';

  return `
    <a href="/sensor.html?id=${sensor.id}" class="sensor-badge sensor-badge--${size}">
      <img src="${imgSrc}" alt="${sensor.name}" class="${imgSize} rounded">
      <span>${sensor.name}</span>
    </a>
  `;
}
```

### Sensor Detail Page (sensor-page.js)

```javascript
async function loadSensorPage() {
  const sensorId = new URLSearchParams(window.location.search).get('id');

  // Load sensor data
  const sensorsData = await fetch('/data/sensors.json').then(r => r.json());
  const sensor = sensorsData.sensors.find(s => s.id === sensorId);

  // Load theory content
  const principlesData = await fetch('/data/sensor-principles.json').then(r => r.json());
  const theoryLessons = sensor.theoryLessons.map(id =>
    principlesData.principles.find(p => p.title.startsWith(id))
  );

  // Load builds
  const buildsData = await fetch('/data/builds.json').then(r => r.json());
  const builds = buildsData.builds.filter(b => sensor.usedInBuilds.includes(b.id));

  // Render
  renderSensorHeader(sensor);
  renderTheoryContent(theoryLessons);
  renderBuildGrid(builds);
}
```

---

## CSS Classes

### New Styles

```css
/* Sensor badges */
.sensor-badge {
  @apply inline-flex items-center gap-2 px-3 py-1 rounded-full
         bg-purple-100 text-purple-800 text-sm font-medium
         hover:bg-purple-200 transition-colors cursor-pointer no-underline;
}

.sensor-badge img {
  @apply rounded-full object-cover;
}

.sensor-badge--small img { @apply w-6 h-6; }
.sensor-badge--large img { @apply w-12 h-12; }

/* Sensor filter buttons with images */
.filter-btn.sensor-btn img {
  @apply w-6 h-6 rounded-full object-cover;
}

/* Sensor page */
.sensor-header {
  @apply flex items-start gap-6 mb-8;
}

.sensor-header-image {
  @apply w-48 h-36 rounded-xl shadow-lg object-cover;
}

.sensor-title {
  @apply text-3xl font-black text-white mb-2;
}

.sensor-description {
  @apply text-white/80 text-lg;
}

.theory-section {
  @apply glass-card p-6 mb-8;
}

.builds-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6;
}
```

---

## Navigation Updates

### URL Structure

| URL | Content |
|-----|---------|
| `/` or `/index.html` | Gallery (existing) |
| `/sensor.html?id=ultrasonic` | Sensor detail page |

### Navigation Flow

1. **Filter button → Sensor page:** Click sensor image on filter bar
2. **Build card badge → Sensor page:** Click sensor badge on gallery card
3. **Modal badge → Sensor page:** Click sensor badge in build modal
4. **Sensor page → Gallery:** Click header logo or back button
5. **Sensor page → Build modal:** Click build card (returns to gallery with modal open)

---

## Build Data Updates

### Current State

builds.json has sensor data for some advanced builds (1.17+) but not consistently.

### Required Updates

Ensure these builds have correct `sensors` arrays:

| Build | Sensors |
|-------|---------|
| 1.7 | ["PIR"] |
| 1.17 | ["ultrasonic"] |
| 1.18 | ["ultrasonic"] |
| 1.20 | ["potentiometer"] |
| 1.21 | ["potentiometer"] |
| 1.22 | ["light"] |
| 1.24 | ["light"] |
| 1.25 | ["ultrasonic"] |
| 1.26 | ["PIR"] |
| 1.27 | ["temperature", "humidity"] |
| 1.28 | ["temperature"] |
| 1.29 | ["color"] |
| 1.30 | ["color"] |
| 1.31 | ["joystick"] |
| 1.32 | ["joystick"] |

---

## Error Handling

### Missing Images

If sensor image extraction fails:
1. Log warning to console
2. Use placeholder SVG with sensor icon from Material Symbols
3. Continue with remaining sensors

### Missing Theory Content

If theory lesson has error in sensor-principles.json:
1. Show sensor name and description only
2. Hide "How It Works" section
3. Display: "Theory content coming soon"

### Invalid Sensor ID

If `/sensor.html?id=invalid`:
1. Redirect to gallery
2. Show toast: "Sensor not found"

---

## Testing Strategy

### Unit Tests (not applicable - vanilla JS)

N/A for this project

### E2E Tests (Playwright)

```javascript
// test-sensor-pages.js
test('sensor filter shows images', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.sensor-btn img')).toHaveCount(7);
});

test('sensor badge links to sensor page', async ({ page }) => {
  await page.goto('/');
  await page.click('.sensor-tag >> nth=0');
  await expect(page).toHaveURL(/sensor\.html\?id=/);
});

test('sensor page shows theory content', async ({ page }) => {
  await page.goto('/sensor.html?id=ultrasonic');
  await expect(page.locator('.sensor-title')).toContainText('Ultrasonic');
  await expect(page.locator('.theory-section')).toBeVisible();
});

test('sensor page shows related builds', async ({ page }) => {
  await page.goto('/sensor.html?id=ultrasonic');
  await expect(page.locator('.builds-grid .gallery-card')).toHaveCount(3);
});
```

---

## Dependencies

### Existing (no new packages)

- Sharp for image processing
- Playwright for scraping and testing
- Tailwind CSS for styling

### External Resources

- Material Symbols for icons
- Yahboom CDN for source images

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Ultrasonic theory lessons missing | No "How It Works" for ultrasonic | Use fallback content or manual extraction |
| Image URLs change | Broken images | Store local copies, not external URLs |
| Sensor-to-build mapping incorrect | Wrong builds shown | Validate against feature-input document |
| Mobile layout issues | Poor UX on phones | Test on mobile viewport during development |

---

## Performance Considerations

### Image Loading

- Use lazy loading for sensor mini-images on filter bar
- Preload sensor page header image on badge hover
- Keep mini images under 5KB each

### Data Loading

- sensors.json is small (<5KB), load on page init
- Reuse already-loaded builds.json data
- Cache sensor-principles.json after first load
