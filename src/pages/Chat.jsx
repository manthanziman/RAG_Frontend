import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar.jsx";
import ChatWindow from "../components/ChatWindow.jsx";
import { apiFetch } from "../api.js";

const ACTIVE_SESSION_KEY = "rag_active_session_id";

const mapServerMessages = (messages) =>
  (messages || []).map((message) => ({
    role: message.role,
    text: message.message || message.reply || message.content || message.text || "",
  }));

export default function Chat() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(() => localStorage.getItem(ACTIVE_SESSION_KEY) || "",);
  const [queryText, setQueryText] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const activeSession = sessions.find((session) => session.sessionId === activeSessionId,);

  const hydrateSessionMessages = async (sessionId) => {
    try {
      const data = await apiFetch(`/chat/sessions/${sessionId}`);
      const messages = mapServerMessages(data.result?.messages);
      setSessions((prev) =>
        prev.map((session) =>
          session.sessionId === sessionId ? { ...session, messages } : session,
        ),
      );
    } catch (err) {
      setError(err.message || "Unable to load conversation");
    }
  };

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      setStatus("loading");

      try {
        const data = await apiFetch("/chat/sessions");

        const list = (data.result || []).map((session) => ({
          sessionId: session.sessionId,
          createdAt: session.createdAt,
          title: session.title,
          preview: session.preview || session.lastMessage || "",
          messages: null,
        }));

        if (cancelled) return;

        const hydratedList = await Promise.all(
          list.map(async (session) => {
            const sessionData = await apiFetch(`/chat/sessions/${session.sessionId}`);

            return {
              ...session,
              messages: mapServerMessages(sessionData.result?.messages),
            };
          }),
        );

        if (cancelled) return;

        setSessions(hydratedList);
        const storedActiveId = localStorage.getItem(ACTIVE_SESSION_KEY);
        const initialId = (storedActiveId && hydratedList.some((session) => session.sessionId === storedActiveId) && storedActiveId) || hydratedList[0]?.sessionId || "";

        if (initialId) {
          setActiveSessionId(initialId);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load conversations");
        }
      } finally {
        if (!cancelled) {
          setStatus("idle");
        }
      }
    };

    init();
    return () => {cancelled = true;};
  }, []);

  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem(ACTIVE_SESSION_KEY, activeSessionId);
    } else {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    }
  }, [activeSessionId]);

  const updateSessionMessages = (sessionId, updater) => {
    setSessions((prev) =>
      prev.map((session) => {
        if (session.sessionId !== sessionId) {
          return session;
        }

        const currentMessages = session.messages || [];
        const nextMessages = typeof updater === "function" ? updater(currentMessages) : updater;

        return {
          ...session,
          messages: nextMessages,
        };
      }),
    );
  };

  const createSession = async () => {
    setError("");
    setStatus("loading");

    try {
      const data = await apiFetch("/chat/sessions", {
        method: "POST",
      });

      const sessionId = data.result.sessionId;
      const newSession = {
        sessionId,
        createdAt: data.result.createdAt,
        title: data.result.title,
        messages: [],
      };

      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(sessionId);
      return sessionId;
    } catch (err) {
      setError(err.message || "Session creation failed");
      return "";
    } finally {
      setStatus("idle");
    }
  };

  const getOrCreateSession = async () => {
    if (activeSessionId) {
      return activeSessionId;
    }

    return await createSession();
  };

  const handleNewChat = async () => {
    setQueryText("");
    await createSession();
  };

  const handleSelectSession = async (sessionId) => {
    setError("");
    setActiveSessionId(sessionId);
    setQueryText("");

    const target = sessions.find((session) => session.sessionId === sessionId);

    if (!target || !Array.isArray(target.messages)) {
      setStatus("loading");
      await hydrateSessionMessages(sessionId);
      setStatus("idle");
    }
  };

  const handleSend = async () => {
    /**
     * Prevent sending while another
     * message is being generated.
     */
    if (status !== "idle" && status !== "error") {
      return;
    }

    const trimmedText = queryText.trim();

    if (!trimmedText) {
      return;
    }

    const sessionId = await getOrCreateSession();

    if (!sessionId) {
      return;
    }

    setError("");

    const userMessage = {
      role: "user",
      text: trimmedText,
    };

    /**
     * Create an empty assistant message
     * immediately.
     */
    const assistantMessage = {
      role: "assistant",
      text: "",
    };

    const nextMessages = [
      ...(activeSession?.messages || []),
      userMessage,
      assistantMessage,
    ];

    updateSessionMessages(sessionId, nextMessages);
    setQueryText("");
    setStatus("analyzing");

    try {
      const response = await apiFetch("/chat/message", {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          sessionId,
          message: trimmedText,
        }),
        parseJson: false,
      });

      if (!response.body) {
        throw new Error("Streaming response is not supported by this browser.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, {
          stream: true,
        });

        /**
         * SSE events are separated
         * by two newline characters.
         */
        const events = buffer.split("\n\n");

        /**
         * The last item may be an
         * incomplete event.
         */
        buffer = events.pop() || "";

        for (const event of events) {
          if (!event.startsWith("data:")) {
            continue;
          }

          const json = event.slice(5).trim();

          if (!json) {
            continue;
          }

          const data = JSON.parse(json);

          /**
           * Backend status:
           *
           * analyzing
           * retrieving
           * generating
           */
          if (data.type === "status") {
            setStatus(data.status);
          }

          /**
           * Actual Gemini text chunk.
           */
          if (data.type === "text") {
            setStatus("generating");

            updateSessionMessages(sessionId, (messages) => {
              const next = [...messages];
              const lastIndex = next.length - 1;
              const lastMessage = next[lastIndex];

              next[lastIndex] = {
                ...lastMessage,
                text: (lastMessage?.text || "") + data.text,
              };

              return next;
            });
          }

          /*** Generation finished.*/
          if (data.type === "done") {
            setStatus("idle");

            /**
             * Update title returned
             * by the backend.
             */
            if (data.session?.title) {
              setSessions((prev) =>
                prev.map((session) =>
                  session.sessionId === sessionId
                    ? {
                        ...session,
                        title: data.session.title,
                      }
                    : session,
                ),
              );
            }
          }

          /**
           * Backend error after
           * streaming has started.
           */
          if (data.type === "error") {
            throw new Error(data.error || "Request failed");
          }
        }
      }
    } catch (err) {
      console.error("Streaming chat failed:", err);

      setError(err.message || "Request failed");
      setStatus("idle");

      /**
       * Remove the empty assistant
       * message if generation failed
       * before any text was received.
       */
      updateSessionMessages(sessionId, (messages) => {
        const last = messages[messages.length - 1];

        if (last?.role === "assistant" && !last.text) {
          return messages.slice(0, -1);
        }

        return messages;
      });
    }
  };

  return (
    <div className="chat-app">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
      />
      <ChatWindow
        session={activeSession}
        messages={activeSession?.messages || []}
        status={status}
        error={error}
        queryText={queryText}
        onQueryChange={setQueryText}
        onSend={handleSend}
      />
    </div>
  );
}
