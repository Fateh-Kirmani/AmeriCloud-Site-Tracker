import { render, screen, fireEvent } from '@testing-library/react'
import Header from '@/components/Header'
import { SidebarContext } from '@/components/SidebarProvider'

function renderHeader(sidebarOpen: boolean, toggleSidebar = jest.fn()) {
  return render(
    <SidebarContext.Provider value={{ sidebarOpen, toggleSidebar, closeSidebar: jest.fn() }}>
      <Header />
    </SidebarContext.Provider>
  )
}

describe('Header', () => {
  it('renders the logo', () => {
    renderHeader(false)
    expect(screen.getByAltText('AmeriCloud Telecom Solutions')).toBeInTheDocument()
  })

  it('renders the app title', () => {
    renderHeader(false)
    expect(screen.getByText('AmeriCloud Site Tracker')).toBeInTheDocument()
  })

  it('shows open-navigation button when sidebar is closed', () => {
    renderHeader(false)
    const btn = screen.getByRole('button', { name: /open navigation/i })
    expect(btn).toBeInTheDocument()
    expect(btn).toHaveAttribute('aria-expanded', 'false')
  })

  it('shows close-navigation button when sidebar is open', () => {
    renderHeader(true)
    const btn = screen.getByRole('button', { name: /close navigation/i })
    expect(btn).toBeInTheDocument()
    expect(btn).toHaveAttribute('aria-expanded', 'true')
  })

  it('clicking the button calls toggleSidebar', () => {
    const toggleSidebar = jest.fn()
    renderHeader(false, toggleSidebar)
    fireEvent.click(screen.getByRole('button', { name: /open navigation/i }))
    expect(toggleSidebar).toHaveBeenCalledTimes(1)
  })
})
