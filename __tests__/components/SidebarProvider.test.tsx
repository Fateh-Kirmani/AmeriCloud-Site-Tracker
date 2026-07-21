import { render, screen, fireEvent } from '@testing-library/react'
import SidebarProvider, { useSidebar } from '@/components/SidebarProvider'

function TestConsumer() {
  const { sidebarOpen, toggleSidebar, closeSidebar } = useSidebar()
  return (
    <div>
      <span data-testid="state">{sidebarOpen ? 'open' : 'closed'}</span>
      <button onClick={toggleSidebar}>toggle</button>
      <button onClick={closeSidebar}>close</button>
    </div>
  )
}

describe('SidebarProvider', () => {
  it('starts with sidebar closed', () => {
    render(<SidebarProvider><TestConsumer /></SidebarProvider>)
    expect(screen.getByTestId('state')).toHaveTextContent('closed')
  })

  it('toggleSidebar opens the sidebar', () => {
    render(<SidebarProvider><TestConsumer /></SidebarProvider>)
    fireEvent.click(screen.getByText('toggle'))
    expect(screen.getByTestId('state')).toHaveTextContent('open')
  })

  it('toggleSidebar closes the sidebar when already open', () => {
    render(<SidebarProvider><TestConsumer /></SidebarProvider>)
    fireEvent.click(screen.getByText('toggle'))
    fireEvent.click(screen.getByText('toggle'))
    expect(screen.getByTestId('state')).toHaveTextContent('closed')
  })

  it('closeSidebar closes the sidebar when open', () => {
    render(<SidebarProvider><TestConsumer /></SidebarProvider>)
    fireEvent.click(screen.getByText('toggle'))
    fireEvent.click(screen.getByText('close'))
    expect(screen.getByTestId('state')).toHaveTextContent('closed')
  })
})
