import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd';
import { Dispatch, SetStateAction } from 'react';
import { ScheduleColumns } from '../types';

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

interface ScheduleBoardProps {
  columns: ScheduleColumns;
  setColumns: Dispatch<SetStateAction<ScheduleColumns>>;
}

export default function ScheduleBoard({ columns, setColumns }: ScheduleBoardProps) {
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const sourceKey = result.source.droppableId;
    const destinationKey = result.destination.droppableId;
    const sourceTasks = [...columns[sourceKey]];
    const destinationTasks = sourceKey === destinationKey ? sourceTasks : [...columns[destinationKey]];

    const [movedTask] = sourceTasks.splice(result.source.index, 1);
    destinationTasks.splice(result.destination.index, 0, movedTask);

    setColumns((prev) => ({
      ...prev,
      [sourceKey]: sourceTasks,
      [destinationKey]: destinationTasks,
    }));
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="board-grid">
        {days.map((day) => (
          <Droppable key={day} droppableId={day}>
            {(provided) => (
              <section className="board-column" ref={provided.innerRef} {...provided.droppableProps}>
                <h4>{day.slice(0, 1).toUpperCase() + day.slice(1)}</h4>
                {columns[day].map((task, index) => (
                  <Draggable key={task.id} draggableId={task.id} index={index}>
                    {(draggableProvided) => (
                      <article
                        className="task-card"
                        ref={draggableProvided.innerRef}
                        {...draggableProvided.draggableProps}
                        {...draggableProvided.dragHandleProps}
                      >
                        <strong>{task.title}</strong>
                        <p className="muted">{task.course}</p>
                        <p className="muted">{task.durationMin} min</p>
                      </article>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </section>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}

