import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import Skeleton from '../../../components/ui/Skeleton';
import { supabase } from '../../../lib/supabase';
import {
  deleteSupportMessage,
  deleteSupportTicket,
  fetchSupportTickets,
  markSupportTicketsSeen,
  sendTicketMessage,
  SupportTicket,
  updateSupportTicket,
} from '../interactionsApi';

const TICKETS_KEY = ['admin-support-tickets'];
const INITIAL_VISIBLE_MESSAGES = 8;

function withOptimisticMessage(tickets: SupportTicket[], threadId: string, senderName: string, message: string) {
  return tickets.map((t) => {
    if (t.id !== threadId) return t;
    const now = new Date().toISOString().slice(0, 10);
    return {
      ...t,
      status: 'in_progress',
      updatedAt: now,
      messages: [
        ...t.messages,
        {
          id: `tmp-${crypto.randomUUID()}`,
          sender: 'admin' as const,
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

export default function ReportsPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [visibleMessages, setVisibleMessages] = useState<Record<string, number>>({});

  const ticketsQuery = useQuery({ queryKey: TICKETS_KEY, queryFn: fetchSupportTickets });

  useEffect(() => {
    void markSupportTicketsSeen({ viewer: 'admin' }).then(() => {
      queryClient.invalidateQueries({ queryKey: TICKETS_KEY });
    });
  }, [queryClient]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-support-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_threads' }, () => {
        queryClient.invalidateQueries({ queryKey: TICKETS_KEY });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, () => {
        queryClient.invalidateQueries({ queryKey: TICKETS_KEY });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const updateMutation = useMutation({
    mutationFn: updateSupportTicket,
    onSuccess: (next) => {
      queryClient.setQueryData(TICKETS_KEY, next);
      queryClient.invalidateQueries({ queryKey: ['my-support-tickets'] });
      toast.success('Ticket updated');
      setSelectedId(null);
      setReply('');
    },
    onError: () => toast.error('Failed to update ticket'),
  });

  const replyMutation = useMutation({
    mutationFn: sendTicketMessage,
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: TICKETS_KEY });
      const previous = (queryClient.getQueryData(TICKETS_KEY) as SupportTicket[] | undefined) ?? [];
      const optimistic = withOptimisticMessage(previous, payload.id, payload.senderName, payload.message);
      queryClient.setQueryData(TICKETS_KEY, optimistic);
      return { previous };
    },
    onSuccess: (next) => {
      queryClient.setQueryData(TICKETS_KEY, next);
      queryClient.invalidateQueries({ queryKey: ['my-support-tickets'] });
      toast.success('Reply sent');
      setSelectedId(null);
      setReply('');
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(TICKETS_KEY, context.previous);
      }
      toast.error('Failed to send reply');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, scope }: { id: string; scope: 'me' | 'both' }) =>
      deleteSupportTicket({ id, actor: 'admin', scope }),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: TICKETS_KEY });
      const previous = (queryClient.getQueryData(TICKETS_KEY) as SupportTicket[] | undefined) ?? [];
      queryClient.setQueryData(
        TICKETS_KEY,
        previous.filter((t) => t.id !== id)
      );
      return { previous };
    },
    onSuccess: (next) => {
      queryClient.setQueryData(TICKETS_KEY, next);
      queryClient.invalidateQueries({ queryKey: ['my-support-tickets'] });
      toast.success('Chat deleted');
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(TICKETS_KEY, context.previous);
      }
      toast.error('Failed to delete chat');
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: ({ threadId, messageId, scope }: { threadId: string; messageId: string; scope: 'me' | 'both' }) =>
      deleteSupportMessage({ threadId, messageId, actor: 'admin', scope }),
    onMutate: async ({ threadId, messageId }) => {
      await queryClient.cancelQueries({ queryKey: TICKETS_KEY });
      const previous = (queryClient.getQueryData(TICKETS_KEY) as SupportTicket[] | undefined) ?? [];
      queryClient.setQueryData(TICKETS_KEY, withoutMessage(previous, threadId, messageId));
      return { previous };
    },
    onSuccess: (next) => {
      queryClient.setQueryData(TICKETS_KEY, next);
      queryClient.invalidateQueries({ queryKey: ['my-support-tickets'] });
      toast.success('Message deleted');
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(TICKETS_KEY, context.previous);
      }
      toast.error('Failed to delete message');
    },
  });

  const selected = (ticketsQuery.data ?? []).find((t) => t.id === selectedId) ?? null;

  return (
    <Card className="stack">
      <h2 className="icon-heading"><i className="fa-solid fa-headset" aria-hidden="true" /> Support & Interaction Reports</h2>
      <p className="muted">Respond to user requests and manage ticket status.</p>

      {ticketsQuery.isLoading ? (
        <div className="stack">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : null}

      {(ticketsQuery.data ?? []).map((t) => {
        const visibleCount = visibleMessages[t.id] ?? INITIAL_VISIBLE_MESSAGES;
        const total = t.messages.length;
        const start = Math.max(0, total - visibleCount);
        const visible = t.messages.slice(start);

        return (
          <article key={t.id} className="list-row stack-sm">
            <div className="row-between">
              <strong>{t.subject}</strong>
              <span className={`status-pill ${t.status === 'resolved' ? 'active' : 'suspended'}`}>{t.status.replace('_', ' ')}</span>
            </div>
            <p><strong>{t.fromName}</strong> ({t.fromEmail})</p>

            {total > visible.length ? (
              <Button
                variant="ghost"
                onClick={() => setVisibleMessages((prev) => ({ ...prev, [t.id]: (prev[t.id] ?? INITIAL_VISIBLE_MESSAGES) + 10 }))}
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
                  <Button
                    variant="secondary"
                    onClick={() => deleteMessageMutation.mutate({ threadId: t.id, messageId: m.id, scope: 'me' })}
                    disabled={deleteMessageMutation.isPending}
                  >
                    <span className="icon-label"><i className="fa-solid fa-trash" aria-hidden="true" /> Del Msg (Me)</span>
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => deleteMessageMutation.mutate({ threadId: t.id, messageId: m.id, scope: 'both' })}
                    disabled={deleteMessageMutation.isPending}
                  >
                    <span className="icon-label"><i className="fa-solid fa-trash" aria-hidden="true" /> Del Msg (Both)</span>
                  </Button>
                </div>
              ))}
            </div>

            <div className="row gap-sm">
              <Button variant="secondary" onClick={() => updateMutation.mutate({ id: t.id, status: 'in_progress', adminReply: t.adminReply })}>
                <span className="icon-label"><i className="fa-solid fa-hourglass-half" aria-hidden="true" /> In Progress</span>
              </Button>
              <Button variant="secondary" onClick={() => updateMutation.mutate({ id: t.id, status: 'resolved', adminReply: t.adminReply })}>
                <span className="icon-label"><i className="fa-solid fa-circle-check" aria-hidden="true" /> Resolve</span>
              </Button>
              <Button onClick={() => { setSelectedId(t.id); setReply(''); }}>
                <span className="icon-label"><i className="fa-solid fa-reply" aria-hidden="true" /> Reply</span>
              </Button>
              <Button variant="secondary" onClick={() => deleteMutation.mutate({ id: t.id, scope: 'me' })} disabled={deleteMutation.isPending}>
                <span className="icon-label"><i className="fa-solid fa-trash" aria-hidden="true" /> Delete Chat (Me)</span>
              </Button>
              <Button variant="danger" onClick={() => deleteMutation.mutate({ id: t.id, scope: 'both' })} disabled={deleteMutation.isPending}>
                <span className="icon-label"><i className="fa-solid fa-trash" aria-hidden="true" /> Delete Chat (Both)</span>
              </Button>
            </div>
          </article>
        );
      })}

      <Modal isOpen={Boolean(selected)} title="Reply to Ticket" onClose={() => setSelectedId(null)}>
        <div className="stack">
          <p className="muted">{selected?.subject}</p>
          <label>
            Admin Reply
            <Input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type reply" />
          </label>
          <div className="row gap-sm">
            <Button
              onClick={() => selected && replyMutation.mutate({ id: selected.id, sender: 'admin', senderName: 'Admin', message: reply })}
              disabled={replyMutation.isPending}
            >
              <span className="icon-label"><i className="fa-solid fa-paper-plane" aria-hidden="true" /> Send Reply</span>
            </Button>
            <Button variant="secondary" onClick={() => setSelectedId(null)}>
              <span className="icon-label"><i className="fa-solid fa-xmark" aria-hidden="true" /> Cancel</span>
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
