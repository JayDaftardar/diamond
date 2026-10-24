"""Doctor photo uploads: check the file really is a photo, then re-encode it.

Nothing the admin uploads is stored as-is. Every photo is decoded and saved again as a
small WebP, which:
- rejects anything that is not a real JPEG, PNG or WebP (the bytes are checked, not the name),
- drops hidden metadata such as the GPS location a phone camera records,
- keeps each stored photo small (about 50-150 KB), so the database stays tiny.
"""

import hashlib
import io
from dataclasses import dataclass

from PIL import Image, ImageOps, UnidentifiedImageError

MAX_UPLOAD_BYTES = 8 * 1024 * 1024  # 8 MB: enough for a phone photo
MAX_PIXELS = 40_000_000  # refuse "decompression bombs" (tiny files that expand hugely)
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}
MAX_SIZE = (800, 1000)  # largest stored size; portraits are shown up to about 400x500
WEBP_QUALITY = 82
CONTENT_TYPE = "image/webp"

TOO_LARGE = "The photo is larger than 8 MB. Choose a smaller photo."
NOT_A_PHOTO = "That file is not a photo. Upload a JPG, PNG or WebP image."


@dataclass(frozen=True)
class ProcessedPhoto:
    data: bytes
    width: int
    height: int
    version: str  # short content hash, used in the photo's address


def process_photo(raw: bytes) -> ProcessedPhoto:
    """Validate and re-encode an uploaded photo. Raises ValueError with an admin-friendly message."""
    if not raw:
        raise ValueError(NOT_A_PHOTO)
    if len(raw) > MAX_UPLOAD_BYTES:
        raise ValueError(TOO_LARGE)

    try:
        with Image.open(io.BytesIO(raw)) as probe:
            if probe.format not in ALLOWED_FORMATS:
                raise ValueError(NOT_A_PHOTO)
            if probe.width * probe.height > MAX_PIXELS:
                raise ValueError("The photo's dimensions are too large. Use a smaller photo.")
            probe.verify()  # structural check; the image must be reopened after this

        with Image.open(io.BytesIO(raw)) as image:
            image = ImageOps.exif_transpose(image)  # honour the camera's rotation, then drop EXIF
            image = _flatten(image)
            image.thumbnail(MAX_SIZE, Image.Resampling.LANCZOS)
            out = io.BytesIO()
            image.save(out, format="WEBP", quality=WEBP_QUALITY, method=6)
            width, height = image.size
    except (UnidentifiedImageError, OSError, SyntaxError, Image.DecompressionBombError):
        raise ValueError(NOT_A_PHOTO) from None

    data = out.getvalue()
    return ProcessedPhoto(
        data=data,
        width=width,
        height=height,
        version=hashlib.sha256(data).hexdigest()[:16],
    )


def _flatten(image: Image.Image) -> Image.Image:
    """RGB without transparency: transparent areas become white, like the site's cards."""
    if image.mode in ("RGBA", "LA") or (image.mode == "P" and "transparency" in image.info):
        rgba = image.convert("RGBA")
        background = Image.new("RGB", rgba.size, (255, 255, 255))
        background.paste(rgba, mask=rgba.getchannel("A"))
        return background
    return image.convert("RGB")


def photo_path(slug: str, version: str | None) -> str | None:
    """Public address of a doctor's photo (relative to the API), or None without a photo."""
    return f"/api/v1/public/doctors/{slug}/photo?v={version}" if version else None
