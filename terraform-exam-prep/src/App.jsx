import { useState, useEffect } from 'react'
import { MODULES, ALL_TOPICS } from './data/curriculum.js'
import Sidebar from './components/Sidebar.jsx'
import ContentView from './components/ContentView.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'

const PROGRESS_KEY = 'tf-exam-progress'
const THEME_KEY = 'tf-theme'
const CURRENT_TOPIC_KEY = 'tf-current-topic'
const SCROLL_POSITIONS_KEY = 'tf-scroll-positions'
const HIGHLIGHTS_KEY = 'tf-highlights-v1'

function getInitialTheme() {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved) return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getInitialProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    if (raw) return new Set(JSON.parse(raw))
  } catch {}
  return new Set()
}

function getInitialTopicSlug() {
  const fallback = ALL_TOPICS[0].slug
  try {
    const raw = localStorage.getItem(CURRENT_TOPIC_KEY)
    if (!raw) return fallback
    const exists = ALL_TOPICS.some(t => t.slug === raw)
    return exists ? raw : fallback
  } catch {
    return fallback
  }
}

function getInitialScrollPositions() {
  try {
    const raw = localStorage.getItem(SCROLL_POSITIONS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function getInitialHighlights() {
  try {
    const raw = localStorage.getItem(HIGHLIGHTS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed
  } catch {
    return {}
  }
}

export default function App() {
  const [currentSlug, setCurrentSlug] = useState(() => getInitialTopicSlug())
  const [completedTopics, setCompletedTopics] = useState(() => getInitialProgress())
  const [theme, setTheme] = useState(() => getInitialTheme())
  const [scrollPositions, setScrollPositions] = useState(() => getInitialScrollPositions())
  const [highlightsBySlug, setHighlightsBySlug] = useState(() => getInitialHighlights())
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify([...completedTopics]))
  }, [completedTopics])

  useEffect(() => {
    localStorage.setItem(CURRENT_TOPIC_KEY, currentSlug)
  }, [currentSlug])

  useEffect(() => {
    localStorage.setItem(SCROLL_POSITIONS_KEY, JSON.stringify(scrollPositions))
  }, [scrollPositions])

  useEffect(() => {
    localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(highlightsBySlug))
  }, [highlightsBySlug])

  const handleNavigate = (slug) => {
    setCurrentSlug(slug)
    setSidebarOpen(false)
  }

  const handleScrollPositionChange = (slug, scrollTop) => {
    setScrollPositions(prev => {
      if (prev[slug] === scrollTop) return prev
      return { ...prev, [slug]: scrollTop }
    })
  }

  const handleToggleComplete = (slug) => {
    setCompletedTopics(prev => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  const handleCreateHighlight = (slug, highlight) => {
    setHighlightsBySlug(prev => {
      const existing = Array.isArray(prev[slug]) ? prev[slug] : []
      const next = [...existing, highlight]
      return { ...prev, [slug]: next }
    })
  }

  const handleRemoveHighlight = (slug, id) => {
    setHighlightsBySlug(prev => {
      const existing = Array.isArray(prev[slug]) ? prev[slug] : []
      const next = existing.filter(h => h.id !== id)
      return { ...prev, [slug]: next }
    })
  }

  const handleToggleTheme = () => {
    setTheme(t => t === 'light' ? 'dark' : 'light')
  }

  const currentTopic = ALL_TOPICS.find(t => t.slug === currentSlug) ?? ALL_TOPICS[0]

  return (
    <div className="app-layout">
      <header className="app-header">
        <button
          className="hamburger"
          onClick={() => setSidebarOpen(o => !o)}
          aria-label="Toggle navigation"
        >
          <span />
          <span />
          <span />
        </button>
        <span className="app-title">Terraform Associate 004</span>
        <ThemeToggle theme={theme} onToggle={handleToggleTheme} />
      </header>

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <div className={`app-body${sidebarOpen ? ' sidebar-open' : ''}`}>
        <Sidebar
          modules={MODULES}
          currentSlug={currentSlug}
          completedTopics={completedTopics}
          onNavigate={handleNavigate}
          onToggleComplete={handleToggleComplete}
          totalCount={ALL_TOPICS.length}
        />
        <main className="content-area">
          <ContentView
            topic={currentTopic}
            completedTopics={completedTopics}
            onNavigate={handleNavigate}
            onToggleComplete={handleToggleComplete}
            allTopics={ALL_TOPICS}
            scrollPositions={scrollPositions}
            onScrollPositionChange={handleScrollPositionChange}
            highlights={highlightsBySlug[currentSlug] ?? []}
            onCreateHighlight={handleCreateHighlight}
            onRemoveHighlight={handleRemoveHighlight}
          />
        </main>
      </div>
    </div>
  )
}
