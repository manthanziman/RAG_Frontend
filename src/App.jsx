import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import ChatWindow from './components/ChatWindow.jsx'
import './App.css'

const API_BASE = 'http://localhost:4001/api'

function App() {
  const [sessions, setSessions] = useState([])
  const [activeSessionId, setActiveSessionId] = useState('')
  const [queryText, setQueryText] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  const activeSession = sessions.find((session) => session.sessionId === activeSessionId)

  useEffect(() => {
    if (!activeSessionId && sessions.length > 0) {
      setActiveSessionId(sessions[0].sessionId)
    }
  }, [sessions, activeSessionId])

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
      const newSession = { sessionId, messages: [] }
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
    await createSession()
  }

  const handleSelectSession = (sessionId) => {
    setError('')
    setActiveSessionId(sessionId)
    setQueryText('')
  }

  const handleFileAttach = async (file) => {
    setError('')
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be 10 MB or less.')
      return
    }

    const sessionId = await getOrCreateSession()
    if (!sessionId) {
      return
    }

    setStatus('loading')
    const baseUrl = `${API_BASE}/documents/session/${sessionId}/upload`

    const tryUpload = async (fieldName) => {
      const formData = new FormData()
      formData.append(fieldName, file)
      const response = await fetch(baseUrl, {
        method: 'POST',
        body: formData,
      })
      return response
    }

    try {
      let response = await tryUpload('document')
      if (!response.ok) {
        response = await tryUpload('file')
      }

      if (!response.ok) {
        const body = await response.text()
        throw new Error(`Upload failed (${response.status}): ${body || response.statusText}`)
      }

      const nextMessages = [...(activeSession?.messages ?? []), { role: 'system', text: `Uploaded ${file.name}` }]
      updateSessionMessages(sessionId, nextMessages)
    } catch (err) {
      setError(err.message || 'File upload failed')
    } finally {
      setStatus('idle')
    }
  }

  const handleSend = async () => {
    const trimmedText = queryText.trim()
    if (!trimmedText) {
      return
    }

    const sessionId = await getOrCreateSession()
    if (!sessionId) {
      return
    }

    const userMessage = { role: 'user', text: trimmedText }
    const nextMessages = [...(activeSession?.messages ?? []), userMessage]
    updateSessionMessages(sessionId, nextMessages)
    setQueryText('')
    setStatus('loading')
    setError('')

    try {
      const response = await fetch(`${API_BASE}/documents/session/${sessionId}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmedText }),
      })
      if (!response.ok) {
        throw new Error('Query failed')
      }
      const data = await response.json()
      const assistantMessage = { role: 'assistant', text: data.answer || 'No answer received' }
      updateSessionMessages(sessionId, [...nextMessages, assistantMessage])
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
        onQueryChange={setQueryText}
        onSend={handleSend}
        onFileAttach={handleFileAttach}
      />
    </div>
  )
}

export default App
