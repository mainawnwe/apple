import { useMemo } from 'react'

export default function TagsSidebar({
  items,
  activeTags,
  onToggleTag,
  onClearTags,
  tagField = 'tags',
}) {
  // Collect all tags with counts
  const { tags, totalItems, untaggedCount } = useMemo(() => {
    const counts = {}
    let untagged = 0

    items.forEach((item) => {
      const raw = item[tagField] || ''
      const list = raw.split(',').map((t) => t.trim()).filter(Boolean)
      if (list.length === 0) {
        untagged += 1
      } else {
        list.forEach((t) => {
          counts[t] = (counts[t] || 0) + 1
        })
      }
    })

    const sorted = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))

    return {
      tags: sorted,
      totalItems: items.length,
      untaggedCount: untagged,
    }
  }, [items, tagField])

  const isActive = (name) => activeTags.includes(name)
  const hasActive = activeTags.length > 0

  if (totalItems === 0) return null

  return (
    <aside className="tags-sidebar">
      <div className="tags-sidebar-header">
        <span className="tags-title">Tags</span>
        {hasActive && (
          <button
            className="tags-clear"
            onClick={onClearTags}
            style={{ opacity: hasActive ? 1 : 0.3, pointerEvents: hasActive ? 'auto' : 'none' }}
          >
            Clear
          </button>
        )}
      </div>

      <button
        className={`tag-row all ${!hasActive ? 'active' : ''}`}
        onClick={onClearTags}
      >
        <span className="tag-name">📋 All</span>
        <span className="tag-count">{totalItems}</span>
      </button>

      {untaggedCount > 0 && (
        <button
          className={`tag-row ${isActive('__untagged__') ? 'active' : ''}`}
          onClick={() => onToggleTag('__untagged__')}
        >
          <span className="tag-name">○ Untagged</span>
          <span className="tag-count">{untaggedCount}</span>
        </button>
      )}

      {tags.length > 0 && (
        <div className="tags-divider" />
      )}

      {tags.map(({ name, count }) => (
        <button
          key={name}
          className={`tag-row ${isActive(name) ? 'active' : ''}`}
          onClick={() => onToggleTag(name)}
        >
          <span className="tag-name">
            <span className="hash">#</span>{name}
          </span>
          <span className="tag-count">{count}</span>
        </button>
      ))}

      {tags.length === 0 && untaggedCount === 0 && (
        <p className="tags-empty">No tags yet</p>
      )}
    </aside>
  )
}