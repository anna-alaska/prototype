'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { BusinessTasksList } from './business-tasks-list'
import { MilestonesList } from './milestones-list'
import { TasksList } from './tasks-list'
import { SprintsList } from './sprints-list'
import { BusinessTaskDialog } from '../dialogs/business-task-dialog'
import { MilestoneDialog } from '../dialogs/milestone-dialog'
import { TaskDialog } from '../dialogs/task-dialog'
import { SprintDialog } from '../dialogs/sprint-dialog'
import { PlusIcon, BriefcaseIcon, FlagIcon, ListTodoIcon, ZapIcon } from 'lucide-react'

export function SidebarPanel() {
  const [activeTab, setActiveTab] = useState('business-tasks')
  const [dialogOpen, setDialogOpen] = useState<'business-task' | 'task' | 'sprint' | 'milestone' | null>(null)
  const tabTriggerClassName = 'text-xs flex items-center justify-center gap-1.5 px-2'
  
  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <div className="flex-shrink-0 p-2 sm:p-3 border-b border-sidebar-border">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="business-tasks" className={tabTriggerClassName}>
              <BriefcaseIcon className="h-3.5 w-3.5" />
              <span>Business</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className={tabTriggerClassName}>
              <ListTodoIcon className="h-3.5 w-3.5" />
              <span>Tasks</span>
            </TabsTrigger>
            <TabsTrigger value="sprints" className={tabTriggerClassName}>
              <ZapIcon className="h-3.5 w-3.5" />
              <span>Sprints</span>
            </TabsTrigger>
            <TabsTrigger value="milestones" className={tabTriggerClassName}>
              <FlagIcon className="h-3.5 w-3.5" />
              <span>Goals</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <TabsContent value="business-tasks" className="h-full m-0">
            <div className="flex flex-col h-full">
              <div className="flex-shrink-0 p-2 sm:p-3 border-b border-sidebar-border">
                <Button
                  size="sm"
                  className="w-full text-xs sm:text-sm"
                  onClick={() => setDialogOpen('business-task')}
                >
                  <PlusIcon className="h-4 w-4 mr-1 sm:mr-1.5" />
                  Add Business Task
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 sm:p-3">
                <BusinessTasksList />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="tasks" className="h-full m-0">
            <div className="flex flex-col h-full">
              <div className="flex-shrink-0 p-2 sm:p-3 border-b border-sidebar-border">
                <Button
                  size="sm"
                  className="w-full text-xs sm:text-sm"
                  onClick={() => setDialogOpen('task')}
                >
                  <PlusIcon className="h-4 w-4 mr-1 sm:mr-1.5" />
                  Add Task
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 sm:p-3">
                <TasksList />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="sprints" className="h-full m-0">
            <div className="flex flex-col h-full">
              <div className="flex-shrink-0 p-2 sm:p-3 border-b border-sidebar-border">
                <Button
                  size="sm"
                  className="w-full text-xs sm:text-sm"
                  onClick={() => setDialogOpen('sprint')}
                >
                  <PlusIcon className="h-4 w-4 mr-1 sm:mr-1.5" />
                  Add Sprint
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 sm:p-3">
                <SprintsList />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="milestones" className="h-full m-0">
            <div className="flex flex-col h-full">
              <div className="flex-shrink-0 p-2 sm:p-3 border-b border-sidebar-border">
                <Button
                  size="sm"
                  className="w-full text-xs sm:text-sm"
                  onClick={() => setDialogOpen('milestone')}
                >
                  <PlusIcon className="h-4 w-4 mr-1 sm:mr-1.5" />
                  Add Milestone
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 sm:p-3">
                <MilestonesList />
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
      
      {/* Dialogs */}
      <BusinessTaskDialog
        open={dialogOpen === 'business-task'}
        onOpenChange={(open) => !open && setDialogOpen(null)}
      />
      <TaskDialog
        open={dialogOpen === 'task'}
        onOpenChange={(open) => !open && setDialogOpen(null)}
      />
      <SprintDialog
        open={dialogOpen === 'sprint'}
        onOpenChange={(open) => !open && setDialogOpen(null)}
      />
      <MilestoneDialog
        open={dialogOpen === 'milestone'}
        onOpenChange={(open) => !open && setDialogOpen(null)}
      />
    </div>
  )
}
