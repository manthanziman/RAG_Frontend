import { Plus, MessageCircle } from "lucide-react"

function Sidebar({ sessions, activeSessionId, onNewChat, onSelectSession }) {
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
    </aside>
  )
}

export default Sidebar