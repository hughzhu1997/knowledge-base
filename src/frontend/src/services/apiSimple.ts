// API service for frontend
const API_BASE_URL = 'http://localhost:3000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get auth token from localStorage
  getToken() {
    return localStorage.getItem('token');
  }

  // Create headers with auth token
  getHeaders() {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Auth methods
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Document methods
  async getDocuments(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/docs?${queryString}`);
  }

  async getDocumentById(id) {
    return this.request(`/docs/${id}`);
  }

  async createDocument(docData) {
    return this.request('/docs', {
      method: 'POST',
      body: JSON.stringify(docData)
    });
  }

  async updateDocument(id, docData) {
    return this.request(`/docs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(docData)
    });
  }

  async deleteDocument(id) {
    return this.request(`/docs/${id}`, {
      method: 'DELETE'
    });
  }

  async updateDocumentCategory(id, category) {
    return this.request(`/docs/${id}/category`, {
      method: 'PUT',
      body: JSON.stringify({ category })
    });
  }

  async updateDocumentVisibility(id, visibility) {
    return this.request(`/docs/${id}/visibility`, {
      method: 'PUT',
      body: JSON.stringify({ visibility })
    });
  }

  // User methods
  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/users?${queryString}`);
  }

  async getUserById(id) {
    return this.request(`/users/${id}`);
  }

  async updateUserRole(userId, roleId) {
    return this.request(`/users/${userId}/roles`, {
      method: 'POST',
      body: JSON.stringify({ roleId })
    });
  }

  // Search methods
  async searchDocuments(query, params = {}) {
    const searchParams = new URLSearchParams({ q: query, ...params });
    return this.request(`/search?${searchParams}`);
  }

  // Stats methods
  async getDocumentStats() {
    return this.request('/docs/stats');
  }

  async getActiveUsersCount() {
    return this.request('/users/active-count');
  }

  async getMonthlyVisitsCount() {
    return this.request('/users/monthly-visits');
  }
}

const apiService = new ApiService();
export default apiService;
