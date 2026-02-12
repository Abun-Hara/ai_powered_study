import { useEffect } from 'react';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import ScheduleBoard, { ScheduleMap } from './components/ScheduleBoard';

const seedSchedule: ScheduleMap = {
  Monday: [
    { id: 's1', title: 'Review Trees', course: 'CS201', duration: 75 },
    { id: 's2', title: 'SQL Joins Practice', course: 'CS305', duration: 60 },
  ],
  Tuesday: [{ id: 's3', title: 'Matrix Revision', course: 'MTH210', duration: 90 }],
  Wednesday: [],
  Thursday: [],
  Friday: [],
  Saturday: [],
  Sunday: [],
};

export default function SchedulePage() {
  const [schedule, setSchedule] = useLocalStorage<ScheduleMap>('study_planner_schedule_v2', seedSchedule);
  const [hasMounted, setHasMounted] = useLocalStorage<boolean>('study_planner_schedule_bootstrap', false);

  useEffect(() => {
    if (!hasMounted) {
      setHasMounted(true);
      return;
    }
    const timer = setTimeout(() => {
      toast.success('Schedule auto-saved');
    }, 450);
    return () => clearTimeout(timer);
  }, [hasMounted, schedule, setHasMounted]);

  const onDurationChange = (taskId: string, day: string, duration: number) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: prev[day].map((task) => (task.id === taskId ? { ...task, duration } : task)),
    }));
  };

  return (
    <div className="stack-lg">
      <Card>
        <h2 className="icon-heading"><i className="fa-solid fa-calendar-days" aria-hidden="true" /> Drag-and-drop Study Calendar</h2>
        <p className="muted">Reorder tasks and move them between days. Changes are auto-saved.</p>
      </Card>
      <ScheduleBoard schedule={schedule} onUpdate={setSchedule} onDurationChange={onDurationChange} />
    </div>
  );
}

