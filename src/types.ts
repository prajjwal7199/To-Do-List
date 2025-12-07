export interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  subtasks?: Subtask[]
  // dependency: this task will be enabled only after dependsOn.taskId completes
  dependsOn?: {
    taskId: string
    // delay in seconds after the dependency completes before this task becomes available
    delaySeconds?: number
  }
  // ISO timestamp when this task becomes available (enabled)
  availableAt?: string
  // Optional reminder timestamp (ISO) to notify the user
  reminderAt?: string
  // mark task as backlog (long-term, not part of daily bucket rollover)
  backlog?: boolean
  date?: string // ISO date (yyyy-mm-dd)
  createdAt: string
}

export interface Subtask {
  id: string
  title: string
  completed: boolean
  createdAt: string
}

export interface TasksState {
  items: Task[]
}

export interface ProductivitySettings {
  dailyGoal?: number // number of tasks considered goal
  thresholds: {
    red: number
    orange: number
    yellow: number
    green: number
  }
}
