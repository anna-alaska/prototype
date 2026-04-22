'use client'

import { useRef, useMemo, useEffect, useState } from 'react'
import { useProjectStore } from '@/lib/store'
import { getViewRange, getTimelineColumns, getCellWidth, calculateBarPosition } from '@/lib/date-utils'
import { GanttHeader } from './gantt-header'
import { GanttRow } from './gantt-row'
import { GanttDependencies } from './gantt-dependencies'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { GanttRow as GanttRowType } from '@/lib/types'

export function GanttChart() {
  const containerRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const [scrollLeft, setScrollLeft] = useState(0)
  
  const {
    businessTasks,
    tasks,
    sprints,
    milestones,
    hasUnscheduledTasksForBusinessTask,
    isMilestoneAtRisk,
    viewScale,
    expandedItems,
    selectedItemId,
    setSelectedItem,
    toggleExpanded
  } = useProjectStore()
  
  // Calculate view range
  const viewRange = useMemo(() => {
    return getViewRange(businessTasks, sprints, milestones, viewScale)
  }, [businessTasks, sprints, milestones, viewScale])
  
  // Generate timeline columns
  const columns = useMemo(() => {
    return getTimelineColumns(viewRange.start, viewRange.end, viewScale)
  }, [viewRange, viewScale])
  
  const cellWidth = getCellWidth(viewScale)
  const totalWidth = columns.length * cellWidth
  const getRowKey = (row: GanttRowType) => `${row.type}-${row.parentId ?? 'root'}-${row.id}`
  
  // Build flattened row list
  const rows = useMemo((): GanttRowType[] => {
    const result: GanttRowType[] = []
    
    // Sort business tasks by start date
    const sortedBTs = [...businessTasks].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    )

    const sortedMilestones = [...milestones].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    for (const milestone of sortedMilestones) {
      const isAtRisk = isMilestoneAtRisk(milestone.id)
      result.push({
        id: milestone.id,
        type: 'milestone',
        title: milestone.title,
        startDate: milestone.date,
        endDate: milestone.date,
        color: isAtRisk ? 'warning' : 'default',
        level: 0,
      })
    }
    
    for (const bt of sortedBTs) {
      const hasUnscheduledTasks = hasUnscheduledTasksForBusinessTask(bt.id)
      // Add business task row
      result.push({
        id: bt.id,
        type: 'business-task',
        title: bt.title,
        startDate: bt.startDate,
        endDate: bt.endDate,
        color: hasUnscheduledTasks ? `${bt.color}:warning` : bt.color,
        level: 0,
        isExpanded: expandedItems.includes(bt.id)
      })
      
      // If expanded, add sprints and tasks
      if (expandedItems.includes(bt.id)) {
        // Get sprints for this business task
        const btTasks = tasks.filter((t) => t.businessTaskId === bt.id)
        const sprintIds = new Set(btTasks.map((t) => t.sprintId).filter(Boolean))
        const btSprints = sprints.filter((s) => sprintIds.has(s.id))
        
        // Sort sprints by start date
        const sortedSprints = [...btSprints].sort(
          (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        )
        
        for (const sprint of sortedSprints) {
          // Add sprint row
          result.push({
            id: sprint.id,
            type: 'sprint',
            title: sprint.name,
            startDate: sprint.startDate,
            endDate: sprint.endDate,
            parentId: bt.id,
            level: 1,
            isExpanded: expandedItems.includes(sprint.id)
          })
          
          // If sprint is expanded, add tasks
          if (expandedItems.includes(sprint.id)) {
            const sprintTasks = btTasks.filter((t) => t.sprintId === sprint.id)
            for (const task of sprintTasks) {
              result.push({
                id: task.id,
                type: 'task',
                title: task.title,
                startDate: sprint.startDate,
                endDate: sprint.startDate,
                parentId: sprint.id,
                level: 2
              })
            }
          }
        }
        
        // Add unassigned tasks (not in any sprint)
        const unassignedTasks = btTasks.filter((t) => !t.sprintId)
        for (const task of unassignedTasks) {
          result.push({
            id: task.id,
            type: 'task',
            title: task.title,
            parentId: bt.id,
            level: 1
          })
        }
      }
    }
    
    return result
  }, [businessTasks, tasks, sprints, milestones, expandedItems])
  
  // Sync scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollLeft(e.currentTarget.scrollLeft)
  }
  
  // Scroll to today on mount
  useEffect(() => {
    if (containerRef.current && viewScale === 'day') {
      const today = new Date()
      const daysDiff = Math.floor(
        (today.getTime() - viewRange.start.getTime()) / (1000 * 60 * 60 * 24)
      )
      const scrollTo = daysDiff * cellWidth - containerRef.current.clientWidth / 2
      containerRef.current.scrollLeft = Math.max(0, scrollTo)
    }
  }, [viewRange.start, cellWidth, viewScale])
  
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header with timeline */}
      <GanttHeader
        columns={columns}
        cellWidth={cellWidth}
        scrollLeft={scrollLeft}
        viewScale={viewScale}
      />
      
      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - row names */}
        <div className="w-32 sm:w-48 md:w-64 flex-shrink-0 border-r border-border bg-card">
          <div className="h-full overflow-y-auto">
            {rows.map((row) => (
              <div
                key={getRowKey(row)}
                className={cn(
                  'flex items-center h-10 px-1 sm:px-2 border-b border-border cursor-pointer transition-colors',
                  'hover:bg-accent/50',
                  selectedItemId === row.id && 'bg-accent'
                )}
                style={{ paddingLeft: `${row.level * 12 + 4}px` }}
                onClick={() => setSelectedItem(row.id, row.type)}
              >
                {(row.type === 'business-task' || row.type === 'sprint') && (
                  <button
                    className="mr-2 w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleExpanded(row.id)
                    }}
                  >
                    <svg
                      className={cn(
                        'w-3 h-3 transition-transform',
                        row.isExpanded && 'rotate-90'
                      )}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className={cn(
                        'truncate text-xs sm:text-sm',
                        row.type === 'business-task' && 'font-medium',
                        row.type === 'milestone' && 'font-medium',
                        row.type === 'milestone' && row.color === 'warning' && 'text-yellow-700',
                        row.type === 'milestone' && row.color !== 'warning' && 'text-chart-1',
                        row.type === 'task' && 'text-muted-foreground'
                      )}
                    >
                      {row.title}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <div className="space-y-1">
                      <div>{row.title}</div>
                      {row.type === 'business-task' && row.color?.includes(':warning') && (
                        <div className="text-yellow-200">Есть задачи, не запланированные ни в один спринт</div>
                      )}
                      {row.type === 'milestone' && row.color === 'warning' && (
                        <div className="text-yellow-200">Риск срыва сроков по проекту</div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            ))}
            
            {rows.length === 0 && (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                No tasks yet. Add a business task to get started.
              </div>
            )}
          </div>
        </div>
        
        {/* Right panel - Gantt bars */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto"
          onScroll={handleScroll}
        >
          <div
            ref={timelineRef}
            className="relative"
            style={{ width: totalWidth, minHeight: '100%' }}
          >
            {/* Grid lines */}
            <div className="absolute inset-0 pointer-events-none">
              {columns.map((col, i) => (
                <div
                  key={i}
                  className={cn(
                    'absolute top-0 bottom-0 border-l border-border/50',
                    col.isToday && 'border-l-2 border-l-chart-1',
                    col.isWeekend && 'bg-muted/30'
                  )}
                  style={{ left: i * cellWidth, width: cellWidth }}
                />
              ))}
            </div>
            
            {/* Rows */}
            <div className="relative">
              {rows.map((row, index) => (
                <GanttRow
                  key={getRowKey(row)}
                  row={row}
                  index={index}
                  viewStart={viewRange.start}
                  cellWidth={cellWidth}
                  viewScale={viewScale}
                  isSelected={selectedItemId === row.id}
                  onClick={() => setSelectedItem(row.id, row.type)}
                />
              ))}
            </div>
            
            {/* Dependencies SVG overlay */}
            <GanttDependencies
              rows={rows}
              businessTasks={businessTasks}
              milestones={milestones}
              viewStart={viewRange.start}
              cellWidth={cellWidth}
              viewScale={viewScale}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
