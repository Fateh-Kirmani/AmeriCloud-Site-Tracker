import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'
import { projectSchema } from '@/types/project'

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    const parsed = projectSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const cleanedData = Object.fromEntries(
      Object.entries(parsed.data).filter(([, v]) => v !== '')
    ) as typeof parsed.data

    const insertData = {
      ...cleanedData,
      address: parsed.data.address || null,
    }

    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('projects')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('[POST /api/projects] Supabase error:', error.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const VALID_SORT_COLUMNS = ['site_name', 'americloud_site_id', 'status', 'client', 'created_at'] as const

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') ?? ''
    const projectCode = searchParams.get('project_code') ?? ''
    const client = searchParams.get('client') ?? ''
    const template = searchParams.get('template') ?? ''
    const pm = searchParams.get('pm') ?? ''
    const status = searchParams.get('status') ?? ''
    const date = searchParams.get('date') ?? ''
    const sortParam = searchParams.get('sort') ?? 'created_at'
    const dir = searchParams.get('dir') === 'asc' ? 'asc' : 'desc'
    const sort = VALID_SORT_COLUMNS.includes(sortParam as typeof VALID_SORT_COLUMNS[number])
      ? sortParam
      : 'created_at'

    const supabase = createSupabaseClient()
    let query = supabase.from('projects').select('*')

    if (search) {
      query = query.or(
        `site_name.ilike.%${search}%,client.ilike.%${search}%,americloud_site_id.ilike.%${search}%,americloud_pm.ilike.%${search}%`
      )
    }
    if (projectCode) query = query.ilike('americloud_site_id', `%${projectCode}%`)
    if (client) query = query.eq('client', client)
    if (template) query = query.eq('project_template', template)
    if (pm) query = query.eq('americloud_pm', pm)
    if (status) query = query.eq('status', status)
    if (date) query = query.gte('created_at', date)

    const { data, error } = await query.order(sort, { ascending: dir === 'asc' })

    if (error) {
      console.error('[GET /api/projects] Supabase error:', error.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
