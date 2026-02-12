import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import Skeleton from '../../../components/ui/Skeleton';
import { fetchSupportTickets, updateSupportTicket } from '../interactionsApi';

const TICKETS_KEY = ['admin-support-tickets'];

export default function ReportsPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState('');

  const ticketsQuery = useQuery({ queryKey: TICKETS_KEY, queryFn: fetchSupportTickets });

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

      {(ticketsQuery.data ?? []).map((t) => (
        <article key={t.id} className="list-row stack-sm">
          <div className="row-between">
            <strong>{t.subject}</strong>
            <span className={`status-pill ${t.status === 'resolved' ? 'active' : 'suspended'}`}>{t.status.replace('_', ' ')}</span>
          </div>
          <p><strong>{t.fromName}</strong> ({t.fromEmail})</p>
          <p className="muted">{t.message}</p>
          {t.adminReply ? <p className="muted"><strong>Reply:</strong> {t.adminReply}</p> : null}
          <div className="row gap-sm">
            <Button variant="secondary" onClick={() => updateMutation.mutate({ id: t.id, status: 'in_progress', adminReply: t.adminReply })}>
              <span className="icon-label"><i className="fa-solid fa-hourglass-half" aria-hidden="true" /> In Progress</span>
            </Button>
            <Button variant="secondary" onClick={() => updateMutation.mutate({ id: t.id, status: 'resolved', adminReply: t.adminReply })}>
              <span className="icon-label"><i className="fa-solid fa-circle-check" aria-hidden="true" /> Resolve</span>
            </Button>
            <Button onClick={() => { setSelectedId(t.id); setReply(t.adminReply ?? ''); }}>
              <span className="icon-label"><i className="fa-solid fa-reply" aria-hidden="true" /> Reply</span>
            </Button>
          </div>
        </article>
      ))}

      <Modal isOpen={Boolean(selected)} title="Reply to Ticket" onClose={() => setSelectedId(null)}>
        <div className="stack">
          <p className="muted">{selected?.subject}</p>
          <label>
            Admin Reply
            <Input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type reply" />
          </label>
          <div className="row gap-sm">
            <Button onClick={() => selected && updateMutation.mutate({ id: selected.id, status: 'in_progress', adminReply: reply })}>
              <span className="icon-label"><i className="fa-solid fa-floppy-disk" aria-hidden="true" /> Save Reply</span>
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
