import { useEffect, useRef, useState } from "react";
import { Alert, Button, Input } from "reactstrap";
import { Check, Lock, MessageCircle, Send, Trash2, X, Home } from "react-feather";
import { toast } from "react-toastify";
import {
  useChat,
  useDeleteChatSession,
} from "./Mutations";
import ChatMessage from "./components/Chatmessagebubble";
import "./style.css";
// import { useSkin } from "@hooks/useSkin";

const formatTimestamp = (value) => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const createWelcomeMessage = () => ({
  id: "welcome",
  sender: "bot",
  text: "Hello! How can I help you today?",
  timestamp: formatTimestamp(new Date()),
});

const mapMessages = (messages = [], previousMessages = []) =>
  messages.map((message, index) => {
    const previousMessage = previousMessages.find(
      (item) => item.id === message.id,
    );

    return {
    id: message.id ?? `message-${index}`,
    sender:
      message.role === "user" || message.role === "USER"
        ? "user"
        : "bot",
    text: message.content || "",
    timestamp:
      formatTimestamp(
        message.createdAt || message.timestamp || message.sentAt,
      ) || previousMessage?.timestamp || null,
    };
  });

function ChatBotWidget({ isAuthenticated, onRequestLogin }) {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([createWelcomeMessage()]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null);

  const [chat, chatState] = useChat();

  const [deleteChatSession, deleteSessionState] =
    useDeleteChatSession();

  const isSending =
    chatState.loading ||
    deleteSessionState.loading;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatState.loading]);

  const handleBubbleClick = () => {
    if (!isAuthenticated) {
      onRequestLogin();
      return;
    }

    setIsOpen(true);
  };

  const handleNewChat = () => {
    if (!isAuthenticated) {
      onRequestLogin();
      return;
    }

    setSessionId(null);
    setMessages([createWelcomeMessage()]);
    setInputValue("");
    setIsOpen(true);
  };

  const handleDeleteChat = async () => {
    if (!sessionId || isSending) {
      return;
    }

    try {
      await deleteChatSession({
        variables: {
          sessionId,
        },
      });

      setSessionId(null);
      setMessages([createWelcomeMessage()]);
      setInputValue("");
      setIsOpen(false);
    } catch (error) {
      console.error(
        "Unable to delete chat session:",
        error,
      );
      toast.error(error.message || "Unable to delete chat session.");
    }
  };

  const handleSend = async () => {
    const text = inputValue.trim();

    if (!text || isSending) {
      return;
    }

    const sentAt = new Date();
    const optimisticMessage = {
      id: `local-${sentAt.getTime()}`,
      sender: "user",
      text,
      timestamp: formatTimestamp(sentAt),
      status: "sending",
    };

    setMessages((currentMessages) => [...currentMessages, optimisticMessage]);
    setInputValue("");

    try {
      const result = await chat({
        variables: {
          sessionId,
          message: text,
        },
      });

      const response = result.data?.chat;

      if (!response) {
        throw new Error("The chat service returned an empty response.");
      }

      setSessionId(response.sessionId);
      const serverMessages = mapMessages(response.messages, messages);
      const userMessageIndex = serverMessages.findLastIndex(
        (message) => message.sender === "user" && message.text === text,
      );

      if (userMessageIndex >= 0) {
        serverMessages[userMessageIndex] = {
          ...serverMessages[userMessageIndex],
          timestamp:
            serverMessages[userMessageIndex].timestamp || optimisticMessage.timestamp,
          status: "sent",
        };
      } else {
        serverMessages.push({ ...optimisticMessage, status: "sent" });
      }

      const latestMessage = serverMessages.at(-1);
      if (latestMessage?.sender === "bot" && !latestMessage.timestamp) {
        latestMessage.timestamp = formatTimestamp(new Date());
      }

      setMessages(serverMessages);
    } catch (error) {
      console.error(
        "Unable to send message:",
        error,
      );

      setMessages((currentMessages) =>
        currentMessages.filter((message) => message.id !== optimisticMessage.id),
      );
      setInputValue(text);
      toast.error(error.message || "Unable to send message.");
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <Button
        type="button"
        className="hosteller-chat__launcher"
        onClick={handleBubbleClick}
        aria-label="Open operations assistant"
      >
        <MessageCircle size={24} aria-hidden="true" />

        {/* <span className="hosteller-chat__launcher-dot" /> */}
      </Button>
    );
  }

  return (
    <div className="hosteller-chat__panel">
      <div className="hosteller-chat__header">
        <div className="hosteller-chat__header-avatar">
              <MessageCircle size={24} color="black" aria-hidden="true" />

          <span className="hosteller-chat__header-avatar-dot" />
        </div>

        <div className="hosteller-chat__header-text">
          <div className="hosteller-chat__header-title">
            The Hosteller
          </div>

          <div className="hosteller-chat__header-subtitle">
            Your operations assistant
          </div>
        </div>

        <div className="hosteller-chat__header-actions">
          {isAuthenticated && (
            <Button
              type="button"
              className="hosteller-chat__icon-btn"
              onClick={handleDeleteChat}
              disabled={isSending || !sessionId}
              title="Delete Chat"
              aria-label="Delete chat"
            >
              <Trash2 size={20} aria-hidden="true" />
            </Button>
          )}

          <Button
            type="button"
            className="hosteller-chat__icon-btn"
            onClick={handleClose}
            title="Close Chat"
            aria-label="Close chat"
          >
            <X size={24} aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="hosteller-chat__messages">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
          />
        ))}

        {chatState.loading && (
          <div className="hosteller-chat__row">
            <div className="hosteller-chat__avatar">
              <MessageCircle size={17} aria-hidden="true" />
            </div>

            <div className="hosteller-chat__bubble-group">
              <div
                className="hosteller-chat__bubble hosteller-chat__bubble--bot"
                role="status"
                aria-label="The assistant is typing"
              >
                <div className="hosteller-chat__typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {!isAuthenticated ? (
        <Alert color="warning" className="hosteller-chat__lock-banner">
          <Lock size={15} aria-hidden="true" />

          <span>
            Please sign in to start a conversation.
          </span>
        </Alert>
      ) : (
        <div className="hosteller-chat__footer">
          <Button
            type="button"
            className="hosteller-chat__home-btn"
            onClick={handleNewChat}
            disabled={isSending}
            title="Restart Chat"
            aria-label="Start new chat"
          >
            <Home size={17} aria-hidden="true" />
          </Button>

          <Input
            type="text"
            className="hosteller-chat__input"
            value={inputValue}
            onChange={(event) =>
              setInputValue(event.target.value)
            }
            onKeyDown={handleKeyDown}
            placeholder="Ask something..."
            disabled={isSending}
          />
          {
            inputValue && (
              <Button
                type="button"
                className="hosteller-chat__send-btn"
                onClick={handleSend}
                disabled={
                  !inputValue.trim() ||
                  isSending
                }
                aria-label="Send message"
              >
                <Send size={16} color="white" aria-hidden="true" />
              </Button>
            )
          }
        </div>
      )}

    </div>
  );
}

export default ChatBotWidget;