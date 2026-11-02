#!/usr/bin/env python3
"""Assemble index.html, style.css, script.js from src/. No dependencies.

Usage: python3 -I tools/build.py
"""
import pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"

PARTIALS = ["nav", "hero", "impact", "experience", "capabilities", "contact"]
CSS = ["tokens", "base", "nav", "hero", "impact", "experience", "capabilities", "contact", "palette", "print"]
JS = ["core", "nav", "hero", "impact", "experience", "capabilities", "contact", "palette"]


def read(p):
    return p.read_text() if p.exists() else ""


def main():
    head = read(SRC / "partials/head.html")
    body = "\n".join(read(SRC / f"partials/{n}.html") for n in PARTIALS if n != "nav" and n != "contact")
    nav = read(SRC / "partials/nav.html")
    contact = read(SRC / "partials/contact.html")
    palette = read(SRC / "partials/palette.html")
    footer = read(SRC / "partials/footer.html")

    scripts = "\n".join(f'<script src="js/{n}.js" defer></script>' for n in JS if (SRC / f"js/{n}.js").exists())
    html = f"""<!doctype html>
<html lang="en" class="no-js">
<head>
{head}
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
{nav}
<main id="main">
{body}
{contact}
</main>
{footer}
{palette}
{scripts}
</body>
</html>
"""
    (ROOT / "index.html").write_text(html)

    css_parts = []
    for n in CSS:
        t = read(SRC / f"css/{n}.css")
        if t:
            css_parts.append(f"/* ---- {n}.css ---- */\n{t.strip()}\n")
    (ROOT / "style.css").write_text("\n".join(css_parts))

    out_js = ROOT / "js"
    out_js.mkdir(exist_ok=True)
    for f in out_js.glob("*.js"):
        f.unlink()
    for n in JS:
        t = read(SRC / f"js/{n}.js")
        if t:
            (out_js / f"{n}.js").write_text(t)

    # Sanity: duplicate ids
    ids = re.findall(r'\sid="([^"]+)"', html)
    dups = sorted({i for i in ids if ids.count(i) > 1})
    if dups:
        print("WARNING duplicate ids:", dups, file=sys.stderr)
    print(f"built index.html ({len(html)//1024}KB), style.css, js/*.js")


if __name__ == "__main__":
    main()
