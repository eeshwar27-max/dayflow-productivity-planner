import React, { useState } from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  CalendarDays,
  Calendar as CalendarIcon,
  ListTodo,
  Briefcase,
  Activity,
  BarChart3,
  Settings,
  Plus,
  RotateCcw,
  Database,
  Menu,
  X,
  Sun,
  Moon,
  Sparkles,
  Info,
} from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { NavTab } from './types';
import { BRAND_CONFIG } from './config/brandConfig';
import { DashboardView } from './views/DashboardView';
import { TodayView } from './views/TodayView';
import { WeekView } from './views/WeekView';
import { CalendarView } from './views/CalendarView';
import { TasksView } from './views/TasksView';
import { BusinessView } from './views/BusinessView';
import { HabitsView } from './views/HabitsView';
import { ProgressView } from './views/ProgressView';
import { SettingsView } from './views/SettingsView';
import { TaskModal } from './components/TaskModal';
import { CatchUpModal } from './components/CatchUpModal';
import { OnboardingModal } from './components/OnboardingModal';
import { ProductOverviewModal } from './components/ProductOverviewModal';
import { diffInDays, formatReadableDate, getTasksForDate } from './utils/dateUtils';

const NAV_ITEMS: Array<{ id: NavTab; label: string; icon: React.FC<{ className?: string }> }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'today', label: 'Today', icon: CheckSquare },
  { id: 'week', label: 'Week', icon: CalendarDays },
  { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
  { id: 'tasks', label: 'Tasks', icon: ListTodo },
  { id: 'projects', label: 'Projects & Finance', icon: Briefcase },
  { id: 'habits', label: 'Habits & Skills', icon: Activity },
  { id: 'progress', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const AppShell: React.FC = () => {
  const {
    db,
    todayDate,
    activeTab,
    setActiveTab,
    saveStatus,
    openNewTaskModal,
    setIsCatchUpOpen,
    setIsOnboardingOpen,
    setIsProductOverviewOpen,
    updateSettings,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const todayActiveCount = getTasksForDate(
    db.tasks,
    db.recurringOccurrences,
    todayDate
  ).filter((i) => i.effectiveStatus !== 'Completed' && i.effectiveStatus !== 'Skipped').length;

  const overdueCount = db.tasks.filter(
    (t) =>
      !t.archived &&
      t.status !== 'Completed' &&
      t.dueDate &&
      diffInDays(t.dueDate, todayDate) > 0
  ).length;

  const handleSelectNav = (tab: NavTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-x-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 justify-between p-4">
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="px-2 pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shadow-sm">
                  {BRAND_CONFIG.logoLetter}
                </div>
                <div>
                  <div className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
                    {BRAND_CONFIG.productName}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {BRAND_CONFIG.productTagline}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateSettings({
                    theme: db.settings.theme === 'dark' ? 'light' : 'dark',
                  })
                }
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Toggle color theme"
              >
                {db.settings.theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Quick Primary Action */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() =>
                openNewTaskModal({ dueDate: todayDate, category: 'Work & Projects' })
              }
              className="w-full py-2.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Quick New Task
            </button>
            {overdueCount > 0 && (
              <button
                type="button"
                onClick={() => setIsCatchUpOpen(true)}
                className="w-full py-2 px-3 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Catch Up ({overdueCount} Overdue)
              </button>
            )}
          </div>

          {/* 9 Navigation Links */}
          <nav className="space-y-1" aria-label="Main Navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectNav(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </span>
                  {item.id === 'today' && todayActiveCount > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                      }`}
                    >
                      {todayActiveCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Portfolio Tour, Setup & Storage Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5 text-[11px] text-slate-500">
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setIsProductOverviewOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold inline-flex items-center justify-center gap-1"
            >
              <Info className="w-3.5 h-3.5 text-indigo-600" /> Product Tour
            </button>
            <button
              type="button"
              onClick={() => setIsOnboardingOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold inline-flex items-center justify-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Setup
            </button>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
            <Database className="w-3.5 h-3.5 shrink-0" />
            <span>
              {saveStatus.state === 'saving'
                ? 'Saving changes...'
                : `Auto-saved (${saveStatus.method})`}
            </span>
          </div>
          <div>
            Date: <strong>{formatReadableDate(todayDate)}</strong>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="lg:hidden sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div>
            <div className="font-extrabold text-sm text-slate-900 dark:text-white">
              {BRAND_CONFIG.productName}
            </div>
            <div className="text-[11px] text-slate-500">
              {formatReadableDate(todayDate, { includeYear: false })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsProductOverviewOpen(true)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
            aria-label="Open product overview"
          >
            <Info className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => openNewTaskModal({ dueDate: todayDate })}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Task
          </button>
        </div>
      </header>

      {/* Mobile Slide-Down Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 w-72 max-w-[85vw] h-full p-4 space-y-4 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <span className="font-extrabold text-sm">{BRAND_CONFIG.productName} Menu</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectNav(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl mx-auto w-full">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'today' && <TodayView />}
        {activeTab === 'week' && <WeekView />}
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'tasks' && <TasksView />}
        {activeTab === 'projects' && <BusinessView />}
        {activeTab === 'habits' && <HabitsView />}
        {activeTab === 'progress' && <ProgressView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Mobile Bottom Quick Bar for One-Handed Use */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-t border-slate-200 dark:border-slate-800 grid grid-cols-5 py-1.5 px-1"
        aria-label="Mobile Quick Navigation"
      >
        {[
          NAV_ITEMS[0], // Dashboard
          NAV_ITEMS[1], // Today
          NAV_ITEMS[4], // Tasks
          NAV_ITEMS[5], // Projects
          NAV_ITEMS[6], // Habits
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectNav(item.id)}
              className={`flex flex-col items-center justify-center py-1 rounded-lg text-[10px] font-bold ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span className="truncate max-w-[64px]">
                {item.id === 'projects' ? 'Projects' : item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Modals */}
      <TaskModal />
      <CatchUpModal />
      <OnboardingModal />
      <ProductOverviewModal />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

export default App;
