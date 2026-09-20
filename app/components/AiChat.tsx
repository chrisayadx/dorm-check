'use client'

import { useState } from 'react'


type Message = { role: 'user' | 'assistant'; text: string }

export function AiChat({ dormContext }: { dormContext?: string }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'Hey! Tell me what you\'re looking for in a dorm and I\'ll help you find it.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

   async function send() {
    const text = input.trim()
    if (!text || loading) return

    const next: Message[] = [...messages, { role: 'user', text }]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, dormContext }),
      })
      const data = await res.json()
      setMessages([...next, { role: 'assistant', text: data.text }])
    } catch {
      setMessages([
        ...next,
        { role: 'assistant', text: 'Something went wrong. Try again in a moment.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          position: 'fixed',
          bottom: 28,
          right: 28,
          width: 56,
          height: 56,
          borderRadius: 999,
          background: 'linear-gradient(180deg, var(--blue-600), var(--blue-800))',
          boxShadow: 'var(--e-brand)',
          border: 0,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          color: '#fff',
          fontSize: 22,
        }}
        aria-label="Open AI assistant"
      >
        {open ? '✕' : '✦'}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: 96,
            right: 28,
            width: 360,
            maxHeight: 500,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--white)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)',
            boxShadow: 'var(--e-3)',
            zIndex: 1000,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 18 }}>✦</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>DormCheck AI</div>
              <div className="t-meta">Powered by Gemini</div>
            </div>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                  padding: '9px 13px',
                  borderRadius:
                    m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background:
                    m.role === 'user'
                      ? 'linear-gradient(180deg, var(--blue-600), var(--blue-800))'
                      : 'var(--canvas)',
                  color: m.role === 'user' ? '#fff' : 'var(--ink-900)',
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  padding: '9px 13px',
                  borderRadius: '14px 14px 14px 4px',
                  background: 'var(--canvas)',
                  fontSize: 14,
                  color: 'var(--ink-400)',
                }}
              >
                Thinking…
              </div>
            )}
          </div>

          {/* Input */}
          <div
            style={{
              padding: '10px 12px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: 8,
            }}
          >
            <input
              className="input"
              placeholder="Ask about dorms…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              style={{ fontSize: 14, padding: '9px 14px' }}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={send}
              disabled={loading}
              style={{ padding: '9px 16px', fontSize: 14 }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  )
}