# Image Processing Learnings

This document captures the challenges and solutions discovered while extracting gallery images from Yahboom's Building:bit instruction manual images.

## The Problem

Source images from Yahboom are complex multi-panel assembly instruction pages:
- **3-column layout**: Each page shows 3 different views/angles of the build
- **Cyan/blue frame borders**: Panels are separated by colored borders
- **Varying layouts**: Some builds have vertically stacked views within panels
- **Inconsistent dimensions**: Different builds have different aspect ratios

Example source image structure (3248×2480 pixels):
```
┌─────────────┬─────────────┬─────────────┐
│   View 1    │   View 2    │   View 3    │
│  (exploded) │  (in-prog)  │  (finished) │
│             │             │             │
└─────────────┴─────────────┴─────────────┘
      ↑ cyan borders between panels
```

## Failed Approaches

### 1. Fixed Percentage Cropping
**Approach**: Crop the rightmost 33% of the image to get the "finished" view.

**Problem**: The cyan frame borders have varying thickness, and some images have different layouts (e.g., vertically stacked views in the right panel).

### 2. Sharp's trim() with Fixed Color
**Approach**: Use Sharp's `trim()` function with a specific cyan color (`#5bcefa`).

**Problem**: The actual border color varies, and the corners are white (not cyan), causing trim to fail or remove too little/too much.

### 3. Fixed Pixel Frame Trimming
**Approach**: Define fixed pixel values for each edge (e.g., `FRAME_LEFT = 100px`).

**Problem**: Frame thickness varies between images and even between edges of the same image. Required constant manual adjustment.

## Working Solution: OpenCV Contour Detection

The final solution uses OpenCV (Python) for intelligent frame detection:

### Algorithm
1. **Color masking**: Detect cyan/blue border areas using HSV color range
2. **Contour detection**: Find rectangular contours in the masked image
3. **Panel identification**: Filter for contours with sufficient area (>5% of image)
4. **Selection**: Score panels by position (bottom-right = highest score)
5. **Extraction**: Crop the selected panel with padding to exclude borders
6. **White background removal**: Convert white pixels to transparent

### Key Code (extract-frame.py)
```python
# Detect cyan borders using HSV color space
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
lower_cyan = np.array([80, 50, 50])
upper_cyan = np.array([110, 255, 255])
cyan_mask = cv2.inRange(hsv, lower_cyan, upper_cyan)

# Find contours and filter for panels
contours, _ = cv2.findContours(cyan_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
panels = [cv2.boundingRect(c) for c in contours if cv2.contourArea(c) > min_area]

# Select bottom-right panel (usually shows finished build)
panels.sort(key=lambda p: (p[1] + p[3]/2) * 0.6 + (p[0] + p[2]/2) * 0.4, reverse=True)
target = panels[0]
```

### Transparency
After extraction, white backgrounds are converted to transparent:
```python
# Create alpha mask from white pixels
gray = cv2.cvtColor(cropped, cv2.COLOR_BGR2GRAY)
_, white_mask = cv2.threshold(gray, 250, 255, cv2.THRESH_BINARY)

# Set alpha channel
cropped_rgba = cv2.cvtColor(cropped, cv2.COLOR_BGR2BGRA)
cropped_rgba[:, :, 3] = 255 - white_mask
```

## Dependencies

- **OpenCV** (`opencv-python-headless`): Contour detection and color masking
- **Sharp** (Node.js): Final image resizing and WebP conversion with alpha
- **NumPy**: Array operations for OpenCV

## Pipeline Architecture

```
Source URL → Download → OpenCV Extract → Sharp Resize → WebP Output
                           ↓
                    Python subprocess
                    (extract-frame.py)
```

The Node.js script (`process-images.js`) orchestrates the pipeline:
1. Downloads source image to temp file
2. Calls Python script for frame extraction
3. Reads extracted PNG with transparency
4. Uses Sharp to create multiple sizes (thumb, medium, full)
5. Saves as WebP with alpha channel preservation

## Lessons Learned

1. **Don't assume fixed layouts**: Image processing needs to adapt to varying source formats
2. **Color detection > edge detection**: For bordered content, HSV color masking is more reliable than Canny edge detection
3. **Use the right tool**: Sharp is great for resizing/format conversion, but OpenCV excels at content detection
4. **Transparency matters**: Removing backgrounds makes images more versatile in different UI contexts
5. **Data quality**: Always verify source data - we found duplicate URLs in scraped data causing wrong images
