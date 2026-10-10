import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { api } from '../services/api';

const COLOR_OPTIONS = [
  '#6366F1', // Indigo
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#14B8A6', // Teal
];

export default function CreateProjectModal({
  currentWorkspace,
  onClose,
  onProjectCreated
}) {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [targetEndDate, setTargetEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (!key || key.length <= 4) {
      // Auto-suggest short key prefix
      const words = val.trim().split(/\s+/);
      let suggestedKey = '';
      if (words.length >= 2) {
        suggestedKey = (words[0][0] + words[1][0] + (words[2] ? words[2][0] : '')).toUpperCase();
      } else if (val.length >= 3) {
        suggestedKey = val.slice(0, 3).toUpperCase();
      }
      setKey(suggestedKey);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !key.trim() || !currentWorkspace) return;

    try {
      setLoading(true);
      const payload = {
        workspace: currentWorkspace.id,
        name: name.trim(),
        key: key.trim().toUpperCase(),
        description: description.trim(),
        color,
        target_end_date: targetEndDate || null,
      };

      const created = await api.createProject(payload);
      onProjectCreated(created);
      onClose();
    } catch (err) {
      alert('Failed to create project: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
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
          <div style={{ fontWeight: 800, fontSize: '1rem' }}>Create New Project</div>
          <button className="btn-ghost" onClick={onClose} style={{ padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              Project Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Fintech Payment Gateway"
              value={name}
              onChange={handleNameChange}
              style={{ width: '100%', marginTop: '4px' }}
              autoFocus
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              Project Key Prefix * (e.g. PAY, STR, OPS)
            </label>
            <input
              type="text"
              required
              maxLength={6}
              placeholder="PAY"
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase())}
              style={{ width: '100%', marginTop: '4px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}
            />
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Used as prefix for all issue numbers (e.g. {key || 'PRJ'}-101)
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Brief project goal or architecture summary..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', marginTop: '4px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              Accent Color
            </label>
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              {COLOR_OPTIONS.map((c) => (
                <div
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: c,
                    cursor: 'pointer',
                    boxShadow: color === c ? '0 0 0 3px var(--bg-card), 0 0 0 5px ' + c : 'none',
                    transition: 'all 0.15s ease'
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              Target Delivery Date
            </label>
            <input
              type="date"
              value={targetEndDate}
              onChange={(e) => setTargetEndDate(e.target.value)}
              style={{ width: '100%', marginTop: '4px' }}
            />
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
            <button type="submit" className="btn btn-primary" disabled={loading || !name.trim() || !key.trim()}>
              <Plus size={15} />
              <span>{loading ? 'Creating...' : 'Create Project'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
