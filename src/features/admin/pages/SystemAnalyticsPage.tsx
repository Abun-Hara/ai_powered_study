import { useNavigate } from 'react-router-dom';
import Card from '../../../components/ui/Card';

export default function SystemAnalyticsPage() {
  const navigate = useNavigate();

  return (
    <div className="stack-lg">
      <Card className="stack">
        <h2 className="icon-heading"><i className="fa-solid fa-chart-line" aria-hidden="true" /> System Analytics</h2>
        <p className="muted">Platform-level growth and usage trends.</p>
        <div className="row gap-sm wrap">
          <button type="button" className="btn btn-secondary">Last 7 days</button>
          <button type="button" className="btn btn-ghost">Last 30 days</button>
          <button type="button" className="btn btn-ghost">Quarter</button>
          <button type="button" className="btn btn-ghost">Year</button>
        </div>
      </Card>

      <section className="kpi-grid">
        <button type="button" className="card interactive-card" onClick={() => navigate('/admin/users')} aria-label="View active users">
          <p className="muted icon-label"><i className="fa-solid fa-user-check" aria-hidden="true" /> Active Users</p>
          <h3>982</h3>
          <span className="muted">+4.2% vs last week</span>
        </button>
        <button type="button" className="card interactive-card" onClick={() => navigate('/admin/ai-control')} aria-label="View AI usage">
          <p className="muted icon-label"><i className="fa-solid fa-robot" aria-hidden="true" /> AI Calls</p>
          <h3>13,506</h3>
          <span className="muted">24h volume</span>
        </button>
        <button type="button" className="card interactive-card" onClick={() => navigate('/admin/reports')} aria-label="View reports">
          <p className="muted icon-label"><i className="fa-solid fa-file-lines" aria-hidden="true" /> Reports Filed</p>
          <h3>74</h3>
          <span className="muted">Last 7 days</span>
        </button>
        <button type="button" className="card interactive-card" onClick={() => navigate('/admin/users')} aria-label="View inactive users">
          <p className="muted icon-label"><i className="fa-solid fa-user-clock" aria-hidden="true" /> Inactive Users</p>
          <h3>302</h3>
          <span className="muted">No activity 14+ days</span>
        </button>
      </section>

      <section className="grid-two">
        <Card className="stack">
          <div className="row-between">
            <h3 className="icon-heading"><i className="fa-solid fa-users" aria-hidden="true" /> Users Growth</h3>
            <span className="pill medium">Trend</span>
          </div>
          <div className="chart-wrap card skeleton" />
          <div className="row-between">
            <span className="muted">New users per day</span>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/admin/users')}>Open users</button>
          </div>
        </Card>
        <Card className="stack">
          <div className="row-between">
            <h3 className="icon-heading"><i className="fa-solid fa-robot" aria-hidden="true" /> Daily AI Usage</h3>
            <span className="pill high">Spikes</span>
          </div>
          <div className="chart-wrap card skeleton" />
          <div className="row-between">
            <span className="muted">Calls by feature</span>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/admin/ai-control')}>Open AI control</button>
          </div>
        </Card>
      </section>

      <section className="grid-two">
        <Card className="stack">
          <div className="row-between">
            <h3 className="icon-heading"><i className="fa-solid fa-book-open" aria-hidden="true" /> Course Creation</h3>
            <span className="pill medium">Growth</span>
          </div>
          <div className="chart-wrap card skeleton" />
          <div className="row-between">
            <span className="muted">Drafts to published</span>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/admin/reports')}>Open reports</button>
          </div>
        </Card>
        <Card className="stack">
          <div className="row-between">
            <h3 className="icon-heading"><i className="fa-solid fa-chart-pie" aria-hidden="true" /> Active vs Inactive</h3>
            <span className="pill">Mix</span>
          </div>
          <div className="chart-wrap card skeleton" />
          <div className="row-between">
            <span className="muted">Retention snapshot</span>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/admin/users')}>Open users</button>
          </div>
        </Card>
      </section>
    </div>
  );
}
