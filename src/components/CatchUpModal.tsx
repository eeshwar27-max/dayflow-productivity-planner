import React, { useState } from 'react';
import { X, CheckCircle2, Calendar, ArrowRight, Archive, Inbox, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CategoryBadge, PriorityBadge } from './Badge';
import { addDays, diffInDays, formatReadableDate } from '../utils/dateUtils';
import { Priority } from '../types';

export const CatchUpModal: React.FC = () => {
  const {
    db,
    todayDate,
    effectivePlanningStartMonday,
    isCatchUpOpen,
    setIsCatchUpOpen,
    updateTask,
    carryForwardTasks,
  } = useApp();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [targetDate, setTargetDate] = useState<string>(todayDate);
  const [statusMessage, setStatusMessage] = useState<string>('');

  if (!isCatchUpOpen) return null;

  const overdueTasks = db.tasks.filter(
    (t) =>
      !t.archived &&
      t.status !== 'Completed' &&
      t.dueDate &&
      diffInDays(t.dueDate, todayDate) > 0
  );

  const inboxTasks = db.tasks.filter(
    (t) => !t.archived && t.status !== 'Completed' && (t.inInbox || !t.dueDate)
  );

  const todayActiveTasks = db.tasks.filter(
    (t) => !t.archived && t.status !== 'Completed' && t.dueDate === todayDate
  );

  const todayAssignedMinutes = todayActiveTasks.reduce(
    (acc, t) => acc + (t.estimatedMinutes || 30),
    0
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBatchMove = (destDate: string) => {
    if (selectedIds.length === 0) return;
    const count = carryForwardTasks(selectedIds, destDate);
    setSelectedIds([]);
    setStatusMessage(
      `Carried forward ${count} task(s) to ${formatReadableDate(destDate)} without duplicating records.`
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Catch-Up & Workload Triage
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Review overdue or unscheduled items and choose what moves forward while protecting your fixed commitments.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCatchUpOpen(false)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5 text-sm">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Today&apos;s Active Workload ({formatReadableDate(todayDate)}):
              </span>{' '}
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                {todayActiveTasks.length} tasks ({todayAssignedMinutes} mins)
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                DayFlow never auto-completes missed tasks or dumps all overdue items onto today&apos;s schedule automatically.
              </p>
            </div>
          </div>

          {statusMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-200 text-xs font-medium">
              {statusMessage}
            </div>
          )}

          {(overdueTasks.length > 0 || inboxTasks.length > 0) && (
            <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-800/60 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {selectedIds.length} task(s) selected for batch Carry Forward
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={selectedIds.length === 0}
                  onClick={() => handleBatchMove(todayDate)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 disabled:opacity-40 text-white text-xs font-semibold hover:bg-indigo-700"
                >
                  Move Selected to Today
                </button>
                <button
                  type="button"
                  disabled={selectedIds.length === 0}
                  onClick={() => handleBatchMove(effectivePlanningStartMonday)}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 disabled:opacity-40 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100"
                >
                  Move to Next Monday ({effectivePlanningStartMonday})
                </button>
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                  <button
                    type="button"
                    disabled={selectedIds.length === 0}
                    onClick={() => handleBatchMove(targetDate)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 dark:bg-slate-700 text-white text-xs font-semibold disabled:opacity-40"
                  >
                    Carry Forward
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Overdue Tasks Section */}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center justify-between">
              <span>Overdue Unfinished Tasks ({overdueTasks.length})</span>
              {overdueTasks.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedIds(overdueTasks.map((t) => t.id))}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  Select all overdue
                </button>
              )}
            </h3>

            {overdueTasks.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 text-xs">
                Zero overdue tasks! You are completely caught up on past deadlines.
              </div>
            ) : (
              <div className="space-y-2.5">
                {overdueTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(task.id)}
                        onChange={() => toggleSelect(task.id)}
                        className="mt-1 w-4 h-4 rounded text-indigo-600"
                      />
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {task.title}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                          <CategoryBadge category={task.category} />
                          <PriorityBadge priority={task.priority} />
                          <span className="text-rose-600 dark:text-rose-400 font-medium">
                            Was due {formatReadableDate(task.dueDate!)}
                          </span>
                          <span>• {task.estimatedMinutes}m</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => updateTask(task.id, { status: 'Completed' })}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 font-medium inline-flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Done
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateTask(task.id, {
                            dueDate: todayDate,
                            scheduledStart: undefined,
                            scheduledEnd: undefined,
                          })
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 font-medium inline-flex items-center gap-1"
                      >
                        <Calendar className="w-3.5 h-3.5" /> Today
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateTask(task.id, {
                            dueDate: addDays(todayDate, 1),
                            scheduledStart: undefined,
                            scheduledEnd: undefined,
                          })
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 font-medium inline-flex items-center gap-1"
                      >
                        <ArrowRight className="w-3.5 h-3.5" /> Tomorrow
                      </button>
                      <select
                        value={task.priority}
                        onChange={(e) =>
                          updateTask(task.id, { priority: e.target.value as Priority })
                        }
                        className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                        aria-label="Reprioritize task"
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          updateTask(task.id, { inInbox: true, dueDate: undefined })
                        }
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="Move to Quick Inbox"
                      >
                        <Inbox className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateTask(task.id, { archived: true })}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="Archive task"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Unscheduled Quick Inbox Items */}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">
              Quick Inbox Items Waiting for a Date ({inboxTasks.length})
            </h3>
            {inboxTasks.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 text-xs">
                Quick Inbox is empty.
              </div>
            ) : (
              <div className="space-y-2">
                {inboxTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-wrap items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(task.id)}
                        onChange={() => toggleSelect(task.id)}
                        className="w-4 h-4 rounded text-indigo-600"
                      />
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {task.title}
                      </span>
                      <CategoryBadge category={task.category} />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() =>
                          updateTask(task.id, { inInbox: false, dueDate: todayDate })
                        }
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-medium"
                      >
                        Schedule Today
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateTask(task.id, {
                            inInbox: false,
                            dueDate: effectivePlanningStartMonday,
                          })
                        }
                        className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium"
                      >
                        Next Mon
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
          <button
            type="button"
            onClick={() => setIsCatchUpOpen(false)}
            className="df-btn-primary text-sm"
          >
            Done Catching Up
          </button>
        </div>
      </div>
    </div>
  );
};
