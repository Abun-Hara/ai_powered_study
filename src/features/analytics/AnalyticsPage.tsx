import { KeyboardEvent, useMemo, useState } from 'react';
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
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [mode, setMode] = useState<'weekly' | 'monthly'>('weekly');

  const source = useMemo(() => (mode === 'weekly' ? weekly : monthly), [mode]);
  const totalCompleted = source.reduce((sum, item) => sum + item.completed, 0);
  const totalPending = source.reduce((sum, item) => sum + item.pending, 0);
  const totalHours = source.reduce((sum, item) => sum + item.hours, 0).toFixed(1);
  const completionRate = Math.round((totalCompleted / (totalCompleted + totalPending)) * 100);
  const bestDay = source.reduce((max, item) => (item.hours > max.hours ? item : max), source[0]);

  const onCardKeyDown = (event: KeyboardEvent<HTMLElement>, path: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      navigate(path);
    }
  };

  return (
    <div className="stack-lg">
      <Card className="stack">
        <div className="row-between wrap">
          <div className="stack-xs">
            <h2 className="icon-heading"><i className="fa-solid fa-chart-pie" aria-hidden="true" /> Study Analytics</h2>
            <p className="muted">Track your study rhythm, completion momentum, and focus areas.</p>
          </div>
          <div className="row gap-sm wrap">
            <Button variant={mode === 'weekly' ? 'primary' : 'secondary'} onClick={() => setMode('weekly')}>
              <span className="icon-label"><i className="fa-solid fa-calendar-week" aria-hidden="true" /> Weekly</span>
            </Button>
            <Button variant={mode === 'monthly' ? 'primary' : 'secondary'} onClick={() => setMode('monthly')}>
              <span className="icon-label"><i className="fa-solid fa-calendar" aria-hidden="true" /> Monthly</span>
            </Button>
            <Button variant="ghost">
              <span className="icon-label"><i className="fa-solid fa-download" aria-hidden="true" /> Export</span>
            </Button>
          </div>
        </div>
        <div className="row gap-sm wrap">
          <span className="pill high">Focus: {pieData[0].name}</span>
          <span className="pill medium">Best day: {bestDay.name}</span>
          <span className="pill">Completion: {completionRate}%</span>
        </div>
      </Card>

      <section className="kpi-grid">
        <Card
          className="stack interactive-card"
          role="button"
          tabIndex={0}
          onClick={() => navigate('/schedule')}
          onKeyDown={(event) => onCardKeyDown(event, '/schedule')}
        >
          <p className="muted icon-label"><i className="fa-solid fa-clock" aria-hidden="true" /> Study Hours</p>
          <h3>{totalHours}</h3>
          <span className="muted">{mode === 'weekly' ? 'Last 7 days' : 'Last 30 days'}</span>
        </Card>
        <Card
          className="stack interactive-card"
          role="button"
          tabIndex={0}
          onClick={() => navigate('/dashboard')}
          onKeyDown={(event) => onCardKeyDown(event, '/dashboard')}
        >
          <p className="muted icon-label"><i className="fa-solid fa-circle-check" aria-hidden="true" /> Completed Tasks</p>
          <h3>{totalCompleted}</h3>
          <span className="muted">Strong finish rate</span>
        </Card>
        <Card
          className="stack interactive-card"
          role="button"
          tabIndex={0}
          onClick={() => navigate('/dashboard')}
          onKeyDown={(event) => onCardKeyDown(event, '/dashboard')}
        >
          <p className="muted icon-label"><i className="fa-solid fa-list" aria-hidden="true" /> Pending Tasks</p>
          <h3>{totalPending}</h3>
          <span className="muted">Review next</span>
        </Card>
        <Card
          className="stack interactive-card"
          role="button"
          tabIndex={0}
          onClick={() => navigate('/courses')}
          onKeyDown={(event) => onCardKeyDown(event, '/courses')}
        >
          <p className="muted icon-label"><i className="fa-solid fa-percent" aria-hidden="true" /> Course Progress</p>
          <h3>{completionRate}%</h3>
          <span className="muted">Keep the streak</span>
        </Card>
      </section>

      <motion.section className="grid-two" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Card
          className="stack interactive-card"
          role="button"
          tabIndex={0}
          onClick={() => navigate('/schedule')}
          onKeyDown={(event) => onCardKeyDown(event, '/schedule')}
        >
          <div className="row-between">
            <h3 className="icon-heading"><i className="fa-solid fa-chart-column" aria-hidden="true" /> Hours and Task Completion</h3>
            <span className="pill medium">Trend</span>
          </div>
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
          <div className="row-between">
            <span className="muted">Hours vs completed tasks</span>
            <div className="row gap-sm">
              <span className="icon-label"><span className="dot" style={{ background: '#2e87f2' }} /> Hours</span>
              <span className="icon-label"><span className="dot" style={{ background: '#13a389' }} /> Completed</span>
            </div>
          </div>
        </Card>

        <Card
          className="stack interactive-card"
          role="button"
          tabIndex={0}
          onClick={() => navigate('/courses')}
          onKeyDown={(event) => onCardKeyDown(event, '/courses')}
        >
          <div className="row-between">
            <h3 className="icon-heading"><i className="fa-solid fa-chart-pie" aria-hidden="true" /> Subject Focus Distribution</h3>
            <span className="pill">Mix</span>
          </div>
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
          <div className="row-between">
            <span className="muted">Most focused: {pieData[0].name}</span>
            <Button
              variant="ghost"
              onClick={(event) => {
                event.stopPropagation();
                navigate('/courses');
              }}
            >
              Manage subjects
            </Button>
          </div>
        </Card>
      </motion.section>

      <section className="grid-two">
        <Card
          className="stack interactive-card"
          role="button"
          tabIndex={0}
          onClick={() => navigate('/schedule')}
          onKeyDown={(event) => onCardKeyDown(event, '/schedule')}
        >
          <h3 className="icon-heading"><i className="fa-solid fa-bolt" aria-hidden="true" /> Momentum</h3>
          <div className="stack-sm">
            <div className="row-between"><span>Consistency score</span><strong>82%</strong></div>
            <div className="progress-track"><span className="progress-fill" style={{ width: '82%' }} /></div>
            <p className="muted">Keep 4+ sessions next week to grow your streak.</p>
          </div>
        </Card>
        <Card
          className="stack interactive-card"
          role="button"
          tabIndex={0}
          onClick={() => navigate('/dashboard')}
          onKeyDown={(event) => onCardKeyDown(event, '/dashboard')}
        >
          <h3 className="icon-heading"><i className="fa-solid fa-flag-checkered" aria-hidden="true" /> Next Focus</h3>
          <article className="list-row row-between">
            <strong>Pending tasks</strong>
            <span>{totalPending}</span>
          </article>
          <article className="list-row row-between">
            <strong>Longest gap</strong>
            <span>2 days</span>
          </article>
          <article className="list-row row-between">
            <strong>Recommended block</strong>
            <span>90 min</span>
          </article>
        </Card>
      </section>
    </div>
  );
}
