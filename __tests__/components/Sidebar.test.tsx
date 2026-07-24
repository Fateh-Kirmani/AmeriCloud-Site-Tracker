import { render, screen, fireEvent } from '@testing-library/react'
import Sidebar from '@/components/Sidebar'
import { SidebarContext } from '@/components/SidebarProvider'

const mockPathname = jest.fn()
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}))

function renderSidebar(sidebarOpen: boolean, closeSidebar = jest.fn()) {
  return render(
    <SidebarContext.Provider value={{ sidebarOpen, toggleSidebar: jest.fn(), closeSidebar }}>
      <Sidebar />
    </SidebarContext.Provider>
  )
}

describe('Sidebar', () => {
  beforeEach(() => mockPathname.mockReturnValue('/'))

  it('drawer has -translate-x-full when closed', () => {
    renderSidebar(false)
    const nav = screen.getByTestId('sidebar-nav')
    expect(nav.className).toContain('-translate-x-full')
  })

  it('drawer has translate-x-0 when open', () => {
    renderSidebar(true)
    const nav = screen.getByRole('navigation', { name: /main navigation/i })
    expect(nav.className).toContain('translate-x-0')
  })

  it('renders Projects and New Project links', () => {
    renderSidebar(true)
    expect(screen.getByRole('link', { name: /^projects$/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /new project/i })).toBeInTheDocument()
  })

  it('Projects link points to /', () => {
    renderSidebar(true)
    expect(screen.getByRole('link', { name: /^projects$/i })).toHaveAttribute('href', '/')
  })

  it('New Project link points to /projects/new', () => {
    renderSidebar(true)
    expect(screen.getByRole('link', { name: /new project/i })).toHaveAttribute('href', '/projects/new')
  })

  it('clicking the backdrop calls closeSidebar', () => {
    const closeSidebar = jest.fn()
    renderSidebar(true, closeSidebar)
    fireEvent.click(screen.getByTestId('backdrop'))
    expect(closeSidebar).toHaveBeenCalled()
  })

  it('pressing Escape calls closeSidebar', () => {
    const closeSidebar = jest.fn()
    renderSidebar(true, closeSidebar)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(closeSidebar).toHaveBeenCalled()
  })

  it('clicking a nav link calls closeSidebar', () => {
    const closeSidebar = jest.fn()
    renderSidebar(true, closeSidebar)
    fireEvent.click(screen.getByRole('link', { name: /new project/i }))
    expect(closeSidebar).toHaveBeenCalled()
  })

  it('active route gets active background and icon accent', () => {
    mockPathname.mockReturnValue('/')
    renderSidebar(true)
    const link = screen.getByRole('link', { name: /^projects$/i })
    expect(link.className).toContain('bg-[#0B1929]')
    expect(link.className).toContain('text-white')
  })

  it('backdrop is not rendered when closed', () => {
    renderSidebar(false)
    expect(screen.queryByTestId('backdrop')).not.toBeInTheDocument()
  })
})
