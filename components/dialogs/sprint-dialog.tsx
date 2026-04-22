'use client'

import { useState, useEffect } from 'react'
import { useProjectStore } from '@/lib/store'
import { sprintStatusLabels } from '@/lib/types'
import { getTodayString } from '@/lib/date-utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import type { Sprint } from '@/lib/types'

interface SprintDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editId?: string
}

const defaultFormData = {
  name: '',
  startDate: getTodayString(),
  endDate: '',
  status: 'planned' as Sprint['status']
}

export function SprintDialog({ open, onOpenChange, editId }: SprintDialogProps) {
  const { sprints, addSprint, updateSprint } = useProjectStore()
  const [formData, setFormData] = useState(defaultFormData)
  
  const editingSprint = editId ? sprints.find((s) => s.id === editId) : null
  
  // Auto-generate sprint name
  const getNextSprintName = () => {
    const sprintNumbers = sprints
      .map((s) => {
        const match = s.name.match(/Sprint\s+(\d+)/i)
        return match ? parseInt(match[1], 10) : 0
      })
      .filter((n) => n > 0)
    
    const nextNumber = sprintNumbers.length > 0 ? Math.max(...sprintNumbers) + 1 : 1
    return `Sprint ${nextNumber}`
  }
  
  // Load existing data when editing
  useEffect(() => {
    if (editingSprint) {
      setFormData({
        name: editingSprint.name,
        startDate: editingSprint.startDate,
        endDate: editingSprint.endDate,
        status: editingSprint.status
      })
    } else {
      const today = new Date()
      const endDate = new Date(today)
      endDate.setDate(endDate.getDate() + 13) // 2-week sprint
      
      setFormData({
        name: getNextSprintName(),
        startDate: today.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        status: 'planned'
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingSprint, open])
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.startDate || !formData.endDate) return
    
    const sprintData = {
      name: formData.name.trim(),
      startDate: formData.startDate,
      endDate: formData.endDate,
      status: formData.status
    }
    
    if (editId) {
      updateSprint(editId, sprintData)
    } else {
      addSprint(sprintData)
    }
    
    onOpenChange(false)
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editId ? 'Edit Sprint' : 'New Sprint'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter sprint name"
              required
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
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                min={formData.startDate}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as Sprint['status'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(sprintStatusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="rounded-lg border border-border bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> The end date of a sprint affects the calculated end dates of 
              business tasks that have tasks assigned to this sprint.
            </p>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editId ? 'Save Changes' : 'Create Sprint'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
