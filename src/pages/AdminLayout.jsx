import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Users, ArrowLeft } from 'lucide-react';

export default function AdminLayout() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2>Admin Dashboard</h2>
        </div>
        <nav className="admin-nav">
          <NavLink to="/admin/documents" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <FileText size={18} />
            Knowledge Base
          </NavLink>
          <NavLink to="/admin/users" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <Users size={18} />
            Users
          </NavLink>
        </nav>
        <div className="admin-sidebar-footer">
          <NavLink to="/" className="admin-nav-item return-link">
            <ArrowLeft size={18} />
            Back to Chat
          </NavLink>
        </div>
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
