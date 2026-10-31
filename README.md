# One Chembur: Enterprise Real Estate CMS Platform

A production-style real-estate marketing site for the **One Chembur** residential project, where **every piece of text, every link and every image on the public page is managed from an admin dashboard**. Visitors get a fast, responsive, mobile-first site and an enquiry form; the sales team gets a CMS with draft/publish, SEO fields, lead management and a full activity log.

Built for the *Advanced Full-Stack Developer Assignment: Enterprise Real Estate CMS Platform*.

| | |
|---|---|
| **Public site** | `https://<your-project>.vercel.app` *(fill in after deploying)* |
| **Admin panel** | `https://<your-project>.vercel.app/admin` |
| **API** | `https://<your-service>.onrender.com` · health: `/api/health` |
| **Admin login** | email `admin@onechembur.com` · password `<set as SEED_ADMIN_PASSWORD>` *(fill in)* |
| **Postman collection** | [`docs/postman_collection.json`](docs/postman_collection.json) |
| **Database schema** | [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) |

---

## Contents

1. [Features and assignment checklist](#features-and-assignment-checklist)
2. [Architecture](#architecture)
3. [Tech stack](#tech-stack)
4. [Folder structure](#folder-structure)
5. [Local setup](#local-setup)
6. [Environment variables](#environment-variables)
7. [Seeding and demo data](#seeding-and-demo-data)
8. [Deployment (Render + Vercel)](#deployment-render--vercel)
9. [API summary](#api-summary)
10. [Security notes](#security-notes)
11. [Hosted URLs and credentials](#hosted-urls-and-credentials)
12. [Known limitations](#known-limitations)

---

## Features and assignment checklist

### Mandatory features

| Requirement | Status | How it is met |
|---|---|---|
| Responsive website | Done | Mobile-first Tailwind layout, verified at 375px and 1280px; no horizontal overflow. |
| Dynamic CMS | Done | All public copy comes from `GET /api/public/*`; built-in fallback copy only if the API is down. |
| CRUD for all sections | Done | Sections, amenities, gallery and floor plans share one generic CRUD router (`crudFactory.js`) and one admin page component. Inquiries support list/update/delete. *Sections are edited in place; the admin cannot add or remove section blocks because the public page renders a fixed set (the API itself supports create/delete).* |
| Inquiry management | Done | Public enquiry modal, then an admin inbox with status workflow (new / contacted / closed), notes, search, filter, **delete** and **CSV export**. |
| SEO metadata | Done | `metaTitle`, `metaDescription`, `ogImage` per section; `react-helmet-async` writes title, description, canonical, Open Graph and Twitter tags. |
| Draft / publish | Done | `status` on every content type; public API returns published only; one-click publish toggle in the admin. |
| Validation | Done | Zod on every write route, inline field errors in the admin and enquiry form, server errors mapped back onto the right input. |
| Search and filters | Done | Every admin list has search, status filter, sorting and pagination; logs filter by entity, action and date range. |
| Activity logs | Done | Every create / update / delete / publish / unpublish writes an `ActivityLog` entry; viewable and filterable in the admin. |
| Mobile optimized | Done | Collapsible admin sidebar, tables turn into cards on phones, bottom-sheet modals, lazy-loaded images, code-split admin bundle. |

### Technical stack requirements

| Requirement | Used |
|---|---|
| Frontend: React + Vite | React 19, Vite, Tailwind CSS 4 |
| Backend: Node + Express | Express 5 |
| Database: PostgreSQL / MySQL / MongoDB | MongoDB Atlas (Mongoose) |
| Authentication: secure login | JWT in an `httpOnly` `Secure` cookie, bcrypt password hashes, login rate limiting |
| Deployment: public URLs | Vercel (client) and Render (API), configured in `client/vercel.json` and `render.yaml` |

### Deliverables

| Deliverable | Where |
|---|---|
| GitHub repo | this repository |
| Hosted URLs | [table above](#hosted-urls-and-credentials) |
| README | this file |
| API collection | [`docs/postman_collection.json`](docs/postman_collection.json): 69 requests, every route, login first |
| Database schema | [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) |
| Admin credentials | [table above](#hosted-urls-and-credentials) |

### Where to look for each evaluation criterion

| Criterion | Evidence |
|---|---|
| Architecture (20%) | Generic CRUD factory, config-driven admin forms, thin routes, central error handler: see [Architecture](#architecture) |
| UI (20%) | Public site matches the supplied screenshots; admin has a consistent design system and a mobile layout |
| Backend (20%) | Auth, validation, rate limiting, activity logging, uploads, CSV export, production proxy/cookie handling |
| Database (15%) | Seven collections, purpose-built compound indexes, soft-linked audit log: [schema doc](docs/DATABASE_SCHEMA.md) |
| Code quality (10%) | Small single-purpose files, reusable components (`DataTable`, `SectionForm`, `ImageUpload`, `ConfirmDialog`, `Toast`, `Modal`), no duplicated CRUD code |
| Performance (10%) | Admin lazy-loaded (public visitors never download it), lazy images with skeletons, immutable asset caching, indexed queries |
| Documentation (5%) | This README, the schema doc, the Postman collection, `.env.example` files |

---

## Architecture

```
                       ┌────────────────────────── Vercel ───────────────────────────┐
  Browser ───HTTPS───▶ │  static React app (Vite build)                              │
  (visitor / admin)    │    /*      → index.html        (SPA fallback for React Router)
                       │    /api/*  → rewrite ──────────────────────────┐            │
                       └────────────────────────────────────────────────┼────────────┘
                                                                        │ proxied (same-origin for the browser)
                       ┌──────────────────────── Render ────────────────▼────────────┐
                       │  Express API   helmet · CORS(CLIENT_URL) · rate limits       │
                       │    /api/public/*   published content   (no auth)            │
                       │    /api/inquiries  public enquiry form (rate limited)       │
                       │    /api/auth/*     login · me · logout (httpOnly cookie)    │
                       │    /api/admin/*    CRUD · logs · stats · upload (auth)      │
                       └───────────────┬───────────────────────────────┬──────────────┘
                                       │                               │
                              MongoDB Atlas                      Cloudinary
                       (7 collections, Mongoose)            (images and PDFs)
```

**Same-origin API.** The browser only ever talks to its own domain. Vercel rewrites `/api/*` to the Render service, so the login cookie is first-party (`SameSite=Lax; Secure; HttpOnly`) and there are no cross-site cookie or CORS problems. Locally, Vite's dev proxy does the same job.

**CMS-driven content.** Public copy lives in the `sections` collection (`key` + `title` / `subtitle` / `body` / `image` + a free-form `content` object). The amenities, gallery and floor-plan blocks are their own collections. React components fetch `/api/public/sections` once and render by key.

**One CRUD implementation.** [`server/src/utils/crudFactory.js`](server/src/utils/crudFactory.js) takes a model, a Zod schema and a few options and returns the admin router (list with search / filter / sort / pagination, get, create, update, delete, publish toggle) and the public router (published only). Sections, amenities, gallery, floor plans and inquiries are each ~10 lines of configuration in [`routes/resources.js`](server/src/routes/resources.js).

**One admin form engine.** Admin pages are driven by config objects: [`sectionConfigs.js`](client/src/admin/sectionConfigs.js) declares every editable field of every section (text, links, images, lists, stats, connectivity columns, consultants, footer contacts) and [`resourceConfigs.jsx`](client/src/admin/resourceConfigs.jsx) declares the amenity / gallery / floor-plan tables and forms. `SectionForm` renders, validates and submits them. To make new content editable, add a field to the config; no component changes.

**Audit trail.** A small middleware records an `ActivityLog` entry after every successful write; handlers only describe what happened.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19 · Vite · Tailwind CSS 4 · React Router · react-helmet-async · lucide-react |
| Backend | Node.js 20+ · Express 5 · Mongoose 9 · Zod · JSON Web Tokens · bcrypt · helmet · express-rate-limit · cors · cookie-parser · multer · morgan |
| Database | MongoDB Atlas |
| Media | Cloudinary (image and PDF uploads) |
| Hosting | Vercel (client) · Render (API) |

---

## Folder structure

```
.
├── client/                         React + Vite app (public site and /admin)
│   ├── vercel.json                 SPA fallback + /api rewrite to Render + cache/security headers
│   ├── vite.config.js              dev server and /api proxy
│   └── src/
│       ├── api/                    fetch client, public and admin API calls
│       ├── admin/                  AdminApp routes, section and resource configs
│       ├── components/
│       │   ├── ui/                 Button, FormField, Modal, Card, Skeleton, Lightbox, SmartImage…
│       │   ├── layout/             Navbar, Footer
│       │   ├── sections/           Hero, About, Connectivity, Gallery, Amenities, Video, FloorPlans, Rera, Developer, Cta
│       │   └── admin/              DataTable, SectionForm, ImageUpload, ConfirmDialog, AdminLayout…
│       ├── context/                Sections, Inquiry, Auth, Toast providers
│       ├── hooks/ · utils/         data hooks, safe-URL guard, icon map, formatting
│       └── pages/                  public/ and admin/ route components
├── server/
│   ├── scripts/dev-memory.js       run the API against a throwaway in-memory database
│   └── src/
│       ├── app.js · server.js      Express app and entry point
│       ├── config/                 env parsing, Mongo, Cloudinary
│       ├── models/                 Mongoose schemas (7 collections)
│       ├── validators/             Zod schemas
│       ├── middleware/             auth, validate, activityLog, security (rate limits, origin guard), errorHandler
│       ├── routes/                 auth, resources, inquiries, upload, admin
│       ├── utils/                  crudFactory, query builder, CSV, errors
│       └── seed/                   seed.js (real content) and demo.js (sample data)
├── docs/
│   ├── DATABASE_SCHEMA.md
│   └── postman_collection.json
├── render.yaml                     Render Blueprint for the API
└── reference/                      assignment PDF and design screenshots
```

---

## Local setup

**Prerequisites:** Node.js 20+, npm, and a MongoDB Atlas cluster (free tier is fine). Cloudinary is optional locally (uploads return a clear 503 until configured).

```bash
# 1. API
cd server
npm install
cp .env.example .env        # then edit: MONGODB_URI, JWT_SECRET, SEED_ADMIN_PASSWORD, CLOUDINARY_*
npm run seed                # creates the admin user and all site content
npm run dev                 # http://localhost:5000  (health: /api/health)
```

```bash
# 2. Client (in a second terminal)
cd client
npm install
npm run dev                 # http://localhost:5173
```

- Public site: <http://localhost:5173> · Admin: <http://localhost:5173/admin>
- Sign in with `SEED_ADMIN_EMAIL` (default `admin@onechembur.com`) and the `SEED_ADMIN_PASSWORD` you set.
- In development the browser calls `/api` on port 5173 and Vite proxies it to the API, so there is nothing to configure for CORS.

**No Atlas account handy?** `npm run dev:memory` (in `server/`) starts the API on an in-memory MongoDB, seeds it, and logs in with the admin password `ChangeMe@123`. Data disappears on exit. For local use only.

Generate a strong `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Environment variables

### API: `server/.env` locally, the Render dashboard in production

Full template with comments: [`server/.env.example`](server/.env.example). `render.yaml` declares the production set.

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `NODE_ENV` | prod | `development` | `production` enables Secure cookies, hides stack traces, and enforces the checks below |
| `PORT` | no | `5000` | Render injects its own; leave unset there |
| `MONGODB_URI` | **yes** | | MongoDB Atlas connection string |
| `JWT_SECRET` | **yes** | | Signs session tokens. 32+ characters in production (the server refuses to start otherwise) |
| `JWT_EXPIRES_IN` | no | `7d` | Session lifetime |
| `CLIENT_URL` | **yes in prod** | `http://localhost:5173` | Allowed browser origin(s) for CORS and the origin guard. Comma-separated, **https only** in production, no trailing slash |
| `COOKIE_SAMESITE` | no | `lax` | `lax` behind the Vercel rewrite. `none` only if browsers call the API's own domain directly |
| `TRUST_PROXY` | no | `2` in prod, `0` locally | Number of reverse proxies in front of the API (Vercel + Render = 2). Needed for correct per-visitor rate limiting |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | for uploads | | Cloudinary credentials. Without them uploads return 503 |
| `SEED_ADMIN_NAME` / `_EMAIL` / `_PASSWORD` | for seeding | `Admin` / `admin@onechembur.com` / none | Admin account created by `npm run seed` (run from your machine) |
| `ADMIN_NEW_PASSWORD` | only for `npm run reset-admin` | none | The new admin password for an emergency reset. Set it for the one command, then unset it; never commit it or put it on Render |

### Client: Vercel

| Variable | Set it? | Purpose |
|---|---|---|
| `VITE_API_URL` | **No, leave unset on Vercel** | The browser calls `/api` on the Vercel domain and `vercel.json` rewrites it to Render. Locally this variable is only the Vite proxy's target (default `http://localhost:5000`). Set it only for a deployment *without* the rewrite, which then also needs `COOKIE_SAMESITE=none` on the API |

The rewrite target is **not** an env var (Vercel rewrites cannot read them): it is the rewrite `destination` inside [`client/vercel.json`](client/vercel.json).

---

## Seeding and demo data

Run these from `server/` against whatever `MONGODB_URI` points to.

| Command | What it does |
|---|---|
| `npm run seed` | Creates the admin user (from `SEED_ADMIN_*`) and all site content from the design screenshots: navbar, hero, about + stats, connectivity, gallery, amenities, video, floor plans, MahaRERA, developer, CTA, footer. Existing documents are left untouched, so edits made in the admin are never overwritten. |
| `npm run seed -- --reset` | Overwrites seeded content and resets the admin password to `SEED_ADMIN_PASSWORD`. |
| `npm run reset-admin` | **Emergency password reset** when you're locked out. Sets the admin password from the `ADMIN_NEW_PASSWORD` environment variable (10+ characters), signs out every existing session, and records an audit entry. The password is never printed or logged. See below. |
| `npm run seed:demo` | Adds **sample data** for demos and screenshots (see below). Safe to run twice. |
| `npm run seed:demo -- --reset` | Removes the demo records and re-creates them with fresh dates. |
| `npm run seed:demo:clear` | Removes **only** the demo records. |

**Changing your password normally:** sign in and open **Admin → Account** (`/admin/account`). It asks for the current password, a new one (10+ characters, different from the current one) and a confirmation. You stay signed in on that device and any other signed-in device is signed out.

**Locked out? `reset-admin`.** Run it from `server/` against whichever database `MONGODB_URI` points to (for the hosted site, put the Atlas URI in `server/.env`). Pass the new password through the environment, not on the command line of a shared machine:

```bash
# bash
ADMIN_NEW_PASSWORD='a-new-long-password' npm run reset-admin
```

```powershell
# PowerShell
$env:ADMIN_NEW_PASSWORD='a-new-long-password'; npm run reset-admin; Remove-Item Env:ADMIN_NEW_PASSWORD
```

It updates `SEED_ADMIN_EMAIL` (default `admin@onechembur.com`), or the first admin if that account doesn't exist. Unset `ADMIN_NEW_PASSWORD` afterwards and keep it out of `.env` files and shell history.

**What `seed:demo` adds:** 25 inquiries across the last 30 days (varied Indian names, `+91 98…` numbers, mixed sources and statuses, some notes); 40 activity-log entries over the last 14 days attributed to the admin; and 3 extra amenities plus 3 extra floor plans, two of each in *draft* so the status filters have something to show.

Every demo record carries a hidden `demo` marker, so inserts are idempotent and `seed:demo:clear` deletes exactly those records: real content and the admin user are never touched. It refuses to run with `NODE_ENV=production` unless you pass `--force`. Note that the one published demo amenity and floor plan appear on the public site until you clear them, so **run `seed:demo:clear` before a real launch**.

---

## Deployment (Render + Vercel)

The API runs on **Render**; the client runs on **Vercel**, which also proxies `/api/*` to Render so the browser sees a single origin.

### 0. Prepare the services

1. **MongoDB Atlas**: create a cluster and a database user. Under *Network Access*, allow Render to connect (`0.0.0.0/0` is the usual choice on Render's free tier, since outbound IPs are not fixed). Copy the connection string.
2. **Cloudinary**: create a free account; note the cloud name, API key and API secret.
3. Push this repository to GitHub.

### 1. Deploy the API to Render

1. Render dashboard → **New → Blueprint** → select this repo. Render reads [`render.yaml`](render.yaml): root directory `server`, build `npm install`, start `npm start`, health check `/api/health`.
   *(Or create a Web Service by hand with the same settings.)*
2. When prompted, fill in the secrets: `MONGODB_URI`, `CLIENT_URL` (use a placeholder like `https://placeholder.vercel.app` for now), `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. `JWT_SECRET` is generated for you; `NODE_ENV`, `TRUST_PROXY=2` and `COOKIE_SAMESITE=lax` are preset.
3. After the deploy, note the service hostname, e.g. `one-chembur-api.onrender.com`, and check `https://<host>/api/health` returns `{"status":"ok"}`.

### 2. Point Vercel at the API

[`client/vercel.json`](client/vercel.json) already points the `/api/*` rewrite at this project's Render service (`https://real-estate-cms-platform.onrender.com`). If you deploy your own copy under a different Render hostname, change the destination (full URL, no trailing slash):

```json
{ "source": "/api/:path*", "destination": "https://<your-service>.onrender.com/api/:path*" }
```

Commit and push. The second rewrite (`/(.*)` → `/index.html`) is the React Router fallback; the order matters, so keep `/api` first.

### 3. Deploy the client to Vercel

1. Vercel → **Add New → Project** → import the repo.
2. **Root Directory: `client`**. Framework preset: Vite (build `npm run build`, output `dist`, already in `vercel.json`).
3. Do **not** set `VITE_API_URL`. Deploy.

### 4. Connect the two

1. In Render, set `CLIENT_URL` to your real Vercel origin (e.g. `https://one-chembur.vercel.app`; add a custom domain too, comma-separated) and redeploy. It must match the browser's origin exactly, because the API checks the `Origin` header on every write.
2. Seed the production database **from your machine** (Render's free plan has no shell). Put the Atlas URI and a strong admin password in `server/.env`, then:

   ```bash
   cd server
   npm run seed
   ```
3. Verify:

   ```bash
   curl https://<your-project>.vercel.app/api/health          # goes through the Vercel rewrite
   curl https://<your-project>.vercel.app/api/public/sections  # JSON with 12 sections
   ```
   Open `https://<your-project>.vercel.app/admin`, sign in, edit a section, and reload the public page.

### Production behaviour worth knowing

- **Cookies:** `HttpOnly; Secure; SameSite=Lax`, host-only on the Vercel domain. Logout clears it with identical attributes.
- **Proxy trust:** `TRUST_PROXY=2` makes `req.ip` the real visitor behind Vercel and Render. With a lower value every visitor appears to share Vercel's IP and the rate limits (10 logins / 15 min, 10 enquiries / hour) would throttle everyone together.
- **No caching of private data:** `/api/admin/*` and `/api/auth/*` send `Cache-Control: no-store`.
- **Cold starts:** Render's free tier sleeps after inactivity; the first request after a pause can take about a minute. The site shows skeletons meanwhile.
- **Preview deployments** get different origins; add them to `CLIENT_URL` if you want to log in from them.

### Troubleshooting

| Symptom | Likely cause |
|---|---|
| Admin saves fail with **403 "Origin not allowed"** | `CLIENT_URL` on Render doesn't exactly match the site's origin (scheme, host, no trailing slash) |
| **Login works but you're immediately logged out** | The browser is calling Render directly (a `VITE_API_URL` was set) while `COOKIE_SAMESITE=lax`; unset it or switch to the rewrite |
| **429 "Too many requests" for everyone** | `TRUST_PROXY` is too low (needs `2`) |
| `/api/*` returns the app's HTML | The rewrite `destination` in `vercel.json` doesn't match your Render hostname, or the `/api` rewrite is not first |
| API won't start in production | It validates config: `JWT_SECRET` ≥ 32 chars, `CLIENT_URL` set and `https://` |
| Uploads return **503** | `CLOUDINARY_*` not set on Render |

---

## API summary

Base URL: the deployed site (via the rewrite) or `http://localhost:5000`. The full, runnable list is in the [Postman collection](docs/postman_collection.json): import it, set `baseUrl`, `adminEmail`, `adminPassword`, run **Auth → Login** first.

Errors are JSON: `{ "success": false, "message": "…", "errors": { "field": "message" } }`.

**Public (no auth)**

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Liveness check |
| GET | `/api/public/sections` · `/:key` | Published sections / one by key |
| GET | `/api/public/amenities` · `/gallery` · `/floor-plans` | Published collections, ordered |
| GET | `/api/public/{amenities,gallery,floor-plans}/:id` | One published item |
| POST | `/api/inquiries` | Submit an enquiry (validated, 10 per hour per IP) |

**Auth**

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/login` | Sets the httpOnly session cookie (10 attempts / 15 min) |
| GET | `/api/auth/me` | Current admin |
| POST | `/api/auth/change-password` | Body `{ currentPassword, newPassword, confirmPassword }`. 10+ chars (max 72 bytes), different from the current one, must match the confirmation. Wrong current password is a `400` with `errors.currentPassword`. Rate limited (5 / 15 min). Returns a fresh cookie; older sessions are signed out |
| POST | `/api/auth/logout` | Clears the cookie |

**Admin (cookie required)**

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/{sections,amenities,gallery,floor-plans,inquiries}` | List with `?search &status &page &limit &sort` |
| GET | `/api/admin/<resource>/:id` | One document |
| POST | `/api/admin/{sections,amenities,gallery,floor-plans}` | Create (Zod-validated) |
| PATCH · PUT | `/api/admin/<resource>/:id` | Partial update |
| DELETE | `/api/admin/<resource>/:id` | Delete (inquiries included) |
| PATCH | `/api/admin/{sections,amenities,gallery,floor-plans}/:id/publish` | Set `{status}` or toggle with `{}` |
| GET | `/api/admin/inquiries/export` | CSV (same filters as the list) |
| GET | `/api/admin/logs` | Activity log: `?entity &action &search &from &to &page &limit` |
| GET | `/api/admin/stats` | Dashboard counts, inquiries by status, latest inquiries and activity |
| POST | `/api/admin/upload` | `multipart/form-data` `file` → Cloudinary URL (JPG/PNG/WebP/GIF/PDF, 10 MB) |

---

## Security notes

- **Authentication:** bcrypt-hashed passwords; HS256 JWT in an `httpOnly`, `Secure` (production), `SameSite=Lax` cookie, so scripts can't read it; the user is re-loaded from the database on every request. Login compares against a dummy hash for unknown emails to avoid revealing which accounts exist.
- **Password changes:** the current password is verified with bcrypt before anything changes; new passwords must be 10+ characters, different from the old one, and at most 72 bytes (bcrypt's limit, so nothing is silently truncated); hashed with the same bcrypt cost as the seed (12). A change signs out every older session (`passwordChangedAt` vs the token's issue time) while the current device gets a fresh cookie. The activity log records only "Changed password": passwords and hashes are never logged or returned. The endpoint is rate limited.
- **Rate limiting:** global API limit, 10 login attempts / 15 min, 10 public enquiries / hour (per visitor IP, correct behind the proxies).
- **CSRF:** state-changing requests whose `Origin` isn't in `CLIENT_URL` are rejected (403); cookies are `SameSite=Lax`; CORS is an allowlist with credentials.
- **Input validation:** Zod on every write with unknown fields stripped; list queries only honour whitelisted filter and sort fields and regex-escape search text (no operator injection).
- **Safe links:** link and image fields in section content must be `http(s)`, a `#anchor` or a `/path` (never `javascript:` or `data:`), enforced by the API and again on the client where links are rendered.
- **Uploads:** memory storage, 10 MB limit, MIME allow-list (images and PDF), sent straight to Cloudinary; nothing is written to the server's disk.
- **CSV export:** cells that could execute as spreadsheet formulas are neutralised.
- **Headers and errors:** `helmet` defaults on the API; security headers on the static site (`nosniff`, frame denial, referrer and permissions policies); no stack traces in production; `no-store` on authenticated responses.
- **Secrets:** all secrets come from environment variables; `.env` files are git-ignored and only `.env.example` templates are committed. The server refuses to start in production with a weak `JWT_SECRET` or a non-HTTPS `CLIENT_URL`.

---

## Hosted URLs and credentials

*Fill these in before submitting.*

| Item | Value |
|---|---|
| Public site | `https://<your-project>.vercel.app` |
| Admin panel | `https://<your-project>.vercel.app/admin` |
| API base | `https://<your-service>.onrender.com` |
| Admin email | `admin@onechembur.com` *(or your `SEED_ADMIN_EMAIL`)* |
| Admin password | `<your SEED_ADMIN_PASSWORD>` |
| GitHub repository | `https://github.com/UNKNOWN69x0/Real-Estate-CMS-Platform` |

> Use a strong, unique admin password for the hosted instance and change it if this README is ever made public.

---

## Known limitations

- **SEO tags are rendered in the browser** (`react-helmet-async`). Search engines that execute JavaScript (Google) see them; crawlers and link-preview bots that don't (some social scrapers) will not. Server-side rendering or prerendering would close that gap.
- **No automated test suite yet.** The API and admin flows were verified manually and with throwaway scripts (including a production-mode proxy test and a run of the whole Postman collection); adding Vitest/Supertest suites is the natural next step.
- **Sections can't be added or removed in the admin**, by design: the public page renders a fixed set of blocks.
- **Single admin role.** There is one `admin` role; there is no per-user permission model.
- **Free-tier hosting** (Render) sleeps when idle, so the first request after a pause is slow.
