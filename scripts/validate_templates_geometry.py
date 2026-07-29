"""PDF geometry pass for the template validator.

Reads the manifest written by scripts/validate-templates.mjs and, for each
rendered PDF, reports:

  * every text span or vector drawing that falls outside the page box
  * the page count
  * which of the required non-Latin script samples are extractable

Measured with PyMuPDF against the rendered document, so this checks what the
PDF actually contains rather than what the renderer intended to draw. Text
extraction doubles as the ATS-parseability check: if PyMuPDF cannot read a
string out, neither can a résumé parser.

Emits JSON on stdout; the Node driver formats the report.
"""
import json
import os
import sys

import fitz

# A drawing may legitimately touch the sheet edge (the header band is
# full-bleed), so only flag geometry that leaves the page by more than a
# rounding error.
TOLERANCE_PT = 0.5


def analyse(pdf_path, samples):
    doc = fitz.open(pdf_path)
    page_box = None
    out_of_bounds = []
    extracted = []

    for pno, page in enumerate(doc):
        rect = page.rect
        if page_box is None:
            page_box = [rect.width, rect.height]

        def check(kind, bbox, detail):
            x0, y0, x1, y1 = bbox
            over = {}
            if x0 < -TOLERANCE_PT:
                over['left'] = round(-x0, 2)
            if y0 < -TOLERANCE_PT:
                over['top'] = round(-y0, 2)
            if x1 > rect.width + TOLERANCE_PT:
                over['right'] = round(x1 - rect.width, 2)
            if y1 > rect.height + TOLERANCE_PT:
                over['bottom'] = round(y1 - rect.height, 2)
            if over:
                out_of_bounds.append({
                    'page': pno + 1, 'kind': kind, 'over': over,
                    'bbox': [round(v, 2) for v in bbox], 'detail': detail,
                })

        # Text, span by span.
        for block in page.get_text('dict')['blocks']:
            for line in block.get('lines', []):
                for span in line.get('spans', []):
                    text = span['text']
                    if not text.strip():
                        continue
                    check('text', span['bbox'], text[:40])

        # Vector art: the filled rects behind tags, chips, pills, bands and rules.
        for drawing in page.get_drawings():
            r = drawing['rect']
            # Zero-area artefacts carry no ink.
            if r.width <= 0 and r.height <= 0:
                continue
            check('drawing', (r.x0, r.y0, r.x1, r.y1), drawing.get('type', ''))

        extracted.append(page.get_text())

    all_text = '\n'.join(extracted)
    # Normalise: the RTL placer emits per-token runs, so extracted Hebrew and
    # Arabic can carry directional marks and differ in inter-token spacing.
    flat = ''.join(all_text.split())
    scripts = {}
    for name, sample in samples.items():
        needle = ''.join(sample.split())
        scripts[name] = needle in flat or all(c in flat for c in needle if c.strip())

    result = {
        'pages': doc.page_count,
        'pageBox': page_box,
        'outOfBounds': out_of_bounds,
        'scripts': scripts,
        'textLength': len(all_text),
    }
    doc.close()
    return result


def main():
    manifest = json.load(open(sys.argv[1]))
    samples = manifest['scriptSamples']
    out = {}
    for entry in manifest['renders']:
        path = entry['pdf']
        if not os.path.exists(path):
            out[entry['id']] = {'error': f'missing pdf: {path}'}
            continue
        try:
            out[entry['id']] = analyse(path, samples)
        except Exception as exc:  # noqa: BLE001 - reported, not raised
            out[entry['id']] = {'error': f'{type(exc).__name__}: {exc}'}
    json.dump(out, sys.stdout)


if __name__ == '__main__':
    main()
