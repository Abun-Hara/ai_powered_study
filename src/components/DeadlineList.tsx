import { Deadline } from '../types';

const colorByPriority: Record<Deadline['priority'], string> = {
  low: 'tag low',
  medium: 'tag medium',
  high: 'tag high',
};

export default function DeadlineList({ deadlines }: { deadlines: Deadline[] }) {
  return (
    <section className="card">
      <h3>Upcoming Deadlines</h3>
      <div className="stack">
        {deadlines.map((deadline) => (
          <article key={deadline.id} className="list-item">
            <div>
              <strong>{deadline.title}</strong>
              <p className="muted">Due: {deadline.dueDate}</p>
            </div>
            <span className={colorByPriority[deadline.priority]}>{deadline.priority}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

