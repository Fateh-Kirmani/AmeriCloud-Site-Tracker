import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createSupabaseClient } from '@/lib/supabase'
import { authOptions } from '@/lib/auth'
import { isProjectCreator } from '@/lib/permissions'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('project_editors')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: true })
    if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const creator = await isProjectCreator(id, session.user.email)
  if (!creator) return NextResponse.json({ error: 'Only the project creator can manage access.' }, { status: 403 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { email, name } = body as { email?: string; name?: string }
  if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 })

  // Don't let the creator add themselves
  if (email.toLowerCase() === session.user.email.toLowerCase()) {
    return NextResponse.json({ error: 'You are already the creator of this project.' }, { status: 400 })
  }

  try {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('project_editors')
      .insert({ project_id: id, email: email.toLowerCase(), name: name ?? null, granted_by: session.user.email })
      .select()
      .single()
    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'This person already has editor access.' }, { status: 409 })
      console.error('[POST /api/projects/[id]/editors]', error.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
