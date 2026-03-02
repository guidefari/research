import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css'

export default function ContentView({
  topic,
  completedTopics,
  onNavigate,
  onToggleComplete,
  allTopics,
  scrollPositions,
  onScrollPositionChange,
}) {
  const scrollRef = useRef(null)
  const isDone = completedTopics.has(topic.slug)
  const currentIndex = allTopics.findIndex(t => t.slug === topic.slug)
  const prevTopic = currentIndex > 0 ? allTopics[currentIndex - 1] : null
  const nextTopic = currentIndex < allTopics.length - 1 ? allTopics[currentIndex + 1] : null

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollPositions[topic.slug] ?? 0
    }
  }, [topic.slug])

  const components = {
    a: ({ href, children }) => {
      if (href?.match(/^\.\/[\d]+-[\w-]+\.md/)) {
        const slug = href.replace('./', '').replace('.md', '')
        return (
          <button className="md-link" onClick={() => onNavigate(slug)}>
            {children}
          </button>
        )
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      )
    },
  }

  const highlightOptions = {
    // highlight.js doesn't ship native HCL; register HCL/Terraform as aliases of INI.
    aliases: {
      ini: ['hcl', 'terraform', 'tf'],
    },
  }

  return (
    <div
      className="content-view"
      ref={scrollRef}
      onScroll={() => onScrollPositionChange(topic.slug, scrollRef.current?.scrollTop ?? 0)}
    >
      <div className="content-inner">
        <div className="content-toolbar">
          <button
            className={`complete-btn${isDone ? ' complete-btn--done' : ''}`}
            onClick={() => onToggleComplete(topic.slug)}
          >
            {isDone ? (
              <>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                </svg>
                Completed
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <rect x="2" y="2" width="12" height="12" rx="2" />
                </svg>
                Mark complete
              </>
            )}
          </button>
        </div>

        <article className="markdown-body">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[[rehypeHighlight, highlightOptions]]}
            components={components}
          >
            {topic.content}
          </ReactMarkdown>
        </article>

        <nav className="topic-nav" aria-label="Topic navigation">
          {prevTopic ? (
            <button
              className="topic-nav-btn topic-nav-btn--prev"
              onClick={() => onNavigate(prevTopic.slug)}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z" />
              </svg>
              <span>
                <span className="nav-hint">Previous</span>
                <span className="nav-title">{prevTopic.title}</span>
              </span>
            </button>
          ) : <div />}

          {nextTopic ? (
            <button
              className="topic-nav-btn topic-nav-btn--next"
              onClick={() => onNavigate(nextTopic.slug)}
            >
              <span>
                <span className="nav-hint">Next</span>
                <span className="nav-title">{nextTopic.title}</span>
              </span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z" />
              </svg>
            </button>
          ) : <div />}
        </nav>
      </div>
    </div>
  )
}
