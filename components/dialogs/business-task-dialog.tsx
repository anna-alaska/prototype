'use client'

import { useState, useEffect } from 'react'
import { useProjectStore } from '@/lib/store'
import { businessTaskColors, businessTaskStatusLabels } from '@/lib/types'
import { getTodayString } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
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
import type { BusinessTask } from '@/lib/types'

const NO_DEPENDENCY_VALUE = 'none'

interface BusinessTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editId?: string
}

const defaultFormData = {
  title: '',
  description: '',
  startDate: getTodayString(),
  manualEndDate: '',
  color: 'blue',
  status: 'not_started' as BusinessTask['status'],
  dependencies: [] as string[]
}

export function BusinessTaskDialog({ open, onOpenChange, editId }: BusinessTaskDialogProps) {
  const { businessTasks, addBusinessTask, updateBusinessTask } = useProjectStore()
  const [formData, setFormData] = useState(defaultFormData)
  
  const editingTask = editId ? businessTasks.find((bt) => bt.id === editId) : null
  
  // Load existing data when editing
  useEffect(() => {
    if (editingTask) {
      setFormData({
        title: editingTask.title,
        description: editingTask.description || '',
        startDate: editingTask.startDate,
        manualEndDate: editingTask.manualEndDate || editingTask.endDate,
        color: editingTask.color,
        status: editingTask.status,
        dependencies: editingTask.dependencies
      })
    } else {
      setFormData({
        ...defaultFormData,
        startDate: getTodayString(),
        manualEndDate: (() => {
          const date = new Date()
          date.setDate(date.getDate() + 14)
          return date.toISOString().split('T')[0]
        })()
      })
    }
  }, [editingTask, open])
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) return
    
    const taskData = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      startDate: formData.startDate,
      endDate: formData.manualEndDate || formData.startDate,
      manualEndDate: formData.manualEndDate || undefined,
      color: formData.color,
      status: formData.status,
      dependencies: formData.dependencies
    }
    
    if (editId) {
      updateBusinessTask(editId, taskData)
    } else {
      addBusinessTask(taskData)
    }
    
    onOpenChange(false)
  }
  
  // Available tasks for dependencies (exclude self and tasks that depend on this one)
  const availableForDependency = businessTasks.filter((bt) => {
    if (editId && bt.id === editId) return false
    // Check for circular dependency
    if (editId && bt.dependencies.includes(editId)) return false
    return true
  })
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editId ? 'Edit Business Task' : 'New Business Task'}</DialogTitle>
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
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.manualEndDate}
                onChange={(e) => setFormData({ ...formData, manualEndDate: e.target.value })}
                min={formData.startDate}
              />
              <p className="text-xs text-muted-foreground">Auto-adjusts based on sprints</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {businessTaskColors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={cn(
                      'w-6 h-6 rounded-full transition-all',
                      color.class,
                      formData.color === color.value && 'ring-2 ring-offset-2 ring-offset-background ring-foreground'
                    )}
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as BusinessTask['status'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(businessTaskStatusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {availableForDependency.length > 0 && (
            <div className="space-y-2">
              <Label>Dependencies (Finish-to-Start)</Label>
              <Select
                value={formData.dependencies[0] || undefined}
                onValueChange={(value) => setFormData({ 
                  ...formData, 
                  dependencies: value === NO_DEPENDENCY_VALUE ? [] : [value]
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select dependency (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_DEPENDENCY_VALUE}>None</SelectItem>
                  {availableForDependency.map((bt) => (
                    <SelectItem key={bt.id} value={bt.id}>
                      {bt.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">This task will start after the selected task ends</p>
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editId ? 'Save Changes' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
