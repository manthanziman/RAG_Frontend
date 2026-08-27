const API_BASE = 'http://localhost:4040/api';

export const getAuthToken = () => localStorage.getItem('rag_auth_token');
export const setAuthToken = (token) => localStorage.setItem('rag_auth_token', token);
export const removeAuthToken = () => localStorage.removeItem('rag_auth_token');

export async function apiFetch(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Automatically set Content-Type to JSON if sending JSON
  if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Clear token if unauthorized
    removeAuthToken();
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  
  if (response.status === 403) {
    throw new Error('Access denied');
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || `Request failed with status ${response.status}`);
  }

  return data;
}
