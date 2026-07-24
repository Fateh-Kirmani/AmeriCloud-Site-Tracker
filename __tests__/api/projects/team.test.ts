/** @jest-environment node */

import { NextRequest } from 'next/server'

jest.mock('@/lib/supabase', () => ({
  createSupabaseClient: jest.fn(),
}))

import { createSupabaseClient } from '@/lib/supabase'
import { GET, PUT } from '@/app/api/projects/[id]/team/route'

const PROJECT_ID = 'proj-123'

function makeParams(id = PROJECT_ID) {
  return { params: Promise.resolve({ id }) }
}
function makeGetRequest() {
  return new NextRequest(`http://localhost/api/projects/${PROJECT_ID}/team`)
}
function makePutRequest(body: object) {
  return new NextRequest(`http://localhost/api/projects/${PROJECT_ID}/team`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('GET /api/projects/[id]/team', () => {
  it('returns 404 when project not found', async () => {
    ;(createSupabaseClient as jest.Mock).mockReturnValue({
      from: jest.fn().mockImplementation(() => ({
        select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }),
      })),
    })
    const res = await GET(makeGetRequest(), makeParams())
    expect(res.status).toBe(404)
  })

  it('returns team_members and milestones when project exists', async () => {
    const teamMembers = [{ id: 'tm-1', project_id: PROJECT_ID, name: 'Bob', task_milestone_id: 'ms-1', date_from: null, date_to: null, created_at: '2026-07-24T00:00:00Z' }]
    const milestones = [{ id: 'ms-1', details: 'Phase 1' }]
    ;(createSupabaseClient as jest.Mock).mockReturnValue({
      from: jest.fn().mockImplementation((table: string) => {
        if (table === 'projects') {
          return { select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { id: PROJECT_ID }, error: null }) }) }) }
        }
        if (table === 'team_members') {
          return { select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: teamMembers, error: null }) }) }) }
        }
        // milestones
        return { select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: milestones, error: null }) }) }) }
      }),
    })
    const res = await GET(makeGetRequest(), makeParams())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.team_members).toHaveLength(1)
    expect(body.milestones).toHaveLength(1)
    expect(body.milestones[0].details).toBe('Phase 1')
  })

  it('returns 500 when milestones query fails', async () => {
    ;(createSupabaseClient as jest.Mock).mockReturnValue({
      from: jest.fn().mockImplementation((table: string) => {
        if (table === 'projects') {
          return { select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { id: PROJECT_ID }, error: null }) }) }) }
        }
        if (table === 'team_members') {
          return { select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }) }
        }
        // milestones table fails
        return { select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: null, error: { message: 'DB error' } }) }) }) }
      }),
    })
    const res = await GET(makeGetRequest(), makeParams())
    expect(res.status).toBe(500)
  })
})

describe('PUT /api/projects/[id]/team', () => {
  it('returns 404 when project not found', async () => {
    ;(createSupabaseClient as jest.Mock).mockReturnValue({
      from: jest.fn().mockImplementation(() => ({
        select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }),
      })),
    })
    const res = await PUT(makePutRequest({ team_members: [], deleted_ids: [] }), makeParams())
    expect(res.status).toBe(404)
  })

  it('returns 400 for invalid body shape', async () => {
    ;(createSupabaseClient as jest.Mock).mockReturnValue({
      from: jest.fn().mockImplementation(() => ({
        select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { id: PROJECT_ID }, error: null }) }) }),
      })),
    })
    const res = await PUT(makePutRequest({ team_members: 'bad', deleted_ids: [] }), makeParams())
    expect(res.status).toBe(400)
  })

  it('deletes and upserts team members, returns updated list', async () => {
    const saved = [{ id: 'tm-new', project_id: PROJECT_ID, name: 'Alice', task_milestone_id: null, date_from: null, date_to: null, created_at: '2026-07-24T00:00:00Z' }]
    const mockDelete = jest.fn().mockReturnValue({ in: jest.fn().mockResolvedValue({ error: null }) })
    const mockUpsert = jest.fn().mockResolvedValue({ error: null })
    ;(createSupabaseClient as jest.Mock).mockReturnValue({
      from: jest.fn().mockImplementation((table: string) => {
        if (table === 'projects') {
          return { select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { id: PROJECT_ID }, error: null }) }) }) }
        }
        return {
          delete: mockDelete,
          upsert: mockUpsert,
          select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: saved, error: null }) }) }),
        }
      }),
    })
    const res = await PUT(
      makePutRequest({ team_members: [{ name: 'Alice', task_milestone_id: null, date_from: '', date_to: '' }], deleted_ids: ['old-tm-id'] }),
      makeParams()
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.team_members).toHaveLength(1)
    expect(mockDelete).toHaveBeenCalled()
    expect(mockUpsert).toHaveBeenCalled()
  })
})
