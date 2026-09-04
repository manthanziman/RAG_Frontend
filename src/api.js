const API_BASE = 'https://ops-dashboard-chatbot.onrender.com/api';

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

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: options.credentials ?? 'include',
    headers,
  });

  if (response.status === 401) {
    removeAuthToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  if (response.status === 403) {
    throw new Error('Access denied');
  }

  if (options.parseJson === false) {
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(errorText || `Request failed with status ${response.status}`);
    }

    return response;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || `Request failed with status ${response.status}`);
  }

  return data;
}
