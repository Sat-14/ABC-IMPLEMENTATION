import io
from datetime import datetime, timezone

from PIL import Image, ImageDraw, ImageFont


def create_watermarked_image(file_path, user_name, user_email):
    """Create a watermarked copy of an image with user info and timestamp."""
    try:
        img = Image.open(file_path).convert("RGBA")

        # Create watermark overlay
        overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)

        # Use default font (no external font file needed)
        try:
            font = ImageFont.truetype("arial.ttf", size=max(14, img.width // 40))
        except (OSError, IOError):
            font = ImageFont.load_default()

        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        watermark_text = f"{user_name} | {user_email} | {timestamp}"

        # Draw diagonal watermarks across the image
        text_bbox = draw.textbbox((0, 0), watermark_text, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        text_height = text_bbox[3] - text_bbox[1]

        # Place watermark text in a grid pattern
        step_x = max(text_width + 80, 300)
        step_y = max(text_height + 120, 150)

        for y in range(-img.height, img.height * 2, step_y):
            for x in range(-img.width, img.width * 2, step_x):
                # Semi-transparent white text with dark outline
                draw.text((x + 1, y + 1), watermark_text, fill=(0, 0, 0, 40), font=font)
                draw.text((x, y), watermark_text, fill=(255, 255, 255, 60), font=font)

        # Also add a solid watermark bar at the bottom
        bar_height = text_height + 16
        bar = Image.new("RGBA", (img.width, bar_height), (0, 0, 0, 160))
        bar_draw = ImageDraw.Draw(bar)
        bar_draw.text((10, 8), f"VIEWED BY: {watermark_text}", fill=(255, 255, 255, 220), font=font)

        # Composite
        watermarked = Image.alpha_composite(img, overlay)
        watermarked.paste(bar, (0, img.height - bar_height), bar)

        # Convert back to RGB for JPEG compatibility
        output = watermarked.convert("RGB")

        buffer = io.BytesIO()
        output.save(buffer, format="PNG")
        buffer.seek(0)
        return buffer

    except Exception:
        return None
