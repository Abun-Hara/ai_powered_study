export default function AdminPage() {
  return (
    <section className="card">
      <h2>Admin Panel</h2>
      <p className="muted">Role-based area for managing users, course templates, and system analytics.</p>
      <div className="stack">
        <article className="list-item">
          <strong>Total Registered Students</strong>
          <span>1,284</span>
        </article>
        <article className="list-item">
          <strong>Notes Processed (This Month)</strong>
          <span>8,942 PDFs</span>
        </article>
        <article className="list-item">
          <strong>Average AI Summary Rating</strong>
          <span>4.6 / 5</span>
        </article>
      </div>
    </section>
  );
}

