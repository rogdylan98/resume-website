#!/usr/bin/env python3
"""Screenshot the built site in capture mode with headless Chrome (no deps).

Usage:
  python3 -I tools/shot.py <section|full> [--width 1440] [--theme light|dark] [--out path.png]
Sections: hero, impact, experience, capabilities, contact, full
Serves the repo over a local http server so relative assets load.
"""
import argparse, functools, http.server, pathlib, re, socketserver, subprocess, threading, tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"


WRAP = """<!doctype html><html><body style="margin:0;background:#888">
<iframe id=f style="border:0;display:block;margin-left:{ml}px;width:{w}px;height:844px" src="{src}"></iframe>
<script>
const f=document.getElementById('f');
f.onload=()=>setTimeout(()=>{{const d=f.contentDocument.documentElement;
const h=Math.max(d.scrollHeight,f.contentDocument.body.scrollHeight);
f.style.height=h+'px';document.documentElement.setAttribute('data-capture-height',h);
document.documentElement.setAttribute('data-sw',d.scrollWidth);}},1500);
</script></body></html>"""
NARROW_HOST = 600  # headless Chrome cannot lay out windows narrower than ~500px


def serve(wrap_html=None):
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a, **k):
            pass

        def do_GET(self):
            if wrap_html and self.path.startswith("/__wrap"):
                b = wrap_html.encode()
                self.send_response(200)
                self.send_header("Content-Type", "text/html")
                self.send_header("Content-Length", str(len(b)))
                self.end_headers()
                self.wfile.write(b)
            else:
                super().do_GET()
    handler = functools.partial(Quiet, directory=str(ROOT))
    httpd = socketserver.TCPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def chrome(args, timeout=60):
    prof = tempfile.mkdtemp(prefix="shot-")
    base = [CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
            "--force-device-scale-factor=1", f"--user-data-dir={prof}",
            "--virtual-time-budget=4000", "--run-all-compositor-stages-before-draw"]
    return subprocess.run(base + args, capture_output=True, text=True, timeout=timeout)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("section")
    ap.add_argument("--width", type=int, default=1440)
    ap.add_argument("--theme", default="light")
    ap.add_argument("--out")
    a = ap.parse_args()

    q = "capture" + ("" if a.section == "full" else f"&only={a.section}") + f"&theme={a.theme}"
    narrow = a.width < NARROW_HOST
    page = f"index.html?{q}"
    httpd = serve(WRAP.format(ml=(NARROW_HOST - a.width) // 2, w=a.width, src=page) if narrow else None)
    port = httpd.server_address[1]
    url = f"http://127.0.0.1:{port}/" + ("__wrap" if narrow else page)
    win_w = NARROW_HOST if narrow else a.width

    dom = chrome([f"--window-size={win_w},1000", "--dump-dom", url]).stdout
    m = re.search(r'data-capture-height="(\d+)"', dom)
    h = int(m.group(1)) if m else 3000
    h = min(h, 16000)
    sw = re.search(r'data-sw="(\d+)"', dom)
    if sw and int(sw.group(1)) > a.width:
        print(f"WARNING: horizontal overflow, scrollWidth={sw.group(1)} > {a.width}")

    out = pathlib.Path(a.out or ROOT / f"tools/shots/{a.section}-{a.width}-{a.theme}.png")
    out.parent.mkdir(parents=True, exist_ok=True)
    chrome([f"--window-size={win_w},{h}", f"--screenshot={out}", url])
    if narrow:
        subprocess.run(["sips", "-c", str(h), str(a.width), str(out), "--out", str(out)], capture_output=True)
    httpd.shutdown()
    print(f"{out}  ({a.width}x{h})")


if __name__ == "__main__":
    main()
