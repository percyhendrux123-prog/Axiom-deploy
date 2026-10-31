from pathlib import Path
from hashlib import sha256
import json
import re
import subprocess
from PIL import Image

root = Path(__file__).resolve().parent
repo = root.parents[1]
base = 'cbe8a830a9d2db0b664dfb6ce7d6c5abbdbe9977'
manifest = {'branch': subprocess.check_output(['git', 'branch', '--show-current'], cwd=repo, text=True).strip(), 'baseline': base, 'preview_only': True, 'screenshots': []}
for phase in ['before', 'after']:
    for page in ['home', 'notes', 'note', 'field-report', 'privacy']:
        for width in [1440, 390]:
            path = root / phase / f'{page}-{width}.png'
            with Image.open(path) as image:
                assert image.width == width
                manifest['screenshots'].append({'path': str(path.relative_to(repo)), 'width': image.width, 'height': image.height, 'sha256': sha256(path.read_bytes()).hexdigest()})
assert len(manifest['screenshots']) == 20
manifest['audits'] = {}
for phase, expected in [('after', 91), ('webkit', 39)]:
    data = json.loads((root / phase / 'audit.json').read_text())
    assert len(data) == expected
    assert len({(r['path'], r['width']) for r in data}) == expected
    assert len({r['path'] for r in data}) == 13
    assert all(not r['outside'] and r['scrollWidth'] <= r['width'] for r in data)
    assert all(not r['smallTargets'] for r in data if r['width'] <= 430)
    assert all(not r['errors'] and not r['badResources'] and not r['external'] for r in data)
    axes = [r for r in data if r.get('axe')]
    assert len(axes) == 4
    assert all(not r['axe']['violations'] and not r['axe']['incomplete'] for r in axes)
    manifest['audits'][phase] = {'route_width_checks': len(data), 'routes': 13, 'widths': sorted({r['width'] for r in data}), 'overflow_failures': 0, 'mobile_target_failures': 0, 'page_or_resource_errors': 0, 'external_requests': 0, 'axe_runs': len(axes), 'axe_version': axes[0]['axe']['version'], 'axe_violations': 0, 'axe_incomplete': 0}
manifest['tests'] = {}
for name, expected in [('node-tests.log', 48), ('browser-tests.log', 9)]:
    text = (root / name).read_text()
    passed_match, failed_match = re.search(r'ℹ pass (\d+)', text), re.search(r'ℹ fail (\d+)', text)
    assert passed_match is not None and failed_match is not None
    passed, failed = int(passed_match[1]), int(failed_match[1])
    assert passed == expected and failed == 0
    manifest['tests'][name] = {'passed': passed, 'failed': failed}
assert 'Netlify Build Complete' in (root / 'netlify-offline-build.log').read_text()
manifest['preserved_files'] = []
for name in ['package.json', 'package-lock.json', 'netlify.toml', 'assets/founder.jpg', 'assets/field-reports/check-log.png', 'assets/fonts/Cinzel.ttf', 'assets/fonts/OFL.txt', 'assets/wordmark-ink.svg', 'assets/wordmark-stone.svg', 'assets/site.js', 'assets/br.js', 'netlify/functions/application-submit.mjs', 'netlify/functions/meta-webhook.mjs', 'archive/two-business-evaluation-2026-09/index.html']:
    expected = subprocess.check_output(['git', 'show', f'{base}:{name}'], cwd=repo)
    actual = (repo / name).read_bytes()
    assert actual == expected, name
    manifest['preserved_files'].append({'path': name, 'sha256': sha256(actual).hexdigest()})
for name in ['CONTACT-SHEET.png', 'CHANGES.md']:
    path = root / name
    assert path.is_file()
manifest['adversarial_review'] = {'passes': 1, 'defects_found': 1, 'severity': 'P2', 'defect': 'Report CTA Stone-on-Stone hover label', 'fix': 'Explicit report hover/active colors; real browser regression observed red then green', 'fixed': True, 'report': 'qa/polish-2026-10-31/REVIEW-Axiom-deploy-design-polish-2026-10-31.md'}
(root / 'EVIDENCE.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps({'screenshots': len(manifest['screenshots']), 'audits': manifest['audits'], 'tests': manifest['tests'], 'unchanged_sensitive_surfaces': len(manifest['preserved_files'])}, indent=2))
