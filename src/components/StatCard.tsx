interface StatCardProps {
  label: string;
  value: string | number;
}

export default function StatCard({ label, value }: StatCardProps) {
  return (
    <article className="card stat-card">
      <p className="muted">{label}</p>
      <h3>{value}</h3>
    </article>
  );
}

