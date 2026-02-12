import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Skeleton from '../../../components/ui/Skeleton';
import { fetchPlatformSettings, savePlatformSettings } from '../interactionsApi';

const SETTINGS_KEY = ['platform-settings'];

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({ queryKey: SETTINGS_KEY, queryFn: fetchPlatformSettings });

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [defaultTheme, setDefaultTheme] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    if (!settingsQuery.data) return;
    setMaintenanceMode(settingsQuery.data.maintenanceMode);
    setAnnouncement(settingsQuery.data.announcement);
    setDefaultTheme(settingsQuery.data.defaultTheme);
  }, [settingsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: savePlatformSettings,
    onSuccess: (next) => {
      queryClient.setQueryData(SETTINGS_KEY, next);
      toast.success('Settings updated');
    },
    onError: () => toast.error('Failed to update settings'),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ maintenanceMode, announcement, defaultTheme });
  };

  return (
    <Card className="stack">
      <h2 className="icon-heading"><i className="fa-solid fa-gear" aria-hidden="true" /> System Settings</h2>
      {settingsQuery.isLoading ? <Skeleton className="h-20" /> : null}

      {!settingsQuery.isLoading ? (
        <form className="stack" onSubmit={onSubmit}>
          <label className="row checkbox-row">
            <input type="checkbox" checked={maintenanceMode} onChange={(e) => setMaintenanceMode(e.target.checked)} />
            <span className="icon-label"><i className="fa-solid fa-screwdriver-wrench" aria-hidden="true" /> Maintenance Mode</span>
          </label>

          <label>
            Announcement Banner
            <textarea
              className="input textarea"
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="Visible to all students"
            />
          </label>

          <label>
            Default Theme
            <select className="input" value={defaultTheme} onChange={(e) => setDefaultTheme(e.target.value as 'light' | 'dark' | 'system')}>
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>

          <Button disabled={saveMutation.isPending}>
            <span className="icon-label">
              <i className="fa-solid fa-floppy-disk" aria-hidden="true" />
              {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
            </span>
          </Button>
        </form>
      ) : null}
    </Card>
  );
}
