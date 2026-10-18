import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Repeat,
  Inbox,
  Edit2,
  Trash2,
  Calendar,
  Bell,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CategoryBadge, DemoBadge, PriorityBadge, StatusBadge } from '../components/Badge';
import {
  diffInDays,
  formatReadableDate,
  formatTime12h,
  formatTimestamp,
} from '../utils/dateUtils';
import { getCategoryPriorityScore, getPriorityLevelScore } from '../utils/scheduler';

type ViewMode = 'active' | 'inbox' | 'recurring' | 'completed';
type DateFilter = 'all' | 'today' | 'overdue' | 'upcoming_7d';
type SortBy = 'priority_first' | 'due_date' | 'duration_asc' | 'created_desc';

export const TasksView: React.FC = () => {
  const {
    db,
    todayDate,
    effectivePlanningStartMonday,
    openNewTaskModal,
    setEditingTask,
    setIsTaskModalOpen,
    quickAddTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    setIsCatchUpOpen,
  } = useApp();

  const [viewMode, setViewMode] = useState<ViewMode>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('priority_first');
  const [quickTitle, setQuickTitle] = useState('');

  const handleQuickTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    quickAddTask(quickTitle.trim(), {
      category: categoryFilter !== 'ALL' ? categoryFilter : 'Work & Projects',
      dueDate: viewMode === 'inbox' ? undefined : todayDate,
      inInbox: viewMode === 'inbox',
    });
    setQuickTitle('');
  };

  // Counts for tabs
  const activeCount = db.tasks.filter(
    (t) => !t.archived && !t.inInbox && t.status !== 'Completed'
  ).length;
  const inboxCount = db.tasks.filter(
    (t) => !t.archived && t.inInbox && t.status !== 'Completed'
  ).length;
  const recurringCount = db.tasks.filter(
    (t) => !t.archived && t.recurrence && t.recurrence.frequency !== 'none'
  ).length;
  const completedCount =
    db.tasks.filter((t) => !t.archived && t.status === 'Completed').length +
    db.recurringOccurrences.filter((o) => o.status === 'Completed').length;

  const filteredTasks = useMemo(() => {
    return db.tasks
      .filter((t) => {
        if (t.archived) return false;

        if (viewMode === 'active') {
          if (t.inInbox || t.status === 'Completed') return false;
        } else if (viewMode === 'inbox') {
          if (!t.inInbox || t.status === 'Completed') return false;
        } else if (viewMode === 'recurring') {
          if (!t.recurrence || t.recurrence.frequency === 'none') return false;
        } else if (viewMode === 'completed') {
          if (t.status !== 'Completed') return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = t.title.toLowerCase().includes(q);
          const matchNotes = (t.notes || '').toLowerCase().includes(q);
          const matchCat = t.category.toLowerCase().includes(q);
          if (!matchTitle && !matchNotes && !matchCat) return false;
        }

        if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
        if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
        if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;

        if (dateFilter === 'today') {
          if (t.dueDate !== todayDate) return false;
        } else if (dateFilter === 'overdue') {
          if (!t.dueDate || diffInDays(t.dueDate, todayDate) <= 0) return false;
        } else if (dateFilter === 'upcoming_7d') {
          if (!t.dueDate) return false;
          const diff = diffInDays(todayDate, t.dueDate);
          if (diff < 0 || diff > 7) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'priority_first') {
          const sA =
            getCategoryPriorityScore(a.category) + getPriorityLevelScore(a.priority);
          const sB =
            getCategoryPriorityScore(b.category) + getPriorityLevelScore(b.priority);
          if (sB !== sA) return sB - sA;
          return (a.dueDate || '9999-99-99').localeCompare(b.dueDate || '9999-99-99');
        }
        if (sortBy === 'due_date') {
          return (a.dueDate || '9999-99-99').localeCompare(b.dueDate || '9999-99-99');
        }
        if (sortBy === 'duration_asc') {
          return (a.estimatedMinutes || 30) - (b.estimatedMinutes || 30);
        }
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [
    db.tasks,
    viewMode,
    searchQuery,
    categoryFilter,
    priorityFilter,
    statusFilter,
    dateFilter,
    sortBy,
    todayDate,
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Tasks, Quick Inbox & Recurring Rules
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Search, filter, prioritize, and manage all work, learning, and personal tasks
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCatchUpOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 text-xs font-bold inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" /> Catch-Up Mode
          </button>
          <button
            type="button"
            onClick={() =>
              openNewTaskModal({
                inInbox: viewMode === 'inbox',
                dueDate: viewMode === 'inbox' ? undefined : todayDate,
              })
            }
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> New Detailed Task
          </button>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setViewMode('active')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
            viewMode === 'active'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          Active Tasks ({activeCount})
        </button>
        <button
          type="button"
          onClick={() => setViewMode('inbox')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 transition-colors ${
            viewMode === 'inbox'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Inbox className="w-4 h-4" /> Quick Inbox ({inboxCount})
        </button>
        <button
          type="button"
          onClick={() => setViewMode('recurring')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 transition-colors ${
            viewMode === 'recurring'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Repeat className="w-4 h-4" /> Recurring Tasks ({recurringCount})
        </button>
        <button
          type="button"
          onClick={() => setViewMode('completed')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 transition-colors ${
            viewMode === 'completed'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" /> Completed History ({completedCount})
        </button>
      </div>

      {/* Title-Only Quick Add Form */}
      <form
        onSubmit={handleQuickTitleSubmit}
        className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-2"
      >
        <input
          type="text"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder={
            viewMode === 'inbox'
              ? 'Quick capture to Inbox (title only — decide schedule later)...'
              : 'Quick add task by title only (defaults to Today & Work & Projects)...'
          }
          className="flex-1 px-3 py-2 text-sm bg-transparent text-slate-900 dark:text-white focus:outline-none"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shrink-0"
        >
          {viewMode === 'inbox' ? '+ Save to Inbox' : '+ Quick Add'}
        </button>
      </form>

      {/* Search, Filter & Sort Controls */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
        <div className="lg:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks by title, notes, or category..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          aria-label="Filter by category"
        >
          <option value="ALL">All Categories</option>
          {db.settings.categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          aria-label="Filter by priority"
        >
          <option value="ALL">All Priorities</option>
          <option value="High">High Priority</option>
          <option value="Medium">Medium Priority</option>
          <option value="Low">Low Priority</option>
        </select>

        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value as DateFilter)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          aria-label="Filter by deadline"
        >
          <option value="all">All Dates</option>
          <option value="today">Due Today ({todayDate})</option>
          <option value="overdue">Overdue Only</option>
          <option value="upcoming_7d">Due in Next 7 Days</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          aria-label="Sort tasks"
        >
          <option value="priority_first">Sort: Category & Priority First</option>
          <option value="due_date">Sort: Due Date (Earliest)</option>
          <option value="duration_asc">Sort: Duration (Shortest First)</option>
          <option value="created_desc">Sort: Recently Created</option>
        </select>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No tasks match the current view or filters.
            </p>
            <p className="text-xs text-slate-500">
              Add a task using the quick bar above or clear active search filters.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isDone = task.status === 'Completed';
            const isOverdue =
              !isDone && task.dueDate && diffInDays(task.dueDate, todayDate) > 0;
            const isDueToday = !isDone && task.dueDate === todayDate;

            return (
              <div
                key={task.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isDone
                    ? 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200/70 dark:border-slate-800/70 opacity-75'
                    : isOverdue
                    ? 'bg-white dark:bg-slate-900 border-rose-300 dark:border-rose-800 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() =>
                      toggleTaskCompletion(
                        task.id,
                        task.dueDate || todayDate,
                        Boolean(task.recurrence && task.recurrence.frequency !== 'none')
                      )
                    }
                    className="mt-0.5 text-slate-400 hover:text-emerald-600 shrink-0"
                    aria-label={isDone ? `Reopen ${task.title}` : `Complete ${task.title}`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-sm font-bold ${
                          isDone
                            ? 'line-through text-slate-500'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {task.title}
                      </span>
                      {task.isDemo && <DemoBadge />}
                      {task.reminderEnabled && (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold"
                          title="In-app reminder active"
                        >
                          <Bell className="w-3 h-3" /> Reminder
                        </span>
                      )}
                    </div>

                    {task.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {task.notes}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 text-xs pt-0.5">
                      <CategoryBadge category={task.category} />
                      <PriorityBadge priority={task.priority} />
                      <StatusBadge status={task.status} />
                      <span className="text-slate-500 inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {task.estimatedMinutes}m
                      </span>
                      {task.dueDate && (
                        <span
                          className={`inline-flex items-center gap-1 font-medium ${
                            isOverdue
                              ? 'text-rose-600 dark:text-rose-400 font-bold'
                              : isDueToday
                              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                              : 'text-slate-500'
                          }`}
                        >
                          <Calendar className="w-3 h-3" />
                          {isOverdue
                            ? `Overdue (${formatReadableDate(task.dueDate)})`
                            : isDueToday
                            ? 'Due Today'
                            : formatReadableDate(task.dueDate)}
                          {task.dueTime
                            ? ` at ${formatTime12h(
                                task.dueTime,
                                db.settings.use12HourClock
                              )}`
                            : ''}
                        </span>
                      )}
                      {task.recurrence && task.recurrence.frequency !== 'none' && (
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold inline-flex items-center gap-1">
                          <Repeat className="w-3 h-3" /> Repeats: {task.recurrence.frequency}
                        </span>
                      )}
                      {task.completedAt && (
                        <span className="text-emerald-600 dark:text-emerald-400 text-[11px]">
                          Completed {formatTimestamp(task.completedAt, db.settings.timezone)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Task Actions */}
                <div className="flex flex-wrap items-center gap-1.5 shrink-0 text-xs">
                  {task.inInbox && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          updateTask(task.id, { inInbox: false, dueDate: todayDate })
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold"
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
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                      >
                        Next Mon
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTask(task);
                      setIsTaskModalOpen(true);
                    }}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Edit task"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Are you sure you want to permanently delete "${task.title}"?`
                        )
                      ) {
                        deleteTask(task.id);
                      }
                    }}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
