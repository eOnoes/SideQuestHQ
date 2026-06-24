'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { getChatMessages, addChatMessage, type ChatMessage } from '@/lib/store'
import { playRandomScoutQuip } from '@/lib/scout-audio'

// Web Speech API types (not in default TS lib)
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

export function VoiceAgent({ onBack, onModeChange }: { onBack?: () => void; onModeChange?: (mode: "text" | "voice") => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [listening, setListening] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mood, setMood] = useState<Mood>('auto')
  const [showMoodPicker, setShowMoodPicker] = useState(false)
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied' | 'unavailable'>('prompt')
  const [responseMode, setResponseMode] = useState<'text' | 'voice'>('text')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [errorCountdown, setErrorCountdown] = useState(5)

  const audioRef = useRef<HTMLAudioElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const recRef = useRef<any>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load shared chat history on mount — reads from the same store as ScoutPanel
  useEffect(() => {
    setMessages(getChatMessages())
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  // Scroll to bottom when input focused (keyboard opening on mobile)
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

    const timer = setTimeout(() => {
      setErrorMessage(null)
      setErrorCountdown(5)
    }, 5000)

    // Countdown display
    const countdown = setInterval(() => {
      setErrorCountdown((prev) => (prev <= 1 ? 5 : prev - 1))
    }, 1000)

    return () => {
      clearTimeout(timer)
      clearInterval(countdown)
    }
  }, [errorMessage])

  // Check if speech recognition is available
  const hasSpeechRecognition = !!(
    (typeof window !== 'undefined') &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
  )

  // Request mic permission first, then start speech recognition
  const requestMicAndListen = useCallback(async () => {
    if (!hasSpeechRecognition) {
      setMicPermission('unavailable')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(t => t.stop())
      setMicPermission('granted')
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicPermission('denied')
        addChatMessage('scout', "Can't hear you with the mic blocked, darlin'. Tap the padlock in your URL bar and allow microphone access. Or just type — I read fast.")
        setMessages(getChatMessages())
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

    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript
      sendMessage(transcript)
    }

    rec.onerror = () => {
      setListening(false)
    }

    rec.onend = () => setListening(false)

    recRef.current = rec
    rec.start()
    setListening(true)
  }, [])

  const stopListening = useCallback(() => {
    recRef.current?.stop()
    setListening(false)
  }, [])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return

    const trimmed = text.trim()

    // Save user message to shared store
    addChatMessage('user', trimmed)
    setMessages(getChatMessages())
    setInput('')
    setLoading(true)

    // Play filler audio instantly ("Interesting...", "Give me a second...")
    // Fills dead space while MiMo brain + TTS generates the real response
    playRandomScoutQuip('af', 6, audioRef)

    try {
      const res = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed, mood: mood === 'auto' ? undefined : mood })
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()

      // Save scout response to shared store
      addChatMessage('scout', data.text || '...')
      setMessages(getChatMessages())

      // Auto-play audio in voice mode
      if (responseMode === 'voice' && data.audio && audioRef.current) {
        const blobUrl = base64ToBlobUrl(data.audio, 'audio/wav')
        if (blobUrl) {
          audioRef.current.src = blobUrl
          setCurrentlyPlaying(`audio-${Date.now()}`)
          audioRef.current.play().catch(() => {
            setCurrentlyPlaying(null)
          })
        }
      }
    } catch (err) {
      setErrorMessage("Scout.exe crashed. Rebooting my sass module... try again.")
      setErrorCountdown(5)
    } finally {
      setLoading(false)
    }
  }

  const playAudio = (msg: ChatMessage) => {
    // Can't play audio from store messages since we only store text
    // For now re-send via voice mode if they want audio
    sendMessage(msg.text)
  }

  const handleMicClick = () => {
    if (listening) {
      stopListening()
    } else {
      requestMicAndListen()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="voice-agent" data-mode={responseMode}>
      <audio ref={audioRef} onEnded={() => setCurrentlyPlaying(null)} />

      <div className="va-header" data-mode={responseMode}>
        <div className="va-header-left">
          {onBack && (
            <button className="va-back-btn" onClick={onBack} title="Back to feed">←</button>
          )}
          <h2 className="va-title">Chloe</h2>
          <span className="va-status">online</span>
          <button
            className="va-gear-btn"
            onClick={() => setShowMoodPicker(!showMoodPicker)}
            title="Scout mood override"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '14px', opacity: 0.5, padding: '2px 6px',
              marginLeft: '4px',
            }}
          >⚙️</button>
        </div>
        {/* Seamless text/voice toggle — changes mode mid-conversation */}
        <div className="va-mode-toggle">
          <button
            className={`va-mode-btn ${responseMode === 'text' ? 'active' : ''}`}
            onClick={() => { setResponseMode('text'); onModeChange?.('text'); }}
            title="Text responses only"
          >📝</button>
          <button
            className={`va-mode-btn ${responseMode === 'voice' ? 'active' : ''}`}
            onClick={() => { setResponseMode('voice'); onModeChange?.('voice'); }}
            title="Voice responses with Chloe's voice"
          >🔊</button>
        </div>
      </div>

      {showMoodPicker && (
      <div className="va-mood-bar">
        <button
          className={`va-mood-btn ${mood === 'auto' ? 'active' : ''}`}
          onClick={() => setMood('auto')}
        >
          🤖
          <span className="va-mood-label">auto</span>
        </button>
        {MOOD_BTNS.map(m => (
          <button
            key={m.id}
            className={`va-mood-btn ${mood === m.id ? 'active' : ''}`}
            onClick={() => setMood(m.id)}
          >
            {m.emoji}
            <span className="va-mood-label">{m.label}</span>
          </button>
        ))}
      </div>
      )}

      <div className="va-messages" ref={listRef}>
        {messages.length === 0 && (
          <div className="va-empty">
            <div className="va-empty-icon">🎙️</div>
            <p>Tap the mic or type a message</p>
            <p className="va-empty-hint">Chloe's listening — try &quot;how's the system?&quot;</p>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`va-msg ${msg.role}`}>
            <div className="va-msg-avatar">
              {msg.role === 'scout' ? 'C' : 'E'}
            </div>
            <div className="va-msg-content">
              <div className="va-msg-bubble">
                {msg.text}
              </div>
              <div className="va-msg-meta">
                <span>{formatTime(msg.timestamp)}</span>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="va-msg scout">
            <div className="va-msg-avatar">C</div>
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
            <div className="va-msg-avatar">C</div>
            <div className="va-msg-content">
              <div className="va-msg-bubble va-error-bubble">
                {errorMessage}
                <span className="va-error-countdown"> ({errorCountdown}s)</span>
              </div>
            </div>
          </div>
        )}
      </div>

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
        <button
          className="va-send-btn"
          type="submit"
          disabled={!input.trim() || loading}
        >
          →
        </button>
      </form>

      {micPermission === 'denied' && (
        <div className="va-mic-hint">
          Tap 🔒 in your address bar → Site settings → Microphone → Allow
        </div>
      )}
    </div>
  )
}
