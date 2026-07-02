#!/usr/bin/env python3
"""Extract dominant colors from the palette image."""
from PIL import Image
from collections import Counter

img = Image.open('/home/z/my-project/upload/pasted_image_1782865695824.png').convert('RGB')
w, h = img.size
print(f"Image size: {w}x{h}")

# Sample colors - get all pixels and find the most common distinct colors
pixels = list(img.getdata())
counter = Counter(pixels)

# Get top 30 most common colors
print("\nTop 30 most common colors (RGB → Hex → count):")
for color, count in counter.most_common(30):
    hex_color = '#{:02X}{:02X}{:02X}'.format(*color)
    pct = (count / len(pixels)) * 100
    print(f"  {hex_color}  rgb{color}  {pct:.1f}%  ({count} pixels)")

# Also sample a grid to catch less common but visually distinct colors
print("\nGrid sample (every 50px):")
distinct = {}
for y in range(0, h, 25):
    for x in range(0, w, 25):
        pixel = img.getpixel((x, y))
        hex_color = '#{:02X}{:02X}{:02X}'.format(*pixel)
        if hex_color not in distinct:
            distinct[hex_color] = (x, y, pixel)

print(f"Found {len(distinct)} distinct colors in grid sample")
# Sort by luminance to group similar
sorted_colors = sorted(distinct.items(), key=lambda x: sum(x[1][2]))
for hex_color, (x, y, rgb) in sorted_colors[:40]:
    print(f"  pos({x:3d},{y:3d})  {hex_color}  rgb{rgb}")
