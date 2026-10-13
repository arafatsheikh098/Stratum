const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Universal authenticated fetch client with automatic JWT token attachment
 * and refresh token retry mechanics.
 */
class ApiService {
  getAccessToken() {
    return localStorage.getItem('stratum_access_token');
  }

  getRefreshToken() {
    return localStorage.getItem('stratum_refresh_token');
  }

  setTokens(access, refresh) {
    if (access) localStorage.setItem('stratum_access_token', access);
    if (refresh) localStorage.setItem('stratum_refresh_token', refresh);
  }

  clearTokens() {
    localStorage.removeItem('stratum_access_token');
    localStorage.removeItem('stratum_refresh_token');
    localStorage.removeItem('stratum_user');
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('stratum_user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  setCurrentUser(user) {
    localStorage.setItem('stratum_user', JSON.stringify(user));
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle token expiration: attempt refresh
    if (response.status === 401 && this.getRefreshToken()) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.getAccessToken()}`;
        response = await fetch(url, {
          ...options,
          headers,
        });
      }
    }

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { detail: response.statusText };
      }
      const err = new Error(errorData.detail || errorData.error || errorData.message || 'API request failed');
      err.data = errorData;
      err.status = response.status;
      throw err;
    }

    if (response.status === 204) return null;
    return response.json();
  }

  async refreshToken() {
    const refresh = this.getRefreshToken();
    if (!refresh) return false;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
      if (res.ok) {
        const data = await res.json();
        this.setTokens(data.access, data.refresh || refresh);
        return true;
      }
    } catch {
      // Ignore
    }
    this.clearTokens();
    return false;
  }

  // --- Auth Endpoints ---
  async login(email, password) {
    const data = await this.request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setTokens(data.access, data.refresh);
    this.setCurrentUser(data.user);
    return data;
  }

  async register(payload) {
    const data = await this.request('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setTokens(data.access, data.refresh);
    this.setCurrentUser(data.user);
    return data;
  }

  async demoLogin(role) {
    const data = await this.request('/auth/demo-login/', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    this.setTokens(data.access, data.refresh);
    this.setCurrentUser(data.user);
    return data;
  }

  async getDemoAccounts() {
    return this.request('/auth/demo-accounts/');
  }

  async getMe() {
    return this.request('/auth/me/');
  }

  async getUsers() {
    const data = await this.request('/auth/users/');
    return data.results || data;
  }

  // --- Workspaces ---
  async getWorkspaces() {
    const data = await this.request('/workspaces/');
    return data.results || data;
  }

  async createWorkspace(payload) {
    return this.request('/workspaces/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getWorkspaceMembers(workspaceId) {
    return this.request(`/workspaces/${workspaceId}/members/`);
  }

  async inviteWorkspaceMember(workspaceId, userId, role = 'MEMBER') {
    return this.request(`/workspaces/${workspaceId}/members/`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, role }),
    });
  }

  // --- Projects ---
  async getProjects(workspaceId = null) {
    const query = workspaceId ? `?workspace=${workspaceId}` : '';
    const data = await this.request(`/projects/${query}`);
    return data.results || data;
  }

  async createProject(payload) {
    return this.request('/projects/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getProjectAnalytics(projectId) {
    return this.request(`/projects/${projectId}/analytics/`);
  }

  async getProjectMembers(projectId) {
    return this.request(`/projects/${projectId}/members/`);
  }

  // --- Tasks ---
  async getTasks(params = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, val);
      }
    });
    const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const data = await this.request(`/tasks/${queryStr}`);
    return data;
  }

  async getTask(taskId) {
    return this.request(`/tasks/${taskId}/`);
  }

  async createTask(payload) {
    return this.request('/tasks/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateTask(taskId, payload) {
    return this.request(`/tasks/${taskId}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async deleteTask(taskId) {
    return this.request(`/tasks/${taskId}/`, {
      method: 'DELETE',
    });
  }

  async reorderTask(taskId, status, order) {
    return this.request(`/tasks/${taskId}/reorder/`, {
      method: 'POST',
      body: JSON.stringify({ status, order }),
    });
  }

  // --- Subtasks Checklist ---
  async addSubtask(taskId, title) {
    return this.request(`/tasks/${taskId}/subtasks/`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  async toggleSubtask(taskId, subtaskId, isCompleted) {
    return this.request(`/tasks/${taskId}/subtasks/${subtaskId}/`, {
      method: 'PATCH',
      body: JSON.stringify({ is_completed: isCompleted }),
    });
  }

  async deleteSubtask(taskId, subtaskId) {
    return this.request(`/tasks/${taskId}/subtasks/${subtaskId}/`, {
      method: 'DELETE',
    });
  }

  // --- Comments ---
  async getComments(taskId) {
    return this.request(`/tasks/${taskId}/comments/`);
  }

  async addComment(taskId, content) {
    return this.request(`/tasks/${taskId}/comments/`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // --- Notifications ---
  async getNotifications(isRead = null) {
    const query = isRead !== null ? `?is_read=${isRead}` : '';
    return this.request(`/notifications/${query}`);
  }

  async markNotificationRead(id) {
    return this.request(`/notifications/${id}/mark-read/`, {
      method: 'POST',
    });
  }

  async markAllNotificationsRead() {
    return this.request('/notifications/mark-all-read/', {
      method: 'POST',
    });
  }

  // --- Activity Log ---
  async getActivityLogs(params = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) searchParams.append(k, v);
    });
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request(`/activity/${query}`);
  }
}

export const api = new ApiService();
