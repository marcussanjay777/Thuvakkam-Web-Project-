import os
from playwright.sync_api import sync_playwright

BASE = "http://localhost:8000"
SHOTS = os.path.join(os.getcwd(), "test-shots")
os.makedirs(SHOTS, exist_ok=True)

results = []
def log(name, ok, detail=""):
    results.append((name, ok, detail))
    print(("PASS " if ok else "FAIL ") + name + ((" - " + detail) if detail else ""))

with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(viewport={"width": 1280, "height": 900})

    # ---- Public pages: load + screenshot + collect console errors ----
    public_pages = [
        ("home", "/website/index.html"),
        ("donate", "/website/donate.html"),
        ("general-donate", "/website/general-donate.html"),
        ("funded-students", "/website/funded-students.html"),
        ("apply", "/website/apply.html"),
        ("sponsor", "/website/sponsor.html"),
    ]
    for name, path in public_pages:
        page = ctx.new_page()
        errors = []
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: errors.append(str(e)))
        try:
            page.goto(BASE + path, wait_until="networkidle", timeout=20000)
            page.screenshot(path=os.path.join(SHOTS, name + ".png"), full_page=True)
            real_errs = [e for e in errors if "favicon" not in e.lower()]
            log("page loads: " + name, True, "%d JS errors" % len(real_errs))
        except Exception as e:
            log("page loads: " + name, False, str(e)[:80])
        page.close()

    # ---- Funded students actually renders student cards ----
    page = ctx.new_page()
    page.goto(BASE + "/website/funded-students.html", wait_until="networkidle", timeout=20000)
    page.wait_for_timeout(2500)
    cards = page.locator("#sponsored-grid .card, #seeking-grid .card").count()
    log("funded students render from DB", cards > 0, "%d student cards shown" % cards)
    page.close()

    # ---- Helper: portal login in a FRESH isolated session ----
    def do_login(login_url, email, pw):
        c = browser.new_context(viewport={"width": 1280, "height": 900})
        page = c.new_page()
        dialog_msg = {"text": None}
        page.on("dialog", lambda d: (dialog_msg.__setitem__("text", d.message), d.dismiss()))
        page.goto(BASE + login_url, wait_until="networkidle", timeout=20000)
        page.fill("input[type=email]", email)
        page.fill("input[type=password]", pw)
        page.click("button:has-text('Sign in')")
        page.wait_for_timeout(5000)
        return page, c, page.url, dialog_msg["text"]

    # ---- Donor login (should reach dashboard) ----
    page, c, url, dlg = do_login("/donor-portal/index.html", "testdonor@sfs.com", "Donor@123")
    ok = "dashboard" in url
    if ok:
        page.wait_for_timeout(1500)
        page.screenshot(path=os.path.join(SHOTS, "donor-dashboard.png"), full_page=True)
    log("donor login -> dashboard", ok, "landed: " + url.split("/")[-1])
    c.close()

    # ---- Student login (should reach profile) ----
    page, c, url, dlg = do_login("/student-portal/index.html", "teststudent@sfs.com", "Student@123")
    ok = "profile" in url
    if ok:
        page.wait_for_timeout(1500)
        page.screenshot(path=os.path.join(SHOTS, "student-profile.png"), full_page=True)
    log("student login -> profile", ok, "landed: " + url.split("/")[-1])
    c.close()

    # ---- Admin login (should reach dashboard/portal) ----
    page, c, url, dlg = do_login("/portal/index.html", "admin@gmail.com", "admin")
    ok = "index.html" not in url
    if ok:
        page.wait_for_timeout(1500)
        page.screenshot(path=os.path.join(SHOTS, "admin-portal.png"), full_page=True)
    log("admin login -> portal", ok, "landed: " + url.split("/")[-1])
    c.close()

    # ---- SECURITY: donor must NOT get into the admin portal ----
    page, c, url, dlg = do_login("/portal/index.html", "testdonor@sfs.com", "Donor@123")
    blocked = ("index.html" in url) and (dlg is not None and "not authorised" in dlg.lower())
    log("donor BLOCKED from admin portal", blocked,
        ("alert: " + (dlg or "none")) if dlg else "no block")
    c.close()

    browser.close()

print("\n%d/%d checks passed" % (sum(1 for _, ok, _ in results if ok), len(results)))
