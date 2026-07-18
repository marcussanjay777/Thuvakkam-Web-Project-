import os
from playwright.sync_api import sync_playwright

BASE = "http://localhost:8000"
SHOTS = os.path.join(os.getcwd(), "test-shots")

with sync_playwright() as pw:
    browser = pw.chromium.launch()
    ctx = browser.new_context(viewport={"width": 390, "height": 844})

    # Mobile menu on homepage
    page = ctx.new_page()
    page.goto(BASE + "/website/index.html", wait_until="networkidle", timeout=20000)
    toggle = page.locator(".nav-toggle")
    toggle_visible = toggle.is_visible()
    # links hidden before opening
    links_hidden = not page.locator(".nav-links").is_visible()
    toggle.click()
    page.wait_for_timeout(500)
    links_shown = page.locator(".nav-links.open").is_visible()
    apply_clickable = page.locator(".nav-links.open a:has-text('Apply')").is_visible()
    page.screenshot(path=os.path.join(SHOTS, "home-mobile-menu-open.png"))
    print("Mobile hamburger visible:      ", "PASS" if toggle_visible else "FAIL")
    print("Nav links hidden until tapped: ", "PASS" if links_hidden else "FAIL")
    print("Menu opens on tap:             ", "PASS" if links_shown else "FAIL")
    print("Nav links reachable (Apply):   ", "PASS" if apply_clickable else "FAIL")
    page.close()

    # Donate cards stack on mobile
    page = ctx.new_page()
    page.goto(BASE + "/website/donate.html", wait_until="networkidle", timeout=20000)
    page.wait_for_timeout(400)
    cols = page.eval_on_selector(".donate-options",
        "el => getComputedStyle(el).gridTemplateColumns")
    single_col = len(cols.split()) == 1
    page.screenshot(path=os.path.join(SHOTS, "donate-mobile-fixed.png"), full_page=True)
    print("Donate cards stack (1 column): ", "PASS" if single_col else "FAIL - " + cols)
    page.close()

    browser.close()
