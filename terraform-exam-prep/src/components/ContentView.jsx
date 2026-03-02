import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css'

const CONTEXT_WINDOW = 40
const ALLOWED_BLOCKS = new Set(['P', 'LI', 'BLOCKQUOTE', 'PRE', 'CODE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'TD', 'TH'])
const HIGHLIGHT_LAYER = 'user-note-highlight'

function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `hl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function pointToOffset(root, container, offset) {
  const range = document.createRange()
  range.selectNodeContents(root)
  range.setEnd(container, offset)
  return range.cloneContents().textContent?.length ?? 0
}

function offsetFromViewportPoint(root, x, y) {
  if (typeof document.caretPositionFromPoint === 'function') {
    const pos = document.caretPositionFromPoint(x, y)
    if (pos?.offsetNode && root.contains(pos.offsetNode)) {
      return pointToOffset(root, pos.offsetNode, pos.offset)
    }
  }

  if (typeof document.caretRangeFromPoint === 'function') {
    const range = document.caretRangeFromPoint(x, y)
    if (range?.startContainer && root.contains(range.startContainer)) {
      return pointToOffset(root, range.startContainer, range.startOffset)
    }
  }

  return null
}

function getBlockAncestor(node, root) {
  let current = node?.nodeType === Node.TEXT_NODE ? node.parentElement : node
  while (current && current !== root) {
    if (ALLOWED_BLOCKS.has(current.tagName)) return current
    current = current.parentElement
  }
  return null
}

function isRangeInsideRoot(range, root) {
  return root.contains(range.startContainer) && root.contains(range.endContainer)
}

function offsetsToRange(root, start, end) {
  if (end <= start) return null

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let node = walker.nextNode()
  let total = 0
  let startNode = null
  let endNode = null
  let startOffset = 0
  let endOffset = 0

  while (node) {
    const len = node.nodeValue?.length ?? 0
    const nextTotal = total + len

    if (!startNode && start <= nextTotal) {
      startNode = node
      startOffset = Math.max(0, start - total)
    }
    if (!endNode && end <= nextTotal) {
      endNode = node
      endOffset = Math.max(0, end - total)
      break
    }

    total = nextTotal
    node = walker.nextNode()
  }

  if (!startNode || !endNode) return null

  const range = document.createRange()
  range.setStart(startNode, startOffset)
  range.setEnd(endNode, endOffset)
  return range
}

function unwrapHighlightMarks(root) {
  const marks = root.querySelectorAll('mark[data-highlight-id]')
  marks.forEach(mark => {
    const parent = mark.parentNode
    if (!parent) return
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark)
    parent.removeChild(mark)
  })
}

function supportsCustomHighlights() {
  return (
    typeof CSS !== 'undefined' &&
    !!CSS.highlights &&
    typeof Highlight !== 'undefined'
  )
}

function hasExpandedSelection() {
  const selection = window.getSelection()
  return !!selection && !selection.isCollapsed && selection.rangeCount > 0
}

function resolveHighlightPosition(highlight, text) {
  const quote = String(highlight.quote ?? '')
  if (!quote) return null

  const start = Number.isFinite(highlight.start) ? highlight.start : -1
  const end = Number.isFinite(highlight.end) ? highlight.end : -1

  if (start >= 0 && end > start && text.slice(start, end) === quote) {
    return { start, end }
  }

  const candidates = []
  let index = text.indexOf(quote)
  while (index !== -1) {
    candidates.push(index)
    index = text.indexOf(quote, index + 1)
  }
  if (!candidates.length) return null

  const prefix = String(highlight.prefix ?? '')
  const suffix = String(highlight.suffix ?? '')
  const targetStart = start >= 0 ? start : 0

  let best = null
  let bestScore = Number.NEGATIVE_INFINITY

  for (const candidateStart of candidates) {
    let score = 0
    if (prefix) {
      const prefixSlice = text.slice(Math.max(0, candidateStart - prefix.length), candidateStart)
      if (prefixSlice === prefix) score += 3
    }
    if (suffix) {
      const suffixSlice = text.slice(candidateStart + quote.length, candidateStart + quote.length + suffix.length)
      if (suffixSlice === suffix) score += 3
    }
    score -= Math.abs(candidateStart - targetStart) / 1000

    if (score > bestScore) {
      bestScore = score
      best = { start: candidateStart, end: candidateStart + quote.length }
    }
  }

  return best
}

function trimSelectionRange(start, end, text) {
  if (end <= start) return null
  const slice = text.slice(start, end)
  const leading = slice.match(/^\s+/)?.[0].length ?? 0
  const trailing = slice.match(/\s+$/)?.[0].length ?? 0
  const trimmedStart = start + leading
  const trimmedEnd = end - trailing
  if (trimmedEnd <= trimmedStart) return null
  return {
    start: trimmedStart,
    end: trimmedEnd,
    quote: text.slice(trimmedStart, trimmedEnd),
  }
}

export default function ContentView({
  topic,
  completedTopics,
  onNavigate,
  onToggleComplete,
  allTopics,
  scrollPositions,
  onScrollPositionChange,
  highlights,
  onCreateHighlight,
  onRemoveHighlight,
}) {
  const scrollRef = useRef(null)
  const articleRef = useRef(null)
  const resolvedHighlightsRef = useRef([])
  const [popup, setPopup] = useState({ visible: false, x: 0, y: 0, mode: 'add', selection: null, highlightId: null })

  const isDone = completedTopics.has(topic.slug)
  const currentIndex = allTopics.findIndex(t => t.slug === topic.slug)
  const prevTopic = currentIndex > 0 ? allTopics[currentIndex - 1] : null
  const nextTopic = currentIndex < allTopics.length - 1 ? allTopics[currentIndex + 1] : null

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollPositions[topic.slug] ?? 0
    }
  }, [topic.slug])

  useEffect(() => {
    setPopup(prev => ({ ...prev, visible: false }))
  }, [topic.slug])

  useEffect(() => {
    const root = articleRef.current
    if (!root) return

    setPopup(prev => ({ ...prev, visible: false }))
    if (supportsCustomHighlights()) {
      CSS.highlights.delete(HIGHLIGHT_LAYER)
    }
    unwrapHighlightMarks(root)

    const text = root.textContent ?? ''
    const resolved = []
    for (const highlight of highlights) {
      const position = resolveHighlightPosition(highlight, text)
      if (!position) continue
      resolved.push({ ...highlight, ...position })
    }

    resolved.sort((a, b) => a.start - b.start || a.end - b.end)
    const nonOverlapping = []
    let lastEnd = -1
    for (const item of resolved) {
      if (item.start < lastEnd) continue
      nonOverlapping.push(item)
      lastEnd = item.end
    }

    const resolvedList = []
    const useCustomHighlight = supportsCustomHighlights()
    const highlightLayer = useCustomHighlight ? new Highlight() : null

    for (let i = nonOverlapping.length - 1; i >= 0; i -= 1) {
      const item = nonOverlapping[i]
      const range = offsetsToRange(root, item.start, item.end)
      if (!range || range.collapsed) continue

      if (highlightLayer) {
        highlightLayer.add(range)
      } else {
        const mark = document.createElement('mark')
        mark.className = 'user-highlight'
        mark.setAttribute('data-highlight-id', item.id)

        try {
          range.surroundContents(mark)
        } catch {
          const fragment = range.extractContents()
          mark.appendChild(fragment)
          range.insertNode(mark)
        }
      }
      resolvedList.push({ id: item.id, start: item.start, end: item.end })
    }

    if (highlightLayer) {
      CSS.highlights.set(HIGHLIGHT_LAYER, highlightLayer)
    }

    resolvedHighlightsRef.current = resolvedList

    return () => {
      if (supportsCustomHighlights()) {
        CSS.highlights.delete(HIGHLIGHT_LAYER)
      }
    }
  }, [topic.slug, highlights])

  const hidePopup = () => {
    setPopup(prev => ({ ...prev, visible: false }))
  }

  const showPopupForSelection = () => {
    const root = articleRef.current
    if (!root) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return
    }

    const range = selection.getRangeAt(0)
    if (!isRangeInsideRoot(range, root)) {
      hidePopup()
      return
    }

    const startBlock = getBlockAncestor(range.startContainer, root)
    const endBlock = getBlockAncestor(range.endContainer, root)
    if (!startBlock || !endBlock || startBlock !== endBlock) {
      hidePopup()
      return
    }

    const start = pointToOffset(root, range.startContainer, range.startOffset)
    const end = pointToOffset(root, range.endContainer, range.endOffset)
    if (end <= start) {
      hidePopup()
      return
    }

    const text = root.textContent ?? ''
    const trimmed = trimSelectionRange(start, end, text)
    if (!trimmed || !trimmed.quote.trim()) {
      hidePopup()
      return
    }

    const overlapping = resolvedHighlightsRef.current.find(pos =>
      Math.max(trimmed.start, pos.start) < Math.min(trimmed.end, pos.end)
    )
    const highlightId = overlapping?.id ?? null
    const rect = range.getBoundingClientRect()

    setPopup({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      mode: highlightId ? 'remove' : 'add',
      highlightId,
      selection: {
        start: trimmed.start,
        end: trimmed.end,
        quote: trimmed.quote,
        prefix: text.slice(Math.max(0, trimmed.start - CONTEXT_WINDOW), trimmed.start),
        suffix: text.slice(trimmed.end, Math.min(text.length, trimmed.end + CONTEXT_WINDOW)),
      },
    })
  }

  const handleMouseUp = () => {
    setTimeout(showPopupForSelection, 0)
  }

  const handleTouchEnd = () => {
    setTimeout(showPopupForSelection, 0)
  }

  const handleHighlightClick = (event) => {
    // If user is actively selecting text, let selection-driven highlight flow run.
    if (hasExpandedSelection()) return

    const root = articleRef.current
    if (!root) return

    const markTarget = event.target.closest?.('mark[data-highlight-id]')
    if (markTarget) {
      const id = markTarget.getAttribute('data-highlight-id')
      if (!id) return
      const rect = markTarget.getBoundingClientRect()
      window.getSelection()?.removeAllRanges()
      setPopup({
        visible: true,
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
        mode: 'remove',
        highlightId: id,
        selection: null,
      })
      return
    }

    const offset = offsetFromViewportPoint(root, event.clientX, event.clientY)
    if (offset == null) return

    const hit = resolvedHighlightsRef.current.find(item => offset >= item.start && offset < item.end)
    if (!hit) return

    window.getSelection()?.removeAllRanges()
    setPopup({
      visible: true,
      x: event.clientX,
      y: event.clientY - 8,
      mode: 'remove',
      highlightId: hit.id,
      selection: null,
    })
  }

  const handlePopupAction = () => {
    if (popup.mode === 'remove' && popup.highlightId) {
      onRemoveHighlight(topic.slug, popup.highlightId)
      hidePopup()
      return
    }

    if (!popup.selection) return

    onCreateHighlight(topic.slug, {
      id: generateId(),
      quote: popup.selection.quote,
      prefix: popup.selection.prefix,
      suffix: popup.selection.suffix,
      start: popup.selection.start,
      end: popup.selection.end,
      createdAt: Date.now(),
    })
    window.getSelection()?.removeAllRanges()
    hidePopup()
  }

  const components = {
    a: ({ href, children }) => {
      if (href?.match(/^\.\/(?:notes\/)?[\d]+-[\w-]+\.md/)) {
        const slug = href.replace('./', '').replace('notes/', '').replace('.md', '')
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
      onScroll={() => {
        onScrollPositionChange(topic.slug, scrollRef.current?.scrollTop ?? 0)
        hidePopup()
      }}
      onMouseUp={handleMouseUp}
      onTouchEnd={handleTouchEnd}
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

        <article
          className="markdown-body"
          ref={articleRef}
          onMouseDown={hidePopup}
          onClick={handleHighlightClick}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[[rehypeHighlight, highlightOptions]]}
            components={components}
          >
            {topic.content}
          </ReactMarkdown>
        </article>

        {popup.visible && (
          <div
            className="selection-popover"
            style={{ left: `${popup.x}px`, top: `${popup.y}px` }}
            role="dialog"
            aria-label="Highlight actions"
          >
            <button className="selection-popover-btn" onClick={handlePopupAction}>
              {popup.mode === 'remove' ? 'Remove highlight' : 'Highlight'}
            </button>
          </div>
        )}

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
