import { useEffect, useRef, useState } from 'react'

type Message = { role: 'user' | 'assistant'; content: string }

type Progress = { percentage: number; downloaded: number; total: number }

const starterPrompts = [
  'Explain electrolysis in simple terms.',
  'Quiz me on Class 12 electrochemistry.',
  'Give me a 5-minute revision plan for ray optics.'
]

function App(): React.JSX.Element {
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const removeProgressListener = window.qvacAPI.onModelProgress(setProgress)
    const removeStreamListener = window.qvacAPI.onCompletionStream((token) => {
      if (token === '') {
        setProcessing(false)
        return
      }
      setMessages(prev => {
        const updated = [...prev]
        const last = updated.length - 1
        if (last >= 0 && updated[last].role === 'assistant') {
          updated[last] = { ...updated[last], content: updated[last].content + token }
        }
        return updated
      })
    })

    window.qvacAPI.loadModel()
      .then(() => setLoading(false))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err))
        setLoading(false)
      })

    const progressListener = (event: Event) => {
      void event
    }
    window.addEventListener('qvac-progress', progressListener)

    return () => {
      removeProgressListener()
      removeStreamListener()
      window.removeEventListener('qvac-progress', progressListener)
      void window.qvacAPI.unloadModel()
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = (value = input): void => {
    const trimmed = value.trim()
    if (!trimmed || processing || loading || error) return

    const history: Message[] = [...messages, { role: 'user', content: trimmed }]
    setMessages([...history, { role: 'assistant', content: '' }])
    setInput('')
    setProcessing(true)

    window.qvacAPI.infer([
      {
        role: 'system',
        content: 'You are LocalStudy, a concise and accurate study assistant. Explain concepts clearly, show useful steps, and quiz the student when asked.'
      },
      ...history
    ]).catch((err: unknown) => {
      setProcessing(false)
      setMessages(prev => {
        const copy = [...prev]
        const last = copy.length - 1
        if (last >= 0) copy[last] = { role: 'assistant', content: `QVAC error: ${err instanceof Error ? err.message : String(err)}` }
        return copy
      })
    })
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">LS</div>
          <div>
            <div className="brand-name">LocalStudy</div>
            <div className="brand-subtitle">Private AI for your desk</div>
          </div>
        </div>
        <div className="status">
          <span className={`status-dot ${loading ? 'loading' : error ? 'error' : 'ready'}`} />
          {loading ? 'Loading local model' : error ? 'Model error' : processing ? 'Thinking locally' : 'On-device & ready'}
        </div>
      </header>

      <main className="chat-area">
        {loading && (
          <section className="welcome-card">
            <div className="spinner" />
            <h1>Preparing your local AI</h1>
            <p>The model is downloaded once, then inference runs on this machine.</p>
            {progress && <div className="progress-track"><div className="progress-fill" style={{ width: `${progress.percentage}%` }} /></div>}
            {progress && <span className="progress-label">{progress.percentage.toFixed(0)}%</span>}
          </section>
        )}

        {!loading && messages.length === 0 && !error && (
          <section className="empty-state">
            <div className="hero-icon">✦</div>
            <h1>Study without sending your notes anywhere.</h1>
            <p>Ask questions, get explanations, or quiz yourself. LocalStudy uses QVAC to run the language model directly on your computer.</p>
            <div className="prompt-grid">
              {starterPrompts.map(prompt => <button key={prompt} onClick={() => send(prompt)}>{prompt}</button>)}
            </div>
          </section>
        )}

        {error && <section className="error-card"><strong>QVAC could not load the model.</strong><span>{error}</span><small>Check that you are using Node.js 22.17+ and a supported machine, then restart the app.</small></section>}

        <div className="messages">
          {messages.map((msg, i) => (
            <div key={i} className={`message-row ${msg.role}`}>
              <div className="avatar">{msg.role === 'user' ? 'You' : 'AI'}</div>
              <div className="message-content">
                <div className="message-role">{msg.role === 'user' ? 'You' : 'LocalStudy · QVAC'}</div>
                <div className="message-text">{msg.content || <span className="typing"><i/><i/><i/></span>}</div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </main>

      <footer className="composer-wrap">
        <div className="privacy-note"><span>●</span> Inference stays on this device · No API key · No cloud AI</div>
        <div className="composer">
          <textarea
            value={input}
            disabled={loading || !!error || processing}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Ask LocalStudy anything…"
            rows={1}
          />
          <button className="send" disabled={loading || !!error || processing || !input.trim()} onClick={() => send()}>↑</button>
        </div>
        <div className="hint">Enter to send · Shift + Enter for a new line</div>
      </footer>
    </div>
  )
}

export default App
