"""Draws the Wonder World app icon (rainbow over a purple tile) in all needed sizes."""
import math
import sys
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(sys.argv[1])
OUT.mkdir(parents=True, exist_ok=True)
S = 1024  # draw big, then shrink for smooth edges
CLEAR = (0, 0, 0, 0)


def background(full_bleed: bool) -> Image.Image:
    grad = Image.new("RGBA", (S, S))
    top, bottom = (157, 128, 250), (106, 75, 209)
    d = ImageDraw.Draw(grad)
    for y in range(S):
        t = y / (S - 1)
        d.line([(0, y), (S, y)], fill=tuple(round(top[i] + (bottom[i] - top[i]) * t) for i in range(3)) + (255,))
    mask = Image.new("L", (S, S), 0)
    md = ImageDraw.Draw(mask)
    if full_bleed:
        md.rectangle([0, 0, S, S], fill=255)
    else:
        md.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.22), fill=255)
    out = Image.new("RGBA", (S, S), CLEAR)
    out.paste(grad, (0, 0), mask)
    return out


def foreground() -> Image.Image:
    fg = Image.new("RGBA", (S, S), CLEAR)
    d = ImageDraw.Draw(fg)
    cx, cy = S // 2, int(S * 0.64)
    colors = [(239, 90, 90), (255, 155, 61), (255, 217, 61), (47, 191, 113), (61, 139, 253)]
    band, r = int(S * 0.055), int(S * 0.33)
    for col in colors:
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=col)
        r -= band
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=CLEAR)   # hole in the middle
    d.rectangle([0, cy, S, S], fill=CLEAR)                    # keep only the top half

    def cloud(x, y):
        for dx, dy, rr in [(-0.08, 0.0, 0.068), (0.0, -0.032, 0.082), (0.08, 0.0, 0.068), (0.0, 0.027, 0.072)]:
            R = int(S * rr)
            X, Y = int(x + S * dx), int(y + S * dy)
            d.ellipse([X - R, Y - R, X + R, Y + R], fill=(255, 255, 255, 255))

    outer = int(S * 0.33)
    cloud(cx - outer + int(S * 0.06), cy + int(S * 0.02))
    cloud(cx + outer - int(S * 0.06), cy + int(S * 0.02))

    sx, sy, sr = int(S * 0.72), int(S * 0.24), int(S * 0.06)
    pts = []
    for i in range(10):
        a = -math.pi / 2 + i * math.pi / 5
        rr = sr if i % 2 == 0 else sr * 0.45
        pts.append((sx + rr * math.cos(a), sy + rr * math.sin(a)))
    d.polygon(pts, fill=(255, 217, 61, 255))
    return fg


def icon(full_bleed: bool, k: float) -> Image.Image:
    """k shrinks the artwork toward the center (maskable icons need a safe margin)."""
    bg = background(full_bleed)
    fg = foreground()
    if k != 1:
        n = int(S * k)
        fg = fg.resize((n, n), Image.LANCZOS)
        layer = Image.new("RGBA", (S, S), CLEAR)
        layer.paste(fg, ((S - n) // 2, (S - n) // 2))
        fg = layer
    return Image.alpha_composite(bg, fg)


rounded = icon(full_bleed=False, k=1)
maskable = icon(full_bleed=True, k=0.78)    # stays inside Android's round crop
apple = icon(full_bleed=True, k=0.9)        # iPad rounds the corners itself
for size in (192, 512):
    rounded.resize((size, size), Image.LANCZOS).save(OUT / f"icon-{size}.png")
maskable.resize((512, 512), Image.LANCZOS).save(OUT / "icon-maskable-512.png")
apple.resize((180, 180), Image.LANCZOS).convert("RGB").save(OUT / "apple-touch-icon.png")
rounded.resize((64, 64), Image.LANCZOS).save(OUT / "favicon.png")
print("ok")
