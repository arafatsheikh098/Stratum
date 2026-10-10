import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import TaskCard from './TaskCard';
import { useAuth } from '../context/AuthContext';

const COLUMNS = [
  { key: 'BACKLOG', label: 'Backlog', color: 'var(--status-backlog)' },
  { key: 'TODO', label: 'To Do', color: 'var(--status-todo)' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'var(--status-in-progress)' },
  { key: 'IN_REVIEW', label: 'In Review', color: 'var(--status-in-review)' },
  { key: 'DONE', label: 'Done', color: 'var(--status-done)' },
];

export default function KanbanBoard({
  tasks = [],
  onSelectTask,
  onReorderTask,
  onOpenCreateTask
}) {
  const { canEdit } = useAuth();
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  const handleDragStart = (e, task) => {
    if (!canEdit) return;
    setDraggedTask(task);
    e.dataTransfer.setData('text/plain', task.id.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, colKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== colKey) {
      setDragOverCol(colKey);
    }
  };

  const handleDragLeave = (e, colKey) => {
    if (dragOverCol === colKey) {
      setDragOverCol(null);
    }
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    if (!draggedTask || !canEdit) return;

    if (draggedTask.status !== targetStatus) {
      // Calculate new order: put it at bottom of the target column
      const colTasks = tasks.filter(t => t.status === targetStatus);
      const maxOrder = colTasks.length > 0 ? Math.max(...colTasks.map(t => t.order || 1000)) : 1000;
      const newOrder = maxOrder + 1000.0;

      onReorderTask(draggedTask.id, targetStatus, newOrder);
    }
    setDraggedTask(null);
  };

  return (
    <div className="kanban-board">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.key);
        const isOver = dragOverCol === col.key;

        return (
          <div
            key={col.key}
            className={`kanban-column ${isOver ? 'drag-over' : ''}`}
            onDragOver={(e) => handleDragOver(e, col.key)}
            onDragLeave={(e) => handleDragLeave(e, col.key)}
            onDrop={(e) => handleDrop(e, col.key)}
          >
            <div className="column-header">
              <div className="column-title-group">
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: col.color,
                  }}
                />
                <span>{col.label}</span>
                <span className="column-badge">{colTasks.length}</span>
              </div>

              {canEdit && (
                <button
                  className="btn-ghost"
                  onClick={() => onOpenCreateTask(col.key)}
                  title={`Add task to ${col.label}`}
                  style={{ padding: '4px', borderRadius: '4px' }}
                >
                  <Plus size={15} />
                </button>
              )}
            </div>

            <div className="task-list">
              {colTasks.length === 0 ? (
                <div
                  style={{
                    padding: '24px 12px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.8125rem',
                    border: '1px dashed var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    marginTop: '4px'
                  }}
                >
                  No tasks
                </div>
              ) : (
                colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onSelectTask={onSelectTask}
                    onDragStart={handleDragStart}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
