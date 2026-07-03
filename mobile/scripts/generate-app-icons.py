#!/usr/bin/env python3
"""Generate Expo app icon, adaptive icon, and splash from assets/logo.png."""

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
LOGO_PATH = ASSETS / "logo.png"
PRIMARY = (255, 193, 7)  # #FFC107
SURFACE = (255, 252, 245)  # #FFFCF5


def paste_logo(canvas: Image.Image, logo: Image.Image, width_ratio: float) -> None:
    target_w = int(canvas.width * width_ratio)
    scale = target_w / logo.width
    target_h = int(logo.height * scale)
    resized = logo.resize((target_w, target_h), Image.Resampling.LANCZOS)
    x = (canvas.width - target_w) // 2
    y = (canvas.height - target_h) // 2
    if canvas.mode == "RGBA":
        canvas.paste(resized, (x, y), resized)
    else:
        canvas.paste(resized, (x, y), resized)


def paste_logo_on_card(canvas: Image.Image, logo: Image.Image, card_width_ratio: float = 0.78) -> None:
    """Place logo on a white card so yellow wordmark stays visible on yellow splash."""
    card_w = int(canvas.width * card_width_ratio)
    card_h = int(card_w * 0.32)
    x = (canvas.width - card_w) // 2
    y = (canvas.height - card_h) // 2
    draw = ImageDraw.Draw(canvas)
    radius = max(24, card_w // 16)
    draw.rounded_rectangle([x, y, x + card_w, y + card_h], radius=radius, fill=SURFACE)

    inner = Image.new("RGBA", (card_w, card_h), (0, 0, 0, 0))
    paste_logo(inner, logo, 0.72)
    canvas.paste(inner, (x, y), inner)


def make_icon(size: int, width_ratio: float) -> Image.Image:
    img = Image.new("RGBA", (size, size), PRIMARY + (255,))
    logo = Image.open(LOGO_PATH).convert("RGBA")
    # White rounded card keeps logo readable on yellow launcher icon.
    card_size = int(size * 0.82)
    card = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(card)
    inset = (size - card_size) // 2
    draw.rounded_rectangle(
        [inset, inset, inset + card_size, inset + card_size],
        radius=int(card_size * 0.18),
        fill=SURFACE + (255,),
    )
    inner = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    paste_logo(inner, logo, width_ratio * 0.72)
    card.alpha_composite(inner)
    img.alpha_composite(card)
    return img


def make_splash(width: int, height: int) -> Image.Image:
    img = Image.new("RGB", (width, height), PRIMARY)
    logo = Image.open(LOGO_PATH).convert("RGBA")
    paste_logo_on_card(img, logo)
    return img


def main() -> None:
    if not LOGO_PATH.exists():
        raise SystemExit(f"Missing logo: {LOGO_PATH}")

    make_icon(1024, 0.78).save(ASSETS / "icon.png", "PNG")
    make_icon(1024, 0.62).save(ASSETS / "adaptive-icon.png", "PNG")
    make_splash(1284, 2778).save(ASSETS / "splash.png", "PNG")

    print("Generated:")
    print("  assets/icon.png (1024x1024)")
    print("  assets/adaptive-icon.png (1024x1024)")
    print("  assets/splash.png (1284x2778)")


if __name__ == "__main__":
    main()
