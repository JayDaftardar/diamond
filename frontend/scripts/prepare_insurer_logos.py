"""Prepare the insurer logos for the website.

Reads the raw logo files from frontend/insurer-logos-original/ (your untouched originals)
and writes web-ready copies to frontend/public/images/insurers/:

  - crops the empty margin around each logo, so it fills its tile instead of floating in it
  - turns off-white and cream backgrounds into pure white, so they blend into the white tile
  - keeps dark backgrounds as they are (the logo then sits on its own dark badge)
  - shrinks large images to at most 440 x 132 pixels (about twice the size they are shown at)
  - saves them as small WebP files named after the insurer (SVG files are copied as they are)

Run from the backend folder, which has the Pillow library:

    cd backend
    uv run python ../frontend/scripts/prepare_insurer_logos.py

Safe to run again. To add or replace a logo, put the raw file in insurer-logos-original/,
add it to LOGOS below and to INSURER_LOGOS in frontend/src/content/config.ts, then run it.
"""

import re
import shutil
from pathlib import Path

from PIL import Image, ImageChops

FRONTEND = Path(__file__).resolve().parent.parent
ORIGINALS = FRONTEND / "insurer-logos-original"
OUTPUT = FRONTEND / "public" / "images" / "insurers"

MAX_SIZE = (440, 132)
PADDING = 0.08  # of the logo's longest side, kept around it after cropping
BACKGROUND_TOLERANCE = 30

# original file name -> name on the website (without extension)
LOGOS = {
    "acko.jpg": "acko",
    "aditya birla.jpg": "aditya-birla",
    "bajaj.jpg": "bajaj-allianz",
    "baxa.png": "bharti-axa",
    "carehealth.png": "care-health",
    "chandomalam.jpg": "cholamandalam-ms",
    "digit.jpg": "digit",
    "edelweiss.jpg": "edelweiss",
    "futuregenerali.jpg": "future-generali",
    "hdfc.png": "hdfc-ergo",
    "ICICI-Lombard.jpg": "icici-lombard",
    "iffco-tokio.svg": "iffco-tokio",
    "kotak.png": "kotak",
    "Logo_Liberty_Insurance.png": "liberty",
    "manipal.png": "manipal-cigna",
    "Max_Bupa_logo.svg": "max-bupa",
    "national.jpg": "national-insurance",
    "navi.jpg": "navi",
    "new india.jpg": "new-india-assurance",
    "The_Oriental_Insurance_Company_Logo.svg": "oriental-insurance",
    "rahejaqbe.webp": "raheja-qbe",
    "reliance.png": "reliance-general",
    "royalsundaram.png": "royal-sundaram",
    "sbi.jpg": "sbi-general",
    "shriram.jpg": "shriram-general",
    "Star_Health_and_Allied_Insurance.svg.jpg": "star-health",
    "TATA_AIG_logo.png": "tata-aig",
    "United_India_Insurance.svg.jpg": "united-india",
    "UniversalSompo_LOGO.jpg": "universal-sompo",
}

# The National Insurance file has a grey "transparent" checkerboard pasted into it, so its
# logo is found by colour (the teal and navy shapes) instead of by background.
FIND_BY_COLOUR = {"national.jpg"}


def corner_background(rgb: Image.Image) -> tuple[int, int, int]:
    """The background colour: the most common of the four corners (3x3 pixels each)."""
    w, h = rgb.size
    corners = [(0, 0), (w - 3, 0), (0, h - 3), (w - 3, h - 3)]
    samples = []
    for x, y in corners:
        block = rgb.crop((x, y, x + 3, y + 3)).resize((1, 1), Image.Resampling.BOX)
        samples.append(block.getpixel((0, 0)))

    def close(a, b):
        return sum(abs(p - q) for p, q in zip(a, b, strict=True)) < 40

    best = max(samples, key=lambda s: sum(close(s, o) for o in samples))
    return best  # type: ignore[return-value]


def logo_box(im: Image.Image, by_colour: bool):
    rgba = im.convert("RGBA")
    alpha = rgba.getchannel("A")
    if alpha.getextrema()[0] < 250:  # real transparency: the logo is whatever is opaque
        return alpha.point(lambda v: 255 if v > 20 else 0).getbbox(), None
    rgb = rgba.convert("RGB")
    if by_colour:
        hsv = rgb.convert("HSV")
        saturation = hsv.getchannel("S").point(lambda v: 255 if v > 90 else 0)
        value = hsv.getchannel("V").point(lambda v: 255 if v < 80 else 0)
        return ImageChops.lighter(saturation, value).getbbox(), None
    background = corner_background(rgb)
    diff = ImageChops.difference(rgb, Image.new("RGB", rgb.size, background)).convert("L")
    return diff.point(lambda v: 255 if v > BACKGROUND_TOLERANCE else 0).getbbox(), background


def trim_svg(text: str) -> str | None:
    """Shrink an SVG's canvas to its drawing (some are a logo in a corner of a page).

    Only done when it is exact: absolute path commands (M L C Z) and no transforms or
    clipping. Otherwise returns None and the file is used as it is.
    """
    if re.search(r"transform=|clip-path|<use|<image|<text|<rect|<circle|<ellipse|<polygon", text):
        return None
    commands = "".join(re.findall(r'\sd="([^"]*)"', text))
    if not commands or re.search(r"[a-zA-Z]", re.sub(r"[MLCZ]", "", commands)):
        return None
    numbers = [float(n) for n in re.findall(r"-?\d+(?:\.\d+)?", commands)]
    if len(numbers) % 2:
        return None
    xs, ys = numbers[0::2], numbers[1::2]
    pad = 0.04 * max(max(xs) - min(xs), max(ys) - min(ys))
    x0, y0 = min(xs) - pad, min(ys) - pad
    width, height = max(xs) - min(xs) + 2 * pad, max(ys) - min(ys) + 2 * pad
    box = f'width="{width:.0f}" height="{height:.0f}" viewBox="{x0:.2f} {y0:.2f} {width:.2f} {height:.2f}"'
    return re.sub(r'width="[^"]*"\s+height="[^"]*"\s+viewBox="[^"]*"', box, text, count=1)


def prepare(source: Path, name: str):
    if source.suffix.lower() == ".svg":
        text = source.read_text(encoding="utf-8")
        trimmed = trim_svg(text)
        if trimmed is None or trimmed == text:
            shutil.copyfile(source, OUTPUT / f"{name}.svg")
            return f"{name}.svg", "vector, copied"
        (OUTPUT / f"{name}.svg").write_text(trimmed, encoding="utf-8")
        return f"{name}.svg", "vector, empty canvas trimmed"
    with Image.open(source) as opened:
        im = opened.convert("RGBA")
    box, background = logo_box(im, source.name in FIND_BY_COLOUR)
    if box is None:
        raise SystemExit(f"{source.name}: could not find a logo in the image")
    pad = int(max(box[2] - box[0], box[3] - box[1]) * PADDING)
    box = (
        max(0, box[0] - pad),
        max(0, box[1] - pad),
        min(im.width, box[2] + pad),
        min(im.height, box[3] + pad),
    )
    im = im.crop(box)
    note = f"cropped {box[2] - box[0]}x{box[3] - box[1]}"
    if background is not None and sum(background) > 3 * 225:  # light or cream: make it white
        rgb = im.convert("RGB")
        near = ImageChops.difference(rgb, Image.new("RGB", rgb.size, background)).convert("L")
        mask = near.point(lambda v: 255 if v < 22 else 0)
        rgb.paste((255, 255, 255), mask=mask)
        im = rgb.convert("RGBA")
        note += ", background made white"
    elif background is not None and sum(background) < 3 * 200:
        note += ", kept dark background"
    im.thumbnail(MAX_SIZE, Image.Resampling.LANCZOS)  # shrinks only, never enlarges
    has_alpha = im.getchannel("A").getextrema()[0] < 250
    im = im if has_alpha else im.convert("RGB")
    im.save(OUTPUT / f"{name}.webp", "WEBP", quality=88, method=6)
    return f"{name}.webp", note


def main():
    if not ORIGINALS.exists():
        # first run: the files you added become the untouched originals
        ORIGINALS.mkdir(parents=True)
        for file in OUTPUT.iterdir():
            if file.is_file() and not file.name.startswith("."):
                shutil.move(str(file), str(ORIGINALS / file.name))
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for stale in OUTPUT.iterdir():  # rebuild cleanly: nothing left over from older runs
        if stale.is_file() and not stale.name.startswith("."):
            stale.unlink()
    total = 0
    for original, name in LOGOS.items():
        source = ORIGINALS / original
        if not source.exists():
            print(f"MISSING  {original}")
            continue
        made, note = prepare(source, name)
        size = (OUTPUT / made).stat().st_size
        total += size
        print(f"{made:28s} {size // 1024:3d} KB  {note}")
    print(f"total {total // 1024} KB (was {sum(f.stat().st_size for f in ORIGINALS.iterdir() if f.is_file()) // 1024} KB)")


if __name__ == "__main__":
    main()
