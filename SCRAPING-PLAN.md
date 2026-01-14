# Yahboom Content Scraping Plan

## Overview
Scrape all MakeCode and Python lesson content from the Yahboom Building:bit Super Kit study site using Playwright for reliable browser automation.

## Why Playwright?
- Handles JavaScript-heavy sites (Yahboom loads content dynamically)
- Reliable waits for content to load
- Can run headless for automation
- Better than browser extension (no session expiration)

## Setup

```bash
# Install Playwright
npm install -D playwright @playwright/test

# Install browsers
npx playwright install chromium
```

## Scraping Strategy

### 1. Navigate to Build Section
```javascript
await page.goto('https://www.yahboom.net/study/buildingbit-super-kit');
await page.waitForSelector('.sidebar-menu');
```

### 2. For Each Build with Coding Courses
Click on the MakeCode/Python section in sidebar, then iterate through lessons.

### 3. Content to Extract Per Lesson
- **Title**: `h2` or heading element
- **Objective**: Section 1 text
- **Motor Wiring**: Section 3 text + image URL
- **Blocks Used**: Section 4.2 block images/text
- **Combined Code**: Section 4.3 code block image
- **Hex File Name**: From download section
- **Phenomenon**: Section 5 text

### 4. Image Handling
- Download wiring diagrams
- Download code block screenshots
- Process with Sharp for WebP conversion

## Data Structure

```json
{
  "lessons": [
    {
      "title": "Spider advance",
      "objective": "...",
      "motorWiring": {
        "description": "...",
        "left": "M1 interface",
        "right": "M3 interface",
        "imageUrl": "/images/lessons/spider-advance-wiring.webp"
      },
      "blocksUsed": [...],
      "codeImage": "/images/lessons/spider-advance-code.webp",
      "hexFile": "microbit-Spider-advance.hex",
      "phenomenon": "..."
    }
  ]
}
```

## Builds with Coding Courses to Scrape

### MakeCode (Section 3)
| Build | ID | Section | Lessons |
|-------|-----|---------|---------|
| Mobile shooter | 1.1 | 3.A | 5 lessons |
| Spider | 1.7 | 3.G | 5 lessons |
| Lifting platform | 1.8 | 3.H | 4 lessons |
| Biped robot | 1.9 | 3.I | 2 lessons |
| Dinosaur | 1.10 | 3.J | 5 lessons |
| Scorpion | 1.11 | 3.K | 5 lessons |
| Beetle | 1.12 | 3.L | 5 lessons |
| Crab | 1.14 | 3.M | 5 lessons |
| Crocodile | 1.15 | 3.N | 5 lessons |
| Alpaca | 1.16 | 3.O | 5 lessons |
| Puppy | 1.17 | 3.P | 5 lessons |
| Radar car | 1.18 | 3.B | 6 lessons |
| Line tracking car | 1.19 | 3.C | 4 lessons |

### Python (Section 4)
Similar structure, fewer lessons per build.

### Sensor Courses (Section 5)
Advanced sensor integration lessons.

## Script Location
`/scripts/scrape-lessons.js`

## Estimated Time
- ~50 builds with coding
- ~3-5 lessons per build
- ~2-3 minutes per lesson (with waits)
- Total: ~4-6 hours automated scraping

## Output
- Updated `builds.json` with full lesson content
- Downloaded images in `/public/images/lessons/`
