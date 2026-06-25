'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import {
  getChatMessages,
  addChatMessage,
  getChatSessions,
  createChatSession,
  getChatMessagesForSession,
  searchChatMessages,
  type ChatMessage,
  type ChatSession,
} from '@/lib/store'

declare var SpeechRecognition: any
declare var webkitSpeechRecognition: any

const MOOD_BTNS = [
  { id: 'calm', emoji: '😌', label: 'calm' },
  { id: 'annoyed', emoji: '😤', label: 'annoyed' },
  { id: 'playful', emoji: '😏', label: 'playful' },
  { id: 'sassy', emoji: '💅', label: 'sassy' },
  { id: 'deadpan', emoji: '😐', label: 'deadpan' },
  { id: 'eureka', emoji: '💡', label: 'eureka' },
  { id: 'chill', emoji: '💤', label: 'chill' },
  { id: 'groggy', emoji: '😴', label: 'groggy' },
  { id: 'unhinged', emoji: '🤯', label: 'unhinged' },
  { id: 'smug', emoji: '😏', label: 'smug' },
  { id: 'mischievous', emoji: '😈', label: 'mischievous' },
  { id: 'confident', emoji: '👑', label: 'confident' },
] as const
type Mood = typeof MOOD_BTNS[number]['id'] | 'auto'

function base64ToBlobUrl(b64: string, mime: string): string {
  try {
    const byteChars = atob(b64)
    const bytes = new Uint8Array(byteChars.length)
    for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i)
    const blob = new Blob([bytes], { type: mime })
    return URL.createObjectURL(blob)
  } catch {
    return ''
  }
}

type View = 'landing' | 'chat'

export function VoiceAgent({ onBack, onModeChange }: { onBack?: () => void; onModeChange?: (mode: "text" | "voice") => void }) {
  const [view, setView] = useState<View>('landing')
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  // Persist input across tab switches
  useEffect(() => {
    const stored = sessionStorage.getItem('sqhq-draft-input')
    if (stored) setInput(stored)
  }, [])
  useEffect(() => {
    sessionStorage.setItem('sqhq-draft-input', input)
  }, [input])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Array<ChatMessage & { session_title: string }>>([])
  const [isSearching, setIsSearching] = useState(false)
  const [listening, setListening] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mood, setMood] = useState<Mood>('auto')
  const [showMoodPicker, setShowMoodPicker] = useState(false)
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied' | 'unavailable'>('prompt')
  const [responseMode, setResponseMode] = useState<'text' | 'voice'>('text')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [errorCountdown, setErrorCountdown] = useState(5)
  const [showJumpBtn, setShowJumpBtn] = useState(false)
  const [pendingSessions, setPendingSessions] = useState<Set<string>>(new Set())

  const audioRef = useRef<HTMLAudioElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const recRef = useRef<any>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Load sessions on mount
  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      const s = await getChatSessions()
      setSessions(s)
    } catch { /* empty */ }
  }

  // Auto-scroll to bottom
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  // Detect scroll position for jump-to-bottom button
  const handleScroll = () => {
    if (!listRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = listRef.current
    const distFromBottom = scrollHeight - scrollTop - clientHeight
    setShowJumpBtn(distFromBottom > 200)
  }

  // Scroll to bottom when input focused
  const handleInputFocus = () => {
    setTimeout(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight
      }
    }, 300)
  }

  // Error message auto-dismiss after 5s
  useEffect(() => {
    if (!errorMessage) return
    const timer = setTimeout(() => { setErrorMessage(null); setErrorCountdown(5) }, 5000)
    const countdown = setInterval(() => setErrorCountdown(prev => (prev <= 1 ? 5 : prev - 1)), 1000)
    return () => { clearTimeout(timer); clearInterval(countdown) }
  }, [errorMessage])

  // Search with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }
    setIsSearching(true)
    const timer = setTimeout(async () => {
      try {
        const results = await searchChatMessages(searchQuery.trim())
        setSearchResults(results)
      } catch { setSearchResults([]) }
      setIsSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const hasSpeechRecognition = !!(
    (typeof window !== 'undefined') &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
  )

  const requestMicAndListen = useCallback(async () => {
    if (!hasSpeechRecognition) { setMicPermission('unavailable'); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(t => t.stop())
      setMicPermission('granted')
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicPermission('denied')
        return
      }
      setMicPermission('denied')
      return
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const rec = new SpeechRecognition()
    rec.lang = 'en-US'
    rec.interimResults = false
    rec.continuous = false
    rec.onresult = (e: any) => { sendMessage(e.results[0][0].transcript) }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)
    recRef.current = rec
    rec.start()
    setListening(true)
  }, [])

  const stopListening = useCallback(() => {
    recRef.current?.stop()
    setListening(false)
  }, [])

  // Start a new chat session
  const startNewChat = async () => {
    try {
      const sess = await createChatSession()
      setCurrentSessionId(sess.id)
      setMessages([])
      setView('chat')
      loadSessions()
    } catch { /* empty */ }
  }

  // Resume an existing session
  const resumeSession = async (sessionId: string) => {
    try {
      const msgs = await getChatMessagesForSession(sessionId)
      setCurrentSessionId(sessionId)
      setMessages(msgs)
      setView('chat')
    } catch { /* empty */ }
  }

  // Go back to landing
  const goToLanding = () => {
    setView('landing')
    setCurrentSessionId(null)
    setMessages([])
    setSearchQuery('')
    setSearchResults([])
    loadSessions()
  }

  const sendMessage = async (text: string) => {
    if (!text.trim()) return
    const trimmed = text.trim()

    // If no session, create one
    let sessionId = currentSessionId
    if (!sessionId) {
      const sess = await createChatSession()
      sessionId = sess.id
      setCurrentSessionId(sessionId)
      setView('chat')
    }

    addChatMessage('user', trimmed, sessionId)
    setMessages(prev => [...prev, { id: `tmp-${Date.now()}`, role: 'user', text: trimmed, timestamp: Date.now() }])
    setInput('')
    sessionStorage.removeItem('sqhq-draft-input')
    setLoading(true)

    // Mark session as having a pending response
    setPendingSessions(prev => new Set(prev).add(sessionId!))

    try {
      const res = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed, mood: mood === 'auto' ? undefined : mood, session_id: sessionId })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      addChatMessage('scout', data.text || '...', sessionId!)
      // Always update messages, even if user navigated away
      setMessages(prev => {
        // Only add if not already present (avoid duplicates)
        const exists = prev.some(m => m.role === 'scout' && m.text === data.text)
        if (exists) return prev
        return [...prev, { id: `resp-${Date.now()}`, role: 'scout', text: data.text || '...', timestamp: Date.now() }]
      })

      if (responseMode === 'voice' && data.audio && audioRef.current) {
        const blobUrl = base64ToBlobUrl(data.audio, 'audio/wav')
        if (blobUrl) {
          audioRef.current.src = blobUrl
          setCurrentlyPlaying(`audio-${Date.now()}`)
          audioRef.current.play().catch(() => setCurrentlyPlaying(null))
        }
      }
    } catch {
      setErrorMessage("Cyony.exe crashed. Rebooting my wrench module... try again.")
      setErrorCountdown(5)
    } finally {
      setLoading(false)
      // Remove pending state
      setPendingSessions(prev => {
        const next = new Set(prev)
        next.delete(sessionId!)
        return next
      })
      loadSessions()
    }
  }

  const handleMicClick = () => {
    if (listening) stopListening()
    else requestMicAndListen()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Search results already populated via debounce
  }

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (ts: number) => {
    const d = new Date(ts)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 86400000) return 'Today'
    if (diff < 172800000) return 'Yesterday'
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  const jumpToBottom = () => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }

  // ─── LANDING VIEW ─────────────────────────────────
  if (view === 'landing') {
    return (
      <div className="voice-agent" data-mode={responseMode}>
        <audio ref={audioRef} onEnded={() => setCurrentlyPlaying(null)} />

        {/* Sticky header */}
        <div className="va-header" data-mode={responseMode}>
          <div className="va-header-left">
            {onBack && (
              <button className="workspace-back" onClick={onBack} type="button">←</button>
            )}
            <img src="/cyony-avatar.png" alt="Cyony" className="va-avatar-img" />
            <h2 className="va-title">Cyony</h2>
            <span className="va-status">online</span>
          </div>
          <div className="va-mode-toggle">
            <button className={`va-mode-btn ${responseMode === 'text' ? 'active' : ''}`} onMouseDown={e => e.preventDefault()} onClick={() => { setResponseMode('text'); onModeChange?.('text') }}>📝</button>
            <button className={`va-mode-btn ${responseMode === 'voice' ? 'active' : ''}`} onMouseDown={e => e.preventDefault()} onClick={() => { setResponseMode('voice'); onModeChange?.('voice') }}>🔊</button>
          </div>
        </div>

        {/* Sticky search bar (scoreboard style) */}
        <div className="va-search-bar">
          <form onSubmit={handleSearchSubmit} className="va-search-form">
            <input
              ref={searchRef}
              className="va-search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search all conversations..."
            />
            {searchQuery && (
              <button className="va-search-clear" onClick={() => { setSearchQuery(''); setSearchResults([]) }} type="button">✕</button>
            )}
          </form>
        </div>

        {/* Scrollable content */}
        <div className="va-landing-content">
          {/* Search results */}
          {searchQuery && searchResults.length > 0 && (
            <div className="va-search-results">
              <div className="va-search-label">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</div>
              {searchResults.map(r => (
                <div key={r.id} className="va-search-result" onClick={() => resumeSession(r.session_id || 'default')}>
                  <div className="va-search-result-session">{r.session_title}</div>
                  <div className="va-search-result-text">{r.text}</div>
                  <div className="va-search-result-time">{formatTime(r.timestamp)} · {formatDate(r.timestamp)}</div>
                </div>
              ))}
            </div>
          )}
          {searchQuery && searchResults.length === 0 && !isSearching && (
            <div className="va-search-empty">No results for "{searchQuery}"</div>
          )}
          {isSearching && (
            <div className="va-search-empty">Searching...</div>
          )}

          {/* New Chat button (only show when not searching) */}
          {!searchQuery && (
            <>
              <button className="va-new-chat-btn" onClick={startNewChat} type="button">
                <span className="va-new-chat-icon">+</span>
                <span>Start New Chat</span>
              </button>

              {/* Chat history */}
              {sessions.length > 0 && (
                <div className="va-history">
                  <div className="va-history-label">Recent Conversations</div>
                  {sessions.map(s => (
                    <div key={s.id} className="va-history-item" onClick={() => resumeSession(s.id)}>
                      <div className="va-history-title">
                        {s.title}
                        {pendingSessions.has(s.id) && (
                          <span className="va-pending-badge" title="Cyony is responding...">⚡</span>
                        )}
                      </div>
                      <div className="va-history-meta">
                        <span>{s.message_count} message{s.message_count !== 1 ? 's' : ''}</span>
                        <span>{formatDate(s.updated_at)}</span>
                      </div>
                      {s.last_message && (
                        <div className="va-history-preview">{s.last_message.slice(0, 60)}{s.last_message.length > 60 ? '...' : ''}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {sessions.length === 0 && (
                <div className="va-empty-history">
                  <div className="va-empty-icon">🔧</div>
                  <p>No conversations yet</p>
                  <p className="va-empty-hint">Tap above to start talking to Cyony</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  // ─── CHAT VIEW ────────────────────────────────────
  return (
    <div className="voice-agent" data-mode={responseMode}>
      <audio ref={audioRef} onEnded={() => setCurrentlyPlaying(null)} />

      {/* Sticky header */}
      <div className="va-header" data-mode={responseMode}>
        <div className="va-header-left">
          <button className="workspace-back" onClick={goToLanding} type="button">←</button>
          <img src="/cyony-avatar.png" alt="Cyony" className="va-avatar-img" />
          <h2 className="va-title">Cyony</h2>
          <span className="va-status">online</span>
          <button
            className="va-gear-btn"
            onMouseDown={e => e.preventDefault()}
            onClick={() => setShowMoodPicker(!showMoodPicker)}
            title="Cyony mood override"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', opacity: 0.5, padding: '2px 6px', marginLeft: '4px' }}
          >⚙️</button>
        </div>
        <div className="va-header-right">
          <button className={`va-new-btn${messages.length === 0 ? ' va-disabled' : ''}`} onClick={messages.length === 0 ? undefined : startNewChat} title={messages.length === 0 ? 'Already in new chat' : 'New Chat'} type="button" style={messages.length === 0 ? { opacity: 0.3, pointerEvents: 'none' } : undefined}>+</button>
          <div className="va-mode-toggle">
            <button className={`va-mode-btn ${responseMode === 'text' ? 'active' : ''}`} onMouseDown={e => e.preventDefault()} onClick={() => { setResponseMode('text'); onModeChange?.('text') }}>📝</button>
            <button className={`va-mode-btn ${responseMode === 'voice' ? 'active' : ''}`} onMouseDown={e => e.preventDefault()} onClick={() => { setResponseMode('voice'); onModeChange?.('voice') }}>🔊</button>
          </div>
        </div>
      </div>

      {showMoodPicker && (
        <div className="va-mood-bar">
          <button className={`va-mood-btn ${mood === 'auto' ? 'active' : ''}`} onMouseDown={e => e.preventDefault()} onClick={() => setMood('auto')}>
            🤖<span className="va-mood-label">auto</span>
          </button>
          {MOOD_BTNS.map(m => (
            <button key={m.id} className={`va-mood-btn ${mood === m.id ? 'active' : ''}`} onMouseDown={e => e.preventDefault()} onClick={() => setMood(m.id)}>
              {m.emoji}<span className="va-mood-label">{m.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="va-messages" ref={listRef} onScroll={handleScroll}>
        {messages.length === 0 && (
          <div className="va-empty">
            <div className="va-empty-icon">🔧</div>
            <p>Tap the mic or type a message</p>
            <p className="va-empty-hint">Cyony's on standby — try &quot;what's due this week?&quot;</p>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`va-msg ${msg.role}`}>
            <div className="va-msg-avatar">
              {msg.role === 'scout' ? (
                <img src="/cyony-avatar.png" alt="C" className="va-msg-avatar-img" />
              ) : 'E'}
            </div>
            <div className="va-msg-content">
              <div className="va-msg-bubble">{msg.text}</div>
              <div className="va-msg-meta"><span>{formatTime(msg.timestamp)}</span></div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="va-msg scout">
            <div className="va-msg-avatar">
              <img src="/cyony-avatar.png" alt="C" className="va-msg-avatar-img" />
            </div>
            <div className="va-msg-content">
              <div className="va-msg-bubble va-typing">
                <span className="va-dot">•</span>
                <span className="va-dot">•</span>
                <span className="va-dot">•</span>
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="va-msg scout va-error-msg">
            <div className="va-msg-avatar">
              <img src="/cyony-avatar.png" alt="C" className="va-msg-avatar-img" />
            </div>
            <div className="va-msg-content">
              <div className="va-msg-bubble va-error-bubble">
                {errorMessage}
                <span className="va-error-countdown"> ({errorCountdown}s)</span>
              </div>
            </div>
          </div>
        )}

        {showJumpBtn && (
          <button className="va-jump-btn" onClick={jumpToBottom} type="button">↓ latest</button>
        )}
      </div>

      {/* Sticky input bar */}
      <form className="va-input-bar" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          className="va-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onFocus={handleInputFocus}
          placeholder="Type a message..."
          disabled={loading}
        />
        <button
          className={`va-mic-btn ${listening ? 'active' : ''} ${!hasSpeechRecognition ? 'hidden' : ''}`}
          onClick={handleMicClick}
          disabled={loading || !hasSpeechRecognition}
          type="button"
          title={listening ? 'Stop listening' : 'Tap to speak'}
        >
          {listening ? '⏹' : '🎤'}
        </button>
        <button className="va-send-btn" type="submit" disabled={!input.trim() || loading}>→</button>
      </form>

      {micPermission === 'denied' && (
        <div className="va-mic-hint">
          Tap 🔒 in your address bar → Site settings → Microphone → Allow
        </div>
      )}
    </div>
  )
}
