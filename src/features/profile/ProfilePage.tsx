import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Skeleton from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  createSupportTicket,
  deleteSupportMessage,
  deleteSupportTicket,
  fetchUserTickets,
  markSupportTicketsSeen,
  sendTicketMessage,
  SupportTicket,
} from '../admin/interactionsApi';

const MY_TICKETS_KEY = ['my-support-tickets'];
const COUNTRIES = [
  { name: 'United States', code: '+1' },
  { name: 'Ethiopia', code: '+251' },
  { name: 'United Kingdom', code: '+44' },
  { name: 'India', code: '+91' },
  { name: 'Nigeria', code: '+234' },
  { name: 'Kenya', code: '+254' },
  { name: 'South Africa', code: '+27' },
  { name: 'Australia', code: '+61' },
  { name: 'Japan', code: '+81' },
];

const PHONE_RULES: Record<string, { min: number; max: number; example: string }> = {
  '+1': { min: 10, max: 10, example: '415 555 0134' },
  '+251': { min: 9, max: 9, example: '911 234 567' },
  '+44': { min: 10, max: 11, example: '20 7946 0958' },
  '+91': { min: 10, max: 10, example: '98765 43210' },
  '+234': { min: 10, max: 10, example: '801 234 5678' },
  '+254': { min: 9, max: 9, example: '712 345 678' },
  '+27': { min: 9, max: 9, example: '71 234 5678' },
  '+61': { min: 9, max: 9, example: '412 345 678' },
  '+81': { min: 10, max: 10, example: '90 1234 5678' },
};

function splitPhone(value?: string) {
  const raw = (value ?? '').trim();
  const match = raw.match(/^(\+\d{1,4})\s*(.*)$/);
  if (match) {
    return { code: match[1], number: match[2] };
  }
  return { code: '+1', number: raw };
}

function normalizeCountryCode(code: string) {
  return COUNTRIES.some((country) => country.code === code) ? code : '+1';
}

function getPhoneRule(code: string) {
  return PHONE_RULES[code] ?? { min: 6, max: 14, example: '123 456 789' };
}

function digitsOnly(value: string) {
  return value.replace(/[^\d]/g, '');
}

function isValidPhone(code: string, value: string) {
  const digits = digitsOnly(value);
  const rule = getPhoneRule(code);
  return digits.length >= rule.min && digits.length <= rule.max;
}

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

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [bio, setBio] = useState('');

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;

    setName(user.name);
    setUsername(user.username ?? '');
    setAvatarUrl(user.avatarUrl ?? '');
    const parsed = splitPhone(user.phone);
    setCountryCode(normalizeCountryCode(parsed.code));
    setPhoneNumber(parsed.number);
    setPhoneError('');
    setBio(user.bio ?? '');
  }, [user]);

  useEffect(() => {
    if (!user?.email) return;

    void markSupportTicketsSeen({ viewer: 'user', email: user.email }).then(() => {
      queryClient.invalidateQueries({ queryKey: [...MY_TICKETS_KEY, user.email] });
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
    });
  }, [queryClient, user?.email]);

  useEffect(() => {
    if (!user?.email) return;

    const channel = supabase
      .channel(`profile-support-realtime-${user.email}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_threads' }, () => {
        queryClient.invalidateQueries({ queryKey: [...MY_TICKETS_KEY, user.email] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, () => {
        queryClient.invalidateQueries({ queryKey: [...MY_TICKETS_KEY, user.email] });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient, user?.email]);

  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      toast.success('Profile updated in database');
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : 'Profile update failed';
      toast.error(msg);
    },
  });

  const ticketsQuery = useQuery({
    queryKey: [...MY_TICKETS_KEY, user?.email],
    queryFn: () => fetchUserTickets(user?.email ?? ''),
    enabled: Boolean(user?.email),
    refetchOnWindowFocus: true,
  });

  const sendTicket = useMutation({
    mutationFn: createSupportTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...MY_TICKETS_KEY, user?.email] });
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      toast.success('Request sent to admin');
      setSubject('');
      setMessage('');
    },
    onError: () => toast.error('Failed to send request'),
  });

  const sendReply = useMutation({
    mutationFn: sendTicketMessage,
    onMutate: async (payload) => {
      if (!user?.email) return { previous: [] as SupportTicket[] };
      const key = [...MY_TICKETS_KEY, user.email];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = (queryClient.getQueryData(key) as SupportTicket[] | undefined) ?? [];
      queryClient.setQueryData(key, withOptimisticMessage(previous, payload.id, payload.senderName, payload.message));
      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...MY_TICKETS_KEY, user?.email] });
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      toast.success('Reply sent');
    },
    onError: (_error, _vars, context) => {
      if (user?.email && context?.previous) {
        queryClient.setQueryData([...MY_TICKETS_KEY, user.email], context.previous);
      }
      toast.error('Failed to send reply');
    },
  });

  const deleteChat = useMutation({
    mutationFn: (ticketId: string) => deleteSupportTicket({ id: ticketId, actor: 'user', email: user?.email }),
    onMutate: async (ticketId) => {
      if (!user?.email) return { previous: [] as SupportTicket[] };
      const key = [...MY_TICKETS_KEY, user.email];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = (queryClient.getQueryData(key) as SupportTicket[] | undefined) ?? [];
      queryClient.setQueryData(key, previous.filter((t) => t.id !== ticketId));
      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...MY_TICKETS_KEY, user?.email] });
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      toast.success('Chat deleted');
    },
    onError: (_error, _vars, context) => {
      if (user?.email && context?.previous) {
        queryClient.setQueryData([...MY_TICKETS_KEY, user.email], context.previous);
      }
      toast.error('Failed to delete chat');
    },
  });

  const deleteMessage = useMutation({
    mutationFn: ({ threadId, messageId }: { threadId: string; messageId: string }) =>
      deleteSupportMessage({ threadId, messageId, actor: 'user', email: user?.email }),
    onMutate: async ({ threadId, messageId }) => {
      if (!user?.email) return { previous: [] as SupportTicket[] };
      const key = [...MY_TICKETS_KEY, user.email];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = (queryClient.getQueryData(key) as SupportTicket[] | undefined) ?? [];
      queryClient.setQueryData(key, withoutMessage(previous, threadId, messageId));
      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...MY_TICKETS_KEY, user?.email] });
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      toast.success('Message deleted');
    },
    onError: (_error, _vars, context) => {
      if (user?.email && context?.previous) {
        queryClient.setQueryData([...MY_TICKETS_KEY, user.email], context.previous);
      }
      toast.error('Failed to delete message');
    },
  });

  const onProfileSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (phoneNumber.trim() && !isValidPhone(countryCode, phoneNumber)) {
      const rule = getPhoneRule(countryCode);
      const msg = `Phone number should be ${rule.min === rule.max ? rule.min : `${rule.min}-${rule.max}`} digits for ${countryCode}.`;
      setPhoneError(msg);
      toast.error('Please enter a valid phone number');
      return;
    }

    const combinedPhone = phoneNumber.trim() ? `${countryCode} ${phoneNumber.trim()}` : '';

    profileMutation.mutate({
      name: name.trim(),
      username: username.trim(),
      avatarUrl: avatarUrl.trim(),
      phone: combinedPhone,
      bio: bio.trim(),
    });
  };

  const onTicketSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!user || !subject.trim() || !message.trim()) {
      toast.error('Please fill subject and message');
      return;
    }

    sendTicket.mutate({
      fromEmail: user.email,
      fromName: user.name,
      role: user.role,
      subject: subject.trim(),
      message: message.trim(),
    });
    setIsContactOpen(false);
  };

  const onSendReply = (ticketId: string) => {
    if (!user) return;
    const draft = replyDrafts[ticketId]?.trim();
    if (!draft) {
      toast.error('Reply cannot be empty');
      return;
    }

    sendReply.mutate({
      id: ticketId,
      sender: 'user',
      senderName: user.name,
      message: draft,
    });

    setReplyDrafts((prev) => ({ ...prev, [ticketId]: '' }));
  };

  return (
    <div className="stack-lg">
      <Card className="stack">
        <div className="row-between">
          <div className="stack-xs">
            <h2 className="icon-heading"><i className="fa-solid fa-user-gear" aria-hidden="true" /> Profile Settings</h2>
            <p className="muted">Edit your own profile fields. Role and account status are admin-controlled.</p>
          </div>
          <Button onClick={() => setIsContactOpen(true)}>
            <span className="icon-label">
              <i className="fa-solid fa-envelope" aria-hidden="true" />
              Contact Admin
            </span>
          </Button>
        </div>
      </Card>

      <Card className="stack">
        <h3 className="icon-heading"><i className="fa-solid fa-user-pen" aria-hidden="true" /> Edit Profile</h3>
        {!user ? <Skeleton className="h-20" /> : null}
        <form className="stack" onSubmit={onProfileSubmit}>
          <label>
            Full Name
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
          </label>
          <label>
            Username
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
          </label>
          <label>
            Profile Photo URL
            <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
          </label>
          <label>
            Phone
            <div className="row gap-sm">
              <select
                className="input"
                value={countryCode}
                onChange={(e) => {
                  setCountryCode(e.target.value);
                  setPhoneError('');
                }}
              >
                {COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name} ({country.code})
                  </option>
                ))}
              </select>
              <Input
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  if (phoneError) setPhoneError('');
                }}
                placeholder={`e.g. ${getPhoneRule(countryCode).example}`}
                aria-invalid={Boolean(phoneError)}
              />
            </div>
            <span className="muted">Format: {countryCode} {getPhoneRule(countryCode).example} (digits only)</span>
            {phoneError ? <span className="text-error">{phoneError}</span> : null}
          </label>
          <label>
            Bio
            <textarea className="input textarea" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Short bio" />
          </label>
          <Button disabled={profileMutation.isPending}><span className="icon-label"><i className="fa-solid fa-floppy-disk" aria-hidden="true" /> {profileMutation.isPending ? 'Saving...' : 'Save Profile'}</span></Button>
        </form>
      </Card>

      <Card className="stack">
        <h3 className="icon-heading"><i className="fa-solid fa-inbox" aria-hidden="true" /> My Requests</h3>
        {ticketsQuery.isLoading ? (
          <div className="stack">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        ) : null}

        {!ticketsQuery.isLoading && (ticketsQuery.data ?? []).length === 0 ? <p className="muted">No requests yet.</p> : null}

        {(ticketsQuery.data ?? []).map((t) => (
          <article key={t.id} className="list-row stack-sm">
            <div className="row-between">
              <strong>{t.subject}</strong>
              <span className={`status-pill ${t.status === 'resolved' ? 'active' : 'suspended'}`}>
                {t.status.replace('_', ' ')}
              </span>
            </div>

            <div className="stack-sm">
              {t.messages.map((m) => (
                <div key={m.id} className="row-between gap-sm">
                  <p className="muted">
                    <strong>{m.sender === 'admin' ? 'Admin' : m.senderName}:</strong> {m.message}
                  </p>
                  {m.sender === 'user' ? (
                    <Button
                      variant="secondary"
                      onClick={() => deleteMessage.mutate({ threadId: t.id, messageId: m.id })}
                      disabled={deleteMessage.isPending}
                    >
                      <span className="icon-label"><i className="fa-solid fa-trash" aria-hidden="true" /> Delete Msg</span>
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>

            <p className="muted">Created: {t.createdAt}</p>

            <div className="row gap-sm">
              <Input
                value={replyDrafts[t.id] ?? ''}
                onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [t.id]: e.target.value }))}
                placeholder="Reply to admin"
              />
              <Button onClick={() => onSendReply(t.id)} disabled={sendReply.isPending}>
                <span className="icon-label"><i className="fa-solid fa-paper-plane" aria-hidden="true" /> Send</span>
              </Button>
              <Button variant="danger" onClick={() => deleteChat.mutate(t.id)} disabled={deleteChat.isPending}>
                <span className="icon-label"><i className="fa-solid fa-trash" aria-hidden="true" /> Delete Chat</span>
              </Button>
            </div>
          </article>
        ))}
      </Card>

      <Modal isOpen={isContactOpen} title="Contact Admin" onClose={() => setIsContactOpen(false)}>
        <form className="stack" onSubmit={onTicketSubmit}>
          <label>
            Subject
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What do you need help with?" />
          </label>
          <label>
            Message
            <textarea
              className="input textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue or request"
            />
          </label>
          <div className="row gap-sm">
            <Button disabled={sendTicket.isPending}><span className="icon-label"><i className="fa-solid fa-paper-plane" aria-hidden="true" /> {sendTicket.isPending ? 'Sending...' : 'Send to Admin'}</span></Button>
            <Button type="button" variant="secondary" onClick={() => setIsContactOpen(false)}>
              <span className="icon-label"><i className="fa-solid fa-xmark" aria-hidden="true" /> Cancel</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
