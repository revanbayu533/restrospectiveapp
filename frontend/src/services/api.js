const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Helper internal untuk melakukan HTTP request dengan Fetch API
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('access_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'Terjadi kesalahan pada server');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth API
  async login(email, password) {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.accessToken) {
      localStorage.setItem('access_token', res.accessToken);
    }
    return res;
  },

  async register(email, password, name) {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    if (res.accessToken) {
      localStorage.setItem('access_token', res.accessToken);
    }
    return res;
  },

  async getMe() {
    return request('/auth/me', { method: 'GET' });
  },

  logout() {
    localStorage.removeItem('access_token');
  },

  // Workspace API
  async getWorkspaces() {
    return request('/workspaces', { method: 'GET' });
  },

  async getWorkspaceById(id) {
    return request(`/workspaces/${id}`, { method: 'GET' });
  },

  async createWorkspace(name) {
    return request('/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  async updateWorkspace(id, data) {
    return request(`/workspaces/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteWorkspace(id) {
    return request(`/workspaces/${id}`, {
      method: 'DELETE',
    });
  },

  // Invite API
  async createInvite(workspaceId) {
    return request(`/workspaces/${workspaceId}/invite`, {
      method: 'POST',
    });
  },

  async getActiveInvite(workspaceId) {
    return request(`/workspaces/${workspaceId}/invite`, {
      method: 'GET',
    });
  },

  async deactivateInvite(workspaceId) {
    return request(`/workspaces/${workspaceId}/invite/deactivate`, {
      method: 'PATCH',
    });
  },

  async getWorkspaceMembers(workspaceId) {
    return request(`/workspaces/${workspaceId}/members`, {
      method: 'GET',
    });
  },

  async getInviteInfo(token) {
    return request(`/invites/${token}`, {
      method: 'GET',
    });
  },

  async joinWorkspace(token) {
    return request(`/invites/${token}/join`, {
      method: 'POST',
    });
  },

  // Board API
  async getBoards(workspaceId) {
    return request(`/workspaces/${workspaceId}/boards`, { method: 'GET' });
  },

  async getBoardById(boardId) {
    return request(`/boards/${boardId}`, { method: 'GET' });
  },

  async createBoard(workspaceId, boardData) {
    return request(`/workspaces/${workspaceId}/boards`, {
      method: 'POST',
      body: JSON.stringify(boardData),
    });
  },

  async deleteBoard(boardId) {
    return request(`/boards/${boardId}`, {
      method: 'DELETE',
    });
  },

  // Card API
  async getCards(boardId) {
    return request(`/boards/${boardId}/cards`, { method: 'GET' });
  },

  async createCard(boardId, columnId, content) {
    return request(`/boards/${boardId}/cards`, {
      method: 'POST',
      body: JSON.stringify({ columnId, content }),
    });
  },

  async updateCard(cardId, content) {
    return request(`/cards/${cardId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
  },

  async deleteCard(cardId) {
    return request(`/cards/${cardId}`, {
      method: 'DELETE',
    });
  },
};
