import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Target,
  Flag,
  Trash2,
  Edit2,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatReadableDate,
  getDayOfWeek,
  getDaysInMonth,
  getTasksForDate,
} from '../utils/dateUtils';
import { MonthlyGoal } from '../types';
import { CategoryBadge, DemoBadge } from '../components/Badge';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const CalendarView: React.FC = () => {
  const {
    db,
    todayDate,
    effectivePlanningStartMonday,
    setSelectedDate,
    setActiveTab,
    openNewTaskModal,
    saveMonthlyGoal,
    deleteMonthlyGoal,
    saveMilestone,
    deleteMilestone,
  } = useApp();

  const initialYear = Number(todayDate.slice(0, 4));
  const initialMonth = Number(todayDate.slice(5, 7)); // 1..12

  const [viewYear, setViewYear] = useState<number>(initialYear);
  const [viewMonth, setViewMonth] = useState<number>(initialMonth);
  const [inspectedDay, setInspectedDay] = useState<string>(todayDate);

  // Goal Form Modal / Drawer State
  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalCategory, setGoalCategory] = useState('Work & Projects');
  const [goalDesc, setGoalDesc] = useState('');
  const [goalTargetText, setGoalTargetText] = useState('');
  const [goalTargetVal, setGoalTargetVal] = useState<number>(5);
  const [goalCurrentVal, setGoalCurrentVal] = useState<number>(0);
  const [goalUnit, setGoalUnit] = useState('deliverables');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [goalStatus, setGoalStatus] = useState<MonthlyGoal['status']>('On track');
  const [goalNotes, setGoalNotes] = useState('');

  // Milestone Quick Form
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneDate, setMilestoneDate] = useState(todayDate);
  const [milestoneCategory, setMilestoneCategory] = useState('Work & Projects');

  const currentMonthKey = `${viewYear}-${String(viewMonth).padStart(2, '0')}`;
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDayStr = `${currentMonthKey}-01`;
  const firstDayDow = getDayOfWeek(firstDayStr); // 0=Sun..6=Sat
  // Monday-first offset (Mon=0 ... Sun=6)
  const leadingEmptyCells = firstDayDow === 0 ? 6 : firstDayDow - 1;

  const calendarDates: string[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDates.push(`${currentMonthKey}-${String(d).padStart(2, '0')}`);
  }

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const openGoalEditor = (goal?: MonthlyGoal) => {
    if (goal) {
      setEditingGoalId(goal.id);
      setGoalTitle(goal.title);
      setGoalCategory(goal.category);
      setGoalDesc(goal.description);
      setGoalTargetText(goal.measurableTarget);
      setGoalTargetVal(goal.targetValue);
      setGoalCurrentVal(goal.currentValue);
      setGoalUnit(goal.unit);
      setGoalDeadline(goal.deadline);
      setGoalStatus(goal.status);
      setGoalNotes(goal.notes || '');
    } else {
      setEditingGoalId(null);
      setGoalTitle('');
      setGoalCategory('Work & Projects');
      setGoalDesc('');
      setGoalTargetText('');
      setGoalTargetVal(5);
      setGoalCurrentVal(0);
      setGoalUnit('deliverables');
      setGoalDeadline(`${currentMonthKey}-${String(daysInMonth).padStart(2, '0')}`);
      setGoalStatus('On track');
      setGoalNotes('');
    }
    setIsGoalFormOpen(true);
  };

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    const targetNum = Math.max(1, Number(goalTargetVal) || 1);
    const currentNum = Math.max(0, Number(goalCurrentVal) || 0);
    const autoStatus: MonthlyGoal['status'] =
      currentNum >= targetNum ? 'Completed' : goalStatus;

    saveMonthlyGoal({
      id: editingGoalId || `goal_${Date.now()}`,
      title: goalTitle.trim(),
      category: goalCategory,
      description: goalDesc.trim(),
      measurableTarget: goalTargetText.trim() || `${targetNum} ${goalUnit}`,
      targetValue: targetNum,
      currentValue: currentNum,
      unit: goalUnit.trim() || 'items',
      deadline: goalDeadline || `${currentMonthKey}-${String(daysInMonth).padStart(2, '0')}`,
      monthKey: currentMonthKey,
      status: autoStatus,
      notes: goalNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    });
    setIsGoalFormOpen(false);
  };

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestoneTitle.trim() || !milestoneDate) return;
    saveMilestone({
      id: `ms_${Date.now()}`,
      title: milestoneTitle.trim(),
      date: milestoneDate,
      category: milestoneCategory,
    });
    setMilestoneTitle('');
  };

  const inspectedTasks = getTasksForDate(
    db.tasks,
    db.recurringOccurrences,
    inspectedDay
  );
  const inspectedMilestones = db.milestones.filter((m) => m.date === inspectedDay);

  return (
    <div className="space-y-6">
      {/* Month Header */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {MONTH_NAMES[viewMonth - 1]} {viewYear}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Deadlines, Key Milestones & Measurable Monthly Goals ({db.settings.timezone})
            </p>
          </div>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setViewYear(initialYear);
              setViewMonth(initialMonth);
              setInspectedDay(todayDate);
            }}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
          >
            Current Month
          </button>
          <button
            type="button"
            onClick={() => openGoalEditor()}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Monthly Goal
          </button>
        </div>
      </div>

      {/* Calendar Grid + Selected Day Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-bold text-slate-500 pb-2 border-b border-slate-200 dark:border-slate-800">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
            <div>Sun</div>
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2 mt-2">
            {Array.from({ length: leadingEmptyCells }).map((_, idx) => (
              <div
                key={`empty_${idx}`}
                className="min-h-[64px] sm:min-h-[88px] rounded-xl bg-slate-50/40 dark:bg-slate-800/20"
              />
            ))}

            {calendarDates.map((dateStr) => {
              const dayNum = Number(dateStr.slice(8, 10));
              const isToday = dateStr === todayDate;
              const isPlanMonday = dateStr === effectivePlanningStartMonday;
              const isSelected = dateStr === inspectedDay;
              const dayTasks = getTasksForDate(
                db.tasks,
                db.recurringOccurrences,
                dateStr
              );
              const dayMilestones = db.milestones.filter((m) => m.date === dateStr);
              const dayGoalsDue = db.monthlyGoals.filter((g) => g.deadline === dateStr);

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => setInspectedDay(dateStr)}
                  className={`min-h-[64px] sm:min-h-[88px] p-1.5 sm:p-2 rounded-xl border text-left flex flex-col justify-between transition-all overflow-hidden ${
                    isSelected
                      ? 'ring-2 ring-indigo-600 border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/40'
                      : isToday
                      ? 'border-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full inline-flex items-center justify-center ${
                        isToday
                          ? 'bg-indigo-600 text-white'
                          : isPlanMonday
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {(dayTasks.length > 0 || dayMilestones.length > 0 || dayGoalsDue.length > 0) && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {dayTasks.length + dayMilestones.length + dayGoalsDue.length}
                      </span>
                    )}
                  </div>

                  {/* Compact markers */}
                  <div className="space-y-0.5 mt-1 w-full overflow-hidden">
                    {dayMilestones.slice(0, 1).map((m) => (
                      <div
                        key={m.id}
                        className="hidden sm:block text-[10px] truncate px-1 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-semibold"
                      >
                        ★ {m.title}
                      </div>
                    ))}
                    {dayTasks.slice(0, 2).map((inst) => (
                      <div
                        key={inst.instanceId}
                        className={`hidden sm:block text-[10px] truncate px-1 rounded ${
                          inst.effectiveStatus === 'Completed'
                            ? 'bg-emerald-100/70 text-emerald-800 line-through'
                            : 'bg-indigo-100/70 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200'
                        }`}
                      >
                        {inst.task.title}
                      </div>
                    ))}
                    {/* Mobile dot indicators */}
                    <div className="flex sm:hidden items-center gap-1 pt-1">
                      {dayTasks.length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      )}
                      {dayMilestones.length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                      )}
                      {dayGoalsDue.length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 4 Columns: Selected Date Details & Milestone Creator */}
        <div className="lg:col-span-4 space-y-5">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {formatReadableDate(inspectedDay)}
                </h2>
                <p className="text-xs text-slate-500">
                  {inspectedTasks.length} task(s) • {inspectedMilestones.length} milestone(s)
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => openNewTaskModal({ dueDate: inspectedDay })}
                  className="px-2.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
                >
                  + Task
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate(inspectedDay);
                    setActiveTab('today');
                  }}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                >
                  Open Day
                </button>
              </div>
            </div>

            {inspectedMilestones.length > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold uppercase text-amber-600">Milestones</h3>
                {inspectedMilestones.map((m) => (
                  <div
                    key={m.id}
                    className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                      ★ {m.title} ({m.category})
                      {m.isDemo && <DemoBadge />}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteMilestone(m.id)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase text-slate-400">Tasks on This Date</h3>
              {inspectedTasks.length === 0 ? (
                <p className="text-xs text-slate-500 py-2">No tasks scheduled for this date.</p>
              ) : (
                inspectedTasks.map((inst) => (
                  <div
                    key={inst.instanceId}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs"
                  >
                    <span
                      className={`font-medium truncate ${
                        inst.effectiveStatus === 'Completed' ? 'line-through text-slate-400' : ''
                      }`}
                    >
                      {inst.task.title}
                    </span>
                    <CategoryBadge category={inst.task.category} />
                  </div>
                ))
              )}
            </div>

            {/* Add Milestone Form */}
            <form
              onSubmit={handleAddMilestone}
              className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs"
            >
              <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5 text-amber-500" /> Add Important Date / Milestone
              </div>
              <input
                type="text"
                value={milestoneTitle}
                onChange={(e) => setMilestoneTitle(e.target.value)}
                placeholder="e.g., Release v2.0 Production Deployment"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <div className="flex gap-2">
                <input
                  type="date"
                  value={milestoneDate}
                  onChange={(e) => setMilestoneDate(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
                <select
                  value={milestoneCategory}
                  onChange={(e) => setMilestoneCategory(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {db.settings.categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Monthly Goals Section */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              Monthly Goals (Work & Projects, Learning, Health & Finance)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Measurable targets you control. Customize or delete any example target anytime.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openGoalEditor()}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> New Monthly Goal
          </button>
        </div>

        {isGoalFormOpen && (
          <form
            onSubmit={handleGoalSubmit}
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 text-xs"
          >
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {editingGoalId ? 'Edit Monthly Goal' : 'Create Monthly Goal'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1">Goal Title *</label>
                <input
                  type="text"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="e.g., Ship Website Redesign v2.0 & Portfolio Case Studies"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Category</label>
                <select
                  value={goalCategory}
                  onChange={(e) => setGoalCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {db.settings.categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold mb-1">Current Progress</label>
                <input
                  type="number"
                  min={0}
                  value={goalCurrentVal}
                  onChange={(e) => setGoalCurrentVal(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Target Number</label>
                <input
                  type="number"
                  min={1}
                  value={goalTargetVal}
                  onChange={(e) => setGoalTargetVal(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Unit</label>
                <input
                  type="text"
                  value={goalUnit}
                  onChange={(e) => setGoalUnit(e.target.value)}
                  placeholder="deliverables / modules / workouts"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Deadline</label>
                <input
                  type="date"
                  value={goalDeadline}
                  onChange={(e) => setGoalDeadline(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Description</label>
                <input
                  type="text"
                  value={goalDesc}
                  onChange={(e) => setGoalDesc(e.target.value)}
                  placeholder="How this goal supports your quarterly objectives..."
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Status</label>
                <select
                  value={goalStatus}
                  onChange={(e) => setGoalStatus(e.target.value as MonthlyGoal['status'])}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="Not started">Not started</option>
                  <option value="On track">On track</option>
                  <option value="At risk">At risk</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsGoalFormOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-bold"
              >
                Save Goal
              </button>
            </div>
          </form>
        )}

        {db.monthlyGoals.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
            No monthly goals yet. Click &ldquo;New Monthly Goal&rdquo; to set measurable targets for Work &amp; Projects, Learning, Health &amp; Fitness, or Finance.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {db.monthlyGoals.map((goal) => {
              const pct =
                goal.targetValue > 0
                  ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
                  : 0;
              return (
                <div
                  key={goal.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <CategoryBadge category={goal.category} />
                        {goal.isDemo && <DemoBadge />}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openGoalEditor(goal)}
                          className="p-1 text-slate-400 hover:text-indigo-600"
                          title="Edit goal"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteMonthlyGoal(goal.id)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                          title="Delete goal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {goal.title}
                    </h3>
                    {goal.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {goal.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {goal.currentValue} / {goal.targetValue} {goal.unit} ({pct}%)
                      </span>
                      <span className="text-slate-500">
                        Due {formatReadableDate(goal.deadline, { includeYear: false })}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          pct >= 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-medium text-slate-500">
                        Status: <strong>{goal.status}</strong>
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            saveMonthlyGoal({
                              ...goal,
                              currentValue: Math.max(0, goal.currentValue - 1),
                              status:
                                Math.max(0, goal.currentValue - 1) >= goal.targetValue
                                  ? 'Completed'
                                  : 'On track',
                            })
                          }
                          className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-xs font-bold"
                        >
                          -1
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const nextVal = goal.currentValue + 1;
                            saveMonthlyGoal({
                              ...goal,
                              currentValue: nextVal,
                              status: nextVal >= goal.targetValue ? 'Completed' : 'On track',
                            });
                          }}
                          className="px-2.5 py-0.5 rounded bg-indigo-600 text-white text-xs font-bold inline-flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" /> +1
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
