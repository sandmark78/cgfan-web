from PIL import Image
import numpy as np
from scipy import ndimage

img = Image.open('public/images/taste-card-bg.png')
arr = np.array(img)

# Find the 8 main gold dots on the pendant
# They should be roughly equal-sized small circles
gold_mask = (arr[:,:,0] > 140) & (arr[:,:,0] < 230) & \
            (arr[:,:,1] > 110) & (arr[:,:,1] < 200) & \
            (arr[:,:,2] < 150) & (arr[:,:,2] > 40)

pendant_region = gold_mask[650:1150, 100:980]
labeled, num = ndimage.label(pendant_region)

# Filter for dot-sized clusters (30-200 pixels)
dots = []
for i in range(1, num+1):
    cluster_ys, cluster_xs = np.where(labeled == i)
    size = len(cluster_ys)
    if 30 < size < 200:
        cy = int(np.mean(cluster_ys)) + 650
        cx = int(np.mean(cluster_xs)) + 100
        dots.append((cx, cy, size))

# Sort by y then x
dots.sort(key=lambda d: (d[1], d[0]))
print("Gold dots (sorted by position):")
for i, (cx, cy, size) in enumerate(dots):
    print(f'  {i+1}: ({cx}, {cy}), size={size}')

# The compass center should be at the bottom of the U
# From the image, compass is around (540, 960)
print("\nCompass center estimate: (540, 960)")
print("Pendant U-shape: open at top, compass at bottom")
