import React from 'react';
import { Priority, TaskStatus } from '../types';

export const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  const styles: Record<Priority, string> = {
    High: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/80',
    Medium:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/80',
    Low: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80',
  };

  const dotColors: Record<Priority, string> = {
    High: 'bg-rose-500',
    Medium: 'bg-amber-500',
    Low: 'bg-emerald-500',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${styles[priority]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColors[priority]}`} />
      {priority}
    </span>
  );
};

export const CategoryBadge: React.FC<{ category: string }> = ({ category }) => {
  const norm = category.toLowerCase();
  let cls =
    'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';

  if (norm.includes('work') || norm.includes('project')) {
    cls =
      'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/70 dark:text-indigo-300 dark:border-indigo-800/80';
  } else if (norm.includes('finance')) {
    cls =
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800/80';
  } else if (norm.includes('learn') || norm.includes('skill')) {
    cls =
      'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/70 dark:text-violet-300 dark:border-violet-800/80';
  } else if (norm.includes('health') || norm.includes('fitness')) {
    cls =
      'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/70 dark:text-cyan-300 dark:border-cyan-800/80';
  } else if (norm === 'personal') {
    cls =
      'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/70 dark:text-sky-300 dark:border-sky-800/80';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${cls}`}
    >
      {category}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: TaskStatus | 'Skipped' }> = ({ status }) => {
  const map: Record<string, string> = {
    'Not started': 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    'In progress': 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300',
    Completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300',
    Skipped: 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        map[status] || map['Not started']
      }`}
    >
      {status}
    </span>
  );
};

export const DemoBadge: React.FC = () => (
  <span
    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
    title="Sample demo record — can be edited, deleted, or cleared anytime"
  >
    Demo
  </span>
);
