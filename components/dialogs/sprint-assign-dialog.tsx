'use client'

import { useState } from 'react'
import { useProjectStore } from '@/lib/store'
import { formatDate } from '@/lib/date-utils'
import { sprintStatusLabels } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { CheckIcon, PlusIcon } from 'lucide-react'
import { SprintDialog } from './sprint-dialog'

interface SprintAssignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskId?: string
}

const statusColors: Record<string, string> = {
  planned: 'bg-muted text-muted-foreground',
  active: 'bg-sprint/20 text-sprint-light',
  completed: 'bg-emerald-500/20 text-emerald-400',
}

export function SprintAssignDialog({ open, onOpenChange, taskId }: SprintAssignDialogProps) {
  const { sprints, tasks, updateTask } = useProjectStore()
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null)
  const [showNewSprintDialog, setShowNewSprintDialog] = useState(false)
  
  const task = taskId ? tasks.find((t) => t.id === taskId) : null
  
  // Sort sprints by start date
  const sortedSprints = [...sprints].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  )
  
  const handleAssign = () => {
    if (taskId && selectedSprintId) {
      updateTask(taskId, { sprintId: selectedSprintId })
      onOpenChange(false)
      setSelectedSprintId(null)
    }
  }
  
  if (!task) return null
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign to Sprint</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Select a sprint for task: <span className="text-foreground font-medium">{task.title}</span>
            </p>
            
            {sortedSprints.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-4">No sprints available</p>
                <Button variant="outline" onClick={() => setShowNewSprintDialog(true)}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Sprint
                </Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {sortedSprints.map((sprint) => (
                  <div
                    key={sprint.id}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors',
                      selectedSprintId === sprint.id
                        ? 'border-ring bg-accent'
                        : 'border-border hover:bg-accent/50'
                    )}
                    onClick={() => setSelectedSprintId(sprint.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{sprint.name}</span>
                        <Badge variant="outline" className={cn('text-xs', statusColors[sprint.status])}>
                          {sprintStatusLabels[sprint.status]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(sprint.startDate, 'MMM d')} - {formatDate(sprint.endDate, 'MMM d, yyyy')}
                      </p>
                    </div>
                    {selectedSprintId === sprint.id && (
                      <CheckIcon className="h-5 w-5 text-primary" />
                    )}
                  </div>
                ))}
                
                <Button
                  variant="ghost"
                  className="w-full mt-2 border border-dashed border-border"
                  onClick={() => setShowNewSprintDialog(true)}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create New Sprint
                </Button>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={!selectedSprintId}>
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* New sprint dialog */}
      <SprintDialog
        open={showNewSprintDialog}
        onOpenChange={setShowNewSprintDialog}
      />
    </>
  )
}
