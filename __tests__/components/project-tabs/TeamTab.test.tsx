import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TeamTab from '@/components/project-tabs/TeamTab'

const PROJECT_ID = 'proj-123'
const mockMilestones = [{ id: 'ms-1', details: 'Design Phase' }, { id: 'ms-2', details: 'Build Phase' }]
const mockTeamMembers = [{ id: 'tm-1', name: 'Alice', task_milestone_id: 'ms-1', date_from: '2026-08-01', date_to: '2026-08-31', created_at: '2026-07-24T00:00:00Z' }]

beforeEach(() => { global.fetch = jest.fn() })
afterEach(() => jest.clearAllMocks())

it('shows loading then empty state when no team members', async () => {
  ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ team_members: [], milestones: [] }) })
  render(<TeamTab projectId={PROJECT_ID} />)
  expect(screen.getByText('Loading...')).toBeInTheDocument()
  await waitFor(() => expect(screen.getByText('No team members added yet.')).toBeInTheDocument())
})

it('renders fetched team members with milestone dropdown', async () => {
  ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ team_members: mockTeamMembers, milestones: mockMilestones }) })
  render(<TeamTab projectId={PROJECT_ID} />)
  await waitFor(() => expect(screen.getByDisplayValue('Alice')).toBeInTheDocument())
  expect(screen.getByDisplayValue('Design Phase')).toBeInTheDocument()
})

it('shows fetch error state on network failure', async () => {
  ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network'))
  render(<TeamTab projectId={PROJECT_ID} />)
  await waitFor(() => expect(screen.getByText('Failed to load. Please refresh.')).toBeInTheDocument())
})

it('populates Task dropdown with milestone options', async () => {
  ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ team_members: [], milestones: mockMilestones }) })
  render(<TeamTab projectId={PROJECT_ID} />)
  await waitFor(() => screen.getByText('No team members added yet.'))
  fireEvent.click(screen.getByText('+ Add Team Member'))
  expect(screen.getByRole('option', { name: 'Design Phase' })).toBeInTheDocument()
  expect(screen.getByRole('option', { name: 'Build Phase' })).toBeInTheDocument()
})

it('shows "No milestones added yet." option when no milestones exist', async () => {
  ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ team_members: [], milestones: [] }) })
  render(<TeamTab projectId={PROJECT_ID} />)
  await waitFor(() => screen.getByText('No team members added yet.'))
  fireEvent.click(screen.getByText('+ Add Team Member'))
  expect(screen.getByRole('option', { name: 'No milestones added yet.' })).toBeInTheDocument()
})

it('adds a new empty row when Add Team Member is clicked', async () => {
  ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ team_members: [], milestones: [] }) })
  render(<TeamTab projectId={PROJECT_ID} />)
  await waitFor(() => screen.getByText('No team members added yet.'))
  fireEvent.click(screen.getByText('+ Add Team Member'))
  expect(screen.queryByText('No team members added yet.')).not.toBeInTheDocument()
  expect(screen.getByPlaceholderText('Name')).toBeInTheDocument()
})

it('removes a row when delete button is clicked', async () => {
  ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ team_members: mockTeamMembers, milestones: mockMilestones }) })
  render(<TeamTab projectId={PROJECT_ID} />)
  await waitFor(() => screen.getByDisplayValue('Alice'))
  fireEvent.click(screen.getByRole('button', { name: 'Delete team member' }))
  expect(screen.queryByDisplayValue('Alice')).not.toBeInTheDocument()
  expect(screen.getByText('No team members added yet.')).toBeInTheDocument()
})

it('calls PUT and refreshes on successful save', async () => {
  ;(fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: true, json: async () => ({ team_members: [], milestones: mockMilestones }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ team_members: [{ id: 'tm-new', name: 'Bob', task_milestone_id: null, date_from: null, date_to: null }] }) })
  render(<TeamTab projectId={PROJECT_ID} />)
  await waitFor(() => screen.getByText('No team members added yet.'))
  fireEvent.click(screen.getByText('Save Changes'))
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2))
  const putCall = (fetch as jest.Mock).mock.calls[1]
  expect(putCall[0]).toBe(`/api/projects/${PROJECT_ID}/team`)
  expect(putCall[1].method).toBe('PUT')
})
