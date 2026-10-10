import React from 'react';
import {
  Kanban,
  ListFilter,
  BarChart2,
  Activity,
  Users,
  Plus,
  FolderGit2,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({
  projects = [],
  currentProject,
  setCurrentProject,
  currentView,
  setCurrentView,
  onOpenCreateProject
}) {
  const { user, canEdit, isAdmin, isPM } = useAuth();

  return (
    <aside className="sidebar">
      <div>
        {/* Navigation Section */}
        <div className="sidebar-section">
          <div className="sidebar-heading">Views</div>
          <button
            className={`sidebar-nav-item ${currentView === 'board' ? 'active' : ''}`}
            onClick={() => setCurrentView('board')}
          >
            <Kanban size={16} />
            <span>Kanban Board</span>
          </button>
          <button
            className={`sidebar-nav-item ${currentView === 'list' ? 'active' : ''}`}
            onClick={() => setCurrentView('list')}
          >
            <ListFilter size={16} />
            <span>Table / List</span>
          </button>
          <button
            className={`sidebar-nav-item ${currentView === 'analytics' ? 'active' : ''}`}
            onClick={() => setCurrentView('analytics')}
          >
            <BarChart2 size={16} />
            <span>Sprint Analytics</span>
          </button>
          <button
            className={`sidebar-nav-item ${currentView === 'activity' ? 'active' : ''}`}
            onClick={() => setCurrentView('activity')}
          >
            <Activity size={16} />
            <span>Activity Audit Log</span>
          </button>
          <button
            className={`sidebar-nav-item ${currentView === 'team' ? 'active' : ''}`}
            onClick={() => setCurrentView('team')}
          >
            <Users size={16} />
            <span>Team & Roles</span>
          </button>
        </div>

        {/* Projects Section */}
        <div className="sidebar-section">
          <div className="sidebar-heading">
            <span>Projects</span>
            {(isAdmin || isPM) && (
              <button
                onClick={onOpenCreateProject}
                className="btn-ghost"
                title="Create Project"
                style={{ padding: '2px 4px', borderRadius: '4px' }}
              >
                <Plus size={14} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {projects.map((proj) => {
              const isActive = currentProject?.id === proj.id;
              return (
                <button
                  key={proj.id}
                  className={`project-item ${isActive ? 'active' : ''}`}
                  onClick={() => setCurrentProject(proj)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '2px',
                        backgroundColor: proj.color || '#6366F1',
                        flexShrink: 0
                      }}
                    />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {proj.name}
                    </span>
                  </div>
                  <span className="key-tag">{proj.key}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sidebar Footer - Role Status */}
      <div className="sidebar-footer">
        <div className="role-pill">
          {canEdit ? (
            <>
              <ShieldCheck size={14} color="#10B981" />
              <span>{user?.role === 'ADMIN' ? 'Admin: Full Access' : 'Contributor: Read/Write'}</span>
            </>
          ) : (
            <>
              <ShieldAlert size={14} color="#F59E0B" />
              <span>Viewer: Read Only</span>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
