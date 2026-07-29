#!/usr/bin/env python3
"""Re-encode the embedded PDF fonts as woff2 for the browser preview.

The preview must lay text out with byte-identical metrics to the exported PDF,
so it loads the *same* faces the PDF embeds. PDFKit/fontkit cannot subset a
woff2 (fontkit's glyf encoder overruns its buffer), so the TTF/OTF originals
stay canonical for the server and this script produces the web copies.

woff2 is a lossless container swap: ascender, descender, lineGap, unitsPerEm and
every advance width are preserved, which is what keeps line breaking identical.

    pip install fonttools brotli
    python3 server/src/fonts/build-webfonts.py            # rebuild all
    python3 server/src/fonts/build-webfonts.py --check    # verify, write nothing

Paths come from template-registry.json so this never drifts from the renderers.
"""
import argparse
import json
import os
import sys

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
REGISTRY = os.path.join(REPO, "template-registry.json")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--check", action="store_true", help="verify only, write nothing")
    args = ap.parse_args()

    with open(REGISTRY, encoding="utf-8") as fh:
        registry = json.load(fh)

    fonts = registry["fonts"]
    src_dir = os.path.join(REPO, fonts["sourceDir"])
    # webPath is a URL path ("/fonts"); the files live under the client's public dir.
    dst_dir = os.path.join(REPO, "client", "public", fonts["webPath"].lstrip("/"))
    ext = "." + fonts["webFormat"]

    files = sorted({f for fam in fonts["families"].values() for f in fam.values()})

    if not args.check:
        os.makedirs(dst_dir, exist_ok=True)
        try:
            from fontTools.ttLib import TTFont
        except ImportError:
            print("fonttools is required: pip install fonttools brotli", file=sys.stderr)
            return 1

    missing, built, total_in, total_out = [], 0, 0, 0
    for name in files:
        src = os.path.join(src_dir, name)
        dst = os.path.join(dst_dir, os.path.splitext(name)[0] + ext)
        if not os.path.exists(src):
            print(f"  MISSING SOURCE {name}", file=sys.stderr)
            missing.append(name)
            continue
        if args.check:
            if os.path.exists(dst):
                print(f"  ok      {os.path.basename(dst)} ({os.path.getsize(dst)//1024} KB)")
            else:
                print(f"  MISSING {os.path.basename(dst)}", file=sys.stderr)
                missing.append(os.path.basename(dst))
            continue

        font = TTFont(src)
        font.flavor = "woff2"
        font.save(dst)
        a, b = os.path.getsize(src), os.path.getsize(dst)
        total_in, total_out, built = total_in + a, total_out + b, built + 1
        print(f"  {name:28} {a//1024:6} KB -> {b//1024:6} KB")

    if missing:
        print(f"\n{len(missing)} file(s) missing.", file=sys.stderr)
        return 1
    if args.check:
        print("\nAll web fonts present.")
    else:
        print(f"\nBuilt {built} web font(s): {total_in/1048576:.1f} MB -> {total_out/1048576:.1f} MB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
