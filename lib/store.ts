import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { z } from 'zod'
import type {
  BusinessTask,
  Milestone,
  Sprint,
  Task,
  TaskCapacity,
  TaskSubtask,
  ViewScale,
  GanttItemType,
} from './types'

const generateId = () => crypto.randomUUID()

const businessTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  manualEndDate: z.string().optional(),
  color: z.string(),
  dependencies: z.array(z.string()),
  status: z.enum(['not_started', 'in_progress', 'completed']),
})

const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  businessTaskId: z.string(),
  sprintId: z.string().optional(),
  milestoneId: z.string().optional(),
    capacity: z.union([z.literal(1), z.literal(3), z.literal(5), z.literal(8), z.literal(13)]).optional(),
  subtasks: z.array(z.object({
    id: z.string(),
    title: z.string(),
  })).optional(),
  status: z.enum(['todo', 'in_progress', 'done']),
  priority: z.enum(['low', 'medium', 'high']),
})

const sprintSchema = z.object({
  id: z.string(),
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.enum(['planned', 'active', 'completed']),
})

const milestoneSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  date: z.string(),
  requiredBusinessTaskIds: z.array(z.string()).optional(),
})

const projectImportSchema = z.object({
  businessTasks: z.array(businessTaskSchema),
  tasks: z.array(taskSchema),
  sprints: z.array(sprintSchema),
  milestones: z.array(milestoneSchema).optional(),
  expandedItems: z.array(z.string()).optional(),
})

export interface ProjectExportData {
  version: number
  exportedAt: string
  businessTasks: BusinessTask[]
  tasks: Task[]
  sprints: Sprint[]
  milestones: Milestone[]
  expandedItems: string[]
}

const normalizeMilestones = (
  milestones: Array<Omit<Milestone, 'requiredBusinessTaskIds'> & { requiredBusinessTaskIds?: string[] }>
): Milestone[] =>
  milestones.map((milestone) => ({
    ...milestone,
    requiredBusinessTaskIds: milestone.requiredBusinessTaskIds ?? [],
  }))

const normalizeSubtasks = (
  subtasks: Array<Omit<TaskSubtask, never>>
): TaskSubtask[] => subtasks.map((subtask) => ({ ...subtask }))

const normalizeTasks = (
  tasks: Array<Omit<Task, 'subtasks' | 'capacity'> & { subtasks?: TaskSubtask[]; capacity?: TaskCapacity }>
): Task[] =>
  tasks.map((task) => ({
    ...task,
    subtasks: normalizeSubtasks(task.subtasks ?? []),
    capacity: task.capacity ?? 1,
  }))

const buildProjectExportData = (state: Pick<ProjectStore, 'businessTasks' | 'tasks' | 'sprints' | 'milestones' | 'expandedItems'>): ProjectExportData => ({
  version: 1,
  exportedAt: new Date().toISOString(),
  businessTasks: state.businessTasks,
  tasks: normalizeTasks(state.tasks),
  sprints: state.sprints,
  milestones: normalizeMilestones(state.milestones),
  expandedItems: state.expandedItems,
})

const recomputeBusinessTaskSchedules = (
  businessTasks: BusinessTask[],
  tasks: Task[],
  sprints: Sprint[]
): BusinessTask[] => {
  return businessTasks.map((bt) => {
    const linkedTasks = tasks.filter((task) => task.businessTaskId === bt.id)
    const sprintIds = linkedTasks
      .map((task) => task.sprintId)
      .filter((sprintId): sprintId is string => sprintId !== undefined)
    const linkedSprints = sprints.filter((sprint) => sprintIds.includes(sprint.id))

    if (linkedSprints.length === 0) {
      return bt
    }

    const startDate = linkedSprints.reduce((earliest, sprint) =>
      sprint.startDate < earliest ? sprint.startDate : earliest
    , linkedSprints[0].startDate)

    const endDate = linkedSprints.reduce((latest, sprint) =>
      sprint.endDate > latest ? sprint.endDate : latest
    , linkedSprints[0].endDate)

    return {
      ...bt,
      startDate,
      endDate,
    }
  })
}

const normalizeImportedProject = (input: unknown) => {
  const parsed = projectImportSchema.parse(input)
  return {
    businessTasks: recomputeBusinessTaskSchedules(
      parsed.businessTasks,
      normalizeTasks(parsed.tasks),
      parsed.sprints
    ),
    tasks: normalizeTasks(parsed.tasks),
    sprints: parsed.sprints,
    milestones: normalizeMilestones(parsed.milestones ?? []),
    expandedItems: parsed.expandedItems ?? [],
  }
}

const createDemoData = (): {
  businessTasks: BusinessTask[]
  tasks: Task[]
  sprints: Sprint[]
  milestones: Milestone[]
} => {
  const bt1Id = 'demo-bt-auth'
  const bt2Id = 'demo-bt-dashboard'
  const sprint1Id = 'demo-sprint-1'
  const sprint2Id = 'demo-sprint-2'
  const milestone1Id = 'demo-ms-beta'
  const milestone2Id = 'demo-ms-release'

  return {
    businessTasks: [
      {
        id: bt1Id,
        title: 'User Authentication System',
        description: 'Implement complete auth flow with OAuth and email verification',
        startDate: '2026-04-20',
        endDate: '2026-05-17',
        color: 'blue',
        dependencies: [],
        status: 'in_progress',
      },
      {
        id: bt2Id,
        title: 'Dashboard Analytics',
        description: 'Build analytics dashboard with charts and metrics',
        startDate: '2026-05-04',
        endDate: '2026-05-17',
        manualEndDate: '2026-05-17',
        color: 'green',
        dependencies: [bt1Id],
        status: 'not_started',
      },
    ],
    sprints: [
      {
        id: sprint1Id,
        name: 'Sprint 1',
        startDate: '2026-04-20',
        endDate: '2026-05-03',
        status: 'active',
      },
      {
        id: sprint2Id,
        name: 'Sprint 2',
        startDate: '2026-05-04',
        endDate: '2026-05-17',
        status: 'planned',
      },
    ],
    milestones: [
      {
        id: milestone1Id,
        title: 'Private Beta',
        description: 'First external validation checkpoint',
        date: '2026-05-06',
        requiredBusinessTaskIds: [bt1Id],
      },
      {
        id: milestone2Id,
        title: 'Release Candidate',
        description: 'Feature complete release gate',
        date: '2026-05-18',
        requiredBusinessTaskIds: [bt1Id, bt2Id],
      },
    ],
    tasks: [
      {
        id: 'demo-task-oauth',
        title: 'Setup OAuth providers',
        description: 'Configure Google and GitHub OAuth',
        businessTaskId: bt1Id,
        sprintId: sprint1Id,
        milestoneId: milestone1Id,
        capacity: 3,
        subtasks: [
          { id: 'demo-task-oauth-frontend', title: 'Frontend OAuth buttons' },
          { id: 'demo-task-oauth-backend', title: 'Backend OAuth callbacks' },
        ],
        status: 'done',
        priority: 'high',
      },
      {
        id: 'demo-task-email',
        title: 'Email verification flow',
        description: 'Implement email verification with tokens',
        businessTaskId: bt1Id,
        sprintId: sprint1Id,
        capacity: 5,
        subtasks: [],
        status: 'in_progress',
        priority: 'high',
      },
      {
        id: 'demo-task-password-reset',
        title: 'Password reset functionality',
        description: 'Add forgot password feature',
        businessTaskId: bt1Id,
        sprintId: sprint2Id,
        milestoneId: milestone2Id,
        capacity: 3,
        subtasks: [],
        status: 'todo',
        priority: 'medium',
      },
      {
        id: 'demo-task-chart-components',
        title: 'Design chart components',
        description: 'Create reusable chart components',
        businessTaskId: bt2Id,
        sprintId: sprint2Id,
        milestoneId: milestone2Id,
        capacity: 8,
        subtasks: [],
        status: 'todo',
        priority: 'medium',
      },
      {
        id: 'demo-task-metrics-api',
        title: 'Metrics API integration',
        businessTaskId: bt2Id,
        capacity: 2,
        subtasks: [],
        status: 'todo',
        priority: 'low',
      },
    ],
  }
}

interface ProjectStore {
  businessTasks: BusinessTask[]
  tasks: Task[]
  sprints: Sprint[]
  milestones: Milestone[]

  selectedItemId: string | null
  selectedItemType: GanttItemType | null
  viewScale: ViewScale
  expandedItems: string[]
  hasHydrated: boolean

  addBusinessTask: (task: Omit<BusinessTask, 'id'>) => string
  updateBusinessTask: (id: string, updates: Partial<BusinessTask>) => void
  deleteBusinessTask: (id: string) => void

  addTask: (task: Omit<Task, 'id'>) => string
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void

  addSprint: (sprint: Omit<Sprint, 'id'>) => string
  updateSprint: (id: string, updates: Partial<Sprint>) => void
  deleteSprint: (id: string) => void

  addMilestone: (milestone: Omit<Milestone, 'id'>) => string
  updateMilestone: (id: string, updates: Partial<Milestone>) => void
  deleteMilestone: (id: string) => void

  setSelectedItem: (id: string | null, type: GanttItemType | null) => void
  setViewScale: (scale: ViewScale) => void
  toggleExpanded: (id: string) => void
  setHasHydrated: (value: boolean) => void

  clearAll: () => void
  exportProjectData: () => ProjectExportData
  importProjectData: (data: unknown) => void

  getBusinessTaskComputedStartDate: (id: string) => string
  getBusinessTaskComputedEndDate: (id: string) => string
  getTasksForBusinessTask: (businessTaskId: string) => Task[]
  getTasksForSprint: (sprintId: string) => Task[]
  getTasksForMilestone: (milestoneId: string) => Task[]
  getSprintCapacity: (sprintId: string) => number
  getSprintsForBusinessTask: (businessTaskId: string) => Sprint[]
  hasUnscheduledTasksForBusinessTask: (businessTaskId: string) => boolean
  isMilestoneAtRisk: (milestoneId: string) => boolean
  updateBusinessTaskSchedule: (businessTaskId: string) => void
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      ...{
        ...createDemoData(),
        milestones: normalizeMilestones(createDemoData().milestones),
      },

      selectedItemId: null,
      selectedItemType: null,
      viewScale: 'week',
      expandedItems: [],
      hasHydrated: false,

      addBusinessTask: (task) => {
        const id = generateId()
        set((state) => ({
          businessTasks: [...state.businessTasks, { ...task, id }],
        }))
        return id
      },

      updateBusinessTask: (id, updates) => {
        set((state) => ({
          businessTasks: state.businessTasks.map((bt) =>
            bt.id === id ? { ...bt, ...updates } : bt
          ),
        }))
      },

      deleteBusinessTask: (id) => {
        set((state) => ({
          businessTasks: state.businessTasks
            .filter((bt) => bt.id !== id)
            .map((bt) => ({
              ...bt,
              dependencies: bt.dependencies.filter((depId) => depId !== id),
            })),
          milestones: state.milestones.map((milestone) => ({
            ...milestone,
            requiredBusinessTaskIds: (milestone.requiredBusinessTaskIds ?? []).filter((btId) => btId !== id),
          })),
          tasks: state.tasks.filter((t) => t.businessTaskId !== id),
        }))
      },

      addTask: (task) => {
        const id = generateId()
        set((state) => ({
          tasks: [...state.tasks, { ...task, subtasks: task.subtasks ?? [], capacity: task.capacity ?? 1, id }],
        }))
        get().updateBusinessTaskSchedule(task.businessTaskId)
        return id
      },

      updateTask: (id, updates) => {
        const oldTask = get().tasks.find((t) => t.id === id)
        const hasSprintIdUpdate = Object.prototype.hasOwnProperty.call(updates, 'sprintId')
        const hasBusinessTaskIdUpdate = Object.prototype.hasOwnProperty.call(updates, 'businessTaskId')

        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }))

        if (oldTask && hasSprintIdUpdate) {
          get().updateBusinessTaskSchedule(oldTask.businessTaskId)
        }

        if (
          hasBusinessTaskIdUpdate &&
          updates.businessTaskId &&
          updates.businessTaskId !== oldTask?.businessTaskId
        ) {
          get().updateBusinessTaskSchedule(updates.businessTaskId)
          if (oldTask) {
            get().updateBusinessTaskSchedule(oldTask.businessTaskId)
          }
        }
      },

      deleteTask: (id) => {
        const task = get().tasks.find((t) => t.id === id)
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        }))
        if (task) {
          get().updateBusinessTaskSchedule(task.businessTaskId)
        }
      },

      addSprint: (sprint) => {
        const id = generateId()
        set((state) => ({
          sprints: [...state.sprints, { ...sprint, id }],
        }))
        return id
      },

      updateSprint: (id, updates) => {
        set((state) => ({
          sprints: state.sprints.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        }))
        const tasksInSprint = get().tasks.filter((t) => t.sprintId === id)
        const affectedBusinessTasks = new Set(tasksInSprint.map((t) => t.businessTaskId))
        affectedBusinessTasks.forEach((btId) => {
          get().updateBusinessTaskSchedule(btId)
        })
      },

      deleteSprint: (id) => {
        const tasksInSprint = get().tasks.filter((t) => t.sprintId === id)
        const affectedBusinessTasks = new Set(tasksInSprint.map((t) => t.businessTaskId))

        set((state) => ({
          sprints: state.sprints.filter((s) => s.id !== id),
          tasks: state.tasks.map((t) =>
            t.sprintId === id ? { ...t, sprintId: undefined } : t
          ),
        }))

        affectedBusinessTasks.forEach((btId) => {
          get().updateBusinessTaskSchedule(btId)
        })
      },

      addMilestone: (milestone) => {
        const id = generateId()
        set((state) => ({
          milestones: [...state.milestones, { ...milestone, id }],
        }))
        return id
      },

      updateMilestone: (id, updates) => {
        set((state) => ({
          milestones: state.milestones.map((milestone) =>
            milestone.id === id ? { ...milestone, ...updates } : milestone
          ),
        }))
      },

      deleteMilestone: (id) => {
        set((state) => ({
          milestones: state.milestones.filter((milestone) => milestone.id !== id),
          tasks: state.tasks.map((task) =>
            task.milestoneId === id ? { ...task, milestoneId: undefined } : task
          ),
        }))
      },

      setSelectedItem: (id, type) => {
        set({ selectedItemId: id, selectedItemType: type })
      },

      setViewScale: (scale) => {
        set({ viewScale: scale })
      },

      toggleExpanded: (id) => {
        set((state) => ({
          expandedItems: state.expandedItems.includes(id)
            ? state.expandedItems.filter((itemId) => itemId !== id)
            : [...state.expandedItems, id],
        }))
      },

      setHasHydrated: (value) => {
        set({ hasHydrated: value })
      },

      clearAll: () => {
        set({
          ...createDemoData(),
          selectedItemId: null,
          selectedItemType: null,
          viewScale: 'week',
          expandedItems: [],
          hasHydrated: true,
        })
      },

      exportProjectData: () => {
        const state = get()
        return buildProjectExportData(state)
      },

      importProjectData: (data) => {
        const projectData = normalizeImportedProject(data)
        set({
          ...projectData,
          selectedItemId: null,
          selectedItemType: null,
          hasHydrated: true,
        })
      },

      getBusinessTaskComputedStartDate: (id) => {
        const state = get()
        const bt = state.businessTasks.find((b) => b.id === id)
        if (!bt) return new Date().toISOString().split('T')[0]

        const linkedTasks = state.tasks.filter((t) => t.businessTaskId === id)
        const sprintIds = linkedTasks
          .map((t) => t.sprintId)
          .filter((sprintId): sprintId is string => sprintId !== undefined)

        const linkedSprints = state.sprints.filter((s) => sprintIds.includes(s.id))

        if (linkedSprints.length === 0) {
          return bt.startDate
        }

        return linkedSprints.reduce((earliest, sprint) => {
          return sprint.startDate < earliest ? sprint.startDate : earliest
        }, linkedSprints[0].startDate)
      },

      getBusinessTaskComputedEndDate: (id) => {
        const state = get()
        const bt = state.businessTasks.find((b) => b.id === id)
        if (!bt) return new Date().toISOString().split('T')[0]

        const linkedTasks = state.tasks.filter((t) => t.businessTaskId === id)
        const sprintIds = linkedTasks
          .map((t) => t.sprintId)
          .filter((sprintId): sprintId is string => sprintId !== undefined)

        const linkedSprints = state.sprints.filter((s) => sprintIds.includes(s.id))

        if (linkedSprints.length === 0) {
          return bt.manualEndDate || bt.endDate
        }

        return linkedSprints.reduce((latest, sprint) => {
          return sprint.endDate > latest ? sprint.endDate : latest
        }, linkedSprints[0].endDate)
      },

      getTasksForBusinessTask: (businessTaskId) => {
        return get().tasks.filter((t) => t.businessTaskId === businessTaskId)
      },

      getTasksForSprint: (sprintId) => {
        return get().tasks.filter((t) => t.sprintId === sprintId)
      },

      getTasksForMilestone: (milestoneId) => {
        return get().tasks.filter((t) => t.milestoneId === milestoneId)
      },

      getSprintCapacity: (sprintId) => {
        return get().tasks
          .filter((task) => task.sprintId === sprintId)
          .reduce((sum, task) => sum + task.capacity, 0)
      },

      getSprintsForBusinessTask: (businessTaskId) => {
        const state = get()
        const linkedTasks = state.tasks.filter((t) => t.businessTaskId === businessTaskId)
        const sprintIds = new Set(
          linkedTasks.map((t) => t.sprintId).filter((sprintId): sprintId is string => sprintId !== undefined)
        )
        return state.sprints.filter((s) => sprintIds.has(s.id))
      },

      hasUnscheduledTasksForBusinessTask: (businessTaskId) => {
        return get().tasks.some(
          (task) => task.businessTaskId === businessTaskId && !task.sprintId
        )
      },

      isMilestoneAtRisk: (milestoneId) => {
        const state = get()
        const milestone = state.milestones.find((item) => item.id === milestoneId)
        if (!milestone) return false

        const requiredBusinessTaskIds = milestone.requiredBusinessTaskIds ?? []
        if (requiredBusinessTaskIds.length === 0) return false

        return requiredBusinessTaskIds.some((businessTaskId) => {
          const businessTask = state.businessTasks.find((item) => item.id === businessTaskId)
          return businessTask ? businessTask.endDate > milestone.date : false
        })
      },

      updateBusinessTaskSchedule: (businessTaskId) => {
        const newStartDate = get().getBusinessTaskComputedStartDate(businessTaskId)
        const newEndDate = get().getBusinessTaskComputedEndDate(businessTaskId)
        const bt = get().businessTasks.find((b) => b.id === businessTaskId)

        if (bt && (bt.startDate !== newStartDate || bt.endDate !== newEndDate)) {
          set((state) => ({
            businessTasks: state.businessTasks.map((b) =>
              b.id === businessTaskId ? { ...b, startDate: newStartDate, endDate: newEndDate } : b
            ),
          }))
        }
      },
    }),
    {
      name: 'project-management-storage',
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
      partialize: (state) => ({
        businessTasks: state.businessTasks,
        tasks: state.tasks,
        sprints: state.sprints,
        milestones: state.milestones,
        expandedItems: state.expandedItems,
      }),
    }
  )
)
