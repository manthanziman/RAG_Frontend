import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import ChatWindow from './components/ChatWindow.jsx'
import './App.css'

const API_BASE = 'http://localhost:4001/api'

// Only used to reopen the same conversation after a refresh — the sidebar
// list itself always comes from the backend now, not from localStorage.
const ACTIVE_SESSION_KEY = 'rag_active_session_id'

// Backend stores chat turns as { role, content, createdAt }; the UI renders
// { role, text }. Map on the way in from GET /session/:id.
const mapServerMessages = (messages) =>
  (messages || []).map((message) => ({
    role: message.role,
    text: message.content,
  }))

function App() {
  // Each entry: { sessionId, createdAt, preview, messages }.
  // `messages` is `null` until it's actually been fetched (lazy load).
  const [sessions, setSessions] = useState([])
  const [activeSessionId, setActiveSessionId] = useState(
    () => localStorage.getItem(ACTIVE_SESSION_KEY) || '',
  )
  const [queryText, setQueryText] = useState('')
  const [attachedFiles, setAttachedFiles] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  const activeSession = sessions.find((session) => session.sessionId === activeSessionId)

  // Fetch a single session's full message history and merge it into state.
  // Safe to call repeatedly — uses a functional update, no stale closures.
  const hydrateSessionMessages = async (sessionId) => {
    try {
      const response = await fetch(`${API_BASE}/documents/session/${sessionId}`)
      if (!response.ok) {
        throw new Error('Unable to load conversation')
      }
      const data = await response.json()
      const messages = mapServerMessages(data.session?.messages)
      setSessions((prev) =>
        prev.map((session) => (session.sessionId === sessionId ? { ...session, messages } : session)),
      )
    } catch (err) {
      setError(err.message || 'Unable to load conversation')
    }
  }

  // On load: fetch the list of every conversation from the backend, then
  // hydrate whichever one should be active (last-open, or the newest).
  useEffect(() => {
    let cancelled = false

    const init = async () => {
      setStatus('loading')
      try {
        const response = await fetch(`${API_BASE}/documents/session`)
        if (!response.ok) {
          throw new Error('Unable to load conversations')
        }
        const data = await response.json()
        const list = (data.sessions || []).map((session) => ({
          sessionId: session.sessionId,
          createdAt: session.createdAt,
          preview: session.preview,
          messages: null, // lazy-loaded on selection
        }))

        if (cancelled) return
        setSessions(list)

        const storedActiveId = localStorage.getItem(ACTIVE_SESSION_KEY)
        const initialId =
          (storedActiveId && list.some((session) => session.sessionId === storedActiveId) && storedActiveId) ||
          list[0]?.sessionId ||
          ''

        if (initialId) {
          setActiveSessionId(initialId)
          await hydrateSessionMessages(initialId)
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Unable to load conversations')
      } finally {
        if (!cancelled) setStatus('idle')
      }
    }

    init()
    return () => {
      cancelled = true
    }
  }, [])

  // Persist which chat is active so a refresh reopens the same conversation.
  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem(ACTIVE_SESSION_KEY, activeSessionId)
    } else {
      localStorage.removeItem(ACTIVE_SESSION_KEY)
    }
  }, [activeSessionId])

  const updateSessionMessages = (sessionId, nextMessages) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.sessionId === sessionId ? { ...session, messages: nextMessages } : session,
      ),
    )
  }

  const createSession = async () => {
    setError('')
    setStatus('loading')

    try {
      const response = await fetch(`${API_BASE}/documents/session`, {
        method: 'POST',
      })
      if (!response.ok) {
        throw new Error('Unable to create session')
      }
      const data = await response.json()
      const sessionId = data.sessionId
      const newSession = {
        sessionId,
        createdAt: new Date().toISOString(),
        preview: null,
        messages: [], // brand new, nothing to fetch
      }
      setSessions((prev) => [newSession, ...prev])
      setActiveSessionId(sessionId)
      return sessionId
    } catch (err) {
      setError(err.message || 'Session creation failed')
      return ''
    } finally {
      setStatus('idle')
    }
  }

  const getOrCreateSession = async () => {
    if (activeSessionId) {
      return activeSessionId
    }
    return await createSession()
  }

  const handleNewChat = async () => {
    setQueryText('')
    setAttachedFiles([])
    await createSession()
  }

  const handleSelectSession = async (sessionId) => {
    setError('')
    setActiveSessionId(sessionId)
    setQueryText('')
    setAttachedFiles([])

    const target = sessions.find((session) => session.sessionId === sessionId)
    if (!target || !Array.isArray(target.messages)) {
      setStatus('loading')
      await hydrateSessionMessages(sessionId)
      setStatus('idle')
    }
  }

  const handleFileAttach = async (files) => {
    setError('')
    const selectedFiles = Array.from(files || [])
    if (!selectedFiles.length) {
      return
    }

    for (const file of selectedFiles) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setError('Only PDF files are supported.')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be 10 MB or less.')
        return
      }
    }

    setAttachedFiles((prev) => [...prev, ...selectedFiles])
  }

  const handleRemoveAttachment = (index) => {
    setAttachedFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index))
  }

  const handleSend = async () => {
    if (status === 'loading') {
      return
    }

    const trimmedText = queryText.trim()
    const hasFiles = attachedFiles.length > 0
    if (!trimmedText && !hasFiles) {
      return
    }

    const sessionId = await getOrCreateSession()
    if (!sessionId) {
      return
    }

    const userMessage = {
      role: 'user',
      text: trimmedText || (hasFiles ? `Attached ${attachedFiles.length} document${attachedFiles.length > 1 ? 's' : ''}` : ''),
    }
    const nextMessages = [...(activeSession?.messages ?? []), userMessage]
    updateSessionMessages(sessionId, nextMessages)
    setStatus('loading')
    setError('')

    try {
      const formData = new FormData()
      const messageText = trimmedText || (hasFiles ? 'Please review the attached document(s).' : '')
      formData.append('message', messageText)
      formData.append('sessionId', sessionId)
      attachedFiles.forEach((file) => {
        formData.append('files', file, file.name)
      })

      const response = await fetch(`${API_BASE}/documents/session/${sessionId}/chat`, {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) {
        throw new Error('Request failed')
      }
      const data = await response.json()
      const assistantMessage = { role: 'assistant', text: data.answer || 'No answer received' }
      updateSessionMessages(sessionId, [...nextMessages, assistantMessage])
      setQueryText('')
      setAttachedFiles([])
    } catch (err) {
      setError(err.message || 'Request failed')
    } finally {
      setStatus('idle')
    }
  }

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
        attachedFiles={attachedFiles}
        onQueryChange={setQueryText}
        onSend={handleSend}
        onFileAttach={handleFileAttach}
        onRemoveAttachment={handleRemoveAttachment}
      />
    </div>
  )
}

export default App