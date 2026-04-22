'use client'

import { useState } from 'react'
import { Header } from '@/components/header'
import { SidebarPanel } from '@/components/sidebar'
import { GanttChart } from '@/components/gantt'
import { MobileNav } from '@/components/mobile-nav'
import { StoreHydrator } from '@/components/store-hydrator'
import { useProjectStore } from '@/lib/store'

export default function HomePage() {
  const [mobileView, setMobileView] = useState<'gantt' | 'sidebar'>('gantt')
  const hasHydrated = useProjectStore((state) => state.hasHydrated)
  
  return (
    <div className="flex flex-col h-screen bg-background">
      <StoreHydrator />
      <Header />
      
      {/* Mobile navigation */}
      <MobileNav activeView={mobileView} onViewChange={setMobileView} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - hidden on mobile unless selected */}
        <aside className={`
          w-full md:w-80 flex-shrink-0 
          ${mobileView === 'sidebar' ? 'block' : 'hidden'} 
          md:block
        `}>
          {hasHydrated ? (
            <SidebarPanel />
          ) : (
            <div className="h-full border-r border-sidebar-border bg-sidebar" />
          )}
        </aside>
        
        {/* Main content - Gantt Chart - hidden on mobile when sidebar is shown */}
        <main className={`
          flex-1 overflow-hidden
          ${mobileView === 'gantt' ? 'block' : 'hidden'}
          md:block
        `}>
          {hasHydrated ? (
            <GanttChart />
          ) : (
            <div className="h-full bg-background" />
          )}
        </main>
      </div>
    </div>
  )
}
