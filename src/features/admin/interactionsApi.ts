import { UserRole } from '../../types';
import { supabase } from '../../lib/supabase';

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
export type TicketSender = 'admin' | 'user';

type ActorRole = 'admin' | 'student';

interface ActorProfile {
  id: string;
  email: string;
  name: string;
  role: ActorRole;
}

interface SupportThreadRow {
  id: string;
  student_id: string;
  subject: string;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
  deleted_by_admin: boolean;
  deleted_by_student: boolean;
  last_read_by_admin_at: string | null;
  last_read_by_student_at: string | null;
  student:
    | {
      id: string;
      email: string;
      name: string;
      role: string;
    }
    | {
      id: string;
      email: string;
      name: string;
      role: string;
    }[]
    | null;
  messages: SupportMessageRow[] | null;
}

interface SupportMessageRow {
  id: string;
  sender_role: 'admin' | 'student';
  sender_name: string;
  message: string;
  created_at: string;
  deleted_by_admin?: boolean;
  deleted_by_student?: boolean;
}

export interface SupportTicketMessage {
  id: string;
  sender: TicketSender;
  senderName: string;
  message: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  fromEmail: string;
  fromName: string;
  role: UserRole;
  subject: string;
  message: string;
  status: TicketStatus;
  adminReply?: string;
  messages: SupportTicketMessage[];
  unreadByAdmin: boolean;
  unreadByUser: boolean;
  createdAt: string;
  updatedAt: string;
}

const AI_CONTROL_KEY = 'study_planner_ai_control_settings_v1';

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

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function toDateLabel(value: string | null | undefined) {
  if (!value) return new Date().toISOString().slice(0, 10);
  return value.slice(0, 10);
}

function mapSender(senderRole: 'admin' | 'student'): TicketSender {
  return senderRole === 'admin' ? 'admin' : 'user';
}

function normalizeRole(role: string | null | undefined): UserRole {
  return role === 'admin' ? 'admin' : 'student';
}

function sortMessages(messages: SupportMessageRow[] | null | undefined) {
  return [...(messages ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at));
}

function mapThread(row: SupportThreadRow, viewer: 'admin' | 'student'): SupportTicket {
  const student = Array.isArray(row.student) ? row.student[0] ?? null : row.student;
  const visibleMessages = sortMessages(row.messages).filter((m) =>
    viewer === 'admin' ? !m.deleted_by_admin : !m.deleted_by_student
  );

  const messages = visibleMessages.map((m) => ({
    id: m.id,
    sender: mapSender(m.sender_role),
    senderName: m.sender_name,
    message: m.message,
    createdAt: toDateLabel(m.created_at),
  }));

  const latest = visibleMessages.slice(-1)[0];
  const latestAdminMessage = visibleMessages
    .filter((m) => m.sender_role === 'admin')
    .slice(-1)[0];

  const lastReadByAdmin = row.last_read_by_admin_at ?? '';
  const lastReadByStudent = row.last_read_by_student_at ?? '';
  const unreadByAdmin = Boolean(latest && latest.sender_role === 'student' && latest.created_at > lastReadByAdmin);
  const unreadByUser = Boolean(latest && latest.sender_role === 'admin' && latest.created_at > lastReadByStudent);

  return {
    id: row.id,
    fromEmail: student?.email ?? 'unknown@example.com',
    fromName: student?.name ?? 'Student',
    role: normalizeRole(student?.role),
    subject: row.subject,
    message: messages[0]?.message ?? '',
    status: row.status,
    adminReply: latestAdminMessage?.message,
    messages,
    unreadByAdmin,
    unreadByUser,
    createdAt: toDateLabel(row.created_at),
    updatedAt: toDateLabel(row.updated_at),
  };
}

const THREAD_SELECT = `
  id,
  student_id,
  subject,
  status,
  created_at,
  updated_at,
  deleted_by_admin,
  deleted_by_student,
  last_read_by_admin_at,
  last_read_by_student_at,
  student:users!support_threads_student_id_fkey(id, email, name, role),
  messages:support_messages(id, sender_role, sender_name, message, created_at, deleted_by_admin, deleted_by_student)
`;

async function getCurrentActor(): Promise<ActorProfile> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    throw authError ?? new Error('Not authenticated');
  }

  const { data: profile, error } = await supabase
    .from('users')
    .select('id, email, name, role')
    .eq('id', authData.user.id)
    .single<{ id: string; email: string; name: string; role: string }>();

  if (error || !profile) {
    throw error ?? new Error('User profile not found');
  }

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role === 'admin' ? 'admin' : 'student',
  };
}

async function fetchThreadById(id: string): Promise<SupportTicket> {
  const actor = await getCurrentActor();
  const { data, error } = await supabase
    .from('support_threads')
    .select(THREAD_SELECT)
    .eq('id', id)
    .single<SupportThreadRow>();

  if (error || !data) {
    throw error ?? new Error('Thread not found');
  }

  return mapThread(data, actor.role);
}

function withChatSchemaHint(error: unknown): never {
  const message = error instanceof Error ? error.message : String(error);
  throw new Error(`Chat backend error: ${message}. Run latest supabase/schema.sql in Supabase SQL Editor.`);
}

export async function fetchPlatformSettings() {
  await wait(120);
  try {
    const actor = await getCurrentActor();
    const { data, error } = await supabase
      .from('platform_settings')
      .select('id, maintenance_mode, announcement, default_theme')
      .eq('id', 1)
      .maybeSingle<{
        id: number;
        maintenance_mode: boolean;
        announcement: string;
        default_theme: 'light' | 'dark' | 'system';
      }>();

    if (error) {
      throw error;
    }

    if (data) {
      return {
        maintenanceMode: data.maintenance_mode,
        announcement: data.announcement,
        defaultTheme: data.default_theme,
      };
    }

    const { data: inserted, error: insertError } = await supabase
      .from('platform_settings')
      .insert({
        id: 1,
        maintenance_mode: defaultSettings.maintenanceMode,
        announcement: defaultSettings.announcement,
        default_theme: defaultSettings.defaultTheme,
        updated_by: actor.id,
      })
      .select('id, maintenance_mode, announcement, default_theme')
      .single<{
        id: number;
        maintenance_mode: boolean;
        announcement: string;
        default_theme: 'light' | 'dark' | 'system';
      }>();

    if (insertError || !inserted) {
      throw insertError ?? new Error('Failed to initialize platform settings');
    }

    return {
      maintenanceMode: inserted.maintenance_mode,
      announcement: inserted.announcement,
      defaultTheme: inserted.default_theme,
    };
  } catch (error) {
    withChatSchemaHint(error);
  }
}

export async function savePlatformSettings(next: PlatformSettings) {
  await wait(180);
  try {
    const actor = await getCurrentActor();
    const { data, error } = await supabase
      .from('platform_settings')
      .upsert({
        id: 1,
        maintenance_mode: next.maintenanceMode,
        announcement: next.announcement,
        default_theme: next.defaultTheme,
        updated_by: actor.id,
      }, { onConflict: 'id' })
      .select('id, maintenance_mode, announcement, default_theme')
      .single<{
        id: number;
        maintenance_mode: boolean;
        announcement: string;
        default_theme: 'light' | 'dark' | 'system';
      }>();

    if (error || !data) {
      throw error ?? new Error('Failed to save platform settings');
    }

    return {
      maintenanceMode: data.maintenance_mode,
      announcement: data.announcement,
      defaultTheme: data.default_theme,
    };
  } catch (error) {
    withChatSchemaHint(error);
  }
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
  try {
    const { data, error } = await supabase
      .from('support_threads')
      .select(THREAD_SELECT)
      .eq('deleted_by_admin', false)
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => mapThread(row as SupportThreadRow, 'admin'));
  } catch (error) {
    withChatSchemaHint(error);
  }
}

export async function fetchUserTickets(_email: string) {
  try {
    const actor = await getCurrentActor();
    const { data, error } = await supabase
      .from('support_threads')
      .select(THREAD_SELECT)
      .eq('student_id', actor.id)
      .eq('deleted_by_student', false)
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => mapThread(row as SupportThreadRow, 'student'));
  } catch (error) {
    withChatSchemaHint(error);
  }
}

export async function createSupportTicket(input: {
  fromEmail: string;
  fromName: string;
  role: UserRole;
  subject: string;
  message: string;
}) {
  try {
    const actor = await getCurrentActor();
    const now = new Date().toISOString();
    const { data: thread, error: threadError } = await supabase
      .from('support_threads')
      .insert({
        student_id: actor.id,
        subject: input.subject.trim(),
        status: 'open',
        last_read_by_student_at: now,
      })
      .select('id')
      .single<{ id: string }>();

    if (threadError || !thread) {
      throw threadError ?? new Error('Failed to create thread');
    }

    const { error: messageError } = await supabase.from('support_messages').insert({
      thread_id: thread.id,
      sender_id: actor.id,
      sender_role: 'student',
      sender_name: actor.name,
      message: input.message.trim(),
    });

    if (messageError) {
      throw messageError;
    }

    return fetchThreadById(thread.id);
  } catch (error) {
    withChatSchemaHint(error);
  }
}

export async function createAdminNotification(input: {
  toEmail: string;
  toName: string;
  subject: string;
  message: string;
}) {
  try {
    const actor = await getCurrentActor();
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', input.toEmail)
      .single<{ id: string; email: string; name: string }>();

    if (studentError || !student) {
      throw studentError ?? new Error('Student not found');
    }

    const now = new Date().toISOString();
    const { data: thread, error: threadError } = await supabase
      .from('support_threads')
      .insert({
        student_id: student.id,
        subject: input.subject.trim(),
        status: 'in_progress',
        last_read_by_admin_at: now,
      })
      .select('id')
      .single<{ id: string }>();

    if (threadError || !thread) {
      throw threadError ?? new Error('Failed to create thread');
    }

    const { error: messageError } = await supabase.from('support_messages').insert({
      thread_id: thread.id,
      sender_id: actor.id,
      sender_role: 'admin',
      sender_name: actor.name,
      message: input.message.trim(),
    });

    if (messageError) {
      throw messageError;
    }

    return fetchThreadById(thread.id);
  } catch (error) {
    withChatSchemaHint(error);
  }
}

export async function updateSupportTicket(input: {
  id: string;
  status: TicketStatus;
  adminReply?: string;
}) {
  try {
    const actor = await getCurrentActor();
    if (actor.role !== 'admin') {
      throw new Error('Only admin can update ticket status');
    }

    const patch: {
      status: TicketStatus;
      last_read_by_admin_at: string;
      updated_at: string;
    } = {
      status: input.status,
      last_read_by_admin_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase.from('support_threads').update(patch).eq('id', input.id);
    if (updateError) {
      throw updateError;
    }

    if (input.adminReply?.trim()) {
      const { error: replyError } = await supabase.from('support_messages').insert({
        thread_id: input.id,
        sender_id: actor.id,
        sender_role: 'admin',
        sender_name: actor.name,
        message: input.adminReply.trim(),
      });

      if (replyError) {
        throw replyError;
      }
    }

    return fetchSupportTickets();
  } catch (error) {
    withChatSchemaHint(error);
  }
}

export async function sendTicketMessage(input: {
  id: string;
  sender: TicketSender;
  senderName: string;
  message: string;
}) {
  try {
    const actor = await getCurrentActor();
    const senderRole: 'admin' | 'student' = actor.role === 'admin' ? 'admin' : 'student';
    const now = new Date().toISOString();

    const { error: messageError } = await supabase.from('support_messages').insert({
      thread_id: input.id,
      sender_id: actor.id,
      sender_role: senderRole,
      sender_name: actor.name,
      message: input.message.trim(),
    });

    if (messageError) {
      throw messageError;
    }

    const patch: {
      updated_at: string;
      status: TicketStatus;
      last_read_by_admin_at?: string;
      last_read_by_student_at?: string;
    } = {
      updated_at: now,
      status: senderRole === 'admin' ? 'in_progress' : 'open',
    };

    if (senderRole === 'admin') {
      patch.last_read_by_admin_at = now;
    } else {
      patch.last_read_by_student_at = now;
    }

    const { error: updateError } = await supabase.from('support_threads').update(patch).eq('id', input.id);
    if (updateError) {
      throw updateError;
    }

    return senderRole === 'admin' ? fetchSupportTickets() : fetchUserTickets(actor.email);
  } catch (error) {
    withChatSchemaHint(error);
  }
}

export async function markSupportTicketsSeen(input: { viewer: TicketSender; email?: string }) {
  try {
    const actor = await getCurrentActor();
    const now = new Date().toISOString();

    if (input.viewer === 'admin' || actor.role === 'admin') {
      const { error } = await supabase
        .from('support_threads')
        .update({ last_read_by_admin_at: now })
        .eq('deleted_by_admin', false);

      if (error) {
        throw error;
      }

      return fetchSupportTickets();
    }

    const { error } = await supabase
      .from('support_threads')
      .update({ last_read_by_student_at: now })
      .eq('student_id', actor.id)
      .eq('deleted_by_student', false);

    if (error) {
      throw error;
    }

    return fetchUserTickets(actor.email);
  } catch (error) {
    withChatSchemaHint(error);
  }
}

export async function deleteSupportTicket(input: {
  id: string;
  actor: TicketSender;
  email?: string;
  scope?: 'me' | 'both';
}) {
  try {
    const actor = await getCurrentActor();

    if (input.actor === 'admin' || actor.role === 'admin') {
      if (input.scope === 'both') {
        const { error } = await supabase.from('support_threads').delete().eq('id', input.id);
        if (error) {
          throw error;
        }
        return fetchSupportTickets();
      }

      const { error } = await supabase
        .from('support_threads')
        .update({ deleted_by_admin: true, updated_at: new Date().toISOString() })
        .eq('id', input.id);

      if (error) {
        throw error;
      }

      return fetchSupportTickets();
    }

    const { error } = await supabase
      .from('support_threads')
      .update({ deleted_by_student: true, updated_at: new Date().toISOString() })
      .eq('id', input.id)
      .eq('student_id', actor.id);

    if (error) {
      throw error;
    }

    return fetchUserTickets(actor.email);
  } catch (error) {
    withChatSchemaHint(error);
  }
}

export async function deleteSupportMessage(input: {
  threadId: string;
  messageId: string;
  actor: TicketSender;
  email?: string;
  scope?: 'me' | 'both';
}) {
  try {
    const actor = await getCurrentActor();
    let deleteError: Error | null = null;
    if (actor.role === 'admin') {
      if (input.scope === 'both') {
        const { error } = await supabase
          .from('support_messages')
          .delete()
          .eq('id', input.messageId)
          .eq('thread_id', input.threadId);
        deleteError = error;
      } else {
        const { error } = await supabase
          .from('support_messages')
          .update({ deleted_by_admin: true })
          .eq('id', input.messageId)
          .eq('thread_id', input.threadId);
        deleteError = error;
      }
    } else {
      const { error } = await supabase
        .from('support_messages')
        .update({ deleted_by_student: true })
        .eq('id', input.messageId)
        .eq('thread_id', input.threadId);
      deleteError = error;
    }

    if (deleteError) {
      throw deleteError;
    }

    const now = new Date().toISOString();
    const patch: {
      updated_at: string;
      last_read_by_admin_at?: string;
      last_read_by_student_at?: string;
    } = { updated_at: now };

    if (actor.role === 'admin') {
      patch.last_read_by_admin_at = now;
    } else {
      patch.last_read_by_student_at = now;
    }

    const { error: threadUpdateError } = await supabase.from('support_threads').update(patch).eq('id', input.threadId);
    if (threadUpdateError) {
      throw threadUpdateError;
    }

    return actor.role === 'admin' ? fetchSupportTickets() : fetchUserTickets(actor.email);
  } catch (error) {
    withChatSchemaHint(error);
  }
}
