import MessageList from './MessageList.jsx'
import MessageInput from './MessageInput.jsx'

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
        <h1>RAG chat</h1>
      </div>
      <MessageList messages={messages} isLoading={status === 'loading'} />

      {error && <div className="chat-error">{error}</div>}

      <MessageInput
        value={queryText}
        onChange={onQueryChange}
        onSend={onSend}
        disabled={status === 'loading'}
      />
    </main>
  )
}

export default ChatWindow
