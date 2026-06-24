# AmeriCloud Site Tracker — Project Reference

## What This Is
An internal tool for AmeriCloud to track and manage telecom site projects. Built as a Next.js web app backed by Supabase.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Form handling | React Hook Form + Zod |
| Database | Supabase (hosted Postgres) |
| Auth | None (Sprint 1 — deferred) |

---

## Color Theme
- Background: `#0B1929` (deep navy)
- Cards: `#112240`
- Borders: `#1E3A5F`
- Accent/CTA: `#C8102E` (AmeriCloud red)
- Text: `#FFFFFF` / `#94A3B8`
- Font: Inter

---

## Project Structure (planned)
```
/
├── app/
│   ├── layout.tsx         # Root layout with header
│   ├── page.tsx           # New project form (Sprint 1 landing page)
│   └── api/
│       └── projects/
│           └── route.ts   # POST endpoint — saves to Supabase
├── components/
│   ├── Header.tsx
│   ├── FormCard.tsx
│   └── forms/
│       └── NewProjectForm.tsx
├── lib/
│   └── supabase.ts        # Supabase client
├── types/
│   └── project.ts         # TypeScript types for project schema
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-06-25-new-project-form-design.md
```

---

## Database

**Supabase table: `projects`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key, auto-generated |
| site_name | text | Required |
| address | text | Required |
| americloud_site_id | text | Required |
| client | text | Required, dropdown |
| client_site_id | text | Optional |
| pm_name | text | Optional |
| pm_email | text | Optional |
| pm_phone | text | Optional |
| rf_engineer_name | text | Optional |
| rf_engineer_email | text | Optional |
| rf_engineer_phone | text | Optional |
| americloud_pm | text | Optional, dropdown |
| americloud_rf | text | Optional, dropdown |
| project_scope | text | Optional |
| project_template | text | Optional, dropdown |
| created_at | timestamptz | Auto-set |

---

## Completed (Sprint 1)
- [x] Design spec approved (`docs/superpowers/specs/2026-06-25-new-project-form-design.md`)

## In Progress
- [ ] Implementation plan (writing-plans)

## To Do — Sprint 1
- [ ] Scaffold Next.js 14 project with TypeScript + Tailwind
- [ ] Set up Supabase project and create `projects` table
- [ ] Build Header component (logo + title)
- [ ] Build NewProjectForm with all field sections
- [ ] Wire up React Hook Form + Zod validation
- [ ] Build POST API route to save to Supabase
- [ ] Success toast notification on submit
- [ ] Responsive layout (mobile/tablet/desktop)

## Deferred (Future Sprints)
- [ ] Project list / dashboard view
- [ ] Edit / delete projects
- [ ] User authentication
- [ ] Real dropdown data from database (clients, PMs, RF engineers)
- [ ] File attachments
- [ ] Role-based permissions

---

## Assets
- `americloud_telecom_solutions_logo.jpg` — Company logo, used in header at 40px height

---

## Specs & Plans
- [New Project Form Design](docs/superpowers/specs/2026-06-25-new-project-form-design.md)
