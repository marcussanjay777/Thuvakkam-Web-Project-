"""Private document storage + admin-panel safety.

    python tests/check_private_documents.py           # works before OR after the SQL is run
    python tests/check_private_documents.py --after   # also checks the lock-down itself

Run from the project's main folder while the site is served on localhost:8000.
The --after checks upload tiny throwaway files (named zz-probe) and delete them again.
"""
import base64
import json
import sys
import time
import urllib.error
import urllib.request
import uuid

from playwright.sync_api import sync_playwright
from local_settings import ADMIN_EMAIL, ADMIN_PASSWORD  # private file, not in git

BASE = "http://localhost:8000"
SUPA = "https://vftexybohuaxngyhwjts.supabase.co"
ANON = "sb_publishable_vO20BiWyS_VIkhU2DDmw3g_BoGBeCdq"
SANJAY_ID = "2ff6c073-fad8-441a-b045-4df44ddcc394"
PNG_B64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
AFTER = "--after" in sys.argv

results = []


def check(name, ok, detail=""):
    results.append(bool(ok))
    print(("PASS  " if ok else "FAIL  ") + name + ("" if ok or not detail else "   -> " + str(detail)))


def login(browser, url, email, pw):
    ctx = browser.new_context(viewport={"width": 1400, "height": 950}, accept_downloads=True)
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e).split("\n")[0][:120]))
    page.on("dialog", lambda d: d.dismiss())
    page.goto(BASE + url, wait_until="networkidle", timeout=25000)
    page.fill("input[type=email]", email)
    page.fill("input[type=password]", pw)
    page.click("button:has-text('Sign in')")
    page.wait_for_timeout(4500)
    return ctx, page, errors


SIGN_JS = """
async (path) => {
  const { data, error } = await sb.storage.from('student-documents').createSignedUrl(path, 120);
  return { url: data && data.signedUrl, err: error && error.message };
}
"""

FIND_FILE_JS = """
async () => {
  const b = sb.storage.from('student-documents');
  const top = await b.list('', { limit: 100 });
  for (const item of (top.data || [])) {
    if (item.id === null && item.name !== 'student-proofs') {
      const inner = await b.list(item.name, { limit: 5 });
      const f = (inner.data || []).find(x => x.id);
      if (f) return item.name + '/' + f.name;
    }
  }
  return null;
}
"""

UPLOAD_JS = """
async ([path, b64]) => {
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const { error } = await sb.storage.from('student-documents')
    .upload(path, new Blob([bytes], { type: 'image/png' }), { upsert: false });
  return error ? error.message : null;
}
"""

REMOVE_JS = """
async (paths) => {
  const { error } = await sb.storage.from('student-documents').remove(paths);
  return error ? error.message : null;
}
"""


def can_sign_and_fetch(page, path):
    r = page.evaluate(SIGN_JS, path)
    if not r["url"]:
        return False, r["err"]
    resp = page.request.get(r["url"])
    return resp.status == 200, "HTTP %s" % resp.status


def public_link(path):
    return "%s/storage/v1/object/public/student-documents/%s" % (SUPA, path)


HOSTILE_STUDENT = {
    "id": "00000000-0000-0000-0000-00000000aaaa", "name": '<img src=x onerror="window.__fired=true">EVIL',
    "initials": '<b onmouseover="window.__fired=true">X</b>', "school": '"><img src=y onerror="window.__fired=true">',
    "district": "D", "class": "10", "status": "pending", "cycle_year": 2026, "applied_on": "2026-09-01",
    "address": '<img src=a onerror="window.__fired=true">', "family_about": '<img src=b onerror="window.__fired=true">',
    "awards": '<img src=c onerror="window.__fired=true">', "school_10th": '<img src=d onerror="window.__fired=true">',
    "notes": '</textarea><img src=e onerror="window.__fired=true">',
    "rejection_reason": '</textarea><img src=f onerror="window.__fired=true">',
    "outcome": '<img src=g onerror="window.__fired=true">', "email": "e@example.com",
}
HOSTILE_DOC = [{
    "id": "11111111-1111-1111-1111-111111111111", "student_id": HOSTILE_STUDENT["id"], "student_name": "x",
    "type": '<img src=h onerror="window.__fired=true">', "status": "pending", "uploaded_at": "2026-09-01",
    "file_url": "javascript:window.__fired=true",
}]
CORS = {"access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*"}


def mock_hostile_records(page):
    def handler(route):
        req = route.request
        if req.method == "OPTIONS":
            return route.fulfill(status=204, headers=CORS)
        url = req.url
        if "/rest/v1/students" in url and "id=eq.00000000-0000-0000-0000-00000000aaaa" in url:
            return route.fulfill(status=200, headers=CORS, content_type="application/json", body=json.dumps(HOSTILE_STUDENT))
        if "/rest/v1/documents" in url and "student_id=eq.00000000-0000-0000-0000-00000000aaaa" in url:
            return route.fulfill(status=200, headers=CORS, content_type="application/json", body=json.dumps(HOSTILE_DOC))
        return route.continue_()
    page.route("**/rest/v1/**", handler)


with sync_playwright() as pw:
    browser = pw.chromium.launch()

    # ── ADMIN ────────────────────────────────────────────────────────────────
    ctx, page, errors = login(browser, "/portal/index.html", ADMIN_EMAIL, ADMIN_PASSWORD)
    page.goto(BASE + "/portal/documents.html", wait_until="networkidle", timeout=25000)
    page.wait_for_timeout(2500)
    check("admin: documents page has no script errors", not errors, errors)

    for bad in ["javascript:alert(1)", "https://evil.example/storage/v1/object/public/student-documents/x.png",
                SUPA + "/storage/v1/object/public/other-bucket/x.png", ""]:
        r = page.evaluate("async (u) => { try { await signedDocUrl(u); return 'ALLOWED'; } catch (e) { return e.message; } }", bad)
        check("admin: refuses a link that is not ours (%r)" % bad[:40], r == "This file link is not valid.", r)

    existing = page.evaluate(FIND_FILE_JS)
    check("admin: can list files in the bucket", existing is not None, existing)
    if existing:
        ok, detail = can_sign_and_fetch(page, existing)
        check("admin: signed link downloads a real file", ok, detail)

        page.evaluate("(u) => openDocModal({ student_name: 'Test', type: 'Probe', file_url: u })", public_link(existing))
        try:
            page.locator("#doc-modal-body img").wait_for(state="visible", timeout=8000)
            src = page.locator("#doc-modal-body img").get_attribute("src")
            page.wait_for_timeout(1200)
            loaded = page.evaluate("document.querySelector('#doc-modal-body img').naturalWidth > 0")
            check("admin: document popup shows the image via a signed link", "/object/sign/" in src and loaded, src[:90])
        except Exception as e:
            check("admin: document popup shows the image via a signed link", False, str(e)[:100])

        with page.expect_download(timeout=10000) as dl:
            page.evaluate("(u) => downloadStoredFile(u)", public_link(existing))
        check("admin: Download button delivers a file", dl.value.suggested_filename != "", dl.value.suggested_filename)

    page.evaluate("() => openDocModal({ student_name: 'T', type: 'X', file_url: 'javascript:alert(1)' })")
    page.wait_for_timeout(600)
    check("admin: a hostile file link shows a message, not a script",
          "not valid" in page.inner_text("#doc-modal-body"), page.inner_text("#doc-modal-body")[:80])
    ctx.close()

    # ── ADMIN PROFILE PANEL vs hostile applicant data ────────────────────────
    ctx, page, errors = login(browser, "/portal/index.html", ADMIN_EMAIL, ADMIN_PASSWORD)
    page.goto(BASE + "/portal/applications.html", wait_until="networkidle", timeout=25000)
    page.wait_for_timeout(2000)
    mock_hostile_records(page)
    page.evaluate("window.__fired = false")
    page.evaluate("(id) => openProfile(id, 'rejected')", HOSTILE_STUDENT["id"])
    page.wait_for_timeout(1500)
    fired = page.evaluate("window.__fired")
    panel = page.inner_text("#profile-panel") if page.locator("#profile-panel").count() else ""
    check("profile panel: hostile applicant data does not run", not fired and "EVIL" in panel, "fired=%s" % fired)
    check("profile panel: hostile text is shown as plain text", "onerror" in panel, panel[:120])
    page.click("button.pp-tab[data-tab='documents']")
    page.evaluate("() => viewDocumentById('11111111-1111-1111-1111-111111111111')")
    page.wait_for_timeout(900)
    check("profile panel: a hostile document link is refused",
          "not valid" in page.inner_text("#doc-view-body") and not page.evaluate("window.__fired"))
    check("profile panel: the notes box holds the text, it does not break out", page.evaluate("window.__fired") is False)
    page.evaluate("() => closeDocument()")

    try:
        with ctx.expect_page(timeout=8000) as popup_info:
            page.evaluate("(id) => printProfile(id)", HOSTILE_STUDENT["id"])
        popup = popup_info.value
        popup.wait_for_timeout(1200)
        pfired = popup.evaluate("window.__fired === true")
        check("print view: hostile applicant data does not run", not pfired and "EVIL" in popup.inner_text("body"), "fired=%s" % pfired)
    except Exception as e:
        check("print view: hostile applicant data does not run", False, str(e)[:100])
    check("profile + print: no script errors", not errors, errors)
    ctx.close()

    # ── STUDENT ──────────────────────────────────────────────────────────────
    ctx, page, errors = login(browser, "/student-portal/index.html", "teststudent@sfs.com", "Student@123")
    check("student: signed in", "profile.html" in page.url, page.url)
    r = page.evaluate("async () => { try { await signedProofUrl('javascript:alert(1)'); return 'ALLOWED'; } catch (e) { return e.message; } }")
    check("student: refuses a link that is not ours", r == "This file link is not valid.", r)
    check("student: page has no script errors", not errors, errors)
    ctx.close()

    # ── DONOR ────────────────────────────────────────────────────────────────
    ctx, page, errors = login(browser, "/donor-portal/index.html", "testdonor@sfs.com", "Donor@123")
    check("donor: signed in", "dashboard.html" in page.url, page.url)
    r = page.evaluate("async () => { try { await signedProofUrl('javascript:alert(1)'); return 'ALLOWED'; } catch (e) { return e.message; } }")
    check("donor: refuses a link that is not ours", r == "This file link is not valid.", r)
    check("donor: page has no script errors", not errors, errors)
    ctx.close()

    # ── LOCK-DOWN (only meaningful once the SQL has been run) ────────────────
    if AFTER:
        run = uuid.uuid4().hex[:8]
        f_doc = "%s/zz-probe-doc-%s.png" % (uuid.uuid4(), run)
        f_other = "student-proofs/%s/zz-probe-%s.png" % (uuid.uuid4(), run)
        f_sanjay = "student-proofs/%s/zz-probe-%s.png" % (SANJAY_ID, run)
        f_anon = "zz-probe-anon/%s.png" % run
        fixtures = [f_doc, f_other, f_sanjay]

        actx, apage, _ = login(browser, "/portal/documents.html", ADMIN_EMAIL, ADMIN_PASSWORD)
        apage.goto(BASE + "/portal/documents.html", wait_until="networkidle", timeout=25000)
        apage.wait_for_timeout(1500)
        for f in fixtures:
            err = apage.evaluate(UPLOAD_JS, [f, PNG_B64])
            check("setup: staff can upload test file %s" % f.split("/")[-1][:24], err is None, err)

        for f, label in [(f_doc, "an application document"), (f_other, "another student's proof"), (f_sanjay, "a student's proof")]:
            ok, d = can_sign_and_fetch(apage, f)
            check("admin: can open %s" % label, ok, d)

        sctx, spage, _ = login(browser, "/student-portal/index.html", "teststudent@sfs.com", "Student@123")
        ok, d = can_sign_and_fetch(spage, f_sanjay)
        check("student: can open their OWN proof file", ok, d)
        ok, d = can_sign_and_fetch(spage, f_other)
        check("student: CANNOT open another student's proof", not ok, d)
        ok, d = can_sign_and_fetch(spage, f_doc)
        check("student: CANNOT open an application document", not ok, d)
        sctx.close()

        dctx, dpage, _ = login(browser, "/donor-portal/index.html", "testdonor@sfs.com", "Donor@123")
        ok, d = can_sign_and_fetch(dpage, f_sanjay)
        check("donor: can open the MATCHED student's proof", ok, d)
        ok, d = can_sign_and_fetch(dpage, f_other)
        check("donor: CANNOT open an unmatched student's proof", not ok, d)
        ok, d = can_sign_and_fetch(dpage, f_doc)
        check("donor: CANNOT open an application document", not ok, d)
        dctx.close()

        def http(method, url, body=None, headers=None):
            req = urllib.request.Request(url, data=body, method=method, headers=headers or {})
            try:
                with urllib.request.urlopen(req, timeout=20) as r:
                    return r.status, r.read()
            except urllib.error.HTTPError as e:
                return e.code, e.read()

        H = {"apikey": ANON, "Authorization": "Bearer " + ANON}
        status, body = http("POST", SUPA + "/storage/v1/object/list/student-documents",
                            json.dumps({"prefix": "", "limit": 100}).encode(), dict(H, **{"Content-Type": "application/json"}))
        names = json.loads(body) if status == 200 else []
        check("stranger: cannot list the documents bucket", status != 200 or len(names) == 0, "%s, %d entries" % (status, len(names)))
        status, _ = http("GET", SUPA + "/storage/v1/object/public/student-documents/" + f_doc)
        check("stranger: old public link no longer works", status != 200, status)
        status, _ = http("GET", SUPA + "/storage/v1/object/authenticated/student-documents/" + f_doc, headers=H)
        check("stranger: cannot fetch with just the public key", status != 200, status)

        png = base64.b64decode(PNG_B64)
        status, body = http("POST", SUPA + "/storage/v1/object/student-documents/" + f_anon, png,
                            dict(H, **{"Content-Type": "image/png", "x-upsert": "false"}))
        check("stranger: can still UPLOAD (the public apply form needs this)", status == 200, "%s %s" % (status, body[:120]))
        fixtures.append(f_anon)

        err = apage.evaluate(REMOVE_JS, fixtures)
        check("cleanup: staff removed every test file", err is None, err)
        actx.close()

    browser.close()

print("\n%d of %d checks passed" % (sum(results), len(results)))
sys.exit(0 if all(results) else 1)
