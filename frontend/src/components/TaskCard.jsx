import React from 'react';
import {
  Calendar,
  CheckSquare,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function TaskCard({ task, onSelectTask, onDragStart }) {
  const { canEdit } = useAuth();

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'URGENT':
        return <span className="badge badge-urgent">Urgent</span>;
      case 'HIGH':
        return <span className="badge badge-high">High</span>;
      case 'MEDIUM':
        return <span className="badge badge-medium">Medium</span>;
      case 'LOW':
      default:
        return <span className="badge badge-low">Low</span>;
    }
  };

  const isOverdue = task.is_overdue;

  return (
    <div
      className="task-card"
      draggable={canEdit}
      onDragStart={(e) => onDragStart(e, task)}
      onClick={() => onSelectTask(task)}
    >
      <div className="card-top">
        <span className="key-tag">{task.task_key}</span>
        {getPriorityBadge(task.priority)}
      </div>

      <div className="card-title">{task.title}</div>

      {task.description && (
        <div className="card-description-snippet">{task.description}</div>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {task.tags.map((tag, i) => (
            <span
              key={i}
              style={{
                fontSize: '0.6875rem',
                padding: '1px 6px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="card-footer">
        <div className="card-meta-left">
          {/* Due date badge */}
          {task.due_date && (
            <div
              className={`badge ${isOverdue ? 'badge-overdue' : ''}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.6875rem'
              }}
              title={isOverdue ? 'Task deadline is overdue!' : `Due ${task.due_date}`}
            >
              {isOverdue ? <AlertCircle size={12} /> : <Calendar size={12} />}
              <span>{task.due_date}</span>
            </div>
          )}

          {/* Subtasks Checklist Progress */}
          {task.subtasks_total > 0 && (
            <div className="subtask-progress-mini" title="Checklist progress">
              <CheckSquare size={12} />
              <span>
                {task.subtasks_completed}/{task.subtasks_total}
              </span>
            </div>
          )}

          {/* Comments Count */}
          {task.comments_count > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} title="Comments">
              <MessageSquare size={12} />
              <span>{task.comments_count}</span>
            </div>
          )}
        </div>

        {/* Assignee Avatar */}
        {task.assignee ? (
          <div
            className="user-avatar"
            style={{
              width: '24px',
              height: '24px',
              fontSize: '0.6875rem',
              backgroundColor: task.assignee.avatar_color || '#6366F1'
            }}
            title={`Assigned to ${task.assignee.full_name}`}
          >
            {task.assignee.initials || 'U'}
          </div>
        ) : (
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              border: '1px dashed var(--border-medium)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.625rem',
              color: 'var(--text-muted)'
            }}
            title="Unassigned"
          >
            -
          </div>
        )}
      </div>
    </div>
  );
}
