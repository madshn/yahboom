# Building:bit Content Master Table

Generated: 2026-01-18

## Yahboom Site Chapter Structure

| Chapter | Name | Content |
|---------|------|---------|
| 1 | Assembly Course | Build instructions (1.1-1.32) |
| 2 | Preparation before class | Documentation, guides, APIs |
| 3 | Basic modeling MakeCode | MakeCode for builds 1.1-1.9 |
| 4 | Basic modeling Python | Python for builds 1.1-1.9 |
| 5 | Sensor Advanced MakeCode | 5.1=Theory, 5.2=Basic, 5.3=Expansion |
| 6 | Sensor Advanced Python | 6.1=Theory, 6.2=Basic, 6.3=Expansion |

---

## Basic Builds (1.1-1.16)

These builds use only motors and servos, no external sensors.

| ID | Name | Assembly | MakeCode | Python | Sensor Variant |
|----|------|----------|----------|--------|----------------|
| 1.1 | Mobile shooter | ✓ 1.1 | 3.1 | 4.1 | — |
| 1.2 | Pretty car | ✓ 1.2 | 3.2 | 4.2 | → 1.18 (ultrasonic) |
| 1.3 | Clip robot | ✓ 1.3 | 3.3 | 4.3 | — |
| 1.4 | Proficient carrier | ✓ 1.4 | 3.4 | 4.4 | → 1.32 (joystick) |
| 1.5 | Skip car | ✓ 1.5 | 3.5 | 4.5 | — |
| 1.6 | Freestyle | ✓ 1.6 | 3.6 | 4.6 | — |
| 1.7 | Spider | ✓ 1.7 | 3.7 | 4.7 | → 1.26 (PIR) |
| 1.8 | Lifting platform | ✓ 1.8 | 3.8 | 4.8 | — |
| 1.9 | Biped robot | ✓ 1.9 | 3.9 | 4.9 | → 1.24 (light) |
| 1.10 | Changing Face | ✓ 1.10 | — | — | → 1.19 (infrared) |
| 1.11 | Carousel | ✓ 1.11 | — | — | — |
| 1.12 | Oscillating fan | ✓ 1.12 | — | — | → 1.21 (potentiometer) |
| 1.13 | Airplane | ✓ 1.13 | — | — | — |
| 1.14 | Unicycle | ✓ 1.14 | — | — | — |
| 1.15 | Auto-door | ✓ 1.15 | — | — | → 1.30 (color) |
| 1.16 | Dragon knight | ✓ 1.16 | — | — | — |

---

## Sensor Basic Builds (1.17-1.32 standalone)

Standalone sensor projects from Chapter 5.2 (MakeCode) / 6.2 (Python).

| ID | Name | Sensor | Assembly | MakeCode | Python | Theory |
|----|------|--------|----------|----------|--------|--------|
| 1.17 | Ultrasonic rangefinder | ultrasonic | ✓ 1.17 | 5.2.1 | 6.2.1 | 5.1.1-2 |
| 1.20 | Adjustable RGB light | potentiometer | ✓ 1.20 | 5.2.2 | 6.2.2 | 5.1.3-4 |
| 1.22 | Emergency light | light | ✓ 1.22 | 5.2.3 | 6.2.3 | 5.1.5-6 |
| 1.23 | Smart alarm clock | (vibration) | ✓ 1.23 | 5.2.4 | 6.2.4 | — |
| — | Infrared broadcast | infrared | — | 5.2.5 | 6.2.5 | 5.1.7-8 |
| — | Human IR detection | PIR | — | 5.2.6 | 6.2.6 | 5.1.9-10 |
| 1.27 | Temp/humidity reminder | temperature | ✓ 1.27 | 5.2.7 | 6.2.7 | 5.1.11-12 |
| 1.29 | Color recognition | color | ✓ 1.29 | 5.2.8 | 6.2.8 | 5.1.13-14 |
| 1.31 | Rocker light | joystick | ✓ 1.31 | 5.2.9 | 6.2.9 | 5.1.15-16 |

**Note:** 5.2.5 and 5.2.6 have no assembly equivalent - they may be code-only demos.

---

## Sensor Expansion Builds (add sensors to basic builds)

From Chapter 5.3 (MakeCode) / 6.3 (Python).

| ID | Name | Base Build | Sensor | Assembly | MakeCode | Python | Theory |
|----|------|------------|--------|----------|----------|--------|--------|
| 1.18 | Avoiding car | 1.2 Pretty car | ultrasonic | ✓ 1.18 | 5.3.1 | 6.3.1 | 5.1.1-2 |
| 1.19 | Changing face (sensor) | 1.10 Changing Face | infrared | ✓ 1.19 | 5.3.2 | 6.3.2 | 5.1.7-8 |
| 1.21 | Adjustable fan | 1.12 Oscillating fan | potentiometer | ✓ 1.21 | 5.3.3 | 6.3.3 | 5.1.3-4 |
| 1.24 | Light-controlled robot | 1.9 Biped robot | light | ✓ 1.24 | 5.3.4 | 6.3.4 | 5.1.5-6 |
| 1.25 | Swimming robot | — | ultrasonic | ✓ 1.25 | 5.3.5 | 6.3.5 | 5.1.1-2 |
| 1.26 | Fleeing spider | 1.7 Spider | PIR | ✓ 1.26 | 5.3.6 | 6.3.6 | 5.1.9-10 |
| 1.28 | Temp-controlled fan | 1.21 Adjustable fan | temperature | ✓ 1.28 | 5.3.7 | 6.3.7 | 5.1.11-12 |
| 1.30 | Color-recognizing door | 1.15 Auto-door | color | ✓ 1.30 | 5.3.8 | 6.3.8 | 5.1.13-14 |
| 1.32 | Rocker transporter | 1.4 Proficient carrier | joystick | ✓ 1.32 | 5.3.9 | 6.3.9 | 5.1.15-16 |

---

## Sensor Theory Lessons (Chapter 5.1 / 6.1)

| Lessons | Sensor | Topics |
|---------|--------|--------|
| 5.1.1-2 / 6.1.1-2 | ultrasonic | About ultrasonic sensors, Ranging |
| 5.1.3-4 / 6.1.3-4 | potentiometer | About potentiometers, Adjustment |
| 5.1.5-6 / 6.1.5-6 | light | About photosensitive, Read intensity |
| 5.1.7-8 / 6.1.7-8 | infrared | About infrared modules, Obstacle detection |
| 5.1.9-10 / 6.1.9-10 | PIR | About human infrared, Body detection |
| 5.1.11-12 / 6.1.11-12 | temperature | About temp-humidity, Read values |
| 5.1.13-14 / 6.1.13-14 | color | About color sensors, Color recognition |
| 5.1.15-16 / 6.1.15-16 | joystick | About rocker module, Control |

---

## Summary

| Category | Total | With Assembly | With MakeCode | With Python |
|----------|-------|---------------|---------------|-------------|
| Basic builds (1.1-1.16) | 16 | 16 (100%) | 9 (56%) | 9 (56%) |
| Sensor basic (standalone) | 9 | 7 (78%) | 9 (100%) | 9 (100%) |
| Sensor expansion | 9 | 9 (100%) | 9 (100%) | 9 (100%) |
| **Total builds** | **34** | **32** | **27** | **27** |

---

## Key Insights

1. **Builds 1.10-1.16** have assembly only - no MakeCode/Python tutorials
2. **5.2.5 and 5.2.6** are MakeCode/Python only - no assembly instructions
3. **Sensor expansion builds** always link back to a basic build as their foundation
4. **Each sensor** has 2 theory lessons + 1 basic project + 1 expansion project
