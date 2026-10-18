import React, { useState } from 'react';
import {
  Clock,
  Download,
  Upload,
  ShieldCheck,
  Bell,
  Palette,
  Calendar,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Database,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatTimestamp } from '../utils/dateUtils';
import { generateICSContent, tasksToCSV } from '../utils/storage';
import { BRAND_CONFIG } from '../config/brandConfig';
import { ScheduleBlock } from '../types';

export const SettingsView: React.FC = () => {
  const {
    db,
    todayDate,
    nextMondayDate,
    effectivePlanningStartMonday,
    saveStatus,
    updateSettings,
    saveScheduleBlock,
    deleteScheduleBlock,
    importBackupJSON,
    resetToDemoData,
    clearToBlankWorkspace,
    setIsOnboardingOpen,
  } = useApp();

  const s = db.settings;

  const [newCategory, setNewCategory] = useState('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [notifStatus, setNotifStatus] = useState<string>('');

  // Custom Schedule Commitment Form
  const [blockTitle, setBlockTitle] = useState('');
  const [blockStart, setBlockStart] = useState('11:00');
  const [blockEnd, setBlockEnd] = useState('12:00');
  const [blockType, setBlockType] = useState<ScheduleBlock['type']>('commitment');
  const [blockDaysPreset, setBlockDaysPreset] = useState<'weekdays' | 'daily' | 'weekends'>('weekdays');

  const triggerDownload = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(db, null, 2);
    triggerDownload(
      `dayflow-workspace-backup-${todayDate}.json`,
      jsonStr,
      'application/json'
    );
  };

  const handleExportCSV = () => {
    const csvStr = tasksToCSV(db.tasks);
    triggerDownload(`dayflow-tasks-${todayDate}.csv`, csvStr, 'text/csv;charset=utf-8;');
  };

  const handleExportICS = () => {
    const icsStr = generateICSContent(db);
    triggerDownload(
      `dayflow-calendar-${todayDate}.ics`,
      icsStr,
      'text/calendar;charset=utf-8;'
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      importMode === 'replace' &&
      !window.confirm(
        'WARNING: Replace mode will overwrite your current tasks, projects, and habits with the backup file. Continue?'
      )
    ) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || '');
      const result = importBackupJSON(content, importMode);
      setImportStatus({
        type: result.success ? 'success' : 'error',
        text: result.message,
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newCategory.trim();
    if (!clean || s.categories.includes(clean)) return;
    updateSettings({ categories: [...s.categories, clean] });
    setNewCategory('');
  };

  const handleAddCommitment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockTitle.trim()) return;
    const daysOfWeek =
      blockDaysPreset === 'weekdays'
        ? [1, 2, 3, 4, 5]
        : blockDaysPreset === 'weekends'
        ? [0, 6]
        : [0, 1, 2, 3, 4, 5, 6];

    saveScheduleBlock({
      id: `commit_${Date.now()}`,
      title: blockTitle.trim(),
      startTime: blockStart,
      endTime: blockEnd,
      type: blockType,
      daysOfWeek,
      isEditableDuration: true,
      enabled: true,
    });
    setBlockTitle('');
  };

  const handleRequestBrowserNotif = async () => {
    if (typeof Notification === 'undefined') {
      setNotifStatus('Browser notifications are not supported in this browser.');
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      updateSettings({ browserNotificationsEnabled: true });
      setNotifStatus(
        'Browser notification permission granted! Note: Reminders only fire while this app tab is open.'
      );
    } else {
      updateSettings({ browserNotificationsEnabled: false });
      setNotifStatus(`Permission status: ${perm}. In-app deadline badges remain active.`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Settings, Schedule Preferences & Data Backups
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure your timezone, working hours, fixed commitments, categories, and portable backups
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsOnboardingOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" /> Run Setup Wizard
          </button>
          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Database className="w-4 h-4" />
            <span>
              Storage: {saveStatus.method} • Saved{' '}
              {formatTimestamp(saveStatus.lastSavedAt, s.timezone)}
            </span>
          </div>
        </div>
      </div>

      {/* 1. DATA PERSISTENCE, DEMO CONTROLS, EXPORT & IMPORT BACKUPS */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              Data Persistence, Portable Backups (.JSON / .CSV / .ICS) & Demo Controls
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Your workspace is automatically persisted locally in your browser&apos;s{' '}
              <strong>IndexedDB</strong> (with a localStorage safety mirror). Export a JSON backup anytime to move your workspace across devices or archive snapshots.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleExportJSON}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 shadow-xs"
          >
            <Download className="w-4 h-4" /> Export Full Backup (.JSON)
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Tasks (.CSV)
          </button>

          <button
            type="button"
            onClick={handleExportICS}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 shadow-xs"
          >
            <Calendar className="w-4 h-4" /> Export Calendar (.ICS)
          </button>

          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  'Reset the workspace back to a clean set of DayFlow demo data?'
                )
              ) {
                resetToDemoData();
              }
            }}
            className="px-3.5 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-950/50 inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Demo Data
          </button>

          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  'Clear all tasks, projects, habits, and sample data to start with a blank workspace?'
                )
              ) {
                clearToBlankWorkspace();
              }
            }}
            className="px-3.5 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> Start Blank Workspace
          </button>
        </div>

        {/* JSON Import Box */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Upload className="w-4 h-4 text-indigo-600" />
            Restore / Import from JSON Backup
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-2 cursor-pointer font-medium">
              <input
                type="radio"
                name="importMode"
                checked={importMode === 'merge'}
                onChange={() => setImportMode('merge')}
              />
              <span>
                <strong>Safe Merge (Recommended):</strong> Keeps all existing records and adds new items from backup without overwriting.
              </span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer font-medium text-rose-700 dark:text-rose-400">
              <input
                type="radio"
                name="importMode"
                checked={importMode === 'replace'}
                onChange={() => setImportMode('replace')}
              />
              <span>
                <strong>Replace All:</strong> Replaces workspace with backup file (prompts for confirmation).
              </span>
            </label>
          </div>

          <div>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold cursor-pointer hover:bg-slate-100">
              <Upload className="w-4 h-4" /> Choose .JSON Backup File
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {importStatus && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 ${
                importStatus.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-200'
              }`}
            >
              {importStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{importStatus.text}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. WORKING HOURS, BREAKS & CUSTOM COMMITMENTS */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            Working Hours, Routine & Fixed Commitments
          </h2>
          <p className="text-xs text-slate-500">
            Configure your focus blocks and commitments. The smart scheduler only places tasks inside available focus windows and never overlaps fixed commitments, meals, or sleep.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Wake-Up Time</label>
            <input
              type="time"
              value={s.wakeUpTime}
              onChange={(e) => updateSettings({ wakeUpTime: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Morning Focus Start</label>
            <input
              type="time"
              value={s.morningWorkStart}
              onChange={(e) => updateSettings({ morningWorkStart: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Morning Focus End</label>
            <input
              type="time"
              value={s.morningWorkEnd}
              onChange={(e) => updateSettings({ morningWorkEnd: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Lunch / Midday Break</label>
            <div className="flex items-center gap-1.5">
              <input
                type="time"
                value={s.lunchStart}
                onChange={(e) => updateSettings({ lunchStart: e.target.value })}
                className="w-full px-2 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <span>–</span>
              <input
                type="time"
                value={s.lunchEnd}
                onChange={(e) => updateSettings({ lunchEnd: e.target.value })}
                className="w-full px-2 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Afternoon Work Start</label>
            <input
              type="time"
              value={s.afternoonWorkStart}
              onChange={(e) => updateSettings({ afternoonWorkStart: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Afternoon Work End</label>
            <input
              type="time"
              value={s.afternoonWorkEnd}
              onChange={(e) => updateSettings({ afternoonWorkEnd: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">
              Evening Wind-Down Buffer (mins)
            </label>
            <input
              type="number"
              min={15}
              max={120}
              step={5}
              value={s.personalWindDownMinutes}
              onChange={(e) =>
                updateSettings({ personalWindDownMinutes: Number(e.target.value) || 45 })
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Bedtime</label>
            <input
              type="time"
              value={s.bedtime}
              onChange={(e) => updateSettings({ bedtime: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
        </div>

        {/* Optional Evening & Weekend Sessions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <label className="inline-flex items-center gap-2 font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={s.enableEveningFocusSession}
                onChange={(e) =>
                  updateSettings({ enableEveningFocusSession: e.target.checked })
                }
                className="w-4 h-4 rounded text-indigo-600"
              />
              Enable Optional Evening Focus / Learning Session
            </label>
            {s.enableEveningFocusSession && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="time"
                  value={s.eveningFocusStart}
                  onChange={(e) => updateSettings({ eveningFocusStart: e.target.value })}
                  className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
                <span>to</span>
                <input
                  type="time"
                  value={s.eveningFocusEnd}
                  onChange={(e) => updateSettings({ eveningFocusEnd: e.target.value })}
                  className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <label className="inline-flex items-center gap-2 font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={s.enableWeekendSessions}
                onChange={(e) =>
                  updateSettings({ enableWeekendSessions: e.target.checked })
                }
                className="w-4 h-4 rounded text-indigo-600"
              />
              Enable Weekend Deep Work Sessions (Sat & Sun)
            </label>
            {s.enableWeekendSessions && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span>Window:</span>
                <input
                  type="time"
                  value={s.weekendWorkStart}
                  onChange={(e) => updateSettings({ weekendWorkStart: e.target.value })}
                  className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
                <span>–</span>
                <input
                  type="time"
                  value={s.weekendWorkEnd}
                  onChange={(e) => updateSettings({ weekendWorkEnd: e.target.value })}
                  className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            )}
          </div>
        </div>

        {/* Custom Fixed Commitments Manager */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs">
          <div className="font-bold text-slate-900 dark:text-white">
            Custom Fixed Commitments (Meetings, Classes, Commutes, Workouts)
          </div>
          <form
            onSubmit={handleAddCommitment}
            className="grid grid-cols-1 sm:grid-cols-6 gap-2.5"
          >
            <input
              type="text"
              value={blockTitle}
              onChange={(e) => setBlockTitle(e.target.value)}
              placeholder="e.g., Daily Team Standup or Gym"
              className="sm:col-span-2 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <input
              type="time"
              value={blockStart}
              onChange={(e) => setBlockStart(e.target.value)}
              className="px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <input
              type="time"
              value={blockEnd}
              onChange={(e) => setBlockEnd(e.target.value)}
              className="px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <select
              value={blockDaysPreset}
              onChange={(e) =>
                setBlockDaysPreset(e.target.value as 'weekdays' | 'daily' | 'weekends')
              }
              className="px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="weekdays">Weekdays</option>
              <option value="daily">Every Day</option>
              <option value="weekends">Weekends</option>
            </select>
            <button
              type="submit"
              className="px-3 py-2 rounded-xl bg-indigo-600 text-white font-bold inline-flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Block
            </button>
          </form>

          {db.scheduleBlocks.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {db.scheduleBlocks.map((b) => (
                <div
                  key={b.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      {b.title}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {b.startTime} – {b.endTime} ({b.daysOfWeek.length === 7 ? 'daily' : 'custom days'})
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteScheduleBlock(b.id)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                    title="Delete commitment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. PROFILE, TIMEZONE, APPEARANCE & CATEGORIES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-600" />
            Profile, Timezone, Currency & Appearance
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Display Name (Optional)</label>
              <input
                type="text"
                value={s.userName || ''}
                onChange={(e) => updateSettings({ userName: e.target.value })}
                placeholder="e.g., Alex Morgan"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Preferred Timezone</label>
              <select
                value={s.timezone}
                onChange={(e) => updateSettings({ timezone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                {BRAND_CONFIG.supportedTimezones.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">
                Planning Start Date (Default: Next Monday {nextMondayDate})
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={effectivePlanningStartMonday}
                  onChange={(e) =>
                    updateSettings({ initialPlanningDateOverride: e.target.value })
                  }
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
                {s.initialPlanningDateOverride && (
                  <button
                    type="button"
                    onClick={() => updateSettings({ initialPlanningDateOverride: undefined })}
                    className="px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-700 font-semibold"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold mb-1">Theme</label>
                <select
                  value={s.theme}
                  onChange={(e) =>
                    updateSettings({ theme: e.target.value as 'light' | 'dark' })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="light">Light Mode</option>
                  <option value="dark">Dark Mode</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Currency</label>
                <select
                  value={s.currencySymbol}
                  onChange={(e) => updateSettings({ currencySymbol: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="$">$ (USD)</option>
                  <option value="€">€ (EUR)</option>
                  <option value="£">£ (GBP)</option>
                  <option value="₹">₹ (INR)</option>
                  <option value="¥">¥ (JPY)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="font-bold flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-amber-500" />
              Reminders & Honest Notification Behavior
            </div>
            <p className="text-slate-500">
              In-app deadline badges (Due Today, Overdue, Upcoming) are always active. Optional browser notifications only fire while the browser tab is open — background/closed-app push notifications are not claimed.
            </p>
            <button
              type="button"
              onClick={handleRequestBrowserNotif}
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {s.browserNotificationsEnabled
                ? 'Browser Notifications Enabled (While Open)'
                : 'Enable Optional Browser Notifications'}
            </button>
            {notifStatus && <p className="text-indigo-600 font-medium">{notifStatus}</p>}
          </div>
        </div>

        {/* Custom Categories & Calendar Integration Info */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Task Categories & External Calendar Export
          </h2>

          <form onSubmit={handleAddCategory} className="flex gap-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Add custom category..."
              className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </form>

          <div className="flex flex-wrap gap-1.5">
            {s.categories.map((cat) => (
              <span
                key={cat}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium inline-flex items-center gap-1.5"
              >
                {cat}
                {!(BRAND_CONFIG.defaultCategories as readonly string[]).includes(cat) && (
                  <button
                    type="button"
                    onClick={() =>
                      updateSettings({
                        categories: s.categories.filter((c) => c !== cat),
                      })
                    }
                    className="text-rose-500"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
            <div className="font-bold text-slate-800 dark:text-slate-200">
              External Calendar Sync (.ICS Export)
            </div>
            <p className="text-slate-500">
              For privacy and zero-credential security, no OAuth client secrets or third-party API keys are embedded in client-side code. Use the <strong>Export Calendar (.ICS)</strong> button above to import your scheduled tasks and milestones into Google Calendar, Apple Calendar, or Outlook.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
