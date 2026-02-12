import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export default function ChartPanel({ data }: { data: Array<{ name: string; hours: number; tasks: number }> }) {
  return (
    <section className="card chart-card">
      <h3>Weekly Progress</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="hours" fill="#4f9cf9" name="Study Hours" />
          <Bar dataKey="tasks" fill="#5bc8af" name="Completed Tasks" />
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}

