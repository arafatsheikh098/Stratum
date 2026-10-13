import React, { useState, useEffect } from 'react';
import {
  Users,
  TrendingUp
} from 'lucide-react';
import { api } from '../services/api';

export default function AnalyticsView({ currentProject, tasks = [] }) {
  const [analytics, setAnalytics] = useState(null);

  const fetchAnalytics = async () => {
    if (!currentProject?.id) return;
    try {
      const data = await api.getProjectAnalytics(currentProject.id);
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  };

  useEffect(() => {
    if (currentProject) {
      fetchAnalytics();
    }
  }, [currentProject?.id]);

  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'DONE').length;
  const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'IN_REVIEW').length;
  const overdue = tasks.filter(t => t.is_overdue).length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const urgentCount = tasks.filter(t => t.priority === 'URGENT').length;
  const highCount = tasks.filter(t => t.priority === 'HIGH').length;
  const mediumCount = tasks.filter(t => t.priority === 'MEDIUM').length;
  const lowCount = tasks.filter(t => t.priority === 'LOW').length;

  return (
    <div className="analytics-container">
      {/* Top Metrics Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Issues</div>
          <div className="stat-value">{total}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>In {currentProject?.name}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Completion Velocity</div>
          <div className="stat-value" style={{ color: '#10B981' }}>{completionRate}%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{completed} of {total} done</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Active Work</div>
          <div className="stat-value" style={{ color: 'var(--primary-400)' }}>{inProgress}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>In Progress & In Review</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Overdue SLA</div>
          <div className="stat-value" style={{ color: overdue > 0 ? '#F87171' : 'var(--text-muted)' }}>
            {overdue}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {overdue > 0 ? 'Requires immediate triage' : 'All deadlines on track'}
          </div>
        </div>
      </div>

      {/* Completion Progress Bar */}
      <div className="chart-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
            <TrendingUp size={16} color="var(--primary-400)" />
            <span>Sprint Burndown Progress</span>
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#10B981' }}>
            {completionRate}% Complete
          </span>
        </div>
        <div className="bar-track" style={{ height: '12px' }}>
          <div
            className="bar-fill"
            style={{
              width: `${completionRate}%`,
              background: 'linear-gradient(90deg, #6366F1 0%, #10B981 100%)',
            }}
          />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Priority Breakdown */}
        <div className="chart-card">
          <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Tasks by Priority Breakdown</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="bar-row">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span style={{ color: '#EF4444', fontWeight: 600 }}>Urgent</span>
                <span>{urgentCount} ({total > 0 ? Math.round((urgentCount / total) * 100) : 0}%)</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${total > 0 ? (urgentCount / total) * 100 : 0}%`, background: '#EF4444' }}
                />
              </div>
            </div>

            <div className="bar-row">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span style={{ color: '#F97316', fontWeight: 600 }}>High</span>
                <span>{highCount} ({total > 0 ? Math.round((highCount / total) * 100) : 0}%)</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${total > 0 ? (highCount / total) * 100 : 0}%`, background: '#F97316' }}
                />
              </div>
            </div>

            <div className="bar-row">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span style={{ color: '#3B82F6', fontWeight: 600 }}>Medium</span>
                <span>{mediumCount} ({total > 0 ? Math.round((mediumCount / total) * 100) : 0}%)</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${total > 0 ? (mediumCount / total) * 100 : 0}%`, background: '#3B82F6' }}
                />
              </div>
            </div>

            <div className="bar-row">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Low</span>
                <span>{lowCount} ({total > 0 ? Math.round((lowCount / total) * 100) : 0}%)</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${total > 0 ? (lowCount / total) * 100 : 0}%`, background: '#64748B' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Team Workload Distribution */}
        <div className="chart-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.9375rem' }}>
            <Users size={16} />
            <span>Team Workload Allocation</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {analytics?.team_workload && analytics.team_workload.length > 0 ? (
              analytics.team_workload.map((m) => {
                const assigned = m.total_assigned;
                const pct = total > 0 ? Math.round((assigned / total) * 100) : 0;
                return (
                  <div key={m.user_id} className="bar-row">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div
                          className="user-avatar"
                          style={{
                            width: '20px',
                            height: '20px',
                            fontSize: '0.625rem',
                            backgroundColor: m.avatar_color || '#6366F1'
                          }}
                        >
                          {m.name.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 600 }}>{m.name}</span>
                      </div>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {assigned} tasks ({m.completed} done)
                      </span>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{
                          width: `${pct}%`,
                          background: m.avatar_color || '#6366F1'
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', padding: '16px 0' }}>
                No workload distribution data available yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
