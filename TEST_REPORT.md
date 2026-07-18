# Thuvakkam SFS — Test Report

**Date:** 18 July 2026
**Method:** Site served locally (`localhost:8000`), tested against the live Supabase backend, with automated tools (Playwright across Chromium/Firefox/WebKit, Lighthouse, and direct API tests).

**Overall:** Site is functional, secure, and works across browsers and devices after fixing 1 critical security issue and 2 mobile-layout issues found during testing.

---

## Results mapped to the QA checklist

### Functional Testing
| Item | Status | Notes |
|------|--------|-------|
| Feature / button / link testing | ✅ Pass | 27 pages load; all interactive flows work |
| Form validation | ✅ Pass | Apply form + donation form reject empty/invalid input with errors |
| Link testing (no broken links) | ✅ Pass | 425 internal links/images/scripts checked, 0 broken |
| CRUD (create/read/update/delete) | ✅ Pass | Verified create+read+update+delete against the database (reversible, no test data left behind) |

### Cross-Browser & Cross-Device
| Item | Status | Notes |
|------|--------|-------|
| Cross-browser (Chrome/Edge, Firefox, Safari) | ✅ Pass | All 9 key pages load with 0 JS errors in Chromium, Firefox and WebKit engines |
| Responsive (mobile/tablet/desktop) | ✅ Pass (after fix) | Found + fixed: mobile menu missing, donate cards not stacking. Now verified at 390/768/1280px |
| OS testing (iOS/Android real devices) | ⚠️ Needs you | Automated tools emulate screen sizes but not real phones — worth a quick check on your own phone |

### Performance (Lighthouse, homepage)
| Metric | Score |
|--------|-------|
| Performance | 65 / 100 |
| Accessibility | 88 / 100 |
| Best practices | 96 / 100 |
| SEO | 91 / 100 (→ improved after adding meta descriptions) |

Main performance drag: the icon font loads before the page renders. Fine for launch; can be optimised later. Load/stress testing was **not** run to avoid hammering the free Supabase tier.

### Security
| Item | Status | Notes |
|------|--------|-------|
| Authentication / authorization | ✅ Pass | Extensively tested. **Critical hole found + fixed** (see below) |
| Data protection / privacy | ✅ Pass | Donors see only matched students; students see only their own record; anonymous users cannot read the students table |
| SQL injection | ✅ N/A | Supabase/PostgREST uses parameterised queries; no raw SQL from the browser |
| CSRF | ✅ Low risk | Auth uses JWT bearer tokens, not cookies |
| SSL / HTTPS | ✅ Pass (live) | Netlify serves the live site over HTTPS automatically |
| XSS | ⚠️ Minor | A few admin-only screens insert names into the page without escaping — low risk (internal tool). Recommend escaping later |

### Usability & Accessibility
| Item | Status | Notes |
|------|--------|-------|
| UX / navigation / CTAs | ✅ Pass | Clear layout; mobile menu now works |
| Accessibility (a11y) | 🟡 88/100 | Two items to improve: some low colour-contrast text, and pages could use a `<main>` landmark |
| Content proofreading | ⚠️ Needs you | Some placeholder text/numbers still present |

### Compatibility & Integration
| Item | Status | Notes |
|------|--------|-------|
| Payment gateway | ⛔ Not built | Deferred — donations record intent but collect no money yet |
| Analytics (GA4) | ⛔ Not set up | Needs your Google Analytics account |
| Transactional email | ✅ N/A now | OTP removed; no emails are sent currently |
| Database integrity / queries | ✅ Pass | Row-level security verified per role |

### SEO & Analytics
| Item | Status | Notes |
|------|--------|-------|
| Titles / viewport | ✅ Pass | All 10 pages |
| Meta descriptions | ✅ Fixed | Added to all 10 pages (were missing) |
| robots.txt + sitemap.xml | ✅ Fixed | Added |
| Structured data | ⚠️ Optional | Not present; nice-to-have later |
| Analytics tracking | ⛔ Needs you | GA4 not connected |

### Pre-Launch
| Item | Status | Notes |
|------|--------|-------|
| Staging environment | ✅ Pass | Netlify preview acts as staging |
| Regression testing | ✅ Pass | Reusable test scripts included (see below) |
| Backup / rollback | 🟡 Partial | Code: GitHub history. Database: needs Supabase Pro for daily backups |

---

## Critical issue found and fixed during testing

A database trigger auto-added **every** signup (donors and students included) to the committee-staff table, so any donor or student could read all applicant data and enter the admin portal. **Confirmed by testing** (a donor could pull all 17 records), then **fixed and re-verified** (donor now sees only 1 matched student; donor is blocked from the admin portal with a "not authorised" message).

Fix: `portal/fix_admin_access.sql` + guard in `portal/js/client.js`.

## Issues fixed this round
1. **Critical** — admin access-control hole (above).
2. **Mobile menu** — phones had no way to open the navigation; added a hamburger menu.
3. **Donate page** — the two option cards were squished on phones; they now stack.
4. **SEO** — added meta descriptions to all pages + robots.txt + sitemap.xml.

## Still open (known, not blocking a demo)
- Real payment collection (deferred).
- Placeholder numbers/text on some pages.
- Google Analytics not connected.
- Minor: colour-contrast tweaks, escape names on admin screens, structured data.

---

## How to re-run these tests
From the project folder, with the site served (`python -m http.server 8000`):
```
python check_site.py        # pages + links
python check_backend.py     # backend + data privacy
python check_crud.py        # create/read/update/delete
python cross_device.py      # cross-browser + responsive screenshots
python check_forms.py       # form validation
python check_mobile.py      # mobile menu + layout
python browser_test.py      # full login flows + security
```
