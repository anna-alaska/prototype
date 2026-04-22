'use client'

import { Button } from '@/components/ui/button'
import { LayoutGridIcon, ListTodoIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileNavProps {
  activeView: 'gantt' | 'sidebar'
  onViewChange: (view: 'gantt' | 'sidebar') => void
}

export function MobileNav({ activeView, onViewChange }: MobileNavProps) {
  return (
    <div className="flex md:hidden border-b border-border bg-card">
      <Button
        variant="ghost"
        className={cn(
          'flex-1 rounded-none h-12 gap-2',
          activeView === 'gantt' && 'bg-accent border-b-2 border-b-chart-1'
        )}
        onClick={() => onViewChange('gantt')}
      >
        <LayoutGridIcon className="h-4 w-4" />
        <span>Gantt Chart</span>
      </Button>
      <Button
        variant="ghost"
        className={cn(
          'flex-1 rounded-none h-12 gap-2',
          activeView === 'sidebar' && 'bg-accent border-b-2 border-b-chart-1'
        )}
        onClick={() => onViewChange('sidebar')}
      >
        <ListTodoIcon className="h-4 w-4" />
        <span>Tasks</span>
      </Button>
    </div>
  )
}
