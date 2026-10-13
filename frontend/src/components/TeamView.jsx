import React, { useState } from 'react';
import { UserPlus, ShieldCheck, Eye, Code, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function TeamView({ currentWorkspace, users = [] }) {
  const { isAdmin } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('MEMBER');
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState('');

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!selectedUserId || !currentWorkspace) return;
    try {
      setInviting(true);
      await api.inviteWorkspaceMember(currentWorkspace.id, parseInt(selectedUserId), selectedRole);
      setMessage('Member added to workspace successfully!');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      alert('Failed to add member: ' + err.message);
    } finally {
      setInviting(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'ADMIN':
        return <ShieldCheck size={16} color="#6366F1" />;
      case 'PROJECT_MANAGER':
        return <Briefcase size={16} color="#EC4899" />;
      case 'DEVELOPER':
        return <Code size={16} color="#10B981" />;
      case 'VIEWER':
      default:
        return <Eye size={16} color="#F59E0B" />;
    }
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Workspace Team Header */}
      <div
        style={{
          background: 'var(--bg-card)',
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>
            {currentWorkspace?.name} Team Members
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Manage team access, workspace roles, and granular security authorizations.
          </div>
        </div>

        {isAdmin && (
          <form onSubmit={handleInvite} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="filter-select"
            >
              <option value="">Select User...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.email})
                </option>
              ))}
            </select>

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="filter-select"
            >
              <option value="ADMIN">Admin</option>
              <option value="MEMBER">Member</option>
              <option value="VIEWER">Viewer</option>
            </select>

            <button type="submit" className="btn btn-primary" disabled={inviting || !selectedUserId}>
              <UserPlus size={15} />
              <span>{inviting ? 'Adding...' : 'Add Member'}</span>
            </button>
          </form>
        )}
      </div>

      {message && (
        <div style={{ padding: '10px 16px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10B981', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem' }}>
          {message}
        </div>
      )}

      {/* Team Directory Table */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        <table className="task-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Role</th>
              <th>Email</th>
              <th>Title / Specialization</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      className="user-avatar"
                      style={{
                        backgroundColor: u.avatar_color || '#6366F1',
                        width: '32px',
                        height: '32px'
                      }}
                    >
                      {u.initials || 'U'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{u.full_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{u.username}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {getRoleIcon(u.role)}
                    <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{u.role.replace('_', ' ')}</span>
                  </div>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78125rem' }}>{u.email}</td>
                <td>{u.title || 'Contributor'}</td>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10B981', fontSize: '0.75rem', fontWeight: 600 }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
                    Active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Role-Based Permissions Reference Matrix */}
      <div
        style={{
          background: 'var(--bg-card)',
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)'
        }}
      >
        <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '12px' }}>
          Role-Based Authorization Architecture (RBAC)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#6366F1' }}>
              <ShieldCheck size={16} />
              <span>Workspace Admin</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
              Full CRUD on workspaces, projects, team invitations, and task deletion.
            </div>
          </div>

          <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#EC4899' }}>
              <Briefcase size={16} />
              <span>Project Manager</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
              Manage sprints, create/assign tasks, modify column states, and inspect burndown velocity.
            </div>
          </div>

          <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#10B981' }}>
              <Code size={16} />
              <span>Software Engineer</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
              Drag & drop task states, check off subtasks, add comments, and log hours on assigned issues.
            </div>
          </div>

          <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#F59E0B' }}>
              <Eye size={16} />
              <span>Client / Viewer</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
              Strictly read-only access. Mutation and deletion verbs are blocked with 403 Forbidden.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
