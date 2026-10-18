import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  Plus,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Shield,
  Inbox,
  Edit2,
  Trash2,
  SkipForward,
  Settings,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  addDays,
  formatReadableDate,
  formatTime12h,
  getTasksForDate,
  doTimeRangesOverlap,
} from '../utils/dateUtils';
import {
  buildDailyScheduleBlocks,
  detectScheduleConflicts,
  DayPlanResult,
} from '../utils/scheduler';
import { CategoryBadge, PriorityBadge, DemoBadge } from '../components/Badge';

export const TodayView: React.FC = () => {
  const {
    db,
    todayDate,
    selectedDate,
    setSelectedDate,
    openNewTaskModal,
    setEditingTask,
    setIsTaskModalOpen,
    toggleTaskCompletion,
    setRecurringOccurrenceStatus,
    deleteTask,
    runPlanMyDay,
    quickAddTask,
    setActiveTab,
    setIsCatchUpOpen,
  } = useApp();

  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState(
    db.settings.categories[0] || 'Work & Projects'
  );
  const [quickToInbox, setQuickToInbox] = useState(false);
  const [lastPlanResult, setLastPlanResult] = useState<DayPlanResult | null>(null);

  const scheduleBlocks = buildDailyScheduleBlocks(
    selectedDate,
    db.settings,
    db.scheduleBlocks
  );
  const dayInstances = getTasksForDate(
    db.tasks,
    db.recurringOccurrences,
    selectedDate
  );

  const activeInstances = dayInstances.filter(
    (i) => i.effectiveStatus !== 'Completed' && i.effectiveStatus !== 'Skipped'
  );
  const completedInstances = dayInstances.filter(
    (i) => i.effectiveStatus === 'Completed'
  );
  const unscheduledActive = activeInstances.filter(
    (i) => !i.effectiveScheduledStart || !i.effectiveScheduledEnd
  );

  const conflicts = detectScheduleConflicts(
    selectedDate,
    dayInstances.map((i) => ({
      id: i.task.id,
      title: i.task.title,
      scheduledStart: i.effectiveScheduledStart,
      scheduledEnd: i.effectiveScheduledEnd,
      status: i.effectiveStatus,
    })),
    scheduleBlocks,
    db.settings.use12HourClock
  );

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    quickAddTask(quickTitle.trim(), {
      category: quickCategory,
      dueDate: selectedDate,
      inInbox: quickToInbox,
    });
    setQuickTitle('');
  };

  const handleRunPlan = () => {
    const result = runPlanMyDay(selectedDate);
    setLastPlanResult(result);
  };

  const getBlockStyle = (type: string) => {
    switch (type) {
      case 'work_window':
        return 'bg-indigo-50/70 dark:bg-indigo-950/35 border-indigo-200 dark:border-indigo-800';
      case 'personal_protected':
        return 'bg-sky-50/70 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800';
      case 'commitment':
        return 'bg-amber-50/70 dark:bg-amber-950/25 border-amber-200 dark:border-amber-800/60';
      case 'break_meal':
        return 'bg-emerald-50/60 dark:bg-emerald-950/25 border-emerald-200 dark:border-emerald-800/60';
      default:
        return 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Date Selector */}
      <div className="df-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSelectedDate(addDays(selectedDate, -1))}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {formatReadableDate(selectedDate, {
                  includeWeekday: true,
                  includeYear: true,
                })}
              </h1>
              {selectedDate === todayDate && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 text-xs font-bold">
                  Today
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Daily Time-Blocking Timeline ({db.settings.timezone}) • Fixed commitments & breaks are protected
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Next day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {selectedDate !== todayDate && (
            <button
              type="button"
              onClick={() => setSelectedDate(todayDate)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-indigo-600 dark:text-indigo-400"
            >
              Jump to Today
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRunPlan}
            className="df-btn-primary text-xs sm:text-sm inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" /> Plan My Day
          </button>
          <button
            type="button"
            onClick={() => openNewTaskModal({ dueDate: selectedDate })}
            className="df-btn-secondary text-xs sm:text-sm inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> New Task
          </button>
          <button
            type="button"
            onClick={() => setIsCatchUpOpen(true)}
            className="df-btn-secondary text-xs sm:text-sm"
          >
            Catch Up
          </button>
        </div>
      </div>

      {/* Conflict Detector Warning Banner */}
      {conflicts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-1.5">
          <div className="font-bold text-sm flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            Schedule Overlap Detected ({conflicts.length})
          </div>
          <p className="text-xs">
            Your fixed commitments and breaks are never overwritten. Please adjust task times or click &ldquo;Plan My Day&rdquo; to place tasks into open work windows:
          </p>
          <ul className="text-xs space-y-1 pl-4 list-disc">
            {conflicts.map((c) => (
              <li key={c.id}>{c.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Deterministic Plan My Day Result Summary */}
      {lastPlanResult && (
        <div className="p-4 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-indigo-950 dark:text-indigo-200 text-sm">
              Deterministic &ldquo;Plan My Day&rdquo; Applied
            </span>
            <button
              type="button"
              onClick={() => setLastPlanResult(null)}
              className="text-slate-500 hover:text-slate-800"
            >
              Dismiss
            </button>
          </div>
          <p className="text-slate-700 dark:text-slate-300">
            Placed <strong>{lastPlanResult.scheduledTasks.length}</strong> task(s) into available focus windows based on category priority, task priority, and deadline urgency.
          </p>
          {lastPlanResult.unscheduledTasks.length > 0 && (
            <div className="pt-1 text-amber-800 dark:text-amber-300">
              <strong>Left unscheduled to prevent overloading ({lastPlanResult.unscheduledTasks.length}):</strong>
              <ul className="list-disc pl-4 mt-1 space-y-0.5">
                {lastPlanResult.unscheduledTasks.map((u) => (
                  <li key={u.taskId}>
                    <strong>{u.title}</strong> ({u.estimatedMinutes}m): {u.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Quick Add Bar */}
      <form
        onSubmit={handleQuickAdd}
        className="df-card p-3.5 flex flex-wrap items-center gap-2.5"
      >
        <input
          type="text"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="Type a task title to add quickly..."
          className="flex-1 min-w-[200px] df-input text-sm"
        />
        <select
          value={quickCategory}
          onChange={(e) => setQuickCategory(e.target.value)}
          className="df-input text-xs font-medium"
        >
          {db.settings.categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer px-2">
          <input
            type="checkbox"
            checked={quickToInbox}
            onChange={(e) => setQuickToInbox(e.target.checked)}
            className="rounded text-indigo-600"
          />
          <Inbox className="w-3.5 h-3.5" /> Quick Inbox
        </label>
        <button type="submit" className="df-btn-primary text-xs">
          + Add Task
        </button>
      </form>

      {/* Main Split: Left = Checklist & Unscheduled, Right = Daily Time-Blocking Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Columns: Active Daily Checklist */}
        <div className="lg:col-span-5 space-y-5">
          <div className="df-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Checklist for {formatReadableDate(selectedDate, { includeYear: false })}
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                {completedInstances.length}/{activeInstances.length + completedInstances.length} done
              </span>
            </div>

            {activeInstances.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                No active tasks remaining for this date.
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeInstances.map((inst) => (
                  <div
                    key={inst.instanceId}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <button
                          type="button"
                          onClick={() =>
                            toggleTaskCompletion(
                              inst.task.id,
                              selectedDate,
                              inst.isRecurringInstance
                            )
                          }
                          className="mt-0.5 text-slate-400 hover:text-emerald-600"
                          aria-label={`Mark ${inst.task.title} complete`}
                        >
                          <Circle className="w-5 h-5" />
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                              {inst.task.title}
                            </span>
                            {inst.task.isDemo && <DemoBadge />}
                          </div>
                          {inst.task.notes && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {inst.task.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {inst.isRecurringInstance && (
                          <button
                            type="button"
                            onClick={() =>
                              setRecurringOccurrenceStatus(
                                inst.task.id,
                                selectedDate,
                                'Skipped'
                              )
                            }
                            className="p-1 rounded text-slate-400 hover:text-amber-600"
                            title="Skip today's recurring occurrence"
                          >
                            <SkipForward className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTask(inst.task);
                            setIsTaskModalOpen(true);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-indigo-600"
                          title="Edit or reschedule task"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete "${inst.task.title}"?`)) {
                              deleteTask(inst.task.id);
                            }
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-600"
                          title="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pl-7 text-xs">
                      <CategoryBadge category={inst.task.category} />
                      <PriorityBadge priority={inst.task.priority} />
                      <span className="text-slate-500 inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {inst.task.estimatedMinutes}m
                      </span>
                      {inst.effectiveScheduledStart ? (
                        <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/70 text-indigo-800 dark:text-indigo-200 font-semibold">
                          {formatTime12h(
                            inst.effectiveScheduledStart,
                            db.settings.use12HourClock
                          )}
                          –
                          {formatTime12h(
                            inst.effectiveScheduledEnd,
                            db.settings.use12HourClock
                          )}
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          Unscheduled time
                        </span>
                      )}
                    </div>

                    {inst.task.schedulerReason && (
                      <div className="pl-7 text-[11px] text-slate-500 dark:text-slate-400 italic">
                        Why prioritized: {inst.task.schedulerReason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Unscheduled Tasks Callout */}
            {unscheduledActive.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between gap-2 text-xs">
                <span className="text-amber-900 dark:text-amber-200">
                  <strong>{unscheduledActive.length}</strong> task(s) do not have a time block yet.
                </span>
                <button
                  type="button"
                  onClick={handleRunPlan}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-semibold shrink-0"
                >
                  Auto-Fit Now
                </button>
              </div>
            )}

            {/* Completed Today Section */}
            {completedInstances.length > 0 && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Completed ({completedInstances.length})
                </h3>
                {completedInstances.map((inst) => (
                  <div
                    key={inst.instanceId}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/30 flex items-center justify-between gap-2 opacity-70"
                  >
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() =>
                          toggleTaskCompletion(
                            inst.task.id,
                            selectedDate,
                            inst.isRecurringInstance
                          )
                        }
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </button>
                      <span className="text-xs line-through text-slate-500">
                        {inst.task.title}
                      </span>
                    </div>
                    <CategoryBadge category={inst.task.category} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 7 Columns: Daily Time-Blocking Schedule */}
        <div className="lg:col-span-7 space-y-4">
          <div className="df-card p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Daily Time-Blocking & Commitments
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Focus blocks, meetings, breaks, and personal wind-down hours
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
              >
                <Settings className="w-3.5 h-3.5" /> Configure Working Hours
              </button>
            </div>

            <div className="space-y-3">
              {scheduleBlocks.map((block) => {
                const blockTasks = dayInstances.filter(
                  (inst) =>
                    inst.effectiveScheduledStart &&
                    inst.effectiveScheduledEnd &&
                    doTimeRangesOverlap(
                      inst.effectiveScheduledStart,
                      inst.effectiveScheduledEnd,
                      block.startTime,
                      block.endTime
                    )
                );

                return (
                  <div
                    key={block.id}
                    className={`p-3.5 rounded-xl border ${getBlockStyle(block.type)} transition-all`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/80 dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {formatTime12h(block.startTime, db.settings.use12HourClock)} –{' '}
                          {formatTime12h(block.endTime, db.settings.use12HourClock)}
                        </span>
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {block.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {block.type === 'work_window' && (
                          <button
                            type="button"
                            onClick={() =>
                              openNewTaskModal({
                                dueDate: selectedDate,
                                scheduledStart: block.startTime,
                                category: db.settings.categories[0] || 'Work & Projects',
                              })
                            }
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
                          >
                            + Schedule Here
                          </button>
                        )}
                        {block.type === 'personal_protected' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200">
                            <Shield className="w-3 h-3" /> Protected Personal Time
                          </span>
                        )}
                      </div>
                    </div>

                    {block.note && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5">
                        {block.note}
                      </p>
                    )}

                    {/* Tasks placed in this window */}
                    {blockTasks.length > 0 && (
                      <div className="mt-2.5 space-y-2 pt-2 border-t border-slate-200/70 dark:border-slate-700/60">
                        {blockTasks.map((inst) => (
                          <div
                            key={inst.instanceId}
                            className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 ${
                              block.type !== 'work_window'
                                ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800'
                                : 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <button
                                type="button"
                                onClick={() =>
                                  toggleTaskCompletion(
                                    inst.task.id,
                                    selectedDate,
                                    inst.isRecurringInstance
                                  )
                                }
                              >
                                {inst.effectiveStatus === 'Completed' ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                ) : (
                                  <Circle className="w-4 h-4 text-slate-400" />
                                )}
                              </button>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {formatTime12h(
                                    inst.effectiveScheduledStart,
                                    db.settings.use12HourClock
                                  )}
                                  –
                                  {formatTime12h(
                                    inst.effectiveScheduledEnd,
                                    db.settings.use12HourClock
                                  )}
                                  : {inst.task.title}
                                </div>
                                {inst.task.schedulerReason && (
                                  <div className="text-[11px] text-slate-500 truncate">
                                    {inst.task.schedulerReason}
                                  </div>
                                )}
                              </div>
                            </div>
                            <CategoryBadge category={inst.task.category} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
