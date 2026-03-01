import { useState, useEffect } from 'react'
import { MODULES, ALL_TOPICS } from './data/curriculum.js'
import Sidebar from './components/Sidebar.jsx'
import ContentView from './components/ContentView.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'

const PROGRESS_KEY = 'tf-exam-progress'
const THEME_KEY = 'tf-theme'

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

export default function App() {
  const [currentSlug, setCurrentSlug] = useState(ALL_TOPICS[0].slug)
  const [completedTopics, setCompletedTopics] = useState(() => getInitialProgress())
  const [theme, setTheme] = useState(() => getInitialTheme())
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify([...completedTopics]))
  }, [completedTopics])

  const handleNavigate = (slug) => {
    setCurrentSlug(slug)
    setSidebarOpen(false)
  }

  const handleToggleComplete = (slug) => {
    setCompletedTopics(prev => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
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
          />
        </main>
      </div>
    </div>
  )
}
