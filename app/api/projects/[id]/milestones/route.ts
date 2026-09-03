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
      .from('milestones')
      .select('*')
      .eq('project_id', id)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('[GET /api/projects/[id]/milestones]', error.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const milestoneIds = (data ?? []).map(m => m.id)
    let tasksMap: Record<string, { id: string; task: string; sort_order: number }[]> = {}
    if (milestoneIds.length > 0) {
      const { data: tasks } = await supabase
        .from('milestone_tasks')
        .select('*')
        .in('milestone_id', milestoneIds)
        .order('sort_order')
      for (const t of tasks ?? []) {
        if (!tasksMap[t.milestone_id]) tasksMap[t.milestone_id] = []
        tasksMap[t.milestone_id].push({ id: t.id, task: t.task, sort_order: t.sort_order })
      }
    }
    const enriched = (data ?? []).map(m => ({ ...m, tasks: tasksMap[m.id] ?? [] }))
    return NextResponse.json({ milestones: enriched, project_notes: '' })
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

  const { milestones, deleted_ids } = body as { milestones: unknown; deleted_ids: unknown; project_notes?: string }
  if (!Array.isArray(milestones) || !Array.isArray(deleted_ids)) {
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

    const { data: currentMilestones } = await supabase
      .from('milestones')
      .select('id, owner, owner_email, details, projected_date, actualized_date, notes')
      .eq('project_id', id)
    const currentMap = new Map((currentMilestones ?? []).map(m => [m.id, m]))

    if (deleted_ids.length > 0) {
      const { error } = await supabase.from('milestones').delete().eq('project_id', id).in('id', deleted_ids)
      if (error) {
        console.error('[PUT /api/projects/[id]/milestones] delete error:', error.message)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }
    }

    if (milestones.length > 0) {
      const { randomUUID } = await import('crypto')
      const rows = (milestones as Record<string, unknown>[]).map((m, i) => ({
        id: (m.id as string) || randomUUID(),
        project_id: id,
        details: (m.details as string) || null,
        owner: (m.owner as string) || null,
        owner_email: (m.owner_email as string) || null,
        projected_date: (m.projected_date as string) || null,
        actualized_date: (m.actualized_date as string) || null,
        notes: (m.notes as string) || null,
        status: (m.status as string) || 'Active',
        sort_order: (m.sort_order as number) ?? i,
      }))
      const { error } = await supabase.from('milestones').upsert(rows)
      if (error) {
        console.error('[PUT /api/projects/[id]/milestones] upsert error:', error.message)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }
    }

    try {
      const projectName = project.site_name
      const baseUrl = (process.env.NEXTAUTH_URL ?? '').replace(/\/$/, '')
      const milestoneLink = `${baseUrl}/api/auth/signin/microsoft?callbackUrl=${encodeURIComponent(`/projects/${id}/edit?tab=Milestones`)}`
      const emailPromises: Promise<void>[] = []

      // Deleted milestones
      for (const deletedId of deleted_ids as string[]) {
        const current = currentMap.get(deletedId)
        const email = current?.owner_email || ''
        if (current?.owner && email) {
          const details = current.details ?? '(untitled)'
          emailPromises.push(sendEmail({
            to: email,
            subject: `AmeriCloud Site Tracker — ${projectName} — Milestone Removed`,
            text: `A milestone you were assigned to has been removed from project "${projectName}".\n\nMilestone: ${details}\nProjected Date: ${current.projected_date ?? '—'}`,
            html: buildEmailHtml({
              heading: 'Milestone Removed',
              body: `A milestone you were assigned to has been removed from project <strong>${projectName}</strong>.`,
              details: [
                { label: 'Project', value: projectName },
                { label: 'Milestone', value: details },
                { label: 'Projected Date', value: current.projected_date ?? '—' },
              ],
              linkHref: milestoneLink,
              linkLabel: 'View Project',
            }),
          }))
        }
      }

      // Upserted milestones
      const incomingRows = milestones as Record<string, unknown>[]
      for (const row of incomingRows) {
        const newOwner = (row.owner as string) || ''
        const email = (row.owner_email as string) || ''
        const newDetails = (row.details as string) || ''
        const newProjectedDate = (row.projected_date as string) || ''
        const newActualizedDate = (row.actualized_date as string) || ''
        const newNotes = (row.notes as string) || ''
        const rowId = row.id as string | undefined

        if (!newOwner || !email) continue

        const current = rowId ? currentMap.get(rowId) : undefined
        const isNew = !rowId || !current
        const ownerChanged = !isNew && (current?.owner ?? '') !== newOwner

        if (isNew || ownerChanged) {
          emailPromises.push(sendEmail({
            to: email,
            subject: `AmeriCloud Site Tracker — ${projectName} — Milestone Assigned`,
            text: `You have been assigned to a milestone on project "${projectName}".\n\nMilestone: ${newDetails || '(untitled)'}\nProjected Date: ${newProjectedDate || '—'}\nNotes: ${newNotes || '—'}\n\nView project: ${milestoneLink}`,
            html: buildEmailHtml({
              heading: 'Milestone Assigned to You',
              body: `You have been assigned to a milestone on project <strong>${projectName}</strong>.`,
              details: [
                { label: 'Project', value: projectName },
                { label: 'Milestone', value: newDetails || '(untitled)' },
                { label: 'Projected Date', value: newProjectedDate || '—' },
                { label: 'Notes', value: newNotes || '—' },
              ],
              linkHref: milestoneLink,
              linkLabel: 'View Milestone',
            }),
          }))
        } else if (
          newDetails !== (current?.details ?? '') ||
          newProjectedDate !== (current?.projected_date ?? '') ||
          newActualizedDate !== (current?.actualized_date ?? '') ||
          newNotes !== (current?.notes ?? '')
        ) {
          emailPromises.push(sendEmail({
            to: email,
            subject: `AmeriCloud Site Tracker — ${projectName} — Milestone Updated`,
            text: `A milestone you are assigned to has been updated on project "${projectName}".\n\nMilestone: ${newDetails || '(untitled)'}\nProjected Date: ${newProjectedDate || '—'}\nActual Date: ${newActualizedDate || '—'}\nNotes: ${newNotes || '—'}\n\nView project: ${milestoneLink}`,
            html: buildEmailHtml({
              heading: 'Milestone Updated',
              body: `A milestone you are assigned to has been updated on project <strong>${projectName}</strong>.`,
              details: [
                { label: 'Project', value: projectName },
                { label: 'Milestone', value: newDetails || '(untitled)' },
                { label: 'Projected Date', value: newProjectedDate || '—' },
                { label: 'Actual Date', value: newActualizedDate || '—' },
                { label: 'Notes', value: newNotes || '—' },
              ],
              linkHref: milestoneLink,
              linkLabel: 'View Milestone',
            }),
          }))
        }
      }

      await Promise.all(emailPromises)
    } catch (emailErr) {
      console.error('[PUT /api/projects/[id]/milestones] email error:', emailErr)
    }

    const { data: allMilestones, error: fetchError } = await supabase
      .from('milestones')
      .select('*')
      .eq('project_id', id)
      .order('sort_order', { ascending: true })

    if (fetchError) return NextResponse.json({ error: 'Database error' }, { status: 500 })

    if ((allMilestones ?? []).length > 0 && (allMilestones ?? []).every(m => m.status === 'Completed')) {
      await supabase.from('projects').update({ status: 'Completed' }).eq('id', id)
    }

    // Enrich with tasks
    const milestoneIds = (allMilestones ?? []).map(m => m.id)
    let tasksMap: Record<string, { id: string; task: string; sort_order: number }[]> = {}
    if (milestoneIds.length > 0) {
      const { data: tasks } = await supabase
        .from('milestone_tasks')
        .select('*')
        .in('milestone_id', milestoneIds)
        .order('sort_order')
      for (const t of tasks ?? []) {
        if (!tasksMap[t.milestone_id]) tasksMap[t.milestone_id] = []
        tasksMap[t.milestone_id].push({ id: t.id, task: t.task, sort_order: t.sort_order })
      }
    }
    const enriched = (allMilestones ?? []).map(m => ({ ...m, tasks: tasksMap[m.id] ?? [] }))

    return NextResponse.json({ milestones: enriched, project_notes: '' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
