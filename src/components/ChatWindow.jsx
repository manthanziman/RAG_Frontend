import MessageList from "./MessageList.jsx";
import MessageInput from "./MessageInput.jsx";
import { AlertTriangle } from "lucide-react";

function ChatWindow({
  session,
  messages,
  status,
  error,
  queryText,
  onQueryChange,
  onSend,
}) {
  return (
    <main className="chat-window">
      <div className="chat-header">
        <h2>Ops Internal Chatbot</h2>
      </div>

      <MessageList messages={messages} status={status} />

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
