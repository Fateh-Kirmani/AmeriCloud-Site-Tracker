'use client'
import { createContext, useContext, useState } from 'react'

type SidebarContextType = {
  sidebarOpen: boolean
  toggleSidebar: () => void
  closeSidebar: () => void
}

export const SidebarContext = createContext<SidebarContextType>({
  sidebarOpen: false,
  toggleSidebar: () => {},
  closeSidebar: () => {},
})

export function useSidebar() {
  return useContext(SidebarContext)
}

export default function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function toggleSidebar() {
    setSidebarOpen(prev => !prev)
  }

  function closeSidebar() {
    setSidebarOpen(false)
  }

  return (
    <SidebarContext.Provider value={{ sidebarOpen, toggleSidebar, closeSidebar }}>
      {children}
    </SidebarContext.Provider>
  )
}
