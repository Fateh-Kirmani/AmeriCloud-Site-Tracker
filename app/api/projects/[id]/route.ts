import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createSupabaseClient } from '@/lib/supabase'
import { projectSchema } from '@/types/project'
import { authOptions } from '@/lib/auth'
import { canEditProject, isProjectCreator } from '@/lib/permissions'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const authorized = await canEditProject(id, session.user.email)
  if (!authorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = projectSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const cleanedData = Object.fromEntries(
    Object.entries(parsed.data).map(([k, v]) => [k, v === '' ? null : v])
  ) as typeof parsed.data

  const updateData = {
    ...cleanedData,
    // address column has a NOT NULL constraint; fall back to street for existing rows
    address: parsed.data.address || parsed.data.street || '',
  }

  try {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .maybeSingle()

    if (error) {
      console.error('[PUT /api/projects/[id]] Supabase error:', error.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const creator = await isProjectCreator(id, session.user.email)
  if (!creator) return NextResponse.json({ error: 'Only the project creator can delete this project.' }, { status: 403 })

  try {
    const supabase = createSupabaseClient()
    const { error } = await supabase.from('projects').delete().eq('id', id)

    if (error) {
      console.error('[DELETE /api/projects/[id]] Supabase error:', error.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
