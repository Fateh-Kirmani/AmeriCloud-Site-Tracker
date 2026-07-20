# AmeriCloud Site Tracker — Project List Design

**Date:** 2026-07-20
**Sprint:** 2
**Status:** Approved

---

## Overview

A project list page that becomes the new home page of the Site Tracker. Displays all recorded projects in a sortable, filterable table. Any user can edit or delete projects (no authentication required in Sprint 2). The New Project form moves from `/` to `/projects/new`.

---

## Tech Stack

Same as Sprint 1: Next.js 16 (App Router), TypeScript, Tailwind v4, Supabase (hosted Postgres), React Hook Form + Zod, Jest + React Testing Library.

---

## Routing Changes

| Route | Page |
|-------|------|
| `/` | **New** — Project list (replaces Sprint 1 New Project form) |
| `/projects/new` | **New** — New Project form (moved from `/`) |
| `/projects/[id]/edit` | **New** — Edit Project form |

---

## Architecture

### Data Fetching Strategy
- The list page (`/`) and edit page (`/projects/[id]/edit`) are **Next.js server components** — data is fetched directly from Supabase server-side at request time. No client-side loading spinners for initial data.
- **Filters and sort** are stored as **URL search params** (e.g. `?search=tower&client=AT%26T&sort=site_name&dir=asc`). The server component reads these params, builds the Supabase query, and renders the filtered result. Filter changes trigger a navigation that re-renders the server component.
- The `FilterPanel` and `DeleteConfirmModal` are **client components** (interactive), embedded inside the server-rendered page.

### API Routes
Three new/modified route files:

| Route | Method | Purpose |
|-------|--------|---------|
| `app/api/projects/route.ts` | GET (new) | List projects with optional filters + sort |
| `app/api/projects/[id]/route.ts` | PUT | Update a project by ID |
| `app/api/projects/[id]/route.ts` | DELETE | Delete a project by ID |

The existing `POST /api/projects` in `app/api/projects/route.ts` is unchanged.

---

## Pages & Components

### New Files

| File | Type | Responsibility |
|------|------|---------------|
| `app/projects/new/page.tsx` | Server component | New Project page (wraps existing `NewProjectForm`) |
| `app/projects/[id]/edit/page.tsx` | Server component | Fetches project by ID, renders `EditProjectForm` |
| `components/projects/ProjectsTable.tsx` | Client component | Sortable table with Edit/Delete action buttons per row |
| `components/projects/FilterPanel.tsx` | Client component | Search input + Client/Template/AmeriCloud PM dropdowns + date range pickers |
| `components/projects/DeleteConfirmModal.tsx` | Client component | Confirmation dialog — "Delete [Site Name]? This cannot be undone." |
| `components/forms/EditProjectForm.tsx` | Client component | Pre-filled edit form — same fields/validation as `NewProjectForm`, submits PUT |
| `app/api/projects/[id]/route.ts` | API route | PUT (update) + DELETE handlers |

### Modified Files

| File | Change |
|------|--------|
| `app/page.tsx` | Replaced — now renders the project list (server component) |
| `app/api/projects/route.ts` | GET handler added alongside existing POST |
| `types/project.ts` | Add `Project` type (full DB row including `id` and `created_at`) |

---

## Filter Panel

Always visible above the table. Each change updates the URL and triggers a server re-fetch.

| Filter | UI Control | URL Param | Supabase filter |
|--------|-----------|-----------|-----------------|
| Search | Text input (debounced 300ms) | `search` | `ilike` on site_name, client, address, client_site_id, americloud_site_id |
| Client | Dropdown + "All Clients" default | `client` | `eq` on client |
| Project Template | Dropdown + "All Templates" default | `template` | `eq` on project_template |
| AmeriCloud PM | Dropdown + "All PMs" default | `pm` | `eq` on americloud_pm |
| Date From | Date input | `from` | `gte` on created_at |
| Date To | Date input | `to` | `lte` on created_at |

A **"Clear filters"** button resets all params and navigates to `/`.

Dropdown values are the same hardcoded lists as the New Project form (AT&T, Verizon, etc.). Not fetched from the database in Sprint 2.

---

## Project Table

### Columns

| Column | Field | Sortable |
|--------|-------|---------|
| Site Name | `site_name` | Yes |
| Client | `client` | Yes |
| Address | `address` | No |
| Client Site ID | `client_site_id` | No |
| AmeriCloud Site ID | `americloud_site_id` | Yes |
| Actions | — | No |

### Sorting
- Clicking a sortable column header toggles asc → desc → asc.
- Active sort column shows a directional arrow indicator.
- Sort stored in URL params: `sort=site_name&dir=asc`.
- Default: sorted by `created_at` descending (newest first), no indicator shown.

### Actions Column
Each row has two icon buttons:
- **Edit** (pencil icon) — navigates to `/projects/[id]/edit`
- **Delete** (trash icon) — opens `DeleteConfirmModal` with the project's ID and site name

### Empty States
- **No projects exist:** Centered message "No projects yet." with a "Create your first project →" button linking to `/projects/new`.
- **Filters return no results:** Centered message "No projects match your filters." with a "Clear filters" link.

### Visual Design
- Table background: `#112240` (card color)
- Header row: slightly darker background, uppercase labels, `#94A3B8` text
- Row hover: subtle highlight (`#1E3A5F` background)
- Alternating rows: none — hover state provides sufficient visual separation
- Border between rows: `1px solid #1E3A5F`
- Action buttons: icon-only, `#94A3B8` default, white on hover. Delete button turns `#C8102E` on hover.

---

## Edit Page (`/projects/[id]/edit`)

- Server component fetches project by ID from Supabase.
- If project not found: renders a "Project not found" message with a link back to `/`.
- Passes the fetched project data to `EditProjectForm` (client component).
- Page title: "Edit Project" — subtitle: the site name of the project being edited.
- `EditProjectForm` reuses the same 5-card layout, fields, and Zod schema as `NewProjectForm`.
- On successful submit (`PUT /api/projects/[id]`): shows success toast "Project updated successfully", then redirects to `/`.
- "Cancel" button: navigates back to `/` without saving.
- On API error: shows error toast "Failed to update project", form remains editable.

---

## Delete Confirmation Modal

- Triggered by the Delete icon button on a table row.
- Renders as a centered overlay with a dark semi-transparent backdrop (`rgba(0,0,0,0.6)`).
- Modal card uses the standard `#112240` card color with `#1E3A5F` border.
- Content:
  - Heading: "Delete Project?"
  - Body: "**[Site Name]** will be permanently deleted. This action cannot be undone."
  - Two buttons: "Cancel" (secondary, closes modal) and "Delete" (red `#C8102E`, calls `DELETE /api/projects/[id]`)
- Delete button shows a loading state while the request is in flight.
- On success: modal closes, the deleted row is removed from the table without a full page reload (optimistic removal), success toast "Project deleted".
- On error: error toast "Failed to delete project", modal stays open, Delete button re-enables.

---

## API Route Details

### GET `/api/projects`
Accepts query params: `search`, `client`, `template`, `pm`, `from`, `to`, `sort`, `dir`.
Returns an array of all matching project rows ordered by the requested sort.

### PUT `/api/projects/[id]`
Body: same shape as POST (all `projectSchema` fields).
Validates with `projectSchema`, then calls Supabase `.update()` on the row matching `id`.
Returns `200` with the updated row, `400` on validation error, `404` if row not found, `500` on DB error.

### DELETE `/api/projects/[id]`
No body. Calls Supabase `.delete()` on the row matching `id`.
Returns `200` with `{ success: true }`, `404` if row not found, `500` on DB error.

---

## Error Handling

| Scenario | Behaviour |
|----------|-----------|
| Supabase fetch fails on list page | Server renders an error message: "Failed to load projects. Please refresh." |
| Edit page — project not found | Renders "Project not found" with a link back to `/` |
| PUT returns 400 | Field-level validation errors shown inline (same as New Project form) |
| PUT returns 500 | Error toast "Failed to update project" |
| DELETE returns 500 | Error toast "Failed to delete project", modal stays open |

---

## Validation

`EditProjectForm` uses the same `projectSchema` from `types/project.ts` — identical required fields, optional fields, and email format rules.

---

## Out of Scope (Sprint 2)

- User authentication or role-based access control
- Pagination (all projects fetched; acceptable for early usage volume)
- Bulk delete
- Export to CSV
- Project detail view (read-only)
- Real dropdown data from the database
