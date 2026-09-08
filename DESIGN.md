---
name: AmeriCloud Site Tracker
description: Internal telecom project management tool built for field operations teams
colors:
  navy-deep: "#0B1929"
  navy-card: "#112240"
  navy-border: "#1E3A5F"
  navy-readonly: "#0D1F35"
  signal-red: "#C8102E"
  signal-red-deep: "#A50E25"
  slate-mist: "#94A3B8"
  slate-placeholder: "#8899AA"
  error: "#F87171"
  success-bg: "#0D3B26"
  error-bg: "#5C1010"
  milestone-on-time: "#4ade80"
  draft-amber: "#F5C518"
  draft-amber-deep: "#D4A800"
typography:
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.05em"
rounded:
  input: "6px"
  button: "8px"
  card: "12px"
  badge: "9999px"
  login: "16px"
components:
  button-primary:
    backgroundColor: "{colors.signal-red}"
    textColor: "#ffffff"
    rounded: "{rounded.button}"
    padding: "10px 24px"
  button-primary-hover:
    backgroundColor: "{colors.signal-red-deep}"
    textColor: "#ffffff"
    rounded: "{rounded.button}"
    padding: "10px 24px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.slate-mist}"
    rounded: "{rounded.button}"
    padding: "10px 20px"
  input-default:
    backgroundColor: "{colors.navy-deep}"
    textColor: "#ffffff"
    rounded: "{rounded.input}"
    padding: "8px 12px"
  input-readonly:
    backgroundColor: "{colors.navy-readonly}"
    textColor: "{colors.slate-mist}"
    rounded: "{rounded.input}"
    padding: "8px 12px"
  card:
    backgroundColor: "{colors.navy-card}"
    rounded: "{rounded.card}"
    padding: "20px 24px"
---

# Design System: AmeriCloud Site Tracker

## Overview

**Creative North Star: "The Field Command Center"**

AmeriCloud Site Tracker is built for project managers and engineers who track telecom infrastructure from office to field. The visual system communicates competence before color: deep navy creates a low-distraction workspace, Slate Mist handles secondary information without competing for attention, and AmeriCloud Signal Red appears precisely when something demands action. Nothing decorates for its own sake.

The density is deliberate. Milestone tables carry 8-10 columns because that's what the work requires. The system earns information density by controlling color rigorously — when most of the screen is navy and slate, a red button or a green on-time date reads instantly. Comfort comes from weight and spacing, not softness.

Solid and professional is the operating register. Controls feel reliable without being aggressive. A button doesn't shout; it answers. An input doesn't disappear into the page; it sits ready.

**Key Characteristics:**
- Deep-navy ground with tonal surface layering — no light mode
- Signal Red is reserved for primary actions and critical state; its rarity is the point
- Inter at small weights handles density without fatigue
- Radius increases with component scale: inputs tightest, login card widest
- No decorative shadows — depth comes from background-color steps

## Colors

A three-layer navy ground with a single red accent. The palette stays cold and controlled; warmth appears only as an exception (amber for draft actions, green for milestone success).

### Primary
- **Signal Red** (`#C8102E`): The AmeriCloud brand color. Used exclusively for primary CTA buttons, focus rings, active tab indicators, and the sidebar active state. Appears on at most 5–10% of any screen.
- **Signal Red Deep** (`#A50E25`): Hover and pressed state for Signal Red buttons. Never used at rest.

### Neutral
- **Midnight Navy** (`#0B1929`): The page background and all input backgrounds. The deepest surface in the stack.
- **Indigo Panel** (`#112240`): Card and panel surfaces, modals, sidebar background, combobox dropdowns. One step above the page ground.
- **Blueprint Border** (`#1E3A5F`): All borders, dividers, undo bars, and inactive hover backgrounds. The structural skeleton color.
- **Charcoal Read-only** (`#0D1F35`): Read-only input backgrounds and table header rows. Slightly darker than Midnight Navy to signal non-editable state.
- **Slate Mist** (`#94A3B8`): All secondary text, column headers, icon buttons at rest, field labels. The primary information-support color.
- **Placeholder Grey** (`#8899AA`): Input placeholder text. Lighter than Slate Mist to stay clearly subordinate to entered content.

### Tertiary
- **Draft Amber** (`#F5C518`): "Save As Template" action button. Signals a secondary, non-destructive save that creates a reusable artifact.
- **Draft Amber Deep** (`#D4A800`): Hover state for Draft Amber.
- **Milestone Green** (`#4ade80`): Projected date color when an actual date was recorded on time. On-time milestone signal only.
- **Toast Success** (`#0D3B26`): Background of success toast notifications. Dark green that reads clearly on the navy ground.
- **Toast Error** (`#5C1010`): Background of error toast notifications.
- **Validation Red** (`#F87171`): Inline validation error text and error borders. Distinct from Signal Red — this is a warning state, not an action trigger.

### Named Rules
**The One Signal Rule.** Signal Red (`#C8102E`) appears only on primary CTA buttons, the active tab underline, and focus rings. It never colors text, badges, icons-at-rest, or decorative elements. Its scarcity is what makes it readable as "do this now."

**The Amber Exception Rule.** Draft Amber (`#F5C518`) is the only warm color in the system and exists solely for the "Save As Template" action. If a new action warrants amber, reconsider whether it truly belongs in the template-creation family.

## Typography

**Single Font:** Inter (via `next/font/google`), Latin subset. System-UI is the fallback.

**Character:** Inter's geometric neutrality suits dense operational interfaces. At 14px/0.875rem it reads cleanly in multi-column tables without line-height inflation. No display typeface — this tool has no marketing moment.

### Hierarchy
- **Title** (700, 1.25rem / 20px, line-height 1.3): Page headings and modal headings. Used sparingly — one per major surface area.
- **Body** (400, 0.875rem / 14px, line-height 1.5): All field values, table cell content, note text, dropdown options. The default reading size.
- **Body Medium** (500–600, 0.875rem / 14px): Button labels, tab labels, section panel headers.
- **Label** (500, 0.75rem / 12px, letter-spacing 0.05em, uppercase): Column headers in milestone/crew tables and financial grids. The only uppercase context in the system.
- **Caption** (400, 0.75rem / 12px): Timestamps, author attribution, secondary metadata on notes and file entries.

### Named Rules
**The No Display Rule.** There is no display or headline type role in this system. The tool has no hero moment. Large text (`text-xl`) appears only on the app name in the header and modal headings; it never introduces sections or announces content.

**The Label Case Rule.** Uppercase letter-spaced type appears only on table column headers. Form field labels, sidebar nav items, and modal section headings use sentence case.

## Layout

The app uses a persistent sidebar drawer (z-[60], 288px wide when open) with a main content area that spans the remaining viewport width. Content is not max-width-constrained at the route level — tables and forms fill the available space.

**Tab content** is padded inside the project edit view. Milestone and crew tables use `overflow-x-auto` with explicit `min-width` values (680px for milestones, 900px for task scheduler) so they scroll horizontally on mobile rather than collapsing.

**The sticky action bar** (Milestones tab) is `fixed bottom-0 left-0 right-0 z-40`, clearing the sidebar's z-[60]. It holds the quick-note textarea and save controls, allowing users to act without scrolling while reviewing 20–30 milestone rows.

**Spacing rhythm:** 4px base unit (Tailwind default), with `gap-2` (8px) inside table rows, `gap-3`–`gap-4` (12–16px) between sections, `gap-5` (20px) between the milestone table and notes panel. Padding on cards/panels is typically `p-4`–`p-6` (16–24px).

**Responsive breakpoints:**
- Below `md` (768px): milestone table and notes panel stack vertically; task scheduler scrolls horizontally
- `sm` (640px): sidebar nav label hidden in action bar; mobile-optimised project cards on the project list

## Elevation & Depth

This system uses **tonal layering, not shadows**. Depth is expressed entirely through background-color steps: Midnight Navy (`#0B1929`) → Indigo Panel (`#112240`) → Blueprint Border (`#1E3A5F`) as inactive hover. No `box-shadow` appears on cards, inputs, or modals at rest.

The single exception is the sticky action bar, which uses `shadow-[0_-4px_20px_rgba(0,0,0,0.5)]` to visually lift it from the content below. This is functional depth (signaling a layer above scrollable content), not decoration.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. The sticky action bar shadow is the only permitted box-shadow in the application. Any other shadow is a design error.

## Shapes

Rounded corners scale with component size and importance: the smallest interactive targets (inputs, selects, inline task buttons) use `rounded-md` (6px); standard buttons, panels, and combobox dropdowns use `rounded-lg` (8px); large modal dialogs and page-level cards use `rounded-xl` (12px). The login card sits at `rounded-2xl` (16px) as the most prominent presentational surface.

Borders are always `1px solid #1E3A5F`. No border-width variations, no colored borders, no dashed or dotted treatments. Status badges use `rounded-full` (9999px) as the only capsule shape in the system.

**The Three-Tier Radius Rule.** Inputs: 6px. Buttons and panels: 8px. Large containers and modals: 12px. Deviate only for badges (full) and the login card (16px). Do not introduce intermediate values.

## Components

### Buttons
- **Shape:** 8px radius (`rounded-lg`) for all standard buttons; inline micro-buttons within tables use `rounded-md` (6px)
- **Primary (Signal Red):** `bg-[#C8102E]` → hover `bg-[#A50E25]`, white text, 600 weight, uppercase tracking-widest, `px-6 py-2.5`
- **Draft (Amber):** `bg-[#F5C518]` → hover `bg-[#D4A800]`, `text-[#0B1929]` (navy text for contrast), same sizing as primary
- **Ghost:** Transparent background, `border border-[#1E3A5F]`, `text-[#94A3B8]` → hover white text and white border
- **Muted text action:** No border, no background, `text-[#94A3B8]` → hover white. Used for "+ Add Milestone", "+ Add Crew Member" inline row actions
- **Focus:** All buttons receive `focus:ring-2 focus:ring-[#C8102E]` or `focus-visible` outline matching the active color
- **Disabled:** `opacity-60 cursor-not-allowed` on all variants — no color change, just reduced presence

### Inputs / Fields
- **Default:** `bg-[#0B1929] border border-[#1E3A5F] rounded-md`, white text, `#8899AA` placeholder, `focus:ring-2 focus:ring-[#C8102E] focus:border-transparent`
- **Read-only:** `bg-[#0D1F35] border border-[#1E3A5F] rounded-md`, `text-[#94A3B8]`, `cursor-not-allowed`. Used for auto-filled owner email and engineer email
- **Error state:** border shifts to `#F87171`, error message in `text-[#F87171] text-xs` below the field
- **Textarea:** Same tokens as default input; `resize-none` by default; auto-grow on the quick-note in the action bar

### Cards / Containers
- **Background:** `#112240` (Indigo Panel)
- **Border:** `1px solid #1E3A5F`
- **Radius:** `rounded-xl` (12px) for major containers, `rounded-lg` (8px) for inline panels (task editor within milestones)
- **Shadow:** None
- **Internal padding:** `p-4` (16px) for tight contexts, `p-6` (24px) for modals and form cards

### Navigation (Sidebar)
- **Sidebar background:** `#112240`
- **Nav item at rest:** `text-[#94A3B8]`, no background
- **Nav item hover:** `bg-[#1E3A5F]`, white text
- **Nav item active:** `bg-[#1E3A5F]`, white text, icon in `#C8102E`
- **Drawer behavior:** slides in from the left at z-[60] over the page; backdrop `bg-black/50`

### Status Badges
- **Shape:** `rounded-full` (9999px), `px-2.5 py-0.5`, `text-xs font-medium`
- Active/on-time: green tint background, `#4ade80` text/border
- Cancelled: `#334E6A` border, `#94A3B8` text

### Combobox / Searchable Dropdown
- **Input:** same as Input Default tokens
- **Dropdown:** `bg-[#112240] border border-[#1E3A5F] rounded-lg shadow-xl`, appears `z-50`
- **Option at rest:** white text, transparent bg
- **Option hover / keyboard-active:** `bg-[#1E3A5F]`
- **Loading indicator:** `role="status" aria-live="polite"`, `text-[#94A3B8] text-xs`

### Toast Notifications
- **Position:** fixed bottom-right, `z-50`, slides in via `slide-in` keyframe animation (0.3s ease-out)
- **Success:** `bg-[#0D3B26]`, white text, `✓` icon
- **Error:** `bg-[#5C1010]`, white text, `✕` icon
- **Auto-dismiss:** success after 4s, error after 5s

## Do's and Don'ts

### Do:
- **Do** use `#C8102E` Signal Red only for the single primary CTA on each surface and for focus rings. One red button per view is the target.
- **Do** use `text-[#94A3B8]` (Slate Mist) for all labels, secondary text, and icon buttons at rest. Reserve white text for active state and primary content only.
- **Do** use `rounded-md` (6px) on all inputs and `rounded-lg` (8px) on all standard buttons — never swap them.
- **Do** increase border-radius with container scale: 6px → 8px → 12px as the element gets larger and more prominent.
- **Do** express tonal depth through background steps (`#0B1929` → `#112240` → `#1E3A5F`), not shadows.
- **Do** uppercase column headers in tables with `text-xs uppercase tracking-wider font-medium`. This is the only uppercase usage.
- **Do** use `role="alert"` on dynamically-injected error messages and `aria-label` on icon-only buttons.

### Don't:
- **Don't** use Signal Red (`#C8102E`) on text, borders, icons at rest, or background fills other than the primary button. It must stay rare.
- **Don't** add `box-shadow` to cards, inputs, dropdowns, or modals. Only the sticky action bar carries a shadow.
- **Don't** introduce a new color without placing it in this system. The palette is intentionally closed.
- **Don't** use uppercase text outside of table column headers. Sidebar labels, form labels, modal headings, and button labels use sentence case (except "SAVE CHANGES" and similar uppercase button labels that are already established).
- **Don't** use placeholder text as a field label. Every input with a visible label above it must keep that label; placeholder is example text only.
- **Don't** use intermediate radius values (`rounded-sm`, `rounded-3xl`). The three-tier radius system (6 / 8 / 12px) is the constraint.
- **Don't** create a light-mode variant. The system is dark-only and the palette has no light equivalents.
