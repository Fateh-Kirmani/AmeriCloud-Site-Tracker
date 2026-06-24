# AmeriCloud Site Tracker — New Project Form Design

**Date:** 2026-06-25  
**Sprint:** 1  
**Status:** Approved  

---

## Overview

A landing page for creating new telecom site projects internally at AmeriCloud. Users fill out a structured form capturing site details, client info, customer contacts, AmeriCloud team assignments, and project scope. On submission, the data is persisted to a Supabase (PostgreSQL) database.

---

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | Next.js 14 (App Router) + TypeScript | Full-stack, built-in routing, easy API routes for Supabase |
| Styling | Tailwind CSS | Fast, consistent, responsive by default |
| Form | React Hook Form + Zod | Validation, error states, minimal re-renders |
| Database | Supabase (hosted Postgres) | Managed, free tier, easy Next.js integration |
| Auth | None (Sprint 1) | Internal tool, deferred to later sprint |

---

## Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#0B1929` | Page background |
| Card | `#112240` | Form section cards |
| Border | `#1E3A5F` | Card and input borders |
| Accent | `#C8102E` | Red — buttons, focus rings, required asterisks, card accent bars |
| Text primary | `#FFFFFF` | Headings, input values |
| Text secondary | `#94A3B8` | Labels, placeholder text |

Font: **Inter** (Google Fonts)

---

## Page Structure

### Header (fixed, full-width)
- Dark navy background (`#0B1929`)
- AmeriCloud logo (40px height) left-aligned
- "AmeriCloud Site Tracker" title in white, next to logo

### Body
- Page title: "New Project" (large, white, bold)
- Form laid out in a responsive card grid

### Card Layout (desktop: 2-column grid, mobile: single column)

```
Row 1: [Site Information]       [Client & IDs]
Row 2: [Customer Contact — full width]
Row 3: [AmeriCloud Team]        [Project Details]
Row 4: [Create Project button — full width, red]
```

---

## Form Fields

### Site Information
| Field | Type | Required |
|-------|------|----------|
| Site Name | Text input | Yes |
| Address | Text input | Yes |
| AmeriCloud Site ID | Text input | Yes |

### Client & IDs
| Field | Type | Required |
|-------|------|----------|
| Client | Dropdown | Yes |
| Client Site ID | Text input | No |

### Customer Contact (full-width card, two sub-columns)

**PM Information**
| Field | Type | Required |
|-------|------|----------|
| Name | Text input | No |
| Email | Email input | No |
| Phone | Tel input | No |

**RF Engineer Information**
| Field | Type | Required |
|-------|------|----------|
| Name | Text input | No |
| Email | Email input | No |
| Phone | Tel input | No |

### AmeriCloud Team
| Field | Type | Required |
|-------|------|----------|
| AmeriCloud PM | Dropdown | No |
| AmeriCloud RF | Dropdown | No |

### Project Details
| Field | Type | Required |
|-------|------|----------|
| Project Scope | Textarea | No |
| Project Template | Dropdown | No |

---

## Dropdown Placeholder Data

**Client:** AT&T, Verizon, T-Mobile, Crown Castle, SBA Communications  
**AmeriCloud PM:** John Smith, Sarah Johnson, Mike Davis  
**AmeriCloud RF:** Robert Chen, Lisa Park, David Wilson  
**Project Template:** Standard Cell Tower, Small Cell, DAS, Rooftop  

---

## Visual Design Details

- **Cards:** `#112240` background, `#1E3A5F` border, subtle box shadow, left red accent bar on card header
- **Inputs:** Dark navy fill, `#1E3A5F` border, white text, red focus ring on focus
- **Labels:** Uppercase, small tracking, `#94A3B8` color
- **Required fields:** Red asterisk next to label
- **Sub-section headers** (inside Customer Contact): white bold text, light gray divider line between PM and RF sections
- **Submit button:** Full-width, solid `#C8102E`, white text, hover darkens to `#A50E25`
- **Error states:** Red border on field, small red error message below
- **Success state:** Toast notification ("Project created successfully") slides in from top-right, auto-dismisses after 4 seconds
- **API error state:** Toast notification ("Something went wrong. Please try again.") in red, auto-dismisses after 5 seconds. Submit button re-enables.
- **Logo:** `americloud_telecom_solutions_logo.jpg` copied to `public/` directory; referenced via Next.js `<Image>` component at 40px height in header

---

## Validation Rules

| Field | Rule |
|-------|------|
| Site Name | Required, non-empty string |
| Address | Required, non-empty string |
| AmeriCloud Site ID | Required, non-empty string |
| Client | Required, must select a value |
| PM Email / RF Email | Valid email format (if provided) |
| PM Phone / RF Phone | Basic phone format (if provided) |
| All others | Optional |

---

## Database Schema (Supabase)

**Table: `projects`**

```sql
create table projects (
  id uuid primary key default gen_random_uuid(),
  site_name text not null,
  address text not null,
  americloud_site_id text not null,
  client text not null,
  client_site_id text,
  pm_name text,
  pm_email text,
  pm_phone text,
  rf_engineer_name text,
  rf_engineer_email text,
  rf_engineer_phone text,
  americloud_pm text,
  americloud_rf text,
  project_scope text,
  project_template text,
  created_at timestamptz default now()
);
```

---

## Responsive Behavior

- **Desktop (≥1024px):** 2-column card grid
- **Tablet (768px–1023px):** 2-column grid, tighter padding
- **Mobile (<768px):** Single column, all cards full-width, inputs full-width

---

## Out of Scope (Sprint 1)

- User authentication / login
- Project list / dashboard view
- Edit or delete existing projects
- File attachments
- Role-based permissions
- Real client/PM/RF data from a database (deferred — using hardcoded placeholder lists)
