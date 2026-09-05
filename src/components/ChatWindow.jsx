import { useState } from "react";
import MessageList from "./MessageList.jsx";
import MessageInput from "./MessageInput.jsx";
import { AlertTriangle, Bot, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";

const getWelcomeKey = (userId) => `rag_welcome_seen_${userId}`;

function ChatWindow({
  messages,
  status,
  error,
  queryText,
  onQueryChange,
  onSend,
}) {
  const { user } = useAuth();
  const userId = user?._id || user?.id || user?.email;
  const [showWelcome, setShowWelcome] = useState(() => (
    Boolean(userId) && localStorage.getItem(getWelcomeKey(userId)) !== "true"
  ));
  const isEmpty = messages.length === 0 && !error;
  const closeWelcome = () => {
    if (userId) {
      localStorage.setItem(getWelcomeKey(userId), "true");
    }
    setShowWelcome(false);
  };

  return (
    <main className="chat-window">
      <div className="chat-header">
        <h2>Ops Internal Chatbot</h2>
      </div>

      <MessageList messages={messages} status={status} />

      {showWelcome && isEmpty && (
        <div className="welcome-backdrop" role="presentation" onMouseDown={closeWelcome}>
          <section className="welcome-modal" role="dialog" aria-modal="true" aria-labelledby="welcome-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="welcome-close" type="button" aria-label="Close introduction" onClick={closeWelcome}>
              <X size={18} />
            </button>
            <div className="welcome-icon" aria-hidden="true">
              <Bot size={28} />
            </div>
            <p className="welcome-eyebrow">Ops assistant</p>
            <h2 id="welcome-title">How can I help?</h2>
            <p className="welcome-copy">Ask questions about operations, internal documents, and procedures. I&apos;ll search the available knowledge and help you find a clear answer.</p>
            <button className="button button-primary welcome-action" type="button" onClick={closeWelcome}>
              Start chatting
            </button>
          </section>
        </div>
      )}

      {error && (
        <div className="chat-error" role="alert" aria-live="assertive">
          <div className="chat-error-icon" aria-hidden="true">
            <AlertTriangle size={18} />
          </div>
          <div className="chat-error-content">
            <strong>We couldn&apos;t complete that request</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      <MessageInput
        value={queryText}
        onChange={onQueryChange}
        onSend={onSend}
        disabled={status !== "idle"}
      />
    </main>
  );
}

export default ChatWindow;
