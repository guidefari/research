import ProgressBar from './ProgressBar.jsx'

export default function Sidebar({ modules, currentSlug, completedTopics, onNavigate, onToggleComplete, totalCount }) {
  const completedCount = completedTopics.size

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <svg className="tf-icon" width="18" height="18" viewBox="0 0 128 128" fill="currentColor" aria-hidden="true">
            <path d="M77.941 44.5v36.836L46.324 62.918V26.082zm0 55.254 31.617-18.418V44.5L77.941 62.918zM0 26.082l31.617 18.418v36.836L0 62.918zm46.323 73.672 31.618-18.418V44.5L46.323 62.918z" />
          </svg>
          <span>TF Exam 004</span>
        </div>
        <ProgressBar completed={completedCount} total={totalCount} />
      </div>

      <nav className="sidebar-nav" aria-label="Course modules">
        {modules.map(module => {
          const moduleCompleted = module.topics.filter(t => completedTopics.has(t.slug)).length
          return (
            <div key={module.id} className="sidebar-module">
              <div className="sidebar-module-header">
                <span className="sidebar-module-title">{module.title}</span>
                <span className="sidebar-module-count">{moduleCompleted}/{module.topics.length}</span>
              </div>
              <ul className="sidebar-topic-list">
                {module.topics.map(topic => {
                  const isActive = topic.slug === currentSlug
                  const isDone = completedTopics.has(topic.slug)
                  return (
                    <li
                      key={topic.slug}
                      className={[
                        'sidebar-topic',
                        isActive ? 'active' : '',
                        isDone ? 'done' : '',
                      ].filter(Boolean).join(' ')}
                    >
                      <button
                        className="sidebar-check"
                        onClick={() => onToggleComplete(topic.slug)}
                        aria-label={isDone ? `Mark "${topic.title}" incomplete` : `Mark "${topic.title}" complete`}
                        aria-pressed={isDone}
                      >
                        {isDone ? (
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                            <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                            <rect x="2" y="2" width="12" height="12" rx="2" />
                          </svg>
                        )}
                      </button>
                      <button
                        className="sidebar-topic-btn"
                        onClick={() => onNavigate(topic.slug)}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <span className="topic-number">{topic.id}</span>
                        <span className="topic-title">{topic.title}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
