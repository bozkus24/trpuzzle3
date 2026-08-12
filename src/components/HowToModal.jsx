/**
 * "Nasıl Oynanır" popup'ı. İlk açılışta otomatik gösterilir;
 * "Bir daha gösterme" ile bir daha açılmaz (localStorage).
 */
export default function HowToModal({ onClose, dontShow, onToggleDontShow, showDontShow }) {
  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-label="Nasıl Oynanır"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button className="modal-x" onClick={onClose} aria-label="Kapat">
          ×
        </button>

        <h2 className="modal-title howto-title">
          Nasıl Oynanır
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="howto-q">
            <circle cx="12" cy="12" r="9.2" stroke="currentColor" strokeWidth="2" />
            <path
              d="M9.2 9.3c0-1.6 1.3-2.7 2.9-2.7 1.6 0 2.8 1 2.8 2.5 0 1.3-.8 1.9-1.8 2.5-.9.6-1.2 1-1.2 2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="11.9" cy="17" r="1.2" fill="currentColor" />
          </svg>
        </h2>

        <div className="howto">
          <p>
            Türkiye'nin <b>81 ilinden</b> gizli bir şehri bul. Bir şehir adı yaz ve
            tahmin et.
          </p>
          <p>
            Her tahmin, gizli şehre olan <b>en yakın sınır mesafesine</b> göre boyanır:
          </p>
          <ul className="howto-legend">
            <li>
              <span className="sw" style={{ background: '#f3ead6' }} /> Uzak
            </li>
            <li>
              <span className="sw" style={{ background: '#e8873b' }} /> Orta
            </li>
            <li>
              <span className="sw" style={{ background: '#b21f1f' }} /> Yakın
            </li>
            <li>
              <span className="sw" style={{ background: '#3f8a2e' }} /> Doğru şehir
            </li>
          </ul>
          <p>
            Komşu iller <b>0 km</b>. Tahmin butonunun altında, bir önceki tahmine göre{' '}
            <b>daha sıcak</b> ya da <b>daha soğuk</b> olduğun yazar.
          </p>
          <p>
            <b>Günün Şehri:</b> herkese aynı, günde bir. <b>Sınırsız Pratik:</b> rastgele,
            istediğin kadar.
          </p>
        </div>

        {showDontShow && (
          <label className="dontshow">
            <input type="checkbox" checked={dontShow} onChange={onToggleDontShow} />
            Bir daha gösterme
          </label>
        )}

        <div className="modal-actions">
          <button className="modal-btn" onClick={onClose}>
            Anladım
          </button>
        </div>
      </div>
    </div>
  )
}
