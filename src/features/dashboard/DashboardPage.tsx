import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { fetchPlatformSettings } from '../admin/interactionsApi';

const stats = [
  { label: 'Active Courses', value: '6', icon: 'fa-solid fa-book-open' },
  { label: 'Pending Deadlines', value: '4', icon: 'fa-solid fa-hourglass-half' },
  { label: 'Study Streak', value: '12 days', icon: 'fa-solid fa-fire' },
  { label: 'AI Summaries', value: '39', icon: 'fa-solid fa-robot' },
];

const deadlines = [
  { title: 'DBMS Mini Project', due: '2026-02-18', course: 'CS305', priority: 'High', progress: 65 },
  { title: 'Linear Algebra Quiz 2', due: '2026-02-20', course: 'MTH210', priority: 'Medium', progress: 35 },
  { title: 'Data Structures Assignment 4', due: '2026-02-14', course: 'CS201', priority: 'High', progress: 82 },
];

const weeklyHours = [
  { day: 'Mon', hours: 2.1 },
  { day: 'Tue', hours: 1.8 },
  { day: 'Wed', hours: 2.5 },
  { day: 'Thu', hours: 2.7 },
  { day: 'Fri', hours: 1.6 },
  { day: 'Sat', hours: 3.0 },
  { day: 'Sun', hours: 1.2 },
];

const todayPlan = [
  { task: 'Review Binary Trees', time: '09:00 - 10:30' },
  { task: 'Practice SQL Queries', time: '14:00 - 15:00' },
  { task: 'Quiz Revision', time: '19:00 - 19:45' },
];

const recentSummaries = [
  { title: 'Operating Systems Notes.pdf', at: '2h ago' },
  { title: 'Linear Algebra Unit 3.pdf', at: 'Yesterday' },
  { title: 'Database Normalization.pdf', at: '2 days ago' },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const settingsQuery = useQuery({ queryKey: ['platform-settings'], queryFn: fetchPlatformSettings });
  const [pendingDeadlines, setPendingDeadlines] = useState(deadlines);

  const statsWithRoutes = useMemo(() => ([
    { ...stats[0], to: '/courses' },
    { ...stats[1], to: '/schedule' },
    { ...stats[2], to: '/analytics' },
    { ...stats[3], to: '/ai' },
  ]), []);

  const onMarkDeadlineDone = (title: string) => {
    setPendingDeadlines((prev) => prev.filter((item) => item.title !== title));
    toast.success('Deadline marked as done');
  };

  return (
    <div className="stack-lg">
      {settingsQuery.data?.announcement ? (
        <Card className="announcement-banner">
          <strong><i className="fa-solid fa-bullhorn" aria-hidden="true" /> Announcement:</strong> {settingsQuery.data.announcement}
        </Card>
      ) : null}

      {settingsQuery.data?.maintenanceMode ? (
        <Card className="maintenance-banner">
          <strong><i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /> Maintenance Mode:</strong> Some features may be limited.
        </Card>
      ) : null}

      <section className="kpi-grid">
        {statsWithRoutes.map((item, index) => (
          <motion.button
            type="button"
            key={item.label}
            className="card interactive-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => navigate(item.to)}
          >
            <p className="muted icon-label"><i className={item.icon} aria-hidden="true" /> {item.label}</p>
            <h3>{item.value}</h3>
          </motion.button>
        ))}
      </section>

      <section className="grid-two">
        <Card className="stack">
          <div className="row-between">
            <h3 className="icon-heading"><i className="fa-solid fa-list-check" aria-hidden="true" /> Today's Study Plan</h3>
            <Button onClick={() => navigate('/schedule')}><span className="icon-label"><i className="fa-solid fa-plus" aria-hidden="true" /> Quick Add Task</span></Button>
          </div>
          {todayPlan.map((item) => (
            <button type="button" key={item.task} className="list-row row-between interactive-row" onClick={() => navigate('/schedule')}>
              <strong>{item.task}</strong>
              <span className="muted">{item.time}</span>
            </button>
          ))}
        </Card>

        <Card className="stack">
          <h3 className="icon-heading"><i className="fa-solid fa-file-lines" aria-hidden="true" /> Recent AI Summaries</h3>
          {recentSummaries.map((item) => (
            <button type="button" key={item.title} className="list-row row-between interactive-row" onClick={() => navigate('/ai')}>
              <span>{item.title}</span>
              <span className="muted">{item.at}</span>
            </button>
          ))}
        </Card>
      </section>

      <section className="grid-two">
        <Card className="stack">
          <h3 className="icon-heading"><i className="fa-solid fa-chart-area" aria-hidden="true" /> Weekly Study Hours</h3>
          <div className="chart-wrap-sm">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={weeklyHours}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="hours" stroke="#2e87f2" fill="#2e87f244" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="stack">
          <h3 className="icon-heading"><i className="fa-solid fa-calendar-days" aria-hidden="true" /> Upcoming Deadlines</h3>
          {pendingDeadlines.map((d) => (
            <article key={d.title} className="list-row stack-sm">
              <div className="row-between">
                <div>
                  <strong>{d.title}</strong>
                  <p className="muted">{d.course} - Due {d.due}</p>
                </div>
                <span className={`pill ${d.priority.toLowerCase()}`}>{d.priority}</span>
              </div>
              <div className="progress-track">
                <span className="progress-fill" style={{ width: `${d.progress}%` }} />
              </div>
              <div className="row gap-sm">
                <Button variant="secondary" onClick={() => onMarkDeadlineDone(d.title)}><span className="icon-label"><i className="fa-solid fa-check" aria-hidden="true" /> Mark done</span></Button>
                <Button variant="ghost" onClick={() => navigate('/courses')}><i className="fa-solid fa-pen" aria-hidden="true" /> Edit</Button>
              </div>
            </article>
          ))}
          {pendingDeadlines.length === 0 ? <p className="muted">No upcoming deadlines. Nice work.</p> : null}
        </Card>
      </section>
    </div>
  );
}
