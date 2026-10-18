import React from 'react';
import { BarChart3, CheckCircle2, Target, Activity, Wallet } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  addDays,
  formatReadableDate,
  getTasksForDate,
  getWeekDays,
  getWeekStartDate,
} from '../utils/dateUtils';
import { CategoryBadge } from '../components/Badge';

export const ProgressView: React.FC = () => {
  const { db, todayDate } = useApp();
  const currency = db.settings.currencySymbol || '$';

  // 1. Task completion over time (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => addDays(todayDate, -(6 - i)));
  const dailySeries = last7Days.map((d) => {
    const inst = getTasksForDate(db.tasks, db.recurringOccurrences, d);
    const completed = inst.filter((x) => x.effectiveStatus === 'Completed').length;
    const total = inst.filter((x) => x.effectiveStatus !== 'Skipped').length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { date: d, completed, total, pct };
  });

  // 2. Weekly completion rate (current week)
  const weekStart = getWeekStartDate(todayDate, db.settings.weekStartsOn);
  const weekDates = getWeekDays(weekStart);
  const weekStats = weekDates.reduce(
    (acc, d) => {
      const inst = getTasksForDate(db.tasks, db.recurringOccurrences, d);
      acc.completed += inst.filter((x) => x.effectiveStatus === 'Completed').length;
      acc.total += inst.filter((x) => x.effectiveStatus !== 'Skipped').length;
      return acc;
    },
    { completed: 0, total: 0 }
  );
  const weeklyRate =
    weekStats.total > 0 ? Math.round((weekStats.completed / weekStats.total) * 100) : 0;

  // 3. Completed tasks by category
  const categoryStats = db.settings.categories.map((cat) => {
    const oneOffTotal = db.tasks.filter((t) => !t.archived && t.category === cat).length;
    const oneOffDone = db.tasks.filter(
      (t) => !t.archived && t.category === cat && t.status === 'Completed'
    ).length;
    return {
      category: cat,
      completed: oneOffDone,
      total: oneOffTotal,
      pct: oneOffTotal > 0 ? Math.round((oneOffDone / oneOffTotal) * 100) : 0,
    };
  });

  // 4. Habit consistency (last 7 days)
  const habitStats = db.habits.map((h) => {
    const doneCount = last7Days.filter((d) =>
      db.habitCompletions.some(
        (hc) => hc.habitId === h.id && hc.date === d && hc.completed
      )
    ).length;
    return {
      id: h.id,
      name: h.name,
      doneCount,
      pct: Math.round((doneCount / 7) * 100),
    };
  });

  // 5. Actual manually entered revenue & expenses
  const primaryRev = db.financeRecords
    .filter((r) => r.source === 'Primary Work' && r.type === 'revenue')
    .reduce((s, r) => s + r.amount, 0);
  const primaryExp = db.financeRecords
    .filter((r) => r.source === 'Primary Work' && r.type === 'expense')
    .reduce((s, r) => s + r.amount, 0);
  const sideRev =
    db.financeRecords
      .filter((r) => r.source !== 'Primary Work' && r.type === 'revenue')
      .reduce((s, r) => s + r.amount, 0) +
    db.ventureIdeas.reduce((s, i) => s + (i.actualRevenue || 0), 0);
  const sideExp =
    db.financeRecords
      .filter((r) => r.source !== 'Primary Work' && r.type === 'expense')
      .reduce((s, r) => s + r.amount, 0) +
    db.ventureIdeas.reduce((s, i) => s + (i.actualExpenses || 0), 0);

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          Progress & Real-Data Analytics
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          100% calculated from your actual stored tasks, goals, habits, and manual financial entries. Zero fabricated projections.
        </p>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-500">CURRENT WEEK COMPLETION RATE</div>
          <div className="text-2xl font-extrabold text-indigo-600 mt-1">{weeklyRate}%</div>
          <p className="text-xs text-slate-500 mt-1">
            {weekStats.completed} completed out of {weekStats.total} scheduled tasks this week
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-500">ACTIVE MONTHLY GOALS</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            {db.monthlyGoals.filter((g) => g.status === 'Completed').length} /{' '}
            {db.monthlyGoals.length}
          </div>
          <p className="text-xs text-slate-500 mt-1">Goals reached 100% target</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-500">NET RECORDED CASHFLOW</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {currency}
            {(primaryRev + sideRev - (primaryExp + sideExp)).toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Income: {currency}
            {(primaryRev + sideRev).toLocaleString()} • Expenses: {currency}
            {(primaryExp + sideExp).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Task Completion Over Last 7 Days */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              Task Completion Over Time (Last 7 Days)
            </h2>
            <p className="text-xs text-slate-500">
              Shows completed vs total scheduled tasks per day
            </p>
          </div>

          <div className="grid grid-cols-7 gap-2.5 items-end h-44 pt-6 px-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            {dailySeries.map((item) => {
              const label = formatReadableDate(item.date, {
                includeWeekday: true,
                includeYear: false,
              }).split(',')[0];
              return (
                <div
                  key={item.date}
                  className="flex flex-col items-center justify-end h-full gap-1.5"
                >
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    {item.completed}/{item.total}
                  </span>
                  <div className="w-full h-28 bg-slate-100 dark:bg-slate-800 rounded-t-lg flex items-end overflow-hidden">
                    <div
                      className="w-full bg-indigo-600 rounded-t-lg transition-all"
                      style={{
                        height: `${item.total > 0 ? Math.max(8, item.pct) : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Completed Tasks by Category */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Tasks Completed by Category
            </h2>
            <p className="text-xs text-slate-500">
              Breakdown across Work & Projects, Learning, Health & Fitness, Finance & Personal
            </p>
          </div>

          <div className="space-y-3">
            {categoryStats.map((cs) => (
              <div key={cs.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <CategoryBadge category={cs.category} />
                  <span className="text-slate-600 dark:text-slate-300 font-semibold">
                    {cs.completed} / {cs.total} completed ({cs.pct}%)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all"
                    style={{ width: `${cs.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 3: Goal Progress */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-600" />
            Monthly Goal Progress
          </h2>
          {db.monthlyGoals.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No monthly goals added yet.
            </p>
          ) : (
            <div className="space-y-3">
              {db.monthlyGoals.map((g) => {
                const pct =
                  g.targetValue > 0
                    ? Math.min(100, Math.round((g.currentValue / g.targetValue) * 100))
                    : 0;
                return (
                  <div key={g.id} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {g.title}
                      </span>
                      <span className="text-slate-500">
                        {g.currentValue}/{g.targetValue} {g.unit} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Chart 4: Habit Consistency & Financial Summary */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-600" />
            7-Day Habit Consistency & Finance Summary
          </h2>
          {habitStats.length === 0 ? (
            <p className="text-xs text-slate-500 py-2">No habits configured yet.</p>
          ) : (
            <div className="space-y-2.5">
              {habitStats.map((hs) => (
                <div key={hs.id} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {hs.name}
                    </span>
                    <span className="text-slate-500">
                      {hs.doneCount}/7 days ({hs.pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 transition-all"
                      style={{ width: `${hs.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
            <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-emerald-600" />
              Manual Income & Expenses Breakdown
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="font-bold text-indigo-600">Primary Work & Projects</div>
                <div className="mt-1">
                  Income: {currency}
                  {primaryRev.toLocaleString()}
                </div>
                <div>
                  Expenses: {currency}
                  {primaryExp.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="font-bold text-emerald-600">Side Projects & General</div>
                <div className="mt-1">
                  Income: {currency}
                  {sideRev.toLocaleString()}
                </div>
                <div>
                  Expenses: {currency}
                  {sideExp.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
