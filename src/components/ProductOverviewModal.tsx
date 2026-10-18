import React from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  Calendar,
  BarChart3,
  Database,
  ShieldCheck,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BRAND_CONFIG } from '../config/brandConfig';

export const ProductOverviewModal: React.FC = () => {
  const {
    isProductOverviewOpen,
    setIsProductOverviewOpen,
    setIsOnboardingOpen,
  } = useApp();

  if (!isProductOverviewOpen) return null;

  const features = [
    {
      icon: Clock,
      title: 'Deterministic Time-Blocking Engine',
      desc: 'Automatically fits prioritized tasks into open focus windows while strictly respecting fixed meetings, lunch breaks, and personal wind-down time.',
    },
    {
      icon: Calendar,
      title: 'Daily, Weekly & Monthly Planning',
      desc: 'Unified workflow spanning daily checklists, weekly 3-outcome sprint reviews with duplicate-free Carry Forward, and measurable monthly goals.',
    },
    {
      icon: Sparkles,
      title: 'Projects, Ventures, Learning & Habits',
      desc: 'Track multi-step projects, side-project experiments, practical skill drills, and recurring daily/weekday habits in one cohesive workspace.',
    },
    {
      icon: BarChart3,
      title: 'Real-Data Progress & Analytics',
      desc: 'Visualizes 7-day completion trends, category breakdowns, goal progress, and habit consistency using 100% real workspace records.',
    },
    {
      icon: Database,
      title: 'Offline-First IndexedDB Persistence',
      desc: 'Instant local persistence via IndexedDB with a synchronous localStorage mirror, plus validated JSON backup/restore, CSV export, and iCalendar (.ics) export.',
    },
    {
      icon: ShieldCheck,
      title: 'Zero-Account Privacy & Reusability',
      desc: 'No external tracking or hardcoded personal assumptions. Fully customizable categories, working hours, timezones, and themes via central config.',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-overview-title"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center">
              {BRAND_CONFIG.logoLetter}
            </div>
            <div>
              <h2
                id="product-overview-title"
                className="text-base font-bold text-slate-900 dark:text-white"
              >
                {BRAND_CONFIG.productName} — Product Overview & Architecture
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Portfolio-Ready Personal Productivity & Time-Blocking Web Application
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsProductOverviewOpen(false)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white"
            aria-label="Close overview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-semibold">
              React 18 • TypeScript • Tailwind CSS • IndexedDB • Vitest
            </div>
            <h3 className="text-xl font-bold">
              Plan with clarity. Protect your focus. Own your data.
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {BRAND_CONFIG.productName} is a full-featured, local-first productivity planner built for professionals, students, freelancers, and creators. It combines task management, deterministic daily time-blocking, habit tracking, and project roadmaps in a clean SaaS interface.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1.5"
                >
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                    <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>{f.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              setIsProductOverviewOpen(false);
              setIsOnboardingOpen(true);
            }}
            className="df-btn-secondary text-xs inline-flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5" /> Configure Working Hours & Preferences
          </button>
          <button
            type="button"
            onClick={() => setIsProductOverviewOpen(false)}
            className="df-btn-primary text-xs sm:text-sm inline-flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" /> Explore {BRAND_CONFIG.productName} Workspace
          </button>
        </div>
      </div>
    </div>
  );
};
