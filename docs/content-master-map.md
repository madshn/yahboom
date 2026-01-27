# Yahboom Building:bit Content Master Map

Generated: 2026-01-18

## Site Chapter Structure

| Chapter | Name | Content Type |
|---------|------|--------------|
| 1 | Assembly Course | Build instructions (1.1-1.32) |
| 2 | MakeCode Basic Course | Basic builds without sensors (for 1.1-1.9) |
| 3 | MakeCode Sensor Basic | Standalone sensor builds |
| 4 | MakeCode Sensor Expansion | Add sensors to basic builds |
| 5 | Python Basic Course | Basic builds without sensors |
| 6.1 | Python Sensor Principles | Sensor theory lessons |
| 6.2 | Python Sensor Basic | Standalone sensor builds |
| 6.3 | Python Sensor Expansion | Add sensors to basic builds |

---

## Master Build Table

Each row represents a complete "build experience" that may span multiple chapters.

### Basic Builds (No Sensors) - 1.1 to 1.16

| Build ID | Name | Assembly | MakeCode Basic | Python Basic | Notes |
|----------|------|----------|----------------|--------------|-------|
| 1.1 | Mobile shooter | 1.1 | ? | 5.? | Has Python lessons in current data |
| 1.2 | Pretty car | 1.2 | ? | 5.? | Has Python lessons in current data |
| 1.3 | Clip robot | 1.3 | 2.? | ? | Has MakeCode in current data |
| 1.4 | Proficient carrier | 1.4 | 2.? | ? | Has MakeCode in current data |
| 1.5 | Skip car | 1.5 | 2.? | ? | Has MakeCode in current data |
| 1.6 | Freestyle | 1.6 | 2.? | ? | Has MakeCode in current data |
| 1.7 | Spider | 1.7 | 2.? | 5.? | Has both - also sensor expansion? |
| 1.8 | Lifting platform | 1.8 | 2.? | ? | Has MakeCode in current data |
| 1.9 | Biped robot | 1.9 | 2.? | ? | Has MakeCode in current data |
| 1.10 | Changing Face | 1.10 | ? | ? | Basic only |
| 1.11 | Carousel | 1.11 | ? | ? | Basic only |
| 1.12 | Oscillating fan | 1.12 | ? | ? | Basic only |
| 1.13 | Airplane | 1.13 | ? | ? | Basic only |
| 1.14 | Unicycle | 1.14 | ? | ? | Basic only |
| 1.15 | Auto-door | 1.15 | ? | ? | Basic only |
| 1.16 | Dragon knight | 1.16 | ? | ? | Basic only |

### Sensor Basic Builds - Chapter 2.x/6.2.x

These are standalone sensor builds with their own assembly in Chapter 1.17+.

| Build ID | Name | Assembly | MakeCode (3.2.x) | Python (6.2.x) | Sensor |
|----------|------|----------|------------------|----------------|--------|
| 1.17 | Ultrasonic handheld rangefinder | 1.17 | 3.2.1 | 6.2.1 | ultrasonic |
| 1.20 | Adjustable RGB light | 1.20 | 3.2.2 | 6.2.2 | potentiometer |
| 1.22 | Photosensitive emergency light | 1.22 | 3.2.3 | 6.2.3 | light |
| 1.23 | Smart alarm clock | 1.23 | 3.2.4 | 6.2.4 | (vibration?) |
| — | Infrared detection broadcast | ? | 3.2.5 | 6.2.5 | infrared |
| — | Human body infrared detection | ? | 3.2.6 | 6.2.6 | PIR |
| 1.27 | Temperature humidity reminder | 1.27 | 3.2.7 | 6.2.7 | temperature, humidity |
| 1.29 | Color recognition machine | 1.29 | 3.2.8 | 6.2.8 | color |
| 1.31 | Rocker color changing light | 1.31 | 3.2.9 | 6.2.9 | joystick |

### Sensor Expansion Builds - Chapter 3.x/6.3.x

These ADD sensors to basic builds. Assembly is in Chapter 1.18+.

| Build ID | Name | Base Build | Assembly | MakeCode (3.3.x) | Python (6.3.x) | Sensor Added |
|----------|------|------------|----------|------------------|----------------|--------------|
| 1.18 | Small flying car obstacle avoidance | 1.2 Pretty car? | 1.18 | 3.3.1 | 6.3.1 | ultrasonic |
| 1.19 | Changing face | 1.10 Changing Face | 1.19 | 3.3.2 | 6.3.2 | ? |
| 1.21 | Adjustable fan | 1.12 Oscillating fan | 1.21 | 3.3.3 | 6.3.3 | potentiometer |
| 1.24 | Light-controlled bipedal robot | 1.9 Biped robot | 1.24 | 3.3.4 | 6.3.4 | light |
| 1.25 | Swimming robot avoid objects | ? | 1.25 | 3.3.5 | 6.3.5 | ultrasonic? |
| 1.26 | Fleeing spider | 1.7 Spider | 1.26 | 3.3.6 | 6.3.6 | PIR |
| 1.28 | Temperature-controlled fan | 1.21 Adjustable fan? | 1.28 | 3.3.7 | 6.3.7 | temperature |
| 1.30 | Color-recognizing automatic door | 1.15 Auto-door | 1.30 | 3.3.8 | 6.3.8 | color |
| 1.32 | Rocker transporter | 1.4 Proficient carrier? | 1.32 | 3.3.9 | 6.3.9 | joystick |

---

## Sensor Theory Lessons - Chapter 6.1.x (Python only?)

| Lesson | Topic | Related Sensor |
|--------|-------|----------------|
| 6.1.1 | About ultrasonic sensor | ultrasonic |
| 6.1.2 | Ultrasonic ranging | ultrasonic |
| 6.1.3 | About potentiometers | potentiometer |
| 6.1.4 | Adjust potentiometer | potentiometer |
| 6.1.5 | About photosensitive series | light |
| 6.1.6 | Read the light intensity | light |
| 6.1.7 | About infrared modules | infrared |
| 6.1.8 | Obstacle detection | infrared |
| 6.1.9 | About human infrared sensor | PIR |
| 6.1.10 | Human body detection | PIR |
| 6.1.11 | About temperature-humidity | temperature, humidity |
| 6.1.12 | Read temperature-humidity | temperature, humidity |
| 6.1.13 | About color recognition sensor | color |
| 6.1.14 | Color recognition | color |
| 6.1.15 | About rocker module | joystick |
| 6.1.16 | Control rocker module | joystick |

---

## URL Patterns for Scraping

Based on observed patterns:

```
Assembly:     https://www.yahboom.net/study/buildingbit-super-kit#1.{n}
MakeCode:     https://www.yahboom.net/study/buildingbit-super-kit#3.{section}.{n}
Python:       https://www.yahboom.net/study/buildingbit-super-kit#6.{section}.{n}
```

Where:
- Assembly: 1.1 through 1.32
- MakeCode Basic: 3.1.x (unknown structure)
- MakeCode Sensor Basic: 3.2.1 through 3.2.9
- MakeCode Sensor Expansion: 3.3.1 through 3.3.9
- Python Sensor Principles: 6.1.1 through 6.1.16
- Python Sensor Basic: 6.2.1 through 6.2.9
- Python Sensor Expansion: 6.3.1 through 6.3.9

---

## Gap Analysis TODO

1. **Verify MakeCode Basic chapter structure** - What chapters cover builds 1.1-1.9?
2. **Map infrared builds** - 3.2.5 and 3.2.6 don't have clear assembly counterparts
3. **Confirm base build relationships** - Which basic builds are extended by sensor expansion?
4. **Scrape missing content** - Use Playwright to fill in the `?` entries above

---

## Proposed Unified Build Model

Instead of treating sensor expansion as separate builds, combine them:

```json
{
  "id": "biped-robot",
  "name": "Biped Robot",
  "variants": [
    {
      "type": "basic",
      "assembly": "1.9",
      "makecode": "3.1.?",
      "python": "5.?"
    },
    {
      "type": "sensor-expansion",
      "name": "Light-controlled bipedal robot",
      "assembly": "1.24",
      "makecode": "3.3.4",
      "python": "6.3.4",
      "sensor": "light"
    }
  ]
}
```

This way users see ONE build with optional sensor add-ons, not 32+ separate entries.
