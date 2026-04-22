'use client'

import { useState } from 'react'
import { useProjectStore } from '@/lib/store'
import { formatDate } from '@/lib/date-utils'
import { sprintStatusLabels } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SprintDialog } from '../dialogs/sprint-dialog'
import { MoreHorizontalIcon, PencilIcon, TrashIcon, PlusIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

const statusColors: Record<string, string> = {
  planned: 'bg-muted text-muted-foreground',
  active: 'bg-sprint/20 text-sprint-light',
  completed: 'bg-emerald-500/20 text-emerald-400',
}

export function SprintsList() {
  const { sprints, selectedItemId, setSelectedItem, deleteSprint, getTasksForSprint, getSprintCapacity } = useProjectStore()
  const [editingSprint, setEditingSprint] = useState<string | null>(null)
  const [showNewSprintDialog, setShowNewSprintDialog] = useState(false)
  
  if (sprints.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-sm text-muted-foreground">No sprints yet</p>
        <p className="text-xs text-muted-foreground mt-1">Create sprints to organize your tasks</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => setShowNewSprintDialog(true)}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Sprint
        </Button>
        
        <SprintDialog
          open={showNewSprintDialog}
          onOpenChange={setShowNewSprintDialog}
        />
      </div>
    )
  }
  
  // Sort sprints by start date
  const sortedSprints = [...sprints].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  )
  
  return (
    <div className="space-y-2">
      {sortedSprints.map((sprint) => {
        const taskCount = getTasksForSprint(sprint.id).length
        const sprintCapacity = getSprintCapacity(sprint.id)
        
        return (
          <div
            key={sprint.id}
            className={cn(
              'group rounded-lg border border-sidebar-border bg-sidebar-accent/50 p-3 cursor-pointer transition-colors',
              'hover:bg-sidebar-accent',
              selectedItemId === sprint.id && 'ring-1 ring-sidebar-ring bg-sidebar-accent'
            )}
            onClick={() => setSelectedItem(sprint.id, 'sprint')}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-sidebar-foreground">{sprint.name}</h4>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant="outline" className={cn('text-xs', statusColors[sprint.status])}>
                    {sprintStatusLabels[sprint.status]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {taskCount} task{taskCount !== 1 ? 's' : ''}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {sprintCapacity} pt
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {formatDate(sprint.startDate, 'MMM d')} - {formatDate(sprint.endDate, 'MMM d, yyyy')}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontalIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditingSprint(sprint.id)}>
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => deleteSprint(sprint.id)}
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )
      })}
      
      {/* Quick add button */}
      <Button
        variant="ghost"
        className="w-full mt-2 border border-dashed border-sidebar-border"
        onClick={() => setShowNewSprintDialog(true)}
      >
        <PlusIcon className="h-4 w-4 mr-2" />
        New Sprint
      </Button>
      
      {/* Edit dialog */}
      <SprintDialog
        open={!!editingSprint}
        onOpenChange={(open) => !open && setEditingSprint(null)}
        editId={editingSprint || undefined}
      />
      
      {/* New sprint dialog */}
      <SprintDialog
        open={showNewSprintDialog}
        onOpenChange={setShowNewSprintDialog}
      />
    </div>
  )
}
