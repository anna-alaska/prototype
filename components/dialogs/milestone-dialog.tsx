'use client'

import { useEffect, useState } from 'react'
import { useProjectStore } from '@/lib/store'
import { getTodayString } from '@/lib/date-utils'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface MilestoneDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editId?: string
}

const defaultFormData = {
  title: '',
  description: '',
  date: getTodayString(),
  requiredBusinessTaskIds: [] as string[],
}

export function MilestoneDialog({ open, onOpenChange, editId }: MilestoneDialogProps) {
  const { milestones, businessTasks, addMilestone, updateMilestone } = useProjectStore()
  const [formData, setFormData] = useState(defaultFormData)

  const editingMilestone = editId ? milestones.find((milestone) => milestone.id === editId) : null

  useEffect(() => {
    if (editingMilestone) {
      setFormData({
        title: editingMilestone.title,
        description: editingMilestone.description || '',
        date: editingMilestone.date,
        requiredBusinessTaskIds: editingMilestone.requiredBusinessTaskIds || [],
      })
    } else {
      setFormData({
        ...defaultFormData,
        date: getTodayString(),
      })
    }
  }, [editingMilestone, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.date) return

    const milestoneData = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      date: formData.date,
      requiredBusinessTaskIds: formData.requiredBusinessTaskIds,
    }

    if (editId) {
      updateMilestone(editId, milestoneData)
    } else {
      addMilestone(milestoneData)
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editId ? 'Edit Milestone' : 'New Milestone'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="milestone-title">Title</Label>
            <Input
              id="milestone-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter milestone title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="milestone-description">Description</Label>
            <Textarea
              id="milestone-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter description (optional)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="milestone-date">Date</Label>
            <Input
              id="milestone-date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          {businessTasks.length > 0 && (
            <div className="space-y-3">
              <Label>Required Business Tasks</Label>
              <div className="max-h-44 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
                {businessTasks.map((businessTask) => {
                  const checked = formData.requiredBusinessTaskIds.includes(businessTask.id)

                  return (
                    <label
                      key={businessTask.id}
                      className="flex cursor-pointer items-start gap-3 rounded-md p-1 hover:bg-accent/40"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => {
                          const isChecked = value === true
                          setFormData((current) => ({
                            ...current,
                            requiredBusinessTaskIds: isChecked
                              ? [...current.requiredBusinessTaskIds, businessTask.id]
                              : current.requiredBusinessTaskIds.filter((id) => id !== businessTask.id),
                          }))
                        }}
                      />
                      <div className="min-w-0">
                        <div className="text-sm text-foreground">{businessTask.title}</div>
                        {businessTask.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {businessTask.description}
                          </p>
                        )}
                      </div>
                    </label>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                These links are logical and show which business tasks should be completed before the milestone.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editId ? 'Save Changes' : 'Create Milestone'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
