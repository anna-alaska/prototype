'use client'

import { useState } from 'react'
import { useProjectStore } from '@/lib/store'
import { taskStatusLabels, priorityLabels } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TaskDialog } from '../dialogs/task-dialog'
import { MoreHorizontalIcon, PencilIcon, TrashIcon, CalendarIcon, XIcon } from 'lucide-react'
import { SprintAssignDialog } from '../dialogs/sprint-assign-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

const priorityColors: Record<string, string> = {
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-green-500/20 text-green-400 border-green-500/30',
}

const statusColors: Record<string, string> = {
  todo: 'bg-muted text-muted-foreground',
  in_progress: 'bg-blue-500/20 text-blue-400',
  done: 'bg-emerald-500/20 text-emerald-400',
}

export function TasksList() {
  const { tasks, businessTasks, sprints, milestones, selectedItemId, setSelectedItem, deleteTask, updateTask } = useProjectStore()
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [assigningSprintFor, setAssigningSprintFor] = useState<string | null>(null)
  
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-sm text-muted-foreground">No tasks yet</p>
        <p className="text-xs text-muted-foreground mt-1">Create tasks and link them to business tasks</p>
      </div>
    )
  }
  
  // Group tasks by business task
  const groupedTasks = tasks.reduce((acc, task) => {
    const btId = task.businessTaskId
    if (!acc[btId]) {
      acc[btId] = []
    }
    acc[btId].push(task)
    return acc
  }, {} as Record<string, typeof tasks>)
  
  return (
    <div className="space-y-4">
      {Object.entries(groupedTasks).map(([btId, btTasks]) => {
        const bt = businessTasks.find((b) => b.id === btId)
        if (!bt) return null
        
        return (
          <div key={btId}>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              {bt.title}
            </h4>
            <div className="space-y-1.5">
              {btTasks.map((task) => {
                const sprint = task.sprintId ? sprints.find((s) => s.id === task.sprintId) : null
                const milestone = task.milestoneId ? milestones.find((m) => m.id === task.milestoneId) : null
                
                return (
                  <div
                    key={task.id}
                    className={cn(
                      'group rounded-md border border-sidebar-border bg-sidebar-accent/30 p-2.5 cursor-pointer transition-colors',
                      'hover:bg-sidebar-accent',
                      selectedItemId === task.id && 'ring-1 ring-sidebar-ring bg-sidebar-accent'
                    )}
                    onClick={() => setSelectedItem(task.id, 'task')}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-sidebar-foreground truncate">{task.title}</p>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <Badge variant="outline" className={cn('text-xs', statusColors[task.status])}>
                            {taskStatusLabels[task.status]}
                          </Badge>
                          <Badge variant="outline" className={cn('text-xs', priorityColors[task.priority])}>
                            {priorityLabels[task.priority]}
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-blue-500/15 text-blue-300 border-blue-500/30">
                            {task.capacity} pt
                          </Badge>
                          {!sprint && (
                            <Badge variant="outline" className="text-xs bg-yellow-500/15 text-yellow-700 border-yellow-500/30">
                              Не запланировано
                            </Badge>
                          )}
                          {sprint && (
                            <Badge variant="outline" className="text-xs bg-sprint/20 text-sprint-light border-sprint/30">
                              {sprint.name}
                            </Badge>
                          )}
                          {milestone && (
                            <Badge variant="outline" className="text-xs bg-chart-1/15 text-chart-1 border-chart-1/30">
                              {milestone.title}
                            </Badge>
                          )}
                        </div>
                        {(task.subtasks ?? []).length > 0 && (
                          <div className="mt-2 space-y-1">
                            {(task.subtasks ?? []).map((subtask) => (
                              <div
                                key={subtask.id}
                                className="flex items-center gap-2 text-xs text-muted-foreground"
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/70" />
                                <span className="truncate">{subtask.title}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 flex-shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {task.sprintId ? (
                            <DropdownMenuItem onClick={() => updateTask(task.id, { sprintId: undefined })}>
                              <XIcon className="h-4 w-4 mr-2" />
                              Remove from Sprint
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => setAssigningSprintFor(task.id)}>
                              <CalendarIcon className="h-4 w-4 mr-2" />
                              Assign to Sprint
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => setEditingTask(task.id)}>
                            <PencilIcon className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteTask(task.id)}
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
            </div>
          </div>
        )
      })}
      
      {/* Edit dialog */}
      <TaskDialog
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
        editId={editingTask || undefined}
      />
      
      {/* Sprint assign dialog */}
      <SprintAssignDialog
        open={!!assigningSprintFor}
        onOpenChange={(open) => !open && setAssigningSprintFor(null)}
        taskId={assigningSprintFor || undefined}
      />
    </div>
  )
}
