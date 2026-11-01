import { useEffect, useRef, useState } from 'react'
import {
  ChevronRight,
  ExternalLink,
  HelpCircle,
  MessageSquare,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  User,
  X
} from 'lucide-react'
import { API_BASE, useAuth } from '../context/AuthContext'

function renderMarkdown(content) {
  if (!content) return null

  // Split lines
  const lines = content.split('\n')
  const elements = []

  let inList = false
  let listItems = []

  function flushList() {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="chat-markdown-list">
          {listItems.map((item, idx) => (
            <li key={idx}>{parseInline(item)}</li>
          ))}
        </ul>
      )
      listItems = []
      inList = false
    }
  }

  function parseInline(text) {
    if (!text) return ''

    // Match bold [**text**], inline code [`code`], links [[text](url)]
    const tokens = []
    let remaining = text

    // Regex to capture bold, inline code, and markdown links
    const pattern = /(\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g
    let match
    let lastIndex = 0

    while ((match = pattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        tokens.push(text.substring(lastIndex, match.index))
      }

      if (match[2]) {
        // Bold
        tokens.push(<strong key={match.index}>{match[2]}</strong>)
      } else if (match[3]) {
        // Inline code
        tokens.push(<code key={match.index} className="inline-code">{match[3]}</code>)
      } else if (match[4] && match[5]) {
        // Link
        tokens.push(
          <a
            key={match.index}
            href={match[5]}
            target="_blank"
            rel="noopener noreferrer"
            className="chat-link"
          >
            {match[4]} <ExternalLink size={12} className="inline-icon" />
          </a>
        )
      }
      lastIndex = pattern.lastIndex
    }

    if (lastIndex < text.length) {
      tokens.push(text.substring(lastIndex))
    }

    return tokens.length > 0 ? tokens : text
  }

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim()

    if (!trimmed) {
      flushList()
      return
    }

    // Headers
    if (trimmed.startsWith('#### ')) {
      flushList()
      elements.push(
        <h4 key={lineIdx} className="chat-heading-4">
          {parseInline(trimmed.replace('#### ', ''))}
        </h4>
      )
      return
    }
    if (trimmed.startsWith('### ')) {
      flushList()
      elements.push(
        <h3 key={lineIdx} className="chat-heading-3">
          {parseInline(trimmed.replace('### ', ''))}
        </h3>
      )
      return
    }

    // Blockquote / Tip
    if (trimmed.startsWith('> ')) {
      flushList()
      elements.push(
        <div key={lineIdx} className="chat-blockquote">
          {parseInline(trimmed.replace('> ', ''))}
        </div>
      )
      return
    }

    // Horizontal Rule / Divider
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      flushList()
      elements.push(<hr key={lineIdx} className="chat-divider" />)
      return
    }

    // List items (-, *, •)
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
      inList = true
      listItems.push(trimmed.replace(/^[-*•]\s+/, ''))
      return
    }

    flushList()
    elements.push(
      <p key={lineIdx} className="chat-p">
        {parseInline(trimmed)}
      </p>
    )
  })

  flushList()
  return elements
}

const DEFAULT_QUESTIONS = [
  'Am I eligible for any scholarships?',
  'What documents do I need for MahaDBT OBC?',
  'Which scholarships offer the highest award amount?',
  'What are the upcoming deadlines?',
  'Can General / Open category apply for EBC?'
]

export default function AIChatbot({
  studentProfile,
  onTrackScheme,
  trackedScholarshipIds = new Set(),
  isFloating = false,
  onClose
}) {
  const { authFetch } = useAuth()
  const [messages, setMessages] = useState(() => {
    return [
      {
        id: 'initial',
        role: 'assistant',
        content:
          "👋 Hello! I am your **AI Scholarship Assistant**.\n\n" +
          "I can help you discover matching government schemes, verify your eligibility rules, review required documents, and track deadlines.\n\n" +
          "How can I help you today?",
        suggested_questions: DEFAULT_QUESTIONS,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]
  })
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSend(textToSend = null) {
    const text = (textToSend !== null ? textToSend : inputValue).trim()
    if (!text || loading) return

    setError('')
    const userMsg = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMsg])
    if (textToSend === null) {
      setInputValue('')
    }
    setLoading(true)

    try {
      // Build lightweight conversation history for backend context
      const historyPayload = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.content
      }))

      const res = await authFetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          student: studentProfile || undefined
        })
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || 'Failed to get response from AI Assistant')
      }

      const data = await res.json()
      const botMsg = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        matched_schemes: data.matched_schemes || [],
        suggested_questions: data.suggested_questions || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }

      setMessages(prev => [...prev, botMsg])
    } catch (err) {
      setError(err.message || 'Unable to connect to AI assistant.')
      const fallbackMsg = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Connection Issue:** ${err.message || 'The AI assistant is momentarily unreachable. Please check backend service status.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, fallbackMsg])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleClearChat() {
    setMessages([
      {
        id: 'initial',
        role: 'assistant',
        content:
          "Conversation cleared. What scholarship questions would you like to explore next?",
        suggested_questions: DEFAULT_QUESTIONS,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ])
    setError('')
  }

  return (
    <div className={`ai-chat-container ${isFloating ? 'floating-chat' : 'embedded-chat'}`}>
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-header-title">
          <div className="chat-bot-avatar">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="chat-title-row">
              <h3>AI Scholarship Assistant</h3>
              <span className="chat-status-dot" title="Active AI Service" />
            </div>
            <p className="chat-subtitle">
              {studentProfile ? (
                <span>
                  Synced: <strong>{studentProfile.category}</strong> • {studentProfile.state}
                </span>
              ) : (
                'Instant eligibility & guidance expert'
              )}
            </p>
          </div>
        </div>

        <div className="chat-header-actions">
          <button
            type="button"
            className="chat-action-btn"
            onClick={handleClearChat}
            title="Clear Chat History"
          >
            <Trash2 size={16} />
          </button>
          {isFloating && onClose && (
            <button
              type="button"
              className="chat-action-btn close-btn"
              onClick={onClose}
              title="Close Chat"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Profile Sync Notice Badge */}
      {studentProfile && (
        <div className="chat-profile-badge">
          <Sparkles size={13} />
          <span>
            Profile active: <strong>{studentProfile.category}</strong> | Income: ₹
            {Number(studentProfile.annual_income || 0).toLocaleString()} | Marks:{' '}
            {studentProfile.marks_percentage}%
          </span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="chat-messages-area">
        {messages.map(msg => (
          <div key={msg.id} className={`chat-message-row ${msg.role}`}>
            <div className="chat-avatar">
              {msg.role === 'assistant' ? <Sparkles size={16} /> : <User size={16} />}
            </div>

            <div className="chat-message-content-wrapper">
              <div className="chat-bubble">
                <div className="chat-rendered-body">{renderMarkdown(msg.content)}</div>
              </div>

              {/* Suggested Follow-up Questions */}
              {msg.suggested_questions && msg.suggested_questions.length > 0 && (
                <div className="chat-quick-suggestions">
                  {msg.suggested_questions.map((q, qIdx) => (
                    <button
                      key={qIdx}
                      type="button"
                      className="suggestion-pill"
                      onClick={() => handleSend(q)}
                      disabled={loading}
                    >
                      <ChevronRight size={13} /> {q}
                    </button>
                  ))}
                </div>
              )}

              <span className="chat-timestamp">{msg.timestamp}</span>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <div className="chat-message-row assistant">
            <div className="chat-avatar">
              <Sparkles size={16} />
            </div>
            <div className="chat-message-content-wrapper">
              <div className="chat-bubble loading-bubble">
                <span className="chat-dot dot-1" />
                <span className="chat-dot dot-2" />
                <span className="chat-dot dot-3" />
                <span className="chat-loading-label">Analyzing scholarship rules...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="chat-text-input"
            placeholder="Ask about scholarships, eligibility, documents, or deadlines..."
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            type="button"
            className="chat-send-btn"
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || loading}
            title="Send Message"
          >
            <Send size={16} />
          </button>
        </div>
        <div className="chat-disclaimer">
          AI provides guidance based on verified official criteria. Always check final notices on MahaDBT / NSP.
        </div>
      </div>
    </div>
  )
}
