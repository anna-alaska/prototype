'use client'

import { useState } from 'react'
import { useProjectStore } from '@/lib/store'
import { formatDate } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { MilestoneDialog } from '../dialogs/milestone-dialog'
import { Badge } from '@/components/ui/badge'
import { MoreHorizontalIcon, PencilIcon, TrashIcon, FlagIcon, PlusIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function MilestonesList() {
  const { milestones, selectedItemId, setSelectedItem, deleteMilestone, getTasksForMilestone, isMilestoneAtRisk } = useProjectStore()
  const [editingMilestone, setEditingMilestone] = useState<string | null>(null)
  const [showNewMilestoneDialog, setShowNewMilestoneDialog] = useState(false)

  if (milestones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-sm text-muted-foreground">No milestones yet</p>
        <p className="text-xs text-muted-foreground mt-1">Create milestones and softly link tasks to them</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => setShowNewMilestoneDialog(true)}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Milestone
        </Button>

        <MilestoneDialog
          open={showNewMilestoneDialog}
          onOpenChange={setShowNewMilestoneDialog}
        />
      </div>
    )
  }

  const sortedMilestones = [...milestones].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  return (
    <div className="space-y-2">
      {sortedMilestones.map((milestone) => {
        const taskCount = getTasksForMilestone(milestone.id).length
        const requiredBusinessTaskCount = (milestone.requiredBusinessTaskIds ?? []).length
        const isAtRisk = isMilestoneAtRisk(milestone.id)

        return (
          <div
            key={milestone.id}
            className={cn(
              'group rounded-lg border border-sidebar-border bg-sidebar-accent/50 p-3 cursor-pointer transition-colors',
              'hover:bg-sidebar-accent',
              isAtRisk && 'border-yellow-500/40 bg-yellow-500/10',
              selectedItemId === milestone.id && 'ring-1 ring-sidebar-ring bg-sidebar-accent'
            )}
            onClick={() => setSelectedItem(milestone.id, 'milestone')}
          >
            <div className="flex items-start gap-2">
              <div className={cn(
                'mt-0.5 flex h-7 w-7 items-center justify-center rounded-md',
                isAtRisk ? 'bg-yellow-500/20 text-yellow-600' : 'bg-chart-1/15 text-chart-1'
              )}>
                <FlagIcon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-medium text-sidebar-foreground truncate">
                    {milestone.title}
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
                      <DropdownMenuItem onClick={() => setEditingMilestone(milestone.id)}>
                        <PencilIcon className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => deleteMilestone(milestone.id)}
                      >
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-1.5 flex items-center gap-2">
                  <Badge variant="outline" className="text-xs bg-chart-1/15 text-chart-1 border-chart-1/30">
                    {formatDate(milestone.date, 'MMM d, yyyy')}
                  </Badge>
                  {isAtRisk && (
                    <Badge variant="outline" className="text-xs border-yellow-500/40 bg-yellow-500/15 text-yellow-700">
                      Risk
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {taskCount} linked task{taskCount !== 1 ? 's' : ''}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {requiredBusinessTaskCount} required business task{requiredBusinessTaskCount !== 1 ? 's' : ''}
                  </span>
                </div>

                {milestone.description && (
                  <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                    {milestone.description}
                  </p>
                )}
                {isAtRisk && (
                  <p className="mt-1.5 text-xs font-medium text-yellow-700">
                    Риск срыва сроков по проекту
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      })}

      <Button
        variant="ghost"
        className="w-full mt-2 border border-dashed border-sidebar-border"
        onClick={() => setShowNewMilestoneDialog(true)}
      >
        <PlusIcon className="h-4 w-4 mr-2" />
        New Milestone
      </Button>

      <MilestoneDialog
        open={!!editingMilestone}
        onOpenChange={(open) => !open && setEditingMilestone(null)}
        editId={editingMilestone || undefined}
      />

      <MilestoneDialog
        open={showNewMilestoneDialog}
        onOpenChange={setShowNewMilestoneDialog}
      />
    </div>
  )
}
