import { UserRole } from '../../types';

export interface PlatformSettings {
  maintenanceMode: boolean;
  announcement: string;
  defaultTheme: 'light' | 'dark' | 'system';
}

export interface AIControlSettings {
  dailyAiLimitPerUser: number;
  maxUploadSizeMb: number;
  defaultSummaryLength: 'short' | 'medium' | 'long';
  heavyUserAlerts: boolean;
  emergencyAiDisable: boolean;
}

export type TicketStatus = 'open' | 'in_progress' | 'resolved';

export interface SupportTicket {
  id: string;
  fromEmail: string;
  fromName: string;
  role: UserRole;
  subject: string;
  message: string;
  status: TicketStatus;
  adminReply?: string;
  createdAt: string;
  updatedAt: string;
}

const SETTINGS_KEY = 'study_planner_platform_settings_v1';
const AI_CONTROL_KEY = 'study_planner_ai_control_settings_v1';
const TICKETS_KEY = 'study_planner_support_tickets_v1';

const defaultSettings: PlatformSettings = {
  maintenanceMode: false,
  announcement: 'Welcome to the AI-Powered Study Planner. Stay consistent this week.',
  defaultTheme: 'system',
};

const defaultAiControlSettings: AIControlSettings = {
  dailyAiLimitPerUser: 50,
  maxUploadSizeMb: 20,
  defaultSummaryLength: 'medium',
  heavyUserAlerts: true,
  emergencyAiDisable: false,
};

const seedTickets: SupportTicket[] = [
  {
    id: 't-1',
    fromEmail: 'alice@college.edu',
    fromName: 'Alice Brown',
    role: 'student',
    subject: 'Need help with AI summary quality',
    message: 'Summaries for large PDFs are too short for revision.',
    status: 'open',
    createdAt: '2026-02-10',
    updatedAt: '2026-02-10',
  },
  {
    id: 't-2',
    fromEmail: 'mark@college.edu',
    fromName: 'Mark Chen',
    role: 'student',
    subject: 'Schedule drag-drop issue',
    message: 'Task card snaps back occasionally on mobile.',
    status: 'in_progress',
    adminReply: 'Issue acknowledged, fix is scheduled in next patch.',
    createdAt: '2026-02-09',
    updatedAt: '2026-02-11',
  },
];

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readSettings(): PlatformSettings {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
    return defaultSettings;
  }
  return JSON.parse(raw) as PlatformSettings;
}

function writeSettings(value: PlatformSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(value));
}

function readAiControlSettings(): AIControlSettings {
  const raw = localStorage.getItem(AI_CONTROL_KEY);
  if (!raw) {
    localStorage.setItem(AI_CONTROL_KEY, JSON.stringify(defaultAiControlSettings));
    return defaultAiControlSettings;
  }
  return JSON.parse(raw) as AIControlSettings;
}

function writeAiControlSettings(value: AIControlSettings) {
  localStorage.setItem(AI_CONTROL_KEY, JSON.stringify(value));
}

function readTickets(): SupportTicket[] {
  const raw = localStorage.getItem(TICKETS_KEY);
  if (!raw) {
    localStorage.setItem(TICKETS_KEY, JSON.stringify(seedTickets));
    return seedTickets;
  }
  return JSON.parse(raw) as SupportTicket[];
}

function writeTickets(value: SupportTicket[]) {
  localStorage.setItem(TICKETS_KEY, JSON.stringify(value));
}

export async function fetchPlatformSettings() {
  await wait(120);
  return readSettings();
}

export async function savePlatformSettings(next: PlatformSettings) {
  await wait(180);
  writeSettings(next);
  return next;
}

export async function fetchAiControlSettings() {
  await wait(120);
  return readAiControlSettings();
}

export async function saveAiControlSettings(next: AIControlSettings) {
  await wait(180);
  writeAiControlSettings(next);
  return next;
}

export async function fetchSupportTickets() {
  await wait(160);
  return readTickets().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function fetchUserTickets(email: string) {
  await wait(130);
  return readTickets().filter((t) => t.fromEmail.toLowerCase() === email.toLowerCase());
}

export async function createSupportTicket(input: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'status'>) {
  await wait(160);
  const tickets = readTickets();
  const now = new Date().toISOString().slice(0, 10);
  const next: SupportTicket = {
    id: crypto.randomUUID(),
    ...input,
    status: 'open',
    createdAt: now,
    updatedAt: now,
  };
  writeTickets([next, ...tickets]);
  return next;
}

export async function updateSupportTicket(input: {
  id: string;
  status: TicketStatus;
  adminReply?: string;
}) {
  await wait(170);
  const tickets = readTickets();
  const now = new Date().toISOString().slice(0, 10);
  const next = tickets.map((t) =>
    t.id === input.id ? { ...t, status: input.status, adminReply: input.adminReply, updatedAt: now } : t
  );
  writeTickets(next);
  return next;
}
