# Thuvakkam SFS — Test Report

**Date:** 18 July 2026
**Tested by:** Local automated testing (site served on `localhost:8000`, backend on live Supabase)
**Result:** All checks passing after fixing 1 critical security issue found during testing.

---

## 1. Pages & links (static check)

Served the whole site locally and checked every page.

- **27 HTML pages** — all load with **HTTP 200** (no missing pages)
- **425 internal links / images / scripts checked** — all resolve to real files (no broken links or missing images)
- Only 2 flagged items were false positives (`${u.proof_url}` JavaScript variables, filled in at runtime)

## 2. Browser tests (real Chromium, via Playwright)

| Check | Result |
|-------|--------|
| Home page renders, 0 JS errors | PASS |
| Donate page renders, 0 JS errors | PASS |
| General donation form renders | PASS |
| Funded students page renders | PASS |
| Apply page renders | PASS |
| Sponsor page renders | PASS |
| Funded students load from database (12 student cards) | PASS |
| Donor login → dashboard | PASS |
| Student login → profile | PASS |
| Admin login → portal | PASS |
| Donor **blocked** from admin portal | PASS |

Screenshots captured in `test-shots/` (admin dashboard, donor dashboard, public pages).

## 3. Backend & data privacy (live Supabase)

| Check | Result |
|-------|--------|
| Public "funded students" function works | PASS (12 students) |
| Anonymous visitor **cannot** read the students table | PASS (blocked) |
| Admin login | PASS |
| Student login | PASS |
| Donor login | PASS |
| Admin sees all students | PASS (17) |
| Donor sees **only** their matched student | PASS (1) |
| Student sees **only** their own record | PASS (1) |
| General donations readable by admin | PASS |

---

## 4. Critical issue found and fixed during testing

**Issue:** A database trigger (`on_auth_user_created`) automatically added **every** new signup — including donors and students — to the `profiles` (committee staff) table. Because the privacy rules treat anyone in `profiles` as staff, this meant **any donor or student could read every applicant's private data** (income, phone numbers, documents), and could log into the committee portal.

**Confirmed by testing:** before the fix, a logged-in donor could pull all 17 student records.

**Fix applied:**
1. `portal/fix_admin_access.sql` — removed the auto-promote trigger and deleted the wrongly-added staff rows.
2. `portal/js/client.js` — the committee portal now rejects any donor/student account and only allows explicitly-provisioned staff.

**After the fix (re-tested):** donor sees only their 1 matched student, student sees only their own record, and a donor attempting to log into the committee portal is blocked with a "not authorised" message.

---

## 5. Known non-blocking items (not bugs)

- **Payment gateway not connected** — donation forms record the intent but do not collect real money yet (deferred).
- **Some placeholder numbers** on the homepage and Donor Transparency page (e.g. "325 applications", fund figures) are sample data to be replaced with real figures.
- **Privacy policy / Terms** footer links are placeholders.

---

## How to re-run these tests

From the project folder:

```
python -m http.server 8000          # serve the site locally
python check_site.py                # pages + links
python check_backend.py             # backend + data privacy
python browser_test.py              # real browser flows + screenshots
```
