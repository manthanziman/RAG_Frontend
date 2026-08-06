import MessageList from './MessageList.jsx'
import MessageInput from './MessageInput.jsx'

function ChatWindow({
  session,
  messages,
  status,
  error,
  queryText,
  attachedFiles,
  onQueryChange,
  onSend,
  onFileAttach,
  onRemoveAttachment,
}) {
  return (
    <main className="chat-window">
      {/* <div className="chat-header">
        <div>
          <h1>RAG chat</h1>
          <p className="session-info">{session ? `Session ${session.sessionId.slice(-8)}` : 'No active session yet'}</p>
        </div>
      </div> */}

      <MessageList messages={messages} isLoading={status === 'loading'} />

      {error && <div className="chat-error">{error}</div>}

      <MessageInput
        value={queryText}
        attachedFiles={attachedFiles}
        onChange={onQueryChange}
        onSend={onSend}
        onFileAttach={onFileAttach}
        onRemoveAttachment={onRemoveAttachment}
        disabled={status === 'loading'}
      />
    </main>
  )
}

export default ChatWindow
