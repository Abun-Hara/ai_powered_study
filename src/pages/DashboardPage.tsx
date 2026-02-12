import DeadlineList from '../components/DeadlineList';
import StatCard from '../components/StatCard';
import { mockDeadlines } from '../data/mockData';

export default function DashboardPage() {
  return (
    <div className="stack-lg">
      <section className="grid three">
        <StatCard label="Active Courses" value={6} />
        <StatCard label="Deadlines This Week" value={4} />
        <StatCard label="Study Streak" value="12 days" />
      </section>
      <DeadlineList deadlines={mockDeadlines} />
    </div>
  );
}

