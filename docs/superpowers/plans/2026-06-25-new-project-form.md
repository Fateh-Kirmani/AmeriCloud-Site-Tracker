# AmeriCloud Site Tracker — New Project Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js 14 landing page with a sectioned card form for creating new AmeriCloud site projects, persisting submissions to Supabase Postgres.

**Architecture:** Single Next.js 14 App Router page at `/` renders `NewProjectForm` (client component), which uses React Hook Form + Zod for validation and POSTs to `/api/projects` (server route), which validates and inserts into Supabase. A fixed `Header` component displays the AmeriCloud logo and app title.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, React Hook Form, @hookform/resolvers/zod, Zod, @supabase/supabase-js, Jest, @testing-library/react, @testing-library/jest-dom

## Global Constraints

- Node.js ≥18 required (check with `node -v`)
- Next.js 14, App Router only — no pages directory
- TypeScript strict mode enabled
- Color values: background `#0B1929`, cards `#112240`, borders `#1E3A5F`, accent red `#C8102E`, hover red `#A50E25`, text secondary `#94A3B8`
- Font: Inter via `next/font/google`
- Logo: `public/americloud_telecom_solutions_logo.jpg`
- All Supabase column names match form field names exactly (snake_case)
- No authentication in Sprint 1
- Import alias `@/` maps to project root (configured by create-next-app)

---

## File Map

| File | Responsibility |
|------|---------------|
| `tailwind.config.ts` | Custom slide-in animation keyframes |
| `app/globals.css` | Tailwind base directives only |
| `app/layout.tsx` | Root layout: Inter font, `<Header />`, `<main>` wrapper |
| `app/page.tsx` | Page title + `<NewProjectForm />` |
| `app/api/projects/route.ts` | POST handler — validate body with Zod, insert to Supabase |
| `components/Header.tsx` | Fixed nav: logo (40px height) + "AmeriCloud Site Tracker" title |
| `components/FormCard.tsx` | Card wrapper with red left accent bar + bold title |
| `components/Toast.tsx` | Auto-dismissing success/error notification, slides in from right |
| `components/forms/NewProjectForm.tsx` | Full form: all 5 cards, React Hook Form, Zod resolver, submit logic |
| `lib/supabase.ts` | `createSupabaseClient()` — server-side Supabase client factory |
| `types/project.ts` | `ProjectFormData` TypeScript type + `projectSchema` Zod schema |
| `.env.local` | `SUPABASE_URL` + `SUPABASE_ANON_KEY` (never commit) |
| `.env.local.example` | Template for env vars |
| `public/americloud_telecom_solutions_logo.jpg` | Logo asset (copied from project root) |
| `jest.config.ts` | Jest + next/jest integration |
| `jest.setup.ts` | `@testing-library/jest-dom` import |
| `__tests__/schema.test.ts` | Zod schema validation unit tests |
| `__tests__/api/projects.test.ts` | API route tests with mocked Supabase |
| `__tests__/components/NewProjectForm.test.tsx` | Form integration tests with RTL |

---

### Task 1: Project Scaffold, Dependencies + Configuration

**Files:**
- Create (via scaffold): all Next.js boilerplate
- Replace: `tailwind.config.ts`
- Replace: `app/globals.css`
- Create: `.env.local.example`
- Create: `jest.config.ts`
- Create: `jest.setup.ts`
- Copy: `americloud_telecom_solutions_logo.jpg` → `public/`

**Interfaces:**
- Produces: `animate-slide-in` Tailwind class, working `npm run dev` on http://localhost:3000, working `npm test`

- [ ] **Step 1: Scaffold Next.js 14 into current directory**

Run from `e:\Work\Site Tracker Tool`:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
```
When asked "Ok to proceed?" answer `y`. When asked about Turbopack, answer `No`.

- [ ] **Step 2: Install runtime and dev dependencies**

```bash
npm install react-hook-form @hookform/resolvers zod @supabase/supabase-js
npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/jest
```

- [ ] **Step 3: Copy logo to public/**

Windows:
```bash
copy americloud_telecom_solutions_logo.jpg public\americloud_telecom_solutions_logo.jpg
```
Mac/Linux:
```bash
cp americloud_telecom_solutions_logo.jpg public/americloud_telecom_solutions_logo.jpg
```

- [ ] **Step 4: Replace tailwind.config.ts**

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateX(110%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      animation: {
        'slide-in': 'slide-in 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
}
export default config
```

- [ ] **Step 5: Replace app/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 6: Create .env.local.example**

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

- [ ] **Step 7: Create jest.config.ts**

```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
}

export default createJestConfig(config)
```

- [ ] **Step 8: Create jest.setup.ts**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 9: Verify dev server starts**

```bash
npm run dev
```
Expected: Server running at http://localhost:3000 with default Next.js page visible. No TypeScript errors in terminal.

- [ ] **Step 10: Commit**

```bash
git init
git add -A
git commit -m "feat: scaffold Next.js 14 project with Tailwind, Jest, and dependencies"
```

---

### Task 2: Supabase Setup + Environment Variables

**Files:**
- Create: `lib/supabase.ts`
- Create: `.env.local`

**Interfaces:**
- Produces: `createSupabaseClient()` — returns a `SupabaseClient` connected to the `projects` table

**Prerequisite:** Create a Supabase project at https://supabase.com before running these steps.

- [ ] **Step 1: Create the projects table in Supabase**

In the Supabase dashboard → SQL Editor, run:
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

- [ ] **Step 2: Get Supabase credentials**

In Supabase dashboard → Settings → API:
- Copy "Project URL" → `SUPABASE_URL`
- Copy "anon public" key → `SUPABASE_ANON_KEY`

- [ ] **Step 3: Create .env.local**

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-actual-anon-key
```

- [ ] **Step 4: Create lib/supabase.ts**

```typescript
import { createClient } from '@supabase/supabase-js'

export function createSupabaseClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 5: Confirm .env.local is gitignored**

Open `.gitignore`. Confirm `.env.local` is listed. If not, add it.

- [ ] **Step 6: Commit**

```bash
git add lib/supabase.ts .env.local.example
git commit -m "feat: add Supabase client factory"
```
Do NOT add `.env.local` to the commit.

---

### Task 3: TypeScript Types + Zod Schema

**Files:**
- Create: `types/project.ts`
- Create: `__tests__/schema.test.ts`

**Interfaces:**
- Produces: `projectSchema` (Zod schema), `ProjectFormData` (TypeScript type)
- Consumed by: `NewProjectForm.tsx` (form type), `app/api/projects/route.ts` (request validation)

- [ ] **Step 1: Write failing schema tests**

Create `__tests__/schema.test.ts`:
```typescript
import { projectSchema } from '@/types/project'

const validBase = {
  site_name: 'Test Site',
  address: '123 Main St',
  americloud_site_id: 'AC-001',
  client: 'AT&T',
}

describe('projectSchema', () => {
  it('accepts valid required-only data', () => {
    expect(projectSchema.safeParse(validBase).success).toBe(true)
  })

  it('rejects empty site_name', () => {
    expect(projectSchema.safeParse({ ...validBase, site_name: '' }).success).toBe(false)
  })

  it('rejects empty address', () => {
    expect(projectSchema.safeParse({ ...validBase, address: '' }).success).toBe(false)
  })

  it('rejects empty americloud_site_id', () => {
    expect(projectSchema.safeParse({ ...validBase, americloud_site_id: '' }).success).toBe(false)
  })

  it('rejects empty client', () => {
    expect(projectSchema.safeParse({ ...validBase, client: '' }).success).toBe(false)
  })

  it('rejects invalid pm_email', () => {
    expect(projectSchema.safeParse({ ...validBase, pm_email: 'not-an-email' }).success).toBe(false)
  })

  it('accepts empty string pm_email (field is optional)', () => {
    expect(projectSchema.safeParse({ ...validBase, pm_email: '' }).success).toBe(true)
  })

  it('rejects invalid rf_engineer_email', () => {
    expect(projectSchema.safeParse({ ...validBase, rf_engineer_email: 'bad' }).success).toBe(false)
  })

  it('accepts a fully populated payload', () => {
    const result = projectSchema.safeParse({
      ...validBase,
      client_site_id: 'CLI-001',
      pm_name: 'Jane Doe',
      pm_email: 'jane@example.com',
      pm_phone: '555-0100',
      rf_engineer_name: 'Bob Smith',
      rf_engineer_email: 'bob@example.com',
      rf_engineer_phone: '555-0200',
      americloud_pm: 'John Smith',
      americloud_rf: 'Robert Chen',
      project_scope: 'Full tower build',
      project_template: 'Standard Cell Tower',
    })
    expect(result.success).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npm test -- --testPathPattern="schema"
```
Expected: FAIL with `Cannot find module '@/types/project'`

- [ ] **Step 3: Create types/project.ts**

```typescript
import { z } from 'zod'

const optionalEmail = z
  .union([z.string().email('Invalid email format'), z.literal('')])
  .optional()

export const projectSchema = z.object({
  site_name: z.string().min(1, 'Site name is required'),
  address: z.string().min(1, 'Address is required'),
  americloud_site_id: z.string().min(1, 'AmeriCloud Site ID is required'),
  client: z.string().min(1, 'Client is required'),
  client_site_id: z.string().optional(),
  pm_name: z.string().optional(),
  pm_email: optionalEmail,
  pm_phone: z.string().optional(),
  rf_engineer_name: z.string().optional(),
  rf_engineer_email: optionalEmail,
  rf_engineer_phone: z.string().optional(),
  americloud_pm: z.string().optional(),
  americloud_rf: z.string().optional(),
  project_scope: z.string().optional(),
  project_template: z.string().optional(),
})

export type ProjectFormData = z.infer<typeof projectSchema>
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npm test -- --testPathPattern="schema"
```
Expected: PASS — 9 tests pass

- [ ] **Step 5: Commit**

```bash
git add types/project.ts __tests__/schema.test.ts
git commit -m "feat: add ProjectFormData type and Zod schema with tests"
```

---

### Task 4: POST /api/projects Route

**Files:**
- Create: `app/api/projects/route.ts`
- Create: `__tests__/api/projects.test.ts`

**Interfaces:**
- Consumes: `projectSchema` from `@/types/project`, `createSupabaseClient` from `@/lib/supabase`
- Produces: `POST /api/projects` — `201` with inserted row, `400` on validation failure, `500` on DB error

- [ ] **Step 1: Write failing API route tests**

Create `__tests__/api/projects.test.ts`:
```typescript
import { POST } from '@/app/api/projects/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/supabase', () => ({
  createSupabaseClient: jest.fn(),
}))

import { createSupabaseClient } from '@/lib/supabase'

const mockSingle = jest.fn()
const mockSelect = jest.fn(() => ({ single: mockSingle }))
const mockInsert = jest.fn(() => ({ select: mockSelect }))
const mockFrom = jest.fn(() => ({ insert: mockInsert }))

const validBody = {
  site_name: 'Test Site',
  address: '123 Main St',
  americloud_site_id: 'AC-001',
  client: 'AT&T',
}

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(createSupabaseClient as jest.Mock).mockReturnValue({ from: mockFrom })
})

describe('POST /api/projects', () => {
  it('returns 201 with project data on success', async () => {
    const project = { id: 'abc-123', ...validBody }
    mockSingle.mockResolvedValue({ data: project, error: null })

    const res = await POST(makeRequest(validBody))

    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.id).toBe('abc-123')
  })

  it('returns 400 when required fields are missing', async () => {
    const res = await POST(makeRequest({ site_name: '' }))
    expect(res.status).toBe(400)
  })

  it('returns 500 when Supabase returns an error', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'DB error' } })

    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(500)
  })
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npm test -- --testPathPattern="api/projects"
```
Expected: FAIL with `Cannot find module '@/app/api/projects/route'`

- [ ] **Step 3: Create app/api/projects/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'
import { projectSchema } from '@/types/project'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = projectSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('projects')
      .insert(parsed.data)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npm test -- --testPathPattern="api/projects"
```
Expected: PASS — 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add app/api/projects/route.ts __tests__/api/projects.test.ts
git commit -m "feat: add POST /api/projects route with Zod validation and Supabase insert"
```

---

### Task 5: Header Component

**Files:**
- Create: `components/Header.tsx`

**Interfaces:**
- Produces: `<Header />` — fixed top bar, no props

- [ ] **Step 1: Create components/Header.tsx**

```tsx
import Image from 'next/image'

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0B1929] border-b border-[#1E3A5F] shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">
        <Image
          src="/americloud_telecom_solutions_logo.jpg"
          alt="AmeriCloud Telecom Solutions"
          width={160}
          height={40}
          style={{ height: '40px', width: 'auto' }}
          priority
        />
        <div className="w-px h-8 bg-[#1E3A5F]" />
        <span className="text-white font-semibold text-lg tracking-wide">
          AmeriCloud Site Tracker
        </span>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/Header.tsx
git commit -m "feat: add Header component"
```

---

### Task 6: FormCard + Toast Components

**Files:**
- Create: `components/FormCard.tsx`
- Create: `components/Toast.tsx`

**Interfaces:**
- Produces:
  - `<FormCard title={string} className?={string}>` — dark card with left red accent bar
  - `<Toast message={string} type={'success'|'error'} onDismiss={()=>void}>` — auto-dismissing toast (4s success, 5s error)

- [ ] **Step 1: Create components/FormCard.tsx**

```tsx
interface FormCardProps {
  title: string
  children: React.ReactNode
  className?: string
}

export default function FormCard({ title, children, className = '' }: FormCardProps) {
  return (
    <div className={`bg-[#112240] border border-[#1E3A5F] rounded-lg shadow-xl overflow-hidden ${className}`}>
      <div className="flex items-stretch">
        <div className="w-1 flex-shrink-0 bg-[#C8102E]" />
        <h2 className="text-white font-semibold text-xs uppercase tracking-widest px-5 py-4">
          {title}
        </h2>
      </div>
      <div className="h-px bg-[#1E3A5F]" />
      <div className="px-6 py-5">
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create components/Toast.tsx**

```tsx
'use client'
import { useEffect } from 'react'

interface ToastProps {
  message: string
  type: 'success' | 'error'
  onDismiss: () => void
}

export default function Toast({ message, type, onDismiss }: ToastProps) {
  useEffect(() => {
    const ms = type === 'success' ? 4000 : 5000
    const timer = setTimeout(onDismiss, ms)
    return () => clearTimeout(timer)
  }, [type, onDismiss])

  const bg = type === 'success' ? 'bg-[#0D3B26]' : 'bg-[#5C1010]'
  const icon = type === 'success' ? '✓' : '✕'

  return (
    <div
      role="alert"
      className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-5 py-4 rounded-lg shadow-2xl text-white text-sm font-medium border border-[#1E3A5F] animate-slide-in ${bg}`}
    >
      <span className="text-base">{icon}</span>
      <span>{message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="ml-2 opacity-60 hover:opacity-100 text-lg leading-none"
      >
        ×
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/FormCard.tsx components/Toast.tsx
git commit -m "feat: add FormCard and Toast components"
```

---

### Task 7: NewProjectForm Component

**Files:**
- Create: `components/forms/NewProjectForm.tsx`
- Create: `__tests__/components/NewProjectForm.test.tsx`

**Interfaces:**
- Consumes: `projectSchema`, `ProjectFormData` from `@/types/project`; `<FormCard />` from `@/components/FormCard`; `<Toast />` from `@/components/Toast`
- Produces: `<NewProjectForm />` — no props, self-contained

- [ ] **Step 1: Write failing form tests**

Create `__tests__/components/NewProjectForm.test.tsx`:
```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NewProjectForm from '@/components/forms/NewProjectForm'

global.fetch = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
})

describe('NewProjectForm', () => {
  it('renders all section card titles', () => {
    render(<NewProjectForm />)
    expect(screen.getByText(/site information/i)).toBeInTheDocument()
    expect(screen.getByText(/client & ids/i)).toBeInTheDocument()
    expect(screen.getByText(/customer contact/i)).toBeInTheDocument()
    expect(screen.getByText(/americloud team/i)).toBeInTheDocument()
    expect(screen.getByText(/project details/i)).toBeInTheDocument()
  })

  it('shows validation error when site name is empty on submit', async () => {
    render(<NewProjectForm />)
    await userEvent.click(screen.getByRole('button', { name: /create project/i }))
    await waitFor(() => {
      expect(screen.getByText('Site name is required')).toBeInTheDocument()
    })
  })

  it('calls fetch with correct payload on valid submission', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'abc-123' }),
    })

    render(<NewProjectForm />)

    await userEvent.type(screen.getByPlaceholderText('Enter site name'), 'Test Site')
    await userEvent.type(screen.getByPlaceholderText('Enter address'), '123 Main St')
    await userEvent.type(screen.getByPlaceholderText('e.g. AC-2024-001'), 'AC-001')
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: /client/i }),
      'AT&T'
    )
    await userEvent.click(screen.getByRole('button', { name: /create project/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/projects',
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  it('shows success toast after successful submission', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'abc-123' }),
    })

    render(<NewProjectForm />)

    await userEvent.type(screen.getByPlaceholderText('Enter site name'), 'Test Site')
    await userEvent.type(screen.getByPlaceholderText('Enter address'), '123 Main St')
    await userEvent.type(screen.getByPlaceholderText('e.g. AC-2024-001'), 'AC-001')
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: /client/i }),
      'AT&T'
    )
    await userEvent.click(screen.getByRole('button', { name: /create project/i }))

    await waitFor(() => {
      expect(screen.getByText('Project created successfully')).toBeInTheDocument()
    })
  })

  it('shows error toast when fetch returns non-ok response', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false })

    render(<NewProjectForm />)

    await userEvent.type(screen.getByPlaceholderText('Enter site name'), 'Test Site')
    await userEvent.type(screen.getByPlaceholderText('Enter address'), '123 Main St')
    await userEvent.type(screen.getByPlaceholderText('e.g. AC-2024-001'), 'AC-001')
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: /client/i }),
      'AT&T'
    )
    await userEvent.click(screen.getByRole('button', { name: /create project/i }))

    await waitFor(() => {
      expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npm test -- --testPathPattern="NewProjectForm"
```
Expected: FAIL with `Cannot find module '@/components/forms/NewProjectForm'`

- [ ] **Step 3: Create components/forms/NewProjectForm.tsx**

```tsx
'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { projectSchema, ProjectFormData } from '@/types/project'
import FormCard from '@/components/FormCard'
import Toast from '@/components/Toast'

const CLIENTS = ['AT&T', 'Verizon', 'T-Mobile', 'Crown Castle', 'SBA Communications']
const AMERICLOUD_PMS = ['John Smith', 'Sarah Johnson', 'Mike Davis']
const AMERICLOUD_RFS = ['Robert Chen', 'Lisa Park', 'David Wilson']
const PROJECT_TEMPLATES = ['Standard Cell Tower', 'Small Cell', 'DAS', 'Rooftop']

function inputClass(hasError: boolean) {
  return `w-full bg-[#0B1929] border ${
    hasError ? 'border-[#C8102E]' : 'border-[#1E3A5F]'
  } rounded-md px-3 py-2.5 text-white text-sm placeholder-[#4A6FA5] focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-colors`
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[#94A3B8] text-xs uppercase tracking-wider font-medium">
        {label}
        {required && <span className="text-[#C8102E] ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-[#C8102E] text-xs mt-0.5">{error}</p>}
    </div>
  )
}

export default function NewProjectForm() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectFormData>({ resolver: zodResolver(projectSchema) })

  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      reset()
      setToast({ message: 'Project created successfully', type: 'success' })
    } catch {
      setToast({ message: 'Something went wrong. Please try again.', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FormCard title="Site Information">
            <div className="space-y-4">
              <Field label="Site Name" required error={errors.site_name?.message}>
                <input
                  {...register('site_name')}
                  className={inputClass(!!errors.site_name)}
                  placeholder="Enter site name"
                />
              </Field>
              <Field label="Address" required error={errors.address?.message}>
                <input
                  {...register('address')}
                  className={inputClass(!!errors.address)}
                  placeholder="Enter address"
                />
              </Field>
              <Field label="AmeriCloud Site ID" required error={errors.americloud_site_id?.message}>
                <input
                  {...register('americloud_site_id')}
                  className={inputClass(!!errors.americloud_site_id)}
                  placeholder="e.g. AC-2024-001"
                />
              </Field>
            </div>
          </FormCard>

          <FormCard title="Client & IDs">
            <div className="space-y-4">
              <Field label="Client" required error={errors.client?.message}>
                <select
                  {...register('client')}
                  aria-label="Client"
                  className={inputClass(!!errors.client)}
                >
                  <option value="">Select client...</option>
                  {CLIENTS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Client Site ID" error={errors.client_site_id?.message}>
                <input
                  {...register('client_site_id')}
                  className={inputClass(!!errors.client_site_id)}
                  placeholder="Enter client site ID"
                />
              </Field>
            </div>
          </FormCard>
        </div>

        {/* Row 2: Customer Contact (full width) */}
        <FormCard title="Customer Contact">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-white font-semibold text-sm mb-3">PM Information</h3>
              <div className="border-t border-[#1E3A5F] pt-4 space-y-4">
                <Field label="Name">
                  <input
                    {...register('pm_name')}
                    className={inputClass(false)}
                    placeholder="PM full name"
                  />
                </Field>
                <Field label="Email" error={errors.pm_email?.message}>
                  <input
                    {...register('pm_email')}
                    type="email"
                    className={inputClass(!!errors.pm_email)}
                    placeholder="pm@client.com"
                  />
                </Field>
                <Field label="Phone">
                  <input
                    {...register('pm_phone')}
                    type="tel"
                    className={inputClass(false)}
                    placeholder="(555) 000-0000"
                  />
                </Field>
              </div>
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm mb-3">RF Engineer Information</h3>
              <div className="border-t border-[#1E3A5F] pt-4 space-y-4">
                <Field label="Name">
                  <input
                    {...register('rf_engineer_name')}
                    className={inputClass(false)}
                    placeholder="RF Engineer full name"
                  />
                </Field>
                <Field label="Email" error={errors.rf_engineer_email?.message}>
                  <input
                    {...register('rf_engineer_email')}
                    type="email"
                    className={inputClass(!!errors.rf_engineer_email)}
                    placeholder="rf@client.com"
                  />
                </Field>
                <Field label="Phone">
                  <input
                    {...register('rf_engineer_phone')}
                    type="tel"
                    className={inputClass(false)}
                    placeholder="(555) 000-0000"
                  />
                </Field>
              </div>
            </div>
          </div>
        </FormCard>

        {/* Row 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FormCard title="AmeriCloud Team">
            <div className="space-y-4">
              <Field label="AmeriCloud PM">
                <select {...register('americloud_pm')} className={inputClass(false)}>
                  <option value="">Select PM...</option>
                  {AMERICLOUD_PMS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </Field>
              <Field label="AmeriCloud RF Engineer">
                <select {...register('americloud_rf')} className={inputClass(false)}>
                  <option value="">Select RF Engineer...</option>
                  {AMERICLOUD_RFS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </Field>
            </div>
          </FormCard>

          <FormCard title="Project Details">
            <div className="space-y-4">
              <Field label="Project Template">
                <select {...register('project_template')} className={inputClass(false)}>
                  <option value="">Select template...</option>
                  {PROJECT_TEMPLATES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="Project Scope">
                <textarea
                  {...register('project_scope')}
                  className={`${inputClass(false)} resize-none`}
                  rows={4}
                  placeholder="Describe the project scope..."
                />
              </Field>
            </div>
          </FormCard>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#C8102E] hover:bg-[#A50E25] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-lg transition-colors text-sm uppercase tracking-widest shadow-lg"
        >
          {isSubmitting ? 'Creating Project...' : 'Create Project'}
        </button>
      </form>
    </>
  )
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npm test -- --testPathPattern="NewProjectForm"
```
Expected: PASS — 5 tests pass

- [ ] **Step 5: Commit**

```bash
git add components/forms/NewProjectForm.tsx __tests__/components/NewProjectForm.test.tsx
git commit -m "feat: add NewProjectForm with all cards, validation, and integration tests"
```

---

### Task 8: Layout + Page — Wire Everything Together

**Files:**
- Replace: `app/layout.tsx`
- Replace: `app/page.tsx`

**Interfaces:**
- Consumes: `<Header />`, `<NewProjectForm />`
- Produces: Complete working page at http://localhost:3000

- [ ] **Step 1: Replace app/layout.tsx**

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AmeriCloud Site Tracker',
  description: 'Internal project tracking tool for AmeriCloud Telecom Solutions',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#0B1929] min-h-screen`}>
        <Header />
        <main className="pt-20 pb-16">
          {children}
        </main>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Replace app/page.tsx**

```tsx
import NewProjectForm from '@/components/forms/NewProjectForm'

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">New Project</h1>
        <p className="text-[#94A3B8] mt-1 text-sm">
          Fill out the details below to create a new site project.
        </p>
      </div>
      <NewProjectForm />
    </div>
  )
}
```

- [ ] **Step 3: Run all tests**

```bash
npm test
```
Expected: All tests pass (schema + API route + form)

- [ ] **Step 4: Verify the page in browser**

```bash
npm run dev
```
Open http://localhost:3000. Confirm:
- Fixed dark navy header with logo + vertical divider + "AmeriCloud Site Tracker" title
- "New Project" heading with subtitle
- 5 dark cards each with a red left accent bar
- Customer Contact card is full-width with PM and RF Engineer side by side
- Red "CREATE PROJECT" button at the bottom
- Resize the browser window to confirm cards stack to a single column on narrow viewports
- Fill out required fields and submit — confirm a green success toast slides in from the top right

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx app/page.tsx
git commit -m "feat: wire layout and page — Sprint 1 complete"
```

---

## Self-Review

**Spec coverage:**
- ✅ Site Name, Address, AmeriCloud Site ID — Task 7, Site Information card
- ✅ Client dropdown + Client Site ID — Task 7, Client & IDs card
- ✅ Customer Contact → PM Information (Name, Email, Phone) — Task 7, Customer Contact card
- ✅ Customer Contact → RF Engineer Information (Name, Email, Phone) — Task 7, Customer Contact card
- ✅ AmeriCloud PM dropdown — Task 7, AmeriCloud Team card
- ✅ AmeriCloud RF dropdown — Task 7, AmeriCloud Team card
- ✅ Project Scope textarea — Task 7, Project Details card
- ✅ Project Template dropdown — Task 7, Project Details card
- ✅ Dark blue/red color theme — Task 1 (Tailwind), all components
- ✅ Logo in header at 40px — Task 5 (Header)
- ✅ Responsive layout — Task 7 (lg:grid-cols-2, md:grid-cols-2)
- ✅ Supabase persistence — Task 2 (DB schema) + Task 4 (API route)
- ✅ Success toast — Task 6 (Toast) + Task 7 (form submit)
- ✅ Error toast — Task 6 (Toast) + Task 7 (form submit)
- ✅ Required field validation — Task 3 (schema) + Task 7 (React Hook Form)
- ✅ Email format validation — Task 3 (schema)
- ✅ Placeholder dropdown data — Task 7 (CLIENTS, AMERICLOUD_PMS, etc.)
- ✅ API error state (re-enables button) — Task 7 (finally block clears isSubmitting)

**No placeholders or TODOs found.**

**Type consistency:**
- `projectSchema` / `ProjectFormData` defined in `types/project.ts`, imported identically in `route.ts` and `NewProjectForm.tsx` ✅
- `createSupabaseClient()` defined in `lib/supabase.ts`, imported identically in `route.ts` and mocked in tests ✅
- `<FormCard title={string} className?={string}>` — used correctly in `NewProjectForm.tsx` ✅
- `<Toast message={string} type={'success'|'error'} onDismiss={()=>void}>` — used correctly in `NewProjectForm.tsx` ✅
