import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import ChatWindow from './components/ChatWindow.jsx'
import './App.css'

const API_BASE = 'http://localhost:4001/api'

function App() {
  const [sessions, setSessions] = useState([])
  const [activeSessionId, setActiveSessionId] = useState('')
  const [queryText, setQueryText] = useState('')
  const [attachedFiles, setAttachedFiles] = useState([])
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
    setAttachedFiles([])
    await createSession()
  }

  const handleSelectSession = (sessionId) => {
    setError('')
    setActiveSessionId(sessionId)
    setQueryText('')
    setAttachedFiles([])
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