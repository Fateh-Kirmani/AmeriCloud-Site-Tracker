# AmeriCloud Site Tracker — Tabbed Project Form Design

**Date:** 2026-07-24
**Sprint:** 4
**Status:** Approved

---

## Overview

Add a tabbed interface to the Edit Project form with four tabs: General Information, Milestones, Files, and Team. The New Project form remains unchanged (General Info only). Milestones and Team use dynamic row tables. Files uses Supabase Storage for per-project file storage.

---

## Tech Stack

Same as Sprints 1–3: Next.js 16 (App Router), TypeScript, Tailwind v4, Supabase (Postgres + Storage), React Hook Form + Zod, Jest + React Testing Library.

---

## Color Palette

Inherits from existing design:

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#0B1929` | Page background |
| Card | `#112240` | Tab content background |
| Border | `#1E3A5F` | Tab borders, row separators |
| Accent | `#C8102E` | Active tab indicator |
| Text primary | `#FFFFFF` | Labels, active tab |
| Text secondary | `#94A3B8` | Inactive tab labels, placeholder text |

---

## Scope

### In Scope
- Tabbed UI on the Edit Project form only
- Milestones tab: dynamic row table, save/delete
- Files tab: Supabase Storage upload, list, delete
- Team tab: dynamic row table with milestone-linked Task dropdown, save/delete
- New Supabase tables: `milestones`, `team_members`, `project_files`
- New Supabase Storage bucket: `project-files`
- Seven new API routes

### Out of Scope
- New Project form tabs (General Info only, unchanged)
- SharePoint or any external file storage
- File preview/inline viewing
- Milestone reordering
- Authentication or permissions
- Focus trapping in modals

---

## Architecture

### Tab Structure

The Edit Project form (`app/projects/[id]/edit/page.tsx` + `components/forms/EditProjectForm.tsx`) gains a tab bar at the top. Clicking a tab swaps the content area. Tab state is local (not in the URL).

```
[ General Information ] [ Milestones ] [ Files ] [ Team ]
────────────────────────────────────────────────────────
[  tab content area                                     ]
```

The New Project form (`components/forms/NewProjectForm.tsx`) is not modified.

### Component Responsibilities

| Component | Type | Responsibility |
|-----------|------|----------------|
| `components/forms/EditProjectForm.tsx` | Client | Tab bar + tab switching state |
| `components/project-tabs/MilestonesTab.tsx` | Client | Milestone rows, fetch, save, delete |
| `components/project-tabs/FilesTab.tsx` | Client | File list, upload modal, delete |
| `components/project-tabs/TeamTab.tsx` | Client | Team member rows, fetch, save, delete |

General Information tab content stays inline in `EditProjectForm.tsx` (existing 4 FormCards).

---

## Database Schema

### Table: `milestones`

```sql
create table milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  details text,
  owner text,
  projected_date date,
  actualized_date date,
  notes text,
  created_at timestamptz not null default now()
);
```

### Table: `team_members`

```sql
create table team_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text,
  task_milestone_id uuid references milestones(id) on delete set null,
  date_from date,
  date_to date,
  created_at timestamptz not null default now()
);
```

### Table: `project_files`

```sql
create table project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  file_name text not null,
  file_type text,
  storage_path text not null,
  created_at timestamptz not null default now()
);
```

### Supabase Storage Bucket

- **Bucket name:** `project-files`
- **Access:** private (files accessed via signed URLs, 1-hour expiry)
- **Path convention:** `projects/{project_id}/{file_name}`
- **On duplicate filename:** overwrite (upsert behavior via `upsert: true`)

---

## API Routes

All routes are under `app/api/projects/[id]/`. All require the project to exist; return 404 if not found. `params` is `Promise<{ id: string }>` (Next.js 16 — must be awaited).

### GET `/api/projects/[id]/milestones`
Returns all milestones for the project ordered by `created_at` asc.
```json
[{ "id": "...", "details": "...", "owner": "...", "projected_date": "...", "actualized_date": "...", "notes": "..." }]
```

### PUT `/api/projects/[id]/milestones`
Full save: accepts the complete current state of milestone rows. Reconciles against DB.

Request body:
```json
{
  "milestones": [
    { "id": "existing-uuid", "details": "...", "owner": "...", "projected_date": "...", "actualized_date": "...", "notes": "..." },
    { "details": "new row (no id)", "owner": "...", "projected_date": null, "actualized_date": null, "notes": "" }
  ],
  "deleted_ids": ["uuid-to-delete", "uuid-to-delete"]
}
```

Logic:
1. Delete rows in `deleted_ids` (this triggers `SET NULL` on `team_members.task_milestone_id` via FK constraint)
2. Upsert rows that have an `id`
3. Insert rows that have no `id`

Returns: `{ milestones: [...] }` with all rows after save.

### GET `/api/projects/[id]/team`
Returns all team members for the project, plus milestones for the Task dropdown.
```json
{
  "team_members": [{ "id": "...", "name": "...", "task_milestone_id": "...", "date_from": "...", "date_to": "..." }],
  "milestones": [{ "id": "...", "details": "..." }]
}
```

### PUT `/api/projects/[id]/team`
Same reconcile pattern as milestones PUT.

Request body:
```json
{
  "team_members": [
    { "id": "existing-uuid", "name": "...", "task_milestone_id": "uuid-or-null", "date_from": "...", "date_to": "..." },
    { "name": "new row", "task_milestone_id": null, "date_from": null, "date_to": null }
  ],
  "deleted_ids": ["uuid-to-delete"]
}
```

Returns: `{ team_members: [...] }` with all rows after save.

### GET `/api/projects/[id]/files`
Returns file metadata with signed URLs (1-hour expiry).
```json
[{ "id": "...", "file_name": "...", "file_type": "...", "created_at": "...", "url": "https://..." }]
```

### POST `/api/projects/[id]/files`
Upload a file. Accepts `multipart/form-data` with fields:
- `file`: the file binary
- `file_type`: string (free text)

Logic:
1. Upload to Supabase Storage at `projects/{project_id}/{file_name}` (upsert: true)
2. Insert record into `project_files`

Returns: `{ id: "...", file_name: "...", file_type: "...", created_at: "...", url: "..." }`

### DELETE `/api/projects/[id]/files/[fileId]`
Deletes file from Supabase Storage and removes the `project_files` record.
Returns: `{ success: true }`

---

## Component Designs

### Tab Bar

Rendered at the top of `EditProjectForm`. Four tabs: General Information, Milestones, Files, Team.

- Active tab: white text, `2px solid #C8102E` bottom border
- Inactive tab: `#94A3B8` text, no border, hover: white text
- Tab bar bottom border: `1px solid #1E3A5F` spanning full width

```tsx
const TABS = ['General Information', 'Milestones', 'Files', 'Team'] as const
type Tab = typeof TABS[number]
const [activeTab, setActiveTab] = useState<Tab>('General Information')
```

### MilestonesTab

- On mount: fetches `GET /api/projects/[id]/milestones`, populates rows
- Local state: `rows` (array of milestone objects, each with optional `id`), `deletedIds` (uuid[])
- Row fields (left to right): Details (flex-2), Owner (flex-1), Projected Date (date input), Actualized Date (date input), Notes (flex-1), delete icon button
- Add Milestone: appends `{ details: '', owner: '', projected_date: '', actualized_date: '', notes: '' }` to rows
- Delete icon: if row has `id`, push to `deletedIds` and remove from `rows`; if no `id`, just remove from `rows`
- Save Changes: POST `PUT /api/projects/[id]/milestones` with `{ milestones: rows, deleted_ids: deletedIds }`, reset `deletedIds` to `[]` on success
- Loading state: Save button shows "Saving..." and is disabled
- Error state: red error message below the Save button
- Empty state (no rows): "No milestones added yet." message, Add Milestone button still shown

### FilesTab

- On mount: fetches `GET /api/projects/[id]/files`, populates file list
- File list table columns: Name (clickable link → opens signed URL in new tab), Type, Uploaded (formatted date), delete icon
- Empty state: "No files uploaded yet."
- Delete: calls `DELETE /api/projects/[id]/files/[fileId]`, removes from list on success
- Upload File button: opens upload modal

**Upload Modal:**
- Fields: file input (`<input type="file">`), Type (text input, free text)
- Buttons: Cancel (closes modal), Upload (submits)
- On Upload: constructs `FormData`, POSTs to `/api/projects/[id]/files`, shows loading state on button
- On success: closes modal, refreshes file list
- On error: shows error message inside modal, keeps modal open
- File size limit: none enforced client-side (Supabase free tier cap is 50MB per file)

### TeamTab

- On mount: fetches `GET /api/projects/[id]/team`, populates rows and milestone options
- Row fields: Name (text input), Task (select dropdown), Date From (date input), Date To (date input), delete icon
- Task dropdown options: one `<option>` per project milestone (value = milestone id, label = milestone details). If no milestones: single disabled option "No milestones added yet."
- If a team member's `task_milestone_id` is null (milestone was deleted): dropdown shows blank/unselected
- Add Team Member: appends `{ name: '', task_milestone_id: '', date_from: '', date_to: '' }` to rows
- Delete and Save logic: identical pattern to MilestonesTab
- Empty state: "No team members added yet."

---

## Routing

No new pages. Existing routes unchanged:
- `/projects/new` — NewProjectForm (no tabs, no change)
- `/projects/[id]/edit` — EditProjectForm (gains tab bar)

New API routes added under existing `app/api/projects/[id]/` directory:
- `app/api/projects/[id]/milestones/route.ts`
- `app/api/projects/[id]/team/route.ts`
- `app/api/projects/[id]/files/route.ts`
- `app/api/projects/[id]/files/[fileId]/route.ts`

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Milestones/Team fetch fails | Show "Failed to load. Please refresh." in the tab content area |
| Milestones/Team save fails | Show error message below Save Changes button; rows not cleared |
| File list fetch fails | Show "Failed to load files. Please refresh." |
| File upload fails | Show error inside upload modal; modal stays open |
| File delete fails | Show inline error; file remains in list |
| Project not found (API) | 404 response |
| Storage upload error | 500 response with message |

---

## Accessibility

- Tab bar buttons have `role="tab"`, `aria-selected`, `aria-controls`
- Tab panels have `role="tabpanel"`, `aria-labelledby`
- All icon delete buttons have `aria-label="Delete milestone"` / `aria-label="Delete team member"` / `aria-label="Delete file"`
- Upload modal traps focus (focus returns to Upload File button on close)
- File links open in new tab with `target="_blank" rel="noopener noreferrer"`

---

## Testing

- `__tests__/components/project-tabs/MilestonesTab.test.tsx` — fetch, add row, delete row, save, error states
- `__tests__/components/project-tabs/FilesTab.test.tsx` — fetch, upload modal open/close, upload success/error, delete
- `__tests__/components/project-tabs/TeamTab.test.tsx` — fetch, add row, milestone dropdown populates, save
- `__tests__/components/forms/EditProjectForm.test.tsx` — tab switching renders correct content
- `__tests__/api/projects/[id]/milestones.test.ts` — GET, PUT (insert/upsert/delete), 404
- `__tests__/api/projects/[id]/team.test.ts` — GET, PUT, 404
- `__tests__/api/projects/[id]/files.test.ts` — GET (signed URLs), POST (upload), DELETE, 404
