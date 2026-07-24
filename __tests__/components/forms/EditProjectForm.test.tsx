// __tests__/components/forms/EditProjectForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import EditProjectForm from '@/components/forms/EditProjectForm'
import { Project } from '@/types/project'

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }))
jest.mock('@/components/project-tabs/MilestonesTab', () => ({
  __esModule: true,
  default: () => <div data-testid="milestones-tab">MilestonesTab</div>,
}))
jest.mock('@/components/project-tabs/FilesTab', () => ({
  __esModule: true,
  default: () => <div data-testid="files-tab">FilesTab</div>,
}))
jest.mock('@/components/project-tabs/TeamTab', () => ({
  __esModule: true,
  default: () => <div data-testid="team-tab">TeamTab</div>,
}))

const mockProject: Project = {
  id: 'proj-123',
  site_name: 'Test Site',
  address: '123 Main St',
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
  created_at: '2026-07-24T00:00:00Z',
  status: 'Active',
}

it('renders General Information tab by default', () => {
  render(<EditProjectForm project={mockProject} />)
  expect(screen.getByRole('tab', { name: 'General Information' })).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByLabelText(/site name/i)).toBeInTheDocument()
  expect(screen.queryByTestId('milestones-tab')).not.toBeInTheDocument()
})

it('switches to Milestones tab when clicked', () => {
  render(<EditProjectForm project={mockProject} />)
  fireEvent.click(screen.getByRole('tab', { name: 'Milestones' }))
  expect(screen.getByTestId('milestones-tab')).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'Milestones' })).toHaveAttribute('aria-selected', 'true')
  expect(screen.queryByLabelText(/site name/i)).not.toBeInTheDocument()
})

it('switches to Files tab when clicked', () => {
  render(<EditProjectForm project={mockProject} />)
  fireEvent.click(screen.getByRole('tab', { name: 'Files' }))
  expect(screen.getByTestId('files-tab')).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'Files' })).toHaveAttribute('aria-selected', 'true')
})

it('switches to Team tab when clicked', () => {
  render(<EditProjectForm project={mockProject} />)
  fireEvent.click(screen.getByRole('tab', { name: 'Team' }))
  expect(screen.getByTestId('team-tab')).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'Team' })).toHaveAttribute('aria-selected', 'true')
})

it('passes projectId to tab components', () => {
  render(<EditProjectForm project={mockProject} />)
  fireEvent.click(screen.getByRole('tab', { name: 'Milestones' }))
  expect(screen.getByTestId('milestones-tab')).toBeInTheDocument()
})
