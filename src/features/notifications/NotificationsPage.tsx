import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Skeleton from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  deleteSupportMessage,
  deleteSupportTicket,
  fetchPlatformSettings,
  fetchUserTickets,
  markSupportTicketsSeen,
  sendTicketMessage,
  SupportTicket,
} from '../admin/interactionsApi';

const INITIAL_VISIBLE_MESSAGES = 8;

function withOptimisticMessage(tickets: SupportTicket[], threadId: string, senderName: string, message: string) {
  return tickets.map((t) => {
    if (t.id !== threadId) return t;
    const now = new Date().toISOString().slice(0, 10);
    return {
      ...t,
      status: 'open',
      updatedAt: now,
      messages: [
        ...t.messages,
        {
          id: `tmp-${crypto.randomUUID()}`,
          sender: 'user' as const,
          senderName,
          message,
          createdAt: now,
        },
      ],
    };
  });
}

function withoutMessage(tickets: SupportTicket[], threadId: string, messageId: string) {
  return tickets.map((t) =>
    t.id === threadId ? { ...t, messages: t.messages.filter((m) => m.id !== messageId) } : t
  );
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [visibleMessages, setVisibleMessages] = useState<Record<string, number>>({});

  const settingsQuery = useQuery({
    queryKey: ['platform-settings'],
    queryFn: fetchPlatformSettings,
  });

  const ticketsQuery = useQuery({
    queryKey: ['my-support-tickets', user?.email],
    queryFn: () => fetchUserTickets(user?.email ?? ''),
    enabled: Boolean(user?.email),
  });

  useEffect(() => {
    if (!user?.email) return;

    void markSupportTicketsSeen({ viewer: 'user', email: user.email }).then(() => {
      queryClient.invalidateQueries({ queryKey: ['my-support-tickets', user.email] });
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
    });
  }, [queryClient, user?.email]);

  useEffect(() => {
    if (!user?.email) return;

    const channel = supabase
      .channel(`student-support-realtime-${user.email}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_threads' }, () => {
        queryClient.invalidateQueries({ queryKey: ['my-support-tickets', user.email] });
        queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, () => {
        queryClient.invalidateQueries({ queryKey: ['my-support-tickets', user.email] });
        queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'platform_settings' }, () => {
        queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient, user?.email]);

  const replyMutation = useMutation({
    mutationFn: sendTicketMessage,
    onMutate: async (payload) => {
      if (!user?.email) return { previous: [] as SupportTicket[] };

      const key = ['my-support-tickets', user.email];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = (queryClient.getQueryData(key) as SupportTicket[] | undefined) ?? [];
      queryClient.setQueryData(key, withOptimisticMessage(previous, payload.id, payload.senderName, payload.message));
      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-support-tickets', user?.email] });
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      toast.success('Reply sent');
    },
    onError: (_error, _vars, context) => {
      if (user?.email && context?.previous) {
        queryClient.setQueryData(['my-support-tickets', user.email], context.previous);
      }
      toast.error('Failed to send reply');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (ticketId: string) => deleteSupportTicket({ id: ticketId, actor: 'user', email: user?.email }),
    onMutate: async (ticketId) => {
      if (!user?.email) return { previous: [] as SupportTicket[] };
      const key = ['my-support-tickets', user.email];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = (queryClient.getQueryData(key) as SupportTicket[] | undefined) ?? [];
      queryClient.setQueryData(key, previous.filter((t) => t.id !== ticketId));
      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-support-tickets', user?.email] });
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      toast.success('Chat deleted');
    },
    onError: (_error, _vars, context) => {
      if (user?.email && context?.previous) {
        queryClient.setQueryData(['my-support-tickets', user.email], context.previous);
      }
      toast.error('Failed to delete chat');
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: ({ threadId, messageId }: { threadId: string; messageId: string }) =>
      deleteSupportMessage({ threadId, messageId, actor: 'user', email: user?.email }),
    onMutate: async ({ threadId, messageId }) => {
      if (!user?.email) return { previous: [] as SupportTicket[] };
      const key = ['my-support-tickets', user.email];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = (queryClient.getQueryData(key) as SupportTicket[] | undefined) ?? [];
      queryClient.setQueryData(key, withoutMessage(previous, threadId, messageId));
      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-support-tickets', user?.email] });
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      toast.success('Message deleted');
    },
    onError: (_error, _vars, context) => {
      if (user?.email && context?.previous) {
        queryClient.setQueryData(['my-support-tickets', user.email], context.previous);
      }
      toast.error('Failed to delete message');
    },
  });

  const onSendReply = (ticketId: string) => {
    if (!user) return;
    const text = replyDrafts[ticketId]?.trim();
    if (!text) {
      toast.error('Reply cannot be empty');
      return;
    }

    replyMutation.mutate({
      id: ticketId,
      sender: 'user',
      senderName: user.name,
      message: text,
    });

    setReplyDrafts((prev) => ({ ...prev, [ticketId]: '' }));
  };

  return (
    <div className="stack-lg">
      <Card className="stack">
        <h2 className="icon-heading"><i className="fa-solid fa-bell" aria-hidden="true" /> Notifications</h2>
        <p className="muted">System announcements and chat threads with admin are shown here.</p>
      </Card>

      <Card className="stack">
        <h3 className="icon-heading"><i className="fa-solid fa-bullhorn" aria-hidden="true" /> Platform Announcement</h3>
        {settingsQuery.isLoading ? <Skeleton className="h-20" /> : null}
        {!settingsQuery.isLoading ? (
          <p className="muted">{settingsQuery.data?.announcement || 'No announcement at the moment.'}</p>
        ) : null}
      </Card>

      <Card className="stack">
        <h3 className="icon-heading"><i className="fa-solid fa-comments" aria-hidden="true" /> Chat With Admin</h3>
        {ticketsQuery.isLoading ? (
          <div className="stack">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        ) : null}

        {!ticketsQuery.isLoading && (ticketsQuery.data ?? []).length === 0 ? <p className="muted">No chats yet.</p> : null}

        {(ticketsQuery.data ?? []).map((ticket) => {
          const visibleCount = visibleMessages[ticket.id] ?? INITIAL_VISIBLE_MESSAGES;
          const total = ticket.messages.length;
          const start = Math.max(0, total - visibleCount);
          const visible = ticket.messages.slice(start);

          return (
            <article key={ticket.id} className="list-row stack-sm">
              <div className="row-between">
                <strong>{ticket.subject}</strong>
                <span className={`status-pill ${ticket.status === 'resolved' ? 'active' : 'suspended'}`}>
                  {ticket.status.replace('_', ' ')}
                </span>
              </div>

              {total > visible.length ? (
                <Button
                  variant="ghost"
                  onClick={() => setVisibleMessages((prev) => ({ ...prev, [ticket.id]: (prev[ticket.id] ?? INITIAL_VISIBLE_MESSAGES) + 10 }))}
                >
                  <span className="icon-label"><i className="fa-solid fa-clock-rotate-left" aria-hidden="true" /> Load older messages</span>
                </Button>
              ) : null}

              <div className="stack-sm">
                {visible.map((m) => (
                  <div key={m.id} className="row-between gap-sm">
                    <p className="muted">
                      <strong>{m.sender === 'admin' ? 'Admin' : m.senderName}:</strong> {m.message}
                    </p>
                    {m.sender === 'user' ? (
                      <Button
                        variant="secondary"
                        onClick={() => deleteMessageMutation.mutate({ threadId: ticket.id, messageId: m.id })}
                        disabled={deleteMessageMutation.isPending}
                      >
                        <span className="icon-label"><i className="fa-solid fa-trash" aria-hidden="true" /> Delete Msg</span>
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>

              <p className="muted">Updated: {ticket.updatedAt}</p>

              <div className="row gap-sm">
                <Input
                  value={replyDrafts[ticket.id] ?? ''}
                  onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                  placeholder="Reply to admin"
                />
                <Button onClick={() => onSendReply(ticket.id)} disabled={replyMutation.isPending}>
                  <span className="icon-label"><i className="fa-solid fa-paper-plane" aria-hidden="true" /> Send</span>
                </Button>
                <Button variant="danger" onClick={() => deleteMutation.mutate(ticket.id)} disabled={deleteMutation.isPending}>
                  <span className="icon-label"><i className="fa-solid fa-trash" aria-hidden="true" /> Delete Chat</span>
                </Button>
              </div>
            </article>
          );
        })}
      </Card>
    </div>
  );
}
