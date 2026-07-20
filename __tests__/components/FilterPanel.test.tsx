import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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
})
