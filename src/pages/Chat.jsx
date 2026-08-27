import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import ChatWindow from '../components/ChatWindow.jsx';
import { apiFetch } from '../api.js';

const ACTIVE_SESSION_KEY = 'rag_active_session_id';

const mapServerMessages = (messages) =>
  (messages || []).map((message) => ({
    role: message.role,
    text: message.message || message.reply || message.content || message.text,
  }));

export default function Chat() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(
    () => localStorage.getItem(ACTIVE_SESSION_KEY) || '',
  );
  const [queryText, setQueryText] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const activeSession = sessions.find((session) => session.sessionId === activeSessionId);

  const hydrateSessionMessages = async (sessionId) => {
    try {
      const data = await apiFetch(`/chat/sessions/${sessionId}`);
      const messages = mapServerMessages(data.result?.messages);
      setSessions((prev) =>
        prev.map((session) => (session.sessionId === sessionId ? { ...session, messages } : session)),
      );
    } catch (err) {
      setError(err.message || 'Unable to load conversation');
    }
  };

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      setStatus('loading');
      try {
        const data = await apiFetch('/chat/sessions');
        const list = (data.result || []).map((session) => ({
          sessionId: session.sessionId,
          createdAt: session.createdAt,
          title: session.title,
          messages: null, 
        }));

        if (cancelled) return;
        setSessions(list);

        const storedActiveId = localStorage.getItem(ACTIVE_SESSION_KEY);
        const initialId =
          (storedActiveId && list.some((session) => session.sessionId === storedActiveId) && storedActiveId) ||
          list[0]?.sessionId ||
          '';

        if (initialId) {
          setActiveSessionId(initialId);
          await hydrateSessionMessages(initialId);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Unable to load conversations');
      } finally {
        if (!cancelled) setStatus('idle');
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem(ACTIVE_SESSION_KEY, activeSessionId);
    } else {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    }
  }, [activeSessionId]);

  const updateSessionMessages = (sessionId, nextMessages) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.sessionId === sessionId ? { ...session, messages: nextMessages } : session,
      ),
    );
  };

  const createSession = async () => {
    setError('');
    setStatus('loading');

    try {
      const data = await apiFetch('/chat/sessions', {
        method: 'POST',
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
      setError(err.message || 'Session creation failed');
      return '';
    } finally {
      setStatus('idle');
    }
  };

  const getOrCreateSession = async () => {
    if (activeSessionId) {
      return activeSessionId;
    }
    return await createSession();
  };

  const handleNewChat = async () => {
    setQueryText('');
    await createSession();
  };

  const handleSelectSession = async (sessionId) => {
    setError('');
    setActiveSessionId(sessionId);
    setQueryText('');

    const target = sessions.find((session) => session.sessionId === sessionId);
    if (!target || !Array.isArray(target.messages)) {
      setStatus('loading');
      await hydrateSessionMessages(sessionId);
      setStatus('idle');
    }
  };

  const handleSend = async () => {
    if (status === 'loading') {
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

    const userMessage = { role: 'user', text: trimmedText };
    const nextMessages = [...(activeSession?.messages ?? []), userMessage];
    updateSessionMessages(sessionId, nextMessages);
    setStatus('loading');
    setError('');

    try {
      const data = await apiFetch('/chat/message', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          message: trimmedText,
        }),
      });

      const assistantMessage = { role: 'assistant', text: data.result?.reply || 'No answer received' };
      
      // Update session title if it's new
      setSessions((prev) =>
        prev.map((session) =>
          session.sessionId === sessionId
            ? { ...session, title: data.result?.session?.title || session.title, messages: [...nextMessages, assistantMessage] }
            : session,
        ),
      );
      setQueryText('');
    } catch (err) {
      setError(err.message || 'Request failed');
    } finally {
      setStatus('idle');
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
        messages={activeSession?.messages ?? []}
        status={status}
        error={error}
        queryText={queryText}
        onQueryChange={setQueryText}
        onSend={handleSend}
      />
    </div>
  );
}
