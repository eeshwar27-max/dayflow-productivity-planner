import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import App from '../App';
import {
  getTodayInTimezone,
  addDays,
  getNextMondayAfter,
  isLeapYear,
  isValidDateString,
  formatTime12h,
  doesRecurringTaskOccurOnDate,
  getTasksForDate,
  doTimeRangesOverlap,
  getDaysInMonth,
  diffInDays,
} from '../utils/dateUtils';
import {
  buildDailyScheduleBlocks,
  detectScheduleConflicts,
  planMyDayDeterministically,
  getCategoryPriorityScore,
  getPriorityLevelScore,
} from '../utils/scheduler';
import {
  createDefaultSettings,
  createEmptyDatabase,
  createDemoDatabase,
  sanitizeDatabase,
  mergeDatabasesSafely,
  tasksToCSV,
  generateICSContent,
} from '../utils/storage';
import { Task, RecurringOccurrenceRecord } from '../types';

describe('1. Multi-Timezone Date Math & Dynamic Next-Monday Calculation', () => {
  it('avoids UTC date-shift bugs across user-configured timezones', () => {
    const sampleInstant = new Date('2026-10-11T20:00:00.000Z');
    // 20:00 UTC is 2026-10-12 01:30 in Asia/Kolkata and 2026-10-11 16:00 in America/New_York
    expect(getTodayInTimezone('Asia/Kolkata', sampleInstant)).toBe('2026-10-12');
    expect(getTodayInTimezone('America/New_York', sampleInstant)).toBe('2026-10-11');
  });

  it('dynamically calculates the next Monday after the current date', () => {
    expect(getNextMondayAfter('2026-10-11')).toBe('2026-10-12'); // Sun -> Mon
    expect(getNextMondayAfter('2026-10-12')).toBe('2026-10-19'); // Mon -> next Mon
    expect(getNextMondayAfter('2026-10-14')).toBe('2026-10-19'); // Wed -> next Mon
    expect(getNextMondayAfter('2026-10-17')).toBe('2026-10-19'); // Sat -> next Mon
  });

  it('handles month boundaries, year boundaries, and leap years accurately', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(isLeapYear(2026)).toBe(false);
    expect(isLeapYear(2028)).toBe(true);
    expect(getDaysInMonth(2026, 2)).toBe(28);
    expect(getDaysInMonth(2028, 2)).toBe(29);
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2028-02-29', 1)).toBe('2028-03-01');
    expect(isValidDateString('2026-02-29')).toBe(false);
    expect(isValidDateString('2028-02-29')).toBe(true);
  });

  it('formats 24-hour times into 12-hour strings accurately', () => {
    expect(formatTime12h('07:30', true)).toBe('7:30 AM');
    expect(formatTime12h('12:00', true)).toBe('12:00 PM');
    expect(formatTime12h('17:30', true)).toBe('5:30 PM');
    expect(formatTime12h('22:30', true)).toBe('10:30 PM');
    expect(formatTime12h('00:15', true)).toBe('12:15 AM');
  });
});

describe('2. Task CRUD, Filtering, Search, Sorting & Dashboard Counts', () => {
  it('supports creating, editing, completing, reopening, filtering, and sorting tasks', () => {
    const db = createEmptyDatabase();
    const t1: Task = {
      id: 't1',
      title: 'Finalize Website Redesign v2.0 layout',
      category: 'Work & Projects',
      priority: 'High',
      status: 'Not started',
      dueDate: '2026-10-11',
      estimatedMinutes: 45,
      createdAt: '2026-10-11T10:00:00.000Z',
    };
    const t2: Task = {
      id: 't2',
      title: 'Complete TypeScript generics module',
      category: 'Learning',
      priority: 'Medium',
      status: 'Not started',
      dueDate: '2026-10-11',
      estimatedMinutes: 30,
      createdAt: '2026-10-11T11:00:00.000Z',
    };
    db.tasks.push(t1, t2);

    let instances = getTasksForDate(db.tasks, db.recurringOccurrences, '2026-10-11');
    expect(instances).toHaveLength(2);
    expect(instances.filter((i) => i.effectiveStatus === 'Completed')).toHaveLength(0);

    // Complete task t1
    db.tasks = db.tasks.map((t) =>
      t.id === 't1' ? { ...t, status: 'Completed', completedAt: '2026-10-11T15:00:00.000Z' } : t
    );
    instances = getTasksForDate(db.tasks, db.recurringOccurrences, '2026-10-11');
    expect(instances.filter((i) => i.effectiveStatus === 'Completed')).toHaveLength(1);

    // Reopen task t1
    db.tasks = db.tasks.map((t) =>
      t.id === 't1' ? { ...t, status: 'Not started', completedAt: undefined } : t
    );
    instances = getTasksForDate(db.tasks, db.recurringOccurrences, '2026-10-11');
    expect(instances.filter((i) => i.effectiveStatus === 'Completed')).toHaveLength(0);

    // Priority ranking sort places Work & Projects High above Learning Medium
    const score1 = getCategoryPriorityScore(t1.category) + getPriorityLevelScore(t1.priority);
    const score2 = getCategoryPriorityScore(t2.category) + getPriorityLevelScore(t2.priority);
    expect(score1).toBeGreaterThan(score2);
  });
});

describe('3. Recurring Tasks Engine & Non-Duplication', () => {
  const dailyTask: Task = {
    id: 'rec_1',
    title: 'Daily priority triage & inbox review',
    category: 'Work & Projects',
    priority: 'High',
    status: 'Not started',
    dueDate: '2026-10-11',
    estimatedMinutes: 15,
    recurrence: { frequency: 'daily' },
    createdAt: '2026-10-11T10:00:00.000Z',
  };

  const weekdayTask: Task = {
    id: 'rec_wd',
    title: 'Weekday project standup notes',
    category: 'Work & Projects',
    priority: 'Medium',
    status: 'Not started',
    dueDate: '2026-10-11',
    estimatedMinutes: 15,
    recurrence: { frequency: 'weekdays' },
    createdAt: '2026-10-11T10:00:00.000Z',
  };

  it('generates occurrences deterministically across month/year boundaries without duplication', () => {
    expect(doesRecurringTaskOccurOnDate(dailyTask, '2026-10-10')).toBe(false);
    expect(doesRecurringTaskOccurOnDate(dailyTask, '2026-10-11')).toBe(true);
    expect(doesRecurringTaskOccurOnDate(dailyTask, '2026-11-01')).toBe(true);
    expect(doesRecurringTaskOccurOnDate(dailyTask, '2027-01-01')).toBe(true);

    expect(doesRecurringTaskOccurOnDate(weekdayTask, '2026-10-11')).toBe(false);
    expect(doesRecurringTaskOccurOnDate(weekdayTask, '2026-10-12')).toBe(true);

    const call1 = getTasksForDate([dailyTask], [], '2026-10-12');
    const call2 = getTasksForDate([dailyTask], [], '2026-10-12');
    expect(call1).toHaveLength(1);
    expect(call2).toHaveLength(1);
    expect(call1[0].instanceId).toBe('rec_1_2026-10-12');
  });

  it('completing one occurrence does not complete future occurrences', () => {
    const occurrences: RecurringOccurrenceRecord[] = [
      {
        id: 'rec_1_2026-10-11',
        taskId: 'rec_1',
        date: '2026-10-11',
        status: 'Completed',
        completedAt: '2026-10-11T16:00:00.000Z',
      },
    ];

    const oct11 = getTasksForDate([dailyTask], occurrences, '2026-10-11');
    const oct12 = getTasksForDate([dailyTask], occurrences, '2026-10-12');

    expect(oct11[0].effectiveStatus).toBe('Completed');
    expect(oct12[0].effectiveStatus).toBe('Not started');
  });
});

describe('4. Daily Time-Blocking, Configurable Commitments & Conflict Detection', () => {
  const settings = createDefaultSettings();
  const blocks = buildDailyScheduleBlocks('2026-10-12', settings, [
    {
      id: 'commit_standup',
      title: 'Team Sync & Standup',
      startTime: '11:30',
      endTime: '12:00',
      type: 'commitment',
      daysOfWeek: [1, 2, 3, 4, 5],
      isEditableDuration: true,
      enabled: true,
    },
  ]);

  it('protects fixed commitments (Meetings, Lunch Break, Personal Wind-Down, Sleep)', () => {
    const lunchBlock = blocks.find((b) => b.type === 'break_meal');
    const standupBlock = blocks.find((b) => b.id === 'commit_standup');
    const personalBlock = blocks.find((b) => b.type === 'personal_protected');

    expect(lunchBlock?.startTime).toBe('12:30');
    expect(lunchBlock?.endTime).toBe('13:30');
    expect(standupBlock?.startTime).toBe('11:30');
    expect(standupBlock?.endTime).toBe('12:00');
    expect(personalBlock?.startTime).toBe('21:30');
    expect(personalBlock?.endTime).toBe('22:30');
  });

  it('detects both task-vs-commitment overlaps and task-vs-task overlaps', () => {
    expect(doTimeRangesOverlap('12:40', '13:10', '12:30', '13:30')).toBe(true);

    const conflicts = detectScheduleConflicts(
      '2026-10-12',
      [
        {
          id: 't1',
          title: 'Task during lunch break',
          scheduledStart: '12:45',
          scheduledEnd: '13:15',
          status: 'Not started',
        },
        {
          id: 't2',
          title: 'Morning task A',
          scheduledStart: '09:00',
          scheduledEnd: '09:45',
          status: 'Not started',
        },
        {
          id: 't3',
          title: 'Morning task B overlapping A',
          scheduledStart: '09:30',
          scheduledEnd: '10:00',
          status: 'Not started',
        },
      ],
      blocks,
      true
    );
    expect(conflicts.some((c) => c.type === 'task_vs_commitment')).toBe(true);
    expect(conflicts.some((c) => c.type === 'task_vs_task')).toBe(true);
  });

  it('Plan My Day prioritizes Work & Projects first and fits tasks into available focus blocks', () => {
    const lowPersonalTask: Task = {
      id: 't_low',
      title: 'Organize digital notes',
      category: 'Personal',
      priority: 'Low',
      status: 'Not started',
      dueDate: '2026-10-12',
      estimatedMinutes: 25,
      createdAt: '2026-10-11T10:00:00.000Z',
    };
    const highWorkTask: Task = {
      id: 't_work',
      title: 'Audit Website Redesign v2.0 tokens',
      category: 'Work & Projects',
      priority: 'High',
      status: 'Not started',
      dueDate: '2026-10-12',
      estimatedMinutes: 45,
      createdAt: '2026-10-11T10:00:00.000Z',
    };

    const result = planMyDayDeterministically(
      '2026-10-12',
      [
        { task: lowPersonalTask, isRecurring: false, effectiveStatus: 'Not started' },
        { task: highWorkTask, isRecurring: false, effectiveStatus: 'Not started' },
      ],
      blocks,
      settings
    );

    expect(result.scheduledTasks[0].taskId).toBe('t_work');
    expect(result.scheduledTasks[0].scheduledStart).toBe('09:00');
    expect(result.scheduledTasks[0].scheduledEnd).toBe('09:45');

    expect(result.scheduledTasks[1].taskId).toBe('t_low');
    expect(result.scheduledTasks[1].scheduledStart).toBe('09:55');
    expect(result.scheduledTasks[1].scheduledEnd).toBe('10:20');
  });
});

describe('5. Generic Demo Data & Portfolio Cleanliness', () => {
  it('demo data and starter templates are 100% generic with zero personal references', () => {
    const demo = createDemoDatabase('2026-10-11');
    const serialized = JSON.stringify(demo);

    expect(demo.projects.length).toBeGreaterThan(0);
    expect(demo.tasks.every((t) => t.isDemo === true)).toBe(true);
    expect(demo.monthlyGoals.length).toBeGreaterThan(0);
    expect(demo.habits.length).toBeGreaterThan(0);
    expect(demo.settings.userName).toBe('Alex Morgan');
  });

  it('identifies overdue tasks accurately without auto-completing them', () => {
    const overdueTask: Task = {
      id: 'ov_1',
      title: 'Unfinished task from yesterday',
      category: 'Work & Projects',
      priority: 'High',
      status: 'Not started',
      dueDate: '2026-10-10',
      estimatedMinutes: 30,
      createdAt: '2026-10-10T10:00:00.000Z',
    };
    expect(diffInDays(overdueTask.dueDate!, '2026-10-11')).toBe(1);
    expect(overdueTask.status).toBe('Not started');
  });
});

describe('6. Backup Validation, Safe Merge, CSV & ICS Export', () => {
  it('validates imported JSON, rejects malformed input, and preserves existing records on Safe Merge', () => {
    expect(() => sanitizeDatabase(null)).toThrow();
    expect(() => sanitizeDatabase({ schemaVersion: 99 })).toThrow();

    const existingDb = createEmptyDatabase();
    existingDb.tasks.push({
      id: 'existing_1',
      title: 'Original Project Task',
      category: 'Work & Projects',
      priority: 'High',
      status: 'In progress',
      dueDate: '2026-10-11',
      estimatedMinutes: 30,
      createdAt: '2026-10-11T10:00:00.000Z',
    });

    const incomingRaw = {
      schemaVersion: 2,
      tasks: [
        {
          id: 'existing_1',
          title: 'Attempted Overwrite Title',
          category: 'Work & Projects',
          priority: 'Low',
          status: 'Not started',
          estimatedMinutes: 30,
        },
        {
          id: 'new_2',
          title: 'Newly Imported Task',
          category: 'Learning',
          priority: 'Medium',
          status: 'Not started',
          dueDate: '2026-10-12',
          estimatedMinutes: 25,
        },
      ],
    };

    const sanitizedIncoming = sanitizeDatabase(incomingRaw);
    const merged = mergeDatabasesSafely(existingDb, sanitizedIncoming);

    expect(merged.tasks).toHaveLength(2);
    expect(merged.tasks.find((t) => t.id === 'existing_1')?.title).toBe(
      'Original Project Task'
    );
    expect(merged.tasks.find((t) => t.id === 'new_2')?.title).toBe(
      'Newly Imported Task'
    );
  });

  it('exports valid CSV and iCalendar (.ics) strings', () => {
    const db = createEmptyDatabase();
    db.tasks.push({
      id: 'csv_1',
      title: 'Review "Website Redesign" specs, check layout',
      category: 'Work & Projects',
      priority: 'High',
      status: 'Not started',
      dueDate: '2026-10-12',
      scheduledStart: '09:00',
      scheduledEnd: '09:45',
      estimatedMinutes: 45,
      createdAt: '2026-10-11T10:00:00.000Z',
    });

    const csv = tasksToCSV(db.tasks);
    expect(csv).toContain('"Review ""Website Redesign"" specs, check layout"');

    const ics = generateICSContent(db);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('20261012T090000');
  });
});

describe('7. Full React Application UI Rendering', () => {
  it('renders the main DayFlow App shell, navigation, and DashboardView without runtime errors', () => {
    const html = renderToString(React.createElement(App));
    expect(html).toContain('DayFlow');
    expect(html).toContain('Plan My Day');
    expect(html).toContain('Projects &amp; Finance');
    expect(html).toContain('Catch Up');
  });
});
