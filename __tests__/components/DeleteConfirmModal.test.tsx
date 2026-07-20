/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DeleteConfirmModal from '@/components/projects/DeleteConfirmModal'

const mockRefresh = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}))

global.fetch = jest.fn()

describe('DeleteConfirmModal', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders site name in confirmation message', () => {
    render(
      <DeleteConfirmModal
        projectId="abc-123"
        siteName="Tower Alpha"
        onClose={jest.fn()}
        onDeleted={jest.fn()}
      />
    )
    expect(screen.getByText(/Tower Alpha/)).toBeInTheDocument()
    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument()
  })

  it('calls onClose when Cancel clicked', () => {
    const onClose = jest.fn()
    render(
      <DeleteConfirmModal
        projectId="abc-123"
        siteName="Tower Alpha"
        onClose={onClose}
        onDeleted={jest.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls DELETE and then onDeleted + router.refresh on success', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })
    const onDeleted = jest.fn()
    render(
      <DeleteConfirmModal
        projectId="abc-123"
        siteName="Tower Alpha"
        onClose={jest.fn()}
        onDeleted={onDeleted}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }))
    await waitFor(() => expect(onDeleted).toHaveBeenCalled())
    expect(mockRefresh).toHaveBeenCalled()
    expect(global.fetch).toHaveBeenCalledWith('/api/projects/abc-123', { method: 'DELETE' })
  })

  it('shows error toast and keeps modal open on failure', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false })
    const onClose = jest.fn()
    render(
      <DeleteConfirmModal
        projectId="abc-123"
        siteName="Tower Alpha"
        onClose={onClose}
        onDeleted={jest.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }))
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(onClose).not.toHaveBeenCalled()
  })
})
