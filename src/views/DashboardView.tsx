import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  Plus,
  Calendar,
  AlertCircle,
  TrendingUp,
  Briefcase,
  Lightbulb,
  ArrowRight,
  Edit3,
  Check,
  RotateCcw,
  Layers,
  Sliders,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatReadableDate,
  formatTime12h,
  getCurrentTimeInTimezone,
  getTasksForDate,
  getWeekDays,
  getWeekStartDate,
  diffInDays,
  timeToMinutes,
} from '../utils/dateUtils';
import { getCategoryPriorityScore, getPriorityLevelScore } from '../utils/scheduler';
import { CategoryBadge, PriorityBadge, DemoBadge } from '../components/Badge';
import { BRAND_CONFIG } from '../config/brandConfig';

export const DashboardView: React.FC = () => {
  const {
    db,
    todayDate,
    effectivePlanningStartMonday,
    setActiveTab,
    setSelectedDate,
    openNewTaskModal,
    setEditingTask,
    setIsTaskModalOpen,
    setIsCatchUpOpen,
    setIsOnboardingOpen,
    toggleTaskCompletion,
    runPlanMyDay,
    setDailyFocus,
    resetToDemoData,
    clearToBlankWorkspace,
    quickAddTask,
  } = useApp();

  const [isEditingFocus, setIsEditingFocus] = useState(false);
  const currentFocus =
    db.settings.dailyFocusByDate[todayDate] ||
    'Focus on high-impact project milestones and maintain sustainable daily habits.';
  const [focusDraft, setFocusDraft] = useState(currentFocus);
  const [quickTitle, setQuickTitle] = useState('');
  const [planBanner, setPlanBanner] = useState<string>('');

  const todayInstances = getTasksForDate(db.tasks, db.recurringOccurrences, todayDate);
  const activeToday = todayInstances.filter(
    (i) => i.effectiveStatus !== 'Completed' && i.effectiveStatus !== 'Skipped'
  );
  const completedToday = todayInstances.filter((i) => i.effectiveStatus === 'Completed');
  const totalTodayCount = activeToday.length + completedToday.length;
  const todayCompletionPct =
    totalTodayCount > 0 ? Math.round((completedToday.length / totalTodayCount) * 100) : 0;

  // Top 1-3 priorities for today
  const topPriorities = [...activeToday]
    .sort((a, b) => {
      const scoreA =
        getCategoryPriorityScore(a.task.category) + getPriorityLevelScore(a.task.priority);
      const scoreB =
        getCategoryPriorityScore(b.task.category) + getPriorityLevelScore(b.task.priority);
      return scoreB - scoreA;
    })
    .slice(0, 3);

  // Next scheduled task today
  const nowHHMM = getCurrentTimeInTimezone(db.settings.timezone);
  const nowMins = timeToMinutes(nowHHMM);
  const scheduledActive = activeToday
    .filter((i) => i.effectiveScheduledStart)
    .sort(
      (a, b) =>
        timeToMinutes(a.effectiveScheduledStart!) - timeToMinutes(b.effectiveScheduledStart!)
    );
  const nextScheduledTask =
    scheduledActive.find(
      (i) =>
        timeToMinutes(i.effectiveScheduledEnd || i.effectiveScheduledStart!) >= nowMins
    ) || scheduledActive[0];

  // Overdue tasks & upcoming deadlines (next 7 days)
  const overdueTasks = db.tasks.filter(
    (t) =>
      !t.archived &&
      t.status !== 'Completed' &&
      t.dueDate &&
      diffInDays(t.dueDate, todayDate) > 0
  );

  const upcomingDeadlines = db.tasks
    .filter(
      (t) =>
        !t.archived &&
        t.status !== 'Completed' &&
        t.dueDate &&
        diffInDays(todayDate, t.dueDate) > 0 &&
        diffInDays(todayDate, t.dueDate) <= 7
    )
    .sort((a, b) => diffInDays(b.dueDate!, a.dueDate!))
    .slice(0, 5);

  // Weekly completion percentage (for current week)
  const currentWeekStart = getWeekStartDate(todayDate, db.settings.weekStartsOn);
  const weekDays = getWeekDays(currentWeekStart);
  const weekDayStats = weekDays.map((d) => {
    const inst = getTasksForDate(db.tasks, db.recurringOccurrences, d);
    const done = inst.filter((x) => x.effectiveStatus === 'Completed').length;
    const total = inst.filter((x) => x.effectiveStatus !== 'Skipped').length;
    return { date: d, done, total };
  });
  const weekTotalTasks = weekDayStats.reduce((s, d) => s + d.total, 0);
  const weekCompletedTasks = weekDayStats.reduce((s, d) => s + d.done, 0);
  const weeklyCompletionPct =
    weekTotalTasks > 0 ? Math.round((weekCompletedTasks / weekTotalTasks) * 100) : 0;

  const isWorkspaceEmpty =
    db.tasks.length === 0 &&
    db.projects.length === 0 &&
    db.habits.length === 0 &&
    db.monthlyGoals.length === 0;

  const handleSaveFocus = () => {
    setDailyFocus(todayDate, focusDraft.trim() || currentFocus);
    setIsEditingFocus(false);
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    quickAddTask(quickTitle.trim(), {
      category: db.settings.categories[0] || 'Work & Projects',
      dueDate: todayDate,
    });
    setQuickTitle('');
  };

  const handlePlanToday = () => {
    const res = runPlanMyDay(todayDate);
    setPlanBanner(
      `Scheduled ${res.scheduledTasks.length} task(s) into open focus windows (${res.unscheduledTasks.length} left unscheduled to protect commitments & personal time).`
    );
  };

  const greetingName = db.settings.userName ? `, ${db.settings.userName}` : '';

  return (
    <div className="space-y-6">
      {/* Demo Mode / First-Launch Setup Notice */}
      {db.isDemoActive && (
        <div className="px-4 py-3 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/70 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-indigo-950 dark:text-indigo-200">
            <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white font-bold uppercase tracking-wider text-[10px]">
              Sample Demo Mode
            </span>
            <span>
              Viewing {BRAND_CONFIG.productName} with sample portfolio data. Edit anything freely, customize your schedule, or start with a blank workspace.
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsOnboardingOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-semibold inline-flex items-center gap-1 hover:bg-indigo-50"
            >
              <Sliders className="w-3.5 h-3.5" /> Customize Setup
            </button>
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    'Clear sample demo items and start with a blank workspace?'
                  )
                ) {
                  clearToBlankWorkspace();
                }
              }}
              className="px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-800 font-medium"
            >
              Start Blank
            </button>
          </div>
        </div>
      )}

      {/* Top Welcome + Date & Daily Focus Card */}
      <div className="df-card p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold">
                <Calendar className="w-3.5 h-3.5" />
                {formatReadableDate(todayDate, {
                  includeWeekday: true,
                  includeYear: true,
                })}
              </span>
              <span>•</span>
              <span>Timezone: {db.settings.timezone}</span>
              <span>•</span>
              <span>Next Planning Monday: {formatReadableDate(effectivePlanningStartMonday)}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Welcome to {BRAND_CONFIG.productName}
              {greetingName}
            </h1>

            {/* Editable Daily Focus Statement */}
            <div className="pt-1">
              {isEditingFocus ? (
                <div className="flex flex-wrap items-center gap-2 max-w-2xl">
                  <input
                    type="text"
                    value={focusDraft}
                    onChange={(e) => setFocusDraft(e.target.value)}
                    className="flex-1 min-w-[240px] df-input text-sm"
                    placeholder="Enter today's primary focus..."
                  />
                  <button
                    type="button"
                    onClick={handleSaveFocus}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Save Focus
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Daily Focus:
                  </span>
                  <span>&ldquo;{currentFocus}&rdquo;</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFocusDraft(currentFocus);
                      setIsEditingFocus(true);
                    }}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                    title="Edit daily focus statement"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Prominent Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                openNewTaskModal({
                  dueDate: todayDate,
                  category: db.settings.categories[0] || 'Work & Projects',
                })
              }
              className="df-btn-primary text-xs sm:text-sm inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Task
            </button>
            <button
              type="button"
              onClick={handlePlanToday}
              className="df-btn-secondary text-xs sm:text-sm inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Plan My Day
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedDate(todayDate);
                setActiveTab('today');
              }}
              className="df-btn-secondary text-xs sm:text-sm inline-flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Today&apos;s Schedule
            </button>
            <button
              type="button"
              onClick={() => setIsCatchUpOpen(true)}
              className="df-btn-secondary text-xs sm:text-sm inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4 text-amber-600" /> Catch Up ({overdueTasks.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('projects')}
              className="df-btn-secondary text-xs sm:text-sm inline-flex items-center gap-1.5"
            >
              <Lightbulb className="w-4 h-4 text-violet-600" /> Projects
            </button>
          </div>
        </div>

        {planBanner && (
          <div className="mt-4 px-3.5 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-xs font-medium flex items-center justify-between">
            <span>{planBanner}</span>
            <button
              type="button"
              onClick={() => setActiveTab('today')}
              className="underline font-bold ml-3"
            >
              View Timeline →
            </button>
          </div>
        )}
      </div>

      {/* Empty Workspace Card */}
      {isWorkspaceEmpty && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              Your Workspace is Blank & Ready
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
              Start adding your own tasks, projects, and habits, or load the sample portfolio demo dataset to explore all features.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => openNewTaskModal({ dueDate: todayDate })}
              className="df-btn-primary text-xs sm:text-sm"
            >
              + Create First Task
            </button>
            <button
              type="button"
              onClick={resetToDemoData}
              className="df-btn-secondary text-xs sm:text-sm"
            >
              Load Sample Demo Data
            </button>
          </div>
        </div>
      )}

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Completed vs Total */}
        <div className="df-card p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>TODAY&apos;S PROGRESS</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {completedToday.length} / {totalTodayCount}
            </div>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {todayCompletionPct}% done
            </span>
          </div>
          <div className="mt-2.5 w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${todayCompletionPct}%` }}
            />
          </div>
        </div>

        {/* Next Scheduled Task */}
        <div className="df-card p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>NEXT SCHEDULED TASK</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          {nextScheduledTask ? (
            <div className="mt-1.5">
              <div className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                {nextScheduledTask.task.title}
              </div>
              <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
                {formatTime12h(
                  nextScheduledTask.effectiveScheduledStart,
                  db.settings.use12HourClock
                )}
                {nextScheduledTask.effectiveScheduledEnd
                  ? ` – ${formatTime12h(
                      nextScheduledTask.effectiveScheduledEnd,
                      db.settings.use12HourClock
                    )}`
                  : ''}{' '}
                ({nextScheduledTask.task.estimatedMinutes}m)
              </div>
            </div>
          ) : (
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              No time-blocked task yet. Click{' '}
              <button
                type="button"
                onClick={handlePlanToday}
                className="text-indigo-600 dark:text-indigo-400 font-semibold underline"
              >
                Plan My Day
              </button>{' '}
              to auto-fit tasks.
            </div>
          )}
        </div>

        {/* Weekly Completion Rate */}
        <div className="df-card p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>WEEKLY COMPLETION</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {weeklyCompletionPct}%
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {weekCompletedTasks} of {weekTotalTasks} tasks this week
            </span>
          </div>
          <div className="mt-2.5 w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${weeklyCompletionPct}%` }}
            />
          </div>
        </div>

        {/* Overdue & Deadlines */}
        <div className="df-card p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>DEADLINE MONITOR</span>
            <AlertCircle
              className={`w-4 h-4 ${
                overdueTasks.length > 0 ? 'text-rose-500' : 'text-emerald-500'
              }`}
            />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {overdueTasks.length} Overdue
            </div>
            <button
              type="button"
              onClick={() => setIsCatchUpOpen(true)}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Triage →
            </button>
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {upcomingDeadlines.length} upcoming deadline(s) in next 7 days
          </div>
        </div>
      </div>

      {/* Main Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Top 3 Priorities & Tasks Due Today */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick-Add Bar */}
          <form
            onSubmit={handleQuickAdd}
            className="df-card p-3 flex items-center gap-2"
          >
            <input
              type="text"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="Quick add a task for today (press Enter)..."
              className="flex-1 px-3 py-2 text-sm bg-transparent text-slate-900 dark:text-white focus:outline-none"
            />
            <button
              type="submit"
              className="df-btn-primary text-xs sm:text-sm shrink-0"
            >
              + Quick Add
            </button>
          </form>

          {/* Top 1-3 Priorities Today */}
          <div className="df-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Top 1–3 Priorities Today
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ranked by category weight, priority level, and deadline urgency
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('today')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
              >
                Full Day Timeline <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {topPriorities.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
                {completedToday.length > 0
                  ? 'All tasks scheduled for today are completed!'
                  : 'No active tasks scheduled for today yet. Add a task above or load sample demo data.'}
              </div>
            ) : (
              <div className="space-y-2.5">
                {topPriorities.map((inst, idx) => (
                  <div
                    key={inst.instanceId}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 bg-slate-50/60 dark:bg-slate-800/40 flex items-start justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          toggleTaskCompletion(
                            inst.task.id,
                            todayDate,
                            inst.isRecurringInstance
                          )
                        }
                        className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors"
                        aria-label={`Complete ${inst.task.title}`}
                      >
                        <Circle className="w-5 h-5" />
                      </button>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[11px] font-bold">
                            #{idx + 1}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-white text-sm">
                            {inst.task.title}
                          </span>
                          {inst.task.isDemo && <DemoBadge />}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500">
                          <CategoryBadge category={inst.task.category} />
                          <PriorityBadge priority={inst.task.priority} />
                          <span>• {inst.task.estimatedMinutes} mins</span>
                          {inst.effectiveScheduledStart && (
                            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                              • Scheduled{' '}
                              {formatTime12h(
                                inst.effectiveScheduledStart,
                                db.settings.use12HourClock
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTask(inst.task);
                        setIsTaskModalOpen(true);
                      }}
                      className="text-xs text-slate-500 hover:text-indigo-600 font-medium shrink-0"
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All Tasks Due Today Checklist */}
          <div className="df-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Tasks Due Today ({activeToday.length} remaining, {completedToday.length} completed)
              </h2>
              <button
                type="button"
                onClick={() => openNewTaskModal({ dueDate: todayDate })}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                + Add for Today
              </button>
            </div>

            {todayInstances.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                No tasks due today ({formatReadableDate(todayDate)}).
              </div>
            ) : (
              <div className="space-y-2">
                {todayInstances.map((inst) => {
                  const isDone = inst.effectiveStatus === 'Completed';
                  return (
                    <div
                      key={inst.instanceId}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                        isDone
                          ? 'bg-slate-50/60 dark:bg-slate-800/20 border-slate-200/60 dark:border-slate-800/60 opacity-65'
                          : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() =>
                            toggleTaskCompletion(
                              inst.task.id,
                              todayDate,
                              inst.isRecurringInstance
                            )
                          }
                          className="text-slate-400 hover:text-emerald-600 shrink-0"
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-medium truncate ${
                                isDone
                                  ? 'line-through text-slate-500'
                                  : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {inst.task.title}
                            </span>
                            {inst.task.isDemo && <DemoBadge />}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                            <CategoryBadge category={inst.task.category} />
                            <span>{inst.task.estimatedMinutes}m</span>
                            {inst.isRecurringInstance && (
                              <span className="text-indigo-600 dark:text-indigo-400">
                                ↻ Recurring
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <PriorityBadge priority={inst.task.priority} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Compact Productivity Chart, Active Goals & Deadlines */}
        <div className="space-y-6">
          {/* Compact Weekly Productivity Chart */}
          <div className="df-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                This Week&apos;s Task Output
              </h2>
              <button
                type="button"
                onClick={() => setActiveTab('progress')}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                Full Analytics →
              </button>
            </div>
            <div className="grid grid-cols-7 gap-2 items-end h-28 pt-4 px-1">
              {weekDayStats.map((d) => {
                const pct = d.total > 0 ? Math.round((d.done / d.total) * 100) : 0;
                const isToday = d.date === todayDate;
                const dayShort = formatReadableDate(d.date, {
                  includeWeekday: true,
                  includeYear: false,
                }).split(',')[0];
                return (
                  <div key={d.date} className="flex flex-col items-center gap-1.5 h-full justify-end">
                    <div className="text-[10px] font-semibold text-slate-500">
                      {d.done}/{d.total}
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-md h-16 flex items-end overflow-hidden">
                      <div
                        className={`w-full transition-all rounded-t-md ${
                          isToday ? 'bg-indigo-600' : 'bg-emerald-500'
                        }`}
                        style={{ height: `${Math.max(d.total > 0 ? 8 : 0, pct)}%` }}
                      />
                    </div>
                    <span
                      className={`text-[11px] font-semibold ${
                        isToday
                          ? 'text-indigo-600 dark:text-indigo-400 underline'
                          : 'text-slate-500'
                      }`}
                    >
                      {dayShort}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Monthly Goals Progress */}
          <div className="df-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-indigo-600" />
                Active Monthly Goals
              </h2>
              <button
                type="button"
                onClick={() => setActiveTab('calendar')}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                Manage →
              </button>
            </div>

            {db.monthlyGoals.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500 text-center">
                No active goals yet. Create monthly targets in the Calendar & Goals view.
              </div>
            ) : (
              <div className="space-y-3">
                {db.monthlyGoals.slice(0, 4).map((g) => {
                  const pct =
                    g.targetValue > 0
                      ? Math.min(100, Math.round((g.currentValue / g.targetValue) * 100))
                      : 0;
                  return (
                    <div key={g.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {g.title}
                        </span>
                        <span className="text-slate-500 shrink-0">
                          {g.currentValue}/{g.targetValue} {g.unit} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Overdue & Upcoming Deadlines */}
          <div className="df-card p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Overdue & Upcoming Deadlines
            </h2>
            {overdueTasks.length === 0 && upcomingDeadlines.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500 text-center">
                No overdue tasks or upcoming deadlines in the next 7 days.
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                {overdueTasks.slice(0, 3).map((t) => (
                  <div
                    key={t.id}
                    className="p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 flex items-center justify-between gap-2"
                  >
                    <span className="font-semibold text-rose-900 dark:text-rose-200 truncate">
                      {t.title}
                    </span>
                    <span className="text-rose-600 dark:text-rose-400 font-bold shrink-0">
                      Overdue ({formatReadableDate(t.dueDate!, { includeYear: false })})
                    </span>
                  </div>
                ))}
                {upcomingDeadlines.map((t) => (
                  <div
                    key={t.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                      {t.title}
                    </span>
                    <span className="text-slate-500 shrink-0">
                      Due {formatReadableDate(t.dueDate!, { includeYear: false })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
