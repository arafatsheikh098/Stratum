import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { api } from '../services/api';

export default function CreateTaskModal({
  currentProject,
  initialStatus = 'TODO',
  onClose,
  onTaskCreated,
  users = []
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(initialStatus);
  const [priority, setPriority] = useState('MEDIUM');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !currentProject) return;

    try {
      setLoading(true);
      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const payload = {
        project: currentProject.id,
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        assignee_id: assigneeId ? parseInt(assigneeId) : null,
        due_date: dueDate || null,
        estimated_hours: estimatedHours ? parseFloat(estimatedHours) : 0,
        tags,
      };

      const created = await api.createTask(payload);
      onTaskCreated(created);
      onClose();
    } catch (err) {
      alert('Failed to create task: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface)'
          }}
        >
          <div style={{ fontWeight: 800, fontSize: '1rem' }}>
            Create Issue in {currentProject?.name} ({currentProject?.key})
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Title */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              Summary / Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Implement redis session caching"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', marginTop: '4px' }}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Detailed specifications, technical approach, or acceptance criteria..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', marginTop: '4px' }}
            />
          </div>

          {/* Status & Priority Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{ width: '100%', marginTop: '4px' }}
              >
                <option value="BACKLOG">Backlog</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={{ width: '100%', marginTop: '4px' }}
              >
                <option value="URGENT">🔴 Urgent</option>
                <option value="HIGH">🟠 High</option>
                <option value="MEDIUM">🔵 Medium</option>
                <option value="LOW">⚪ Low</option>
              </select>
            </div>
          </div>

          {/* Assignee & Due Date Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Assignee</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                style={{ width: '100%', marginTop: '4px' }}
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{ width: '100%', marginTop: '4px' }}
              />
            </div>
          </div>

          {/* Hours & Tags Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                Estimated Hours
              </label>
              <input
                type="number"
                step="0.5"
                placeholder="e.g. 8"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                style={{ width: '100%', marginTop: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                Tags (comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. Backend, Auth, API"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                style={{ width: '100%', marginTop: '4px' }}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '16px',
              marginTop: '8px'
            }}
          >
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || !title.trim()}>
              <Plus size={15} />
              <span>{loading ? 'Creating...' : 'Create Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
