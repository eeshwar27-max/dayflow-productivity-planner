import { AppSettings, ScheduleBlock, Task } from '../types';
import {
  getDayOfWeek,
  timeToMinutes,
  minutesToTime,
  doTimeRangesOverlap,
  diffInDays,
  formatTime12h,
} from './dateUtils';

export interface ConflictWarning {
  id: string;
  type: 'task_vs_commitment' | 'task_vs_task';
  message: string;
  taskIds: string[];
  commitmentId?: string;
}

export interface DayPlanResult {
  scheduledTasks: Array<{
    taskId: string;
    isRecurring: boolean;
    date: string;
    scheduledStart: string;
    scheduledEnd: string;
    reason: string;
  }>;
  unscheduledTasks: Array<{
    taskId: string;
    title: string;
    estimatedMinutes: number;
    reason: string;
  }>;
  availableWindows: Array<{
    label: string;
    startTime: string;
    endTime: string;
    totalMinutes: number;
  }>;
}

/**
 * Generates daily schedule blocks from user's configured working hours, breaks,
 * personal wind-down preferences, and custom fixed commitments.
 */
export function buildDailyScheduleBlocks(
  dateStr: string,
  settings: AppSettings,
  customBlocks: ScheduleBlock[]
): ScheduleBlock[] {
  const dow = getDayOfWeek(dateStr); // 0 = Sun, 6 = Sat
  const isWeekend = dow === 0 || dow === 6;

  const blocks: ScheduleBlock[] = [];

  if (!isWeekend) {
    // 1. Morning Routine
    if (timeToMinutes(settings.morningWorkStart) > timeToMinutes(settings.wakeUpTime)) {
      blocks.push({
        id: 'sys_morning_routine',
        title: 'Morning Routine & Preparation',
        type: 'routine',
        startTime: settings.wakeUpTime,
        endTime: settings.morningWorkStart,
        daysOfWeek: [1, 2, 3, 4, 5],
        enabled: true,
      });
    }

    // 2. Morning Work Window
    blocks.push({
      id: 'sys_morning_work',
      title: 'Morning Focus Block',
      type: 'work_window',
      startTime: settings.morningWorkStart,
      endTime: settings.morningWorkEnd,
      daysOfWeek: [1, 2, 3, 4, 5],
      note: 'Primary deep work window for high-priority tasks and projects.',
      enabled: true,
    });

    // 3. Midday Lunch & Break
    blocks.push({
      id: 'sys_lunch_break',
      title: 'Lunch & Midday Break',
      type: 'break_meal',
      startTime: settings.lunchStart,
      endTime: settings.lunchEnd,
      daysOfWeek: [1, 2, 3, 4, 5],
      note: 'Protected break — tasks are not auto-scheduled over meals.',
      enabled: true,
    });

    // 4. Afternoon Work Window
    blocks.push({
      id: 'sys_afternoon_work',
      title: 'Afternoon Work & Collaboration Block',
      type: 'work_window',
      startTime: settings.afternoonWorkStart,
      endTime: settings.afternoonWorkEnd,
      daysOfWeek: [1, 2, 3, 4, 5],
      note: 'Core afternoon window for project execution, learning, and follow-ups.',
      enabled: true,
    });

    // 5. Optional Evening Focus Window
    if (settings.enableEveningFocusSession) {
      blocks.push({
        id: 'sys_evening_work',
        title: 'Optional Evening Focus Session',
        type: 'work_window',
        startTime: settings.eveningFocusStart,
        endTime: settings.eveningFocusEnd,
        daysOfWeek: [1, 2, 3, 4, 5],
        note: 'Optional evening window for learning, personal projects, or light wrap-up.',
        enabled: true,
      });
    }
  } else {
    // Weekend Schedule
    blocks.push({
      id: 'sys_weekend_morning',
      title: 'Morning Routine & Recharge',
      type: 'routine',
      startTime: settings.wakeUpTime,
      endTime: settings.enableWeekendSessions ? settings.weekendWorkStart : '10:30',
      daysOfWeek: [0, 6],
      enabled: true,
    });

    if (settings.enableWeekendSessions) {
      blocks.push({
        id: 'sys_weekend_work',
        title: 'Weekend Planning & Personal Projects Window',
        type: 'work_window',
        startTime: settings.weekendWorkStart,
        endTime: settings.weekendWorkEnd,
        daysOfWeek: [0, 6],
        note: 'Configurable weekend block for personal goals, learning, or weekly planning.',
        enabled: true,
      });
    }
  }

  // Protected Personal Wind-Down before Bedtime
  const bedMin = timeToMinutes(settings.bedtime);
  const windDownMins = Math.max(15, Math.min(180, settings.personalWindDownMinutes || 60));
  const windDownStartMin = Math.max(0, bedMin - windDownMins);

  blocks.push({
    id: 'sys_personal_winddown',
    title: 'Protected Personal Time & Wind-Down',
    type: 'personal_protected',
    startTime: minutesToTime(windDownStartMin),
    endTime: settings.bedtime,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    note: 'Strictly protected personal & rest time — never overwritten by automatic task scheduling.',
    enabled: true,
  });

  // Sleep / Bedtime
  blocks.push({
    id: 'sys_sleep',
    title: 'Sleep & Rest',
    type: 'sleep',
    startTime: settings.bedtime,
    endTime: '23:59',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    enabled: true,
  });

  // Include user-configured custom fixed commitments / blocks for this day of week
  for (const cb of customBlocks) {
    if (cb.enabled && cb.daysOfWeek.includes(dow)) {
      blocks.push(cb);
    }
  }

  return blocks.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
}

/**
 * Priority rank for general categories:
 * 1. Work & Projects
 * 2. Finance
 * 3. Learning
 * 4. Health & Fitness
 * 5. Personal / Custom
 */
export function getCategoryPriorityScore(category: string): number {
  const normalized = category.trim().toLowerCase();
  if (normalized.includes('work') || normalized.includes('project')) return 100;
  if (normalized.includes('finance')) return 85;
  if (normalized.includes('learn') || normalized.includes('skill')) return 75;
  if (normalized.includes('health') || normalized.includes('fitness')) return 65;
  if (normalized === 'personal') return 55;
  return 45;
}

export function getPriorityLevelScore(priority: Task['priority']): number {
  switch (priority) {
    case 'High':
      return 35;
    case 'Medium':
      return 20;
    case 'Low':
      return 10;
    default:
      return 10;
  }
}

/**
 * Detects conflicts on a given date:
 * 1. Scheduled tasks overlapping non-work fixed commitments (meetings, meals, personal time, sleep).
 * 2. Scheduled tasks overlapping each other.
 */
export function detectScheduleConflicts(
  dateStr: string,
  tasksOnDate: Array<{
    id: string;
    title: string;
    scheduledStart?: string;
    scheduledEnd?: string;
    status: string;
  }>,
  scheduleBlocks: ScheduleBlock[],
  use12Hour: boolean = true
): ConflictWarning[] {
  const warnings: ConflictWarning[] = [];
  const scheduled = tasksOnDate.filter(
    (t) => t.scheduledStart && t.scheduledEnd && t.status !== 'Skipped'
  );

  const nonWorkBlocks = scheduleBlocks.filter((b) => b.enabled && b.type !== 'work_window');

  // 1. Check task vs fixed commitment
  for (const task of scheduled) {
    for (const block of nonWorkBlocks) {
      if (
        doTimeRangesOverlap(
          task.scheduledStart!,
          task.scheduledEnd!,
          block.startTime,
          block.endTime
        )
      ) {
        warnings.push({
          id: `conflict_${task.id}_${block.id}`,
          type: 'task_vs_commitment',
          taskIds: [task.id],
          commitmentId: block.id,
          message: `"${task.title}" (${formatTime12h(task.scheduledStart, use12Hour)}–${formatTime12h(task.scheduledEnd, use12Hour)}) overlaps with commitment "${block.title}" (${formatTime12h(block.startTime, use12Hour)}–${formatTime12h(block.endTime, use12Hour)}).`,
        });
      }
    }
  }

  // 2. Check task vs task
  for (let i = 0; i < scheduled.length; i++) {
    for (let j = i + 1; j < scheduled.length; j++) {
      const a = scheduled[i];
      const b = scheduled[j];
      if (
        doTimeRangesOverlap(a.scheduledStart!, a.scheduledEnd!, b.scheduledStart!, b.scheduledEnd!)
      ) {
        warnings.push({
          id: `conflict_${a.id}_${b.id}`,
          type: 'task_vs_task',
          taskIds: [a.id, b.id],
          message: `"${a.title}" (${formatTime12h(a.scheduledStart, use12Hour)}–${formatTime12h(a.scheduledEnd, use12Hour)}) overlaps with "${b.title}" (${formatTime12h(b.scheduledStart, use12Hour)}–${formatTime12h(b.scheduledEnd, use12Hour)}).`,
        });
      }
    }
  }

  return warnings;
}

/**
 * Deterministic "Plan My Day" scheduler.
 * Respects all fixed commitments, breaks, sleep, and protected personal time.
 * Fits estimated task durations + transition buffers into open work windows.
 */
export function planMyDayDeterministically(
  targetDate: string,
  candidateTasks: Array<{
    task: Task;
    isRecurring: boolean;
    effectiveStatus: string;
    existingStart?: string;
    existingEnd?: string;
  }>,
  scheduleBlocks: ScheduleBlock[],
  settings: AppSettings
): DayPlanResult {
  const workBlocks = scheduleBlocks.filter((b) => b.enabled && b.type === 'work_window');
  const nonWorkBlocks = scheduleBlocks.filter((b) => b.enabled && b.type !== 'work_window');

  const availableWindows = workBlocks.map((b) => ({
    label: b.title,
    startTime: b.startTime,
    endTime: b.endTime,
    totalMinutes: Math.max(0, timeToMinutes(b.endTime) - timeToMinutes(b.startTime)),
  }));

  const activeCandidates = candidateTasks.filter(
    (c) => c.effectiveStatus !== 'Completed' && c.effectiveStatus !== 'Skipped'
  );

  const scored = activeCandidates.map((item) => {
    const { task } = item;
    const catScore = getCategoryPriorityScore(task.category);
    const prioScore = getPriorityLevelScore(task.priority);

    let deadlineScore = 0;
    const reasonParts: string[] = [`${task.category}`];

    if (task.dueDate) {
      const daysUntilDue = diffInDays(targetDate, task.dueDate);
      if (daysUntilDue < 0) {
        deadlineScore = 50;
        reasonParts.push('Overdue');
      } else if (daysUntilDue === 0) {
        deadlineScore = 35;
        reasonParts.push('Due today');
      } else if (daysUntilDue <= 2) {
        deadlineScore = 20;
        reasonParts.push(`Due in ${daysUntilDue}d`);
      }
    }

    reasonParts.push(`${task.priority} priority (${task.estimatedMinutes}m)`);

    const totalScore = catScore + prioScore + deadlineScore;
    return {
      ...item,
      totalScore,
      reasonSummary: reasonParts.join(' • '),
    };
  });

  scored.sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    return a.task.estimatedMinutes - b.task.estimatedMinutes;
  });

  const windowCursors = workBlocks.map((b) => ({
    label: b.title,
    cursorMin: timeToMinutes(b.startTime),
    endMin: timeToMinutes(b.endTime),
    tasksAssignedCount: 0,
  }));

  const scheduledTasks: DayPlanResult['scheduledTasks'] = [];
  const unscheduledTasks: DayPlanResult['unscheduledTasks'] = [];
  const buffer = Math.max(0, settings.transitionBufferMinutes || 10);

  for (const item of scored) {
    const duration = Math.max(5, item.task.estimatedMinutes || settings.defaultTaskMinutes || 30);
    let placed = false;

    for (const win of windowCursors) {
      const neededBuffer = win.tasksAssignedCount > 0 ? buffer : 0;
      let proposedStart = win.cursorMin + neededBuffer;
      let proposedEnd = proposedStart + duration;

      // Ensure we don't overlap a custom fixed commitment inside a work window
      for (const fixed of nonWorkBlocks) {
        const fStart = timeToMinutes(fixed.startTime);
        const fEnd = timeToMinutes(fixed.endTime);
        if (proposedStart < fEnd && fStart < proposedEnd) {
          proposedStart = fEnd + buffer;
          proposedEnd = proposedStart + duration;
        }
      }

      if (proposedEnd <= win.endMin) {
        const startStr = minutesToTime(proposedStart);
        const endStr = minutesToTime(proposedEnd);
        scheduledTasks.push({
          taskId: item.task.id,
          isRecurring: item.isRecurring,
          date: targetDate,
          scheduledStart: startStr,
          scheduledEnd: endStr,
          reason: `${item.reasonSummary} → Scheduled in ${win.label}`,
        });
        win.cursorMin = proposedEnd;
        win.tasksAssignedCount += 1;
        placed = true;
        break;
      }
    }

    if (!placed) {
      unscheduledTasks.push({
        taskId: item.task.id,
        title: item.task.title,
        estimatedMinutes: duration,
        reason:
          availableWindows.length === 0
            ? 'No work windows enabled for this day.'
            : `Exceeds remaining available focus capacity (${duration}m needed) without overlapping commitments or protected personal time.`,
      });
    }
  }

  return {
    scheduledTasks,
    unscheduledTasks,
    availableWindows,
  };
}
