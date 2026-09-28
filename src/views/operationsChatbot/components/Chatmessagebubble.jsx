import { Check, MessageCircle } from "react-feather";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function ChatMessageBubble({ message }) {
  const isUser = message.sender === "user";

  return (
    <div className="hosteller-message">
      <div
        className={`hosteller-chat__row ${
          isUser ? "hosteller-chat__row--user" : ""
        }`}
      >
        {!isUser && (
          <div className="hosteller-chat__avatar">
            <MessageCircle size={24} aria-hidden="true" />
          </div>
        )}

        <div className="hosteller-chat__bubble-group">
          <div
            className={`hosteller-chat__bubble ${
              isUser
                ? "hosteller-chat__bubble--user"
                : "hosteller-chat__bubble--bot"
            }`}
          >
            {!isUser ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.text}
              </ReactMarkdown>
            ) : (
              <p>{message.text}</p>
            )}
          </div>
        </div>
      </div>
      {message.timestamp && (
        <span
          className={`hosteller-chat__timestamp ${
            isUser ? "hosteller-chat__timestamp--user" : ""
          }`}
        >
          {message.timestamp}
          {isUser && (
            <span
              className={`hosteller-chat__delivery hosteller-chat__delivery--${
                message.status || "sent"
              }`}
              title={message.status === "sending" ? "Sending" : "Sent"}
              aria-label={message.status === "sending" ? "Sending" : "Sent"}
            >
              {message.status !== "sending" && (
                <Check size={12} aria-hidden="true" />
              )}
            </span>
          )}
        </span>
      )}
    </div>
  );
}

export default ChatMessageBubble;