import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'
import { sendEmail, buildEmailHtml } from '@/lib/email'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = createSupabaseClient()
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', id)
      .maybeSingle()
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    const { data, error } = await supabase
      .from('crew_members')
      .select('*')
      .eq('project_id', id)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('[GET /api/projects/[id]/crew]', error.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ crew_members: data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { crew_members, deleted_ids } = body as { crew_members: unknown; deleted_ids: unknown }
  if (!Array.isArray(crew_members) || !Array.isArray(deleted_ids)) {
    return NextResponse.json({ error: 'Invalid body shape' }, { status: 400 })
  }

  try {
    const supabase = createSupabaseClient()
    const { data: project } = await supabase
      .from('projects')
      .select('id, site_name')
      .eq('id', id)
      .maybeSingle()
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    const { data: currentCrew } = await supabase
      .from('crew_members')
      .select('id, name, email, task, date_from, date_to')
      .eq('project_id', id)
    const currentCrewMap = new Map((currentCrew ?? []).map(m => [m.id, m]))

    if (deleted_ids.length > 0) {
      const { error } = await supabase.from('crew_members').delete().eq('project_id', id).in('id', deleted_ids)
      if (error) {
        console.error('[PUT /api/projects/[id]/crew] delete error:', error.message)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }
    }

    if (crew_members.length > 0) {
      const rows = (crew_members as Record<string, unknown>[]).map((m, i) => ({
        ...(m.id ? { id: m.id } : {}),
        project_id: id,
        name: (m.name as string) || null,
        email: (m.email as string) || null,
        task: (m.task as string) || null,
        date_from: (m.date_from as string) || null,
        date_to: (m.date_to as string) || null,
        sort_order: (m.sort_order as number) ?? i,
      }))
      const { error } = await supabase.from('crew_members').upsert(rows)
      if (error) {
        console.error('[PUT /api/projects/[id]/crew] upsert error:', error.message)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }
    }

    try {
      const projectName = project.site_name
      const baseUrl = (process.env.NEXTAUTH_URL ?? '').replace(/\/$/, '')
      const taskLink = `${baseUrl}/api/auth/signin/microsoft?callbackUrl=${encodeURIComponent(`/projects/${id}/edit?tab=Task Scheduler`)}`
      const emailPromises: Promise<void>[] = []
      const incomingCrew = crew_members as Record<string, unknown>[]

      for (const row of incomingCrew) {
        const newTask = (row.task as string) || ''
        const newEmail = (row.email as string) || ''
        const newName = (row.name as string) || ''
        const newDateFrom = (row.date_from as string) || ''
        const newDateTo = (row.date_to as string) || ''
        const rowId = row.id as string | undefined

        if (!newTask || !newEmail) continue

        const current = rowId ? currentCrewMap.get(rowId) : undefined
        const isNew = !rowId || !current
        const taskChanged = !isNew && (current?.task ?? '') !== newTask

        if (isNew || taskChanged) {
          emailPromises.push(sendEmail({
            to: newEmail,
            subject: `AmeriCloud Site Tracker — ${projectName} — Task Assigned`,
            text: `You have been assigned a task on project "${projectName}".\n\nTask: ${newTask}\nDate From: ${newDateFrom || '—'}\nDate To: ${newDateTo || '—'}\n\nView project: ${taskLink}`,
            html: buildEmailHtml({
              heading: 'Task Assigned to You',
              body: `${newName ? `Hi ${newName.split(' ')[0]}, you` : 'You'} have been assigned a task on project <strong>${projectName}</strong>.`,
              details: [
                { label: 'Project', value: projectName },
                { label: 'Task', value: newTask },
                { label: 'Date From', value: newDateFrom || '—' },
                { label: 'Date To', value: newDateTo || '—' },
              ],
              linkHref: taskLink,
              linkLabel: 'View Task Schedule',
            }),
          }))
        }
      }

      await Promise.all(emailPromises)
    } catch (emailErr) {
      console.error('[PUT /api/projects/[id]/crew] email error:', emailErr)
    }

    const { data, error } = await supabase
      .from('crew_members')
      .select('*')
      .eq('project_id', id)
      .order('sort_order', { ascending: true })

    if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })
    return NextResponse.json({ crew_members: data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
