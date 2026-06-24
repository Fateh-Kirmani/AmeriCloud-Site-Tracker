/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NewProjectForm from '@/components/forms/NewProjectForm'

global.fetch = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
})

describe('NewProjectForm', () => {
  it('renders all section card titles', () => {
    render(<NewProjectForm />)
    expect(screen.getByText(/site information/i)).toBeInTheDocument()
    expect(screen.getByText(/client & ids/i)).toBeInTheDocument()
    expect(screen.getByText(/customer contact/i)).toBeInTheDocument()
    expect(screen.getByText(/americloud team/i)).toBeInTheDocument()
    expect(screen.getByText(/project details/i)).toBeInTheDocument()
  })

  it('shows validation error when site name is empty on submit', async () => {
    render(<NewProjectForm />)
    await userEvent.click(screen.getByRole('button', { name: /create project/i }))
    await waitFor(() => {
      expect(screen.getByText('Site name is required')).toBeInTheDocument()
    })
  })

  it('calls fetch with correct payload on valid submission', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'abc-123' }),
    })

    render(<NewProjectForm />)

    await userEvent.type(screen.getByPlaceholderText('Enter site name'), 'Test Site')
    await userEvent.type(screen.getByPlaceholderText('Enter address'), '123 Main St')
    await userEvent.type(screen.getByPlaceholderText('e.g. AC-2024-001'), 'AC-001')
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: /client/i }),
      'AT&T'
    )
    await userEvent.click(screen.getByRole('button', { name: /create project/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/projects',
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  it('shows success toast after successful submission', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'abc-123' }),
    })

    render(<NewProjectForm />)

    await userEvent.type(screen.getByPlaceholderText('Enter site name'), 'Test Site')
    await userEvent.type(screen.getByPlaceholderText('Enter address'), '123 Main St')
    await userEvent.type(screen.getByPlaceholderText('e.g. AC-2024-001'), 'AC-001')
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: /client/i }),
      'AT&T'
    )
    await userEvent.click(screen.getByRole('button', { name: /create project/i }))

    await waitFor(() => {
      expect(screen.getByText('Project created successfully')).toBeInTheDocument()
    })
  })

  it('shows error toast when fetch returns non-ok response', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false })

    render(<NewProjectForm />)

    await userEvent.type(screen.getByPlaceholderText('Enter site name'), 'Test Site')
    await userEvent.type(screen.getByPlaceholderText('Enter address'), '123 Main St')
    await userEvent.type(screen.getByPlaceholderText('e.g. AC-2024-001'), 'AC-001')
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: /client/i }),
      'AT&T'
    )
    await userEvent.click(screen.getByRole('button', { name: /create project/i }))

    await waitFor(() => {
      expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
    })
  })
})
