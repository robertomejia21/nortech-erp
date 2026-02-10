import sys
import struct
import math

def get_dominant_colors(filename, num_colors=3):
    try:
        with open(filename, 'rb') as f:
            # Very basic BMP/PNG parser or just read bytes might not be reliable without Pillow/CV2
            # Since I saw 'pip list' earlier and it had very few packages, I might not have Pillow.
            # I will try to use a heuristic or just ask the user if I can't load libraries.
            # But wait, macOS usually comes with some libs.
            pass
    except Exception as e:
        print(f"Error reading {filename}: {e}")

# Actually, writing a raw image parser is error prone. 
# Let's check if we can use a system tool or simplistic approach.
# macOS has 'sips' command line tool for image processing!
# sips -g allxml logo.png might give info, but not colors.
# I will use a simple python script that tries to import PIL, if not, fail gracefully.

try:
    from PIL import Image
    import collections
except ImportError:
    print("PIL (Pillow) not installed. Cannot analyze images directly.")
    sys.exit(1)

def analyze(path):
    print(f"Analyzing {path}...")
    try:
        img = Image.open(path)
        img = img.resize((150, 150))
        result = img.convert('P', palette=Image.ADAPTIVE, colors=5)
        result.putalpha(0)
        colors = result.getcolors(150*150)
        ordered = sorted(colors, key=lambda x: x[0], reverse=True)
        
        print(f"Dominant colors for {path}:")
        for count, col in ordered[:3]:
            # col is usually an index or tuple depending on mode, let's ensure RGB
            pal = result.getpalette()
            if pal:
                # if P mode, look up palette
                # palette is [r,g,b, r,g,b, ...]
                # This is tricky with simplified PIL usage.
                # Let's convert to RGB first for simplicity in stats
                pass
        
        # Easier approach:
        img = Image.open(path).convert('RGB')
        # simple sampling
        pixels = list(img.getdata())
        from collections import Counter
        # quantize/round to reduce noise (e.g. round to nearest 10)
        quantized = [tuple(x//10 * 10 for x in p) for p in pixels]
        counts = Counter(quantized)
        common = counts.most_common(5)
        for color, count in common:
            print(f"RGB: {color} - Hex: #{color[0]:02x}{color[1]:02x}{color[2]:02x}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        for f in sys.argv[1:]:
            analyze(f)
