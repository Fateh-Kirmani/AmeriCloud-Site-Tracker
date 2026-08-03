/** @jest-environment node */

import { NextRequest } from 'next/server'

jest.mock('@/lib/supabase', () => ({
  createSupabaseClient: jest.fn(),
}))

import { createSupabaseClient } from '@/lib/supabase'
import { GET, PUT } from '@/app/api/projects/[id]/milestones/route'

const PROJECT_ID = 'proj-123'

function makeParams(id = PROJECT_ID) {
  return { params: Promise.resolve({ id }) }
}

function makeGetRequest() {
  return new NextRequest(`http://localhost/api/projects/${PROJECT_ID}/milestones`)
}

function makePutRequest(body: object) {
  return new NextRequest(`http://localhost/api/projects/${PROJECT_ID}/milestones`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

/** Mock `from('projects')` to support both maybeSingle (project check) and single (project_notes fetch) */
function makeProjectsMock(projectData: object | null) {
  return {
    select: () => ({
      eq: () => ({
        maybeSingle: () => Promise.resolve({ data: projectData, error: null }),
        single: () => Promise.resolve({ data: projectData ? { project_notes: null } : null, error: null }),
      }),
    }),
  }
}

describe('GET /api/projects/[id]/milestones', () => {
  it('returns 404 when project not found', async () => {
    ;(createSupabaseClient as jest.Mock).mockReturnValue({
      from: jest.fn().mockImplementation((table: string) => {
        if (table === 'projects') return makeProjectsMock(null)
        return {}
      }),
    })
    const res = await GET(makeGetRequest(), makeParams())
    expect(res.status).toBe(404)
  })

  it('returns milestones array when project exists', async () => {
    const milestones = [
      { id: 'ms-1', project_id: PROJECT_ID, details: 'Phase 1', owner: 'Alice', projected_date: '2026-08-01', actualized_date: null, notes: null, created_at: '2026-07-24T00:00:00Z' },
    ]
    ;(createSupabaseClient as jest.Mock).mockReturnValue({
      from: jest.fn().mockImplementation((table: string) => {
        if (table === 'projects') return makeProjectsMock({ id: PROJECT_ID })
        return { select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: milestones, error: null }) }) }) }
      }),
    })
    const res = await GET(makeGetRequest(), makeParams())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.milestones).toHaveLength(1)
    expect(body.milestones[0].details).toBe('Phase 1')
  })

  it('returns 500 on database error', async () => {
    ;(createSupabaseClient as jest.Mock).mockReturnValue({
      from: jest.fn().mockImplementation((table: string) => {
        if (table === 'projects') return makeProjectsMock({ id: PROJECT_ID })
        return { select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: null, error: { message: 'DB error' } }) }) }) }
      }),
    })
    const res = await GET(makeGetRequest(), makeParams())
    expect(res.status).toBe(500)
  })
})

describe('PUT /api/projects/[id]/milestones', () => {
  it('returns 404 when project not found', async () => {
    ;(createSupabaseClient as jest.Mock).mockReturnValue({
      from: jest.fn().mockImplementation((table: string) => {
        if (table === 'projects') return makeProjectsMock(null)
        return {}
      }),
    })
    const res = await PUT(makePutRequest({ milestones: [], deleted_ids: [] }), makeParams())
    expect(res.status).toBe(404)
  })

  it('returns 400 for invalid body shape', async () => {
    ;(createSupabaseClient as jest.Mock).mockReturnValue({
      from: jest.fn().mockImplementation((table: string) => {
        if (table === 'projects') return makeProjectsMock({ id: PROJECT_ID })
        return {}
      }),
    })
    const res = await PUT(makePutRequest({ milestones: 'not-array', deleted_ids: [] }), makeParams())
    expect(res.status).toBe(400)
  })

  it('deletes, upserts, and returns updated milestones', async () => {
    const savedMilestones = [{ id: 'ms-new', project_id: PROJECT_ID, details: 'New', owner: null, projected_date: null, actualized_date: null, notes: null, created_at: '2026-07-24T00:00:00Z' }]
    const mockDelete = jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ in: jest.fn().mockResolvedValue({ error: null }) }) })
    const mockUpsert = jest.fn().mockResolvedValue({ error: null })
    ;(createSupabaseClient as jest.Mock).mockReturnValue({
      from: jest.fn().mockImplementation((table: string) => {
        if (table === 'projects') return makeProjectsMock({ id: PROJECT_ID })
        return {
          delete: mockDelete,
          upsert: mockUpsert,
          update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
          select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: savedMilestones, error: null }) }) }),
        }
      }),
    })
    const res = await PUT(
      makePutRequest({ milestones: [{ details: 'New', owner: '', projected_date: '', actualized_date: '', notes: '' }], deleted_ids: ['old-id'] }),
      makeParams()
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.milestones).toHaveLength(1)
    expect(mockDelete).toHaveBeenCalled()
    expect(mockUpsert).toHaveBeenCalled()
  })
})
