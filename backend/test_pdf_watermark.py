import sys
import os

# Create a dummy PDF file
from reportlab.pdfgen import canvas
c = canvas.Canvas("test_original.pdf")
c.drawString(100, 750, "Original PDF Content")
c.save()

try:
    from app.evidence.preview import create_watermarked_pdf
    print("Function imported successfully")
except ImportError as e:
    print(f"Import failed: {e}")
    sys.exit(1)

result = create_watermarked_pdf("test_original.pdf", "Test User", "test@example.com")
if result:
    print("Watermarking successful")
    with open("test_watermarked.pdf", "wb") as f:
        f.write(result.getvalue())
else:
    print("Watermarking failed")
