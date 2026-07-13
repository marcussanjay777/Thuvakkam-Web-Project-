# Thuvakkam Education — SFS Portal Build Plan

## Understanding

Thuvakkam Education is a Tamil Nadu-based NGO running a programme called **Sponsor for Success (SFS)** — a scholarship and mentoring initiative that identifies financially vulnerable school students, funds their education, and monitors their long-term progress.

The **SFS Portal** is an internal tool used by two types of users:
- **Committee members** — who review student applications, shortlist candidates, and manage documentation
- **Donors** — who want visibility into how their money is being used, how many students are being supported, and what impact is being made

The portal is not public-facing. It sits behind a login screen.

---

## What I Am Building

A multi-page internal portal with separate HTML files for each section, shared CSS, and no external frameworks. Pure HTML and CSS throughout.

### Folder structure

```
portal/
  index.html          — Login screen
  dashboard.html      — Overview with metrics and year-wise chart
  applications.html   — Full table of student applications with status
  selected.html       — Cards view of currently selected/active students
  previous.html       — Cards view of past beneficiaries (alumni)
  donors.html         — Donor transparency page: funds raised, utilised, active donors
  documents.html      — Student document upload records
  css/
    style.css         — All shared styles (layout, sidebar, topbar, components)
```

Every page (except login) shares:
- A top navigation bar (brand name, search, user avatar)
- A left sidebar with section links
- A main content area

---

## Section-by-Section Plan

### 1. Login — `index.html`
- Centered card on a dark navy background
- Organisation name + portal subtitle
- Email and password inputs
- Sign in button that redirects to `dashboard.html`
- Forgot password link

### 2. Dashboard Overview — `dashboard.html`
- 4 metric cards: Total Applications, Selected Students, Pending Review, Partner Schools
- A year-wise bar chart (CSS-only bars, no JS library) showing application vs selection trend from 2021 to 2026

### 3. Applications — `applications.html`
- Full-width table listing all student applications
- Columns: Student name, School, District, Class, Status, Actions
- Status shown as coloured badges (Pending / Selected / Rejected)
- Filter and Export buttons in the toolbar (UI only, not functional at this stage)

### 4. Selected Students — `selected.html`
- Card grid layout (3 columns)
- Each card: student initials avatar, name, school, district, class, status
- "View profile" button on each card

### 5. Previous Beneficiaries — `previous.html`
- Same card grid layout as selected students
- Shows year of support (2023, 2024) alongside student info
- Clearly labelled as past recipients

### 6. Donor Transparency — `donors.html`
- 3 summary stat blocks: Students Sponsored, Funds Utilised, Active Donors
- Progress bars showing percentage toward targets
- Report download buttons (UI only): Utilisation Report, Impact Report

### 7. Documents — `documents.html`
- List of uploaded student documents
- Each row: document type, student name, upload date, download button
- Organised in a card container

---

## Design Decisions

- **Colour palette**: Dark navy `#042C53` for sidebar, topbar accents, and login background. Mid blue `#185FA5` for interactive elements. Light blue tints for backgrounds.
- **Typography**: System font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`) — no external font dependency for a faster, more reliable internal tool.
- **Icons**: Tabler Icons via CDN (`cdn.jsdelivr.net`) — lightweight and consistent.
- **No JavaScript** for navigation — each sidebar link is a plain `<a href>` pointing to the correct HTML file. Active state is hardcoded per page.
- **Responsive**: Desktop-first (this is an internal dashboard, not mobile-primary), but layout will not break at smaller widths.
- **No emojis, no gradients, no decorative clutter** — clean, information-dense, institutional.

---

## What I Am Not Building Yet

- Backend / authentication (login button simply redirects)
- Real search functionality
- File upload or download logic
- Filtering or sorting on tables
- Any database connection

These are frontend HTML/CSS pages only. Data is illustrative (hardcoded) to show the real shape of the UI.
