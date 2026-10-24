# Diamond Hospital website: build plan

Source of truth for content: `info.md`. Design rules: `ui.md` (palette) and `skills.md` (design process).
Where those files and the project brief disagree, the brief wins (noted inline).

---

## 1. Subject, audience, primary job

- **Subject:** a 24-hour multi-speciality hospital on Kasaba Bawada Main Road, Kolhapur.
- **Audience:** patients and family members in and around Kolhapur, mostly on phones,
  often in a hurry or anxious, some older, many bilingual (Marathi later).
- **Primary job:** in under five seconds, let someone **call the hospital** or **find
  the right doctor/department**. Everything else is secondary.

---

## 2. Design plan (pass 1)

### 2.1 Colour tokens

Only the six brief colours. Borders and muted text are **opacity tints of Deep Navy**,
which keeps the palette at six colours without adding a seventh hue.

| Token | Hex | Role |
|---|---|---|
| `--c-brand` | #5D9CEC | Nav active indicator, primary button fill, icon accents |
| `--c-ink` | #1E3A8A | All text, headings, footer background, focus ring |
| `--c-emergency` | #DC2626 | Emergency bar, emergency call button, nothing else (see 2.1b) |
| `--c-accent` | #00B4D8 | Hover fill, secondary buttons, active tab underline |
| `--c-surface` | #FFFFFF | Page background |
| `--c-surface-2` | #F3F4F6 | Alternate sections, card and form-field backgrounds |
| `--c-ink-muted` | navy @ 85% | Secondary text (6.8:1 on white, 6.4:1 on gray) |
| `--c-line` | navy @ 14% | Hairlines, input borders |

**2.1a Contrast results (computed, WCAG 2.2):**

| Pair | Ratio | Verdict |
|---|---|---|
| Navy on White | 10.4 | Body text OK |
| Navy on Soft Gray | 9.4 | Body text OK |
| White on Emergency Red | 4.8 | OK (AA) |
| Red text on Soft Gray | 4.4 | **Fails** (red text only on white) |
| Navy on Brand Blue | 3.7 | Large/bold text only (≥ 19px bold) |
| Navy on Cyan | 4.2 | Large/bold text only |
| **White on Brand Blue** | **2.8** | **Fails** |
| White on Cyan | 2.5 | Fails |

Consequences:
- **Secondary button (as built):** Cyan fill, navy label, swaps to Brand Blue on hover.
- **Desktop header (as built):** no separate red utility bar; the sticky header carries a red
  "Emergency 24×7 / number" button. Phones/tablets get the sticky red bottom bar.
- **Primary button:** Brand Blue fill, **Navy label at 19px semibold-bold** (passes AA large),
  hover → Cyan fill with Navy label. Never white text on blue or cyan.
- **Navigation (as built):** Navy text on white with a 4px Brand Blue strip along the top of the
  header (that is where blue appears in the nav). The current page is bold with a 3px **navy**
  bar, because Brand Blue and Cyan are below 3:1 on white and can't be the only state signal.
  Hover bar is Cyan. Active tabs on the Departments page follow the same rule.
- **Links in body text:** Navy, underlined, Cyan underline on hover.

**2.1b Brief vs ui.md:**
- ui.md mentions "subtle gradients" for Cyan, but the brief bans gradients, so there are **no gradients**.
- ui.md allows red for "error states and critical alerts". **Decided (Q1): follow ui.md.**
  Form errors use red text **on white only** (4.8:1) plus a warning icon, so colour is never
  the only signal. Red is not used for anything decorative.

### 2.2 Typography

One pairing, chosen for a reason specific to this brief: **both families ship Latin +
Devanagari**, so Marathi can be added later without a font swap or layout shift.

- **Headings: Martel** (serif, Latin + Devanagari). Calm, institutional, readable,
  and not a stock "startup" face. Weights 700, 800.
- **Body/UI: Mukta** (sans, Latin + Devanagari, by Ek Type, Mumbai). Weights 400, 500, 600.
- Self-hosted via `@fontsource` (no Google Fonts request), `font-display: swap`, Latin
  subset preloaded; Devanagari subset loads only when Marathi ships.

Type scale (major third, 1.25), mobile → desktop:

| Step | Mobile | Desktop | Use |
|---|---|---|---|
| `--fs-sm` | 15px | 15px | Meta, captions |
| `--fs-base` | 17px | 18px | Body (line-height 1.6) |
| `--fs-lg` | 21px | 22px | Lead text, card titles |
| `--fs-h3` | 22px | 26px | H3 |
| `--fs-h2` | 27px | 34px | H2 |
| `--fs-h1` | 32px | 46px | H1 (Martel, line-height 1.15) |

Rules: sentence case everywhere, **no all-caps eyebrow labels**, no single-word colour
accents in headings, body measure max 68ch, phone numbers in tabular figures.

### 2.3 Spacing, radius, elevation

- Spacing scale (4px base): `4 8 12 16 24 32 48 64 96`. Section padding 48 mobile / 96 desktop.
- Radius **by hierarchy, not one value everywhere**: 4px inputs and tags, 8px buttons,
  12px photographs. Emergency bar square.
- **No shadows.** Separation by Soft Gray surfaces and navy hairlines. No glass, no glow.
- Container max 1200px; text columns max 68ch. 16px side gutter on mobile.

### 2.4 Concept: "wayfinding"

The visual idea comes from what a good hospital lobby already does: **clear directional
signage**. High-contrast panels, left-aligned text, strong labels, no decoration.

- Department lists look like a **lobby directory board**: left-aligned rows of department
  name + treatment count, not a grid of identical icon cards.
- The single bold element (where the "boldness budget" is spent) is the
  **24×7 emergency signboard**: a solid red band with the three phone numbers set large in
  tabular figures, each one tap-to-call. It's the one place the site is loud.
- Everything else is quiet: white space, navy type, real photography.

### 2.5 Layout wireframes

**Global chrome, mobile (most visitors):**

```
┌──────────────────────────────┐
│ [logo] Diamond Hospital   [≡]│  header, white, navy text
├──────────────────────────────┤
│                              │
│         page content         │
│                              │
├──────────────────────────────┤
│ ■ Emergency 24×7   [ Call ]  │  sticky bottom bar, red, thumb zone
└──────────────────────────────┘
```

**Global chrome, desktop:**

```
┌───────────────────────────────────────────────────────────────┐
│ Open 24×7 · Emergency 0231-2667044 / 045 / 046      [Call now]│ red utility bar
├───────────────────────────────────────────────────────────────┤
│ [logo] Diamond Hospital   Home About Doctors Departments Contact│
│                                    ▔▔▔▔▔ (blue active bar)     │
└───────────────────────────────────────────────────────────────┘
```

**Home, mobile:**

```
┌──────────────────────────────┐
│ [ building photo, 4:3 ]      │  real photo first, no text over it
├──────────────────────────────┤
│ Diamond Hospital, Kolhapur   │  H1
│ A venture of Kolhapur Super  │
│ Speciality Medical Centre    │
│ [Call 0231-2667044] [Directions]
├──────────────────────────────┤
│ ███ EMERGENCY SIGNBOARD ███  │  red band, 3 numbers, tap to call
├──────────────────────────────┤
│ Departments (directory list) │  name ......... 25 treatments
│ ENT ...................... › │
│ Urology .................. › │
│ [All departments]            │
├──────────────────────────────┤
│ Doctors (horizontal scroll)  │  photo, name, designation, OPD
├──────────────────────────────┤
│ Ayushman Bharat + insurers   │  logo strip, gray surface
├──────────────────────────────┤
│ Facilities (2-col list)      │
├──────────────────────────────┤
│ Visit / call CTA + map       │
└──────────────────────────────┘
```

**Home, desktop hero:** photo on the right (7 cols), text left (5 cols), left-aligned,
the signboard directly under the hero spanning full width.

**Departments & Treatments (one page, real URLs):**

```
/departments            → all departments
/departments/cardiology → same page, Cardiology selected (server-rendered)

┌───────────────────────────────────────────┐
│ H1: Cardiology & CVTS at Diamond Hospital │  H1 changes per department
│ [ Search all treatments…           ]      │
│ All | Cardiology | ENT | Urology | …      │  tabs are real <a> links
│ ───────────────────────────────────────── │
│ Coronary Angiography                    › │  treatment rows
│ CT Coronary Angiography                 › │
│ Doctors in this department: [card]        │
└───────────────────────────────────────────┘
```

Mobile: tabs become a horizontally scrollable row with the active tab scrolled into view.

**Treatment page:** breadcrumb (Departments › Cardiology › Treatment) → H1 → description
(68ch) → YouTube (click-to-load facade) → presentation (sandboxed frame, 16:9) →
related doctors → "Back to Cardiology".

**Doctor card:** photo (4:5, 12px radius) · name (H3) · designation · speciality ·
OPD timings (always visible; "Call to confirm OPD timings" when not set).

### 2.6 Motion

Brief asks for subtle scroll motion; skills.md warns that per-card fade-ups look generated.
Compromise:
- **One** reveal per section heading block (opacity 0→1, translateY 8px→0, 220ms, once).
  Not on every card.
- Tab/filter change: list cross-fades (150ms) and keeps height stable (no layout jump).
- Hover: colour change only, 120ms. No scale/lift effects.
- Page transitions: View Transitions API cross-fade where supported, otherwise nothing.
- `prefers-reduced-motion: reduce` → all of the above off. IntersectionObserver only,
  no animation library shipped.

### 2.7 Copy voice

Plain, factual, from the patient's side. "Call the emergency desk", not
"Experience world-class care". No superlatives the hospital can't back up. Buttons say
what happens: "Call 0231-2667044", "Get directions", "Send message".
Ratings (4.0 / 98 ratings) never appear anywhere.

---

## 3. Review of the design plan against the brief (pass 2)

What I caught and changed before writing any code:

1. **First draft had white text on Brand Blue buttons**, which is the obvious default, but it fails
   contrast at 2.8:1. Changed to navy labels at large size (2.1a).
2. **First draft had a full-bleed hero photo with headline overlaid**, the stock hospital-template
   look, and text over photos also fails contrast unpredictably. Changed to photo and text
   side by side (desktop) / stacked (mobile).
3. **First draft had departments as an icon-card grid**, which is the SaaS card kit from
   skills.md. Changed to a directory-board list, grounded in hospital wayfinding signage.
   (There are also no real department icons, so this avoids generic icon sets.)
4. **First draft used Inter**, a default choice. Changed to Martel + Mukta, chosen for
   Devanagari readiness.
5. **Facilities had "01/02/03" markers**, but facilities aren't a sequence. Removed.
6. Red for form errors is kept (ui.md, confirmed by owner), but restricted to white backgrounds
   because red on Soft Gray fails contrast. Error inputs therefore sit on white, not gray.

---

## 4. Architecture

```
diamondwebsite/
├── frontend/                  TanStack Start (React 19, Vite, SSR)
│   ├── src/
│   │   ├── routes/            file-based routes (see 4.2)
│   │   ├── components/        layout, ui primitives, feature components
│   │   ├── content/
│   │   │   ├── en.ts          ALL visible UI strings (Marathi = add mr.ts later)
│   │   │   ├── site.ts        hospital facts: address, phones, hours, insurers
│   │   ├── lib/               api client, seo helpers, json-ld builders, i18n t()
│   │   └── styles/            tokens.css, base.css, utilities
│   ├── public/images/         hospital/, doctors/, insurers/ (placeholders until supplied)
│   └── .env.example
├── backend/                   FastAPI + SQLAlchemy 2 + Alembic
│   ├── app/
│   │   ├── main.py            app factory, middleware (CORS, headers)
│   │   ├── config.py          pydantic-settings, all from env
│   │   ├── db.py              engine/session (psycopg 3, Neon pooled URL)
│   │   ├── models/            ORM models
│   │   ├── schemas/           Pydantic request/response models
│   │   ├── routers/public.py  read-only public API
│   │   ├── routers/admin/     auth, dashboard, submissions, treatments, doctors, departments
│   │   ├── services/          youtube.py, embeds.py, sanitize.py, slugs.py, ratelimit.py
│   │   └── security/          passwords (argon2), sessions, csrf, deps
│   ├── alembic/               migrations
│   ├── seed/hospital_seed.py  structured data transcribed from info.md
│   ├── scripts/               seed_content.py, seed_admins.py
│   ├── tests/                 pytest
│   └── .env.example
└── PLAN.md
```

### 4.1 Data flow

- **Public pages:** TanStack Start route loaders call the FastAPI public API **server-side**
  (`API_INTERNAL_URL`), so HTML arrives fully rendered. Responses are cached briefly
  (`Cache-Control: s-maxage=60, stale-while-revalidate`) so admin edits show up within a minute.
- **Admin panel:** lives in the frontend under `/admin` (not linked anywhere, `noindex`
  header). The browser calls FastAPI directly with a session cookie. **Every admin endpoint
  checks the session on the server**; the UI guard is only for convenience.
- Frontend and API on the same registrable domain (e.g. `www.` + `api.`) so cookies can be
  `SameSite=Strict`. *(Q3: confirm domain and hosting.)*

### 4.2 Public URLs

| URL | Page |
|---|---|
| `/` | Home |
| `/about` | About, facilities, Ayushman Bharat, insurance |
| `/doctors` | Doctor list |
| `/doctors/{slug}` e.g. `/doctors/dr-kaustubh-aurangabadkar` | Doctor profile |
| `/departments` | All departments + all treatments |
| `/departments/{slug}` e.g. `/departments/cardiology` | Same page, department selected (SSR, own title/meta/H1) |
| `/departments?q=…` | Search results (`noindex`, canonical → `/departments`) |
| `/treatments/{slug}` e.g. `/treatments/coronary-angiography` | Treatment page |
| `/contact` | Contact |
| `/sitemap.xml`, `/robots.txt` | Server routes, generated from DB |

Treatment URLs are flat (not nested under department) so moving a treatment between
departments doesn't break its URL. Renamed slugs get a **301 via a `slug_redirects` table**,
so old links and Google rankings carry over.

---

## 5. Database schema (PostgreSQL, Alembic migrations)

```
departments
  id PK · slug UNIQUE · name · summary (short, for meta + directory)
  intro_html NULL · sort_order INT · is_hidden BOOL · created_at · updated_at

doctors
  id PK · slug UNIQUE · name · designation · speciality
  qualifications TEXT · training TEXT NULL · achievements TEXT NULL
  expertise JSONB (list of strings) · opd_timings TEXT NULL
  photo_version TEXT NULL (short hash of the stored photo; NULL = no photo)

doctor_photos  (one row per doctor with a photo; bytes kept out of doctor queries)
  doctor_id PK FK→doctors ON DELETE CASCADE · content_type · data BYTEA · width · height
  sort_order · is_hidden · timestamps

doctor_departments  (doctor_id, department_id) composite PK · is_primary BOOL
                    -- a doctor can belong to several departments (e.g. Dr. Vilas Naik:
                    -- Cardiology & CVTS + Nephrology); exactly one marked primary

treatments
  id PK · slug UNIQUE · title · department_id FK → departments NOT NULL
  description_html TEXT NULL (sanitised on save)
  youtube_video_ids JSONB list (bare 11-char ids, admin's order, max 10)
  presentation_urls JSONB list (normalised embed links, admin's order, max 10)
  is_hidden BOOL · timestamps
  -- "draft" is DERIVED: description_html empty (after stripping tags) → draft

treatment_doctors   (treatment_id, doctor_id) composite PK   -- 0..n linked doctors

slug_redirects      entity_type · old_slug · new_slug · created_at   UNIQUE(entity_type, old_slug)

contact_submissions
  id PK · name · phone · email NULL · message · is_read BOOL default false
  created_at (indexed DESC) · ip_hash · user_agent

admin_users         id · email UNIQUE · password_hash (argon2id) · is_active · last_login_at
admin_sessions      id · token_hash UNIQUE (sha256) · admin_id FK · created_at · expires_at
                    · last_seen_at · ip_hash
rate_limit_hits     key · created_at   INDEX(key, created_at)   -- DB-backed, works across instances
```

**Visibility rule (one query helper used everywhere, including the sitemap):**
- Department public: `NOT is_hidden`.
- Doctor public: `NOT is_hidden` (shown only under departments that are public).
- Treatment public: `NOT is_hidden` and description non-empty and department public.

Search: Postgres `ILIKE` over title (fine at ~100 treatments); `pg_trgm` index if it grows.

---

## 6. Backend details

### 6.1 Public API (`/api/v1/public/...`, read-only, cacheable)
`site`, `departments`, `departments/{slug}` (with public treatments + doctors),
`doctors`, `doctors/{slug}`, `treatments?q=&department=`, `treatments/{slug}`,
`sitemap-entries`, `redirects/{type}/{slug}`, and `POST contact`.

### 6.2 Admin API (`/api/v1/admin/...`, session required)
- `auth/login`, `auth/logout`, `auth/me`
- `dashboard` → unread submissions, treatments (public/draft/hidden), doctors, departments
- `submissions` → list (newest first, `?read=`, `?from=&to=`, `?q=`, paginated),
  get, PATCH read/unread, DELETE
- `treatments`, `doctors`, `departments` → CRUD + hide/show; departments `PATCH /reorder`

### 6.3 Auth and sessions
- **Exactly two admins**: `scripts/seed_admins.py` reads `ADMIN_1_EMAIL/PASSWORD`,
  `ADMIN_2_EMAIL/PASSWORD` from env, upserts them, refuses to create any others. No
  registration endpoint exists.
- Passwords: argon2id (`argon2-cffi`), minimum 12 chars enforced in seed.
- Session: random 32-byte token in an `HttpOnly; Secure; SameSite=Strict` cookie; only its
  SHA-256 is stored. 8-hour idle timeout, 7-day absolute. Logout deletes the row.
- CSRF: SameSite=Strict + `Origin` header check against `ALLOWED_ORIGINS` on every
  non-GET admin request.
- Login rate limit: 5 attempts / 15 min per IP and per email, generic error message,
  constant-time comparison.

### 6.4 Validation services
- **YouTube** (`services/youtube.py`): accepts `youtube.com/watch?v=`, `youtu.be/`,
  `/embed/`, `/shorts/`, `/live/`, `m.` and `www.` variants; extracts and stores only the
  11-char ID (`^[A-Za-z0-9_-]{11}$`). Anything else → clear validation error. Public page
  embeds `youtube-nocookie.com/embed/{id}` behind a click-to-load thumbnail.
- **Presentations** (`services/embeds.py`): allowlisted hosts only:
  - Google Slides `docs.google.com/presentation/d/{id}/...` → normalised to `/embed`
  - OneDrive / Office Online `onedrive.live.com/embed?...`, `view.officeapps.live.com/op/embed.aspx?src=...`
  - Must be `https`, no credentials in the URL, host compared exactly (not "contains").
  - Short links like `1drv.ms` are rejected with a message saying how to get the embed link.
  - Rendered in `<iframe sandbox="allow-scripts allow-same-origin allow-popups"
    referrerpolicy="no-referrer" loading="lazy">`, and the URL is re-validated at render time too.
- **Rich text** (`services/sanitize.py`): admin uses a small Tiptap editor (H2, H3, bold,
  italic, bullet/numbered lists, links). Server sanitises with **nh3** using an allowlist
  of those tags only; links forced to `https`/`tel`/`mailto` with `rel="noopener nofollow"`.
- **Slugs**: generated from name/title, editable by admin, unique per table, old slug
  written to `slug_redirects` on change.

### 6.5 Contact form
- Fields: name (2–80), phone (Indian 10-digit, optional +91/0 prefix), email (optional,
  validated), message (10–2000).
- Spam: hidden honeypot field + minimum 3-second fill time (signed timestamp). A tripped
  honeypot returns fake success and stores nothing.
- Rate limit: 5 submissions / hour / IP (DB-backed).

### 6.6 Security headers and CORS
- CORS: only `ALLOWED_ORIGINS` from env, credentials allowed only for those.
- Headers: HSTS, `X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy`, `X-Frame-Options: DENY` on API.
- Frontend CSP: `frame-src` limited to `youtube-nocookie.com`, `docs.google.com`,
  `onedrive.live.com`, `view.officeapps.live.com`, `www.google.com` (maps).
- No secrets in code; `.env.example` documents every variable.

---

## 7. Frontend details

### 7.1 Content and i18n
- `content/en.ts` holds every UI string, typed with a `t('key')` helper. Adding Marathi =
  adding `mr.ts` + a locale prefix route later; no component changes.
- `content/site.ts` holds hospital facts from info.md (address, phones, hours, venture
  line, facilities, insurers, PM-JAY covered procedures and benefits, FAQs).
- DB content (department/doctor/treatment text) is English now; Marathi later = nullable
  `*_mr` columns in a migration. Documented, not built.

### 7.2 Components (built once, reused)
`EmergencyBar`, `Header`/`MobileNav` (focus-trapped dialog), `Footer` (address, phones,
timings, quick links, lazy map), `Button`, `PhoneLink`, `DoctorCard`, `DepartmentDirectory`,
`DepartmentTabs`, `TreatmentList`, `TreatmentSearch`, `YouTubeEmbed` (facade),
`PresentationFrame`, `InsurerStrip`, `Breadcrumbs`, `Reveal` (reduced-motion aware),
`Seo` (title, description, canonical, OG, JSON-LD).

### 7.3 Images and performance
- Hospital photos through `vite-imagetools` → AVIF/WebP `srcset`, explicit width/height,
  hero `fetchpriority="high"`, everything else lazy.
- Placeholders: clearly labelled grey frames ("Hospital photo, to be supplied"), same
  aspect ratio as the real photo so nothing shifts on swap.
- Doctor photos (changed after iteration 1): uploaded in the admin and stored in PostgreSQL.
  Every upload is checked (real JPEG/PNG/WebP, max 8 MB) and re-encoded to a WebP of at most
  800x1000, which also strips EXIF/GPS. Served at /api/v1/public/doctors/{slug}/photo?v={hash}
  with a one-year immutable cache; a new photo gets a new hash. No photo → silhouette.
  Starting photos live in backend/seed/photos and load with `scripts.import_doctor_photos`.
- Maps and YouTube load on demand (lazy / click). Budget: LCP < 2.5s on mid-range Android
  over 4G, JS for public pages < 120KB gzip.

### 7.4 Accessibility checklist
Skip link, landmarks, one H1 per page with logical H2/H3, 2px navy focus ring with 2px
offset on everything focusable, tab panels follow the ARIA tabs pattern **and** remain real
links, form errors linked with `aria-describedby` and announced via `aria-live`, 44px
minimum tap targets, alt text on every image (doctor name + designation).

### 7.5 Admin UI
Same tokens, denser layout. Login → dashboard tiles (counts) → sidebar: Messages
(unread badge), Treatments, Doctors, Departments. Tables with search/filter, status pills
(Public / Draft / Hidden), confirm-before-delete dialogs, unsaved-changes warning,
inline YouTube/presentation preview after validation, drag-free reorder (up/down buttons,
keyboard accessible).

---

## 8. SEO

- All public routes SSR with per-route `head()`: unique `<title>` and meta description.
  - Department: "Cardiology & CVTS in Kolhapur | Diamond Hospital"
  - Treatment: "{Title} in Kolhapur | {Department} | Diamond Hospital", description from the
    first ~155 chars of the treatment text.
  - Doctor: "{Name}, {Designation} | Diamond Hospital Kolhapur"
- Canonical URLs from `SITE_URL` env; Open Graph + Twitter card tags; default OG image =
  building photo.
- JSON-LD: `Hospital` (name, address, geo, telephone ×3, `openingHoursSpecification` 24/7,
  `medicalSpecialty`, `parentOrganization` = Kolhapur Super Speciality Medical Centre),
  `Physician` per doctor, `MedicalProcedure` per treatment, `BreadcrumbList` on inner pages.
  **No `aggregateRating`.**
- `sitemap.xml` and `robots.txt` generated per request from the public-visibility helper, so
  hidden and draft items never appear. `lastmod` from `updated_at`.
- `/admin` sends `X-Robots-Tag: noindex` and is not listed in robots.txt (which would advertise it).

---

## 9. Seed data (from info.md)

- **14 departments** in info.md order, with curated slugs (`cardiology`, `ent`,
  `critical-care-internal-medicine`, `neuro-surgery`, …).
- **Treatments:** ENT 25, Urology 36 (info.md says 37, but the list has 36: Q4), Ophthalmology 21,
  Neurology 2, Gastroenterology 2, Cardiology 3 → all **draft** (title only).
  "Cardiology" treatments map to the "Cardiology & CVTS" department.
- **5 doctors** with designation, speciality, qualifications, training, expertise, OPD
  timings where given ("Call to confirm OPD timings" otherwise), photo placeholders,
  departments (Dr. Vilas Naik in both Cardiology & CVTS and Nephrology).
  Spelling: **Dr. Shraddha Naik**.
- Seed is idempotent (upsert by slug) so it can be re-run safely.

---

## 10. Build steps

Each step ends with a short summary of what was built.

1. **Scaffold:** monorepo folders, git init, TanStack Start app, FastAPI app, lint/format
   (ESLint + Prettier, Ruff), `.env.example` files, README run instructions.
2. **Database:** models, first Alembic migration, visibility helpers, seed scripts
   (content + two admins). Tests for seeding and visibility.
3. **Public API + contact endpoint:** schemas, routers, rate limiting, honeypot. Tests.
4. **Admin API:** auth/sessions, dashboard, submissions, treatments (YouTube +
   presentation validation, sanitiser), doctors, departments with reorder. Tests for
   auth, validators, and protection of every admin route.
5. **Frontend foundation:** tokens, fonts, base styles, i18n, layout, emergency bar,
   header/mobile nav, footer, SEO helper.
6. **Public pages:** Home, About, Doctors + profile, Departments/Treatments (tabs, search,
   real URLs), Treatment page, Contact (all states).
7. **SEO layer:** JSON-LD, sitemap, robots, OG, redirects for renamed slugs.
8. **Admin UI:** login, dashboard, messages, treatments, doctors, departments.
9. **Hardening and audit:** CSP/headers, Lighthouse + axe pass on mobile, keyboard-only
   walkthrough, reduced-motion check, screenshots reviewed against this plan.
10. **Deploy notes:** Neon setup, migrations on deploy, env vars, photo swap instructions.

---

## 11. Decisions (confirmed 2026-10-17)

- **Q1 Form errors:** red, as ui.md says (on white backgrounds only, with an icon).
- **Q2 Buttons:** Brand Blue fill with navy labels (accessible default).
- **Q3 Domain:** `www.<domain>` for the site, `api.<domain>` for the API.
- **Q4 Data:**
  - Urology has 36 treatments (the list is correct, the "37" header was wrong).
  - Dr. Vilas Naik belongs to **both** Cardiology & CVTS and Nephrology (primary: Cardiology & CVTS).
  - ERCP Test stays under Urology as in info.md; admins can move it.
  - Doctors without OPD timings show "Call to confirm OPD timings".
  - Spelling: **Dr. Shraddha Naik**.
  - 0231-2667044 is the emergency number shown first.
- **Q5 Logo:** text wordmark for now; swap in a logo file later.
