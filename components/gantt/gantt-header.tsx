'use client'

import { cn } from '@/lib/utils'
import type { ViewScale } from '@/lib/types'

interface TimelineColumn {
  date: Date
  label: string
  subLabel?: string
  isToday: boolean
  isWeekend: boolean
}

interface GanttHeaderProps {
  columns: TimelineColumn[]
  cellWidth: number
  scrollLeft: number
  viewScale: ViewScale
}

export function GanttHeader({ columns, cellWidth, scrollLeft, viewScale }: GanttHeaderProps) {
  return (
    <div className="flex border-b border-border bg-card sticky top-0 z-10">
      {/* Left panel header */}
      <div className="w-32 sm:w-48 md:w-64 flex-shrink-0 border-r border-border">
        <div className="h-10 sm:h-12 flex items-center px-2 sm:px-4">
          <span className="text-xs sm:text-sm font-medium text-foreground">Tasks</span>
        </div>
      </div>
      
      {/* Timeline header */}
      <div className="flex-1 overflow-hidden">
        <div
          className="flex h-10 sm:h-12"
          style={{ transform: `translateX(-${scrollLeft}px)` }}
        >
          {columns.map((col, i) => (
            <div
              key={i}
              className={cn(
                'flex-shrink-0 flex flex-col items-center justify-center border-l border-border/50',
                col.isToday && 'bg-chart-1/10',
                col.isWeekend && viewScale === 'day' && 'bg-muted/30'
              )}
              style={{ width: cellWidth }}
            >
              <span className={cn(
                'text-[10px] sm:text-xs font-medium',
                col.isToday ? 'text-chart-1' : 'text-foreground'
              )}>
                {col.label}
              </span>
              {col.subLabel && (
                <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                  {col.subLabel}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
