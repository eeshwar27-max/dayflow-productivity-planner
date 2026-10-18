import {
  AppDatabase,
  AppSettings,
  Task,
  WorkspaceProject,
  VentureIdea,
  SkillTrackerItem,
  Habit,
  HabitCompletion,
  MonthlyGoal,
  CalendarMilestone,
  ScheduleBlock,
} from '../types';
import {
  getTodayInTimezone,
  getNextMondayAfter,
  isValidDateString,
  addDays,
} from './dateUtils';
import { BRAND_CONFIG, detectUserTimezone } from '../config/brandConfig';

const IDB_NAME = BRAND_CONFIG.storageKeys.indexedDbName;
const IDB_VERSION = 1;
const IDB_STORE = BRAND_CONFIG.storageKeys.indexedDbStore;
const IDB_KEY = BRAND_CONFIG.storageKeys.indexedDbKey;
const LS_MIRROR_KEY = BRAND_CONFIG.storageKeys.localStorageMirrorKey;

export const DEFAULT_CATEGORIES = [...BRAND_CONFIG.defaultCategories];

export function createDefaultSettings(timezoneOverride?: string): AppSettings {
  const tz = timezoneOverride || detectUserTimezone();
  const today = getTodayInTimezone(tz);
  return {
    userName: '',
    timezone: tz,
    use12HourClock: true,
    wakeUpTime: BRAND_CONFIG.defaultSchedule.wakeUpTime,
    morningWorkStart: BRAND_CONFIG.defaultSchedule.morningWorkStart,
    morningWorkEnd: BRAND_CONFIG.defaultSchedule.morningWorkEnd,
    lunchStart: BRAND_CONFIG.defaultSchedule.lunchStart,
    lunchEnd: BRAND_CONFIG.defaultSchedule.lunchEnd,
    afternoonWorkStart: BRAND_CONFIG.defaultSchedule.afternoonWorkStart,
    afternoonWorkEnd: BRAND_CONFIG.defaultSchedule.afternoonWorkEnd,
    enableEveningFocusSession: false,
    eveningFocusStart: BRAND_CONFIG.defaultSchedule.eveningFocusStart,
    eveningFocusEnd: BRAND_CONFIG.defaultSchedule.eveningFocusEnd,
    personalWindDownMinutes: BRAND_CONFIG.defaultSchedule.personalWindDownMinutes,
    bedtime: BRAND_CONFIG.defaultSchedule.bedtime,
    enableWeekendSessions: true,
    weekendWorkStart: '10:00',
    weekendWorkEnd: '12:30',
    defaultTaskMinutes: 30,
    transitionBufferMinutes: 10,
    categories: [...DEFAULT_CATEGORIES],
    weekStartsOn: 1,
    theme: 'light',
    browserNotificationsEnabled: false,
    reminderMinutesBefore: 15,
    currencySymbol: '$',
    onboardingCompleted: false,
    dailyFocusByDate: {
      [today]: 'Focus on high-impact project milestones and maintain sustainable daily habits.',
    },
  };
}

export function createEmptyDatabase(timezoneOverride?: string): AppDatabase {
  return {
    schemaVersion: 2,
    lastSavedAt: new Date().toISOString(),
    demoInitialized: true,
    isDemoActive: false,
    tasks: [],
    recurringOccurrences: [],
    scheduleBlocks: [],
    projects: [],
    ventureIdeas: [],
    financeRecords: [],
    skills: [],
    habits: [],
    habitCompletions: [],
    monthlyGoals: [],
    milestones: [],
    weeklyPlans: {},
    settings: createDefaultSettings(timezoneOverride),
  };
}

/**
 * Generates coherent, clearly fictional portfolio demo data for DayFlow.
 * Demonstrates Dashboard, Today time-blocking, Weekly Planner, Calendar,
 * Goals, Projects, Ventures, Skills, Habits, and Progress Charts without personal references.
 */
export function createDemoDatabase(baseDateStr?: string, timezoneOverride?: string): AppDatabase {
  const tz = timezoneOverride || detectUserTimezone();
  const today = baseDateStr && isValidDateString(baseDateStr) ? baseDateStr : getTodayInTimezone(tz);
  const yesterday = addDays(today, -1);
  const twoDaysAgo = addDays(today, -2);
  const tomorrow = addDays(today, 1);
  const inThreeDays = addDays(today, 3);
  const nextMonday = getNextMondayAfter(today);
  const nowIso = new Date().toISOString();
  const monthKey = today.slice(0, 7);
  const endOfMonth = `${monthKey}-28`;

  const base = createEmptyDatabase(tz);

  const scheduleBlocks: ScheduleBlock[] = [
    {
      id: 'demo_standup_block',
      title: 'Team Sync & Daily Standup (Demo Commitment)',
      type: 'commitment',
      startTime: '11:00',
      endTime: '11:30',
      daysOfWeek: [1, 2, 3, 4, 5],
      note: 'Example fixed meeting commitment — tasks will not auto-schedule over this slot.',
      enabled: true,
    },
  ];

  const projects: WorkspaceProject[] = [
    {
      id: 'demo_proj_redesign',
      name: 'Website Redesign v2.0',
      area: 'Design & UX',
      objective: 'Modernize landing page hierarchy, improve accessibility contrast, and ship responsive components.',
      status: 'In progress',
      targetDate: addDays(today, 10),
      notes: 'Sample project demonstrating task linking and deadline tracking.',
      isDemo: true,
      createdAt: nowIso,
    },
    {
      id: 'demo_proj_portfolio',
      name: 'Developer Portfolio Case Studies',
      area: 'Career & Portfolio',
      objective: 'Document architecture decisions, interactive demos, and performance benchmarks for 3 core projects.',
      status: 'In progress',
      targetDate: addDays(today, 18),
      notes: 'Include live preview links and clean README documentation.',
      isDemo: true,
      createdAt: nowIso,
    },
    {
      id: 'demo_proj_api',
      name: 'Client Analytics Dashboard',
      area: 'Product & Engineering',
      objective: 'Deliver exportable reporting views and automated unit test suite.',
      status: 'Review',
      targetDate: addDays(today, 7),
      notes: 'Final QA checklist in progress.',
      isDemo: true,
      createdAt: nowIso,
    },
  ];

  const ventureIdeas: VentureIdea[] = [
    {
      id: 'demo_idea_ui_kit',
      name: 'Open-Source UI Component Starter Kit',
      description: 'Publish a reusable set of accessible React + Tailwind CSS layout primitives and documentation.',
      rationale: 'Helps standardize future frontend projects and showcases design system engineering.',
      nextActionableStep: 'Package core button, modal, and badge tokens into a standalone repository.',
      estimatedBudget: 0,
      targetDate: addDays(today, 14),
      status: 'Testing',
      resultsAndNotes: 'Demo venture entry — financial metrics default to $0 so no earnings are fabricated.',
      actualRevenue: 0,
      actualExpenses: 0,
      isDemo: true,
      createdAt: nowIso,
    },
    {
      id: 'demo_idea_newsletter',
      name: 'Technical Architecture Digest',
      description: 'Bi-weekly short-form breakdown of practical web performance and frontend patterns.',
      rationale: 'Builds writing clarity and shares reusable engineering notes.',
      nextActionableStep: 'Draft outline for Issue #1 on local-first browser storage.',
      estimatedBudget: 0,
      targetDate: addDays(today, 21),
      status: 'Idea',
      resultsAndNotes: '',
      actualRevenue: 0,
      actualExpenses: 0,
      isDemo: true,
      createdAt: nowIso,
    },
  ];

  const skills: SkillTrackerItem[] = [
    {
      id: 'demo_skill_ts',
      skillName: 'Advanced TypeScript & Design Systems',
      category: 'Engineering & Tech',
      learningObjective: 'Master strict generic patterns, accessible keyboard navigation, and deterministic state testing.',
      currentLevel: 'Intermediate',
      targetMilestone: 'Build and test a complete multi-view web application with 100% typed state.',
      status: 'Practicing',
      practiceTasks: [
        { id: 'dsp_1', title: 'Audit color contrast and focus-visible states across light & dark themes', completed: true },
        { id: 'dsp_2', title: 'Write unit tests for timezone-safe date and recurrence calculations', completed: true },
        { id: 'dsp_3', title: 'Implement keyboard shortcut and modal focus management', completed: false },
      ],
      notesAndResources: 'Sample learning track — add any technical, creative, or professional skill.',
      isDemo: true,
      createdAt: nowIso,
    },
  ];

  const habits: Habit[] = [
    {
      id: 'demo_habit_mobility',
      name: '30-Min Morning Walk & Mobility',
      category: 'Fitness & Movement',
      scheduleType: 'daily',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      targetMinutes: 30,
      notes: 'Sample daily health habit for sustainable energy.',
      isDemo: true,
      createdAt: nowIso,
    },
    {
      id: 'demo_habit_reading',
      name: '20-Min Deep Reading / Skill Study',
      category: 'Mindfulness & Focus',
      scheduleType: 'weekdays',
      daysOfWeek: [1, 2, 3, 4, 5],
      targetMinutes: 20,
      notes: 'Read technical books or industry articles without screen distractions.',
      isDemo: true,
      createdAt: nowIso,
    },
    {
      id: 'demo_habit_plan',
      name: 'Evening Workspace Reset & Plan Tomorrow',
      category: 'Daily Routine',
      scheduleType: 'daily',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      targetMinutes: 10,
      notes: 'Review completed tasks and pick top 3 priorities for tomorrow.',
      isDemo: true,
      createdAt: nowIso,
    },
  ];

  const habitCompletions: HabitCompletion[] = [
    {
      id: `demo_habit_mobility_${twoDaysAgo}`,
      habitId: 'demo_habit_mobility',
      date: twoDaysAgo,
      completed: true,
      completedAt: nowIso,
    },
    {
      id: `demo_habit_mobility_${yesterday}`,
      habitId: 'demo_habit_mobility',
      date: yesterday,
      completed: true,
      completedAt: nowIso,
    },
    {
      id: `demo_habit_plan_${yesterday}`,
      habitId: 'demo_habit_plan',
      date: yesterday,
      completed: true,
      completedAt: nowIso,
    },
  ];

  const monthlyGoals: MonthlyGoal[] = [
    {
      id: 'demo_goal_redesign',
      title: 'Complete Website Redesign Milestones',
      category: 'Work & Projects',
      description: 'Deliver wireframes, design tokens, responsive layouts, and QA verification.',
      measurableTarget: '6 core milestones completed',
      targetValue: 6,
      currentValue: 4,
      unit: 'milestones',
      deadline: endOfMonth,
      monthKey,
      status: 'On track',
      notes: 'Sample monthly goal — adjust progress with +1/-1 buttons.',
      isDemo: true,
      createdAt: nowIso,
    },
    {
      id: 'demo_goal_learning',
      title: 'Complete System Architecture Modules',
      category: 'Learning',
      description: 'Finish structured learning modules and hands-on coding exercises.',
      measurableTarget: '8 modules completed',
      targetValue: 8,
      currentValue: 5,
      unit: 'modules',
      deadline: endOfMonth,
      monthKey,
      status: 'On track',
      isDemo: true,
      createdAt: nowIso,
    },
    {
      id: 'demo_goal_fitness',
      title: 'Consistent Weekly Fitness & Mobility Sessions',
      category: 'Health & Fitness',
      description: 'Maintain regular movement and outdoor walks throughout the month.',
      measurableTarget: '16 active sessions',
      targetValue: 16,
      currentValue: 11,
      unit: 'sessions',
      deadline: endOfMonth,
      monthKey,
      status: 'On track',
      isDemo: true,
      createdAt: nowIso,
    },
  ];

  const milestones: CalendarMilestone[] = [
    {
      id: 'demo_ms_launch',
      title: 'Website Redesign v2.0 Review',
      date: inThreeDays,
      category: 'Work & Projects',
      isDemo: true,
    },
    {
      id: 'demo_ms_sprint',
      title: 'Next Weekly Sprint Planning',
      date: nextMonday,
      category: 'Work & Projects',
      isDemo: true,
    },
  ];

  const tasks: Task[] = [
    {
      id: 'demo_task_wireframe',
      title: 'Finalize responsive dashboard layout for Website Redesign',
      notes: 'Verify desktop sidebar, tablet grid, and mobile navigation ergonomics.',
      category: 'Work & Projects',
      priority: 'High',
      status: 'Not started',
      dueDate: today,
      estimatedMinutes: 45,
      scheduledStart: '09:30',
      scheduledEnd: '10:15',
      projectId: 'demo_proj_redesign',
      goalId: 'demo_goal_redesign',
      isDemo: true,
      schedulerReason: 'Work & Projects • Due today • High priority (45m) → Scheduled in Morning Focus Block',
      createdAt: nowIso,
    },
    {
      id: 'demo_task_learning',
      title: 'Complete TypeScript state validation & unit test exercise',
      notes: 'Practice writing deterministic unit tests for edge-case dates.',
      category: 'Learning',
      priority: 'Medium',
      status: 'Not started',
      dueDate: today,
      estimatedMinutes: 30,
      scheduledStart: '14:00',
      scheduledEnd: '14:30',
      goalId: 'demo_goal_learning',
      isDemo: true,
      schedulerReason: 'Learning • Due today • Medium priority (30m) → Scheduled in Afternoon Work & Collaboration Block',
      createdAt: nowIso,
    },
    {
      id: 'demo_task_personal',
      title: 'Schedule dentist appointment & organize weekly groceries',
      notes: 'Personal errand reminder for today.',
      category: 'Personal',
      priority: 'Low',
      status: 'Not started',
      dueDate: today,
      estimatedMinutes: 20,
      reminderEnabled: true,
      isDemo: true,
      createdAt: nowIso,
    },
    {
      id: 'demo_task_completed_today',
      title: 'Review design system color tokens and accessibility contrast',
      notes: 'Completed earlier today.',
      category: 'Work & Projects',
      priority: 'High',
      status: 'Completed',
      dueDate: today,
      estimatedMinutes: 30,
      scheduledStart: '09:00',
      scheduledEnd: '09:30',
      projectId: 'demo_proj_redesign',
      completedAt: nowIso,
      isDemo: true,
      createdAt: nowIso,
    },
    {
      id: 'demo_task_completed_yesterday',
      title: 'Draft case study architecture overview for Portfolio Update',
      category: 'Work & Projects',
      priority: 'Medium',
      status: 'Completed',
      dueDate: yesterday,
      estimatedMinutes: 40,
      projectId: 'demo_proj_portfolio',
      completedAt: nowIso,
      isDemo: true,
      createdAt: nowIso,
    },
    {
      id: 'demo_task_upcoming',
      title: 'Prepare release checklist for Client Analytics Dashboard',
      notes: 'Run production build and verify CSV/JSON export workflows.',
      category: 'Work & Projects',
      priority: 'High',
      status: 'Not started',
      dueDate: tomorrow,
      estimatedMinutes: 45,
      projectId: 'demo_proj_api',
      isDemo: true,
      createdAt: nowIso,
    },
    {
      id: 'demo_task_next_monday',
      title: 'Review monthly budget & software subscription renewals',
      category: 'Finance',
      priority: 'Medium',
      status: 'Not started',
      dueDate: nextMonday,
      estimatedMinutes: 25,
      isDemo: true,
      createdAt: nowIso,
    },
    {
      id: 'demo_task_recurring',
      title: 'Daily inbox triage & top-3 priority check',
      notes: 'Quick 15-minute morning review of priorities and calendar.',
      category: 'Work & Projects',
      priority: 'Medium',
      status: 'Not started',
      dueDate: today,
      estimatedMinutes: 15,
      recurrence: {
        frequency: 'weekdays',
      },
      isDemo: true,
      createdAt: nowIso,
    },
    {
      id: 'demo_task_inbox',
      title: 'Explore static hosting benchmarks for documentation site',
      notes: 'Captured in Quick Inbox — assign a due date when ready.',
      category: 'Learning',
      priority: 'Low',
      status: 'Not started',
      estimatedMinutes: 25,
      inInbox: true,
      isDemo: true,
      createdAt: nowIso,
    },
  ];

  return {
    ...base,
    settings: {
      ...base.settings,
      userName: 'Alex Morgan',
    },
    demoInitialized: true,
    isDemoActive: true,
    scheduleBlocks,
    projects,
    ventureIdeas,
    skills,
    habits,
    habitCompletions,
    monthlyGoals,
    milestones,
    tasks,
    weeklyPlans: {
      [nextMonday]: {
        weekStartDate: nextMonday,
        majorOutcomes: [
          'Ship Website Redesign v2.0 responsive layout',
          'Publish 1 portfolio case study with live demo',
          'Complete 5 days of morning mobility & reading habits',
        ],
        workProjectTargets: 'Finish Website Redesign QA and Client Analytics export tests.',
        learningGoals: 'Complete 2 modules in Advanced TypeScript & Design Systems.',
        healthHabitTargets: '30-minute daily walk and consistent 10:30 PM wind-down.',
        financeAndAdminTargets: 'Audit monthly software subscriptions on Monday.',
        importantDeadlines: `Website Redesign review on ${inThreeDays}.`,
        reviewWhatCompleted: '',
        reviewWhatRemains: '',
        reviewContinueNextWeek: 'Morning time-blocking before checking messages.',
        reviewStopOrDeprioritize: 'Context-switching between unscheduled low-priority tasks.',
        updatedAt: nowIso,
      },
    },
  };
}

function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

/**
 * Loads database from DayFlow's IndexedDB (or localStorage mirror).
 * On first launch (when no existing database is stored), initializes coherent fictional demo data ONCE.
 */
export async function loadDatabaseFromStorage(): Promise<{
  db: AppDatabase;
  storageSource: 'IndexedDB' | 'localStorage' | 'DemoInitialized';
}> {
  try {
    const idb = await openIndexedDB();
    const record = await new Promise<AppDatabase | undefined>((resolve, reject) => {
      const tx = idb.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(IDB_KEY);
      req.onsuccess = () => resolve(req.result as AppDatabase | undefined);
      req.onerror = () => reject(req.error);
    });
    idb.close();

    if (record && typeof record === 'object') {
      const validated = sanitizeDatabase(record);
      return { db: validated, storageSource: 'IndexedDB' };
    }
  } catch (err) {
    console.warn('IndexedDB read fallback to localStorage:', err);
  }

  try {
    const raw = localStorage.getItem(LS_MIRROR_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const validated = sanitizeDatabase(parsed);
      return { db: validated, storageSource: 'localStorage' };
    }
  } catch (err) {
    console.warn('localStorage read failed:', err);
  }

  // First launch: initialize coherent fictional demo data once and persist it immediately
  const initialDemo = createDemoDatabase();
  await saveDatabaseToStorage(initialDemo).catch(() => {});
  return { db: initialDemo, storageSource: 'DemoInitialized' };
}

/**
 * Saves the entire AppDatabase to both IndexedDB and localStorage mirror.
 */
export async function saveDatabaseToStorage(db: AppDatabase): Promise<{
  savedAt: string;
  method: 'IndexedDB' | 'localStorage';
}> {
  const savedAt = new Date().toISOString();
  const payload: AppDatabase = {
    ...db,
    lastSavedAt: savedAt,
  };

  try {
    localStorage.setItem(LS_MIRROR_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('localStorage mirror write warning:', err);
  }

  try {
    const idb = await openIndexedDB();
    await new Promise<void>((resolve, reject) => {
      const tx = idb.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const req = store.put(payload, IDB_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    idb.close();
    return { savedAt, method: 'IndexedDB' };
  } catch (err) {
    console.warn('IndexedDB write failed, persisted in localStorage:', err);
    return { savedAt, method: 'localStorage' };
  }
}

/**
 * Validates and sanitizes an imported or loaded database object.
 */
export function sanitizeDatabase(raw: unknown): AppDatabase {
  const base = createEmptyDatabase();
  if (!raw || typeof raw !== 'object') {
    throw new Error('Backup data must be a valid JSON object.');
  }
  const obj = raw as Record<string, unknown>;

  if (obj.schemaVersion !== undefined && typeof obj.schemaVersion !== 'number') {
    throw new Error('Invalid schemaVersion in backup file.');
  }
  if (typeof obj.schemaVersion === 'number' && obj.schemaVersion > 3) {
    throw new Error(`Unsupported backup schema version: ${obj.schemaVersion}.`);
  }

  const tasks: Task[] = Array.isArray(obj.tasks)
    ? obj.tasks
        .filter((t): t is Record<string, unknown> =>
          Boolean(t && typeof t === 'object' && typeof (t as Task).title === 'string')
        )
        .map((t) => ({
          id:
            typeof t.id === 'string' && t.id
              ? t.id
              : `task_${Math.random().toString(36).slice(2, 9)}`,
          title: String(t.title).trim(),
          notes: typeof t.notes === 'string' ? t.notes : undefined,
          category:
            typeof t.category === 'string' && t.category
              ? t.category
              : 'Work & Projects',
          priority:
            t.priority === 'High' || t.priority === 'Medium' || t.priority === 'Low'
              ? t.priority
              : 'Medium',
          status:
            t.status === 'Not started' ||
            t.status === 'In progress' ||
            t.status === 'Completed'
              ? t.status
              : 'Not started',
          dueDate:
            typeof t.dueDate === 'string' && isValidDateString(t.dueDate)
              ? t.dueDate
              : undefined,
          dueTime: typeof t.dueTime === 'string' ? t.dueTime : undefined,
          estimatedMinutes:
            typeof t.estimatedMinutes === 'number' && t.estimatedMinutes > 0
              ? Math.min(480, Math.round(t.estimatedMinutes))
              : 30,
          scheduledStart:
            typeof t.scheduledStart === 'string' ? t.scheduledStart : undefined,
          scheduledEnd: typeof t.scheduledEnd === 'string' ? t.scheduledEnd : undefined,
          projectId: typeof t.projectId === 'string' ? t.projectId : undefined,
          goalId: typeof t.goalId === 'string' ? t.goalId : undefined,
          recurrence:
            t.recurrence && typeof t.recurrence === 'object'
              ? (t.recurrence as Task['recurrence'])
              : undefined,
          reminderEnabled: Boolean(t.reminderEnabled),
          reminderMinutesBefore:
            typeof t.reminderMinutesBefore === 'number' ? t.reminderMinutesBefore : 15,
          inInbox: Boolean(t.inInbox),
          archived: Boolean(t.archived),
          isDemo: Boolean(t.isDemo),
          schedulerReason:
            typeof t.schedulerReason === 'string' ? t.schedulerReason : undefined,
          createdAt:
            typeof t.createdAt === 'string' ? t.createdAt : new Date().toISOString(),
          completedAt: typeof t.completedAt === 'string' ? t.completedAt : undefined,
        }))
    : [];

  const settings: AppSettings = {
    ...base.settings,
    ...(obj.settings && typeof obj.settings === 'object'
      ? (obj.settings as Partial<AppSettings>)
      : {}),
  };

  return {
    schemaVersion: 2,
    lastSavedAt:
      typeof obj.lastSavedAt === 'string' ? obj.lastSavedAt : new Date().toISOString(),
    demoInitialized: obj.demoInitialized !== undefined ? Boolean(obj.demoInitialized) : true,
    isDemoActive: Boolean(obj.isDemoActive),
    tasks,
    recurringOccurrences: Array.isArray(obj.recurringOccurrences)
      ? obj.recurringOccurrences
      : [],
    scheduleBlocks: Array.isArray(obj.scheduleBlocks) ? obj.scheduleBlocks : [],
    projects: Array.isArray(obj.projects) ? obj.projects : [],
    ventureIdeas: Array.isArray(obj.ventureIdeas) ? obj.ventureIdeas : [],
    financeRecords: Array.isArray(obj.financeRecords) ? obj.financeRecords : [],
    skills: Array.isArray(obj.skills) ? obj.skills : [],
    habits: Array.isArray(obj.habits) ? obj.habits : [],
    habitCompletions: Array.isArray(obj.habitCompletions) ? obj.habitCompletions : [],
    monthlyGoals: Array.isArray(obj.monthlyGoals) ? obj.monthlyGoals : [],
    milestones: Array.isArray(obj.milestones) ? obj.milestones : [],
    weeklyPlans:
      obj.weeklyPlans && typeof obj.weeklyPlans === 'object'
        ? (obj.weeklyPlans as AppDatabase['weeklyPlans'])
        : {},
    settings,
  };
}

/**
 * Merges an imported AppDatabase into the existing AppDatabase without silently overwriting existing records.
 */
export function mergeDatabasesSafely(
  existing: AppDatabase,
  imported: AppDatabase
): AppDatabase {
  const mergeById = <T extends { id: string }>(
    currentList: T[],
    incomingList: T[]
  ): T[] => {
    const map = new Map<string, T>();
    for (const item of currentList) {
      map.set(item.id, item);
    }
    for (const item of incomingList) {
      if (!map.has(item.id)) {
        map.set(item.id, item);
      }
    }
    return Array.from(map.values());
  };

  const mergedCategories = Array.from(
    new Set([
      ...existing.settings.categories,
      ...(imported.settings?.categories || []),
    ])
  );

  return {
    schemaVersion: 2,
    lastSavedAt: new Date().toISOString(),
    demoInitialized: true,
    isDemoActive: existing.isDemoActive,
    tasks: mergeById(existing.tasks, imported.tasks),
    recurringOccurrences: mergeById(
      existing.recurringOccurrences,
      imported.recurringOccurrences
    ),
    scheduleBlocks: mergeById(existing.scheduleBlocks, imported.scheduleBlocks),
    projects: mergeById(existing.projects, imported.projects),
    ventureIdeas: mergeById(existing.ventureIdeas, imported.ventureIdeas),
    financeRecords: mergeById(existing.financeRecords, imported.financeRecords),
    skills: mergeById(existing.skills, imported.skills),
    habits: mergeById(existing.habits, imported.habits),
    habitCompletions: mergeById(existing.habitCompletions, imported.habitCompletions),
    monthlyGoals: mergeById(existing.monthlyGoals, imported.monthlyGoals),
    milestones: mergeById(existing.milestones, imported.milestones),
    weeklyPlans: {
      ...imported.weeklyPlans,
      ...existing.weeklyPlans,
    },
    settings: {
      ...existing.settings,
      categories: mergedCategories,
      dailyFocusByDate: {
        ...(imported.settings?.dailyFocusByDate || {}),
        ...existing.settings.dailyFocusByDate,
      },
    },
  };
}

/**
 * Serializes tasks to RFC-4180 CSV format.
 */
export function tasksToCSV(tasks: Task[]): string {
  const headers = [
    'ID',
    'Title',
    'Category',
    'Priority',
    'Status',
    'Due Date',
    'Due Time',
    'Estimated Minutes',
    'Scheduled Start',
    'Scheduled End',
    'Recurrence',
    'In Inbox',
    'Notes',
    'Created At',
    'Completed At',
  ];

  const escapeCSV = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = tasks.map((t) =>
    [
      t.id,
      t.title,
      t.category,
      t.priority,
      t.status,
      t.dueDate || '',
      t.dueTime || '',
      t.estimatedMinutes,
      t.scheduledStart || '',
      t.scheduledEnd || '',
      t.recurrence?.frequency || 'none',
      t.inInbox ? 'Yes' : 'No',
      t.notes || '',
      t.createdAt,
      t.completedAt || '',
    ]
      .map(escapeCSV)
      .join(',')
  );

  return [headers.map(escapeCSV).join(','), ...rows].join('\r\n');
}

/**
 * Generates an iCalendar (.ics) file string for scheduled tasks and milestones.
 */
export function generateICSContent(db: AppDatabase): string {
  const tz = db.settings.timezone || 'UTC';
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${BRAND_CONFIG.calendarProdId}`,
    'CALSCALE:GREGORIAN',
    `X-WR-TIMEZONE:${tz}`,
  ];

  const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  for (const task of db.tasks) {
    if (task.archived || !task.dueDate || !isValidDateString(task.dueDate)) continue;
    const cleanDate = task.dueDate.replace(/-/g, '');
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:task-${task.id}@dayflow.app`);
    lines.push(`DTSTAMP:${nowStamp}`);

    if (task.scheduledStart && task.scheduledEnd) {
      const startHHMM = task.scheduledStart.replace(':', '') + '00';
      const endHHMM = task.scheduledEnd.replace(':', '') + '00';
      lines.push(`DTSTART;TZID=${tz}:${cleanDate}T${startHHMM}`);
      lines.push(`DTEND;TZID=${tz}:${cleanDate}T${endHHMM}`);
    } else {
      lines.push(`DTSTART;VALUE=DATE:${cleanDate}`);
    }

    const summary = `[${task.category}] ${task.title}`.replace(/[\r\n]+/g, ' ');
    lines.push(`SUMMARY:${summary}`);
    if (task.notes) {
      lines.push(`DESCRIPTION:${task.notes.replace(/[\r\n]+/g, '\\n')}`);
    }
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
