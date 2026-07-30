import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('milestone_templates')
      .select('id, name, milestone_template_items(id, details, notes, sort_order)')
      .order('name')

    if (error) {
      console.error('[GET /api/milestone-templates]', error.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const templates = (data ?? []).map((t: {
      id: string
      name: string
      milestone_template_items: { id: string; details: string | null; notes: string | null; sort_order: number }[] | null
    }) => ({
      id: t.id,
      name: t.name,
      items: (t.milestone_template_items ?? []).sort((a, b) => a.sort_order - b.sort_order),
    }))

    return NextResponse.json(templates)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { name, items } = body as { name: unknown; items: unknown }
  if (!name || typeof name !== 'string' || !Array.isArray(items)) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  try {
    const supabase = createSupabaseClient()

    const { data: template, error: templateError } = await supabase
      .from('milestone_templates')
      .insert({ name: name.trim() })
      .select('id, name')
      .single()

    if (templateError) {
      if (templateError.code === '23505') {
        return NextResponse.json({ error: 'A template with that name already exists.' }, { status: 409 })
      }
      console.error('[POST /api/milestone-templates]', templateError.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (items.length > 0) {
      const rows = (items as { details?: string; notes?: string }[]).map((item, i) => ({
        template_id: template.id,
        details: item.details || null,
        notes: item.notes || null,
        sort_order: i,
      }))
      const { error: itemsError } = await supabase.from('milestone_template_items').insert(rows)
      if (itemsError) {
        console.error('[POST /api/milestone-templates] items error:', itemsError.message)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }
    }

    return NextResponse.json({ id: template.id, name: template.name }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
