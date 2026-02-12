import {
  closestCenter,
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface StudyTask {
  id: string;
  title: string;
  course: string;
  duration: number;
}

export type ScheduleMap = Record<string, StudyTask[]>;

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function ScheduleBoard({
  schedule,
  onUpdate,
  onDurationChange,
}: {
  schedule: ScheduleMap;
  onUpdate: (next: ScheduleMap) => void;
  onDurationChange: (taskId: string, day: string, duration: number) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const sourceDay = findDayOfTask(schedule, String(active.id));
    const targetDay = findDayOfTask(schedule, String(over.id)) ?? String(over.id);
    if (!sourceDay || !targetDay) return;

    const sourceList = schedule[sourceDay] ?? [];
    const targetList = schedule[targetDay] ?? [];
    const sourceIndex = sourceList.findIndex((task) => task.id === String(active.id));

    if (sourceIndex === -1) return;
    const movedTask = sourceList[sourceIndex];

    if (sourceDay === targetDay) {
      const targetIndex = targetList.findIndex((task) => task.id === String(over.id));
      if (targetIndex === -1) return;
      onUpdate({ ...schedule, [sourceDay]: arrayMove(sourceList, sourceIndex, targetIndex) });
      return;
    }

    const filteredSource = sourceList.filter((task) => task.id !== movedTask.id);
    const insertedTarget = [...targetList, movedTask];

    onUpdate({
      ...schedule,
      [sourceDay]: filteredSource,
      [targetDay]: insertedTarget,
    });
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="schedule-grid">
        {days.map((day) => (
          <DayColumn
            key={day}
            day={day}
            tasks={schedule[day]}
            onDurationChange={onDurationChange}
          />
        ))}
      </div>
    </DndContext>
  );
}

function DayColumn({
  day,
  tasks,
  onDurationChange,
}: {
  day: string;
  tasks: StudyTask[];
  onDurationChange: (taskId: string, day: string, duration: number) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: day });

  return (
    <section className="schedule-column card">
      <h4>{day}</h4>
      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className={`stack-sm drop-zone ${isOver ? 'is-over' : ''}`}>
          {tasks.map((task) => (
            <SortableTask key={task.id} day={day} task={task} onDurationChange={onDurationChange} />
          ))}
        </div>
      </SortableContext>
    </section>
  );
}

function SortableTask({
  day,
  task,
  onDurationChange,
}: {
  day: string;
  task: StudyTask;
  onDurationChange: (taskId: string, day: string, duration: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article ref={setNodeRef} style={style} className="task-item" {...attributes} {...listeners}>
      <strong>{task.title}</strong>
      <p className="muted">{task.course}</p>
      <p className="muted">{task.duration} mins</p>
      <input
        type="range"
        min={30}
        max={180}
        step={15}
        value={task.duration}
        onChange={(e) => onDurationChange(task.id, day, Number(e.target.value))}
      />
    </article>
  );
}

function findDayOfTask(schedule: ScheduleMap, taskId: string) {
  return Object.keys(schedule).find((day) => schedule[day].some((task) => task.id === taskId));
}

