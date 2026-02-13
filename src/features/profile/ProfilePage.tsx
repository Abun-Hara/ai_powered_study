import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Skeleton from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';
import {
  createSupportTicket,
  fetchUserTickets,
} from '../admin/interactionsApi';
import {
  fetchManagedUserByEmail,
  updateManagedUserProfile,
} from '../admin/api';

const MY_TICKETS_KEY = ['my-support-tickets'];
const MY_PROFILE_KEY = ['my-profile'];
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

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bio, setBio] = useState('');

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isContactOpen, setIsContactOpen] = useState(false);

  const profileQuery = useQuery({
    queryKey: [...MY_PROFILE_KEY, user?.email],
    queryFn: () => fetchManagedUserByEmail(user?.email ?? ''),
    enabled: Boolean(user?.email),
  });

  useEffect(() => {
    const p = profileQuery.data;
    if (!p) {
      if (user) {
        setName(user.name);
        setUsername(user.username ?? '');
        setAvatarUrl(user.avatarUrl ?? '');
        const parsed = splitPhone(user.phone);
        setCountryCode(normalizeCountryCode(parsed.code));
        setPhoneNumber(parsed.number);
        setBio(user.bio ?? '');
      }
      return;
    }
    setName(p.name);
    setUsername(p.username ?? '');
    setAvatarUrl(p.avatarUrl ?? '');
    const parsed = splitPhone(p.phone);
    setCountryCode(normalizeCountryCode(parsed.code));
    setPhoneNumber(parsed.number);
    setBio(p.bio ?? '');
  }, [profileQuery.data, user]);

  const profileMutation = useMutation({
    mutationFn: updateManagedUserProfile,
    onSuccess: (next) => {
      if (!next) {
        toast.error('Profile update failed');
        return;
      }

      updateProfile({
        name: next.name,
        username: next.username,
        avatarUrl: next.avatarUrl,
        phone: next.phone,
        bio: next.bio,
      });

      queryClient.setQueryData([...MY_PROFILE_KEY, user?.email], next);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Profile updated');
    },
    onError: () => toast.error('Profile update failed'),
  });

  const ticketsQuery = useQuery({
    queryKey: [...MY_TICKETS_KEY, user?.email],
    queryFn: () => fetchUserTickets(user?.email ?? ''),
    enabled: Boolean(user?.email),
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

  const onProfileSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) {
      toast.error('Name is required');
      return;
    }

    const combinedPhone = phoneNumber.trim() ? `${countryCode} ${phoneNumber.trim()}` : '';

    profileMutation.mutate({
      email: user.email,
      patch: {
        name: name.trim(),
        username: username.trim(),
        avatarUrl: avatarUrl.trim(),
        phone: combinedPhone,
        bio: bio.trim(),
      },
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
        {profileQuery.isLoading ? <Skeleton className="h-20" /> : null}
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
              <select className="input" value={countryCode} onChange={(e) => setCountryCode(e.target.value)}>
                {COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name} ({country.code})
                  </option>
                ))}
              </select>
              <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Phone number" />
            </div>
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
            <p>{t.message}</p>
            <p className="muted">Created: {t.createdAt}</p>
            {t.adminReply ? (
              <p className="muted">
                <strong>Admin reply:</strong> {t.adminReply}
              </p>
            ) : null}
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
