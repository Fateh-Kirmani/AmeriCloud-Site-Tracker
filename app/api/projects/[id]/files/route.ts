import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

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

    const { data: files, error } = await supabase
      .from('project_files')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[GET /api/projects/[id]/files]', error.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const filesWithUrls = await Promise.all(
      (files ?? []).map(async (file) => {
        const { data: signed } = await supabase.storage
          .from('project-files')
          .createSignedUrl(file.storage_path, 3600)
        return { ...file, url: signed?.signedUrl ?? null }
      })
    )
    return NextResponse.json(filesWithUrls)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
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

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const fileType = formData.get('file_type') as string | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const storagePath = `projects/${id}/${file.name}`
    const arrayBuffer = await file.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from('project-files')
      .upload(storagePath, arrayBuffer, { contentType: file.type, upsert: true })

    if (uploadError) {
      console.error('[POST /api/projects/[id]/files] upload error:', uploadError.message)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    // Upsert DB record (handle duplicate filenames)
    const { data: existing } = await supabase
      .from('project_files')
      .select('id')
      .eq('project_id', id)
      .eq('file_name', file.name)
      .maybeSingle()

    let fileRecord
    if (existing) {
      const { data, error } = await supabase
        .from('project_files')
        .update({ file_type: fileType || null })
        .eq('id', existing.id)
        .select()
        .single()
      if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })
      fileRecord = data
    } else {
      const { data, error } = await supabase
        .from('project_files')
        .insert({ project_id: id, file_name: file.name, file_type: fileType || null, storage_path: storagePath })
        .select()
        .single()
      if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })
      fileRecord = data
    }

    const { data: signed } = await supabase.storage
      .from('project-files')
      .createSignedUrl(storagePath, 3600)

    return NextResponse.json({ ...fileRecord, url: signed?.signedUrl ?? null }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
