export default function ProgressBar({ completed, total }) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100)
  return (
    <div className="progress-bar-wrapper">
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="progress-bar-label">{completed}/{total} complete · {pct}%</span>
    </div>
  )
}
