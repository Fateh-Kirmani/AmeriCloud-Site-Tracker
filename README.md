# AmeriCloud Site Tracker

An internal tool for AmeriCloud Telecom Solutions to track and manage telecom site projects.

## Features

- Create and manage telecom site projects
- Track project status (Active, On Hold, Completed, Cancelled)
- Filter and sort projects by name, project code, client, template, PM, status, and date
- Edit projects with tabbed interface (General Information, Milestones, Files, Team)
- Mobile-responsive layout

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **Forms:** React Hook Form + Zod
- **Database:** Supabase (Postgres)

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project with the `projects` table set up

### Local Setup

1. Clone the repo and install dependencies:

```bash
git clone https://github.com/MintCookies04/AmeriCloud-Site-Tracker.git
cd AmeriCloud-Site-Tracker
npm install
```

2. Copy the env example and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

3. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Running Tests

```bash
npm test
```

## Deployment

Deployed on [Vercel](https://vercel.com). Every push to `main` triggers an automatic production deployment.

Set the following environment variables in your Vercel project settings:

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `NEXT_PUBLIC_BOM_ESTIMATOR_URL` | Base URL of the BOM Estimator app the "Import to BOM Estimator" button links to. Optional — defaults to `https://americloud-das-pricing-calculator.vercel.app`. Since this is a `NEXT_PUBLIC_*` variable, it's inlined at build time — changing it in Vercel requires a rebuild, not just a redeploy. |
