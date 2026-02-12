import Card from '../../../components/ui/Card';

export default function SystemAnalyticsPage() {
  return (
    <div className="stack-lg">
      <Card className="stack">
        <h2 className="icon-heading"><i className="fa-solid fa-chart-line" aria-hidden="true" /> System Analytics</h2>
        <p className="muted">Platform-level growth and usage trends.</p>
      </Card>
      <section className="grid-two">
        <Card className="stack"><h3 className="icon-heading"><i className="fa-solid fa-users" aria-hidden="true" /> Users Growth Chart</h3><p className="muted">(Chart placeholder)</p></Card>
        <Card className="stack"><h3 className="icon-heading"><i className="fa-solid fa-robot" aria-hidden="true" /> Daily AI Usage</h3><p className="muted">(Chart placeholder)</p></Card>
      </section>
      <section className="grid-two">
        <Card className="stack"><h3 className="icon-heading"><i className="fa-solid fa-book-open" aria-hidden="true" /> Course Creation Trend</h3><p className="muted">(Chart placeholder)</p></Card>
        <Card className="stack"><h3 className="icon-heading"><i className="fa-solid fa-chart-pie" aria-hidden="true" /> Active vs Inactive Users</h3><p className="muted">(Pie chart placeholder)</p></Card>
      </section>
    </div>
  );
}
