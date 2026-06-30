#!/usr/bin/env python3
"""Generate Expo app icon, adaptive icon, and splash from assets/logo.png."""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
LOGO_PATH = ASSETS / "logo.png"
PRIMARY = (255, 193, 7)  # #FFC107


def paste_logo(canvas: Image.Image, logo: Image.Image, width_ratio: float) -> None:
    target_w = int(canvas.width * width_ratio)
    scale = target_w / logo.width
    target_h = int(logo.height * scale)
    resized = logo.resize((target_w, target_h), Image.Resampling.LANCZOS)
    x = (canvas.width - target_w) // 2
    y = (canvas.height - target_h) // 2
    canvas.paste(resized, (x, y), resized)


def make_icon(size: int, width_ratio: float) -> Image.Image:
    img = Image.new("RGBA", (size, size), PRIMARY + (255,))
    logo = Image.open(LOGO_PATH).convert("RGBA")
    paste_logo(img, logo, width_ratio)
    return img


def make_splash(width: int, height: int) -> Image.Image:
    img = Image.new("RGB", (width, height), PRIMARY)
    logo = Image.open(LOGO_PATH).convert("RGBA")
    paste_logo(img, logo, 0.72)
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
