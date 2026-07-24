/** @jest-environment node */

import { NextRequest } from 'next/server'

jest.mock('@/lib/supabase', () => ({
  createSupabaseClient: jest.fn(),
}))

import { createSupabaseClient } from '@/lib/supabase'
import { GET, POST } from '@/app/api/projects/[id]/files/route'
import { DELETE } from '@/app/api/projects/[id]/files/[fileId]/route'

const PROJECT_ID = 'proj-123'
const FILE_ID = 'file-456'

function makeParams(id = PROJECT_ID) {
  return { params: Promise.resolve({ id }) }
}
function makeFileParams(id = PROJECT_ID, fileId = FILE_ID) {
  return { params: Promise.resolve({ id, fileId }) }
}
function makeGetRequest() {
  return new NextRequest(`http://localhost/api/projects/${PROJECT_ID}/files`)
}
function makeDeleteRequest() {
  return new NextRequest(`http://localhost/api/projects/${PROJECT_ID}/files/${FILE_ID}`, { method: 'DELETE' })
}

function makeStorageMock(uploadResult = { error: null }, signedUrlResult = { data: { signedUrl: 'https://signed.url/file.pdf' }, error: null }, removeResult = { error: null }) {
  return {
    from: jest.fn().mockReturnValue({
      upload: jest.fn().mockResolvedValue(uploadResult),
      createSignedUrl: jest.fn().mockResolvedValue(signedUrlResult),
      remove: jest.fn().mockResolvedValue(removeResult),
    }),
  }
}

describe('GET /api/projects/[id]/files', () => {
  it('returns 404 when project not found', async () => {
    ;(createSupabaseClient as jest.Mock).mockReturnValue({
      from: jest.fn().mockImplementation(() => ({
        select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }),
      })),
      storage: makeStorageMock(),
    })
    const res = await GET(makeGetRequest(), makeParams())
    expect(res.status).toBe(404)
  })

  it('returns files with signed URLs', async () => {
    const dbFiles = [{ id: FILE_ID, project_id: PROJECT_ID, file_name: 'report.pdf', file_type: 'Contract', storage_path: `projects/${PROJECT_ID}/report.pdf`, created_at: '2026-07-24T00:00:00Z' }]
    ;(createSupabaseClient as jest.Mock).mockReturnValue({
      from: jest.fn().mockImplementation((table: string) => {
        if (table === 'projects') {
          return { select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { id: PROJECT_ID }, error: null }) }) }) }
        }
        return { select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: dbFiles, error: null }) }) }) }
      }),
      storage: makeStorageMock(),
    })
    const res = await GET(makeGetRequest(), makeParams())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].url).toBe('https://signed.url/file.pdf')
    expect(body[0].file_name).toBe('report.pdf')
  })
})

describe('POST /api/projects/[id]/files', () => {
  it('returns 404 when project not found', async () => {
    ;(createSupabaseClient as jest.Mock).mockReturnValue({
      from: jest.fn().mockImplementation(() => ({
        select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }),
      })),
      storage: makeStorageMock(),
    })
    const mockRequest = {
      formData: async () => ({ get: (k: string) => k === 'file' ? { name: 'f.pdf', type: 'application/pdf', arrayBuffer: async () => new ArrayBuffer(8) } : 'Contract' }),
    } as unknown as NextRequest
    const res = await POST(mockRequest, makeParams())
    expect(res.status).toBe(404)
  })

  it('returns 400 when no file provided', async () => {
    ;(createSupabaseClient as jest.Mock).mockReturnValue({
      from: jest.fn().mockImplementation(() => ({
        select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { id: PROJECT_ID }, error: null }) }) }),
      })),
      storage: makeStorageMock(),
    })
    const mockRequest = {
      formData: async () => ({ get: () => null }),
    } as unknown as NextRequest
    const res = await POST(mockRequest, makeParams())
    expect(res.status).toBe(400)
  })

  it('uploads file and returns 201 with signed URL', async () => {
    const newRecord = { id: FILE_ID, project_id: PROJECT_ID, file_name: 'report.pdf', file_type: 'Contract', storage_path: `projects/${PROJECT_ID}/report.pdf`, created_at: '2026-07-24T00:00:00Z' }
    ;(createSupabaseClient as jest.Mock).mockReturnValue({
      from: jest.fn().mockImplementation((table: string) => {
        if (table === 'projects') {
          return { select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { id: PROJECT_ID }, error: null }) }) }) }
        }
        return {
          select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }) }),
          insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: newRecord, error: null }) }) }),
        }
      }),
      storage: makeStorageMock(),
    })
    const mockRequest = {
      formData: async () => ({
        get: (k: string) => k === 'file'
          ? { name: 'report.pdf', type: 'application/pdf', arrayBuffer: async () => new ArrayBuffer(8) }
          : 'Contract',
      }),
    } as unknown as NextRequest
    const res = await POST(mockRequest, makeParams())
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.file_name).toBe('report.pdf')
    expect(body.url).toBe('https://signed.url/file.pdf')
  })
})

describe('DELETE /api/projects/[id]/files/[fileId]', () => {
  it('returns 404 when file not found', async () => {
    ;(createSupabaseClient as jest.Mock).mockReturnValue({
      from: jest.fn().mockImplementation(() => ({
        select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }) }),
      })),
      storage: makeStorageMock(),
    })
    const res = await DELETE(makeDeleteRequest(), makeFileParams())
    expect(res.status).toBe(404)
  })

  it('deletes from storage and DB, returns success', async () => {
    const fileRecord = { id: FILE_ID, project_id: PROJECT_ID, file_name: 'report.pdf', storage_path: `projects/${PROJECT_ID}/report.pdf` }
    const mockDbDelete = jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) })
    ;(createSupabaseClient as jest.Mock).mockReturnValue({
      from: jest.fn().mockImplementation(() => ({
        select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: fileRecord, error: null }) }) }) }),
        delete: mockDbDelete,
      })),
      storage: makeStorageMock(),
    })
    const res = await DELETE(makeDeleteRequest(), makeFileParams())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(mockDbDelete).toHaveBeenCalled()
  })
})
