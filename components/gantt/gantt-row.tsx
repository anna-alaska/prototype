'use client'

import { calculateBarPosition } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import type { GanttRow as GanttRowType, ViewScale } from '@/lib/types'

interface GanttRowProps {
  row: GanttRowType
  index: number
  viewStart: Date
  cellWidth: number
  viewScale: ViewScale
  isSelected: boolean
  onClick: () => void
}

const colorMap: Record<string, string> = {
  blue: 'bg-blue-500 hover:bg-blue-400',
  green: 'bg-emerald-500 hover:bg-emerald-400',
  purple: 'bg-violet-500 hover:bg-violet-400',
  orange: 'bg-orange-500 hover:bg-orange-400',
  pink: 'bg-pink-500 hover:bg-pink-400',
  cyan: 'bg-cyan-500 hover:bg-cyan-400',
}

export function GanttRow({
  row,
  index,
  viewStart,
  cellWidth,
  viewScale,
  isSelected,
  onClick
}: GanttRowProps) {
  const rowHeight = 40
  const barHeight = row.type === 'task' ? 8 : row.type === 'sprint' ? 20 : 24
  const [baseColor = 'blue', colorState] = (row.color || '').split(':')
  const hasScheduleWarning = colorState === 'warning'
  
  // Calculate bar position
  const barPosition = row.startDate && row.endDate
    ? calculateBarPosition(row.startDate, row.endDate, viewStart, cellWidth, viewScale)
    : null
  
  return (
    <div
      className={cn(
        'relative border-b border-border/50 transition-colors',
        isSelected && 'bg-accent/30'
      )}
      style={{ height: rowHeight }}
      onClick={onClick}
    >
      {/* Bar for business tasks and sprints */}
      {barPosition && (row.type === 'business-task' || row.type === 'sprint') && (
        <div
          className={cn(
            'absolute rounded-md cursor-pointer transition-all shadow-sm',
            row.type === 'business-task' && (colorMap[baseColor] || colorMap.blue),
            row.type === 'business-task' && hasScheduleWarning && 'ring-2 ring-yellow-500/70 ring-offset-1 ring-offset-background',
            row.type === 'sprint' && 'bg-sprint hover:bg-sprint-light'
          )}
          style={{
            left: barPosition.left,
            width: barPosition.width,
            height: barHeight,
            top: (rowHeight - barHeight) / 2
          }}
        >
          {/* Bar content */}
          {barPosition.width > 60 && (
            <div className="absolute inset-0 flex items-center px-2 overflow-hidden">
              <span className="text-xs font-medium text-white truncate">
                {row.title}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Milestone marker */}
      {barPosition && row.type === 'milestone' && (
        <div
          className="absolute flex items-center justify-center"
          style={{
            left: barPosition.left + barPosition.width / 2 - 9,
            top: (rowHeight - 18) / 2,
            width: 18,
            height: 18,
          }}
        >
          <div
            className={cn(
              'h-4 w-4 rotate-45 rounded-[2px] shadow-sm',
              row.color === 'warning'
                ? 'border border-yellow-600/70 bg-yellow-500'
                : 'border border-chart-1/60 bg-chart-1'
            )}
          />
        </div>
      )}
      
      {/* Marker for tasks (no dates, just a dot) */}
      {row.type === 'task' && (
        <div
          className="absolute flex items-center justify-center"
          style={{
            left: barPosition ? barPosition.left - 4 : '50%',
            transform: barPosition ? undefined : 'translateX(-50%)',
            top: (rowHeight - barHeight) / 2
          }}
        >
          <div className="w-2 h-2 rounded-full bg-task-marker" />
        </div>
      )}
    </div>
  )
}
