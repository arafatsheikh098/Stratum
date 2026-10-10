import React, { useState, useEffect } from 'react';
import {
  Activity,
  PlusCircle,
  Clock,
  MessageSquare,
  UserCheck,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { api } from '../services/api';

export default function ActivityView({ currentProject }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');

  useEffect(() => {
    fetchActivities();
  }, [currentProject, filterAction]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const params = {};
      if (currentProject) params.project = currentProject.id;
      if (filterAction) params.action_type = filterAction;
      const data = await api.getActivityLogs(params);
      setActivities(data.results || []);
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'TASK_CREATED':
        return <PlusCircle size={16} color="var(--primary-400)" />;
      case 'TASK_STATUS_CHANGED':
        return <Clock size={16} color="#F59E0B" />;
      case 'COMMENT_ADDED':
        return <MessageSquare size={16} color="#3B82F6" />;
      case 'TASK_ASSIGNED':
        return <UserCheck size={16} color="#10B981" />;
      default:
        return <Activity size={16} color="var(--text-muted)" />;
    }
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
      {/* Controls Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          background: 'var(--bg-card)',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
          <Activity size={18} color="var(--primary-400)" />
          <span>Audit Log & Activity Stream</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={14} color="var(--text-muted)" />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="filter-select"
          >
            <option value="">All Events</option>
            <option value="TASK_CREATED">Task Created</option>
            <option value="TASK_STATUS_CHANGED">Status Changed</option>
            <option value="TASK_ASSIGNED">Task Assigned</option>
            <option value="COMMENT_ADDED">Comment Added</option>
          </select>
        </div>
      </div>

      {/* Activity Timeline */}
      {loading ? (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading activity stream...
        </div>
      ) : activities.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No activities recorded for this filter.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '800px' }}>
          {activities.map((act) => (
            <div
              key={act.id}
              style={{
                display: 'flex',
                gap: '14px',
                padding: '14px 16px',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                transition: 'border-color var(--transition-fast)'
              }}
            >
              <div style={{ marginTop: '2px' }}>{getActionIcon(act.action_type)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      className="user-avatar"
                      style={{
                        width: '22px',
                        height: '22px',
                        fontSize: '0.625rem',
                        backgroundColor: act.actor?.avatar_color || '#6366F1'
                      }}
                    >
                      {act.actor?.initials || 'U'}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.84375rem' }}>{act.actor?.full_name}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(act.created_at).toLocaleString()}
                  </span>
                </div>

                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                  {act.message}
                </div>

                {act.task_key && (
                  <div style={{ marginTop: '6px' }}>
                    <span className="key-tag">{act.task_key}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
