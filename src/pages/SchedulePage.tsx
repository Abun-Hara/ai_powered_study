import { useState } from 'react';
import ScheduleBoard from '../components/ScheduleBoard';
import { initialSchedule } from '../data/mockData';

export default function SchedulePage() {
  const [columns, setColumns] = useState(initialSchedule);

  return (
    <section className="stack-lg">
      <div className="card">
        <h2>Drag-and-Drop Weekly Study Plan</h2>
        <p className="muted">Move tasks between days to auto-balance your week.</p>
      </div>
      <ScheduleBoard columns={columns} setColumns={setColumns} />
    </section>
  );
}

