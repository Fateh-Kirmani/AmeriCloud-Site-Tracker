import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const { id, fileId } = await params
  try {
    const supabase = createSupabaseClient()
    const { data: file } = await supabase
      .from('project_files')
      .select('*')
      .eq('id', fileId)
      .eq('project_id', id)
      .maybeSingle()

    if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 })

    const { error: storageError } = await supabase.storage
      .from('project-files')
      .remove([file.storage_path])

    if (storageError) {
      console.error('[DELETE /api/projects/[id]/files/[fileId]] storage error:', storageError.message)
      // Continue to delete DB record even if storage removal fails
    }

    const { error } = await supabase.from('project_files').delete().eq('id', fileId)
    if (error) {
      console.error('[DELETE /api/projects/[id]/files/[fileId]] db error:', error.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
