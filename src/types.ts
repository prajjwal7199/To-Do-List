export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  subtasks?: Subtask[];
  // dependency: this task will be enabled only after dependsOn.taskId completes
  dependsOn?: {
    taskId: string;
    // delay in seconds after the dependency completes before this task becomes available
    delaySeconds?: number;
  };
  // ISO timestamp when this task becomes available (enabled)
  availableAt?: string;
  // Optional reminder timestamp (ISO) to notify the user
  reminderAt?: string;
  // mark task as backlog (long-term, not part of daily bucket rollover)
  backlog?: boolean;
  date?: string; // ISO date (yyyy-mm-dd)
  createdAt: string;
  // If this task was copied from a bucket/global task, this stores the original task id
  originId?: string;
  // Dates for which this global/bucket task should NOT be auto-copied into daily lists
  excludedDates?: string[];
  // New features
  category?: string;
  priority?: "high" | "medium" | "low" | "";
  tags?: string[];
  recurring?: RecurringPattern;
  estimatedDuration?: number; // in minutes
  actualDuration?: number; // in minutes
  pomodoroCount?: number; // number of pomodoros completed
  notes?: string; // rich text notes
  attachments?: Attachment[];
  isTemplate?: boolean;
  templateName?: string;
  // Eisenhower Matrix classification
  urgent?: boolean;
  important?: boolean;
  // Drag-and-drop order
  order?: number;
}
export interface RecurringPattern {
  frequency: "daily" | "weekly" | "monthly" | "custom";
  interval?: number; // e.g., every 2 days, every 3 weeks
  daysOfWeek?: number[]; // 0-6 for Sunday-Saturday
  dayOfMonth?: number; // 1-31
  endDate?: string; // ISO date when recurrence stops
  lastCreated?: string; // ISO date of last auto-created instance
}
export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface TasksState {
  items: Task[];
  categories: Category[];
  templates: Task[];
  analytics: Analytics;
  settings: AppSettings;
}
export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
}
export interface Analytics {
  completionHistory: CompletionRecord[];
  streaks: StreakData;
  timeTracking: TimeTrackingData;
}
export interface CompletionRecord {
  date: string; // ISO date
  completed: number;
  total: number;
  categories: Record<string, number>;
}
export interface StreakData {
  current: number;
  longest: number;
  lastCompletionDate?: string;
}
export interface TimeTrackingData {
  totalMinutes: number;
  byCategory: Record<string, number>;
  byDate: Record<string, number>;
}
export interface AppSettings {
  theme: "light" | "dark" | "auto";
  accentColor?: string;
  soundEnabled: boolean;
  confettiEnabled: boolean;
  emailNotifications: boolean;
  weeklyDigest: boolean;
}

export interface ProductivitySettings {
  dailyGoal?: number; // number of tasks considered goal
  thresholds: {
    red: number;
    orange: number;
    yellow: number;
    green: number;
  };
}
