'use client'

import { useMemo } from 'react'
import { calculateBarPosition } from '@/lib/date-utils'
import type { GanttRow, BusinessTask, Milestone, ViewScale } from '@/lib/types'

interface GanttDependenciesProps {
  rows: GanttRow[]
  businessTasks: BusinessTask[]
  milestones: Milestone[]
  viewStart: Date
  cellWidth: number
  viewScale: ViewScale
}

export function GanttDependencies({
  rows,
  businessTasks,
  milestones,
  viewStart,
  cellWidth,
  viewScale
}: GanttDependenciesProps) {
  const rowHeight = 40
  
  // Calculate dependency lines
  const lines = useMemo(() => {
    const result: {
      id: string
      x1: number
      y1: number
      x2: number
      y2: number
    }[] = []
    
    for (const bt of businessTasks) {
      if (bt.dependencies.length === 0) continue
      
      const targetRowIndex = rows.findIndex((r) => r.id === bt.id)
      if (targetRowIndex === -1) continue
      
      const targetRow = rows[targetRowIndex]
      if (!targetRow.startDate) continue
      
      const targetPos = calculateBarPosition(
        targetRow.startDate,
        targetRow.endDate!,
        viewStart,
        cellWidth,
        viewScale
      )
      
      for (const depId of bt.dependencies) {
        const sourceRowIndex = rows.findIndex((r) => r.id === depId)
        if (sourceRowIndex === -1) continue
        
        const sourceRow = rows[sourceRowIndex]
        if (!sourceRow.startDate || !sourceRow.endDate) continue
        
        const sourcePos = calculateBarPosition(
          sourceRow.startDate,
          sourceRow.endDate,
          viewStart,
          cellWidth,
          viewScale
        )
        
        // Finish-to-Start: from end of source to start of target
        result.push({
          id: `${depId}-${bt.id}`,
          x1: sourcePos.left + sourcePos.width,
          y1: sourceRowIndex * rowHeight + rowHeight / 2,
          x2: targetPos.left,
          y2: targetRowIndex * rowHeight + rowHeight / 2
        })
      }
    }

    for (const milestone of milestones) {
      const requiredBusinessTaskIds = milestone.requiredBusinessTaskIds ?? []
      if (requiredBusinessTaskIds.length === 0) continue

      const milestoneRowIndex = rows.findIndex(
        (row) => row.id === milestone.id && row.type === 'milestone'
      )
      if (milestoneRowIndex === -1) continue

      const milestoneRow = rows[milestoneRowIndex]
      if (!milestoneRow.startDate || !milestoneRow.endDate) continue

      const milestonePos = calculateBarPosition(
        milestoneRow.startDate,
        milestoneRow.endDate,
        viewStart,
        cellWidth,
        viewScale
      )

      for (const businessTaskId of requiredBusinessTaskIds) {
        const businessTaskRowIndex = rows.findIndex(
          (row) => row.id === businessTaskId && row.type === 'business-task'
        )
        if (businessTaskRowIndex === -1) continue

        const businessTaskRow = rows[businessTaskRowIndex]
        if (!businessTaskRow.startDate || !businessTaskRow.endDate) continue

        const businessTaskPos = calculateBarPosition(
          businessTaskRow.startDate,
          businessTaskRow.endDate,
          viewStart,
          cellWidth,
          viewScale
        )

        result.push({
          id: `${businessTaskId}-${milestone.id}-milestone`,
          x1: businessTaskPos.left + businessTaskPos.width,
          y1: businessTaskRowIndex * rowHeight + rowHeight / 2,
          x2: milestonePos.left + milestonePos.width / 2,
          y2: milestoneRowIndex * rowHeight + rowHeight / 2,
        })
      }
    }
    
    return result
  }, [rows, businessTasks, milestones, viewStart, cellWidth, viewScale])
  
  if (lines.length === 0) return null
  
  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none"
      style={{ width: '100%', height: rows.length * rowHeight }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill="var(--dependency-line)"
          />
        </marker>
      </defs>
      
      {lines.map((line) => {
        // Create a path with a curve
        const midX = (line.x1 + line.x2) / 2
        const pathD = `
          M ${line.x1} ${line.y1}
          C ${midX} ${line.y1}, ${midX} ${line.y2}, ${line.x2} ${line.y2}
        `
        
        return (
          <path
            key={line.id}
            d={pathD}
            stroke="var(--dependency-line)"
            strokeWidth="2"
            fill="none"
            markerEnd="url(#arrowhead)"
            className="opacity-60"
          />
        )
      })}
    </svg>
  )
}
