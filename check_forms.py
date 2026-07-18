from playwright.sync_api import sync_playwright

BASE = "http://localhost:8000"

with sync_playwright() as pw:
    browser = pw.chromium.launch()
    ctx = browser.new_context()

    print("=" * 55)
    print("FORM VALIDATION")
    print("=" * 55)

    # 1. Apply form (uses novalidate + JS validation): empty submit -> error msg
    page = ctx.new_page()
    page.goto(BASE + "/website/apply.html", wait_until="networkidle", timeout=20000)
    page.click("button:has-text('Submit application')")
    page.wait_for_timeout(800)
    err = page.locator("#form-error")
    shown = err.is_visible() and err.inner_text().strip() != ""
    print("Apply form blocks empty submit + shows error:",
          "PASS" if shown else "FAIL", "-", (err.inner_text()[:60] if shown else ""))
    page.close()

    # 2. General donation: empty submit should NOT redirect (stays on page)
    page = ctx.new_page()
    page.goto(BASE + "/website/general-donate.html", wait_until="networkidle", timeout=20000)
    page.click("#submit-btn")
    page.wait_for_timeout(800)
    on_page = "general-donate.html" in page.url
    print("Donate form blocks empty submit:          ",
          "PASS" if on_page else "FAIL")
    page.close()

    # 3. General donation: invalid email format is rejected (native validation)
    page = ctx.new_page()
    page.goto(BASE + "/website/general-donate.html", wait_until="networkidle", timeout=20000)
    page.fill("#f-name", "Test Person")
    page.fill("#f-email", "not-an-email")
    page.fill("#f-amount", "500")
    page.click("#submit-btn")
    page.wait_for_timeout(800)
    valid = page.eval_on_selector("#f-email", "el => el.checkValidity()")
    on_page = "general-donate.html" in page.url
    print("Donate form rejects invalid email:        ",
          "PASS" if (not valid and on_page) else "FAIL")
    page.close()

    browser.close()
print("=" * 55)
