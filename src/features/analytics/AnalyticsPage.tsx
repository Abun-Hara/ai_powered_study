import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const weekly = [
  { name: 'Mon', hours: 2.5, completed: 3, pending: 1 },
  { name: 'Tue', hours: 1.5, completed: 2, pending: 2 },
  { name: 'Wed', hours: 2.2, completed: 3, pending: 1 },
  { name: 'Thu', hours: 2.8, completed: 4, pending: 1 },
  { name: 'Fri', hours: 1.2, completed: 1, pending: 2 },
  { name: 'Sat', hours: 3.0, completed: 4, pending: 1 },
  { name: 'Sun', hours: 1.1, completed: 1, pending: 1 },
];

const monthly = [
  { name: 'W1', hours: 12, completed: 14, pending: 6 },
  { name: 'W2', hours: 14, completed: 17, pending: 5 },
  { name: 'W3', hours: 11, completed: 13, pending: 7 },
  { name: 'W4', hours: 16, completed: 20, pending: 4 },
];

const pieData = [
  { name: 'CS201', value: 36 },
  { name: 'CS305', value: 28 },
  { name: 'MTH210', value: 22 },
  { name: 'Others', value: 14 },
];

const colors = ['#2e87f2', '#13a389', '#f6a12f', '#c762d9'];

export default function AnalyticsPage() {
  const [mode, setMode] = useState<'weekly' | 'monthly'>('weekly');

  const source = useMemo(() => (mode === 'weekly' ? weekly : monthly), [mode]);
  const totalCompleted = source.reduce((sum, item) => sum + item.completed, 0);
  const totalPending = source.reduce((sum, item) => sum + item.pending, 0);
  const totalHours = source.reduce((sum, item) => sum + item.hours, 0).toFixed(1);

  return (
    <div className="stack-lg">
      <Card className="row-between wrap">
        <h2 className="icon-heading"><i className="fa-solid fa-chart-pie" aria-hidden="true" /> Study Analytics</h2>
        <div className="row gap-sm">
          <Button variant={mode === 'weekly' ? 'primary' : 'secondary'} onClick={() => setMode('weekly')}><span className="icon-label"><i className="fa-solid fa-calendar-week" aria-hidden="true" /> Weekly</span></Button>
          <Button variant={mode === 'monthly' ? 'primary' : 'secondary'} onClick={() => setMode('monthly')}><span className="icon-label"><i className="fa-solid fa-calendar" aria-hidden="true" /> Monthly</span></Button>
        </div>
      </Card>

      <section className="kpi-grid">
        <Card><p className="muted icon-label"><i className="fa-solid fa-clock" aria-hidden="true" /> Study Hours</p><h3>{totalHours}</h3></Card>
        <Card><p className="muted icon-label"><i className="fa-solid fa-circle-check" aria-hidden="true" /> Completed Tasks</p><h3>{totalCompleted}</h3></Card>
        <Card><p className="muted icon-label"><i className="fa-solid fa-list" aria-hidden="true" /> Pending Tasks</p><h3>{totalPending}</h3></Card>
        <Card><p className="muted icon-label"><i className="fa-solid fa-percent" aria-hidden="true" /> Course Progress</p><h3>{Math.round((totalCompleted / (totalCompleted + totalPending)) * 100)}%</h3></Card>
      </section>

      <motion.section className="grid-two" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Card>
          <h3 className="icon-heading"><i className="fa-solid fa-chart-column" aria-hidden="true" /> Hours and Task Completion</h3>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={source}>
                <CartesianGrid strokeDasharray="4 4" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="hours" fill="#2e87f2" />
                <Bar dataKey="completed" fill="#13a389" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="icon-heading"><i className="fa-solid fa-chart-pie" aria-hidden="true" /> Subject Focus Distribution</h3>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={120} label>
                  {pieData.map((entry, index) => (
                    <Cell key={entry.name} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.section>
    </div>
  );
}

