# Content Validation Report

Generated: 2026-01-18

## Executive Summary

Validated Yahboom Building:bit site content against expected chapter structure.

| Category | Expected | Found | Status |
|----------|----------|-------|--------|
| Assembly (Ch 1) | 32 | 32 | ✓ Complete |
| MakeCode Basic (Ch 3) | 9 | 9 | ✓ Complete |
| Python Basic (Ch 4) | 9 | 0 | ✗ **Missing** |
| MakeCode Theory (Ch 5.1) | 16 | 16 | ✓ Complete |
| MakeCode Sensor Basic (Ch 5.2) | 9 | 9 | ✓ Complete |
| MakeCode Sensor Expansion (Ch 5.3) | 9 | 9 | ✓ Complete |
| Python Theory (Ch 6.1) | 16 | 16 | ✓ Complete |
| Python Sensor Basic (Ch 6.2) | 9 | 9 | ✓ Complete |
| Python Sensor Expansion (Ch 6.3) | 9 | 9 | ✓ Complete |

**Overall: 109/118 (92%) - Missing Python Basic Course**

---

## Key Findings

### 1. Python Basic Course Does NOT Exist

Chapter 4 "Basic modeling Python course" is listed in the sidebar but contains **no lessons**. This means:
- Basic builds 1.1-1.9 have MakeCode tutorials but **no Python tutorials**
- Python is only available for sensor-based builds (Chapters 6.x)

### 2. Confirmed Chapter Structure

```
Chapter 1: Assembly Course (1.1-1.32)
    └── 32 build instructions

Chapter 3: Basic modeling MakeCode course
    └── 3.1-3.9 (tutorials for builds 1.1-1.9)

Chapter 4: Basic modeling Python course
    └── EMPTY (no content)

Chapter 5: Sensor Advanced MakeCode course
    ├── 5.1 Sensor principle (1.1-1.16 → theory lessons)
    ├── 5.2 Sensor basic course (2.1-2.9 → standalone sensor builds)
    └── 5.3 Sensor expansion course (3.1-3.9 → add sensors to basic builds)

Chapter 6: Sensor Advanced Python course
    ├── 6.1 Sensor principle (1.1-1.16 → theory lessons)
    ├── 6.2 Sensor basic course (2.1-2.9 → standalone sensor builds)
    └── 6.3 Sensor expansion course (3.1-3.9 → add sensors to basic builds)
```

### 3. Relative vs Absolute Numbering

The Yahboom site uses **relative numbering within expanded sections**:
- When Chapter 5 is expanded, sensor theory appears as `1.1, 1.2...` not `5.1.1, 5.1.2...`
- This caused initial confusion in scraping

---

## Content Coverage by Build

### Basic Builds (1.1-1.9)
| Build | Assembly | MakeCode | Python |
|-------|----------|----------|--------|
| 1.1 Mobile shooter | ✓ | ✓ 3.1 | ✗ |
| 1.2 Pretty car | ✓ | ✓ 3.2 | ✗ |
| 1.3 Clip robot | ✓ | ✓ 3.3 | ✗ |
| 1.4 Proficient carrier | ✓ | ✓ 3.4 | ✗ |
| 1.5 Skip car | ✓ | ✓ 3.5 | ✗ |
| 1.6 Freestyle | ✓ | ✓ 3.6 | ✗ |
| 1.7 Spider | ✓ | ✓ 3.7 | ✗ |
| 1.8 Lifting platform | ✓ | ✓ 3.8 | ✗ |
| 1.9 Biped robot | ✓ | ✓ 3.9 | ✗ |

### Basic Builds (1.10-1.16)
| Build | Assembly | MakeCode | Python |
|-------|----------|----------|--------|
| 1.10 Changing Face | ✓ | ✗ | ✗ |
| 1.11 Carousel | ✓ | ✗ | ✗ |
| 1.12 Oscillating fan | ✓ | ✗ | ✗ |
| 1.13 Airplane | ✓ | ✗ | ✗ |
| 1.14 Unicycle | ✓ | ✗ | ✗ |
| 1.15 Auto-door | ✓ | ✗ | ✗ |
| 1.16 Dragon knight | ✓ | ✗ | ✗ |

### Sensor Builds (1.17-1.32)
| Build | Assembly | MakeCode | Python |
|-------|----------|----------|--------|
| 1.17 Ultrasonic rangefinder | ✓ | ✓ 5.2.1 | ✓ 6.2.1 |
| 1.18 Avoiding car | ✓ | ✓ 5.3.1 | ✓ 6.3.1 |
| 1.19 Changing face (sensor) | ✓ | ✓ 5.3.2 | ✓ 6.3.2 |
| 1.20 Adjustable RGB light | ✓ | ✓ 5.2.2 | ✓ 6.2.2 |
| 1.21 Adjustable fan | ✓ | ✓ 5.3.3 | ✓ 6.3.3 |
| 1.22 Emergency light | ✓ | ✓ 5.2.3 | ✓ 6.2.3 |
| 1.23 Smart alarm clock | ✓ | ✓ 5.2.4 | ✓ 6.2.4 |
| 1.24 Light-controlled robot | ✓ | ✓ 5.3.4 | ✓ 6.3.4 |
| 1.25 Swimming robot | ✓ | ✓ 5.3.5 | ✓ 6.3.5 |
| 1.26 Fleeing spider | ✓ | ✓ 5.3.6 | ✓ 6.3.6 |
| 1.27 Temp/humidity reminder | ✓ | ✓ 5.2.7 | ✓ 6.2.7 |
| 1.28 Temp-controlled fan | ✓ | ✓ 5.3.7 | ✓ 6.3.7 |
| 1.29 Color recognition | ✓ | ✓ 5.2.8 | ✓ 6.2.8 |
| 1.30 Color-recognizing door | ✓ | ✓ 5.3.8 | ✓ 6.3.8 |
| 1.31 Rocker light | ✓ | ✓ 5.2.9 | ✓ 6.2.9 |
| 1.32 Rocker transporter | ✓ | ✓ 5.3.9 | ✓ 6.3.9 |

---

## Recommendations

1. **Update master map** to reflect that Python basic (Ch 4) doesn't exist
2. **Scraper should target**:
   - Chapter 3 for MakeCode basic (builds 1.1-1.9)
   - Chapter 5.2/5.3 for MakeCode sensor courses
   - Chapter 6.2/6.3 for Python sensor courses
3. **Don't expect** Python tutorials for builds 1.1-1.16
