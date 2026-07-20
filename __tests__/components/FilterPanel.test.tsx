import { render, screen, fireEvent } from '@testing-library/react'
import FilterPanel from '@/components/projects/FilterPanel'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const defaultProps = {
  initialSearch: '',
  initialClient: '',
  initialTemplate: '',
  initialPm: '',
  initialFrom: '',
  initialTo: '',
}

describe('FilterPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders search input and dropdowns', () => {
    render(<FilterPanel {...defaultProps} />)
    expect(screen.getByPlaceholderText('Search projects...')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /client/i })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /template/i })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /americloud pm/i })).toBeInTheDocument()
  })

  it('debounces search input by 300ms', async () => {
    render(<FilterPanel {...defaultProps} />)
    const input = screen.getByPlaceholderText('Search projects...')
    fireEvent.change(input, { target: { value: 'tower' } })
    expect(mockPush).not.toHaveBeenCalled()
    jest.advanceTimersByTime(300)
    expect(mockPush).toHaveBeenCalledWith('/?search=tower')
  })

  it('updates URL immediately on client dropdown change', () => {
    render(<FilterPanel {...defaultProps} />)
    const select = screen.getByRole('combobox', { name: /client/i })
    fireEvent.change(select, { target: { value: 'AT&T' } })
    expect(mockPush).toHaveBeenCalledWith('/?client=AT%26T')
  })

  it('renders Clear filters button and navigates to / on click', () => {
    render(<FilterPanel {...defaultProps} initialSearch="tower" />)
    const btn = screen.getByRole('button', { name: /clear filters/i })
    fireEvent.click(btn)
    expect(mockPush).toHaveBeenCalledWith('/')
  })

  it('pre-fills inputs from initial props', () => {
    render(<FilterPanel {...defaultProps} initialSearch="site-x" initialClient="Verizon" />)
    expect(screen.getByPlaceholderText('Search projects...')).toHaveValue('site-x')
    expect(screen.getByRole('combobox', { name: /client/i })).toHaveValue('Verizon')
  })

  it('does not overwrite dropdown state when debounce fires after dropdown change', () => {
    render(<FilterPanel {...defaultProps} />)
    const searchInput = screen.getByPlaceholderText('Search projects...')
    const clientSelect = screen.getByRole('combobox', { name: /client/i })

    // Type in search (starts 300ms debounce)
    fireEvent.change(searchInput, { target: { value: 'tower' } })
    // Immediately change dropdown (fires URL update right away)
    fireEvent.change(clientSelect, { target: { value: 'Verizon' } })
    // The dropdown push should contain client=Verizon
    expect(mockPush).toHaveBeenLastCalledWith(expect.stringContaining('client=Verizon'))

    // Now debounce fires — it should include BOTH search and client
    jest.advanceTimersByTime(300)
    const lastCall = mockPush.mock.calls[mockPush.mock.calls.length - 1][0]
    expect(lastCall).toContain('search=tower')
    expect(lastCall).toContain('client=Verizon')
  })
})
