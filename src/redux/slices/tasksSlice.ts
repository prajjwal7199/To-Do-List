import { createSlice, PayloadAction, nanoid } from "@reduxjs/toolkit";
import type {
  Task,
  TasksState,
  Subtask,
  Category,
  Attachment,
  RecurringPattern,
} from "../../types";

const initialState: TasksState = {
  items: [],
  categories: [
    { id: "1", name: "Work", color: "#3b82f6" },
    { id: "2", name: "Personal", color: "#10b981" },
    { id: "3", name: "Health", color: "#ef4444" },
    { id: "4", name: "Learning", color: "#8b5cf6" },
  ],
  templates: [],
  analytics: {
    completionHistory: [],
    streaks: { current: 0, longest: 0 },
    timeTracking: {
      totalMinutes: 0,
      byCategory: {},
      byDate: {},
    },
  },
  settings: {
    theme: "dark",
    soundEnabled: true,
    confettiEnabled: true,
    emailNotifications: false,
    weeklyDigest: false,
  },
};

const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    // Replace all tasks (used when loading from Firestore)
    // Coerce incoming payload into an array to guard against remote data
    // being an object keyed by id (older formats or accidental writes).
    setAll(state, action: PayloadAction<any>) {
      const payload = action.payload;
      if (!payload) {
        state.items = [];
        return;
      }
      if (Array.isArray(payload)) {
        state.items = payload;
        return;
      }
      if (Array.isArray(payload.items)) {
        state.items = payload.items;
        if (payload.categories) state.categories = payload.categories;
        if (payload.templates) state.templates = payload.templates;
        if (payload.analytics) state.analytics = payload.analytics;
        if (payload.settings) state.settings = payload.settings;
        return;
      }
      // fallback: treat as object map and use values
      try {
        state.items = Object.values(payload) as Task[];
      } catch (e) {
        state.items = [];
      }
    },
    addTask: {
      reducer(state, action: PayloadAction<Task>) {
        state.items.push(action.payload);
      },
      prepare(payload: {
        title: string;
        description?: string;
        date?: string;
        backlog?: boolean;
        category?: string;
        priority?: "high" | "medium" | "low";
        tags?: string[];
        recurring?: RecurringPattern;
        estimatedDuration?: number;
        urgent?: boolean;
        important?: boolean;
        isTemplate?: boolean;
        templateName?: string;
      }) {
        return {
          payload: {
            id: nanoid(),
            title: payload.title,
            description: payload.description || "",
            completed: false,
            subtasks: [],
            dependsOn: undefined,
            availableAt: undefined,
            reminderAt: undefined,
            backlog: !!payload.backlog,
            date: payload.date,
            createdAt: new Date().toISOString(),
            category: payload.category,
            priority: payload.priority || "medium",
            tags: payload.tags || [],
            recurring: payload.recurring,
            estimatedDuration: payload.estimatedDuration,
            actualDuration: 0,
            pomodoroCount: 0,
            notes: "",
            attachments: [],
            urgent: payload.urgent,
            important: payload.important,
            isTemplate: payload.isTemplate,
            templateName: payload.templateName,
            order: Date.now(),
          } as Task,
        };
      },
    },
    editTask(
      state,
      action: PayloadAction<{ id: string; changes: Partial<Task> }>,
    ) {
      const t = state.items.find((x) => x.id === action.payload.id);
      if (t) Object.assign(t, action.payload.changes);
    },
    deleteTask(state, action: PayloadAction<string>) {
      const id = action.payload;
      const toDelete = state.items.find((x) => x.id === id);
      // If this is a copied task from a bucket (has originId) mark that origin as excluded for this date
      if (toDelete && toDelete.originId && toDelete.date) {
        const origin = state.items.find((x) => x.id === toDelete.originId);
        if (origin) {
          if (!origin.excludedDates) origin.excludedDates = [];
          if (!origin.excludedDates.includes(toDelete.date))
            origin.excludedDates.push(toDelete.date);
        }
      }
      state.items = state.items.filter((x) => x.id !== id);
    },
    toggleComplete(state, action: PayloadAction<string>) {
      const t = state.items.find((x) => x.id === action.payload);
      if (t) {
        const newVal = !t.completed;
        t.completed = newVal;
        // if subtasks exist, toggle them to match parent
        if (t.subtasks && t.subtasks.length > 0) {
          for (const s of t.subtasks) s.completed = newVal;
        }

        //Record analytics when completing
        if (newVal) {
          const today = new Date().toISOString().split("T")[0];
          let record = state.analytics.completionHistory.find(
            (r) => r.date === today,
          );
          if (!record) {
            record = { date: today, completed: 0, total: 0, categories: {} };
            state.analytics.completionHistory.push(record);
          }
          record.completed += 1;

          if (t.category) {
            record.categories[t.category] =
              (record.categories[t.category] || 0) + 1;
          }

          //Update streak
          const yesterday = new Date(Date.now() - 86400000)
            .toISOString()
            .split("T")[0];
          if (
            state.analytics.streaks.lastCompletionDate === yesterday ||
            !state.analytics.streaks.lastCompletionDate
          ) {
            state.analytics.streaks.current += 1;
            if (
              state.analytics.streaks.current > state.analytics.streaks.longest
            ) {
              state.analytics.streaks.longest = state.analytics.streaks.current;
            }
          } else if (state.analytics.streaks.lastCompletionDate !== today) {
            state.analytics.streaks.current = 1;
          }
          state.analytics.streaks.lastCompletionDate = today;
        }

        // update dependent tasks: tasks that depend on this task
        for (const dep of state.items.filter(
          (x) => x.dependsOn && x.dependsOn.taskId === t.id,
        )) {
          if (newVal) {
            // parent completed: set availableAt to now + delaySeconds
            const delay = dep.dependsOn?.delaySeconds || 0;
            const at = new Date(Date.now() + (delay || 0) * 1000).toISOString();
            dep.availableAt = at;
          } else {
            // parent became incomplete: clear availability and mark dependent incomplete
            dep.availableAt = undefined;
            dep.completed = false;
          }
        }
      }
    },
    assignDate(state, action: PayloadAction<{ id: string; date?: string }>) {
      const t = state.items.find((x) => x.id === action.payload.id);
      if (t) {
        t.date = action.payload.date;
        // if assigning a date, clear backlog flag
        if (action.payload.date) t.backlog = false;
      }
    },
    // Copy tasks from the bucket (tasks with no date) into a given date.
    // Avoid creating duplicate tasks for the same title+date.
    copyBucketToDate(state, action: PayloadAction<{ date: string }>) {
      const { date } = action.payload;
      // bucket tasks are those without a date and not marked as backlog
      const bucket = state.items.filter((t) => !t.date && !t.backlog);
      for (const b of bucket) {
        // skip if this bucket task has an explicit exclusion for this date
        if (b.excludedDates && b.excludedDates.includes(date)) continue;
        // avoid creating duplicate tasks for the same date/title or if an existing copy of this origin exists
        const exists = state.items.some(
          (t) =>
            t.date === date && (t.title === b.title || t.originId === b.id),
        );
        if (!exists) {
          state.items.push({
            id: nanoid(),
            title: b.title,
            description: b.description,
            completed: false,
            subtasks: b.subtasks
              ? b.subtasks.map((s) => ({
                  ...s,
                  id: nanoid(),
                  completed: false,
                }))
              : [],
            date,
            createdAt: new Date().toISOString(),
            originId: b.id,
          });
        }
      }
    },
    // Bulk add tasks (useful for copies)
    bulkAdd(state, action: PayloadAction<Task[]>) {
      state.items.push(...action.payload);
    },
    // Copy a single task (by id) into a given date without removing the original task.
    copyTaskToDate(state, action: PayloadAction<{ id: string; date: string }>) {
      const { id, date } = action.payload;
      const src = state.items.find((t) => t.id === id);
      if (!src) return;
      const exists = state.items.some(
        (t) => t.date === date && t.title === src.title,
      );
      if (exists) return;
      state.items.push({
        id: nanoid(),
        title: src.title,
        description: src.description,
        completed: false,
        subtasks: src.subtasks
          ? src.subtasks.map((s) => ({ ...s, id: nanoid(), completed: false }))
          : [],
        // do NOT copy dependsOn reference across copies (would point to old ids)
        dependsOn: undefined,
        availableAt: undefined,
        date,
        createdAt: new Date().toISOString(),
      });
    },
    addSubtask(
      state,
      action: PayloadAction<{ taskId: string; title: string }>,
    ) {
      const { taskId, title } = action.payload;
      const t = state.items.find((x) => x.id === taskId);
      if (!t) return;
      const s: Subtask = {
        id: nanoid(),
        title,
        completed: false,
        createdAt: new Date().toISOString(),
      };
      if (!t.subtasks) t.subtasks = [];
      t.subtasks.push(s);
      // adding a subtask should mark parent incomplete
      t.completed = false;
    },
    toggleSubtask(
      state,
      action: PayloadAction<{ taskId: string; subtaskId: string }>,
    ) {
      const { taskId, subtaskId } = action.payload;
      const t = state.items.find((x) => x.id === taskId);
      if (!t || !t.subtasks) return;
      const s = t.subtasks.find((x) => x.id === subtaskId);
      if (!s) return;
      s.completed = !s.completed;
      // if all subtasks completed, mark parent complete
      const all = t.subtasks.length > 0 && t.subtasks.every((x) => x.completed);
      t.completed = all;
    },
    deleteSubtask(
      state,
      action: PayloadAction<{ taskId: string; subtaskId: string }>,
    ) {
      const { taskId, subtaskId } = action.payload;
      const t = state.items.find((x) => x.id === taskId);
      if (!t || !t.subtasks) return;
      t.subtasks = t.subtasks.filter((x) => x.id !== subtaskId);
      // if no subtasks left, leave parent completed as-is
    },
    editSubtask(
      state,
      action: PayloadAction<{
        taskId: string;
        subtaskId: string;
        title: string;
      }>,
    ) {
      const { taskId, subtaskId, title } = action.payload;
      const t = state.items.find((x) => x.id === taskId);
      if (!t || !t.subtasks) return;
      const s = t.subtasks.find((x) => x.id === subtaskId);
      if (!s) return;
      s.title = title;
    },
    setDependency(
      state,
      action: PayloadAction<{
        id: string;
        dependsOn: { taskId: string; delaySeconds?: number };
      }>,
    ) {
      const { id, dependsOn } = action.payload;
      const t = state.items.find((x) => x.id === id);
      if (!t) return;
      t.dependsOn = dependsOn;
      // reset availability until parent completed
      t.availableAt = undefined;
      t.completed = false;
    },
    // mark a task as available (clear its availableAt) without removing the dependency
    unlockTask(state, action: PayloadAction<string>) {
      const id = action.payload;
      const t = state.items.find((x) => x.id === id);
      if (!t) return;
      t.availableAt = undefined;
    },
    clearDependency(state, action: PayloadAction<string>) {
      const id = action.payload;
      const t = state.items.find((x) => x.id === id);
      if (!t) return;
      t.dependsOn = undefined;
      t.availableAt = undefined;
    },
    // set or clear a reminder timestamp for a task
    setReminder(
      state,
      action: PayloadAction<{ id: string; reminderAt?: string }>,
    ) {
      const { id, reminderAt } = action.payload;
      const t = state.items.find((x) => x.id === id);
      if (!t) return;
      t.reminderAt = reminderAt;
    },
    clearReminder(state, action: PayloadAction<string>) {
      const id = action.payload;
      const t = state.items.find((x) => x.id === id);
      if (!t) return;
      t.reminderAt = undefined;
    },
    // Categories
    addCategory(state, action: PayloadAction<{ name: string; color: string }>) {
      state.categories.push({
        id: nanoid(),
        ...action.payload,
      });
    },
    editCategory(
      state,
      action: PayloadAction<{ id: string; name?: string; color?: string }>,
    ) {
      const c = state.categories.find((x) => x.id === action.payload.id);
      if (c) {
        if (action.payload.name) c.name = action.payload.name;
        if (action.payload.color) c.color = action.payload.color;
      }
    },
    deleteCategory(state, action: PayloadAction<string>) {
      state.categories = state.categories.filter(
        (x) => x.id !== action.payload,
      );
      //Remove category from all tasks
      state.items.forEach((t) => {
        if (t.category === action.payload) {
          t.category = undefined;
        }
      });
    },
    //Templates
    saveAsTemplate(
      state,
      action: PayloadAction<{ id: string; templateName: string }>,
    ) {
      const t = state.items.find((x) => x.id === action.payload.id);
      if (!t) return;
      const template = {
        ...t,
        id: nanoid(),
        isTemplate: true,
        templateName: action.payload.templateName,
        completed: false,
        date: undefined,
        backlog: false,
      };
      state.templates.push(template);
    },
    deleteTemplate(state, action: PayloadAction<string>) {
      state.templates = state.templates.filter((x) => x.id !== action.payload);
    },
    // Duplicate task
    duplicateTask(state, action: PayloadAction<string>) {
      const task = state.items.find((x) => x.id === action.payload);
      if (!task) return;
      const duplicate: Task = {
        ...task,
        id: nanoid(),
        title: task.title + " (Copy)",
        completed: false,
        createdAt: new Date().toISOString(),
        subtasks: task.subtasks
          ? task.subtasks.map((s) => ({ ...s, id: nanoid(), completed: false }))
          : [],
      };
      state.items.push(duplicate);
    },
    // Bulk actions
    bulkDelete(state, action: PayloadAction<string[]>) {
      state.items = state.items.filter((x) => !action.payload.includes(x.id));
    },
    bulkComplete(
      state,
      action: PayloadAction<{ ids: string[]; completed: boolean }>,
    ) {
      action.payload.ids.forEach((id) => {
        const t = state.items.find((x) => x.id === id);
        if (t) t.completed = action.payload.completed;
      });
    },
    bulkMove(state, action: PayloadAction<{ ids: string[]; date?: string }>) {
      action.payload.ids.forEach((id) => {
        const t = state.items.find((x) => x.id === id);
        if (t) t.date = action.payload.date;
      });
    },
    // Pomodoro tracking
    incrementPomodoro(
      state,
      action: PayloadAction<{ id: string; minutes: number }>,
    ) {
      const t = state.items.find((x) => x.id === action.payload.id);
      if (!t) return;
      t.pomodoroCount = (t.pomodoroCount || 0) + 1;
      t.actualDuration = (t.actualDuration || 0) + action.payload.minutes;
      //Update analytics
      state.analytics.timeTracking.totalMinutes += action.payload.minutes;
      if (t.category) {
        state.analytics.timeTracking.byCategory[t.category] =
          (state.analytics.timeTracking.byCategory[t.category] || 0) +
          action.payload.minutes;
      }
      const today = new Date().toISOString().split("T")[0];
      state.analytics.timeTracking.byDate[today] =
        (state.analytics.timeTracking.byDate[today] || 0) +
        action.payload.minutes;
    },
    // Attachemnts
    addAttachment(
      state,
      action: PayloadAction<{ taskId: string; attachment: Attachment }>,
    ) {
      const t = state.items.find((x) => x.id === action.payload.taskId);
      if (!t) return;
      if (!t.attachments) t.attachments = [];
      t.attachments.push(action.payload.attachment);
    },
    removeAttachment(
      state,
      action: PayloadAction<{ taskId: string; attachmentId: string }>,
    ) {
      const t = state.items.find((x) => x.id === action.payload.taskId);
      if (!t || !t.attachments) return;
      t.attachments = t.attachments.filter(
        (a) => a.id !== action.payload.attachmentId,
      );
    },
    // Settings
    updateSettings(
      state,
      action: PayloadAction<Partial<typeof initialState.settings>>,
    ) {
      state.settings = { ...state.settings, ...action.payload };
    },
    // Analytics
    recordCompletion(state, action: PayloadAction<String>) {
      const today = new Date().toISOString().split("T")[0];
      let record = state.analytics.completionHistory.find(
        (r) => r.date === today,
      );
      if (!record) {
        record = { date: today, completed: 0, total: 0, categories: {} };
        state.analytics.completionHistory.push(record);
      }
      record.completed += 1;

      const task = state.items.find((t) => t.id === action.payload);
      if (task && task.category) {
        record.categories[task.category] =
          (record.categories[task.category] || 0) + 1;
      }

      // Update streak
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .split("T")[0];
      if (
        state.analytics.streaks.lastCompletionDate === yesterday ||
        !state.analytics.streaks.lastCompletionDate
      ) {
        state.analytics.streaks.current += 1;
        if (state.analytics.streaks.current > state.analytics.streaks.longest) {
          state.analytics.streaks.longest = state.analytics.streaks.current;
        }
      } else if (state.analytics.streaks.lastCompletionDate !== today) {
        state.analytics.streaks.current = 1;
      }
      state.analytics.streaks.lastCompletionDate = today;
    },
    //Recurring tasks
    processRecurring(state) {
      const today = new Date().toISOString().split("T")[0];
      state.items.forEach((task) => {
        if (!task.recurring || !task.date) return;
        if (task.recurring.lastCreated === today) return;
        if (task.recurring.endDate && task.recurring.endDate < today) return;

        const shouldCreate = checkIfShouldRecur(task, today);
        if (shouldCreate) {
          const newTask: Task = {
            ...task,
            id: nanoid(),
            completed: false,
            createdAt: new Date().toISOString(),
            subtasks:
              task.subtasks?.map((s) => ({
                ...s,
                id: nanoid(),
                completed: false,
              })) || [],
            date: today,
          };
          state.items.push(newTask);
          task.recurring.lastCreated = today;
        }
      });
    },
  },
});

function checkIfShouldRecur(task: Task, today: string): boolean {
  if (!task.recurring) return false;
  const pattern = task.recurring;
  const lastCreated = pattern.lastCreated
    ? new Date(pattern.lastCreated)
    : new Date(task.createdAt!);
  const todayDate = new Date(today);

  if (pattern.frequency === "daily") {
    const daysDiff = Math.floor(
      (todayDate.getTime() - lastCreated.getTime()) / 86400000,
    );
    return daysDiff >= (pattern.interval || 1);
  }

  if (pattern.frequency === "weekly") {
    const daysDiff = Math.floor(
      (todayDate.getTime() - lastCreated.getTime()) / 86400000,
    );
    if (daysDiff < 7 * (pattern.interval || 1)) return false;
    if (pattern.daysOfWeek && !pattern.daysOfWeek.includes(todayDate.getDay()))
      return false;
    return true;
  }

  if (pattern.frequency === "monthly") {
    if (pattern.dayOfMonth && todayDate.getDate() !== pattern.dayOfMonth) {
      const monthsDiff =
        (todayDate.getFullYear() - lastCreated.getFullYear()) * 12 +
        (todayDate.getMonth() - lastCreated.getMonth());
      return monthsDiff >= (pattern.interval || 1);
    }
  }
  return false;
}

export const {
  setAll,
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
  unlockTask,
  setReminder,
  clearReminder,
  addCategory,
  editCategory,
  deleteCategory,
  saveAsTemplate,
  deleteTemplate,
  duplicateTask,
  bulkDelete,
  bulkComplete,
  bulkMove,
  incrementPomodoro,
  addAttachment,
  removeAttachment,
  updateSettings,
  recordCompletion,
  processRecurring,
} = tasksSlice.actions;

export default tasksSlice.reducer;
