# Claude Code Kit: Real Estate CMS

## PART A: Save this as CLAUDE.md in your repo root

```
# Project: Enterprise Real Estate CMS (One Chembur)
Assignment: /reference/assignment.pdf (read it before starting; it has the UI screenshots)

## Stack
- /client: React + Vite + Tailwind + react-router + react-helmet-async + lucide-react
- /server: Node + Express + Mongoose (MongoDB Atlas) + Zod + JWT (httpOnly cookie) + bcrypt + helmet + express-rate-limit + multer + cloudinary
- Admin panel lives in the same React app under /admin

## Design
- Brand: brown (#6B4A2B, #8B5E3C), beige (#F3EDE4), cream (#FAF7F2). Clean serif/sans headings.
- Mobile-first, fully responsive. Don't chase pixel-perfect; match layout and feel.

## Architecture rules
- Every text on the public site comes from the API (CMS-driven). No hardcoded copy except fallbacks.
- Public API returns only status=published. Admin API returns all.
- One generic CRUD router factory reused for all collections (search, filter, pagination, publish toggle).
- Zod validation on every write route. Central error handler. No stack traces in production.
- Every create/update/delete/publish writes an ActivityLog entry.
- Reusable React components: Section wrappers, Card, Button, FormField, DataTable, ImageUpload.
- Small, clear files. Meaningful names. Comments only where logic is non-obvious.

## Workflow
- Commit after each finished feature with a clear message (feat:, fix:, docs:).
- Run the code and fix errors before saying done.
- Keep a .env.example with every variable. Never commit .env.
- Keep answers short. Don't rewrite files that already work.
```

---

## PART B: Prompts (paste one at a time, in order)

### Prompt 1: Plan (press Shift+Tab to enter plan mode first)
```
Read /reference/assignment.pdf fully. Propose the architecture: folder structure, MongoDB collections (User, Section, Amenity, GalleryItem, FloorPlan, Inquiry, ActivityLog) with fields, the API route list, and the list of public site sections. Keep it short. Don't write code yet.
```

### Prompt 2: Backend
```
Build the /server. Express + Mongoose with the collections from the plan. Include: JWT httpOnly-cookie login (/api/auth/login, /me, /logout), a generic CRUD router factory with search, filter, pagination, sort and publish/unpublish, Zod validation, ActivityLog middleware, public routes (published only) and admin routes (auth required), POST /api/inquiries (public, rate-limited) plus admin inquiry list with status update, Cloudinary image/PDF upload endpoint, SEO fields (metaTitle, metaDescription, ogImage) on sections, and a seed script that creates an admin user and fills all content from the reference screenshots (hero, about, stats, connectivity, amenities, gallery, floor plans, developer, footer). Add .env.example. Then run it, test with curl, and commit.
```

### Prompt 3: Public site, part 1
```
Build the /client public site with Vite + React + Tailwind. Set up routing, an API client, a theme, and a sticky responsive navbar with an Enquire Now button that opens an inquiry modal posting to /api/inquiries. Build the Hero and About sections (with the stats cards) from the reference screenshots, fetching from the API. Mobile-first. Commit.
```

### Prompt 4: Public site, part 2
```
Add the remaining sections, all fetched from the API: Connectivity (3 columns: connectivity, education, recreation), Gallery grid, Amenities grid with lucide icons, video section, Floor Plans table plus plan cards with download PDF, MahaRERA strip, Developer section, CTA banner, Footer. Add skeleton loaders, lazy-loaded images, and react-helmet-async SEO meta from the CMS. Verify on mobile width. Commit.
```

### Prompt 5: Admin dashboard
```
Build the admin at /admin: login page, protected routes, sidebar layout. Pages: Dashboard (counts), Sections editor (a config-driven form per section key, with draft/publish toggle and SEO fields), Amenities, Gallery, Floor Plans (each a DataTable with search, filter, pagination, create/edit/delete, image upload, publish toggle), Inquiries (filter by status, update status, export CSV), Activity Logs (filterable). Reuse components and show validation errors inline. Commit.
```

### Prompt 6: Deploy and docs
```
Prepare deployment: render.yaml (or Render settings notes) for /server, vercel.json for /client with SPA rewrites, env var lists, CORS and cookie settings that work across the two domains (SameSite=None; Secure). Then write README.md (overview, architecture diagram in text, tech stack, setup, env vars, API summary, seeded admin credentials, deployment steps), docs/DATABASE_SCHEMA.md, and export a Postman collection to /docs/postman_collection.json covering every route. Commit.
```

### Prompt 7: Final audit
```
Audit the whole repo against the assignment's mandatory features and evaluation criteria (architecture, UI, backend, database, code quality, performance, documentation). List anything missing or weak, then fix the top issues. Commit.
```
