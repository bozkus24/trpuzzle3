import { avgGuesses } from '../lib/stats'

/**
 * Oyun bitince açılan İstatistik popup'ı (referans stili).
 * rows: Son galibiyet, Tahmin, Kazanılan oyun, Güncel/En uzun seri, Ort. tahmin.
 */
export default function StatsModal({
  stats,
  guessCount,
  won,
  answer,
  mode,
  onClose,
  onPrimary,
  onShare,
  shareLabel,
}) {
  const rows = [
    ['Son galibiyet', stats.lastWin || '—'],
    ['Bugünkü tahmin', guessCount],
    ['Kazanılan oyun', stats.gamesWon],
    ['Güncel seri', stats.currentStreak],
    ['En uzun seri', stats.maxStreak],
    ['Ort. tahmin', avgGuesses(stats)],
  ]

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

        <p className="modal-sub">
          {won ? (
            <>
              <b>{answer}</b> — {guessCount} tahminde buldun
            </>
          ) : (
            <>
              Doğru cevap: <b>{answer}</b>
            </>
          )}
        </p>

        <div className="stat-rows">
          {rows.map(([label, value]) => (
            <div className="stat-row" key={label}>
              <span className="stat-label">{label}</span>
              <span className="stat-value">{value}</span>
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button className="modal-btn" onClick={onPrimary}>
            {mode === 'daily' ? 'Pratik' : 'Yeni oyun'}
          </button>
          <button className="modal-btn" onClick={onShare}>
            {shareLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
