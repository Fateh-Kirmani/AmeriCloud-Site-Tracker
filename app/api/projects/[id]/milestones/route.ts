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
      .from('milestones')
      .select('*')
      .eq('project_id', id)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('[GET /api/projects/[id]/milestones]', error.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const { data: projectData } = await supabase
      .from('projects')
      .select('project_notes')
      .eq('id', id)
      .single()

    return NextResponse.json({ milestones: data, project_notes: projectData?.project_notes ?? '' })
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

  const { milestones, deleted_ids, project_notes } = body as { milestones: unknown; deleted_ids: unknown; project_notes?: string }
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
      .select('id, owner, details, projected_date, actualized_date, notes')
      .eq('project_id', id)
    const currentMap = new Map((currentMilestones ?? []).map(m => [m.id, m]))

    const { data: teamMembers } = await supabase
      .from('team_members')
      .select('name, email')
      .eq('project_id', id)
    const ownerEmailMap = new Map<string, string>()
    for (const tm of teamMembers ?? []) {
      if (tm.name && tm.email && !ownerEmailMap.has(tm.name)) {
        ownerEmailMap.set(tm.name, tm.email)
      }
    }

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
        projected_date: (m.projected_date as string) || null,
        actualized_date: (m.actualized_date as string) || null,
        notes: (m.notes as string) || null,
        sort_order: (m.sort_order as number) ?? i,
      }))
      const { error } = await supabase.from('milestones').upsert(rows)
      if (error) {
        console.error('[PUT /api/projects/[id]/milestones] upsert error:', error.message)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }
    }

    if (project_notes !== undefined) {
      const { error: notesError } = await supabase
        .from('projects')
        .update({ project_notes })
        .eq('id', id)
      if (notesError) {
        console.error('[PUT /api/projects/[id]/milestones] project_notes update error:', notesError.message)
      }
    }

    try {
      const projectName = project.site_name
      const emailPromises: Promise<void>[] = []

      // Deleted milestones
      for (const deletedId of deleted_ids as string[]) {
        const current = currentMap.get(deletedId)
        if (current?.owner) {
          const email = ownerEmailMap.get(current.owner)
          if (email) {
            emailPromises.push(sendEmail({
              to: email,
              subject: `AmeriCloud Site Tracker - ${projectName} - Milestone Deleted`,
              text: `A milestone you were assigned to has been deleted from project "${projectName}".\n\nMilestone: ${current.details ?? '(untitled)'}\nProjected Date: ${current.projected_date ?? '—'}\nNotes: ${current.notes ?? '—'}`,
            }))
          }
        }
      }

      // Upserted milestones
      const incomingRows = milestones as Record<string, unknown>[]
      for (const row of incomingRows) {
        const newOwner = (row.owner as string) || ''
        const newDetails = (row.details as string) || ''
        const newProjectedDate = (row.projected_date as string) || ''
        const newActualizedDate = (row.actualized_date as string) || ''
        const newNotes = (row.notes as string) || ''
        const rowId = row.id as string | undefined

        if (!newOwner) continue
        const email = ownerEmailMap.get(newOwner)
        if (!email) continue

        if (!rowId) {
          // New milestone — Assigned
          emailPromises.push(sendEmail({
            to: email,
            subject: `AmeriCloud Site Tracker - ${projectName} - Milestone Assigned`,
            text: `You have been assigned to a milestone on project "${projectName}".\n\nMilestone: ${newDetails || '(untitled)'}\nProjected Date: ${newProjectedDate || '—'}\nNotes: ${newNotes || '—'}`,
          }))
        } else {
          const current = currentMap.get(rowId)
          if (!current) {
            // No current record found — treat as assigned
            emailPromises.push(sendEmail({
              to: email,
              subject: `AmeriCloud Site Tracker - ${projectName} - Milestone Assigned`,
              text: `You have been assigned to a milestone on project "${projectName}".\n\nMilestone: ${newDetails || '(untitled)'}\nProjected Date: ${newProjectedDate || '—'}\nNotes: ${newNotes || '—'}`,
            }))
          } else {
            const oldOwner = current.owner ?? ''
            if (newOwner !== oldOwner) {
              // Owner changed — Assigned
              emailPromises.push(sendEmail({
                to: email,
                subject: `AmeriCloud Site Tracker - ${projectName} - Milestone Assigned`,
                text: `You have been assigned to a milestone on project "${projectName}".\n\nMilestone: ${newDetails || '(untitled)'}\nProjected Date: ${newProjectedDate || '—'}\nNotes: ${newNotes || '—'}`,
              }))
            } else if (
              newDetails !== (current.details ?? '') ||
              newProjectedDate !== (current.projected_date ?? '') ||
              newActualizedDate !== (current.actualized_date ?? '') ||
              newNotes !== (current.notes ?? '')
            ) {
              // Same owner, fields changed — Changed
              emailPromises.push(sendEmail({
                to: email,
                subject: `AmeriCloud Site Tracker - ${projectName} - Milestone Changed`,
                text: `A milestone you are assigned to has been updated on project "${projectName}".\n\nMilestone: ${newDetails || '(untitled)'}\nProjected Date: ${newProjectedDate || '—'}\nActual Date: ${newActualizedDate || '—'}\nNotes: ${newNotes || '—'}`,
              }))
            }
          }
        }
      }

      await Promise.all(emailPromises)
    } catch (emailErr) {
      console.error('[PUT /api/projects/[id]/milestones] email error:', emailErr)
    }

    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('project_id', id)
      .order('sort_order', { ascending: true })

    if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })
    return NextResponse.json({ milestones: data, project_notes: project_notes ?? '' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
