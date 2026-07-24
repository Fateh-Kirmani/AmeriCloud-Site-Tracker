import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import FilesTab from '@/components/project-tabs/FilesTab'

const PROJECT_ID = 'proj-123'
const mockFile = { id: 'file-1', project_id: PROJECT_ID, file_name: 'report.pdf', file_type: 'Contract', storage_path: `projects/${PROJECT_ID}/report.pdf`, created_at: '2026-07-24T00:00:00Z', url: 'https://signed.url/report.pdf' }

beforeEach(() => { global.fetch = jest.fn() })
afterEach(() => jest.clearAllMocks())

it('shows loading then empty state when no files', async () => {
  ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [] })
  render(<FilesTab projectId={PROJECT_ID} />)
  expect(screen.getByText('Loading...')).toBeInTheDocument()
  await waitFor(() => expect(screen.getByText('No files uploaded yet.')).toBeInTheDocument())
})

it('renders fetched files as clickable links', async () => {
  ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [mockFile] })
  render(<FilesTab projectId={PROJECT_ID} />)
  await waitFor(() => expect(screen.getByText('report.pdf')).toBeInTheDocument())
  const link = screen.getByRole('link', { name: 'report.pdf' })
  expect(link).toHaveAttribute('href', 'https://signed.url/report.pdf')
  expect(link).toHaveAttribute('target', '_blank')
  expect(screen.getByText('Contract')).toBeInTheDocument()
})

it('shows fetch error state on network failure', async () => {
  ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network'))
  render(<FilesTab projectId={PROJECT_ID} />)
  await waitFor(() => expect(screen.getByText('Failed to load files. Please refresh.')).toBeInTheDocument())
})

it('opens upload modal when Upload File is clicked', async () => {
  ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [] })
  render(<FilesTab projectId={PROJECT_ID} />)
  await waitFor(() => screen.getByText('No files uploaded yet.'))
  fireEvent.click(screen.getByText('+ Upload File'))
  expect(screen.getByRole('dialog', { name: 'Upload file' })).toBeInTheDocument()
})

it('closes modal when Cancel is clicked', async () => {
  ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [] })
  render(<FilesTab projectId={PROJECT_ID} />)
  await waitFor(() => screen.getByText('No files uploaded yet.'))
  fireEvent.click(screen.getByText('+ Upload File'))
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it('removes file from list on successful delete', async () => {
  ;(fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: true, json: async () => [mockFile] })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
  render(<FilesTab projectId={PROJECT_ID} />)
  await waitFor(() => screen.getByText('report.pdf'))
  fireEvent.click(screen.getByRole('button', { name: 'Delete file' }))
  await waitFor(() => expect(screen.queryByText('report.pdf')).not.toBeInTheDocument())
  expect(screen.getByText('No files uploaded yet.')).toBeInTheDocument()
})

it('shows upload error inside modal when upload fails', async () => {
  ;(fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: true, json: async () => [] })
    .mockResolvedValueOnce({ ok: false })
  render(<FilesTab projectId={PROJECT_ID} />)
  await waitFor(() => screen.getByText('No files uploaded yet.'))
  fireEvent.click(screen.getByText('+ Upload File'))
  // Simulate file selection
  const fileInput = screen.getByLabelText(/file/i, { selector: 'input[type="file"]' })
  Object.defineProperty(fileInput, 'files', { value: [new File(['content'], 'test.pdf', { type: 'application/pdf' })] })
  fireEvent.change(fileInput)
  fireEvent.click(screen.getByRole('button', { name: 'Upload' }))
  await waitFor(() => expect(screen.getByText('Upload failed. Please try again.')).toBeInTheDocument())
  expect(screen.getByRole('dialog')).toBeInTheDocument()
})
