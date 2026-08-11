import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = createSupabaseClient()
    const { data: project } = await supabase.from('projects').select('id').eq('id', id).maybeSingle()
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    const { data: milestones } = await supabase
      .from('milestones')
      .select('id')
      .eq('project_id', id)

    const milestoneIds = (milestones ?? []).map(m => m.id)
    if (milestoneIds.length === 0) return NextResponse.json({})

    const { data: tasks, error } = await supabase
      .from('milestone_tasks')
      .select('*')
      .in('milestone_id', milestoneIds)
      .order('sort_order')

    if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })

    // Group by milestone_id
    const grouped: Record<string, { id: string; task: string; sort_order: number }[]> = {}
    for (const t of tasks ?? []) {
      if (!grouped[t.milestone_id]) grouped[t.milestone_id] = []
      grouped[t.milestone_id].push({ id: t.id, task: t.task, sort_order: t.sort_order })
    }
    return NextResponse.json(grouped)
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
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { milestone_id, tasks } = body as { milestone_id: unknown; tasks: unknown }
  if (!milestone_id || typeof milestone_id !== 'string' || !Array.isArray(tasks)) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  try {
    const supabase = createSupabaseClient()
    // Delete existing tasks for this milestone
    await supabase.from('milestone_tasks').delete().eq('milestone_id', milestone_id)

    // Insert new tasks
    if (tasks.length > 0) {
      const rows = (tasks as { task?: string }[])
        .filter(t => t.task?.trim())
        .map((t, i) => ({ milestone_id, task: (t.task as string).trim(), sort_order: i }))
      if (rows.length > 0) {
        const { error } = await supabase.from('milestone_tasks').insert(rows)
        if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }
    }

    const { data } = await supabase
      .from('milestone_tasks')
      .select('*')
      .eq('milestone_id', milestone_id)
      .order('sort_order')

    return NextResponse.json({ tasks: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
