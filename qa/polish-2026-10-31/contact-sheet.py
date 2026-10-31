from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parent
font_path = '/System/Library/Fonts/Supplemental/Georgia.ttf'
font = ImageFont.truetype(font_path, 20)
small = ImageFont.truetype(font_path, 16)
title = ImageFont.truetype(str(root.parents[1] / 'assets/fonts/Cinzel.ttf'), 30)
columns = [('before', 1440, 360), ('after', 1440, 360), ('before', 390, 195), ('after', 390, 195)]
pages = [('home', 'Home'), ('notes', 'Notes index'), ('note', 'One Front Door'), ('field-report', 'Insurance client-care field report'), ('privacy', 'Privacy')]
pad, gap, top = 28, 24, 142
width = pad * 2 + sum(c[2] for c in columns) + gap * 3
rows = []
for slug, label in pages:
    images = []
    for phase, viewport, target in columns:
        with Image.open(root / phase / f'{slug}-{viewport}.png') as source:
            images.append(source.convert('RGB').resize((target, round(source.height * target / source.width)), Image.Resampling.LANCZOS))
    rows.append((label, images, max(im.height for im in images) + 96))
height = top + sum(row[2] for row in rows) + pad
sheet = Image.new('RGB', (width, height), '#F2EEE6')
draw = ImageDraw.Draw(sheet)
draw.text((pad, 22), 'AXIOM / CRAFT POLISH', font=title, fill='#121316')
draw.text((pad, 68), 'Unshipped. Full-page comparisons, uncropped. Open original PNGs for native-size inspection.', font=small, fill='#4F535A')
x = pad
for phase, viewport, target in columns:
    draw.text((x, 104), f'{phase.upper()} / {viewport}px', font=font, fill='#121316')
    x += target + gap
y = top
for label, images, row_height in rows:
    draw.line((pad, y, width-pad, y), fill='#121316', width=2)
    draw.text((pad, y+14), label, font=font, fill='#121316')
    x = pad
    for image in images:
        sheet.paste(image, (x, y+56))
        draw.rectangle((x, y+56, x+image.width-1, y+56+image.height-1), outline='#CFC6B5')
        x += image.width + gap
    y += row_height
sheet.save(root / 'CONTACT-SHEET.png', optimize=True)
print(f'CONTACT-SHEET.png: {width} x {height}, {len(pages) * len(columns)} full-page images')
