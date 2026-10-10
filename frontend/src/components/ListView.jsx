import React from 'react';
import { Calendar, AlertCircle, CheckSquare, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ListView({ tasks = [], onSelectTask, onUpdateTaskStatus }) {
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

  return (
    <div className="list-view-container">
      <table className="task-table">
        <thead>
          <tr>
            <th style={{ width: '90px' }}>Key</th>
            <th>Title</th>
            <th style={{ width: '130px' }}>Status</th>
            <th style={{ width: '100px' }}>Priority</th>
            <th style={{ width: '180px' }}>Assignee</th>
            <th style={{ width: '130px' }}>Due Date</th>
            <th style={{ width: '100px' }}>Progress</th>
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                No tasks match current filter criteria.
              </td>
            </tr>
          ) : (
            tasks.map((task) => {
              const isOverdue = task.is_overdue;

              return (
                <tr key={task.id} onClick={() => onSelectTask(task)}>
                  <td>
                    <span className="key-tag">{task.task_key}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{task.title}</div>
                    {task.description && (
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '380px'
                        }}
                      >
                        {task.description}
                      </div>
                    )}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    {canEdit ? (
                      <select
                        value={task.status}
                        onChange={(e) => onUpdateTaskStatus(task.id, e.target.value)}
                        className="filter-select"
                        style={{ width: '100%', fontSize: '0.78125rem', padding: '4px 6px' }}
                      >
                        <option value="BACKLOG">Backlog</option>
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="IN_REVIEW">In Review</option>
                        <option value="DONE">Done</option>
                      </select>
                    ) : (
                      <span className="status-pill" style={{ background: 'var(--bg-surface)' }}>
                        {task.status.replace('_', ' ')}
                      </span>
                    )}
                  </td>
                  <td>{getPriorityBadge(task.priority)}</td>
                  <td>
                    {task.assignee ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          className="user-avatar"
                          style={{
                            width: '24px',
                            height: '24px',
                            fontSize: '0.6875rem',
                            backgroundColor: task.assignee.avatar_color || '#6366F1'
                          }}
                        >
                          {task.assignee.initials || 'U'}
                        </div>
                        <span style={{ fontSize: '0.8125rem' }}>{task.assignee.full_name}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Unassigned</span>
                    )}
                  </td>
                  <td>
                    {task.due_date ? (
                      <span
                        className={`badge ${isOverdue ? 'badge-overdue' : ''}`}
                        style={{ fontSize: '0.75rem' }}
                      >
                        {isOverdue ? <AlertCircle size={12} /> : <Calendar size={12} />}
                        <span>{task.due_date}</span>
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>-</span>
                    )}
                  </td>
                  <td>
                    {task.subtasks_total > 0 ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        <CheckSquare size={13} />
                        <span>
                          {task.subtasks_completed}/{task.subtasks_total}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>-</span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
