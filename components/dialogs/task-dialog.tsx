'use client'

import { useState, useEffect } from 'react'
import { useProjectStore } from '@/lib/store'
import { taskCapacityOptions, taskStatusLabels, priorityLabels } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { PlusIcon, TrashIcon } from 'lucide-react'
import type { Task } from '@/lib/types'

const NO_SPRINT_VALUE = 'none'
const NO_MILESTONE_VALUE = 'none'

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editId?: string
  defaultBusinessTaskId?: string
}

const defaultFormData = {
  title: '',
  description: '',
  businessTaskId: '',
  sprintId: '',
  milestoneId: '',
  subtasks: [] as { id: string; title: string }[],
  capacity: 1 as Task['capacity'],
  status: 'todo' as Task['status'],
  priority: 'medium' as Task['priority']
}

export function TaskDialog({ open, onOpenChange, editId, defaultBusinessTaskId }: TaskDialogProps) {
  const { tasks, businessTasks, sprints, milestones, addTask, updateTask } = useProjectStore()
  const [formData, setFormData] = useState(defaultFormData)
  
  const editingTask = editId ? tasks.find((t) => t.id === editId) : null
  
  // Load existing data when editing
  useEffect(() => {
    if (editingTask) {
      setFormData({
        title: editingTask.title,
        description: editingTask.description || '',
        businessTaskId: editingTask.businessTaskId,
        sprintId: editingTask.sprintId || '',
        milestoneId: editingTask.milestoneId || '',
        subtasks: editingTask.subtasks ?? [],
        capacity: editingTask.capacity,
        status: editingTask.status,
        priority: editingTask.priority
      })
    } else {
      setFormData({
        ...defaultFormData,
        businessTaskId: defaultBusinessTaskId || (businessTasks[0]?.id || '')
      })
    }
  }, [editingTask, open, defaultBusinessTaskId, businessTasks])
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.businessTaskId) return
    
    const taskData = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      businessTaskId: formData.businessTaskId,
      sprintId: formData.sprintId || undefined,
      milestoneId: formData.milestoneId || undefined,
      subtasks: formData.subtasks
        .map((subtask) => ({ ...subtask, title: subtask.title.trim() }))
        .filter((subtask) => subtask.title.length > 0),
      capacity: formData.capacity,
      status: formData.status,
      priority: formData.priority
    }
    
    if (editId) {
      updateTask(editId, taskData)
    } else {
      addTask(taskData)
    }
    
    onOpenChange(false)
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editId ? 'Edit Task' : 'New Task'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter task title"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter description (optional)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Split Into Parts</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() =>
                  setFormData({
                    ...formData,
                    subtasks: [...formData.subtasks, { id: crypto.randomUUID(), title: '' }]
                  })
                }
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Part
              </Button>
            </div>
            <div className="space-y-2">
              {formData.subtasks.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Optional. Split the task into parts like frontend, backend, QA.
                </p>
              )}
              {formData.subtasks.map((subtask, index) => (
                <div key={subtask.id} className="flex items-center gap-2">
                  <Input
                    value={subtask.title}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        subtasks: formData.subtasks.map((item) =>
                          item.id === subtask.id ? { ...item, title: e.target.value } : item
                        )
                      })
                    }
                    placeholder={`Part ${index + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        subtasks: formData.subtasks.filter((item) => item.id !== subtask.id)
                      })
                    }
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Business Task</Label>
            <Select
              value={formData.businessTaskId}
              onValueChange={(value) => setFormData({ ...formData, businessTaskId: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select business task" />
              </SelectTrigger>
              <SelectContent>
                {businessTasks.map((bt) => (
                  <SelectItem key={bt.id} value={bt.id}>
                    {bt.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Link this task to a business task</p>
          </div>
          
          <div className="space-y-2">
            <Label>Sprint (Optional)</Label>
            <Select
              value={formData.sprintId || undefined}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  sprintId: value === NO_SPRINT_VALUE ? '' : value
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="No sprint assigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_SPRINT_VALUE}>No sprint</SelectItem>
                {sprints.map((sprint) => (
                  <SelectItem key={sprint.id} value={sprint.id}>
                    {sprint.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Assigning to a sprint will affect the business task end date</p>
          </div>

          <div className="space-y-2">
            <Label>Milestone (Optional)</Label>
            <Select
              value={formData.milestoneId || undefined}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  milestoneId: value === NO_MILESTONE_VALUE ? '' : value
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="No milestone linked" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_MILESTONE_VALUE}>No milestone</SelectItem>
                {milestones.map((milestone) => (
                  <SelectItem key={milestone.id} value={milestone.id}>
                    {milestone.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Logical link only, it does not affect dates</p>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Capacity</Label>
              <Select
                value={String(formData.capacity)}
                onValueChange={(value) =>
                  setFormData({ ...formData, capacity: Number(value) as Task['capacity'] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {taskCapacityOptions.map((capacity) => (
                    <SelectItem key={capacity} value={String(capacity)}>
                      {capacity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as Task['status'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(taskStatusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as Task['priority'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(priorityLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.businessTaskId}>
              {editId ? 'Save Changes' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
