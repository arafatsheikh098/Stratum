import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  Bell,
  Sun,
  Moon,
  LogOut,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function Navbar({
  searchTerm,
  setSearchTerm,
  theme,
  setTheme,
  workspaces = [],
  currentWorkspace,
  setCurrentWorkspace
}) {
  const { user, logout, demoLogin } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data.results || []);
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    }
  };

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePersonaChange = async (e) => {
    const role = e.target.value;
    if (role) {
      await demoLogin(role);
      window.location.reload();
    }
  };

  return (
    <header className="navbar">
      <div className="nav-left">
        <div className="brand-logo">
          <div className="brand-icon-box">
            <Layers size={18} />
          </div>
          <span>Stratum</span>
        </div>

        {/* Workspace Selector */}
        {workspaces.length > 0 && (
          <div className="workspace-badge">
            <select
              value={currentWorkspace?.id || ''}
              onChange={(e) => {
                const found = workspaces.find(w => w.id === parseInt(e.target.value));
                if (found) setCurrentWorkspace(found);
              }}
              style={{ background: 'transparent', border: 'none', color: 'inherit', fontWeight: 600, cursor: 'pointer' }}
            >
              {workspaces.map(w => (
                <option key={w.id} value={w.id} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 1-Click Persona Switcher */}
        <div className="demo-switcher">
          <UserCheck size={14} />
          <span>Role:</span>
          <select value={user?.role || 'ADMIN'} onChange={handlePersonaChange}>
            <option value="ADMIN" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
              👑 Admin (Alex)
            </option>
            <option value="PROJECT_MANAGER" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
              📋 PM (Sarah)
            </option>
            <option value="DEVELOPER" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
              💻 Dev (David)
            </option>
            <option value="VIEWER" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
              👁️ Viewer (Marcus - Read Only)
            </option>
          </select>
        </div>
      </div>

      <div className="nav-right">
        {/* Global Search Bar */}
        <div className="search-input-wrapper">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            placeholder="Search tasks (e.g. STR-1, postgres)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Theme Toggle Button */}
        <button
          className="btn-ghost"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Toggle light/dark theme"
          style={{ padding: '8px', borderRadius: 'var(--radius-md)' }}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn-ghost"
            onClick={() => setShowNotifications(!showNotifications)}
            style={{ position: 'relative', padding: '8px', borderRadius: 'var(--radius-md)' }}
            title="Notifications"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  background: 'var(--primary-500)',
                  color: '#FFF',
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 8px var(--primary-glow)'
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Drawer */}
          {showNotifications && (
            <div className="notification-popover">
              <div className="notification-header">
                <span>Notifications ({unreadCount} unread)</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    style={{ fontSize: '0.75rem', color: 'var(--primary-400)', fontWeight: 600 }}
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                    No notifications yet
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className={`notification-item ${!n.is_read ? 'unread' : ''}`}
                      onClick={(e) => handleMarkRead(n.id, e)}
                    >
                      <div style={{ marginTop: '2px' }}>
                        {n.notification_type === 'TASK_ASSIGNED' && <CheckCircle2 size={16} color="var(--primary-400)" />}
                        {n.notification_type === 'DEADLINE_APPROACHING' && <AlertTriangle size={16} color="#F59E0B" />}
                        {n.notification_type === 'STATUS_CHANGED' && <Clock size={16} color="#10B981" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {n.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {n.message}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            className="user-avatar"
            style={{ backgroundColor: user?.avatar_color || '#6366F1' }}
            title={`${user?.full_name} (${user?.role})`}
          >
            {user?.initials || 'U'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, lineHeight: 1.1 }}>
              {user?.full_name}
            </span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
              {user?.role?.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Logout */}
        <button
          className="btn-ghost"
          onClick={logout}
          title="Sign out"
          style={{ padding: '8px', borderRadius: 'var(--radius-md)' }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
