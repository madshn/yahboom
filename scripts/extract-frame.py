#!/usr/bin/env python3
"""
Extract the bottom-right frame from multi-panel assembly instruction images.
Uses OpenCV contour detection to find panel boundaries.
"""

import sys
import cv2
import numpy as np
from PIL import Image
import io

def extract_last_frame(image_path, output_path, debug=False):
    """
    Extract the bottom-right panel from a multi-panel instruction image.

    Strategy:
    1. Detect cyan/blue frame borders using color masking
    2. Find contours of the frames
    3. Filter for rectangular panels with sufficient area
    4. Select the bottom-right panel (usually shows finished build)
    """

    # Load image
    img = cv2.imread(image_path)
    if img is None:
        print(f"Error: Could not load image {image_path}", file=sys.stderr)
        return False

    height, width = img.shape[:2]

    # Convert to HSV for better color detection
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

    # Define range for cyan/blue border color (adjust as needed)
    # Cyan is around H=90 in OpenCV's 0-180 range
    lower_cyan = np.array([80, 50, 50])
    upper_cyan = np.array([110, 255, 255])

    # Create mask for cyan areas
    cyan_mask = cv2.inRange(hsv, lower_cyan, upper_cyan)

    # Dilate to connect nearby edges
    kernel = np.ones((5, 5), np.uint8)
    cyan_mask = cv2.dilate(cyan_mask, kernel, iterations=2)

    # Find contours
    contours, _ = cv2.findContours(cyan_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Filter for large rectangular contours (panels)
    min_area = (width * height) * 0.05  # At least 5% of image area
    panels = []

    for contour in contours:
        area = cv2.contourArea(contour)
        if area < min_area:
            continue

        # Get bounding rectangle
        x, y, w, h = cv2.boundingRect(contour)

        # Check if roughly rectangular (area vs bounding rect area)
        rect_area = w * h
        rectangularity = area / rect_area if rect_area > 0 else 0

        if rectangularity > 0.5:  # At least 50% filled
            panels.append({
                'x': x, 'y': y, 'w': w, 'h': h,
                'area': area,
                'center_x': x + w/2,
                'center_y': y + h/2
            })

    if not panels:
        # Fallback: divide into 3 columns and take rightmost
        print("No panels detected via contours, using fallback", file=sys.stderr)
        panel_width = width // 3
        x = width - panel_width
        panels = [{'x': x, 'y': 0, 'w': panel_width, 'h': height}]

    # Sort panels by position (bottom-right = highest y + highest x)
    # Use a score combining y position and x position
    def score_panel(p):
        # Normalize to 0-1 range and weight y slightly more
        norm_x = p.get('center_x', p['x'] + p['w']/2) / width
        norm_y = p.get('center_y', p['y'] + p['h']/2) / height
        return norm_y * 0.6 + norm_x * 0.4

    panels.sort(key=score_panel, reverse=True)

    # Get the "last" panel (bottom-right)
    target = panels[0]

    # Add some padding inward to exclude frame borders
    padding = 15
    x1 = max(0, target['x'] + padding)
    y1 = max(0, target['y'] + padding)
    x2 = min(width, target['x'] + target['w'] - padding)
    y2 = min(height, target['y'] + target['h'] - padding)

    # Crop
    cropped = img[y1:y2, x1:x2]

    # Additional trim: remove any remaining white/cyan borders
    # Convert to grayscale and find content bounds
    gray = cv2.cvtColor(cropped, cv2.COLOR_BGR2GRAY)

    # Threshold to find non-white areas
    _, thresh = cv2.threshold(gray, 250, 255, cv2.THRESH_BINARY_INV)

    # Find bounding box of content
    coords = cv2.findNonZero(thresh)
    if coords is not None:
        bx, by, bw, bh = cv2.boundingRect(coords)
        # Add small margin
        margin = 5
        bx = max(0, bx - margin)
        by = max(0, by - margin)
        bw = min(cropped.shape[1] - bx, bw + 2*margin)
        bh = min(cropped.shape[0] - by, bh + 2*margin)
        cropped = cropped[by:by+bh, bx:bx+bw]

    # Remove white background (make transparent)
    # Convert to RGBA
    cropped_rgba = cv2.cvtColor(cropped, cv2.COLOR_BGR2BGRA)

    # Create mask for white/near-white pixels
    gray = cv2.cvtColor(cropped, cv2.COLOR_BGR2GRAY)
    _, white_mask = cv2.threshold(gray, 250, 255, cv2.THRESH_BINARY)

    # Set alpha to 0 for white pixels
    cropped_rgba[:, :, 3] = 255 - white_mask

    # Save result as PNG with transparency
    cv2.imwrite(output_path, cropped_rgba)

    h, w = cropped.shape[:2]
    print(f"{w}x{h}")  # Output dimensions for caller

    if debug:
        # Save debug image showing detected panels
        debug_img = img.copy()
        for i, p in enumerate(panels):
            color = (0, 255, 0) if i == 0 else (0, 0, 255)
            cv2.rectangle(debug_img, (p['x'], p['y']),
                         (p['x']+p['w'], p['y']+p['h']), color, 3)
        cv2.imwrite(output_path.replace('.', '_debug.'), debug_img)

    return True


def extract_from_buffer(input_buffer, output_path):
    """Extract frame from image buffer (for use with Node.js subprocess)"""
    # Decode buffer
    nparr = np.frombuffer(input_buffer, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        print("Error: Could not decode image buffer", file=sys.stderr)
        return False

    # Save temp file and process
    temp_path = '/tmp/frame_extract_temp.jpg'
    cv2.imwrite(temp_path, img)
    return extract_last_frame(temp_path, output_path)


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: extract-frame.py <input_image> <output_image> [--debug]", file=sys.stderr)
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    debug = '--debug' in sys.argv

    success = extract_last_frame(input_path, output_path, debug)
    sys.exit(0 if success else 1)
