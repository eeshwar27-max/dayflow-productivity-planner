import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Target,
  CheckCircle2,
  Circle,
  ArrowRight,
  Plus,
  Calendar,
  Sparkles,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  addDays,
  formatReadableDate,
  getTasksForDate,
  getWeekDays,
  getWeekStartDate,
} from '../utils/dateUtils';
import { WeeklyPlan } from '../types';
import { CategoryBadge } from '../components/Badge';

export const WeekView: React.FC = () => {
  const {
    db,
    todayDate,
    effectivePlanningStartMonday,
    saveWeeklyPlan,
    openNewTaskModal,
    toggleTaskCompletion,
    carryForwardTasks,
    setSelectedDate,
    setActiveTab,
  } = useApp();

  const [activeWeekStart, setActiveWeekStart] = useState<string>(
    () => effectivePlanningStartMonday
  );

  const currentActualWeekStart = getWeekStartDate(todayDate, 1);
  const weekDays = getWeekDays(activeWeekStart);
  const weekEnd = weekDays[6];

  const existingPlan: WeeklyPlan = db.weeklyPlans[activeWeekStart] || {
    weekStartDate: activeWeekStart,
    majorOutcomes: ['', '', ''],
    workProjectTargets: '',
    learningGoals: '',
    healthHabitTargets: '',
    financeAndAdminTargets: '',
    importantDeadlines: '',
    reviewWhatCompleted: '',
    reviewWhatRemains: '',
    reviewContinueNextWeek: '',
    reviewStopOrDeprioritize: '',
    updatedAt: new Date().toISOString(),
  };

  const [outcomes, setOutcomes] = useState<string[]>(['', '', '']);
  const [workProjectTargets, setWorkProjectTargets] = useState('');
  const [learningGoals, setLearningGoals] = useState('');
  const [healthHabitTargets, setHealthHabitTargets] = useState('');
  const [financeAndAdminTargets, setFinanceAndAdminTargets] = useState('');
  const [importantDeadlines, setImportantDeadlines] = useState('');
  const [reviewContinue, setReviewContinue] = useState('');
  const [reviewStop, setReviewStop] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  const [selectedCarryIds, setSelectedCarryIds] = useState<string[]>([]);
  const [carryTargetDate, setCarryTargetDate] = useState<string>(() =>
    addDays(activeWeekStart, 7)
  );
  const [carryMessage, setCarryMessage] = useState<string>('');

  useEffect(() => {
    const plan = db.weeklyPlans[activeWeekStart];
    setOutcomes([
      plan?.majorOutcomes?.[0] || '',
      plan?.majorOutcomes?.[1] || '',
      plan?.majorOutcomes?.[2] || '',
    ]);
    setWorkProjectTargets(plan?.workProjectTargets || '');
    setLearningGoals(plan?.learningGoals || '');
    setHealthHabitTargets(plan?.healthHabitTargets || '');
    setFinanceAndAdminTargets(plan?.financeAndAdminTargets || '');
    setImportantDeadlines(plan?.importantDeadlines || '');
    setReviewContinue(plan?.reviewContinueNextWeek || '');
    setReviewStop(plan?.reviewStopOrDeprioritize || '');
    setCarryTargetDate(addDays(activeWeekStart, 7));
    setSelectedCarryIds([]);
    setCarryMessage('');
  }, [activeWeekStart, db.weeklyPlans]);

  const handleSavePlan = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    saveWeeklyPlan(activeWeekStart, {
      ...existingPlan,
      weekStartDate: activeWeekStart,
      majorOutcomes: outcomes.map((o) => o.trim()),
      workProjectTargets: workProjectTargets.trim(),
      learningGoals: learningGoals.trim(),
      healthHabitTargets: healthHabitTargets.trim(),
      financeAndAdminTargets: financeAndAdminTargets.trim(),
      importantDeadlines: importantDeadlines.trim(),
      reviewContinueNextWeek: reviewContinue.trim(),
      reviewStopOrDeprioritize: reviewStop.trim(),
      updatedAt: new Date().toISOString(),
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const weekDayTaskMap = weekDays.map((d) => ({
    date: d,
    instances: getTasksForDate(db.tasks, db.recurringOccurrences, d),
  }));

  const completedInWeek = weekDayTaskMap.flatMap((d) =>
    d.instances.filter((i) => i.effectiveStatus === 'Completed')
  );
  const unfinishedInWeek = weekDayTaskMap.flatMap((d) =>
    d.instances.filter(
      (i) => i.effectiveStatus !== 'Completed' && i.effectiveStatus !== 'Skipped'
    )
  );

  const carryForwardCandidates = Array.from(
    new Map(
      unfinishedInWeek
        .filter((i) => !i.isRecurringInstance)
        .map((i) => [i.task.id, i.task])
    ).values()
  );

  const toggleCarryId = (id: string) => {
    setSelectedCarryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCarryForward = () => {
    if (selectedCarryIds.length === 0) return;
    const count = carryForwardTasks(selectedCarryIds, carryTargetDate);
    setSelectedCarryIds([]);
    setCarryMessage(
      `Carried forward ${count} unfinished task(s) to ${formatReadableDate(carryTargetDate)} without creating duplicates.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Week Header & Navigation */}
      <div className="df-card p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveWeekStart(addDays(activeWeekStart, -7))}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Week of {formatReadableDate(activeWeekStart)} – {formatReadableDate(weekEnd)}
              </h1>
              {activeWeekStart === effectivePlanningStartMonday && (
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 text-xs font-bold">
                  Next-Monday Planning Start
                </span>
              )}
              {activeWeekStart === currentActualWeekStart && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 text-xs font-bold">
                  Current Calendar Week
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Today: <strong>{formatReadableDate(todayDate)}</strong> • Next Planning Monday: <strong>{formatReadableDate(effectivePlanningStartMonday)}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveWeekStart(addDays(activeWeekStart, 7))}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Next week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveWeekStart(currentActualWeekStart)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
              activeWeekStart === currentActualWeekStart
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
                : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            Current Week ({formatReadableDate(currentActualWeekStart, { includeYear: false })})
          </button>
          <button
            type="button"
            onClick={() => setActiveWeekStart(effectivePlanningStartMonday)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
              activeWeekStart === effectivePlanningStartMonday
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            Next Monday Start ({formatReadableDate(effectivePlanningStartMonday, { includeYear: false })})
          </button>
        </div>
      </div>

      {/* Top 3 Weekly Outcomes + Domain Targets Form */}
      <form onSubmit={handleSavePlan} className="df-card p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              Up to 3 Major Weekly Outcomes & Focus Areas
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Define your primary deliverables, learning goals, and habit targets for the week.
            </p>
          </div>
          <button
            type="submit"
            className="df-btn-primary text-xs sm:text-sm inline-flex items-center gap-1.5"
          >
            {savedNotice ? (
              <>
                <Check className="w-4 h-4" /> Saved Weekly Plan
              </>
            ) : (
              'Save Weekly Plan'
            )}
          </button>
        </div>

        {/* 3 Major Outcomes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
            >
              <label className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                Major Outcome #{idx + 1}
              </label>
              <input
                type="text"
                value={outcomes[idx]}
                onChange={(e) => {
                  const next = [...outcomes];
                  next[idx] = e.target.value;
                  setOutcomes(next);
                }}
                placeholder={
                  idx === 0
                    ? 'e.g., Ship Website Redesign v2.0 responsive layout'
                    : idx === 1
                    ? 'e.g., Publish 1 portfolio case study with live demo'
                    : 'e.g., Complete 5 days of morning mobility & reading'
                }
                className="w-full df-input text-xs sm:text-sm"
              />
            </div>
          ))}
        </div>

        {/* Specific Weekly Domain Targets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              1. Work & Project Deliverables
            </label>
            <input
              type="text"
              value={workProjectTargets}
              onChange={(e) => setWorkProjectTargets(e.target.value)}
              placeholder="Core project tasks and milestones..."
              className="w-full df-input"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              2. Learning & Skill Development
            </label>
            <input
              type="text"
              value={learningGoals}
              onChange={(e) => setLearningGoals(e.target.value)}
              placeholder="Courses, technical reading, or practice drills..."
              className="w-full df-input"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              3. Health & Habit Consistency
            </label>
            <input
              type="text"
              value={healthHabitTargets}
              onChange={(e) => setHealthHabitTargets(e.target.value)}
              placeholder="Workouts, mobility, and sleep routine..."
              className="w-full df-input"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              4. Finance & Side-Project Experiments
            </label>
            <input
              type="text"
              value={financeAndAdminTargets}
              onChange={(e) => setFinanceAndAdminTargets(e.target.value)}
              placeholder="Budget review, side project milestones..."
              className="w-full df-input"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              5. Key Deadlines & Personal Commitments
            </label>
            <input
              type="text"
              value={importantDeadlines}
              onChange={(e) => setImportantDeadlines(e.target.value)}
              placeholder="Upcoming launches, meetings, or personal events..."
              className="w-full df-input"
            />
          </div>
        </div>
      </form>

      {/* 7-Day Weekly Task Board */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          7-Day Schedule & Task Breakdown
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
          {weekDayTaskMap.map(({ date, instances }) => {
            const isToday = date === todayDate;
            const isPlanStart = date === effectivePlanningStartMonday;
            return (
              <div
                key={date}
                className={`p-3 rounded-2xl border flex flex-col justify-between min-h-[200px] ${
                  isToday
                    ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-400 dark:border-indigo-700'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDate(date);
                          setActiveTab('today');
                        }}
                        className="text-xs font-bold text-slate-900 dark:text-white hover:text-indigo-600 text-left"
                      >
                        {formatReadableDate(date, { includeWeekday: true, includeYear: false })}
                      </button>
                      {isToday && (
                        <span className="block text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                          TODAY
                        </span>
                      )}
                      {isPlanStart && !isToday && (
                        <span className="block text-[10px] font-bold text-violet-600 dark:text-violet-400">
                          PLAN START
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => openNewTaskModal({ dueDate: date })}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                      title="Add task on this day"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {instances.length === 0 ? (
                    <p className="text-[11px] text-slate-400 py-4 text-center">No tasks</p>
                  ) : (
                    <div className="space-y-1.5">
                      {instances.map((inst) => {
                        const done = inst.effectiveStatus === 'Completed';
                        return (
                          <div
                            key={inst.instanceId}
                            className={`p-2 rounded-lg border text-xs ${
                              done
                                ? 'bg-slate-50 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800 opacity-60'
                                : 'bg-slate-50/90 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <div className="flex items-start gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  toggleTaskCompletion(
                                    inst.task.id,
                                    date,
                                    inst.isRecurringInstance
                                  )
                                }
                                className="mt-0.5 shrink-0"
                              >
                                {done ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Circle className="w-3.5 h-3.5 text-slate-400" />
                                )}
                              </button>
                              <span
                                className={`font-medium leading-snug ${
                                  done
                                    ? 'line-through text-slate-500'
                                    : 'text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                {inst.task.title}
                              </span>
                            </div>
                            <div className="mt-1 pl-5 flex items-center justify-between text-[10px] text-slate-500">
                              <span>{inst.task.category}</span>
                              <span>{inst.task.estimatedMinutes}m</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Review & Carry Forward Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Review */}
        <div className="df-card p-5 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Weekly Retrospective & Review
          </h2>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
              <div className="font-bold text-emerald-900 dark:text-emerald-300">
                Completed This Week ({completedInWeek.length})
              </div>
              {completedInWeek.length === 0 ? (
                <p className="text-slate-500 mt-1">No completed tasks recorded in this week yet.</p>
              ) : (
                <ul className="mt-1.5 space-y-1 list-disc pl-4 text-slate-700 dark:text-slate-300">
                  {completedInWeek.slice(0, 5).map((c) => (
                    <li key={c.instanceId} className="truncate">
                      {c.task.title}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
              <div className="font-bold text-amber-900 dark:text-amber-300">
                Unfinished This Week ({unfinishedInWeek.length})
              </div>
              {unfinishedInWeek.length === 0 ? (
                <p className="text-slate-500 mt-1">All planned tasks for this week are complete!</p>
              ) : (
                <ul className="mt-1.5 space-y-1 list-disc pl-4 text-slate-700 dark:text-slate-300">
                  {unfinishedInWeek.slice(0, 5).map((u) => (
                    <li key={u.instanceId} className="truncate">
                      {u.task.title}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                What worked well & should continue next week?
              </label>
              <textarea
                rows={2}
                value={reviewContinue}
                onChange={(e) => setReviewContinue(e.target.value)}
                placeholder="Effective routines, focus blocks, or project workflows..."
                className="w-full df-input"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                What should be stopped or deprioritized?
              </label>
              <textarea
                rows={2}
                value={reviewStop}
                onChange={(e) => setReviewStop(e.target.value)}
                placeholder="Low-impact distractions or overcommitted tasks..."
                className="w-full df-input"
              />
            </div>
            <button
              type="button"
              onClick={() => handleSavePlan()}
              className="df-btn-primary text-xs"
            >
              Save Review Notes
            </button>
          </div>
        </div>

        {/* Carry Forward Unfinished Tasks */}
        <div className="df-card p-5 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-indigo-600" />
              Carry Forward Unfinished Tasks
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select unfinished tasks from this week and move them to a new date in-place without creating duplicates.
            </p>
          </div>

          {carryMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-200 text-xs font-medium">
              {carryMessage}
            </div>
          )}

          {carryForwardCandidates.length === 0 ? (
            <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
              No one-off unfinished tasks in this week need carrying forward.
            </div>
          ) : (
            <>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {carryForwardCandidates.map((task) => (
                  <label
                    key={task.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedCarryIds.includes(task.id)}
                        onChange={() => toggleCarryId(task.id)}
                        className="w-4 h-4 rounded text-indigo-600"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {task.title}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Due {formatReadableDate(task.dueDate!)} • {task.estimatedMinutes}m
                        </div>
                      </div>
                    </div>
                    <CategoryBadge category={task.category} />
                  </label>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span className="font-semibold">Destination Date:</span>
                  <input
                    type="date"
                    value={carryTargetDate}
                    onChange={(e) => setCarryTargetDate(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <button
                  type="button"
                  disabled={selectedCarryIds.length === 0}
                  onClick={handleCarryForward}
                  className="df-btn-primary text-xs disabled:opacity-40"
                >
                  Carry Forward ({selectedCarryIds.length})
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
