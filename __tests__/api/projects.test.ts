/**
 * @jest-environment node
 */
import { POST } from '@/app/api/projects/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/supabase', () => ({
  createSupabaseClient: jest.fn(),
}))

import { createSupabaseClient } from '@/lib/supabase'

const mockSingle = jest.fn()
const mockSelect = jest.fn(() => ({ single: mockSingle }))
const mockInsert = jest.fn(() => ({ select: mockSelect }))
const mockFrom = jest.fn(() => ({ insert: mockInsert }))

const validBody = {
  site_name: 'Test Site',
  address: '123 Main St',
  americloud_site_id: 'AC-001',
  client: 'AT&T',
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
  ;(createSupabaseClient as jest.Mock).mockReturnValue({ from: mockFrom })
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
