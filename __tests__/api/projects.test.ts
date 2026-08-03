/**
 * @jest-environment node
 */
import { POST, GET } from '@/app/api/projects/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/supabase', () => ({
  createSupabaseClient: jest.fn(),
}))

import { createSupabaseClient } from '@/lib/supabase'

const mockSingle = jest.fn()
const mockSelect = jest.fn(() => ({ single: mockSingle }))
const mockInsert = jest.fn(() => ({ select: mockSelect }))
const mockFrom = jest.fn(() => ({ insert: mockInsert }))
const mockSupabase = { from: mockFrom }

const validBody = {
  site_name: 'Test Site',
  street: '123 Main St',
  city: 'New York',
  americloud_site_id: 'AC-001',
  client: 'AT&T',
  status: 'Active',
}

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockFrom.mockReset()
  mockFrom.mockImplementation(() => ({ insert: mockInsert }))
  ;(createSupabaseClient as jest.Mock).mockReturnValue(mockSupabase)
})

describe('POST /api/projects', () => {
  it('returns 201 with project data on success', async () => {
    const project = { id: 'abc-123', ...validBody }
    mockSingle.mockResolvedValue({ data: project, error: null })

    const res = await POST(makeRequest(validBody))

    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.id).toBe('abc-123')
  })

  it('returns 400 when required fields are missing', async () => {
    const res = await POST(makeRequest({ site_name: '' }))
    expect(res.status).toBe(400)
  })

  it('returns 500 when Supabase returns an error', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'DB error' } })

    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(500)
  })
})

describe('GET /api/projects', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 200 with an array of projects', async () => {
    const mockProjects = [
      {
        id: 'abc-123',
        site_name: 'Tower Alpha',
        address: '100 Main St',
        americloud_site_id: 'AC-001',
        client: 'AT&T',
        client_site_id: null,
        pm_name: null,
        pm_email: null,
        pm_phone: null,
        rf_engineer_name: null,
        rf_engineer_email: null,
        rf_engineer_phone: null,
        americloud_pm: null,
        americloud_rf: null,
        project_scope: null,
        project_template: null,
        created_at: '2026-07-20T00:00:00Z',
      },
    ]
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        or: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockProjects, error: null }),
      }),
    })
    const req = new Request('http://localhost/api/projects')
    const res = await GET(req as NextRequest)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body[0].site_name).toBe('Tower Alpha')
  })

  it('returns 500 when Supabase errors', async () => {
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        ilike: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB down' } }),
      }),
    })
    const req = new Request('http://localhost/api/projects')
    const res = await GET(req as NextRequest)
    expect(res.status).toBe(500)
  })
})
