"""Writes the list of site files into sw.js so the site works offline.

Run it after adding, removing or changing files (the git pre-commit hook in
.githooks runs it for you):

    python tools/update-offline-list.py

The version is a hash of all file contents, so any change makes tablets
download a fresh copy.
"""
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SW = ROOT / 'sw.js'
SKIP_DIRS = {'.git', '.claude', '.githooks', 'tools'}
KEEP = {'.html', '.css', '.js', '.png', '.webmanifest', '.svg', '.json'}


def site_files():
    for p in sorted(ROOT.rglob('*')):
        rel = p.relative_to(ROOT)
        if not p.is_file() or rel.parts[0] in SKIP_DIRS or p == SW or p.suffix not in KEEP:
            continue
        yield rel.as_posix()


def main():
    files = list(site_files())
    digest = hashlib.sha256()
    for f in files:
        digest.update(f.encode())
        digest.update((ROOT / f).read_bytes())
    version = digest.hexdigest()[:10]

    entries = ['./'] + [f'./{f}' for f in files]
    listing = 'const FILES = ' + json.dumps(entries, indent=2) + ';'

    text = SW.read_text(encoding='utf-8')
    text = re.sub(r'// VERSION-START\n.*?// VERSION-END',
                  f"// VERSION-START\nconst CACHE = 'wonder-world-{version}';\n// VERSION-END", text, flags=re.S)
    text = re.sub(r'// FILES-START\n.*?// FILES-END',
                  lambda _: f'// FILES-START\n{listing}\n// FILES-END', text, flags=re.S)
    SW.write_text(text, encoding='utf-8', newline='\n')
    print(f'sw.js: {len(entries)} files, version {version}')


if __name__ == '__main__':
    main()
