import { useEffect, useRef } from 'react'
import { User, Bot, Settings } from 'lucide-react'
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function MessageList({ messages, isLoading }) {
  const listRef = useRef(null)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [messages, isLoading])
  console.log(messages)
  return (
    <div className="message-list" ref={listRef}>
      {messages.length === 0 ? (
        <div className="message-empty">Send a message to start the chat.</div>
      ) : (
        messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`messagecard`}>
              <div  className={`message message-${message.role}`}>
              <div className="message-role">
                {message.role === 'user' ? <User /> : message.role === 'assistant' ? <Bot /> : <Settings />}
              </div>
              <div className="message-text">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.text}
              </ReactMarkdown>
              </div>
              </div>
            </div>
        ))
      )}

      {isLoading && <div className="message message-status">Sending…</div>}
    </div>
  )
}

export default MessageList
