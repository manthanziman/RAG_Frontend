import { useEffect, useRef } from 'react'
import { User, Bot, Settings } from 'lucide-react'

function MessageList({ messages, isLoading }) {
  const listRef = useRef(null)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [messages, isLoading])

  return (
    <div className="message-list" ref={listRef}>
      {messages.length === 0 ? (
        <div className="message-empty">Upload a document or send a message to start the chat.</div>
      ) : (
        messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`message message-${message.role}`}>
            <div className="message-role">{message.role === <User/> ? 'You' : message.role === 'assistant' ? <Bot/> : <Settings/>}</div>
            <div className="message-text">{message.text}</div>
          </div>
        ))
      )}

      {isLoading && <div className="message message-status">Thinking…</div>}
    </div>
  )
}

export default MessageList
