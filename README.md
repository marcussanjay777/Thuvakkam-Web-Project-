# Thuvakkam Education — Sponsor for Success (SFS) Portal

A 4-portal web system for Thuvakkam Education's **Sponsor for Success** scholarship programme in Tamil Nadu. Built with HTML, CSS, and JavaScript, backed by Supabase.

---

## Live Links

| Portal | URL |
|--------|-----|
| 🌐 Public Website | https://superb-fox-9a4107.netlify.app/website/ |
| 🛠️ Admin Portal | https://superb-fox-9a4107.netlify.app/portal/ |
| 🎓 Student Portal | https://superb-fox-9a4107.netlify.app/student-portal/ |
| 💛 Donor Portal | https://superb-fox-9a4107.netlify.app/donor-portal/ |

---

## What Each Portal Does

**Public Website** — Scholarship information and student application form. No login required.

**Admin Portal** — For committee members to review applications, approve/reject students, manage donors, and view documents.

**Student Portal** — For selected students to log academic updates (grades, exams, achievements) with proof uploads.

**Donor Portal** — For donors to register, record donations, and view their matched student's progress.

---

## Admin Portal Credentials

| Field | Value |
|-------|-------|
| Email | admin@gmail.com |
| Password | admin |

---

## Student Portal — Test Account

| Field | Value |
|-------|-------|
| Email | teststudent@sfs.com |
| Password | Student@123 |

Logs in as **Sanjay Marcus** (test student).

---

## Donor Portal — Test Account

| Field | Value |
|-------|-------|
| Email | testdonor@sfs.com |
| Password | Donor@123 |

---

## Tech Stack

- Frontend: HTML5, CSS3, Vanilla JavaScript (no framework)
- Backend / Database: Supabase (PostgreSQL + Auth + Storage)
- Icons: Tabler Icons
- Deployment: Netlify
- Email: Supabase Auth (OTP verification)

---

## Project Structure

```
NGo/
├── website/          → Public scholarship site + application form
├── portal/           → Admin portal (review, approve, manage)
├── student-portal/   → Student academic updates
├── donor-portal/     → Donor registration and dashboard
└── portal/*.sql      → All database migration files
```

---

Built by Marcus Sanjay — Intern, Thuvakkam Education (2026)
