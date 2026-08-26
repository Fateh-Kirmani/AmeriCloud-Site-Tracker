# Import to BOM Estimator Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "Import to BOM Estimator" link/button to each project's General Information tab that opens the BOM Estimator app in a new tab, pointed at its `/import` route with this project's Client, Project Name, Job Site Address, and Project Scope encoded as query params.

**Architecture:** A pure helper (`formatJobSiteAddress`) joins the four address fields into one string; a small client component (`ImportToBomButton`) builds the target URL and renders it as a plain `<a target="_blank">`; `EditProjectForm.tsx` wires it in using the form's live (`watch()`-backed) values so it reflects unsaved edits, same as the rest of the form.

**Tech Stack:** Next.js 16 App Router, React Hook Form, Jest + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-08-26-site-tracker-import-design.md`

## Global Constraints

- The BOM Estimator's base URL comes from `process.env.NEXT_PUBLIC_BOM_ESTIMATOR_URL`, defaulting to `https://americloud-das-pricing-calculator.vercel.app` when unset (same `?? 'default'` pattern already used for `NEXT_PUBLIC_FINANCE_PASSWORD` in `components/project-tabs/FinanceTab.tsx`).
- The four query params sent are exactly: `client`, `project`, `jobSiteAddress`, `projectOverview` — matching the BOM `/import` route's expected param names (spec, "BOM Estimator side").
- Missing optional address parts (state/zip) must not produce stray commas/spaces in the joined address.
- The button reads current form values (`watch()`), not the original `project` prop, so it reflects unsaved edits on screen.

---

### Task 1: `formatJobSiteAddress` helper

**Files:**
- Create: `lib/formatJobSiteAddress.ts`
- Test: `__tests__/lib/formatJobSiteAddress.test.ts`

**Interfaces:**
- Produces: `formatJobSiteAddress(street, city, state, zipCode) => string`, each param `string | null | undefined`. Used by Task 2's `ImportToBomButton`.

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/formatJobSiteAddress.test.ts`:

```ts
import { formatJobSiteAddress } from '@/lib/formatJobSiteAddress'

describe('formatJobSiteAddress', () => {
  it('joins all four parts with the standard comma layout', () => {
    expect(formatJobSiteAddress('123 Main St', 'New York', 'NY', '10001'))
      .toBe('123 Main St, New York, NY 10001')
  })

  it('omits state and zip cleanly when both are missing', () => {
    expect(formatJobSiteAddress('123 Main St', 'New York', '', ''))
      .toBe('123 Main St, New York')
  })

  it('omits zip cleanly when only zip is missing', () => {
    expect(formatJobSiteAddress('123 Main St', 'New York', 'NY', ''))
      .toBe('123 Main St, New York, NY')
  })

  it('treats null/undefined the same as empty string', () => {
    expect(formatJobSiteAddress('123 Main St', 'New York', null, undefined))
      .toBe('123 Main St, New York')
  })

  it('returns an empty string when every part is missing', () => {
    expect(formatJobSiteAddress('', '', '', '')).toBe('')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest __tests__/lib/formatJobSiteAddress.test.ts`
Expected: FAIL — `Cannot find module '@/lib/formatJobSiteAddress'`.

- [ ] **Step 3: Write the implementation**

Create `lib/formatJobSiteAddress.ts`:

```ts
// lib/formatJobSiteAddress.ts
export function formatJobSiteAddress(
  street: string | null | undefined,
  city: string | null | undefined,
  state: string | null | undefined,
  zipCode: string | null | undefined
): string {
  const line1 = street?.trim() || ''
  const stateZip = [state?.trim(), zipCode?.trim()].filter(Boolean).join(' ')
  const line2 = [city?.trim(), stateZip].filter(Boolean).join(', ')
  return [line1, line2].filter(Boolean).join(', ')
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest __tests__/lib/formatJobSiteAddress.test.ts`
Expected: PASS (5/5 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/formatJobSiteAddress.ts __tests__/lib/formatJobSiteAddress.test.ts
git commit -m "feat: add formatJobSiteAddress helper"
```

---

### Task 2: `ImportToBomButton` component

**Files:**
- Create: `components/forms/ImportToBomButton.tsx`
- Test: `__tests__/components/forms/ImportToBomButton.test.tsx`

**Interfaces:**
- Consumes: `formatJobSiteAddress(street, city, state, zipCode) => string` from Task 1 (`@/lib/formatJobSiteAddress`).
- Produces: default export `ImportToBomButton(props: { client: string; project: string; street: string; city: string; state: string; zipCode: string; projectOverview: string })`, a React component rendering one `<a>`. Used by Task 3 inside `EditProjectForm.tsx`.

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/forms/ImportToBomButton.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import ImportToBomButton from '@/components/forms/ImportToBomButton'

describe('ImportToBomButton', () => {
  const props = {
    client: 'AT&T',
    project: 'Test Site',
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    projectOverview: 'Install new DAS equipment.',
  }

  it('links to the BOM Estimator /import route with the four fields encoded', () => {
    render(<ImportToBomButton {...props} />)
    const link = screen.getByRole('link', { name: /import to bom estimator/i })
    const url = new URL(link.getAttribute('href')!)

    expect(url.origin + url.pathname).toBe('https://americloud-das-pricing-calculator.vercel.app/import')
    expect(url.searchParams.get('client')).toBe('AT&T')
    expect(url.searchParams.get('project')).toBe('Test Site')
    expect(url.searchParams.get('jobSiteAddress')).toBe('123 Main St, New York, NY 10001')
    expect(url.searchParams.get('projectOverview')).toBe('Install new DAS equipment.')
  })

  it('opens in a new tab safely', () => {
    render(<ImportToBomButton {...props} />)
    const link = screen.getByRole('link', { name: /import to bom estimator/i })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('omits missing state/zip from the encoded address without crashing', () => {
    render(<ImportToBomButton {...props} state="" zipCode="" />)
    const link = screen.getByRole('link', { name: /import to bom estimator/i })
    const url = new URL(link.getAttribute('href')!)
    expect(url.searchParams.get('jobSiteAddress')).toBe('123 Main St, New York')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest __tests__/components/forms/ImportToBomButton.test.tsx`
Expected: FAIL — `Cannot find module '@/components/forms/ImportToBomButton'`.

- [ ] **Step 3: Write the implementation**

Create `components/forms/ImportToBomButton.tsx`:

```tsx
// components/forms/ImportToBomButton.tsx
'use client'

import { formatJobSiteAddress } from '@/lib/formatJobSiteAddress'

const BOM_ESTIMATOR_URL =
  process.env.NEXT_PUBLIC_BOM_ESTIMATOR_URL ?? 'https://americloud-das-pricing-calculator.vercel.app'

export default function ImportToBomButton({
  client,
  project,
  street,
  city,
  state,
  zipCode,
  projectOverview,
}: {
  client: string
  project: string
  street: string
  city: string
  state: string
  zipCode: string
  projectOverview: string
}) {
  const params = new URLSearchParams({
    client,
    project,
    jobSiteAddress: formatJobSiteAddress(street, city, state, zipCode),
    projectOverview,
  })
  const href = `${BOM_ESTIMATOR_URL}/import?${params.toString()}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-1 border border-[#1E3A5F] text-[#94A3B8] hover:text-white hover:border-white font-semibold py-3.5 rounded-lg transition-colors text-sm uppercase tracking-widest text-center"
    >
      Import to BOM Estimator
    </a>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest __tests__/components/forms/ImportToBomButton.test.tsx`
Expected: PASS (3/3 tests)

- [ ] **Step 5: Commit**

```bash
git add components/forms/ImportToBomButton.tsx __tests__/components/forms/ImportToBomButton.test.tsx
git commit -m "feat: add ImportToBomButton component"
```

---

### Task 3: Wire the button into `EditProjectForm`'s General Information tab

**Files:**
- Modify: `components/forms/EditProjectForm.tsx`
- Test: `__tests__/components/forms/EditProjectForm.test.tsx`

**Interfaces:**
- Consumes: `ImportToBomButton` from Task 2 (`@/components/forms/ImportToBomButton`).

- [ ] **Step 1: Write the failing test**

Add to `__tests__/components/forms/EditProjectForm.test.tsx` (alongside the existing `it(...)` blocks, using the existing `mockProject` fixture already defined in that file):

```tsx
it('renders an Import to BOM Estimator link with the project current values encoded', () => {
  render(<EditProjectForm project={mockProject} />)
  const link = screen.getByRole('link', { name: /import to bom estimator/i })
  const url = new URL(link.getAttribute('href')!)

  expect(url.origin + url.pathname).toBe('https://americloud-das-pricing-calculator.vercel.app/import')
  expect(url.searchParams.get('client')).toBe('AT&T')
  expect(url.searchParams.get('project')).toBe('Test Site')
  expect(url.searchParams.get('jobSiteAddress')).toBe('123 Main St, New York, NY 10001')
  expect(url.searchParams.get('projectOverview')).toBe('')
  expect(link).toHaveAttribute('target', '_blank')
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest __tests__/components/forms/EditProjectForm.test.tsx`
Expected: FAIL — no element found with role `link` and accessible name matching `/import to bom estimator/i`.

- [ ] **Step 3: Wire in the component**

In `components/forms/EditProjectForm.tsx`:

Add the import near the other component imports (after the `ClientSelect` import, line 14):

```tsx
import ImportToBomButton from '@/components/forms/ImportToBomButton'
```

Add three more `watch()` calls next to the existing `clientValue = watch('client')` (around line 101):

```tsx
  const clientValue = watch('client')
  const siteName = watch('site_name')
  const street = watch('street')
  const city = watch('city')
  const state = watch('state')
  const zipCode = watch('zip_code')
  const projectScope = watch('project_scope')
```

Replace the "Actions" block (lines 274-283) so `ImportToBomButton` sits between Cancel and Save Changes:

```tsx
            {/* Actions */}
            <div className="flex gap-4">
              <button type="button" onClick={() => router.push('/')} className="flex-1 border border-[#1E3A5F] text-[#94A3B8] hover:text-white hover:border-white font-semibold py-3.5 rounded-lg transition-colors text-sm uppercase tracking-widest">
                Cancel
              </button>
              <ImportToBomButton
                client={clientValue ?? ''}
                project={siteName ?? ''}
                street={street ?? ''}
                city={city ?? ''}
                state={state ?? ''}
                zipCode={zipCode ?? ''}
                projectOverview={projectScope ?? ''}
              />
              <button type="submit" disabled={isSubmitting} className="flex-1 bg-[#C8102E] hover:bg-[#A50E25] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-lg transition-colors text-sm uppercase tracking-widest shadow-lg">
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest __tests__/components/forms/EditProjectForm.test.tsx`
Expected: PASS (all tests in the file, including the new one)

- [ ] **Step 5: Full verification**

Run: `npx jest` — expect the full suite to still pass (no regressions in the other `EditProjectForm.test.tsx` at `__tests__/components/EditProjectForm.test.tsx`, `NewProjectForm.test.tsx`, etc.).
Run: `npx tsc --noEmit` — expect clean.

- [ ] **Step 6: Commit**

```bash
git add components/forms/EditProjectForm.tsx __tests__/components/forms/EditProjectForm.test.tsx
git commit -m "feat: add Import to BOM Estimator button to General Information tab"
```
