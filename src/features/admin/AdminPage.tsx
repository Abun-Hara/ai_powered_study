import Card from '../../components/ui/Card';
import { useNavigate } from 'react-router-dom';

export default function AdminPage() {
  const navigate = useNavigate();

  const goToUsers = (filter: 'new-registrations' | 'suspended' | 'pending-role-changes') => {
    navigate(`/admin/users?filter=${filter}`);
  };

  const goTo = (path: string) => {
    navigate(path);
  };

  return (
    <div className="stack-lg">
      <Card className="stack">
        <h2 className="icon-heading"><i className="fa-solid fa-shield-halved" aria-hidden="true" /> Admin Dashboard</h2>
        <p className="muted">System-level metrics and operational control for the platform.</p>
      </Card>

      <section className="kpi-grid">
        <button
          type="button"
          className="card interactive-card"
          onClick={() => goTo('/admin/users')}
          aria-label="View all users"
        >
          <p className="muted icon-label"><i className="fa-solid fa-users" aria-hidden="true" /> Total Users</p>
          <h3>1,284</h3>
        </button>
        <button
          type="button"
          className="card interactive-card"
          onClick={() => goTo('/admin/users')}
          aria-label="View active users"
        >
          <p className="muted icon-label"><i className="fa-solid fa-user-check" aria-hidden="true" /> Active Users Today</p>
          <h3>982</h3>
        </button>
        <button
          type="button"
          className="card interactive-card"
          onClick={() => goTo('/admin/reports')}
          aria-label="View upload reports"
        >
          <p className="muted icon-label"><i className="fa-solid fa-file-arrow-up" aria-hidden="true" /> Total Uploads</p>
          <h3>8,942</h3>
        </button>
        <button
          type="button"
          className="card interactive-card"
          onClick={() => goTo('/admin/ai-control')}
          aria-label="View AI controls"
        >
          <p className="muted icon-label"><i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true" /> AI Summaries Generated</p>
          <h3>54,210</h3>
        </button>
      </section>

      <section className="grid-two">
        <Card className="stack">
          <h3 className="icon-heading"><i className="fa-solid fa-user-gear" aria-hidden="true" /> User Operations</h3>
          <button type="button" className="list-row row-between" onClick={() => goToUsers('new-registrations')}>
            <strong>New Registrations (7 days)</strong>
            <span>74</span>
          </button>
          <button type="button" className="list-row row-between" onClick={() => goToUsers('suspended')}>
            <strong>Suspended Accounts</strong>
            <span>24</span>
          </button>
          <button type="button" className="list-row row-between" onClick={() => goToUsers('pending-role-changes')}>
            <strong>Pending Role Changes</strong>
            <span>9</span>
          </button>
        </Card>

        <Card className="stack">
          <h3 className="icon-heading"><i className="fa-solid fa-heart-pulse" aria-hidden="true" /> Platform Health</h3>
          <button type="button" className="list-row row-between" onClick={() => goTo('/admin/system-analytics')}>
            <strong>AI Calls (24h)</strong>
            <span>13,506</span>
          </button>
          <button type="button" className="list-row row-between" onClick={() => goTo('/admin/reports')}>
            <strong>Flagged Files</strong>
            <span>7</span>
          </button>
          <button type="button" className="list-row row-between" onClick={() => goTo('/admin/system-analytics')}>
            <strong>Platform Uptime</strong>
            <span>99.96%</span>
          </button>
        </Card>
      </section>
    </div>
  );
}
