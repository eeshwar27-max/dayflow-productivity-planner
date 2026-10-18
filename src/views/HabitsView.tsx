import React, { useState } from 'react';
import {
  Activity,
  BookOpen,
  Plus,
  CheckCircle2,
  Circle,
  Flame,
  Trash2,
  Edit2,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Habit, SkillTrackerItem } from '../types';
import { addDays, formatReadableDate, getDayOfWeek } from '../utils/dateUtils';
import { DemoBadge } from '../components/Badge';

const WEEKDAYS_LIST = [
  { d: 1, label: 'Mon' },
  { d: 2, label: 'Tue' },
  { d: 3, label: 'Wed' },
  { d: 4, label: 'Thu' },
  { d: 5, label: 'Fri' },
  { d: 6, label: 'Sat' },
  { d: 0, label: 'Sun' },
];

export const HabitsView: React.FC = () => {
  const {
    db,
    todayDate,
    saveHabit,
    deleteHabit,
    toggleHabitCompletion,
    saveSkill,
    deleteSkill,
    toggleSkillPracticeTask,
    openNewTaskModal,
  } = useApp();

  const [section, setSection] = useState<'habits' | 'skills'>('habits');

  // Habit Form State
  const [isHabitFormOpen, setIsHabitFormOpen] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [habitName, setHabitName] = useState('');
  const [habitCategory, setHabitCategory] =
    useState<Habit['category']>('Fitness & Movement');
  const [habitScheduleType, setHabitScheduleType] =
    useState<Habit['scheduleType']>('daily');
  const [habitDays, setHabitDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [habitMinutes, setHabitMinutes] = useState<number>(25);
  const [habitNotes, setHabitNotes] = useState('');

  // Skill Form State
  const [isSkillFormOpen, setIsSkillFormOpen] = useState(false);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [skillName, setSkillName] = useState('');
  const [skillCategory, setSkillCategory] =
    useState<SkillTrackerItem['category']>('Engineering & Tech');
  const [skillObjective, setSkillObjective] = useState('');
  const [skillLevel, setSkillLevel] = useState('Intermediate');
  const [skillMilestone, setSkillMilestone] = useState('');
  const [skillStatus, setSkillStatus] =
    useState<SkillTrackerItem['status']>('Practicing');
  const [skillNotes, setSkillNotes] = useState('');
  const [practiceDraft, setPracticeDraft] = useState('');
  const [practiceList, setPracticeList] = useState<
    Array<{ id: string; title: string; completed: boolean }>
  >([]);

  // Last 7 days ending todayDate for the habit tracker matrix
  const last7Dates = Array.from({ length: 7 }, (_, idx) =>
    addDays(todayDate, -(6 - idx))
  );

  const isHabitScheduledOnDate = (habit: Habit, dateStr: string): boolean => {
    const dow = getDayOfWeek(dateStr);
    if (habit.scheduleType === 'daily') return true;
    if (habit.scheduleType === 'weekdays') return dow >= 1 && dow <= 5;
    return habit.daysOfWeek.includes(dow);
  };

  const isHabitCompletedOnDate = (habitId: string, dateStr: string): boolean => {
    return db.habitCompletions.some(
      (hc) => hc.habitId === habitId && hc.date === dateStr && hc.completed
    );
  };

  const calculateStreak = (habit: Habit): number => {
    let streak = 0;
    for (let i = 0; i < 60; i++) {
      const d = addDays(todayDate, -i);
      if (!isHabitScheduledOnDate(habit, d)) continue;
      if (isHabitCompletedOnDate(habit.id, d)) {
        streak++;
      } else {
        if (i === 0) continue;
        break;
      }
    }
    return streak;
  };

  const openHabitEditor = (h?: Habit) => {
    if (h) {
      setEditingHabitId(h.id);
      setHabitName(h.name);
      setHabitCategory(h.category);
      setHabitScheduleType(h.scheduleType);
      setHabitDays(h.daysOfWeek);
      setHabitMinutes(h.targetMinutes || 25);
      setHabitNotes(h.notes || '');
    } else {
      setEditingHabitId(null);
      setHabitName('');
      setHabitCategory('Fitness & Movement');
      setHabitScheduleType('daily');
      setHabitDays([0, 1, 2, 3, 4, 5, 6]);
      setHabitMinutes(25);
      setHabitNotes('');
    }
    setIsHabitFormOpen(true);
  };

  const handleSaveHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) return;
    const effectiveDays =
      habitScheduleType === 'daily'
        ? [0, 1, 2, 3, 4, 5, 6]
        : habitScheduleType === 'weekdays'
        ? [1, 2, 3, 4, 5]
        : habitDays;

    saveHabit({
      id: editingHabitId || `habit_${Date.now()}`,
      name: habitName.trim(),
      category: habitCategory,
      scheduleType: habitScheduleType,
      daysOfWeek: effectiveDays,
      targetMinutes: Number(habitMinutes) || undefined,
      notes: habitNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    });
    setIsHabitFormOpen(false);
  };

  const openSkillEditor = (s?: SkillTrackerItem) => {
    if (s) {
      setEditingSkillId(s.id);
      setSkillName(s.skillName);
      setSkillCategory(s.category);
      setSkillObjective(s.learningObjective);
      setSkillLevel(s.currentLevel || 'Intermediate');
      setSkillMilestone(s.targetMilestone);
      setSkillStatus(s.status);
      setSkillNotes(s.notesAndResources || '');
      setPracticeList(s.practiceTasks || []);
    } else {
      setEditingSkillId(null);
      setSkillName('');
      setSkillCategory('Engineering & Tech');
      setSkillObjective('');
      setSkillLevel('Intermediate');
      setSkillMilestone('');
      setSkillStatus('Practicing');
      setSkillNotes('');
      setPracticeList([]);
    }
    setIsSkillFormOpen(true);
  };

  const handleAddPracticeItem = () => {
    if (!practiceDraft.trim()) return;
    setPracticeList((prev) => [
      ...prev,
      { id: `pt_${Date.now()}_${prev.length}`, title: practiceDraft.trim(), completed: false },
    ]);
    setPracticeDraft('');
  };

  const handleSaveSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName.trim()) return;
    saveSkill({
      id: editingSkillId || `skill_${Date.now()}`,
      skillName: skillName.trim(),
      category: skillCategory,
      learningObjective: skillObjective.trim(),
      currentLevel: skillLevel.trim() || undefined,
      targetMilestone: skillMilestone.trim(),
      status: skillStatus,
      practiceTasks: practiceList,
      notesAndResources: skillNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    });
    setIsSkillFormOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Habits, Health & Skill Development
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Build sustainable daily habits and track structured skill-building milestones
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSection('habits');
              openHabitEditor();
            }}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> + New Habit
          </button>
          <button
            type="button"
            onClick={() => {
              setSection('skills');
              openSkillEditor();
            }}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4" /> + Add Learning Track
          </button>
        </div>
      </div>

      {/* Section Switcher */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setSection('habits')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 ${
            section === 'habits'
              ? 'bg-indigo-600 text-white'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" /> Health & Daily Habits ({db.habits.length})
        </button>
        <button
          type="button"
          onClick={() => setSection('skills')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 ${
            section === 'skills'
              ? 'bg-purple-600 text-white'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Learning & Skills ({db.skills.length})
        </button>
      </div>

      {/* SECTION 1: HEALTH & DAILY HABITS */}
      {section === 'habits' && (
        <div className="space-y-5">
          {isHabitFormOpen && (
            <form
              onSubmit={handleSaveHabit}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-500 shadow-md space-y-3 text-xs"
            >
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingHabitId ? 'Edit Habit' : 'Create Repeatable Daily Habit'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1">Habit Name *</label>
                  <input
                    type="text"
                    value={habitName}
                    onChange={(e) => setHabitName(e.target.value)}
                    placeholder="e.g., 30-Min Strength & Mobility Session"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  <select
                    value={habitCategory}
                    onChange={(e) => setHabitCategory(e.target.value as Habit['category'])}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Fitness & Movement">Fitness & Movement</option>
                    <option value="Health & Wellness">Health & Wellness</option>
                    <option value="Daily Routine">Daily Routine</option>
                    <option value="Mindfulness & Focus">Mindfulness & Focus</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Schedule</label>
                  <select
                    value={habitScheduleType}
                    onChange={(e) =>
                      setHabitScheduleType(e.target.value as Habit['scheduleType'])
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="daily">Every Day</option>
                    <option value="weekdays">Weekdays (Mon–Fri)</option>
                    <option value="selected_days">Custom Selected Days</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Target Duration (mins)</label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={habitMinutes}
                    onChange={(e) => setHabitMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Optional Notes</label>
                  <input
                    type="text"
                    value={habitNotes}
                    onChange={(e) => setHabitNotes(e.target.value)}
                    placeholder="Keep it simple and consistent..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              {habitScheduleType === 'selected_days' && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {WEEKDAYS_LIST.map((w) => (
                    <button
                      key={w.d}
                      type="button"
                      onClick={() =>
                        setHabitDays((prev) =>
                          prev.includes(w.d)
                            ? prev.filter((x) => x !== w.d)
                            : [...prev, w.d]
                        )
                      }
                      className={`px-2.5 py-1 rounded-lg font-bold ${
                        habitDays.includes(w.d)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsHabitFormOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-bold"
                >
                  Save Habit
                </button>
              </div>
            </form>
          )}

          {db.habits.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No habits configured yet.
              </p>
              <button
                type="button"
                onClick={() => openHabitEditor()}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
              >
                + Add First Daily Habit
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {db.habits.map((habit) => {
                const streak = calculateStreak(habit);
                const scheduledLast7 = last7Dates.filter((d) =>
                  isHabitScheduledOnDate(habit, d)
                );
                const completedLast7 = scheduledLast7.filter((d) =>
                  isHabitCompletedOnDate(habit.id, d)
                );
                const rate7d =
                  scheduledLast7.length > 0
                    ? Math.round((completedLast7.length / scheduledLast7.length) * 100)
                    : 0;

                return (
                  <div
                    key={habit.id}
                    className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 text-xs font-bold">
                          {habit.category}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {habit.name}
                        </h3>
                        {habit.isDemo && <DemoBadge />}
                        {habit.targetMinutes && (
                          <span className="text-xs text-slate-500 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {habit.targetMinutes}m
                          </span>
                        )}
                      </div>
                      {habit.notes && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {habit.notes}
                        </p>
                      )}
                      <div className="flex items-center gap-4 pt-1 text-xs">
                        <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                          <Flame className="w-4 h-4" /> {streak} day streak
                        </span>
                        <span className="text-slate-500">
                          7-day consistency: <strong>{rate7d}%</strong> ({completedLast7.length}/
                          {scheduledLast7.length})
                        </span>
                      </div>
                    </div>

                    {/* 7-Day Occurrence Checkboxes */}
                    <div className="flex flex-wrap items-center gap-2">
                      {last7Dates.map((d) => {
                        const scheduled = isHabitScheduledOnDate(habit, d);
                        const completed = isHabitCompletedOnDate(habit.id, d);
                        const isToday = d === todayDate;
                        const label = formatReadableDate(d, {
                          includeWeekday: true,
                          includeYear: false,
                        }).split(',')[0];

                        return (
                          <button
                            key={d}
                            type="button"
                            disabled={!scheduled}
                            onClick={() => toggleHabitCompletion(habit.id, d)}
                            className={`w-11 py-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-all ${
                              !scheduled
                                ? 'opacity-30 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                                : completed
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : isToday
                                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-slate-900 dark:text-white'
                                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                            title={`${d}: ${completed ? 'Completed' : 'Tap to complete'}`}
                          >
                            <span>{label}</span>
                            <span>{d.slice(8, 10)}</span>
                            {completed ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <Circle className="w-3.5 h-3.5 opacity-60" />
                            )}
                          </button>
                        );
                      })}

                      <div className="flex items-center gap-1 pl-2">
                        <button
                          type="button"
                          onClick={() => openHabitEditor(habit)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600"
                          title="Edit habit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteHabit(habit.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600"
                          title="Delete habit"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: LEARNING & SKILL DEVELOPMENT TRACKER */}
      {section === 'skills' && (
        <div className="space-y-5">
          {isSkillFormOpen && (
            <form
              onSubmit={handleSaveSkill}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-purple-500 shadow-md space-y-3 text-xs"
            >
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingSkillId ? 'Edit Skill Track' : 'Add Skill / Learning Track'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1">Skill Name *</label>
                  <input
                    type="text"
                    value={skillName}
                    onChange={(e) => setSkillName(e.target.value)}
                    placeholder="e.g., Advanced TypeScript & Design Systems"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  <select
                    value={skillCategory}
                    onChange={(e) =>
                      setSkillCategory(e.target.value as SkillTrackerItem['category'])
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Engineering & Tech">Engineering & Tech</option>
                    <option value="Design & Creative">Design & Creative</option>
                    <option value="Communication & Leadership">Communication & Leadership</option>
                    <option value="Other Skill">Other Skill</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Current Level</label>
                  <input
                    type="text"
                    value={skillLevel}
                    onChange={(e) => setSkillLevel(e.target.value)}
                    placeholder="Beginner / Intermediate / Advanced"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Progress Status</label>
                  <select
                    value={skillStatus}
                    onChange={(e) =>
                      setSkillStatus(e.target.value as SkillTrackerItem['status'])
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Not started">Not started</option>
                    <option value="Practicing">Practicing</option>
                    <option value="Applying in Projects">Applying in Projects</option>
                    <option value="Milestone Reached">Milestone Reached</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Target Milestone</label>
                  <input
                    type="text"
                    value={skillMilestone}
                    onChange={(e) => setSkillMilestone(e.target.value)}
                    placeholder="e.g., Ship accessible component library with 95%+ coverage"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Learning Objective</label>
                <input
                  type="text"
                  value={skillObjective}
                  onChange={(e) => setSkillObjective(e.target.value)}
                  placeholder="How this skill directly supports your career or projects..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              {/* Practice Tasks Builder */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="block font-semibold">Practical Drills / Practice Modules</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={practiceDraft}
                    onChange={(e) => setPracticeDraft(e.target.value)}
                    placeholder="Add a hands-on practice step..."
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                  <button
                    type="button"
                    onClick={handleAddPracticeItem}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 text-white font-semibold"
                  >
                    + Add Drill
                  </button>
                </div>
                {practiceList.length > 0 && (
                  <ul className="space-y-1 pt-1">
                    {practiceList.map((pt) => (
                      <li key={pt.id} className="flex items-center justify-between text-xs">
                        <span>• {pt.title}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setPracticeList((prev) => prev.filter((x) => x.id !== pt.id))
                          }
                          className="text-rose-500"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <label className="block font-semibold mb-1">Notes & Resource Links</label>
                <textarea
                  rows={2}
                  value={skillNotes}
                  onChange={(e) => setSkillNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSkillFormOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-purple-600 text-white font-bold"
                >
                  Save Skill
                </button>
              </div>
            </form>
          )}

          {db.skills.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No skills tracked yet.
              </p>
              <button
                type="button"
                onClick={() => openSkillEditor()}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold"
              >
                + Add First Learning Track
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {db.skills.map((skill) => {
                const doneDrills = skill.practiceTasks.filter((p) => p.completed).length;
                return (
                  <div
                    key={skill.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-xs font-bold">
                            {skill.category} • {skill.status}
                          </span>
                          {skill.isDemo && <DemoBadge />}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openSkillEditor(skill)}
                            className="p-1 text-slate-400 hover:text-indigo-600"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSkill(skill.id)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {skill.skillName}
                      </h3>
                      {skill.learningObjective && (
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          <strong>Objective:</strong> {skill.learningObjective}
                        </p>
                      )}
                      {skill.targetMilestone && (
                        <p className="text-xs text-purple-700 dark:text-purple-300 font-medium">
                          <strong>Target Milestone:</strong> {skill.targetMilestone}
                        </p>
                      )}
                    </div>

                    {/* Practice Tasks Checklist */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span>
                          Practice Drills ({doneDrills}/{skill.practiceTasks.length})
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            openNewTaskModal({
                              title: `Practice: ${skill.skillName}`,
                              category: 'Learning',
                              estimatedMinutes: 30,
                              dueDate: todayDate,
                            })
                          }
                          className="text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1"
                        >
                          Schedule 30m Session <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>

                      {skill.practiceTasks.map((pt) => (
                        <div
                          key={pt.id}
                          className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs"
                        >
                          <button
                            type="button"
                            onClick={() => toggleSkillPracticeTask(skill.id, pt.id)}
                            className="flex items-center gap-2 text-left"
                          >
                            {pt.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <span
                              className={
                                pt.completed
                                  ? 'line-through text-slate-400'
                                  : 'text-slate-800 dark:text-slate-200'
                              }
                            >
                              {pt.title}
                            </span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
