import React, { useState } from 'react';
import { X, Sparkles, Clock, Globe, Palette, Layers, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BRAND_CONFIG } from '../config/brandConfig';

export const OnboardingModal: React.FC = () => {
  const {
    db,
    isOnboardingOpen,
    setIsOnboardingOpen,
    effectivePlanningStartMonday,
    updateSettings,
    saveScheduleBlock,
    deleteScheduleBlock,
    clearToBlankWorkspace,
    resetToDemoData,
  } = useApp();

  const s = db.settings;

  const [userName, setUserName] = useState(s.userName || '');
  const [timezone, setTimezone] = useState(s.timezone);
  const [morningStart, setMorningStart] = useState(s.morningWorkStart);
  const [afternoonEnd, setAfternoonEnd] = useState(s.afternoonWorkEnd);
  const [wakeUpTime, setWakeUpTime] = useState(s.wakeUpTime);
  const [bedtime, setBedtime] = useState(s.bedtime);
  const [planningStart, setPlanningStart] = useState(effectivePlanningStartMonday);
  const [theme, setTheme] = useState<'light' | 'dark'>(s.theme);
  const [workspaceMode, setWorkspaceMode] = useState<'keep_demo' | 'blank'>('keep_demo');

  // Optional custom commitment draft
  const [commTitle, setCommTitle] = useState('');
  const [commStart, setCommStart] = useState('11:00');
  const [commEnd, setCommEnd] = useState('12:00');

  if (!isOnboardingOpen) return null;

  const handleSkip = () => {
    updateSettings({ onboardingCompleted: true });
    setIsOnboardingOpen(false);
  };

  const handleAddCommitment = () => {
    if (!commTitle.trim()) return;
    saveScheduleBlock({
      id: `custom_comm_${Date.now()}`,
      title: commTitle.trim(),
      type: 'commitment',
      startTime: commStart,
      endTime: commEnd,
      daysOfWeek: [1, 2, 3, 4, 5],
      enabled: true,
      note: 'User-configured fixed commitment',
    });
    setCommTitle('');
  };

  const handleSaveOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      userName: userName.trim(),
      timezone,
      morningWorkStart: morningStart,
      afternoonWorkEnd: afternoonEnd,
      wakeUpTime,
      bedtime,
      initialPlanningDateOverride: planningStart,
      theme,
      onboardingCompleted: true,
    });

    if (workspaceMode === 'blank') {
      clearToBlankWorkspace();
    } else if (!db.isDemoActive && db.tasks.length === 0) {
      resetToDemoData();
    }

    setIsOnboardingOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center">
              {BRAND_CONFIG.logoLetter}
            </div>
            <div>
              <h2 id="onboarding-title" className="text-base font-bold text-slate-900 dark:text-white">
                Welcome to {BRAND_CONFIG.productName} — Customize Your Workspace
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Optional setup — skip anytime or adjust later in Settings
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700"
          >
            Skip Setup
          </button>
        </div>

        <form onSubmit={handleSaveOnboarding} className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* 1. Profile & Timezone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Display Name (Optional)
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g., Alex"
                className="w-full df-input text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                <Globe className="w-3.5 h-3.5 inline mr-1 text-indigo-600" />
                Preferred Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full df-input text-xs sm:text-sm"
              >
                {BRAND_CONFIG.supportedTimezones.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Working Hours & Daily Bounds */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Clock className="w-4 h-4 text-indigo-600" />
              Working Hours & Daily Boundaries
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Workday Start
                </label>
                <input
                  type="time"
                  value={morningStart}
                  onChange={(e) => setMorningStart(e.target.value)}
                  className="w-full df-input"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Workday End
                </label>
                <input
                  type="time"
                  value={afternoonEnd}
                  onChange={(e) => setAfternoonEnd(e.target.value)}
                  className="w-full df-input"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Wake-Up (Opt)
                </label>
                <input
                  type="time"
                  value={wakeUpTime}
                  onChange={(e) => setWakeUpTime(e.target.value)}
                  className="w-full df-input"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Bedtime (Opt)
                </label>
                <input
                  type="time"
                  value={bedtime}
                  onChange={(e) => setBedtime(e.target.value)}
                  className="w-full df-input"
                />
              </div>
            </div>
          </div>

          {/* 3. Optional Fixed Commitments */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
            <div className="font-bold text-slate-900 dark:text-white">
              Optional Fixed Commitments (Meetings, Classes, or Appointments)
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={commTitle}
                onChange={(e) => setCommTitle(e.target.value)}
                placeholder="e.g., Morning Standup or Lecture"
                className="flex-1 min-w-[160px] df-input"
              />
              <input
                type="time"
                value={commStart}
                onChange={(e) => setCommStart(e.target.value)}
                className="df-input"
              />
              <input
                type="time"
                value={commEnd}
                onChange={(e) => setCommEnd(e.target.value)}
                className="df-input"
              />
              <button
                type="button"
                onClick={handleAddCommitment}
                className="px-3 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            {db.scheduleBlocks.length > 0 && (
              <div className="space-y-1 pt-1">
                {db.scheduleBlocks.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  >
                    <span>
                      <strong>{b.title}</strong> ({b.startTime}–{b.endTime})
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteScheduleBlock(b.id)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. Planning Start Date, Theme & Demo Data Choice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Weekly Planner Start Date
              </label>
              <input
                type="date"
                value={planningStart}
                onChange={(e) => setPlanningStart(e.target.value)}
                className="w-full df-input"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                <Palette className="w-3.5 h-3.5 inline mr-1 text-indigo-600" />
                Appearance Theme
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
                className="w-full df-input"
              >
                <option value="light">Light Theme</option>
                <option value="dark">Dark Theme</option>
              </select>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/70 space-y-2 text-xs">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              Initial Workspace Data
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="wsMode"
                  checked={workspaceMode === 'keep_demo'}
                  onChange={() => setWorkspaceMode('keep_demo')}
                  className="mt-0.5"
                />
                <span>
                  <strong>Explore with Sample Demo Data (Recommended):</strong> Keep coherent sample projects, tasks, habits, and goals loaded.
                </span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="wsMode"
                  checked={workspaceMode === 'blank'}
                  onChange={() => setWorkspaceMode('blank')}
                  className="mt-0.5"
                />
                <span>
                  <strong>Start with Blank Workspace:</strong> Clear sample items and start fresh immediately.
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={handleSkip} className="df-btn-secondary text-xs">
              Skip for Now
            </button>
            <button type="submit" className="df-btn-primary text-xs sm:text-sm inline-flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Save Preferences & Open {BRAND_CONFIG.productName}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
