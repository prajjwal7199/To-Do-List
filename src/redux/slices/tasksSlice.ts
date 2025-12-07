import { createSlice, PayloadAction, nanoid } from '@reduxjs/toolkit'
import type { Task, TasksState, Subtask } from '../../types'

const initialState: TasksState = { items: [] }

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    addTask: {
      reducer(state, action: PayloadAction<Task>) {
        state.items.push(action.payload)
      },
      prepare(payload: { title: string; description?: string; date?: string; backlog?: boolean }) {
        return {
          payload: {
            id: nanoid(),
            title: payload.title,
            description: payload.description || '',
            completed: false,
            subtasks: [],
            dependsOn: undefined,
            availableAt: undefined,
            reminderAt: undefined,
            backlog: !!payload.backlog,
            date: payload.date,
            createdAt: new Date().toISOString()
          } as Task
        }
      }
    },
    editTask(state, action: PayloadAction<{ id: string; changes: Partial<Task> }>) {
      const t = state.items.find((x) => x.id === action.payload.id)
      if (t) Object.assign(t, action.payload.changes)
    },
    deleteTask(state, action: PayloadAction<string>) {
      state.items = state.items.filter((x) => x.id !== action.payload)
    },
    toggleComplete(state, action: PayloadAction<string>) {
      const t = state.items.find((x) => x.id === action.payload)
      if (t) {
        const newVal = !t.completed
        t.completed = newVal
        // if subtasks exist, toggle them to match parent
        if (t.subtasks && t.subtasks.length > 0) {
          for (const s of t.subtasks) s.completed = newVal
        }

        // update dependent tasks: tasks that depend on this task
        for (const dep of state.items.filter((x) => x.dependsOn && x.dependsOn.taskId === t.id)) {
          if (newVal) {
            // parent completed: set availableAt to now + delaySeconds
            const delay = dep.dependsOn?.delaySeconds || 0
            const at = new Date(Date.now() + (delay || 0) * 1000).toISOString()
            dep.availableAt = at
          } else {
            // parent became incomplete: clear availability and mark dependent incomplete
            dep.availableAt = undefined
            dep.completed = false
          }
        }
      }
    },
    assignDate(state, action: PayloadAction<{ id: string; date?: string }>) {
      const t = state.items.find((x) => x.id === action.payload.id)
      if (t) {
        t.date = action.payload.date
        // if assigning a date, clear backlog flag
        if (action.payload.date) t.backlog = false
      }
    }
    ,
    // Copy tasks from the bucket (tasks with no date) into a given date.
    // Avoid creating duplicate tasks for the same title+date.
    copyBucketToDate(state, action: PayloadAction<{ date: string }>) {
      const { date } = action.payload
  // bucket tasks are those without a date and not marked as backlog
  const bucket = state.items.filter((t) => !t.date && !t.backlog)
      for (const b of bucket) {
        const exists = state.items.some((t) => t.date === date && t.title === b.title)
        if (!exists) {
          state.items.push({
            id: nanoid(),
            title: b.title,
            description: b.description,
            completed: false,
            subtasks: b.subtasks ? b.subtasks.map((s) => ({ ...s, id: nanoid(), completed: false })) : [],
            date,
            createdAt: new Date().toISOString()
          })
        }
      }
    },
    // Bulk add tasks (useful for copies)
    bulkAdd(state, action: PayloadAction<Task[]>) {
      state.items.push(...action.payload)
    }
    ,
    // Copy a single task (by id) into a given date without removing the original task.
    copyTaskToDate(state, action: PayloadAction<{ id: string; date: string }>) {
      const { id, date } = action.payload
      const src = state.items.find((t) => t.id === id)
      if (!src) return
      const exists = state.items.some((t) => t.date === date && t.title === src.title)
      if (exists) return
      state.items.push({
        id: nanoid(),
        title: src.title,
        description: src.description,
        completed: false,
        subtasks: src.subtasks ? src.subtasks.map((s) => ({ ...s, id: nanoid(), completed: false })) : [],
        // do NOT copy dependsOn reference across copies (would point to old ids)
        dependsOn: undefined,
        availableAt: undefined,
        date,
        createdAt: new Date().toISOString()
      })
    }
    ,
    addSubtask(state, action: PayloadAction<{ taskId: string; title: string }>) {
      const { taskId, title } = action.payload
      const t = state.items.find((x) => x.id === taskId)
      if (!t) return
      const s: Subtask = { id: nanoid(), title, completed: false, createdAt: new Date().toISOString() }
      if (!t.subtasks) t.subtasks = []
      t.subtasks.push(s)
      // adding a subtask should mark parent incomplete
      t.completed = false
    },
    toggleSubtask(state, action: PayloadAction<{ taskId: string; subtaskId: string }>) {
      const { taskId, subtaskId } = action.payload
      const t = state.items.find((x) => x.id === taskId)
      if (!t || !t.subtasks) return
      const s = t.subtasks.find((x) => x.id === subtaskId)
      if (!s) return
      s.completed = !s.completed
      // if all subtasks completed, mark parent complete
      const all = t.subtasks.length > 0 && t.subtasks.every((x) => x.completed)
      t.completed = all
    },
    deleteSubtask(state, action: PayloadAction<{ taskId: string; subtaskId: string }>) {
      const { taskId, subtaskId } = action.payload
      const t = state.items.find((x) => x.id === taskId)
      if (!t || !t.subtasks) return
      t.subtasks = t.subtasks.filter((x) => x.id !== subtaskId)
      // if no subtasks left, leave parent completed as-is
    },
    editSubtask(state, action: PayloadAction<{ taskId: string; subtaskId: string; title: string }>) {
      const { taskId, subtaskId, title } = action.payload
      const t = state.items.find((x) => x.id === taskId)
      if (!t || !t.subtasks) return
      const s = t.subtasks.find((x) => x.id === subtaskId)
      if (!s) return
      s.title = title
    }
    ,
    setDependency(state, action: PayloadAction<{ id: string; dependsOn: { taskId: string; delaySeconds?: number } }>) {
      const { id, dependsOn } = action.payload
      const t = state.items.find((x) => x.id === id)
      if (!t) return
      t.dependsOn = dependsOn
      // reset availability until parent completed
      t.availableAt = undefined
      t.completed = false
    },
    // mark a task as available (clear its availableAt) without removing the dependency
    unlockTask(state, action: PayloadAction<string>) {
      const id = action.payload
      const t = state.items.find((x) => x.id === id)
      if (!t) return
      t.availableAt = undefined
    },
    clearDependency(state, action: PayloadAction<string>) {
      const id = action.payload
      const t = state.items.find((x) => x.id === id)
      if (!t) return
      t.dependsOn = undefined
      t.availableAt = undefined
    }
    ,
    // set or clear a reminder timestamp for a task
    setReminder(state, action: PayloadAction<{ id: string; reminderAt?: string }>) {
      const { id, reminderAt } = action.payload
      const t = state.items.find((x) => x.id === id)
      if (!t) return
      t.reminderAt = reminderAt
    },
    clearReminder(state, action: PayloadAction<string>) {
      const id = action.payload
      const t = state.items.find((x) => x.id === id)
      if (!t) return
      t.reminderAt = undefined
    }
  }
})

export const {
  addTask,
  editTask,
  deleteTask,
  toggleComplete,
  assignDate,
  copyBucketToDate,
  bulkAdd,
  copyTaskToDate,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
  editSubtask,
  setDependency,
  clearDependency,
  unlockTask
  ,
  setReminder,
  clearReminder
} = tasksSlice.actions

export default tasksSlice.reducer
