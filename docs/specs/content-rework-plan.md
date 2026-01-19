# Content Rework Plan

## Issues Identified

### 1. No Permalinks
- Clicking a build doesn't update URL (stays at `localhost:3000`)
- Clicking a lesson doesn't update URL
- Cannot share links to specific builds or lessons

### 2. Missing First Lesson
- Build 3757 "1.Cannonball shooting" returns API error from Yahboom
- Lessons start at "2.Music fortress" instead of lesson 1
- Need to investigate alternate sources or mark as unavailable

### 3. Images Not Downloaded
- Scraper captures image filenames (`image-20250607163959305.png`)
- But doesn't download them or construct full URLs
- Images exist at: `https://www.yahboom.net/public/upload/upload-html/{buildId}/{filename}`

### 4. Missing Content Elements
Comparing source "Music Fortress" page to our scraped content:

| Element | Source Has | We Have |
|---------|-----------|---------|
| Learning objective | ✓ | ✓ (partial) |
| Building devices checklist | ✓ | ✗ |
| Motor wiring table | ✓ | ✗ |
| Wiring diagram images | ✓ | ✗ (filenames only) |
| MakeCode extension URL | ✓ | ✓ |
| Building blocks used | ✓ | ✗ |
| Combined blocks screenshots | ✓ | ✗ (filenames only) |
| Hex file reference | ✓ | ✗ |
| Experimental phenomenon | ✓ | ✓ (duplicate of objective) |

### 5. Hex Files Not Captured
- Lessons reference `.hex` files like `microbit-Music-fortress.hex`
- These are importable directly into MakeCode
- Need to find URLs and download locally

---

## Rework Plan

### Phase 1: URL Routing (Permalinks)

**Files to modify:**
- `public/app.js` - Add hash-based routing for builds
- `public/lesson-viewer.js` - Add hash routing for lessons
- `public/step-viewer.js` - Add hash routing for assembly steps

**URL structure:**
```
/#/build/1.1                    → Open build 1.1 modal
/#/build/1.1/makecode           → Open build 1.1 MakeCode lessons
/#/build/1.1/makecode/2         → Open lesson 2 of MakeCode
/#/build/1.1/assembly           → Open assembly step viewer
/#/build/1.1/assembly/5         → Open assembly step 5
```

**Implementation:**
1. Parse hash on page load
2. Update hash when opening modals/viewers
3. Listen for `hashchange` events
4. Handle browser back/forward buttons

### Phase 2: Enhanced Scraper

**New scraper architecture:**
```
scripts/scraper-v2/
├── index.js              # Main orchestrator
├── parsers/
│   ├── lesson-parser.js  # Parse HTML content structure
│   ├── image-parser.js   # Extract and resolve image URLs
│   └── hex-parser.js     # Find hex file references
├── downloaders/
│   ├── image-downloader.js  # Download and optimize images
│   └── hex-downloader.js    # Download hex files
├── validators/
│   └── content-validator.js # Validate scraped content
└── config.js
```

**Lesson content structure (target):**
```json
{
  "title": "2.Music fortress",
  "sourceUrl": "https://...",
  "sections": {
    "objective": "Learn to make motor, servo, buzzer work together",
    "buildingDevices": ["micro:bit", "Superbit expansion board", "Motor x2", "Servo x1"],
    "motorWiring": {
      "leftMotor": { "port": "M1", "note": "Black wire toward battery" },
      "rightMotor": { "port": "M3", "note": "Black wire toward battery" },
      "servo": { "port": "S1", "note": "Orange wire to yellow pin" }
    },
    "blocksUsed": [
      { "category": "Basic", "blocks": ["on start", "forever", "pause"] },
      { "category": "Superbit", "blocks": ["car run", "servo write angle"] }
    ],
    "phenomenon": "Robot plays music while motors and servo move"
  },
  "images": {
    "wiring": "/images/lessons/1.1/makecode/2/wiring.png",
    "blocks": ["/images/lessons/1.1/makecode/2/blocks-1.png"],
    "combined": "/images/lessons/1.1/makecode/2/combined.png"
  },
  "hexFile": {
    "name": "microbit-Music-fortress.hex",
    "localPath": "/hex/1.1/makecode/2/microbit-Music-fortress.hex",
    "description": "Drag to micro:bit or import to MakeCode"
  }
}
```

### Phase 3: Image Download Pipeline

**Steps:**
1. Parse lesson HTML to extract all `<img>` tags
2. Resolve relative URLs to absolute URLs using base path
3. Download images to `public/images/lessons/{buildId}/{type}/{lessonNum}/`
4. Generate WebP versions for web performance
5. Update lesson JSON with local paths

**Image categories:**
- `wiring/` - Circuit connection diagrams
- `blocks/` - Individual MakeCode block references
- `combined/` - Complete program screenshots
- `content/` - Other instructional images

### Phase 4: Hex File Discovery & Download

**Discovery methods:**
1. Parse lesson HTML for `.hex` file references
2. Check common Yahboom resource paths:
   - `/public/upload/upload-html/{buildId}/*.hex`
   - `/public/upload/download/{courseId}/*.hex`
3. Look for download links/buttons in page

**Storage:**
```
public/hex/
├── 1.1/
│   ├── makecode/
│   │   ├── 1-cannonball-shooting.hex
│   │   ├── 2-music-fortress.hex
│   │   └── ...
│   └── python/
│       └── ...
```

**UI integration:**
- Add "Import to MakeCode" button on lesson detail page
- Show hex file name and description
- Direct download link

### Phase 5: Enhanced Validation

**New validation checks:**

```javascript
// Content completeness checks
{
  category: 'lessonContent',
  checks: [
    'Has learning objective',
    'Has building devices list',
    'Has wiring information (if motor/sensor build)',
    'Has blocks used section',
    'Has combined program image',
    'Has hex file (or marked as N/A)',
    'Has phenomenon/outcome description'
  ]
}

// Image checks
{
  category: 'lessonImages',
  checks: [
    'All referenced images exist locally',
    'Images load successfully',
    'Wiring diagram present for builds with sensors/motors',
    'Program screenshot present'
  ]
}

// Hex file checks
{
  category: 'hexFiles',
  checks: [
    'Hex file exists locally if referenced',
    'Hex file download works',
    'Hex file size reasonable (< 1MB)'
  ]
}
```

---

## Implementation Order

1. **Phase 1: Permalinks** (1-2 hours)
   - Highest user impact
   - Relatively simple implementation
   - No external dependencies

2. **Phase 2: Scraper v2** (3-4 hours)
   - Foundation for all content improvements
   - Needs thorough HTML parsing

3. **Phase 3: Image downloads** (2-3 hours)
   - Depends on scraper parsing
   - May need rate limiting for Yahboom server

4. **Phase 4: Hex files** (1-2 hours)
   - Depends on scraper finding URLs
   - Straightforward download once found

5. **Phase 5: Validation** (1-2 hours)
   - Can be incremental
   - Run after each phase to verify

---

## Technical Notes

### Yahboom URL Patterns

```
Lesson HTML:     /public/upload/upload-html/{buildId}/{title}.html
Lesson images:   /public/upload/upload-html/{buildId}/{filename}.png
Hex files:       /public/upload/upload-html/{buildId}/*.hex (probable)
                 /public/upload/download/{courseId}/*.hex (possible)
```

### Missing Lesson Investigation

Build 3757 returns server error. Options:
1. Check if content exists at alternate URL
2. Mark lesson as "Coming soon" in UI
3. Use placeholder with link to Yahboom site

### Rate Limiting

Yahboom server may rate limit. Implement:
- 3-second delay between requests
- Retry with exponential backoff
- Resume capability for interrupted scrapes
