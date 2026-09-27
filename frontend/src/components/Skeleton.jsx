export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-thumb" />
      <div className="skeleton-body">
        <div className="skeleton skeleton-line w-70" />
        <div className="skeleton skeleton-line w-90" />
        <div className="skeleton skeleton-line w-40" />
      </div>
    </div>
  )
}

export function SkeletonTask() {
  return (
    <div className="skeleton-task">
      <div className="skeleton skeleton-circle" />
      <div className="skeleton-body">
        <div className="skeleton skeleton-line w-60" />
        <div className="skeleton skeleton-line w-80" />
      </div>
    </div>
  )
}

export function SkeletonStat() {
  return (
    <div className="skeleton-stat">
      <div className="skeleton skeleton-line w-40 center" />
      <div className="skeleton skeleton-line w-70 center small" />
    </div>
  )
}

export function SkeletonReminder() {
  return (
    <div className="skeleton-reminder">
      <div className="skeleton skeleton-circle small" />
      <div className="skeleton-body">
        <div className="skeleton skeleton-line w-50" />
        <div className="skeleton skeleton-line w-30 small" />
      </div>
      <div className="skeleton skeleton-line w-20" />
    </div>
  )
}
