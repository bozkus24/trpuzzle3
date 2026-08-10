import { avgGuesses, winPct, DIST_BUCKETS, bucketIndex } from '../lib/stats'

/**
 * Oyun bitince açılan İstatistik popup'ı.
 * Üstte özet kutuları, altında kazanılan oyunların tahmin dağılımı grafiği.
 */
export default function StatsModal({
  stats,
  guessCount,
  won,
  finished,
  answer,
  mode,
  onClose,
  onPrimary,
  onShare,
  shareLabel,
}) {
  const summary = [
    ['Oynanan', stats.gamesPlayed],
    ['Kazanma %', winPct(stats)],
    ['Güncel seri', stats.currentStreak],
    ['En uzun seri', stats.maxStreak],
    ['Ort. tahmin', avgGuesses(stats)],
    ['En iyi', stats.bestGuesses || '—'],
  ]

  const maxDist = Math.max(1, ...stats.dist)
  const activeBucket = won ? bucketIndex(guessCount) : -1

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

        {finished && !won && (
          <p className="modal-sub">
            Doğru cevap: <b>{answer}</b>
          </p>
        )}

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

        {finished && (
          <div className="modal-actions">
            <button className="modal-btn" onClick={onPrimary}>
              {mode === 'daily' ? 'Pratik' : 'Yeni oyun'}
            </button>
            <button className="modal-btn" onClick={onShare}>
              {shareLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
