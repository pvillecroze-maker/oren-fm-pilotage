"""Render the JANUS monogram in the existing OREN icon palette (Pillow)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
root = Path(__file__).resolve().parents[1] / 'public' / 'icons'
root.mkdir(exist_ok=True)
im = Image.new('RGB', (1024, 1024), '#07101d')
d = ImageDraw.Draw(im)
d.rounded_rectangle((120,120,904,904), radius=216, fill='#123832', outline='#d5b87c', width=8)
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf', 660)
b = d.textbbox((0,0), 'J', font=font)
d.text(((1024-(b[2]-b[0]))/2-b[0],(1024-(b[3]-b[1]))/2-b[1]-6), 'J', font=font, fill='#a8efdd')
for size in (180,192,512):
    im.resize((size,size),Image.Resampling.LANCZOS).save(root / f'janus-v1-{size}.png')
