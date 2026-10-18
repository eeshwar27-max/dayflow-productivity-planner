/**
 * Central Brand & Product Configuration for DayFlow.
 * Edit this file to customize the application's name, tagline, default categories,
 * supported timezones, and default working hours across the entire app.
 */

export const BRAND_CONFIG = {
  productName: 'DayFlow',
  productTagline: 'Personal Productivity & Time-Blocking Workspace',
  version: '2.0.0',
  logoLetter: 'D',
  exportFilePrefix: 'dayflow',
  calendarProdId: '-//DayFlow Productivity Planner//EN',
  storageKeys: {
    indexedDbName: 'dayflow_productivity_db',
    indexedDbStore: 'workspace_state',
    indexedDbKey: 'root_workspace',
    localStorageMirrorKey: 'dayflow_workspace_mirror_v1',
  },
  defaultCategories: [
    'Work & Projects',
    'Learning',
    'Health & Fitness',
    'Personal',
    'Finance',
    'Custom',
  ],
  projectAreas: [
    'Product & Engineering',
    'Design & UX',
    'Content & Marketing',
    'Client & Freelance',
    'Operations & Admin',
    'Career & Portfolio',
    'Custom Project',
  ],
  supportedTimezones: [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'America/New_York', label: 'America/New_York (Eastern Time)' },
    { value: 'America/Chicago', label: 'America/Chicago (Central Time)' },
    { value: 'America/Los_Angeles', label: 'America/Los_Angeles (Pacific Time)' },
    { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
    { value: 'Europe/Berlin', label: 'Europe/Berlin (Central European Time)' },
    { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST, UTC+05:30)' },
    { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)' },
    { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
    { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST)' },
  ],
  defaultSchedule: {
    wakeUpTime: '07:00',
    morningWorkStart: '09:00',
    morningWorkEnd: '12:30',
    lunchStart: '12:30',
    lunchEnd: '13:30',
    afternoonWorkStart: '13:30',
    afternoonWorkEnd: '17:30',
    eveningFocusStart: '19:00',
    eveningFocusEnd: '20:30',
    personalWindDownMinutes: 60,
    bedtime: '22:30',
  },
} as const;

export function detectUserTimezone(): string {
  try {
    const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (resolved && typeof resolved === 'string') {
      return resolved;
    }
  } catch {
    // Fallback
  }
  return 'UTC';
}
