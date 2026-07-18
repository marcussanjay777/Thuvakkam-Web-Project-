import os
from playwright.sync_api import sync_playwright

BASE = "http://localhost:8000"
SHOTS = os.path.join(os.getcwd(), "test-shots")
os.makedirs(SHOTS, exist_ok=True)

pages = [
    ("home", "/website/index.html"),
    ("donate", "/website/donate.html"),
    ("general-donate", "/website/general-donate.html"),
    ("funded-students", "/website/funded-students.html"),
    ("apply", "/website/apply.html"),
    ("sponsor", "/website/sponsor.html"),
    ("donor-login", "/donor-portal/index.html"),
    ("student-login", "/student-portal/index.html"),
    ("admin-login", "/portal/index.html"),
]

def test_engine(pw, engine_name, launcher):
    browser = launcher.launch()
    ctx = browser.new_context()
    total_errors = 0
    failed = []
    for name, path in pages:
        page = ctx.new_page()
        errs = []
        page.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: errs.append(str(e)))
        try:
            page.goto(BASE + path, wait_until="networkidle", timeout=25000)
        except Exception as e:
            failed.append(name)
        real = [e for e in errs if "favicon" not in e.lower()]
        total_errors += len(real)
        page.close()
    browser.close()
    status = "PASS" if not failed and total_errors == 0 else "ISSUES"
    print("  %-10s %s  (%d/%d pages ok, %d JS errors)" %
          (engine_name, status, len(pages) - len(failed), len(pages), total_errors))
    return not failed and total_errors == 0

print("=" * 55)
print("CROSS-BROWSER  (all 9 key pages per engine)")
print("=" * 55)
with sync_playwright() as pw:
    test_engine(pw, "Chromium", pw.chromium)   # Chrome + Edge engine
    test_engine(pw, "Firefox", pw.firefox)      # Firefox engine
    test_engine(pw, "WebKit", pw.webkit)        # Safari engine

    print("\n" + "=" * 55)
    print("RESPONSIVE  (screenshots at 3 screen sizes)")
    print("=" * 55)
    sizes = [("mobile", 390, 844), ("tablet", 768, 1024), ("desktop", 1280, 900)]
    browser = pw.chromium.launch()
    for label, w, h in sizes:
        ctx = browser.new_context(viewport={"width": w, "height": h})
        page = ctx.new_page()
        page.goto(BASE + "/website/index.html", wait_until="networkidle", timeout=20000)
        page.screenshot(path=os.path.join(SHOTS, "home-" + label + ".png"))
        page.goto(BASE + "/website/donate.html", wait_until="networkidle", timeout=20000)
        page.screenshot(path=os.path.join(SHOTS, "donate-" + label + ".png"))
        ctx.close()
        print("  %-8s %dx%d  screenshots saved" % (label, w, h))
    browser.close()
print("\n" + "=" * 55)
