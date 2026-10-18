import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  AppDatabase,
  AppSettings,
  Task,
  WorkspaceProject,
  VentureIdea,
  FinanceRecord,
  SkillTrackerItem,
  Habit,
  MonthlyGoal,
  CalendarMilestone,
  WeeklyPlan,
  NavTab,
  TaskStatus,
  ScheduleBlock,
} from '../types';
import {
  getTodayInTimezone,
  getNextMondayAfter,
  getTasksForDate,
  isValidDateString,
} from '../utils/dateUtils';
import {
  createEmptyDatabase,
  createDemoDatabase,
  loadDatabaseFromStorage,
  saveDatabaseToStorage,
  sanitizeDatabase,
  mergeDatabasesSafely,
} from '../utils/storage';
import {
  buildDailyScheduleBlocks,
  planMyDayDeterministically,
  DayPlanResult,
} from '../utils/scheduler';

interface SaveStatusInfo {
  state: 'saved' | 'saving' | 'error';
  method: string;
  lastSavedAt: string;
  errorMessage?: string;
}

interface AppContextValue {
  db: AppDatabase;
  isLoading: boolean;
  saveStatus: SaveStatusInfo;
  todayDate: string;
  nextMondayDate: string;
  effectivePlanningStartMonday: string;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isCatchUpOpen: boolean;
  setIsCatchUpOpen: (open: boolean) => void;
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (open: boolean) => void;
  isProductOverviewOpen: boolean;
  setIsProductOverviewOpen: (open: boolean) => void;
  editingTask: Task | null;
  setEditingTask: (task: Task | null) => void;
  isTaskModalOpen: boolean;
  setIsTaskModalOpen: (open: boolean) => void;
  openNewTaskModal: (defaults?: Partial<Task>) => void;
  closeTaskModal: () => void;
  newTaskDefaults: Partial<Task>;

  // Task operations
  addTask: (input: Omit<Task, 'id' | 'createdAt'>) => Task;
  quickAddTask: (
    title: string,
    options?: { category?: string; dueDate?: string; inInbox?: boolean }
  ) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskCompletion: (taskId: string, dateStr: string, isRecurringInstance: boolean) => void;
  setRecurringOccurrenceStatus: (
    taskId: string,
    dateStr: string,
    status: TaskStatus | 'Skipped',
    rescheduledToDate?: string
  ) => void;
  runPlanMyDay: (dateStr: string) => DayPlanResult;
  carryForwardTasks: (taskIds: string[], destinationDate: string) => number;

  // Custom Commitments / Schedule Blocks
  saveScheduleBlock: (block: ScheduleBlock) => void;
  deleteScheduleBlock: (id: string) => void;

  // Projects, Ventures & Finance
  saveProject: (proj: WorkspaceProject) => void;
  deleteProject: (id: string) => void;
  saveVentureIdea: (idea: VentureIdea) => void;
  deleteVentureIdea: (id: string) => void;
  addFinanceRecord: (rec: Omit<FinanceRecord, 'id'>) => void;
  deleteFinanceRecord: (id: string) => void;

  // Skills & Learning
  saveSkill: (skill: SkillTrackerItem) => void;
  deleteSkill: (id: string) => void;
  toggleSkillPracticeTask: (skillId: string, practiceTaskId: string) => void;

  // Habits
  saveHabit: (habit: Habit) => void;
  deleteHabit: (id: string) => void;
  toggleHabitCompletion: (habitId: string, dateStr: string) => void;

  // Goals & Milestones
  saveMonthlyGoal: (goal: MonthlyGoal) => void;
  deleteMonthlyGoal: (id: string) => void;
  saveMilestone: (milestone: CalendarMilestone) => void;
  deleteMilestone: (id: string) => void;

  // Weekly Plan
  saveWeeklyPlan: (weekStartDate: string, plan: WeeklyPlan) => void;

  // Settings, Demo & Data Management
  updateSettings: (updates: Partial<AppSettings>) => void;
  setDailyFocus: (dateStr: string, focusText: string) => void;
  resetToDemoData: () => void;
  clearToBlankWorkspace: () => void;
  importBackupJSON: (
    rawJson: string,
    mode: 'merge' | 'replace'
  ) => { success: boolean; message: string };
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Start with populated demo database in-memory so SSR / first paint is complete and coherent
  const [db, setDb] = useState<AppDatabase>(() => createDemoDatabase());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatusInfo>({
    state: 'saved',
    method: 'IndexedDB',
    lastSavedAt: new Date().toISOString(),
  });

  const userTimezone = db.settings.timezone || 'UTC';
  const [todayDate, setTodayDate] = useState<string>(() =>
    getTodayInTimezone(userTimezone)
  );
  const nextMondayDate = useMemo(() => getNextMondayAfter(todayDate), [todayDate]);

  const [selectedDate, setSelectedDate] = useState<string>(() =>
    getTodayInTimezone(userTimezone)
  );
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isCatchUpOpen, setIsCatchUpOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [isProductOverviewOpen, setIsProductOverviewOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [newTaskDefaults, setNewTaskDefaults] = useState<Partial<Task>>({});

  // Keep todayDate synced with configured timezone
  useEffect(() => {
    const current = getTodayInTimezone(userTimezone);
    setTodayDate(current);
  }, [userTimezone]);

  useEffect(() => {
    const interval = setInterval(() => {
      const current = getTodayInTimezone(userTimezone);
      setTodayDate((prev) => (prev !== current ? current : prev));
    }, 30_000);
    return () => clearInterval(interval);
  }, [userTimezone]);

  // Load persisted database from IndexedDB / localStorage on mount
  useEffect(() => {
    let mounted = true;
    loadDatabaseFromStorage()
      .then(({ db: loadedDb, storageSource }) => {
        if (!mounted) return;
        setDb(loadedDb);
        setSaveStatus({
          state: 'saved',
          method: storageSource === 'DemoInitialized' ? 'IndexedDB' : storageSource,
          lastSavedAt: loadedDb.lastSavedAt,
        });
        setIsLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error('Failed to initialize storage:', err);
        setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Apply light/dark theme class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (db.settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [db.settings.theme]);

  const commitDbUpdate = useCallback((updater: (prev: AppDatabase) => AppDatabase) => {
    setSaveStatus((s) => ({ ...s, state: 'saving' }));
    setDb((prev) => {
      const next = updater(prev);
      saveDatabaseToStorage(next)
        .then(({ savedAt, method }) => {
          setSaveStatus({ state: 'saved', method, lastSavedAt: savedAt });
        })
        .catch((err) => {
          setSaveStatus((s) => ({
            ...s,
            state: 'error',
            errorMessage: err instanceof Error ? err.message : 'Save error',
          }));
        });
      return next;
    });
  }, []);

  const effectivePlanningStartMonday = useMemo(() => {
    if (
      db.settings.initialPlanningDateOverride &&
      isValidDateString(db.settings.initialPlanningDateOverride)
    ) {
      return db.settings.initialPlanningDateOverride;
    }
    return nextMondayDate;
  }, [db.settings.initialPlanningDateOverride, nextMondayDate]);

  const openNewTaskModal = useCallback((defaults: Partial<Task> = {}) => {
    setEditingTask(null);
    setNewTaskDefaults(defaults);
    setIsTaskModalOpen(true);
  }, []);

  const closeTaskModal = useCallback(() => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
    setNewTaskDefaults({});
  }, []);

  const addTask = useCallback(
    (input: Omit<Task, 'id' | 'createdAt'>): Task => {
      const newTask: Task = {
        ...input,
        id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
      };
      commitDbUpdate((prev) => ({
        ...prev,
        tasks: [newTask, ...prev.tasks],
      }));
      return newTask;
    },
    [commitDbUpdate]
  );

  const quickAddTask = useCallback(
    (
      title: string,
      options?: { category?: string; dueDate?: string; inInbox?: boolean }
    ): Task => {
      const cleanTitle = title.trim();
      const newTask: Task = {
        id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title: cleanTitle,
        category:
          options?.category || db.settings.categories[0] || 'Work & Projects',
        priority: 'Medium',
        status: 'Not started',
        dueDate: options?.inInbox ? undefined : options?.dueDate ?? todayDate,
        estimatedMinutes: db.settings.defaultTaskMinutes || 30,
        inInbox: Boolean(options?.inInbox),
        createdAt: new Date().toISOString(),
      };
      commitDbUpdate((prev) => ({
        ...prev,
        tasks: [newTask, ...prev.tasks],
      }));
      return newTask;
    },
    [commitDbUpdate, db.settings.categories, db.settings.defaultTaskMinutes, todayDate]
  );

  const updateTask = useCallback(
    (id: string, updates: Partial<Task>) => {
      commitDbUpdate((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => {
          if (t.id !== id) return t;
          const nextStatus = updates.status ?? t.status;
          let completedAt = t.completedAt;
          if (nextStatus === 'Completed' && t.status !== 'Completed') {
            completedAt = new Date().toISOString();
          } else if (nextStatus !== 'Completed') {
            completedAt = undefined;
          }
          return {
            ...t,
            ...updates,
            completedAt,
          };
        }),
      }));
    },
    [commitDbUpdate]
  );

  const deleteTask = useCallback(
    (id: string) => {
      commitDbUpdate((prev) => ({
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== id),
        recurringOccurrences: prev.recurringOccurrences.filter((o) => o.taskId !== id),
      }));
    },
    [commitDbUpdate]
  );

  const toggleTaskCompletion = useCallback(
    (taskId: string, dateStr: string, isRecurringInstance: boolean) => {
      commitDbUpdate((prev) => {
        if (!isRecurringInstance) {
          return {
            ...prev,
            tasks: prev.tasks.map((t) => {
              if (t.id !== taskId) return t;
              const nextCompleted = t.status !== 'Completed';
              return {
                ...t,
                status: nextCompleted ? 'Completed' : 'Not started',
                completedAt: nextCompleted ? new Date().toISOString() : undefined,
              };
            }),
          };
        }

        const occId = `${taskId}_${dateStr}`;
        const existing = prev.recurringOccurrences.find((o) => o.id === occId);
        const nextStatus: TaskStatus =
          existing?.status === 'Completed' ? 'Not started' : 'Completed';
        const updatedRecord = {
          id: occId,
          taskId,
          date: dateStr,
          status: nextStatus,
          completedAt: nextStatus === 'Completed' ? new Date().toISOString() : undefined,
          scheduledStart: existing?.scheduledStart,
          scheduledEnd: existing?.scheduledEnd,
          rescheduledToDate: existing?.rescheduledToDate,
        };

        const filtered = prev.recurringOccurrences.filter((o) => o.id !== occId);
        return {
          ...prev,
          recurringOccurrences: [...filtered, updatedRecord],
        };
      });
    },
    [commitDbUpdate]
  );

  const setRecurringOccurrenceStatus = useCallback(
    (
      taskId: string,
      dateStr: string,
      status: TaskStatus | 'Skipped',
      rescheduledToDate?: string
    ) => {
      commitDbUpdate((prev) => {
        const occId = `${taskId}_${dateStr}`;
        const existing = prev.recurringOccurrences.find((o) => o.id === occId);
        const updatedRecord = {
          id: occId,
          taskId,
          date: dateStr,
          status,
          completedAt: status === 'Completed' ? new Date().toISOString() : undefined,
          rescheduledToDate: rescheduledToDate ?? existing?.rescheduledToDate,
          scheduledStart: existing?.scheduledStart,
          scheduledEnd: existing?.scheduledEnd,
        };
        const filtered = prev.recurringOccurrences.filter((o) => o.id !== occId);
        return {
          ...prev,
          recurringOccurrences: [...filtered, updatedRecord],
        };
      });
    },
    [commitDbUpdate]
  );

  const runPlanMyDay = useCallback(
    (dateStr: string): DayPlanResult => {
      const blocks = buildDailyScheduleBlocks(dateStr, db.settings, db.scheduleBlocks);
      const instances = getTasksForDate(db.tasks, db.recurringOccurrences, dateStr);
      const candidates = instances.map((inst) => ({
        task: inst.task,
        isRecurring: inst.isRecurringInstance,
        effectiveStatus: inst.effectiveStatus,
        existingStart: inst.effectiveScheduledStart,
        existingEnd: inst.effectiveScheduledEnd,
      }));

      const planResult = planMyDayDeterministically(dateStr, candidates, blocks, db.settings);

      commitDbUpdate((prev) => {
        const scheduledMap = new Map(
          planResult.scheduledTasks.map((s) => [s.taskId, s])
        );

        const nextTasks = prev.tasks.map((t) => {
          const match = scheduledMap.get(t.id);
          if (!match) return t;
          if (!match.isRecurring) {
            return {
              ...t,
              scheduledStart: match.scheduledStart,
              scheduledEnd: match.scheduledEnd,
              schedulerReason: match.reason,
            };
          }
          return {
            ...t,
            schedulerReason: match.reason,
          };
        });

        const nextOccurrences = [...prev.recurringOccurrences];
        for (const s of planResult.scheduledTasks) {
          if (s.isRecurring) {
            const occId = `${s.taskId}_${dateStr}`;
            const idx = nextOccurrences.findIndex((o) => o.id === occId);
            if (idx >= 0) {
              nextOccurrences[idx] = {
                ...nextOccurrences[idx],
                scheduledStart: s.scheduledStart,
                scheduledEnd: s.scheduledEnd,
              };
            } else {
              nextOccurrences.push({
                id: occId,
                taskId: s.taskId,
                date: dateStr,
                status: 'Not started',
                scheduledStart: s.scheduledStart,
                scheduledEnd: s.scheduledEnd,
              });
            }
          }
        }

        return {
          ...prev,
          tasks: nextTasks,
          recurringOccurrences: nextOccurrences,
        };
      });

      return planResult;
    },
    [commitDbUpdate, db.recurringOccurrences, db.scheduleBlocks, db.settings, db.tasks]
  );

  const carryForwardTasks = useCallback(
    (taskIds: string[], destinationDate: string): number => {
      if (!isValidDateString(destinationDate) || taskIds.length === 0) return 0;
      const idSet = new Set(taskIds);
      let movedCount = 0;

      commitDbUpdate((prev) => {
        const nextTasks = prev.tasks.map((t) => {
          if (!idSet.has(t.id)) return t;
          if (!t.recurrence || t.recurrence.frequency === 'none') {
            movedCount++;
            return {
              ...t,
              dueDate: destinationDate,
              inInbox: false,
              scheduledStart: undefined,
              scheduledEnd: undefined,
            };
          }
          return t;
        });
        return {
          ...prev,
          tasks: nextTasks,
        };
      });

      return movedCount;
    },
    [commitDbUpdate]
  );

  const saveScheduleBlock = useCallback(
    (block: ScheduleBlock) => {
      commitDbUpdate((prev) => {
        const exists = prev.scheduleBlocks.some((b) => b.id === block.id);
        return {
          ...prev,
          scheduleBlocks: exists
            ? prev.scheduleBlocks.map((b) => (b.id === block.id ? block : b))
            : [...prev.scheduleBlocks, block],
        };
      });
    },
    [commitDbUpdate]
  );

  const deleteScheduleBlock = useCallback(
    (id: string) => {
      commitDbUpdate((prev) => ({
        ...prev,
        scheduleBlocks: prev.scheduleBlocks.filter((b) => b.id !== id),
      }));
    },
    [commitDbUpdate]
  );

  const saveProject = useCallback(
    (proj: WorkspaceProject) => {
      commitDbUpdate((prev) => {
        const exists = prev.projects.some((p) => p.id === proj.id);
        return {
          ...prev,
          projects: exists
            ? prev.projects.map((p) => (p.id === proj.id ? proj : p))
            : [proj, ...prev.projects],
        };
      });
    },
    [commitDbUpdate]
  );

  const deleteProject = useCallback(
    (id: string) => {
      commitDbUpdate((prev) => ({
        ...prev,
        projects: prev.projects.filter((p) => p.id !== id),
      }));
    },
    [commitDbUpdate]
  );

  const saveVentureIdea = useCallback(
    (idea: VentureIdea) => {
      commitDbUpdate((prev) => {
        const exists = prev.ventureIdeas.some((i) => i.id === idea.id);
        return {
          ...prev,
          ventureIdeas: exists
            ? prev.ventureIdeas.map((i) => (i.id === idea.id ? idea : i))
            : [idea, ...prev.ventureIdeas],
        };
      });
    },
    [commitDbUpdate]
  );

  const deleteVentureIdea = useCallback(
    (id: string) => {
      commitDbUpdate((prev) => ({
        ...prev,
        ventureIdeas: prev.ventureIdeas.filter((i) => i.id !== id),
      }));
    },
    [commitDbUpdate]
  );

  const addFinanceRecord = useCallback(
    (rec: Omit<FinanceRecord, 'id'>) => {
      const newRec: FinanceRecord = {
        ...rec,
        id: `fin_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      };
      commitDbUpdate((prev) => ({
        ...prev,
        financeRecords: [newRec, ...prev.financeRecords],
      }));
    },
    [commitDbUpdate]
  );

  const deleteFinanceRecord = useCallback(
    (id: string) => {
      commitDbUpdate((prev) => ({
        ...prev,
        financeRecords: prev.financeRecords.filter((r) => r.id !== id),
      }));
    },
    [commitDbUpdate]
  );

  const saveSkill = useCallback(
    (skill: SkillTrackerItem) => {
      commitDbUpdate((prev) => {
        const exists = prev.skills.some((s) => s.id === skill.id);
        return {
          ...prev,
          skills: exists
            ? prev.skills.map((s) => (s.id === skill.id ? skill : s))
            : [skill, ...prev.skills],
        };
      });
    },
    [commitDbUpdate]
  );

  const deleteSkill = useCallback(
    (id: string) => {
      commitDbUpdate((prev) => ({
        ...prev,
        skills: prev.skills.filter((s) => s.id !== id),
      }));
    },
    [commitDbUpdate]
  );

  const toggleSkillPracticeTask = useCallback(
    (skillId: string, practiceTaskId: string) => {
      commitDbUpdate((prev) => ({
        ...prev,
        skills: prev.skills.map((s) => {
          if (s.id !== skillId) return s;
          return {
            ...s,
            practiceTasks: s.practiceTasks.map((pt) =>
              pt.id === practiceTaskId ? { ...pt, completed: !pt.completed } : pt
            ),
          };
        }),
      }));
    },
    [commitDbUpdate]
  );

  const saveHabit = useCallback(
    (habit: Habit) => {
      commitDbUpdate((prev) => {
        const exists = prev.habits.some((h) => h.id === habit.id);
        return {
          ...prev,
          habits: exists
            ? prev.habits.map((h) => (h.id === habit.id ? habit : h))
            : [habit, ...prev.habits],
        };
      });
    },
    [commitDbUpdate]
  );

  const deleteHabit = useCallback(
    (id: string) => {
      commitDbUpdate((prev) => ({
        ...prev,
        habits: prev.habits.filter((h) => h.id !== id),
        habitCompletions: prev.habitCompletions.filter((hc) => hc.habitId !== id),
      }));
    },
    [commitDbUpdate]
  );

  const toggleHabitCompletion = useCallback(
    (habitId: string, dateStr: string) => {
      commitDbUpdate((prev) => {
        const compId = `${habitId}_${dateStr}`;
        const existing = prev.habitCompletions.find((hc) => hc.id === compId);
        const nextCompleted = !existing?.completed;
        const filtered = prev.habitCompletions.filter((hc) => hc.id !== compId);
        return {
          ...prev,
          habitCompletions: [
            ...filtered,
            {
              id: compId,
              habitId,
              date: dateStr,
              completed: nextCompleted,
              completedAt: nextCompleted ? new Date().toISOString() : undefined,
            },
          ],
        };
      });
    },
    [commitDbUpdate]
  );

  const saveMonthlyGoal = useCallback(
    (goal: MonthlyGoal) => {
      commitDbUpdate((prev) => {
        const exists = prev.monthlyGoals.some((g) => g.id === goal.id);
        return {
          ...prev,
          monthlyGoals: exists
            ? prev.monthlyGoals.map((g) => (g.id === goal.id ? goal : g))
            : [goal, ...prev.monthlyGoals],
        };
      });
    },
    [commitDbUpdate]
  );

  const deleteMonthlyGoal = useCallback(
    (id: string) => {
      commitDbUpdate((prev) => ({
        ...prev,
        monthlyGoals: prev.monthlyGoals.filter((g) => g.id !== id),
      }));
    },
    [commitDbUpdate]
  );

  const saveMilestone = useCallback(
    (milestone: CalendarMilestone) => {
      commitDbUpdate((prev) => {
        const exists = prev.milestones.some((m) => m.id === milestone.id);
        return {
          ...prev,
          milestones: exists
            ? prev.milestones.map((m) => (m.id === milestone.id ? milestone : m))
            : [milestone, ...prev.milestones],
        };
      });
    },
    [commitDbUpdate]
  );

  const deleteMilestone = useCallback(
    (id: string) => {
      commitDbUpdate((prev) => ({
        ...prev,
        milestones: prev.milestones.filter((m) => m.id !== id),
      }));
    },
    [commitDbUpdate]
  );

  const saveWeeklyPlan = useCallback(
    (weekStartDate: string, plan: WeeklyPlan) => {
      commitDbUpdate((prev) => ({
        ...prev,
        weeklyPlans: {
          ...prev.weeklyPlans,
          [weekStartDate]: plan,
        },
      }));
    },
    [commitDbUpdate]
  );

  const updateSettings = useCallback(
    (updates: Partial<AppSettings>) => {
      commitDbUpdate((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          ...updates,
        },
      }));
    },
    [commitDbUpdate]
  );

  const setDailyFocus = useCallback(
    (dateStr: string, focusText: string) => {
      commitDbUpdate((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          dailyFocusByDate: {
            ...prev.settings.dailyFocusByDate,
            [dateStr]: focusText,
          },
        },
      }));
    },
    [commitDbUpdate]
  );

  const resetToDemoData = useCallback(() => {
    commitDbUpdate((prev) => {
      const demo = createDemoDatabase(todayDate, prev.settings.timezone);
      return {
        ...demo,
        settings: {
          ...demo.settings,
          userName: prev.settings.userName,
          timezone: prev.settings.timezone,
          theme: prev.settings.theme,
          onboardingCompleted: true,
        },
      };
    });
  }, [commitDbUpdate, todayDate]);

  const clearToBlankWorkspace = useCallback(() => {
    commitDbUpdate((prev) => {
      const empty = createEmptyDatabase(prev.settings.timezone);
      return {
        ...empty,
        isDemoActive: false,
        settings: {
          ...prev.settings,
          onboardingCompleted: true,
        },
      };
    });
  }, [commitDbUpdate]);

  const importBackupJSON = useCallback(
    (rawJson: string, mode: 'merge' | 'replace'): { success: boolean; message: string } => {
      try {
        const parsed = JSON.parse(rawJson);
        const validated = sanitizeDatabase(parsed);
        commitDbUpdate((prev) => {
          if (mode === 'replace') {
            return validated;
          }
          return mergeDatabasesSafely(prev, validated);
        });
        return {
          success: true,
          message:
            mode === 'replace'
              ? `Replaced workspace with backup (${validated.tasks.length} tasks, ${validated.habits.length} habits).`
              : `Safely merged backup without overwriting existing items.`,
        };
      } catch (err) {
        return {
          success: false,
          message: err instanceof Error ? err.message : 'Invalid JSON backup file.',
        };
      }
    },
    [commitDbUpdate]
  );

  const value: AppContextValue = {
    db,
    isLoading,
    saveStatus,
    todayDate,
    nextMondayDate,
    effectivePlanningStartMonday,
    selectedDate,
    setSelectedDate,
    activeTab,
    setActiveTab,
    isCatchUpOpen,
    setIsCatchUpOpen,
    isOnboardingOpen,
    setIsOnboardingOpen,
    isProductOverviewOpen,
    setIsProductOverviewOpen,
    editingTask,
    setEditingTask,
    isTaskModalOpen,
    setIsTaskModalOpen,
    openNewTaskModal,
    closeTaskModal,
    newTaskDefaults,
    addTask,
    quickAddTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    setRecurringOccurrenceStatus,
    runPlanMyDay,
    carryForwardTasks,
    saveScheduleBlock,
    deleteScheduleBlock,
    saveProject,
    deleteProject,
    saveVentureIdea,
    deleteVentureIdea,
    addFinanceRecord,
    deleteFinanceRecord,
    saveSkill,
    deleteSkill,
    toggleSkillPracticeTask,
    saveHabit,
    deleteHabit,
    toggleHabitCompletion,
    saveMonthlyGoal,
    deleteMonthlyGoal,
    saveMilestone,
    deleteMilestone,
    saveWeeklyPlan,
    updateSettings,
    setDailyFocus,
    resetToDemoData,
    clearToBlankWorkspace,
    importBackupJSON,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return ctx;
}
