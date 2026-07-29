# Embedded PDF fonts

These faces are committed on purpose. `pdfService` embeds them via PDFKit's
`registerFont()` so resume exports render every script the product supports.

## Why

PDFKit's built-in Helvetica/Times are **Latin-1 only**. Any codepoint outside
that range is dropped *silently* — `widthOfString()` returns `0` and no error is
thrown. Before this set was added, Polish, Turkish, Greek, Cyrillic, Hebrew,
Arabic and CJK resumes exported blank or mangled, which made the premium
translate feature produce unusable PDFs for its own target languages.

## Coverage

| File(s) | Scripts |
| --- | --- |
| `NotoSans-{Regular,Bold,Italic,BoldItalic}.ttf` | Latin, Latin Extended (Polish, Turkish, Vietnamese), Greek, Cyrillic |
| `NotoSerif-{Regular,Bold,Italic,BoldItalic}.ttf` | as above, for the serif templates (professional, executive, elegant, academic) |
| `NotoSansHebrew-{Regular,Bold}.ttf` | Hebrew |
| `NotoSansArabic-{Regular,Bold}.ttf` | Arabic (contextual joining via fontkit's OpenType shaping) |
| `NotoSansTC-{Regular,Bold}.otf` | CJK — Traditional Chinese, plus most Japanese kanji |

Hebrew, Arabic and CJK ship sans-only. Serif templates fall back to the sans
face for those scripts rather than losing the glyphs. Italic degrades to
regular for the same reason.

## Size

The directory is ~17 MB, dominated by the two CJK faces (~5.5 MB each). This
does **not** flow through to output: PDFKit subsets on embed, so a CJK resume
adds only the glyphs it actually uses — a typical export is 25–65 KB total.

## Known gaps

- **Korean Hangul and Simplified-only Hanzi** are not covered by the TC face.
  They fall back to the Latin face and render as `.notdef` boxes. Adding
  `NotoSansSC` / `NotoSansKR` is a follow-up; each is another 10–18 MB.
- **Bidi is partial.** `fontService` reorders tokens per line and handles RTL
  runs with Latin/numeric text embedded, which covers what resumes contain. It
  is not a full Unicode Bidirectional Algorithm implementation — deeply nested
  directional embeddings are not resolved.

## Web copies (preview parity)

The live preview must wrap lines exactly like the export, so it loads **the same
faces**, re-encoded as woff2 into `client/public/fonts/`. woff2 is a lossless
container swap: ascender, descender, lineGap, unitsPerEm and every advance width
are preserved, which is what keeps line breaking identical.

The originals stay canonical for the server because PDFKit cannot subset a woff2
(fontkit's glyf encoder overruns its buffer), so both representations are kept.

```bash
pip install fonttools brotli
python3 server/src/fonts/build-webfonts.py --check   # verify the web copies exist
python3 server/src/fonts/build-webfonts.py           # rebuild them
```

The browser only downloads a face when text actually uses it, so a Latin resume
never pulls the ~4 MB CJK file. Paths and the format come from
`template-registry.json` (`fonts.webPath`, `fonts.webFormat`).

## Maintenance

```bash
node server/src/fonts/fetch-fonts.js --check   # verify all files present
node server/src/fonts/fetch-fonts.js           # download anything missing
node server/src/fonts/fetch-fonts.js --force   # re-download everything
```

## Licence

All faces are [SIL Open Font License 1.1](https://openfontlicense.org/), from
the [Noto](https://fonts.google.com/noto) project. The OFL permits bundling and
redistribution, including in commercial products, provided the fonts are not
sold on their own and the licence travels with them.
