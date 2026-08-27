import { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch, getAuthToken, setAuthToken, removeAuthToken } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from local storage initially so we don't flash login screen
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      const storedUser = localStorage.getItem('rag_auth_user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          removeAuthToken();
          localStorage.removeItem('rag_auth_user');
        }
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data.success && data.token) {
      setAuthToken(data.token);
      localStorage.setItem('rag_auth_user', JSON.stringify(data.result));
      setUser(data.result);
      return data.result;
    }
    throw new Error('Login failed');
  };

  const signup = async (name, email, password) => {
    const data = await apiFetch('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    
    if (!data.success) {
      throw new Error('Signup failed');
    }
    return data.result;
  };

  const logout = () => {
    removeAuthToken();
    localStorage.removeItem('rag_auth_user');
    setUser(null);
    window.location.href = '/login';
  };

  const value = {
    user,
    login,
    signup,
    logout,
    isAdmin: user?.role?.toLowerCase() === 'admin',
    isAuthenticated: !!user,
  };

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
