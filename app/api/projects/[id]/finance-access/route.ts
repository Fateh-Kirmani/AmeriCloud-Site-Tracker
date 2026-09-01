import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createSupabaseClient } from '@/lib/supabase'
import { authOptions } from '@/lib/auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = createSupabaseClient()

  const { data: project } = await supabase
    .from('projects')
    .select('id, created_by')
    .eq('id', id)
    .maybeSingle()

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const userEmail = session.user.email.toLowerCase()
  // null created_by = no owner set yet — treat as accessible to all (backward compat)
  const isOwner = !project.created_by || project.created_by.toLowerCase() === userEmail

  const { data: accessList } = await supabase
    .from('finance_access')
    .select('id, user_email, user_name, created_at')
    .eq('project_id', id)
    .order('created_at', { ascending: true })

  const hasAccess =
    isOwner || (accessList ?? []).some(a => a.user_email.toLowerCase() === userEmail)

  return NextResponse.json({ isOwner, hasAccess, accessList: accessList ?? [] })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = createSupabaseClient()

  const { data: project } = await supabase
    .from('projects')
    .select('id, created_by')
    .eq('id', id)
    .maybeSingle()

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const userEmail = session.user.email.toLowerCase()
  const isOwner = !project.created_by || project.created_by.toLowerCase() === userEmail
  if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { user_email, user_name } = body as { user_email?: string; user_name?: string }
  if (!user_email || typeof user_email !== 'string' || !user_email.trim()) {
    return NextResponse.json({ error: 'user_email is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('finance_access')
    .insert({
      project_id: id,
      user_email: user_email.toLowerCase().trim(),
      user_name: user_name?.trim() || null,
      granted_by: userEmail,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'User already has access' }, { status: 409 })
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
