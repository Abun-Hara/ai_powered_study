import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Skeleton from '../../../components/ui/Skeleton';
import {
  AIControlSettings,
  fetchAiControlSettings,
  saveAiControlSettings,
} from '../interactionsApi';

const AI_CONTROL_KEY = ['admin-ai-control-settings'];

const fallbackSettings: AIControlSettings = {
  dailyAiLimitPerUser: 50,
  maxUploadSizeMb: 20,
  defaultSummaryLength: 'medium',
  heavyUserAlerts: true,
  emergencyAiDisable: false,
};

export default function AIControlPage() {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({ queryKey: AI_CONTROL_KEY, queryFn: fetchAiControlSettings });
  const [draft, setDraft] = useState<AIControlSettings>(fallbackSettings);

  useEffect(() => {
    if (settingsQuery.data) {
      setDraft(settingsQuery.data);
    }
  }, [settingsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: saveAiControlSettings,
    onSuccess: (next) => {
      queryClient.setQueryData(AI_CONTROL_KEY, next);
      toast.success('AI control settings saved');
    },
    onError: () => toast.error('Failed to save AI control settings'),
  });

  return (
    <Card className="stack">
      <h2 className="icon-heading"><i className="fa-solid fa-sliders" aria-hidden="true" /> AI Control Panel</h2>
      <p className="muted">Configure AI usage policy for all users.</p>

      {settingsQuery.isLoading ? (
        <div className="stack">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : null}

      {!settingsQuery.isLoading ? (
        <>
          <article className="list-row stack-sm">
            <div className="row-between">
              <strong className="icon-label"><i className="fa-solid fa-gauge-high" aria-hidden="true" /> Daily AI Limit / User</strong>
              <span>{draft.dailyAiLimitPerUser}</span>
            </div>
            <input
              type="range"
              min={5}
              max={200}
              step={5}
              value={draft.dailyAiLimitPerUser}
              onChange={(e) => setDraft((prev) => ({ ...prev, dailyAiLimitPerUser: Number(e.target.value) }))}
            />
          </article>

          <label className="stack-sm">
            <span className="icon-label"><i className="fa-solid fa-file-arrow-up" aria-hidden="true" /> Max Upload Size (MB)</span>
            <input
              type="number"
              min={1}
              max={200}
              value={draft.maxUploadSizeMb}
              onChange={(e) => setDraft((prev) => ({ ...prev, maxUploadSizeMb: Number(e.target.value) }))}
            />
          </label>

          <label className="stack-sm">
            <span className="icon-label"><i className="fa-solid fa-align-left" aria-hidden="true" /> Default Summary Length</span>
            <select
              className="input"
              value={draft.defaultSummaryLength}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  defaultSummaryLength: e.target.value as AIControlSettings['defaultSummaryLength'],
                }))
              }
            >
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </select>
          </label>

          <label className="row checkbox-row">
            <input
              type="checkbox"
              checked={draft.heavyUserAlerts}
              onChange={(e) => setDraft((prev) => ({ ...prev, heavyUserAlerts: e.target.checked }))}
            />
            <span className="icon-label"><i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /> Heavy User Alerts</span>
          </label>

          <label className="row checkbox-row">
            <input
              type="checkbox"
              checked={draft.emergencyAiDisable}
              onChange={(e) => setDraft((prev) => ({ ...prev, emergencyAiDisable: e.target.checked }))}
            />
            <span className="icon-label"><i className="fa-solid fa-power-off" aria-hidden="true" /> Emergency AI Disable</span>
          </label>

          <div className="row gap-sm">
            <Button disabled={saveMutation.isPending} onClick={() => saveMutation.mutate(draft)}>
              <span className="icon-label">
                <i className="fa-solid fa-floppy-disk" aria-hidden="true" />
                {saveMutation.isPending ? 'Saving...' : 'Save AI Control'}
              </span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => setDraft(settingsQuery.data ?? fallbackSettings)}
              disabled={saveMutation.isPending}
            >
              <span className="icon-label"><i className="fa-solid fa-rotate-left" aria-hidden="true" /> Reset</span>
            </Button>
          </div>
        </>
      ) : null}
    </Card>
  );
}
