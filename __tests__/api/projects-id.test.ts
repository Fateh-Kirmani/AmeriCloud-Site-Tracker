/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { PUT, DELETE } from '@/app/api/projects/[id]/route'

const mockMaybeSingle = jest.fn()
const mockSelect = jest.fn(() => ({ maybeSingle: mockMaybeSingle }))
const mockUpdate = jest.fn(() => ({ select: mockSelect }))
const mockEqUpdate = jest.fn(() => ({ select: mockSelect }))
const mockEqDelete = jest.fn()
const mockDelete = jest.fn(() => ({ eq: mockEqDelete }))

const mockSupabase = {
  from: jest.fn(),
}

jest.mock('@/lib/supabase', () => ({
  createSupabaseClient: () => mockSupabase,
}))

const validBody = {
  site_name: 'Tower Beta',
  address: '200 Oak Ave',
  americloud_site_id: 'AC-002',
  client: 'Verizon',
}

function makeRequest(method: string, body?: object) {
  return new Request('http://localhost/api/projects/test-id', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  }) as unknown as NextRequest
}

const mockParams = Promise.resolve({ id: 'test-id' })

describe('PUT /api/projects/[id]', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 400 on invalid body', async () => {
    const req = makeRequest('PUT', { site_name: '' })
    const res = await PUT(req, { params: mockParams })
    expect(res.status).toBe(400)
  })

  it('returns 200 with updated project', async () => {
    const updated = { id: 'test-id', ...validBody, created_at: '2026-07-20T00:00:00Z' }
    mockMaybeSingle.mockResolvedValue({ data: updated, error: null })
    mockSelect.mockReturnValue({ maybeSingle: mockMaybeSingle })
    mockEqUpdate.mockReturnValue({ select: mockSelect })
    mockUpdate.mockReturnValue({ eq: mockEqUpdate })
    mockSupabase.from.mockReturnValue({ update: mockUpdate })

    const req = makeRequest('PUT', validBody)
    const res = await PUT(req, { params: mockParams })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.site_name).toBe('Tower Beta')
  })

  it('returns 404 when row not found', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    mockSelect.mockReturnValue({ maybeSingle: mockMaybeSingle })
    mockEqUpdate.mockReturnValue({ select: mockSelect })
    mockUpdate.mockReturnValue({ eq: mockEqUpdate })
    mockSupabase.from.mockReturnValue({ update: mockUpdate })

    const req = makeRequest('PUT', validBody)
    const res = await PUT(req, { params: mockParams })
    expect(res.status).toBe(404)
  })

  it('returns 500 on Supabase error', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: { message: 'DB error' } })
    mockSelect.mockReturnValue({ maybeSingle: mockMaybeSingle })
    mockEqUpdate.mockReturnValue({ select: mockSelect })
    mockUpdate.mockReturnValue({ eq: mockEqUpdate })
    mockSupabase.from.mockReturnValue({ update: mockUpdate })

    const req = makeRequest('PUT', validBody)
    const res = await PUT(req, { params: mockParams })
    expect(res.status).toBe(500)
  })
})

describe('DELETE /api/projects/[id]', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 200 on success', async () => {
    mockEqDelete.mockResolvedValue({ error: null, count: 1 })
    mockDelete.mockReturnValue({ eq: mockEqDelete })
    mockSupabase.from.mockReturnValue({ delete: mockDelete })

    const req = makeRequest('DELETE')
    const res = await DELETE(req, { params: mockParams })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it('returns 500 on Supabase error', async () => {
    mockEqDelete.mockResolvedValue({ error: { message: 'DB error' }, count: 0 })
    mockDelete.mockReturnValue({ eq: mockEqDelete })
    mockSupabase.from.mockReturnValue({ delete: mockDelete })

    const req = makeRequest('DELETE')
    const res = await DELETE(req, { params: mockParams })
    expect(res.status).toBe(500)
  })
})
