import { useEffect,useRef} from 'react';
import {User,Bot,Settings,} from 'lucide-react';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function MessageList({messages,status}) {
  const listRef = useRef(null);

  useEffect(() => {
    if (!listRef.current) {
      return;
    }

    listRef.current.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: 'auto',
    });
  }, [messages, status]);

  const isRetrieving = status === 'retrieving';

  const isAnalyzing = status === 'analyzing';

  const isGenerating = status === 'generating';

  const lastMessage = messages[messages.length - 1];

  const showGenerating = isGenerating && lastMessage?.role === 'assistant' && !lastMessage?.text;

  return (
    <div
      className="message-list"
      ref={listRef}
    >
      {messages.length === 0 ? (
        <div className="message-empty">
          Send a message to start the
          chat.
        </div>
      ) : (
        messages.map(
          (message, index) => (
            <div
              key={`${message.role}-${index}`}
              className="messagecard"
            >
              <div
                className={`message message-${message.role}`}
              >
                <div className="message-role">
                  {message.role ==='user' ? (
                    <User />
                  ) : message.role ==='assistant' ? (
                    <Bot />
                  ) : (
                    <Settings />
                  )}
                </div>

                <div className="message-text">
                  {message.text ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm,]}
                    >
                      {message.text}
                    </ReactMarkdown>
                  ) : null}
                </div>
              </div>
            </div>
          )
        )
      )}

      {isAnalyzing && (
        <div className="message message-status">
          Thinking...
        </div>
      )}

      {isRetrieving && (
        <div className="message message-status">
          Searching documents...
        </div>
      )}

      {showGenerating && (
        <div className="message message-status">
          Generating...
        </div>
      )}
    </div>
  );
}

export default MessageList;