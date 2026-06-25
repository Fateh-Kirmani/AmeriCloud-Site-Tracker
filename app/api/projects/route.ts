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

    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('projects')
      .insert(cleanedData)
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
