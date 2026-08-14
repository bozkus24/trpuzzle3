import { avgGuesses, winPct, DIST_BUCKETS, bucketIndex } from '../lib/stats'

/**
 * İstatistik popup'ı.
 * Üstte GÜNÜN sonucu, altında genel istatistikler + tahmin dağılımı ve Paylaş.
 */
export default function StatsModal({
  stats,
  daily,
  dailyAnswer,
  finished,
  mode,
  onClose,
  onPrimary,
  onShare,
  shareLabel,
}) {
  const summary = [
    ['Oynanan', stats.gamesPlayed],
    ['Kazanma yüzdesi', winPct(stats)],
    ['Güncel seri', stats.currentStreak],
    ['En uzun seri', stats.maxStreak],
    ['Ortalama tahmin', avgGuesses(stats)],
    ['En iyi', stats.bestGuesses || '—'],
  ]

  const maxDist = Math.max(1, ...stats.dist)
  const activeBucket = daily.won ? bucketIndex(daily.count) : -1

  let todayText
  if (daily.finished && daily.won) {
    todayText = (
      <>
        Günün şehri <b>{dailyAnswer}</b> — <b>{daily.count}</b> tahminde buldun!
      </>
    )
  } else if (daily.finished) {
    todayText = (
      <>
        Bulamadın. Doğru cevap: <b>{dailyAnswer}</b>
      </>
    )
  } else if (daily.count > 0) {
    todayText = (
      <>
        Henüz bulamadın — <b>{daily.count}</b> tahmin yaptın.
      </>
    )
  } else {
    todayText = <>Günün şehrini henüz tahmin etmedin.</>
  }

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-label="İstatistikler"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button className="modal-x" onClick={onClose} aria-label="Kapat">
          ×
        </button>

        <h2 className="modal-title">İstatistikler</h2>

        {/* Günün sonucu */}
        <div className={'today-card' + (daily.finished && daily.won ? ' win' : '')}>
          <span className="today-label">Günün Şehri</span>
          <span className="today-result">{todayText}</span>
        </div>

        {/* Genel istatistikler */}
        <div className="stat-grid">
          {summary.map(([label, value]) => (
            <div className="stat-box" key={label}>
              <span className="stat-num">{value}</span>
              <span className="stat-cap">{label}</span>
            </div>
          ))}
        </div>

        <h3 className="dist-title">Tahmin dağılımı</h3>
        <div className="dist">
          {DIST_BUCKETS.map((b, i) => (
            <div className="dist-row" key={b.label}>
              <span className="dist-label">{b.label}</span>
              <div className="dist-track">
                <div
                  className={'dist-bar' + (i === activeBucket ? ' active' : '')}
                  style={{ width: `${(stats.dist[i] / maxDist) * 100}%` }}
                >
                  <span className="dist-count">{stats.dist[i]}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button className="modal-btn" onClick={onShare}>
            {shareLabel}
          </button>
          {finished && (
            <button className="modal-btn ghost" onClick={onPrimary}>
              {mode === 'daily' ? 'Pratik' : 'Yeni oyun'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
