import sys
import os
from reportlab.pdfgen import canvas
from app.evidence.preview import create_watermarked_pdf

# Create dummy PDF
c = canvas.Canvas('test_original.pdf')
c.drawString(100, 750, 'Original Content')
c.save()

try:
    res = create_watermarked_pdf('test_original.pdf', 'User', 'email@test.com')
    if res:
        print('SUCCESS')
    else:
        print('FAILURE')
except Exception as e:
    print(f'ERROR: {e}')
finally:
    if os.path.exists('test_original.pdf'): os.remove('test_original.pdf')