# AmeriCloud Site Tracker — Sidebar Navigation Design

**Date:** 2026-07-21  
**Sprint:** 3  
**Status:** Approved

---

## Overview

Add a collapsible sidebar navigation drawer to the AmeriCloud Site Tracker. A hamburger button (☰) in the top header opens the sidebar; clicking it again (now showing ✕), clicking the backdrop, or pressing Escape closes it. The sidebar provides links to the two primary destinations: the project list and the new project form.

---

## Tech Stack

Same as Sprints 1–2: Next.js 16 (App Router), TypeScript, Tailwind v4, React (client components for interactivity).

---

## Color Palette

Inherits from existing design:

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#0B1929` | Page background |
| Card | `#112240` | Sidebar background |
| Border | `#1E3A5F` | Sidebar right border, dividers |
| Accent | `#C8102E` | Active nav item left bar, active text |
| Text primary | `#FFFFFF` | Active nav label |
| Text secondary | `#94A3B8` | Inactive nav labels, hamburger icon |

---

## Architecture

### State Management

A `SidebarProvider` client component wraps the root layout and owns `sidebarOpen: boolean` state plus a `toggleSidebar` / `closeSidebar` function. It provides these via React context (`SidebarContext`). This keeps the root `layout.tsx` a server component — only the provider is a client boundary.

### Component Responsibilities

| Component | Type | Responsibility |
|-----------|------|---------------|
| `components/SidebarProvider.tsx` | Client | Owns `sidebarOpen` state, provides context |
| `components/Sidebar.tsx` | Client | Drawer UI, nav links, backdrop, Escape key listener |
| `components/Header.tsx` | Client (modified) | Reads context to render ☰/✕ button and call toggle |
| `app/layout.tsx` | Server (modified) | Wraps children in `SidebarProvider` |

### Data Flow

```
SidebarProvider (state: sidebarOpen)
├── Header (reads context → shows ☰/✕, calls toggleSidebar)
└── Sidebar (reads context → shows/hides drawer, calls closeSidebar)
```

---

## Routing

No new routes. The sidebar links to existing pages:

| Label | Route |
|-------|-------|
| Projects | `/` |
| New Project | `/projects/new` |

The edit page (`/projects/[id]/edit`) is accessed contextually from table row action buttons — it is not a sidebar nav item.

---

## Sidebar Component

### Layout

- Fixed position: `top: 0, left: 0, bottom: 0, width: 260px`
- `z-index`: above the header (`z-60` or equivalent)
- Background: `#112240`, right border: `1px solid #1E3A5F`
- Slides in/out: CSS transition `transform: translateX(-100%)` (closed) → `translateX(0)` (open), duration `300ms ease-in-out`

### Header Section

- AmeriCloud logo (same `americloud_telecom_solutions_logo.jpg`, 40px height)
- "AmeriCloud Site Tracker" text in white, `font-semibold`
- Close button (✕) aligned to the right of this section
- Divider line (`#1E3A5F`) below the header section

### Nav Links

Each link is a `next/link` `<Link>` component:

- **Inactive state:** `#94A3B8` text, transparent background, no left bar
- **Active state:** white text, subtle `#0B1929` background, `4px solid #C8102E` left accent bar
- Active state determined by `usePathname()` — exact match for `/`, prefix match for `/projects/new`
- Hover state: `#1E3A5F` background, white text
- Clicking a nav link closes the sidebar (calls `closeSidebar`)

Nav items in order:
1. Projects (icon: grid/list — a simple 3-line list icon inline SVG)
2. New Project (icon: plus circle — a simple `+` circle inline SVG)

### Backdrop

- Full-screen fixed overlay behind the sidebar: `rgba(0,0,0,0.5)`
- `z-index` below sidebar, above page content
- Clicking it calls `closeSidebar`
- Only rendered when `sidebarOpen` is true

### Keyboard

- `Escape` key closes the sidebar when open
- Implemented via `useEffect` with a `keydown` listener in `Sidebar.tsx`

---

## Header Modifications

The existing `Header` component becomes a client component (`'use client'`). Changes:

- Reads `sidebarOpen` and `toggleSidebar` from `SidebarContext`
- Adds a hamburger/close button as the **leftmost** element (before the logo):
  - Shows `☰` (three horizontal lines, inline SVG) when sidebar is closed
  - Shows `✕` (inline SVG) when sidebar is open
  - Button color: `#94A3B8`, hover: white
  - `aria-label`: `"Open navigation"` / `"Close navigation"`

---

## Layout Changes

`app/layout.tsx` wraps `<Header />` and `{children}` inside `<SidebarProvider>`:

```tsx
<SidebarProvider>
  <Header />
  <Sidebar />
  <main className="pt-20 pb-16">{children}</main>
</SidebarProvider>
```

`<main>` padding is unchanged — the sidebar overlays content, it does not push it.

---

## Accessibility

- Hamburger button has `aria-label` and `aria-expanded={sidebarOpen}`
- Sidebar has `role="navigation"` and `aria-label="Main navigation"`
- Backdrop has `aria-hidden="true"`
- Focus is not trapped in the sidebar (out of scope for Sprint 3)

---

## Out of Scope (Sprint 3)

- Focus trapping inside the open sidebar
- Mobile-specific breakpoint behavior (sidebar behavior is the same on all screen sizes)
- Additional nav items beyond Projects and New Project
- Sidebar remembering its open/closed state across page loads
- Nested nav sections or sub-menus
