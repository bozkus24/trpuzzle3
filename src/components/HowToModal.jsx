/**
 * "Nasıl Oynanır" popup'ı. İlk açılışta otomatik gösterilir;
 * "Bir daha gösterme" ile bir daha açılmaz (localStorage).
 */
export default function HowToModal({ onClose, dontShow, onToggleDontShow }) {
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

        <h2 className="modal-title">Nasıl Oynanır</h2>

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
              <span className="sw" style={{ background: '#f3ead6' }} /> Uzak (soğuk)
            </li>
            <li>
              <span className="sw" style={{ background: '#e8873b' }} /> Orta
            </li>
            <li>
              <span className="sw" style={{ background: '#b21f1f' }} /> Yakın (sıcak)
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

        <label className="dontshow">
          <input type="checkbox" checked={dontShow} onChange={onToggleDontShow} />
          Bir daha gösterme
        </label>

        <div className="modal-actions">
          <button className="modal-btn" onClick={onClose}>
            Anladım
          </button>
        </div>
      </div>
    </div>
  )
}
