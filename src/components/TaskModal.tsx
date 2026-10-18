import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Clock, Repeat, Bell, Inbox, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Priority, RecurrenceFrequency, TaskStatus } from '../types';
import { addDays, minutesToTime, timeToMinutes } from '../utils/dateUtils';
import { buildDailyScheduleBlocks, detectScheduleConflicts } from '../utils/scheduler';

const WEEKDAY_LABELS = [
  { day: 1, label: 'Mon' },
  { day: 2, label: 'Tue' },
  { day: 3, label: 'Wed' },
  { day: 4, label: 'Thu' },
  { day: 5, label: 'Fri' },
  { day: 6, label: 'Sat' },
  { day: 0, label: 'Sun' },
];

export const TaskModal: React.FC = () => {
  const {
    db,
    todayDate,
    effectivePlanningStartMonday,
    isTaskModalOpen,
    closeTaskModal,
    editingTask,
    newTaskDefaults,
    addTask,
    updateTask,
  } = useApp();

  const defaultCat = db.settings.categories[0] || 'Work & Projects';
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState(defaultCat);
  const [priority, setPriority] = useState<Priority>('High');
  const [status, setStatus] = useState<TaskStatus>('Not started');
  const [inInbox, setInInbox] = useState(false);
  const [dueDate, setDueDate] = useState(todayDate);
  const [dueTime, setDueTime] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [scheduledStart, setScheduledStart] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState('');
  const [projectId, setProjectId] = useState('');
  const [goalId, setGoalId] = useState('');
  const [recurrenceFreq, setRecurrenceFreq] = useState<RecurrenceFrequency>('none');
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([1, 3, 5]);
  const [recurrenceInterval, setRecurrenceInterval] = useState<number>(2);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<string>('');
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!isTaskModalOpen) return;
    setError('');
    if (editingTask) {
      setTitle(editingTask.title);
      setNotes(editingTask.notes || '');
      setCategory(editingTask.category || defaultCat);
      setPriority(editingTask.priority || 'Medium');
      setStatus(editingTask.status || 'Not started');
      setInInbox(Boolean(editingTask.inInbox));
      setDueDate(editingTask.dueDate || todayDate);
      setDueTime(editingTask.dueTime || '');
      setEstimatedMinutes(editingTask.estimatedMinutes || db.settings.defaultTaskMinutes || 30);
      setScheduledStart(editingTask.scheduledStart || '');
      setScheduledEnd(editingTask.scheduledEnd || '');
      setProjectId(editingTask.projectId || '');
      setGoalId(editingTask.goalId || '');
      setRecurrenceFreq(editingTask.recurrence?.frequency || 'none');
      setRecurrenceDays(editingTask.recurrence?.daysOfWeek || [1, 3, 5]);
      setRecurrenceInterval(editingTask.recurrence?.intervalDays || 2);
      setRecurrenceEndDate(editingTask.recurrence?.endDate || '');
      setReminderEnabled(Boolean(editingTask.reminderEnabled));
    } else {
      setTitle(newTaskDefaults.title || '');
      setNotes(newTaskDefaults.notes || '');
      setCategory(newTaskDefaults.category || defaultCat);
      setPriority(newTaskDefaults.priority || 'Medium');
      setStatus(newTaskDefaults.status || 'Not started');
      setInInbox(Boolean(newTaskDefaults.inInbox));
      setDueDate(newTaskDefaults.dueDate ?? todayDate);
      setDueTime(newTaskDefaults.dueTime || '');
      setEstimatedMinutes(newTaskDefaults.estimatedMinutes || db.settings.defaultTaskMinutes || 30);
      setScheduledStart(newTaskDefaults.scheduledStart || '');
      setScheduledEnd(newTaskDefaults.scheduledEnd || '');
      setProjectId(newTaskDefaults.projectId || '');
      setGoalId(newTaskDefaults.goalId || '');
      setRecurrenceFreq(newTaskDefaults.recurrence?.frequency || 'none');
      setRecurrenceDays([1, 3, 5]);
      setRecurrenceInterval(2);
      setRecurrenceEndDate('');
      setReminderEnabled(false);
    }
  }, [
    isTaskModalOpen,
    editingTask,
    newTaskDefaults,
    todayDate,
    defaultCat,
    db.settings.defaultTaskMinutes,
  ]);

  if (!isTaskModalOpen) return null;

  const handleStartTimeChange = (newStart: string) => {
    setScheduledStart(newStart);
    if (newStart && estimatedMinutes > 0) {
      const startMins = timeToMinutes(newStart);
      setScheduledEnd(minutesToTime(startMins + estimatedMinutes));
    } else if (!newStart) {
      setScheduledEnd('');
    }
  };

  const activeConflicts = (() => {
    if (inInbox || !dueDate || !scheduledStart || !scheduledEnd) return [];
    const blocks = buildDailyScheduleBlocks(dueDate, db.settings, db.scheduleBlocks);
    const otherTasks = db.tasks
      .filter((t) => t.id !== editingTask?.id && t.dueDate === dueDate && !t.archived)
      .map((t) => ({
        id: t.id,
        title: t.title,
        scheduledStart: t.scheduledStart,
        scheduledEnd: t.scheduledEnd,
        status: t.status,
      }));
    return detectScheduleConflicts(
      dueDate,
      [
        ...otherTasks,
        {
          id: editingTask?.id || 'draft_task',
          title: title || 'This task',
          scheduledStart,
          scheduledEnd,
          status: 'Not started',
        },
      ],
      blocks,
      db.settings.use12HourClock
    ).filter((w) => w.taskIds.includes(editingTask?.id || 'draft_task'));
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('Please enter a task title.');
      return;
    }
    if (estimatedMinutes <= 0 || estimatedMinutes > 480) {
      setError('Estimated duration should be between 5 and 480 minutes.');
      return;
    }
    if (
      scheduledStart &&
      scheduledEnd &&
      timeToMinutes(scheduledEnd) <= timeToMinutes(scheduledStart)
    ) {
      setError('Scheduled end time must be after the start time.');
      return;
    }

    const payload = {
      title: cleanTitle,
      notes: notes.trim() || undefined,
      category,
      priority,
      status,
      inInbox,
      dueDate: inInbox ? undefined : dueDate || todayDate,
      dueTime: inInbox || !dueTime ? undefined : dueTime,
      estimatedMinutes: Number(estimatedMinutes) || 30,
      scheduledStart: inInbox || !scheduledStart ? undefined : scheduledStart,
      scheduledEnd: inInbox || !scheduledEnd ? undefined : scheduledEnd,
      projectId: projectId || undefined,
      goalId: goalId || undefined,
      recurrence:
        recurrenceFreq === 'none'
          ? undefined
          : {
              frequency: recurrenceFreq,
              daysOfWeek: recurrenceFreq === 'selected_days' ? recurrenceDays : undefined,
              intervalDays:
                recurrenceFreq === 'custom_interval' ? recurrenceInterval : undefined,
              endDate: recurrenceEndDate || undefined,
            },
      reminderEnabled,
    };

    if (editingTask) {
      updateTask(editingTask.id, payload);
    } else {
      addTask(payload);
    }
    closeTaskModal();
  };

  const toggleDayInRecurrence = (day: number) => {
    setRecurrenceDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
          <h2 id="task-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
            {editingTask ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            type="button"
            onClick={closeTaskModal}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-sm">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Finalize responsive layout for Website Redesign"
              autoFocus
              className="w-full df-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full df-input"
              >
                {db.settings.categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full df-input"
              >
                <option value="High">High (Urgent / High Impact)</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full df-input"
              >
                <option value="Not started">Not started</option>
                <option value="In progress">In progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Quick Inbox vs Scheduled Date */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="inline-flex items-center gap-2 cursor-pointer font-medium text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={inInbox}
                  onChange={(e) => setInInbox(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <Inbox className="w-4 h-4 text-indigo-500" />
                Save to Quick Inbox (assign date later)
              </label>

              {!inInbox && (
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setDueDate(todayDate)}
                    className={`px-2.5 py-1 rounded-lg border font-medium ${
                      dueDate === todayDate
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setDueDate(addDays(todayDate, 1))}
                    className={`px-2.5 py-1 rounded-lg border font-medium ${
                      dueDate === addDays(todayDate, 1)
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => setDueDate(effectivePlanningStartMonday)}
                    className={`px-2.5 py-1 rounded-lg border font-medium ${
                      dueDate === effectivePlanningStartMonday
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    Next Monday ({effectivePlanningStartMonday})
                  </button>
                </div>
              )}
            </div>

            {!inInbox && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    <Calendar className="w-3.5 h-3.5 inline mr-1" />
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Optional Due Time
                  </label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    <Clock className="w-3.5 h-3.5 inline mr-1" />
                    Est. Duration (mins)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={5}
                      max={480}
                      step={5}
                      value={estimatedMinutes}
                      onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                      className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                    <div className="flex gap-1">
                      {[15, 30, 45, 60].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setEstimatedMinutes(m)}
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            estimatedMinutes === m
                              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                              : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {m}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!inInbox && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Scheduled Start Time (Optional Time-Block)
                  </label>
                  <input
                    type="time"
                    value={scheduledStart}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Scheduled End Time
                  </label>
                  <input
                    type="time"
                    value={scheduledEnd}
                    onChange={(e) => setScheduledEnd(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>
            )}

            {activeConflicts.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-200 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  Schedule Conflict Detected (Protected Commitments Are Never Overwritten):
                </div>
                {activeConflicts.map((c) => (
                  <p key={c.id}>• {c.message}</p>
                ))}
              </div>
            )}
          </div>

          {/* Associated Project or Goal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Linked Project or Initiative (Optional)
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full df-input"
              >
                <option value="">None</option>
                <optgroup label="Active Projects">
                  {db.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      [Project] {p.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Ventures & Side Projects">
                  {db.ventureIdeas.map((i) => (
                    <option key={i.id} value={i.id}>
                      [Venture] {i.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Linked Monthly Goal (Optional)
              </label>
              <select
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                className="w-full df-input"
              >
                <option value="">None</option>
                {db.monthlyGoals.map((g) => (
                  <option key={g.id} value={g.id}>
                    [{g.category}] {g.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Recurrence & Reminder */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                <Repeat className="w-3.5 h-3.5 inline mr-1" />
                Recurrence Rule
              </label>
              <select
                value={recurrenceFreq}
                onChange={(e) => setRecurrenceFreq(e.target.value as RecurrenceFrequency)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="none">One-time task (Does not repeat)</option>
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays (Mon–Fri)</option>
                <option value="selected_days">Selected weekdays</option>
                <option value="weekly">Weekly</option>
                <option value="custom_interval">Every N days</option>
              </select>

              {recurrenceFreq === 'selected_days' && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {WEEKDAY_LABELS.map((w) => (
                    <button
                      key={w.day}
                      type="button"
                      onClick={() => toggleDayInRecurrence(w.day)}
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        recurrenceDays.includes(w.day)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              )}

              {recurrenceFreq === 'custom_interval' && (
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <span>Repeat every</span>
                  <input
                    type="number"
                    min={2}
                    max={90}
                    value={recurrenceInterval}
                    onChange={(e) => setRecurrenceInterval(Number(e.target.value))}
                    className="w-16 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                  <span>days</span>
                </div>
              )}
            </div>

            <div className="flex flex-col justify-between">
              {recurrenceFreq !== 'none' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Optional End Date for Recurrence
                  </label>
                  <input
                    type="date"
                    value={recurrenceEndDate}
                    onChange={(e) => setRecurrenceEndDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              )}
              <label className="inline-flex items-center gap-2 cursor-pointer mt-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={reminderEnabled}
                  onChange={(e) => setReminderEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600"
                />
                <Bell className="w-3.5 h-3.5 text-amber-500" />
                Highlight in-app reminder indicator when due
              </label>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Notes / Action Steps (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add context, links, or checklist details..."
              className="w-full df-input"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={closeTaskModal} className="df-btn-secondary">
              Cancel
            </button>
            <button type="submit" className="df-btn-primary">
              {editingTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
