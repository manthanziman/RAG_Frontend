import { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { UserX, UserCheck } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/users');
      setUsers(data.result || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (id, newRole) => {
    try {
      await apiFetch(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole }),
      });
      setUsers(users.map((u) => (u._id === id ? { ...u, role: newRole } : u)));
    } catch (err) {
      setError(err.message || 'Failed to update user role');
    }
  };

  const toggleActiveStatus = async (user) => {
    if (!window.confirm(`Are you sure you want to ${user.isActive ? 'deactivate' : 'activate'} this user?`)) return;

    try {
      if (user.isActive) {
        await apiFetch(`/users/${user._id}`, { method: 'DELETE' });
        setUsers(users.map((u) => (u._id === user._id ? { ...u, isActive: false } : u)));
      } else {
        await apiFetch(`/users/${user._id}`, {
          method: 'PUT',
          body: JSON.stringify({ isActive: true }),
        });
        setUsers(users.map((u) => (u._id === user._id ? { ...u, isActive: true } : u)));
      }
    } catch (err) {
      setError(err.message || 'Failed to update user status');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>User Management</h1>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-table-container">
        {loading ? (
          <div className="admin-loading">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="admin-empty">No users found.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className={!user.isActive ? 'inactive-row' : ''}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user._id, e.target.value)}
                      disabled={!user.isActive}
                      className="role-select"
                    >
                      <option value="user">User</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>
                    <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button 
                      className={`icon-button ${user.isActive ? 'danger' : 'success'}`} 
                      onClick={() => toggleActiveStatus(user)}
                      title={user.isActive ? 'Deactivate User' : 'Activate User'}
                    >
                      {user.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
