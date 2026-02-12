import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import EmptyState from '../../../components/ui/EmptyState';
import ErrorState from '../../../components/ui/ErrorState';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import Skeleton from '../../../components/ui/Skeleton';
import { useAuth } from '../../../context/AuthContext';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import {
  fetchManagedUsers,
  updateManagedUserRole,
  updateManagedUserStatus,
} from '../api';
import { ManagedUser } from '../types';
import { UserRole } from '../../../types';

const KEY = ['admin-users'];

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);
  const [selectedProfile, setSelectedProfile] = useState<ManagedUser | null>(null);
  const queryClient = useQueryClient();

  const usersQuery = useQuery({ queryKey: KEY, queryFn: fetchManagedUsers });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) => updateManagedUserRole(userId, role),
    onSuccess: (next) => {
      queryClient.setQueryData(KEY, next);
      toast.success('Role updated');
    },
    onError: () => toast.error('Role update failed'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: 'active' | 'suspended' }) =>
      updateManagedUserStatus(userId, status),
    onSuccess: (next) => {
      queryClient.setQueryData(KEY, next);
      toast.success('Status updated');
    },
    onError: () => toast.error('Status update failed'),
  });

  const users = usersQuery.data ?? [];
  const filtered = useMemo(() => {
    const q = debouncedQuery.toLowerCase().trim();
    if (!q) return users;
    return users.filter((u) => `${u.name} ${u.email} ${u.role} ${u.status}`.toLowerCase().includes(q));
  }, [users, debouncedQuery]);

  const onRoleChange = (target: ManagedUser, role: UserRole) => {
    if (target.email === currentUser?.email) {
      toast.error('You cannot change your own role from this panel');
      return;
    }
    roleMutation.mutate({ userId: target.id, role });
  };

  const onSuspendToggle = (target: ManagedUser) => {
    if (target.email === currentUser?.email) {
      toast.error('You cannot suspend your own account');
      return;
    }

    const nextStatus = target.status === 'active' ? 'suspended' : 'active';
    statusMutation.mutate({ userId: target.id, status: nextStatus });
  };

  return (
    <Card className="stack">
      <h2 className="icon-heading"><i className="fa-solid fa-users-gear" aria-hidden="true" /> User Management</h2>
      <p className="muted">See user profiles, suspend/activate accounts, and change user role.</p>

      <Input placeholder="Search users by name, email, role, status" value={query} onChange={(e) => setQuery(e.target.value)} />

      {usersQuery.isLoading ? (
        <div className="stack">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : null}

      {usersQuery.isError ? <ErrorState message="Could not load users." onRetry={() => usersQuery.refetch()} /> : null}

      {!usersQuery.isLoading && !usersQuery.isError && filtered.length === 0 ? (
        <EmptyState title="No users found" message="Try adjusting the search query." />
      ) : null}

      {!usersQuery.isLoading && !usersQuery.isError && filtered.length > 0 ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      className="input"
                      value={u.role}
                      onChange={(e) => onRoleChange(u, e.target.value as UserRole)}
                      disabled={roleMutation.isPending || u.email === currentUser?.email}
                    >
                      <option value="student">student</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td>
                    <span className={`status-pill ${u.status}`}>{u.status}</span>
                  </td>
                  <td>
                    <div className="row gap-sm">
                      <Button variant="secondary" onClick={() => setSelectedProfile(u)}>
                        <span className="icon-label"><i className="fa-solid fa-address-card" aria-hidden="true" /> Profile</span>
                      </Button>
                      <Button
                        variant={u.status === 'active' ? 'danger' : 'secondary'}
                        onClick={() => onSuspendToggle(u)}
                        disabled={statusMutation.isPending || u.email === currentUser?.email}
                      >
                        <span className="icon-label">
                          <i className={u.status === 'active' ? 'fa-solid fa-user-slash' : 'fa-solid fa-user-check'} aria-hidden="true" />
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
                        </span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <ProfileModal user={selectedProfile} onClose={() => setSelectedProfile(null)} />
    </Card>
  );
}

function ProfileModal({ user, onClose }: { user: ManagedUser | null; onClose: () => void }) {
  if (!user) return null;

  return (
    <Modal isOpen={Boolean(user)} onClose={onClose} title="User Profile">
      <div className="stack">
        <article className="list-row row-between"><strong>Name</strong><span>{user.name}</span></article>
        <article className="list-row row-between"><strong>Email</strong><span>{user.email}</span></article>
        <article className="list-row row-between"><strong>Role</strong><span>{user.role}</span></article>
        <article className="list-row row-between"><strong>Status</strong><span>{user.status}</span></article>
        <article className="list-row row-between"><strong>Joined</strong><span>{user.joinedAt}</span></article>
        <article className="list-row row-between"><strong>Last Active</strong><span>{user.lastActiveAt}</span></article>
        <article className="list-row"><div><strong>Bio</strong><p className="muted">{user.bio}</p></div></article>
      </div>
    </Modal>
  );
}
