/**
 * Ayarlar popup'ı. Şimdilik: Renk körü modu (kırmızı-yeşil karışmasın).
 */
export default function SettingsModal({
  onClose,
  colorBlind,
  onToggleColorBlind,
  dark,
  onToggleDark,
}) {
  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-label="Ayarlar"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button className="modal-x" onClick={onClose} aria-label="Kapat">
          ×
        </button>

        <h2 className="modal-title">Ayarlar</h2>

        <div className="setting-row">
          <div className="setting-text">
            <span className="setting-name">Karanlık mod</span>
            <span className="setting-desc">
              Koyu, haritayla uyumlu bir tema kullanır.
            </span>
          </div>
          <button
            className={'toggle' + (dark ? ' on' : '')}
            role="switch"
            aria-checked={dark}
            aria-label="Karanlık mod"
            onClick={onToggleDark}
          >
            <span className="toggle-knob" />
          </button>
        </div>

        <div className="setting-row">
          <div className="setting-text">
            <span className="setting-name">Renk körü modu</span>
            <span className="setting-desc">
              Doğru şehri mavi gösterir; kırmızı-yeşil ayrımı gerekmez.
            </span>
          </div>
          <button
            className={'toggle' + (colorBlind ? ' on' : '')}
            role="switch"
            aria-checked={colorBlind}
            aria-label="Renk körü modu"
            onClick={onToggleColorBlind}
          >
            <span className="toggle-knob" />
          </button>
        </div>

        <div className="modal-actions">
          <button className="modal-btn" onClick={onClose}>
            Tamam
          </button>
        </div>
      </div>
    </div>
  )
}
