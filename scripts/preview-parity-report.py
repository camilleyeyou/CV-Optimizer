"""Diff the preview measurements against the exported PDFs.

Run scripts/verify-preview-parity.mjs first; this reads its output and reports
page-count parity plus line-level agreement per template.
"""
import json, os, re, difflib, sys
import fitz

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.environ.get('PARITY_OUT', os.path.join(REPO, '.parity-out'))
REG = json.load(open(os.path.join(REPO, 'template-registry.json')))
PX_PER_PT = 96 / 72

def canon(s):
    """Compare what is on each line, not how the glyphs are spaced.

    The PDF draws bullets and the LinkedIn 'in' mark as their own text runs
    while the preview uses CSS ::before and an SVG, and the RTL placer emits
    tighter spacing around Hebrew/Arabic runs. None of that changes where a
    line breaks, which is what parity is about.
    """
    s = s.replace('•', ' ')
    s = re.sub(r'\bin\s+LinkedIn\b', 'LinkedIn', s)
    # The bracket section-title style prefixes '# ' as text in the PDF and as a
    # CSS ::before in the preview (no text node to walk).
    s = re.sub(r'^#\s*', '', s.strip())
    # ToUnicode maps some Arabic ligature glyphs to control codepoints.
    s = re.sub(r'[\x00-\x1f\u200b-\u200f\u202a-\u202e]', '', s)
    s = re.sub(r'\s+', '', s)
    return s

def sidebar_width(tid):
    tpl = next(t for t in REG['templates'] if t['id'] == tid)
    if tpl['archetype'] != 'sidebar':
        return 0
    return REG['layout']['sidebar']['sidebarWidth']

def pdf_lines(path, sb_w):
    """Rendered lines per page. Two-column pages are read column by column so a
    sidebar line and a main-column line at the same height stay separate."""
    doc = fitz.open(path)
    pages = []
    for p in doc:
        runs = []
        for b in p.get_text('dict')['blocks']:
            for l in b.get('lines', []):
                txt = ''.join(s['text'] for s in l['spans'])
                if txt.strip():
                    runs.append((l['bbox'][0], l['bbox'][1], txt))
        cols = [[r for r in runs if r[0] < sb_w], [r for r in runs if r[0] >= sb_w]] if sb_w else [runs]
        page = []
        for col in cols:
            col.sort(key=lambda t: (round(t[1], 1), t[0]))
            merged, last_y = [], None
            for x, y, t in col:
                if last_y is not None and abs(y - last_y) <= 1.5:
                    merged[-1] += t
                else:
                    merged.append(t); last_y = y
            page += [m for m in merged if canon(m)]
        pages.append(page)
    return pages

def preview_lines(rep, sb_w):
    """The harness already reports column by column (aside first)."""
    return [x for x in rep.get('lines', []) if canon(x)]

def preview_pages(rep, sb_w):
    """Split the measured lines into pages using the rendered slice heights."""
    lines = rep.get('lines', []); tops = rep.get('lineTops', []); cols = rep.get('lineColumns', [])
    slices = rep.get('slices') or []
    if not slices:
        return [[x for x in lines if canon(x)]]
    bounds, acc = [], 0.0
    for h in slices:
        acc += h; bounds.append(acc)
    # Line tops are viewport coords; rebase on the first line of the main column.
    main_tops = [t for t, c in zip(tops, cols or ['main']*len(tops)) if c != 'aside']
    base = min(main_tops) if main_tops else (min(tops) if tops else 0)
    pages = [[] for _ in slices]
    for t, txt, c in zip(tops, lines, cols or ['main']*len(tops)):
        if not canon(txt):
            continue
        if c == 'aside':
            pages[0].append(txt); continue
        y = t - base
        idx = 0
        while idx < len(bounds) - 1 and y >= bounds[idx] - 0.5:
            idx += 1
        pages[idx].append(txt)
    return pages

reports = json.load(open(f'{OUT}/preview.json'))
rows = []
for r in reports:
    tid = r['id']
    sb = sidebar_width(tid)
    prev = preview_lines(r['preview'], sb)
    pages = pdf_lines(f'{OUT}/{tid}.pdf', sb)
    pdf_flat = [x for pg in pages for x in pg]
    prev_pages_lines = preview_pages(r['preview'], sb)
    per_page = []
    for i in range(max(len(pages), len(prev_pages_lines))):
        a_ = [canon(x) for x in (pages[i] if i < len(pages) else [])]
        b_ = [canon(x) for x in (prev_pages_lines[i] if i < len(prev_pages_lines) else [])]
        per_page.append(difflib.SequenceMatcher(None, a_, b_).ratio())

    a, b = [canon(x) for x in pdf_flat], [canon(x) for x in prev]
    sm = difflib.SequenceMatcher(None, a, b)
    rows.append(dict(id=tid, pdf_pages=len(pages), prev_pages=r['preview'].get('pageCount'),
                     pdf_lines=len(a), prev_lines=len(b), ratio=sm.ratio(),
                     badge=r['preview'].get('badge'), fonts=r['preview'].get('fonts', {}),
                     per_page=per_page,
                     diff=[(tag, pdf_flat[i1:i2], prev[j1:j2])
                           for tag, i1, i2, j1, j2 in sm.get_opcodes() if tag != 'equal']))

print(f'{"template":14} {"PDF pp":>6} {"prev pp":>7} {"PDF ln":>7} {"prev ln":>7} {"line match":>10}  fonts  badge')
print('-' * 88)
ok = 0
for r in rows:
    same = r['pdf_pages'] == r['prev_pages']; ok += same
    f = 'ok' if r['fonts'].get('loaded') else 'FALLBACK!'
    print(f'{r["id"]:14} {r["pdf_pages"]:6} {str(r["prev_pages"]):>7} {r["pdf_lines"]:7} '
          f'{r["prev_lines"]:7} {r["ratio"]*100:9.1f}%  {f:9} {r["badge"]}'
          f'{"" if same else "  <== PAGE MISMATCH"}')

print('\nper-page line match (does each sheet hold the same lines as that PDF page?)')
for r in rows:
    print(f'  {r["id"]:14} ' + '  '.join(f'p{i+1}:{v*100:5.1f}%' for i, v in enumerate(r['per_page'])))
worst_pp = min(min(r['per_page']) for r in rows)
print(f'  worst single page: {worst_pp*100:.1f}%')

print(f'\npage-count parity: {ok}/{len(rows)}')
print(f'mean line-match:   {sum(r["ratio"] for r in rows)/len(rows)*100:.1f}%')

target = sys.argv[1] if len(sys.argv) > 1 else min(rows, key=lambda r: r['ratio'])['id']
w = next(r for r in rows if r['id'] == target)
print(f'\n--- divergences for {w["id"]} ({w["ratio"]*100:.1f}%) ---')
for tag, a_, b_ in w['diff'][:10]:
    print(f'  [{tag}]')
    for x in a_[:3]: print(f'     PDF     : {x[:95]}')
    for x in b_[:3]: print(f'     preview : {x[:95]}')
