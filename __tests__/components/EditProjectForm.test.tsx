/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import EditProjectForm from '@/components/forms/EditProjectForm'
import { Project } from '@/types/project'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

global.fetch = jest.fn()

const mockProject: Project = {
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
}

describe('EditProjectForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('pre-fills site name from project', () => {
    render(<EditProjectForm project={mockProject} />)
    expect(screen.getByDisplayValue('Tower Alpha')).toBeInTheDocument()
  })

  it('pre-fills client dropdown from project', () => {
    render(<EditProjectForm project={mockProject} />)
    expect(screen.getByRole('combobox', { name: /client/i })).toHaveValue('AT&T')
  })

  it('shows success toast and redirects on successful submit', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ ...mockProject, site_name: 'Tower Alpha Updated' }),
    })
    render(<EditProjectForm project={mockProject} />)
    fireEvent.submit(screen.getByRole('form'))
    await waitFor(() =>
      expect(screen.getByText('Project updated successfully')).toBeInTheDocument()
    )
    jest.advanceTimersByTime(1000)
    expect(mockPush).toHaveBeenCalledWith('/')
  })

  it('shows error toast on failed submit', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false })
    render(<EditProjectForm project={mockProject} />)
    fireEvent.submit(screen.getByRole('form'))
    await waitFor(() =>
      expect(screen.getByText('Failed to update project')).toBeInTheDocument()
    )
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('has a Cancel button that navigates to /', () => {
    render(<EditProjectForm project={mockProject} />)
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(mockPush).toHaveBeenCalledWith('/')
  })
})
