"""Optional fixture regeneration: fonttools[woff] + DejaVuSans.ttf path.

This is NOT Apple Braille or a visual facsimile. DejaVu outlines are retained,
with advances chosen to reproduce AXIOM's observed Mac metrics at 34px:
44 braille cells = 1022.65625px; 43 cells + cursor = 1033.4140625px.
The regression uses a self-contained WOFF2 so it also works without Apple fonts.
Never copy this test-only font into assets/ or the public build.
"""
import sys
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont

font = TTFont(sys.argv[1])
options = subset.Options()
options.recalc_timestamp = False
options.hinting = False
subsetter = subset.Subsetter(options=options)
subsetter.populate(unicodes=[*range(0x2800, 0x2900), 0x258C])
subsetter.subset(font)
assert font['head'].unitsPerEm == 2048
# No hint program may round the deliberately fractional horizontal advances.
font['head'].flags &= ~16
for codepoint, glyph in font.getBestCmap().items():
    _, lsb = font['hmtx'][glyph]
    font['hmtx'][glyph] = (2048 if codepoint == 0x258C else 1400, lsb)
for record in font['name'].names:
    if record.nameID in (1, 2, 3, 4, 6, 16, 17):
        name = 'Regular' if record.nameID in (2, 17) else 'A300 Host Metrics'
        if record.nameID == 6:
            name = 'A300HostMetrics'
        record.string = name.encode(record.getEncoding())
font.flavor = 'woff2'
font.save(Path(__file__).with_name('a300-host-metrics.woff2'))
