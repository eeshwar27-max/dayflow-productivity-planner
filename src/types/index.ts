export type Priority = 'High' | 'Medium' | 'Low';

export type TaskStatus = 'Not started' | 'In progress' | 'Completed';

export type DefaultCategory =
  | 'Work & Projects'
  | 'Learning'
  | 'Health & Fitness'
  | 'Personal'
  | 'Finance'
  | 'Custom';

export type RecurrenceFrequency =
  | 'none'
  | 'daily'
  | 'weekdays'
  | 'selected_days'
  | 'weekly'
  | 'custom_interval';

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  /** 0 = Sunday, 1 = Monday, ..., 6 = Saturday */
  daysOfWeek?: number[];
  /** Every N days when frequency === 'custom_interval' */
  intervalDays?: number;
  /** End date YYYY-MM-DD (optional) */
  endDate?: string;
}

export interface RecurringOccurrenceRecord {
  /** Format: `${taskId}_${dateStr}` */
  id: string;
  taskId: string;
  date: string; // YYYY-MM-DD in configured timezone
  status: TaskStatus | 'Skipped';
  completedAt?: string;
  rescheduledToDate?: string;
  scheduledStart?: string; // HH:mm
  scheduledEnd?: string;   // HH:mm
  notes?: string;
}

export interface Task {
  id: string;
  title: string;
  notes?: string;
  category: string;
  priority: Priority;
  status: TaskStatus;
  /** YYYY-MM-DD; empty/undefined if in Quick Inbox without a date */
  dueDate?: string;
  /** Optional HH:mm in 24-hour format */
  dueTime?: string;
  /** Estimated duration in minutes */
  estimatedMinutes: number;
  /** Scheduled start time HH:mm on scheduledDate/dueDate */
  scheduledStart?: string;
  /** Scheduled end time HH:mm on scheduledDate/dueDate */
  scheduledEnd?: string;
  /** Associated Project ID, Venture Idea ID, or Monthly Goal ID */
  projectId?: string;
  goalId?: string;
  recurrence?: RecurrenceRule;
  reminderEnabled?: boolean;
  reminderMinutesBefore?: number;
  /** True if captured in Quick Inbox without immediate scheduling */
  inInbox?: boolean;
  archived?: boolean;
  /** True if part of the initial sample demo dataset */
  isDemo?: boolean;
  /** Explanation of why deterministic scheduler placed/prioritized this task */
  schedulerReason?: string;
  createdAt: string;
  completedAt?: string;
}

export type CommitmentType =
  | 'routine'
  | 'commute'
  | 'commitment'
  | 'break_meal'
  | 'work_window'
  | 'personal_protected'
  | 'sleep';

export interface ScheduleBlock {
  id: string;
  title: string;
  type: CommitmentType;
  startTime: string; // HH:mm (24h internal)
  endTime: string;   // HH:mm (24h internal)
  daysOfWeek: number[]; // 0..6
  isEditableDuration?: boolean;
  note?: string;
  enabled: boolean;
}

export type ProjectArea =
  | 'Product & Engineering'
  | 'Design & UX'
  | 'Content & Marketing'
  | 'Client & Freelance'
  | 'Operations & Admin'
  | 'Career & Portfolio'
  | 'Custom Project';

export interface WorkspaceProject {
  id: string;
  name: string;
  area: string;
  objective: string;
  status: 'Not started' | 'In progress' | 'Review' | 'Completed' | 'Paused';
  targetDate?: string; // YYYY-MM-DD
  notes?: string;
  isDemo?: boolean;
  createdAt: string;
}

export type VentureStatus =
  | 'Idea'
  | 'Researching'
  | 'Testing'
  | 'Active'
  | 'Paused'
  | 'Archived';

export interface VentureIdea {
  id: string;
  name: string;
  description: string;
  rationale: string;
  nextActionableStep: string;
  estimatedBudget?: number;
  targetDate?: string; // YYYY-MM-DD
  status: VentureStatus;
  resultsAndNotes?: string;
  actualRevenue: number;
  actualExpenses: number;
  isDemo?: boolean;
  createdAt: string;
}

export interface FinanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  source: 'Primary Work' | 'Side Project' | 'General';
  linkedId?: string;
  title: string;
  type: 'revenue' | 'expense';
  amount: number;
  notes?: string;
}

export interface SkillPracticeTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface SkillTrackerItem {
  id: string;
  skillName: string;
  category: 'Engineering & Tech' | 'Design & Creative' | 'Communication & Leadership' | 'Other Skill';
  learningObjective: string;
  currentLevel?: string;
  targetMilestone: string;
  status: 'Not started' | 'Practicing' | 'Applying in Projects' | 'Milestone Reached';
  practiceTasks: SkillPracticeTask[];
  notesAndResources?: string;
  isDemo?: boolean;
  createdAt: string;
}

export interface Habit {
  id: string;
  name: string;
  category: 'Fitness & Movement' | 'Health & Wellness' | 'Daily Routine' | 'Mindfulness & Focus';
  scheduleType: 'daily' | 'weekdays' | 'selected_days';
  /** 0 = Sun ... 6 = Sat */
  daysOfWeek: number[];
  targetMinutes?: number;
  notes?: string;
  isDemo?: boolean;
  createdAt: string;
  archived?: boolean;
}

export interface HabitCompletion {
  /** `${habitId}_${dateStr}` */
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  notes?: string;
  completedAt?: string;
}

export interface MonthlyGoal {
  id: string;
  title: string;
  category: string;
  description: string;
  measurableTarget: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: string; // YYYY-MM-DD
  monthKey: string; // YYYY-MM
  status: 'Not started' | 'On track' | 'At risk' | 'Completed';
  notes?: string;
  isDemo?: boolean;
  createdAt: string;
}

export interface CalendarMilestone {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  category: string;
  notes?: string;
  isDemo?: boolean;
}

export interface WeeklyPlan {
  /** Monday date string YYYY-MM-DD */
  weekStartDate: string;
  majorOutcomes: string[]; // Up to 3
  workProjectTargets: string;
  learningGoals: string;
  healthHabitTargets: string;
  financeAndAdminTargets: string;
  importantDeadlines: string;
  reviewWhatCompleted: string;
  reviewWhatRemains: string;
  reviewContinueNextWeek: string;
  reviewStopOrDeprioritize: string;
  updatedAt: string;
}

export interface AppSettings {
  userName?: string;
  timezone: string;
  use12HourClock: boolean;
  wakeUpTime: string; // "07:00"
  morningWorkStart: string; // "09:00"
  morningWorkEnd: string; // "12:30"
  lunchStart: string; // "12:30"
  lunchEnd: string; // "13:30"
  afternoonWorkStart: string; // "13:30"
  afternoonWorkEnd: string; // "17:30"
  enableEveningFocusSession: boolean;
  eveningFocusStart: string; // "19:00"
  eveningFocusEnd: string; // "20:30"
  personalWindDownMinutes: number; // e.g., 60 mins protected personal time before bed
  bedtime: string; // "22:30"
  enableWeekendSessions: boolean;
  weekendWorkStart: string; // "10:00"
  weekendWorkEnd: string; // "12:30"
  defaultTaskMinutes: number; // 30
  transitionBufferMinutes: number; // 10
  categories: string[];
  weekStartsOn: 1 | 0; // 1 = Monday (default), 0 = Sunday
  initialPlanningDateOverride?: string; // YYYY-MM-DD
  theme: 'light' | 'dark';
  browserNotificationsEnabled: boolean;
  reminderMinutesBefore: number;
  currencySymbol: string;
  onboardingCompleted: boolean;
  dailyFocusByDate: Record<string, string>;
}

export interface AppDatabase {
  schemaVersion: number;
  lastSavedAt: string;
  demoInitialized: boolean;
  isDemoActive: boolean;
  tasks: Task[];
  recurringOccurrences: RecurringOccurrenceRecord[];
  scheduleBlocks: ScheduleBlock[];
  projects: WorkspaceProject[];
  ventureIdeas: VentureIdea[];
  financeRecords: FinanceRecord[];
  skills: SkillTrackerItem[];
  habits: Habit[];
  habitCompletions: HabitCompletion[];
  monthlyGoals: MonthlyGoal[];
  milestones: CalendarMilestone[];
  weeklyPlans: Record<string, WeeklyPlan>;
  settings: AppSettings;
}

export type NavTab =
  | 'dashboard'
  | 'today'
  | 'week'
  | 'calendar'
  | 'tasks'
  | 'projects'
  | 'habits'
  | 'progress'
  | 'settings';
