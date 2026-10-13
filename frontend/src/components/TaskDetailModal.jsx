import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  CheckSquare,
  MessageSquare,
  AlertTriangle,
  Plus,
  Send,
  Save,
  Eye
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function TaskDetailModal({
  taskId,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
  users = []
}) {
  const { canEdit } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Editable fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('TODO');
  const [priority, setPriority] = useState('MEDIUM');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState(0);
  const [actualHours, setActualHours] = useState(0);

  // Subtasks & Comments
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [comments, setComments] = useState([]);
  const [newCommentContent, setNewCommentContent] = useState('');

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const data = await api.getTask(taskId);
      setTask(data);
      setTitle(data.title || '');
      setDescription(data.description || '');
      setStatus(data.status || 'TODO');
      setPriority(data.priority || 'MEDIUM');
      setAssigneeId(data.assignee?.id || '');
      setDueDate(data.due_date || '');
      setEstimatedHours(data.estimated_hours || 0);
      setActualHours(data.actual_hours || 0);
      setSubtasks(data.subtasks || []);
      setComments(data.comments || []);
    } catch (err) {
      console.error('Failed to load task details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  const handleSave = async () => {
    if (!canEdit) return;
    try {
      setSaving(true);
      const updated = await api.updateTask(taskId, {
        title,
        description,
        status,
        priority,
        assignee_id: assigneeId ? parseInt(assigneeId) : null,
        due_date: dueDate || null,
        estimated_hours: parseFloat(estimatedHours) || 0,
        actual_hours: parseFloat(actualHours) || 0,
      });
      setTask(updated);
      onTaskUpdated(updated);
    } catch (err) {
      alert('Failed to save task: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!canEdit) return;
    if (window.confirm(`Are you sure you want to delete ${task?.task_key}?`)) {
      try {
        await api.deleteTask(taskId);
        onTaskDeleted(taskId);
        onClose();
      } catch (err) {
        alert('Failed to delete task: ' + err.message);
      }
    }
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!canEdit || !newSubtaskTitle.trim()) return;
    try {
      const added = await api.addSubtask(taskId, newSubtaskTitle.trim());
      setSubtasks(prev => [...prev, added]);
      setNewSubtaskTitle('');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleSubtask = async (subtaskId, currentCompleted) => {
    if (!canEdit) return;
    try {
      const updated = await api.toggleSubtask(taskId, subtaskId, !currentCompleted);
      setSubtasks(prev => prev.map(s => s.id === subtaskId ? updated : s));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    if (!canEdit) return;
    try {
      await api.deleteSubtask(taskId, subtaskId);
      setSubtasks(prev => prev.filter(s => s.id !== subtaskId));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentContent.trim()) return;
    try {
      const added = await api.addComment(taskId, newCommentContent.trim());
      setComments(prev => [...prev, added]);
      setNewCommentContent('');
    } catch (err) {
      alert(err.message);
    }
  };

  if (!task && loading) {
    return (
      <div className="modal-backdrop">
        <div className="modal-card" style={{ padding: '32px', textAlign: 'center' }}>
          Loading task details...
        </div>
      </div>
    );
  }

  const completedSubtasks = subtasks.filter(s => s.is_completed).length;
  const subtaskProgress = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '880px', width: '92%' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="key-tag" style={{ fontSize: '0.875rem' }}>{task?.task_key}</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              in {task?.project_name}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {canEdit && (
              <>
                <button
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={saving}
                  style={{ padding: '6px 14px', fontSize: '0.8125rem' }}
                >
                  <Save size={14} />
                  <span>{saving ? 'Saving...' : 'Save'}</span>
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleDelete}
                  title="Delete task"
                  style={{ padding: '6px 10px', fontSize: '0.8125rem' }}
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
            <button className="btn-ghost" onClick={onClose} style={{ padding: '6px' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Read-Only Notice for Viewer Persona */}
        {!canEdit && (
          <div className="readonly-banner" style={{ margin: '16px 24px 0 24px' }}>
            <Eye size={16} />
            <span>
              <strong>Read-Only Mode:</strong> You are viewing this task as a Viewer / Client. Editing and deleting are disabled.
            </span>
          </div>
        )}

        {/* Modal Body: 2 Columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px', padding: '24px' }}>
          {/* Left Column: Title, Description, Subtasks, Comments */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Title */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={!canEdit}
                style={{ width: '100%', fontSize: '1rem', fontWeight: 700, marginTop: '4px' }}
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Description
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!canEdit}
                placeholder="Add issue description or acceptance criteria..."
                style={{ width: '100%', resize: 'vertical', marginTop: '4px', fontSize: '0.875rem' }}
              />
            </div>

            {/* Subtasks Checklist */}
            <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', fontWeight: 700 }}>
                  <CheckSquare size={16} color="var(--primary-400)" />
                  <span>Checklist ({completedSubtasks}/{subtasks.length})</span>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-400)' }}>
                  {subtaskProgress}%
                </span>
              </div>

              {/* Progress bar track */}
              {subtasks.length > 0 && (
                <div style={{ height: '6px', background: 'var(--bg-app)', borderRadius: '4px', overflow: 'hidden', marginBottom: '14px' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${subtaskProgress}%`,
                      background: 'var(--primary-500)',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
              )}

              {/* Subtask list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {subtasks.map((sub) => (
                  <div
                    key={sub.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      background: 'var(--bg-card)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: canEdit ? 'pointer' : 'default', flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={sub.is_completed}
                        onChange={() => handleToggleSubtask(sub.id, sub.is_completed)}
                        disabled={!canEdit}
                        style={{ cursor: 'pointer' }}
                      />
                      <span
                        style={{
                          fontSize: '0.8125rem',
                          textDecoration: sub.is_completed ? 'line-through' : 'none',
                          color: sub.is_completed ? 'var(--text-muted)' : 'var(--text-primary)'
                        }}
                      >
                        {sub.title}
                      </span>
                    </label>

                    {canEdit && (
                      <button
                        className="btn-ghost"
                        onClick={() => handleDeleteSubtask(sub.id)}
                        style={{ padding: '2px 4px', color: 'var(--text-muted)' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add subtask input */}
              {canEdit && (
                <form onSubmit={handleAddSubtask} style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <input
                    type="text"
                    placeholder="Add checklist item..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    style={{ flex: 1, fontSize: '0.8125rem', padding: '6px 10px' }}
                  />
                  <button type="submit" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8125rem' }}>
                    <Plus size={14} />
                    <span>Add</span>
                  </button>
                </form>
              )}
            </div>

            {/* Comments Thread */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', fontWeight: 700, marginBottom: '12px' }}>
                <MessageSquare size={16} />
                <span>Activity & Comments ({comments.length})</span>
              </div>

              {/* Add comment input */}
              <form onSubmit={handleAddComment} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <textarea
                  rows={2}
                  placeholder="Write a comment..."
                  value={newCommentContent}
                  onChange={(e) => setNewCommentContent(e.target.value)}
                  style={{ width: '100%', fontSize: '0.8125rem' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!newCommentContent.trim()}
                    style={{ padding: '6px 14px', fontSize: '0.78125rem' }}
                  >
                    <Send size={13} />
                    <span>Post Comment</span>
                  </button>
                </div>
              </form>

              {/* Comments list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {comments.length === 0 ? (
                  <div style={{ fontSize: '0.78125rem', color: 'var(--text-muted)' }}>No comments yet.</div>
                ) : (
                  comments.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        padding: '12px',
                        background: 'var(--bg-surface)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            className="user-avatar"
                            style={{
                              width: '24px',
                              height: '24px',
                              fontSize: '0.6875rem',
                              backgroundColor: c.author?.avatar_color || '#6366F1'
                            }}
                          >
                            {c.author?.initials || 'U'}
                          </div>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{c.author?.full_name}</span>
                        </div>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                          {new Date(c.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', paddingLeft: '32px' }}>
                        {c.content}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Metadata & Properties */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              background: 'var(--bg-surface)',
              padding: '18px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              height: 'fit-content'
            }}
          >
            {/* Status */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={!canEdit}
                style={{ width: '100%', marginTop: '4px', fontSize: '0.8125rem' }}
              >
                <option value="BACKLOG">Backlog</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                disabled={!canEdit}
                style={{ width: '100%', marginTop: '4px', fontSize: '0.8125rem' }}
              >
                <option value="URGENT">🔴 Urgent</option>
                <option value="HIGH">🟠 High</option>
                <option value="MEDIUM">🔵 Medium</option>
                <option value="LOW">⚪ Low</option>
              </select>
            </div>

            {/* Assignee */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Assignee</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                disabled={!canEdit}
                style={{ width: '100%', marginTop: '4px', fontSize: '0.8125rem' }}
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={!canEdit}
                style={{ width: '100%', marginTop: '4px', fontSize: '0.8125rem' }}
              />
              {task?.is_overdue && (
                <div style={{ color: '#F87171', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertTriangle size={12} />
                  <span>Deadline is overdue!</span>
                </div>
              )}
            </div>

            {/* Estimated & Actual Hours */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Estimated (h)</label>
                <input
                  type="number"
                  step="0.5"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  disabled={!canEdit}
                  style={{ width: '100%', marginTop: '4px', fontSize: '0.8125rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Actual (h)</label>
                <input
                  type="number"
                  step="0.5"
                  value={actualHours}
                  onChange={(e) => setActualHours(e.target.value)}
                  disabled={!canEdit}
                  style={{ width: '100%', marginTop: '4px', fontSize: '0.8125rem' }}
                />
              </div>
            </div>

            {/* Reporter Meta */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <div>Reporter: {task?.reporter ? task.reporter.full_name : 'Unknown'}</div>
              <div style={{ marginTop: '2px' }}>Created: {new Date(task?.created_at).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
