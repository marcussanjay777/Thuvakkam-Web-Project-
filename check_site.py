import os, re, urllib.request

BASE = "http://localhost:8000"
ROOT = os.getcwd()

html_files = []
for dirpath, dirs, files in os.walk(ROOT):
    if '.git' in dirpath or 'archive' in dirpath or 'node_modules' in dirpath:
        continue
    for f in files:
        if f.endswith('.html'):
            html_files.append(os.path.join(dirpath, f))

print("Found %d HTML pages\n" % len(html_files))

ref_re = re.compile(r'(?:href|src)\s*=\s*["\']([^"\']+)["\']')
broken_links = []
load_fail = []
checked_refs = 0

for hf in html_files:
    rel = os.path.relpath(hf, ROOT).replace(os.sep, '/')
    url = BASE + "/" + rel
    try:
        with urllib.request.urlopen(url, timeout=10) as r:
            code = r.getcode()
            body = r.read().decode('utf-8', 'ignore')
    except Exception as e:
        load_fail.append((rel, str(e)))
        continue
    if code != 200:
        load_fail.append((rel, "HTTP %s" % code))
        continue

    pagedir = os.path.dirname(hf)
    for ref in ref_re.findall(body):
        s = ref.strip()
        if s.startswith(('http://', 'https://', '#', 'mailto:', 'tel:', 'data:', 'javascript:')):
            continue
        s = s.split('#')[0].split('?')[0]
        if not s:
            continue
        target = os.path.normpath(os.path.join(pagedir, s))
        checked_refs += 1
        if not os.path.exists(target):
            broken_links.append((rel, ref))

print("Pages that failed to load: %d" % len(load_fail))
for f, e in load_fail:
    print("   FAIL  %s  ->  %s" % (f, e))

print("\nLocal references checked: %d" % checked_refs)
print("Broken references (file not found): %d" % len(broken_links))
for pg, ref in broken_links:
    print("   BROKEN  %s  ->  %s" % (pg, ref))

if not load_fail and not broken_links:
    print("\nALL PAGES LOAD AND ALL LINKS/IMAGES/SCRIPTS RESOLVE")
