import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import MilestonesTab from '@/components/project-tabs/MilestonesTab'

const PROJECT_ID = 'proj-123'

const emptyMilestonesResponse = { ok: true, json: async () => ({ milestones: [], project_notes: '' }) }
const emptyTeamResponse = { ok: true, json: async () => ({ team_members: [] }) }

beforeEach(() => {
  global.fetch = jest.fn()
})
afterEach(() => jest.clearAllMocks())

it('shows loading then empty state when no milestones', async () => {
  ;(fetch as jest.Mock)
    .mockResolvedValueOnce(emptyMilestonesResponse)
    .mockResolvedValueOnce(emptyTeamResponse)
  render(<MilestonesTab projectId={PROJECT_ID} />)
  expect(screen.getByText('Loading...')).toBeInTheDocument()
  await waitFor(() => expect(screen.getByText('No milestones added yet.')).toBeInTheDocument())
})

it('renders fetched milestones as input rows', async () => {
  ;(fetch as jest.Mock)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        milestones: [{ id: 'ms-1', details: 'Design Phase', owner: 'Alice', projected_date: '2026-08-01', actualized_date: '', notes: 'First' }],
        project_notes: '',
      }),
    })
    .mockResolvedValueOnce(emptyTeamResponse)
  render(<MilestonesTab projectId={PROJECT_ID} />)
  await waitFor(() => expect(screen.getByDisplayValue('Design Phase')).toBeInTheDocument())
  // owner is now a select; Alice appears as a custom option since she's not in teamMembers
  expect(screen.getByDisplayValue('Alice')).toBeInTheDocument()
})

it('shows fetch error state on network failure', async () => {
  ;(fetch as jest.Mock)
    .mockRejectedValueOnce(new Error('Network'))
    .mockResolvedValueOnce(emptyTeamResponse)
  render(<MilestonesTab projectId={PROJECT_ID} />)
  await waitFor(() => expect(screen.getByText('Failed to load. Please refresh.')).toBeInTheDocument())
})

it('adds a new empty row when Add Milestone is clicked', async () => {
  ;(fetch as jest.Mock)
    .mockResolvedValueOnce(emptyMilestonesResponse)
    .mockResolvedValueOnce(emptyTeamResponse)
  render(<MilestonesTab projectId={PROJECT_ID} />)
  await waitFor(() => screen.getByText('No milestones added yet.'))
  fireEvent.click(screen.getByText('+ Add Milestone'))
  expect(screen.queryByText('No milestones added yet.')).not.toBeInTheDocument()
  expect(screen.getByPlaceholderText('Milestone details')).toBeInTheDocument()
})

it('removes a row when delete button is clicked', async () => {
  ;(fetch as jest.Mock)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        milestones: [{ id: 'ms-1', details: 'Phase 1', owner: '', projected_date: '', actualized_date: '', notes: '' }],
        project_notes: '',
      }),
    })
    .mockResolvedValueOnce(emptyTeamResponse)
  render(<MilestonesTab projectId={PROJECT_ID} />)
  await waitFor(() => screen.getByDisplayValue('Phase 1'))
  fireEvent.click(screen.getByRole('button', { name: 'Delete milestone' }))
  expect(screen.queryByDisplayValue('Phase 1')).not.toBeInTheDocument()
  expect(screen.getByText('No milestones added yet.')).toBeInTheDocument()
})

it('calls PUT and refreshes on successful save', async () => {
  ;(fetch as jest.Mock)
    .mockResolvedValueOnce(emptyMilestonesResponse)
    .mockResolvedValueOnce(emptyTeamResponse)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ milestones: [{ id: 'ms-new', details: 'New', owner: '', projected_date: '', actualized_date: '', notes: '' }], project_notes: '' }),
    })
  render(<MilestonesTab projectId={PROJECT_ID} />)
  await waitFor(() => screen.getByText('No milestones added yet.'))
  fireEvent.click(screen.getByText('+ Add Milestone'))
  fireEvent.change(screen.getByPlaceholderText('Milestone details'), { target: { value: 'New' } })
  fireEvent.click(screen.getByText('Save Changes'))
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3))
  const putCall = (fetch as jest.Mock).mock.calls[2]
  expect(putCall[0]).toBe(`/api/projects/${PROJECT_ID}/milestones`)
  expect(JSON.parse(putCall[1].body).milestones[0].details).toBe('New')
})

it('shows save error message when save fails', async () => {
  ;(fetch as jest.Mock)
    .mockResolvedValueOnce(emptyMilestonesResponse)
    .mockResolvedValueOnce(emptyTeamResponse)
    .mockResolvedValueOnce({ ok: false })
  render(<MilestonesTab projectId={PROJECT_ID} />)
  await waitFor(() => screen.getByText('No milestones added yet.'))
  fireEvent.click(screen.getByText('Save Changes'))
  await waitFor(() => expect(screen.getByText('Failed to save. Please try again.')).toBeInTheDocument())
})
