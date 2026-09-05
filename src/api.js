const API_BASE = 'https://ops-dashboard-chatbot.onrender.com/api';
const API_BASE_DEV = 'http://localhost:4040/api';

export const getAuthToken = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  return localStorage.getItem('rag_auth_token');
};

export const setAuthToken = (token) => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  localStorage.setItem('rag_auth_token', token);
};

export const removeAuthToken = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  localStorage.removeItem('rag_auth_token');
};

export async function apiFetch(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_DEV}${endpoint}`, {
    ...options,
    credentials: options.credentials ?? 'include',
    headers,
  });

  if (response.status === 401) {
    removeAuthToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    const error = new Error('Unauthorized');
    error.status = response.status;
    throw error;
  }

  if (response.status === 403) {
    const errorData = await response.json().catch(() => null);
    const error = new Error(errorData?.error || errorData?.message || 'Access denied');
    error.status = response.status;
    throw error;
  }

  if (options.parseJson === false) {
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      const error = new Error(errorText || `Request failed with status ${response.status}`);
      error.status = response.status;
      throw error;
    }

    return response;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.error || `Request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return data;
}
