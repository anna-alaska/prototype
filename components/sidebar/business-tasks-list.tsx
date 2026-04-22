'use client'

import { useState } from 'react'
import { useProjectStore } from '@/lib/store'
import { formatDate } from '@/lib/date-utils'
import { businessTaskStatusLabels } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BusinessTaskDialog } from '../dialogs/business-task-dialog'
import { AlertTriangleIcon, MoreHorizontalIcon, PencilIcon, TrashIcon, PlusIcon } from 'lucide-react'
import { TaskDialog } from '../dialogs/task-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

const colorMap: Record<string, string> = {
  blue: 'bg-blue-500',
  green: 'bg-emerald-500',
  purple: 'bg-violet-500',
  orange: 'bg-orange-500',
  pink: 'bg-pink-500',
  cyan: 'bg-cyan-500',
}

export function BusinessTasksList() {
  const {
    businessTasks,
    selectedItemId,
    setSelectedItem,
    deleteBusinessTask,
    getTasksForBusinessTask,
    hasUnscheduledTasksForBusinessTask,
  } = useProjectStore()
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [addingTaskForBt, setAddingTaskForBt] = useState<string | null>(null)
  
  if (businessTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-sm text-muted-foreground">No business tasks yet</p>
        <p className="text-xs text-muted-foreground mt-1">Create your first business task to get started</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-2">
      {businessTasks.map((bt) => {
        const taskCount = getTasksForBusinessTask(bt.id).length
        const hasUnscheduledTasks = hasUnscheduledTasksForBusinessTask(bt.id)
        
        return (
          <div
            key={bt.id}
            className={cn(
              'group rounded-lg border border-sidebar-border bg-sidebar-accent/50 p-3 cursor-pointer transition-colors',
              'hover:bg-sidebar-accent',
              hasUnscheduledTasks && 'border-yellow-500/40 bg-yellow-500/10',
              selectedItemId === bt.id && 'ring-1 ring-sidebar-ring bg-sidebar-accent'
            )}
            onClick={() => setSelectedItem(bt.id, 'business-task')}
          >
            <div className="flex items-start gap-2">
              <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', colorMap[bt.color] || colorMap.blue)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-medium text-sidebar-foreground truncate">
                    {bt.title}
                  </h4>
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
                      <DropdownMenuItem onClick={() => setAddingTaskForBt(bt.id)}>
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Task
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingTask(bt.id)}>
                        <PencilIcon className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => deleteBusinessTask(bt.id)}
                      >
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant="secondary" className="text-xs">
                    {businessTaskStatusLabels[bt.status]}
                  </Badge>
                  {hasUnscheduledTasks && (
                    <Badge variant="outline" className="text-xs border-yellow-500/40 bg-yellow-500/15 text-yellow-700">
                      <AlertTriangleIcon className="h-3 w-3 mr-1" />
                      Unscheduled tasks
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {taskCount} task{taskCount !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <p className="text-xs text-muted-foreground mt-1.5">
                  {formatDate(bt.startDate, 'MMM d')} - {formatDate(bt.endDate, 'MMM d, yyyy')}
                </p>
                {hasUnscheduledTasks && (
                  <p className="mt-1.5 text-xs font-medium text-yellow-700">
                    Есть задачи, не запланированные ни в один спринт
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      })}
      
      {/* Edit dialog */}
      <BusinessTaskDialog
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
        editId={editingTask || undefined}
      />
      
      {/* Add task dialog */}
      <TaskDialog
        open={!!addingTaskForBt}
        onOpenChange={(open) => !open && setAddingTaskForBt(null)}
        defaultBusinessTaskId={addingTaskForBt || undefined}
      />
    </div>
  )
}
