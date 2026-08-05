import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'
import { sendEmail } from '@/lib/email'

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
      const emailPromises: Promise<void>[] = []
      const incomingCrew = crew_members as Record<string, unknown>[]

      for (const row of incomingCrew) {
        const newTask = (row.task as string) || ''
        const newEmail = (row.email as string) || ''
        const newDateFrom = (row.date_from as string) || ''
        const newDateTo = (row.date_to as string) || ''
        const rowId = row.id as string | undefined

        if (!newTask || !newEmail) continue

        if (!rowId) {
          // New crew member with task — Task Assigned
          emailPromises.push(sendEmail({
            to: newEmail,
            subject: `AmeriCloud Site Tracker - ${projectName} - Task Assigned`,
            text: `You have been assigned a task on project "${projectName}".\n\nTask: ${newTask}\nDate From: ${newDateFrom || '—'}\nDate To: ${newDateTo || '—'}`,
          }))
        } else {
          const current = currentCrewMap.get(rowId)
          if (!current) {
            emailPromises.push(sendEmail({
              to: newEmail,
              subject: `AmeriCloud Site Tracker - ${projectName} - Task Assigned`,
              text: `You have been assigned a task on project "${projectName}".\n\nTask: ${newTask}\nDate From: ${newDateFrom || '—'}\nDate To: ${newDateTo || '—'}`,
            }))
          } else if (newTask !== (current.task ?? '')) {
            // Task changed — Task Assigned
            emailPromises.push(sendEmail({
              to: newEmail,
              subject: `AmeriCloud Site Tracker - ${projectName} - Task Assigned`,
              text: `You have been assigned a task on project "${projectName}".\n\nTask: ${newTask}\nDate From: ${newDateFrom || '—'}\nDate To: ${newDateTo || '—'}`,
            }))
          }
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
