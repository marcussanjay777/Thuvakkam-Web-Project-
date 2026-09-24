"""Forgot-password flow for the student and donor portals.

Every request to Supabase is faked inside the browser, so this never touches the
real database and never sends an email. Run from the project's main folder while
the site is served on localhost:8000:

    python tests/check_password_reset.py
"""
import base64
import json
import os
import sys
import time
from urllib.parse import parse_qs, urlparse

from playwright.sync_api import sync_playwright

BASE = "http://localhost:8000"
SHOTS = os.path.join(os.getcwd(), "tests", "test-shots")
os.makedirs(SHOTS, exist_ok=True)

results = []


def check(name, ok, detail=""):
    results.append(bool(ok))
    print(("PASS  " if ok else "FAIL  ") + name + ("" if ok or not detail else "   -> " + str(detail)))


def b64(d):
    return base64.urlsafe_b64encode(json.dumps(d).encode()).decode().rstrip("=")


FAKE_JWT = (
    b64({"alg": "HS256", "typ": "JWT"}) + "."
    + b64({
        "sub": "00000000-0000-0000-0000-000000000001", "aud": "authenticated",
        "role": "authenticated", "email": "reset@example.com", "exp": int(time.time()) + 3600,
    })
    + ".fakesignature"
)

FAKE_USER = {
    "id": "00000000-0000-0000-0000-000000000001", "aud": "authenticated", "role": "authenticated",
    "email": "reset@example.com", "email_confirmed_at": "2026-01-01T00:00:00Z",
    "app_metadata": {}, "user_metadata": {},
    "created_at": "2026-01-01T00:00:00Z", "updated_at": "2026-01-01T00:00:00Z",
}

CORS = {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "*",
    "access-control-allow-methods": "*",
}

RECOVERY_HASH = "#access_token=%s&expires_in=3600&refresh_token=fakerefresh&token_type=bearer&type=recovery" % FAKE_JWT
INVITE_HASH = RECOVERY_HASH.replace("type=recovery", "type=invite")


def install_mock(page, recover_status=200):
    calls = {"recover": [], "user_put": []}

    def handler(route):
        req = route.request
        if req.method == "OPTIONS":
            return route.fulfill(status=204, headers=CORS)
        if "/auth/v1/recover" in req.url:
            calls["recover"].append({"url": req.url, "body": req.post_data})
            if recover_status == 200:
                return route.fulfill(status=200, headers=CORS, content_type="application/json", body="{}")
            return route.fulfill(
                status=recover_status, headers=CORS, content_type="application/json",
                body=json.dumps({
                    "code": recover_status, "error_code": "over_email_send_rate_limit",
                    "msg": "For security purposes, you can only request this once every 60 seconds",
                }),
            )
        if "/auth/v1/user" in req.url:
            if req.method == "PUT":
                calls["user_put"].append(req.post_data)
            return route.fulfill(status=200, headers=CORS, content_type="application/json", body=json.dumps(FAKE_USER))
        return route.fulfill(status=404, headers=CORS, content_type="application/json", body="{}")

    page.route("**/*.supabase.co/**", handler)
    return calls


def stub_page(page, glob):
    page.route(glob, lambda r: r.fulfill(status=200, content_type="text/html", body="<html><body>STUB PAGE</body></html>"))


def new_page(browser, width=1280, height=800):
    ctx = browser.new_context(viewport={"width": width, "height": height})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    return ctx, page, errors


def shown(page, sel, timeout=6000):
    try:
        page.locator(sel).wait_for(state="visible", timeout=timeout)
        return True
    except Exception:
        return False


def gone(page, sel, timeout=3000):
    try:
        page.locator(sel).wait_for(state="hidden", timeout=timeout)
        return True
    except Exception:
        return False


def text_of(page, sel):
    return page.inner_text(sel).strip()


def redirect_target(call):
    q = parse_qs(urlparse(call["url"]).query)
    return (q.get("redirect_to") or [""])[0]


def forgot_flow(browser, label, path, err_sel, ok_sel, expected_redirect):
    ctx, page, errors = new_page(browser)
    calls = install_mock(page)
    page.goto(BASE + path, wait_until="load")

    check(label + ": sign-in view is shown first", shown(page, "#login-view") and gone(page, "#forgot-view"))
    page.fill("#login-email", "kid@example.com")
    page.get_by_text("Forgot password?", exact=True).click()
    check(label + ": 'Forgot password?' opens the reset view", shown(page, "#forgot-view") and gone(page, "#login-view"))
    check(label + ": email typed on sign-in carries over", page.input_value("#forgot-email") == "kid@example.com")
    page.screenshot(path=os.path.join(SHOTS, "pwreset-%s-forgot-desktop.png" % label))

    page.fill("#forgot-email", "")
    page.click("#forgot-btn")
    check(label + ": empty email shows a message", shown(page, err_sel) and "enter your email" in text_of(page, err_sel).lower())
    check(label + ": empty email sends nothing", len(calls["recover"]) == 0)

    page.fill("#forgot-email", "kid@example.com")
    page.click("#forgot-btn")
    check(label + ": success message names the email", shown(page, ok_sel) and "kid@example.com" in text_of(page, ok_sel), text_of(page, ok_sel) if shown(page, ok_sel, 500) else "not shown")
    check(label + ": form is hidden after sending", gone(page, "#forgot-fields") and gone(page, "#forgot-btn"))
    check(label + ": exactly one reset request was made", len(calls["recover"]) == 1, len(calls["recover"]))
    if calls["recover"]:
        check(label + ": request carries the email", "kid@example.com" in (calls["recover"][0]["body"] or ""))
        check(label + ": emailed link points to " + expected_redirect, redirect_target(calls["recover"][0]).endswith(expected_redirect), redirect_target(calls["recover"][0]))

    page.get_by_text("Back to sign in").click()
    check(label + ": 'Back to sign in' returns to sign-in", shown(page, "#login-view") and gone(page, "#forgot-view"))
    page.get_by_text("Forgot password?", exact=True).click()
    check(label + ": reopening shows a fresh form", shown(page, "#forgot-fields") and shown(page, "#forgot-btn") and gone(page, ok_sel))
    check(label + ": no page errors", not errors, errors)
    ctx.close()

    ctx, page, errors = new_page(browser)
    install_mock(page, recover_status=429)
    page.goto(BASE + path, wait_until="load")
    page.get_by_text("Forgot password?", exact=True).click()
    page.fill("#forgot-email", "kid@example.com")
    page.click("#forgot-btn")
    check(label + ": too-many-requests gives a friendly message", shown(page, err_sel) and "too many" in text_of(page, err_sel).lower(), text_of(page, err_sel) if shown(page, err_sel, 500) else "not shown")
    check(label + ": button usable again after an error", page.is_enabled("#forgot-btn") and shown(page, "#forgot-btn"))
    ctx.close()

    ctx, page, errors = new_page(browser, 390, 844)
    install_mock(page)
    page.goto(BASE + path, wait_until="load")
    page.get_by_text("Forgot password?", exact=True).click()
    shown(page, "#forgot-view")
    page.screenshot(path=os.path.join(SHOTS, "pwreset-%s-forgot-mobile.png" % label), full_page=True)
    overflow = page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth")
    check(label + ": no sideways scrolling on a phone", not overflow)
    ctx.close()


def password_page_flow(browser, label, page_path, stub_glob, err_sel, ok_sel, fields_sel, expect_title, expect_btn, expect_done, submit_sel):
    ctx, page, errors = new_page(browser)
    calls = install_mock(page)
    stub_page(page, stub_glob)
    page.goto(BASE + page_path + RECOVERY_HASH, wait_until="load")

    check(label + ": reset link shows the password form", shown(page, fields_sel))
    if expect_title:
        check(label + ": heading reads '" + expect_title[0] + "'", text_of(page, "#page-title") == expect_title[0], text_of(page, "#page-title"))
    check(label + ": button reads '" + expect_btn + "'", text_of(page, submit_sel) == expect_btn, text_of(page, submit_sel))
    page.screenshot(path=os.path.join(SHOTS, "pwreset-%s-newpassword-desktop.png" % label))

    page.fill("#new-password", "short")
    page.fill("#confirm-password", "short")
    page.click(submit_sel)
    check(label + ": short password is refused", shown(page, err_sel) and "at least 8" in text_of(page, err_sel))

    page.fill("#new-password", "LongEnough1")
    page.fill("#confirm-password", "Different99")
    page.click(submit_sel)
    check(label + ": mismatched passwords are refused", shown(page, err_sel) and "do not match" in text_of(page, err_sel))
    check(label + ": nothing saved yet", len(calls["user_put"]) == 0)

    page.fill("#confirm-password", "LongEnough1")
    page.click(submit_sel)
    check(label + ": success message shown", shown(page, ok_sel) and expect_done in text_of(page, ok_sel), text_of(page, ok_sel) if shown(page, ok_sel, 500) else "not shown")
    check(label + ": new password was sent to Supabase", len(calls["user_put"]) == 1 and "LongEnough1" in (calls["user_put"][0] or ""), calls["user_put"])
    try:
        page.wait_for_url(stub_glob, timeout=5000)
        went = True
    except Exception:
        went = False
    check(label + ": then moves on to the portal", went)
    check(label + ": no page errors", not errors, errors)
    ctx.close()

    ctx, page, errors = new_page(browser)
    install_mock(page)
    page.goto(BASE + page_path, wait_until="load")
    check(label + ": opening the page with no link shows an 'expired' message", shown(page, err_sel) and "expired" in text_of(page, err_sel).lower())
    check(label + ": the form is hidden when there is no valid link", gone(page, fields_sel))
    check(label + ": there is a way back to sign in", page.get_by_text("Back to sign in").first.is_visible())
    page.screenshot(path=os.path.join(SHOTS, "pwreset-%s-expired-desktop.png" % label))
    ctx.close()

    ctx, page, errors = new_page(browser, 390, 844)
    install_mock(page)
    page.goto(BASE + page_path + RECOVERY_HASH, wait_until="load")
    shown(page, fields_sel)
    page.screenshot(path=os.path.join(SHOTS, "pwreset-%s-newpassword-mobile.png" % label), full_page=True)
    overflow = page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth")
    check(label + ": no sideways scrolling on a phone", not overflow)
    ctx.close()


with sync_playwright() as pw:
    browser = pw.chromium.launch()

    forgot_flow(browser, "student", "/student-portal/index.html", "#login-error", "#login-success", "/student-portal/set-password.html")
    forgot_flow(browser, "donor", "/donor-portal/index.html", "#forgot-error", "#forgot-success", "/donor-portal/reset-password.html")

    password_page_flow(
        browser, "student", "/student-portal/set-password.html", "**/student-portal/profile.html",
        "#login-error", "#login-success", "#form-fields",
        ("Choose a New Password",), "Save new password", "Password updated", "#submit-btn",
    )
    password_page_flow(
        browser, "donor", "/donor-portal/reset-password.html", "**/donor-portal/index.html",
        "#reset-error", "#reset-success", "#reset-fields",
        None, "Save new password", "Password updated", "#submit-btn",
    )

    # An admin invite link (type=invite) must keep the original welcome wording.
    ctx, page, errors = new_page(browser)
    install_mock(page)
    page.goto(BASE + "/student-portal/set-password.html" + INVITE_HASH, wait_until="load")
    check("student invite link: form still appears", shown(page, "#form-fields"))
    check("student invite link: keeps the 'Set Your Password' heading", text_of(page, "#page-title") == "Set Your Password", text_of(page, "#page-title"))
    check("student invite link: keeps the 'Set password & continue' button", text_of(page, "#submit-btn") == "Set password & continue", text_of(page, "#submit-btn"))
    ctx.close()

    # Admin sign-in no longer shows a dead "Forgot password?" link.
    ctx, page, errors = new_page(browser)
    install_mock(page)
    page.goto(BASE + "/portal/index.html", wait_until="load")
    check("admin sign-in: no 'Forgot password?' link", page.get_by_text("Forgot password?", exact=True).count() == 0)
    ctx.close()

    browser.close()

passed = sum(results)
print("\n%d of %d checks passed" % (passed, len(results)))
sys.exit(0 if passed == len(results) else 1)
