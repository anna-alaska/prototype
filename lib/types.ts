// Business Task - displayed on Gantt chart with dates
export interface BusinessTask {
  id: string
  title: string
  description?: string
  startDate: string // ISO date string
  endDate: string // ISO date string - auto-calculated from sprints or manual
  manualEndDate?: string // Manual end date if no sprints
  color: string
  dependencies: string[] // IDs of tasks this depends on (Finish-to-Start)
  status: 'not_started' | 'in_progress' | 'completed'
}

// Task - linked to business task, no dates required
export interface TaskSubtask {
  id: string
  title: string
}

export type TaskCapacity = 1 | 3 | 5 | 8 | 13

export interface Task {
  id: string
  title: string
  description?: string
  businessTaskId: string // Link to business task
  sprintId?: string // Optional link to sprint
  milestoneId?: string // Optional soft link to milestone
  subtasks: TaskSubtask[] // Split parts like frontend/backend; not shown on Gantt
  capacity: TaskCapacity
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
}

// Sprint - has start and end date
export interface Sprint {
  id: string
  name: string
  startDate: string // ISO date string
  endDate: string // ISO date string
  status: 'planned' | 'active' | 'completed'
}

// Milestone - point in time with soft task links
export interface Milestone {
  id: string
  title: string
  description?: string
  date: string // ISO date string
  requiredBusinessTaskIds: string[] // Business tasks that should be completed before this milestone
}

// View scale for Gantt chart
export type ViewScale = 'day' | 'week' | 'month'

// Gantt row item type
export type GanttItemType = 'business-task' | 'sprint' | 'task' | 'milestone'

export interface GanttRow {
  id: string
  type: GanttItemType
  title: string
  startDate?: string
  endDate?: string
  color?: string
  parentId?: string
  level: number
  isExpanded?: boolean
}

// Store state
export interface ProjectState {
  businessTasks: BusinessTask[]
  tasks: Task[]
  sprints: Sprint[]
  milestones: Milestone[]
  selectedItemId: string | null
  selectedItemType: GanttItemType | null
  viewScale: ViewScale
  expandedItems: Set<string>
}

// Status labels
export const businessTaskStatusLabels: Record<BusinessTask['status'], string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed'
}

export const taskStatusLabels: Record<Task['status'], string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done'
}

export const sprintStatusLabels: Record<Sprint['status'], string> = {
  planned: 'Planned',
  active: 'Active',
  completed: 'Completed'
}

export const priorityLabels: Record<Task['priority'], string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High'
}

export const taskCapacityOptions: TaskCapacity[] = [1, 3, 5, 8, 13]

// Colors for business tasks
export const businessTaskColors = [
  { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { value: 'green', label: 'Green', class: 'bg-emerald-500' },
  { value: 'purple', label: 'Purple', class: 'bg-violet-500' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
  { value: 'pink', label: 'Pink', class: 'bg-pink-500' },
  { value: 'cyan', label: 'Cyan', class: 'bg-cyan-500' },
]
