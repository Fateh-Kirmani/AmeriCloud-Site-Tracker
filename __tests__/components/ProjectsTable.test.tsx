/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react'
import ProjectsTable from '@/components/projects/ProjectsTable'
import { Project } from '@/types/project'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const mockProject: Project = {
  id: 'abc-123',
  site_name: 'Tower Alpha',
  address: '100 Main St, Springfield',
  americloud_site_id: 'AC-001',
  client: 'AT&T',
  client_site_id: 'ATT-999',
  pm_name: null,
  pm_email: null,
  pm_phone: null,
  rf_engineer_name: null,
  rf_engineer_email: null,
  rf_engineer_phone: null,
  americloud_pm: null,
  americloud_rf: null,
  project_scope: null,
  project_template: 'Standard Cell Tower',
  created_at: '2026-07-20T00:00:00Z',
}

describe('ProjectsTable', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders project rows', () => {
    render(
      <ProjectsTable
        projects={[mockProject]}
        currentSort="created_at"
        currentDir="desc"
      />
    )
    expect(screen.getByText('Tower Alpha')).toBeInTheDocument()
    expect(screen.getByText('AT&T')).toBeInTheDocument()
    expect(screen.getByText('100 Main St, Springfield')).toBeInTheDocument()
    expect(screen.getByText('ATT-999')).toBeInTheDocument()
    expect(screen.getByText('AC-001')).toBeInTheDocument()
  })

  it('shows empty state when no projects and no filters', () => {
    render(
      <ProjectsTable
        projects={[]}
        currentSort="created_at"
        currentDir="desc"
      />
    )
    expect(screen.getByText('No projects yet.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /create your first project/i })).toBeInTheDocument()
  })

  it('shows filter empty state when filters active', () => {
    render(
      <ProjectsTable
        projects={[]}
        currentSort="created_at"
        currentDir="desc"
        hasActiveFilters={true}
      />
    )
    expect(screen.getByText(/no projects match your filters/i)).toBeInTheDocument()
  })

  it('clicking sortable header updates URL', () => {
    render(
      <ProjectsTable
        projects={[mockProject]}
        currentSort="created_at"
        currentDir="desc"
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /site name/i }))
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('sort=site_name'))
  })

  it('shows edit link for each row', () => {
    render(
      <ProjectsTable
        projects={[mockProject]}
        currentSort="created_at"
        currentDir="desc"
      />
    )
    const editLink = screen.getByRole('link', { name: /edit abc-123/i })
    expect(editLink).toHaveAttribute('href', '/projects/abc-123/edit')
  })
})
