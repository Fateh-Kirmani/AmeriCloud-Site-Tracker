// __tests__/components/forms/EditProjectForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
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
jest.mock('@/components/project-tabs/ManagerialTeamTab', () => ({
  __esModule: true,
  default: () => <div data-testid="managerial-team-tab">ManagerialTeamTab</div>,
}))
jest.mock('@/components/project-tabs/CrewTab', () => ({
  __esModule: true,
  default: () => <div data-testid="crew-tab">CrewTab</div>,
}))

const mockProject: Project = {
  id: 'proj-123',
  site_name: 'Test Site',
  address: '123 Main St',
  street: '123 Main St',
  city: 'New York',
  state: 'NY',
  zip_code: '10001',
  project_notes: null,
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
  expect(screen.getByLabelText(/project name/i)).toBeInTheDocument()
  expect(screen.queryByTestId('milestones-tab')).not.toBeInTheDocument()
})

it('switches to Milestones tab when clicked', () => {
  render(<EditProjectForm project={mockProject} />)
  fireEvent.click(screen.getByRole('tab', { name: 'Milestones' }))
  expect(screen.getByTestId('milestones-tab')).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'Milestones' })).toHaveAttribute('aria-selected', 'true')
  expect(screen.queryByLabelText(/project name/i)).not.toBeInTheDocument()
})

it('switches to Files tab when clicked', () => {
  render(<EditProjectForm project={mockProject} />)
  fireEvent.click(screen.getByRole('tab', { name: 'Files' }))
  expect(screen.getByTestId('files-tab')).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'Files' })).toHaveAttribute('aria-selected', 'true')
})

it('switches to Managerial Team tab when clicked', () => {
  render(<EditProjectForm project={mockProject} />)
  fireEvent.click(screen.getByRole('tab', { name: 'Managerial Team' }))
  expect(screen.getByTestId('managerial-team-tab')).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'Managerial Team' })).toHaveAttribute('aria-selected', 'true')
})

it('switches to Crew tab when clicked', () => {
  render(<EditProjectForm project={mockProject} />)
  fireEvent.click(screen.getByRole('tab', { name: 'Crew' }))
  expect(screen.getByTestId('crew-tab')).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'Crew' })).toHaveAttribute('aria-selected', 'true')
})

it('passes projectId to tab components', () => {
  render(<EditProjectForm project={mockProject} />)
  fireEvent.click(screen.getByRole('tab', { name: 'Milestones' }))
  expect(screen.getByTestId('milestones-tab')).toBeInTheDocument()
})

it('renders an Import to BOM Estimator link with the project current values encoded', () => {
  render(<EditProjectForm project={mockProject} />)
  const link = screen.getByRole('link', { name: /import to bom estimator/i })
  const url = new URL(link.getAttribute('href')!)

  expect(url.origin + url.pathname).toBe('https://americloud-das-pricing-calculator.vercel.app/import')
  expect(url.searchParams.get('client')).toBe('AT&T')
  expect(url.searchParams.get('project')).toBe('Test Site')
  expect(url.searchParams.get('jobSiteAddress')).toBe('123 Main St, New York, NY 10001')
  expect(url.searchParams.get('projectOverview')).toBe('')
  expect(link).toHaveAttribute('target', '_blank')
})
