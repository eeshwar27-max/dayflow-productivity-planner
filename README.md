# DayFlow — Personal Productivity & Time-Blocking Planner

![DayFlow Version](https://img.shields.io/badge/DayFlow-v2.0.0-4f46e5?style=flat-square)
![React 18](https://img.shields.io/badge/React-18.3-61dafb?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06b6d4?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-6.0-646cff?style=flat-square)

**DayFlow** is a modern, local-first productivity and time-blocking web application designed for developers, freelancers, students, creators, and professionals. Built with React 18, TypeScript, Vite, and Tailwind CSS, DayFlow combines deterministic daily time-blocking, weekly sprint planning, goal and habit tracking, project pipelines, and portable zero-server persistence.

---

## ✨ Key Features

- **Command Center Dashboard**: Instant overview of today's focus tasks, active time-blocks, overdue triage alerts, weekly sprint completion rates, and habit streaks.
- **Deterministic Daily Time-Blocking ("Plan My Day")**: Automatically schedules today's tasks into configurable focus windows (`Morning Focus`, `Afternoon Work`, optional `Evening Session`) while respecting fixed commitments, meetings, lunch breaks, personal wind-down time, and sleep. Includes real-time overlap and conflict detection.
- **Weekly Sprint Planner & Carry-Forward**: 7-day workload visualization with daily capacity indicators, weekly outcome targets, reflection notes, and a one-click **Carry Forward** tool for unfinished work.
- **Monthly Calendar, Deadlines & Measurable Goals**: Interactive Monday-first monthly calendar with date inspector, milestone markers, and quantitative monthly goal progress bars (`+1` / `-1` quick updates).
- **Tasks, Quick Inbox & Deterministic Recurring Engine**: Fast title-only capture, full task editor, multi-criteria search/filter/sort, and a pure-function recurring task engine (`daily`, `weekdays`, `weekends`, `selected_days`, `weekly`, `custom_days`) that never duplicates records on reload.
- **Catch-Up Mode**: Non-punitive overdue task triage modal to reschedule to today, tomorrow, next Monday, move to the Quick Inbox, or archive.
- **Projects, Venture Validation Lab & Finance Ledger**: Manage active projects across customizable domains, evaluate side-project hypotheses with next actionable steps, and log real income and expenses.
- **Health Habits & Skill Development Tracker**: 7-day interactive habit completion matrix with streak tracking alongside a structured skill-learning tracker with practice drills.
- **First-Launch Onboarding & Demo Workspace**: Skippable setup wizard for display name, IANA timezone, working hours, custom fixed commitments, theme (`light`/`dark`), and 1-click switching between coherent sample data (`Sample` badge) and a clean blank workspace.
- **Local-First Persistence & Portable Backups**: Automatic persistence in browser **IndexedDB** with a synchronous `localStorage` mirror, plus validated `.JSON` backup & restore (**Safe Merge** or **Replace**), `.CSV` task export, and `.ICS` calendar export.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technology |
| :--- | :--- |
| **UI Framework** | React 18.3 + TypeScript 5.6 (Strict Mode) |
| **Build Tool** | Vite 6.0 |
| **Styling & Tokens** | Tailwind CSS 3.4 + CSS Custom Properties (`--df-*` design tokens) |
| **Icons** | Lucide React |
| **Persistence** | IndexedDB (`dayflow_productivity_db`) + `localStorage` fallback mirror |
| **Testing** | Vitest 2.1 (Unit & Integration Suite) |

### Project Structure

```text
src/
├── config/
│   └── brandConfig.ts           # Centralized product name, logo mark, categories, timezones & defaults
├── types/
│   └── index.ts                 # Strict TypeScript interfaces for all entities & settings
├── utils/
│   ├── dateUtils.ts             # Timezone-aware YYYY-MM-DD math & deterministic recurrence engine
│   ├── scheduler.ts             # Conflict detection & deterministic "Plan My Day" time-blocking
│   └── storage.ts               # IndexedDB + localStorage persistence, demo seed, JSON/CSV/ICS export
├── context/
│   └── AppContext.tsx           # Central state provider & CRUD actions
├── components/
│   ├── Badge.tsx                # Category, Priority, Status & Sample/Demo badges
│   ├── TaskModal.tsx            # Full task & recurrence editor modal
│   ├── CatchUpModal.tsx         # Overdue workload triage modal
│   ├── OnboardingModal.tsx      # Skippable first-launch workspace setup wizard
│   └── ProductOverviewModal.tsx # Portfolio product tour & architecture overview modal
└── views/
    ├── DashboardView.tsx        # Daily command center & next-action spotlight
    ├── TodayView.tsx            # Time-blocked daily schedule & conflict alerts
    ├── WeekView.tsx             # 7-day sprint planner & carry-forward workflow
    ├── CalendarView.tsx         # Monthly calendar grid, milestones & measurable goals
    ├── TasksView.tsx            # Task manager, Quick Inbox & recurring rules
    ├── BusinessView.tsx         # Projects, Side Ventures & Income/Expense ledger
    ├── HabitsView.tsx           # 7-day habit matrix & skill development tracker
    ├── ProgressView.tsx         # Real-data completion analytics & category breakdowns
    └── SettingsView.tsx         # Working hours, commitments, timezone, theme & backup controls
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+ recommended) and **npm**

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
Then open **[http://localhost:5173](http://localhost:5173)** in your browser.
*(On Windows, you can also double-click `start-app.bat` in the root folder.)*

### 3. Run Automated Tests
```bash
npm run test
```

### 4. Build for Production
```bash
npm run build
npm run preview
```

---

## 🎨 Customizing Branding & Categories

All product identity settings, default categories, project domains, supported timezones, and default working hours are centralized in [`src/config/brandConfig.ts`](src/config/brandConfig.ts). Updating `BRAND_CONFIG` updates the product name, logo mark, and defaults across the entire application.

---

## 🔒 Privacy & Persistence Model

- **100% Local-First & Zero Credentials**: All workspace data stays in your browser's **IndexedDB** (`dayflow_productivity_db`) with a synchronous `localStorage` fallback mirror. No external database, user account, telemetry, or API keys are required or embedded.
- **Portable Backups & Data Ownership**: Because storage is scoped to your current browser profile, use **Settings → Export Full Backup (.JSON)** to create portable snapshots. You can restore or migrate workspaces across browsers or machines with either **Safe Merge** (preserves existing records) or **Replace All**.
- **External Interoperability**: Export tasks to standard `.CSV` for spreadsheet analysis, or export scheduled tasks and milestones to standard `.ICS` for one-way import into Apple Calendar, Google Calendar, or Microsoft Outlook.

---

## ⚠️ Known Limitations & Design Constraints

1. **Browser-Scoped Storage**: Without a remote cloud sync backend, changes made in one browser profile do not automatically sync in real time to another device. Cross-device workflows use the built-in JSON backup/restore tool.
2. **In-App Notification Scope**: In-app status badges (`Due Today`, `Overdue`, `Upcoming`) and optional Web Notifications trigger while the browser tab is running. In accordance with web platform security standards, background push notifications while the browser is completely closed are not supported without a native OS daemon.
3. **Single-User Workspace**: DayFlow is architected as an agile personal productivity command center, not a multi-tenant enterprise project management or collaborative ticketing platform.
4. **Timezone Adjustments**: Daily time-blocks and schedule grids are keyed to your selected IANA timezone (configured during onboarding or in Settings). When traveling across timezones, switching your timezone in Settings re-anchors the day planning window without shifting historical timestamps.

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).
