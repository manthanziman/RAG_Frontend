import { Plus, MessageCircle, LogOut, ShieldAlert } from "lucide-react"
import { Link } from 'react-router-dom';
import { useAuth } from "../contexts/AuthContext"
function Sidebar({ sessions, activeSessionId, onNewChat, onSelectSession }) {
  const { user, logout, isAdmin } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <button className="button button-primary" type="button" onClick={onNewChat}>
          <Plus/>
        </button>
      </div>

      <div className="session-list">
        {sessions.length === 0 ? (
          <div className="sidebar-empty">No chats yet</div>
        ) : (
          sessions.map((session) => {
            const preview =
              session.messages?.find((message) => message.role === 'user' || message.role === 'assistant')?.text ||
              session.preview ||
              'New chat'
            return (
              <button
                key={session.sessionId}
                type="button"
                className={`session-item ${session.sessionId === activeSessionId ? 'active' : ''}`}
                onClick={() => onSelectSession(session.sessionId)}
              >
                {/* <MessageCircle/> */}
                <span>{preview}</span>
                {/* <small>{session.sessionId.slice(-8)}</small> */}
              </button>
            )
          })
        )}
      </div>

      <div className="sidebar-footer">
        {isAdmin && (
          <Link to="/admin/documents" className="sidebar-action admin-link">
            <ShieldAlert size={16} /> Admin Dashboard
          </Link>
        )}
        <div className="user-profile">
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">{user?.role}</span>
          </div>
          <button className="button-logout" onClick={logout} title="Log Out">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar