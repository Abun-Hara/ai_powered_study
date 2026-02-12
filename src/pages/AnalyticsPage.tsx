import ChartPanel from '../components/ChartPanel';
import StatCard from '../components/StatCard';
import { analyticsData } from '../data/mockData';

export default function AnalyticsPage() {
  const totalHours = analyticsData.reduce((acc, cur) => acc + cur.hours, 0).toFixed(1);
  const totalTasks = analyticsData.reduce((acc, cur) => acc + cur.tasks, 0);

  return (
    <div className="stack-lg">
      <section className="grid two">
        <StatCard label="Total Weekly Hours" value={totalHours} />
        <StatCard label="Completed Tasks" value={totalTasks} />
      </section>
      <ChartPanel data={analyticsData} />
    </div>
  );
}

