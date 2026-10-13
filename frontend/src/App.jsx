import React, { useState, useEffect } from 'react';
import {
  Kanban,
  ListFilter,
  BarChart2,
  Activity,
  Users,
  Plus,
  Filter,
  AlertTriangle,
  Layers,
  Sparkles
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './services/api';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import KanbanBoard from './components/KanbanBoard';
import ListView from './components/ListView';
import TaskDetailModal from './components/TaskDetailModal';
import CreateTaskModal from './components/CreateTaskModal';
import CreateProjectModal from './components/CreateProjectModal';
import AnalyticsView from './components/AnalyticsView';
import ActivityView from './components/ActivityView';
import TeamView from './components/TeamView';
import AuthView from './components/AuthView';
import './App.css';

function MainApp() {
  const { user, isAuthenticated, loading: authLoading, canEdit, demoLogin } = useAuth();
  
  // Theme state
  const [theme, setTheme] = useState('dark');

  // Workspaces & Projects State
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [users, setUsers] = useState([]);

  // Tasks State
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [onlyOverdueFilter, setOnlyOverdueFilter] = useState(false);

  // Views & Modals
  const [currentView, setCurrentView] = useState('board'); // 'board' | 'list' | 'analytics' | 'activity' | 'team'
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [createTaskInitialStatus, setCreateTaskInitialStatus] = useState('TODO');
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);

  const loadInitialData = async () => {
    try {
      const [wsData, usersData] = await Promise.all([
        api.getWorkspaces(),
        api.getUsers()
      ]);
      setWorkspaces(wsData);
      setUsers(usersData);

      if (wsData.length > 0) {
        const firstWs = wsData[0];
        setCurrentWorkspace(firstWs);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  const loadProjectsForWorkspace = async (workspaceId) => {
    try {
      const projs = await api.getProjects(workspaceId);
      setProjects(projs);
      if (projs.length > 0) {
        // Keep currentProject if it belongs to this workspace, otherwise select first
        setCurrentProject(prev => {
          const match = projs.find(p => p.id === prev?.id);
          return match || projs[0];
        });
      } else {
        setCurrentProject(null);
        setTasks([]);
      }
    } catch (err) {
      console.error('Failed to load projects for workspace:', err);
    }
  };

  const loadTasks = async () => {
    if (!currentProject) return;
    try {
      setLoadingTasks(true);
      const params = {
        project: currentProject.id,
      };
      if (searchTerm) params.search = searchTerm;
      if (priorityFilter) params.priority = priorityFilter;
      if (assigneeFilter) params.assignee = assigneeFilter;
      if (onlyOverdueFilter) params.is_overdue = 'true';

      const data = await api.getTasks(params);
      setTasks(data.results || []);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoadingTasks(false);
    }
  };

  // Sync theme attribute on document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Load initial workspace and users
  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
    }
  }, [isAuthenticated]);

  // Load projects whenever active workspace changes
  useEffect(() => {
    if (currentWorkspace?.id && isAuthenticated) {
      loadProjectsForWorkspace(currentWorkspace.id);
    }
  }, [currentWorkspace?.id, isAuthenticated]);

  // Load tasks whenever project, search, or filters change
  useEffect(() => {
    if (currentProject) {
      loadTasks();
    }
  }, [currentProject?.id, searchTerm, priorityFilter, assigneeFilter, onlyOverdueFilter]);

  // Reorder Handler (Drag and drop or inline change)
  const handleReorderTask = async (taskId, newStatus, newOrder) => {
    // 1. Optimistic UI update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus, order: newOrder } : t));

    // 2. Background API sync
    try {
      await api.reorderTask(taskId, newStatus, newOrder);
    } catch (err) {
      console.error('Failed to sync reorder with backend:', err);
      loadTasks(); // Rollback to server truth
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      await api.updateTask(taskId, { status: newStatus });
    } catch (err) {
      console.error('Failed to update status:', err);
      loadTasks();
    }
  };

  const handleTaskCreated = (newTask) => {
    setTasks(prev => [newTask, ...prev]);
  };

  const handleTaskUpdated = (updatedTask) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleTaskDeleted = (deletedId) => {
    setTasks(prev => prev.filter(t => t.id !== deletedId));
  };

  const handleProjectCreated = (newProject) => {
    setProjects(prev => [newProject, ...prev]);
    setCurrentProject(newProject);
  };

  if (authLoading) {
    return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B0F17', color: '#FFF' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <Layers size={36} color="#6366F1" />
          <div style={{ fontWeight: 700 }}>Initializing Stratum Engine...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthView />;
  }

  return (
    <div className="app-container">
      {/* Top Interactive Persona Bar for Instant Portfolio Evaluation */}
      <div className="persona-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={14} color="#818CF8" />
          <span><strong>Quick Role Switcher:</strong> Test role-based permissions in real-time</span>
        </div>

        <div className="persona-options">
          <button
            className={`persona-btn ${user?.role === 'ADMIN' ? 'active' : ''}`}
            onClick={async () => { await demoLogin('ADMIN'); window.location.reload(); }}
          >
            👑 Admin (Alex)
          </button>
          <button
            className={`persona-btn ${user?.role === 'PROJECT_MANAGER' ? 'active' : ''}`}
            onClick={async () => { await demoLogin('PROJECT_MANAGER'); window.location.reload(); }}
          >
            📋 PM (Sarah)
          </button>
          <button
            className={`persona-btn ${user?.role === 'DEVELOPER' ? 'active' : ''}`}
            onClick={async () => { await demoLogin('DEVELOPER'); window.location.reload(); }}
          >
            💻 Dev (David)
          </button>
          <button
            className={`persona-btn ${user?.role === 'VIEWER' ? 'active' : ''}`}
            onClick={async () => { await demoLogin('VIEWER'); window.location.reload(); }}
          >
            👁️ Viewer (Marcus - Read-Only)
          </button>
        </div>
      </div>

      {/* Main Top Navigation */}
      <Navbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        theme={theme}
        setTheme={setTheme}
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        setCurrentWorkspace={setCurrentWorkspace}
      />

      <div className="app-main">
        {/* Sidebar */}
        <Sidebar
          projects={projects}
          currentProject={currentProject}
          setCurrentProject={setCurrentProject}
          currentView={currentView}
          setCurrentView={setCurrentView}
          onOpenCreateProject={() => setIsCreateProjectOpen(true)}
        />

        {/* Content Area */}
        <main className="content-area">
          {/* Project Header & Filter Bar */}
          <div className="project-header">
            <div className="header-top">
              <div className="project-title-group">
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '3px',
                    backgroundColor: currentProject?.color || '#6366F1'
                  }}
                />
                <h1 className="project-title">{currentProject?.name || 'Project'}</h1>
                <span className="key-tag" style={{ fontSize: '0.8125rem' }}>
                  {currentProject?.key}
                </span>
              </div>

              {/* View Tabs */}
              <div className="view-tabs">
                <button
                  className={`view-tab ${currentView === 'board' ? 'active' : ''}`}
                  onClick={() => setCurrentView('board')}
                >
                  <Kanban size={15} />
                  <span>Board</span>
                </button>
                <button
                  className={`view-tab ${currentView === 'list' ? 'active' : ''}`}
                  onClick={() => setCurrentView('list')}
                >
                  <ListFilter size={15} />
                  <span>List</span>
                </button>
                <button
                  className={`view-tab ${currentView === 'analytics' ? 'active' : ''}`}
                  onClick={() => setCurrentView('analytics')}
                >
                  <BarChart2 size={15} />
                  <span>Analytics</span>
                </button>
                <button
                  className={`view-tab ${currentView === 'activity' ? 'active' : ''}`}
                  onClick={() => setCurrentView('activity')}
                >
                  <Activity size={15} />
                  <span>Activity</span>
                </button>
                <button
                  className={`view-tab ${currentView === 'team' ? 'active' : ''}`}
                  onClick={() => setCurrentView('team')}
                >
                  <Users size={15} />
                  <span>Team</span>
                </button>
              </div>
            </div>

            {/* Filter Bar (Active on Board and List Views) */}
            {(currentView === 'board' || currentView === 'list') && (
              <div className="filter-row">
                <div className="filter-group">
                  <Filter size={14} color="var(--text-muted)" />
                  
                  {/* Priority Filter */}
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="">Priority: All</option>
                    <option value="URGENT">🔴 Urgent</option>
                    <option value="HIGH">🟠 High</option>
                    <option value="MEDIUM">🔵 Medium</option>
                    <option value="LOW">⚪ Low</option>
                  </select>

                  {/* Assignee Filter */}
                  <select
                    value={assigneeFilter}
                    onChange={(e) => setAssigneeFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="">Assignee: All</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.full_name}</option>
                    ))}
                  </select>

                  {/* Overdue Only Filter */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-md)',
                      background: onlyOverdueFilter ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                      border: onlyOverdueFilter ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid transparent',
                      color: onlyOverdueFilter ? '#F87171' : 'var(--text-secondary)'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={onlyOverdueFilter}
                      onChange={(e) => setOnlyOverdueFilter(e.target.checked)}
                    />
                    <AlertTriangle size={13} />
                    <span>Overdue SLA Only</span>
                  </label>
                </div>

                {/* Create Task Button */}
                {canEdit && (
                  <button
                    className="btn btn-primary"
                    onClick={() => { setCreateTaskInitialStatus('TODO'); setIsCreateTaskOpen(true); }}
                  >
                    <Plus size={15} />
                    <span>Create Issue</span>
                  </button>
                )}
              </div>
            )}
            {loadingTasks && (
              <div style={{ height: '2px', width: '100%', background: 'linear-gradient(90deg, #6366F1, #EC4899)', opacity: 0.8 }} />
            )}
          </div>

          {/* View Render Body */}
          {currentView === 'board' && (
            <KanbanBoard
              tasks={tasks}
              onSelectTask={(task) => setSelectedTaskId(task.id)}
              onReorderTask={handleReorderTask}
              onOpenCreateTask={(colStatus) => {
                setCreateTaskInitialStatus(colStatus);
                setIsCreateTaskOpen(true);
              }}
            />
          )}

          {currentView === 'list' && (
            <ListView
              tasks={tasks}
              onSelectTask={(task) => setSelectedTaskId(task.id)}
              onUpdateTaskStatus={handleUpdateTaskStatus}
            />
          )}

          {currentView === 'analytics' && (
            <AnalyticsView currentProject={currentProject} tasks={tasks} />
          )}

          {currentView === 'activity' && (
            <ActivityView currentProject={currentProject} />
          )}

          {currentView === 'team' && (
            <TeamView currentWorkspace={currentWorkspace} users={users} />
          )}
        </main>
      </div>

      {/* Task Detail Modal */}
      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onTaskUpdated={handleTaskUpdated}
          onTaskDeleted={handleTaskDeleted}
          users={users}
        />
      )}

      {/* Create Task Modal */}
      {isCreateTaskOpen && (
        <CreateTaskModal
          currentProject={currentProject}
          initialStatus={createTaskInitialStatus}
          onClose={() => setIsCreateTaskOpen(false)}
          onTaskCreated={handleTaskCreated}
          users={users}
        />
      )}

      {/* Create Project Modal */}
      {isCreateProjectOpen && (
        <CreateProjectModal
          currentWorkspace={currentWorkspace}
          onClose={() => setIsCreateProjectOpen(false)}
          onProjectCreated={handleProjectCreated}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
