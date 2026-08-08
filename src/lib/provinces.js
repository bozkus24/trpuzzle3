import { geoCentroid } from 'd3-geo'
import rawGeo from '../data/provinces.geojson.json'

// Ham GeoJSON (81 il, MultiPolygon). Her feature: { properties: { name, number } }
export const geo = rawGeo

/**
 * Türkçe metni eşleştirme için normalize eder:
 * büyük/küçük harf, Türkçe karakter ve boşluk/işaret farklarını yok sayar.
 * Örn: "İSTANBUL" -> "istanbul", "Ağrı" -> "agri"
 */
export function normalize(str) {
  if (!str) return ''
  let s = String(str)
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .replace(/ı/g, 'i')
    .toLowerCase()
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
  // kalan aksanları da temizle
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return s.replace(/[^a-z0-9]/g, '')
}

// Bir ile ait yaygın alternatif/kısa adlar -> veri setindeki resmi ad
const ALIASES = {
  afyonkarahisar: 'Afyon',
  antep: 'Gaziantep',
  gantep: 'Gaziantep',
  maras: 'Kahramanmaraş',
  kmaras: 'Kahramanmaraş',
  urfa: 'Şanlıurfa',
  icel: 'Mersin',
  constantinople: 'İstanbul',
  izmit: 'Kocaeli',
  adapazari: 'Sakarya',
}

/**
 * Her il için: ad, plaka no, geojson feature'ı ve küresel centroid [lon, lat].
 * Centroid mesafe/sıcaklık ipuçları için kullanılır.
 */
export const provinces = geo.features
  .map((feature) => {
    const name = feature.properties.name
    const [lon, lat] = geoCentroid(feature)
    return {
      name,
      plate: feature.properties.number,
      key: normalize(name),
      feature,
      lon,
      lat,
    }
  })
  .sort((a, b) => a.name.localeCompare(b.name, 'tr'))

// Hızlı arama için: normalize edilmiş ad -> il
const byKey = new Map()
for (const p of provinces) byKey.set(p.key, p)

// Alias'ları da eşleme tablosuna ekle
const aliasByKey = new Map()
for (const [alias, canonical] of Object.entries(ALIASES)) {
  const p = provinces.find((x) => x.name === canonical)
  if (p) aliasByKey.set(normalize(alias), p)
}

/** Kullanıcının yazdığı metne karşılık gelen ili bul (alias'lar dahil). */
export function findProvince(input) {
  const k = normalize(input)
  if (!k) return null
  return byKey.get(k) || aliasByKey.get(k) || null
}

/** Yazarken öneri listesi (en fazla `limit` adet). */
export function suggest(input, limit = 6) {
  const k = normalize(input)
  if (!k) return []
  const starts = []
  const contains = []
  for (const p of provinces) {
    if (p.key.startsWith(k)) starts.push(p)
    else if (p.key.includes(k)) contains.push(p)
  }
  return [...starts, ...contains].slice(0, limit)
}

const R = 6371 // Dünya yarıçapı (km)
const toRad = (d) => (d * Math.PI) / 180

/** İki il arası kuş uçuşu (büyük daire) mesafesi, km. */
export function distanceKm(a, b) {
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

// Türkiye içindeki en uzak iki il arası mesafeye yakın referans (Edirne <-> Hakkari ~1600km)
export const MAX_DISTANCE_KM = 1650

/* ------------------------------------------------------------------ *
 *  EN YAKIN SINIR MESAFESİ (border-to-border)
 *  İki ilin sınırları arasındaki en kısa mesafe (km).
 *  Komşu (sınırdaş) illerde ~0 km çıkar.
 * ------------------------------------------------------------------ */

// Türkiye için yerel düzlem yaklaşımı (küçük ölçekte yeterince doğru)
const LAT_REF = 39
const KX = 111.32 * Math.cos((LAT_REF * Math.PI) / 180) // km / derece boylam
const KY = 110.574 // km / derece enlem

// Polygon / MultiPolygon fark etmeksizin poligon listesine normalize et
function polygonsOf(geometry) {
  return geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
}

// Her il için sınır halkalarını düzlem km koordinatına çevir (bir kez)
function buildPlanar(feature) {
  const rings = []
  for (const poly of polygonsOf(feature.geometry)) {
    for (const ring of poly) {
      const pts = ring.map(([lon, lat]) => [lon * KX, lat * KY])
      if (pts.length >= 2) rings.push(pts)
    }
  }
  return rings
}
for (const p of provinces) p._planar = buildPlanar(p.feature)

// Nokta -> doğru parçası mesafesi (düzlem)
function pointSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax
  const dy = by - ay
  const len2 = dx * dx + dy * dy
  let t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0
  t = t < 0 ? 0 : t > 1 ? 1 : t
  const cx = ax + t * dx
  const cy = ay + t * dy
  return Math.hypot(px - cx, py - cy)
}

// Bir nokta kümesi ile bir halka kümesinin kenarları arası min mesafe
function minPointsToRings(pts, rings, best) {
  for (let i = 0; i < pts.length; i++) {
    const px = pts[i][0]
    const py = pts[i][1]
    for (const ring of rings) {
      for (let j = 0; j < ring.length - 1; j++) {
        const a = ring[j]
        const b = ring[j + 1]
        const d = pointSeg(px, py, a[0], a[1], b[0], b[1])
        if (d < best) best = d
        if (best === 0) return 0
      }
    }
  }
  return best
}

const _borderCache = new Map()

/** İki ilin sınırları arası en kısa mesafe (km). Komşuysa ~0. */
export function borderDistanceKm(a, b) {
  if (a.name === b.name) return 0
  const ck = a.name < b.name ? a.name + '|' + b.name : b.name + '|' + a.name
  const hit = _borderCache.get(ck)
  if (hit !== undefined) return hit
  const ptsA = a._planar.flat()
  const ptsB = b._planar.flat()
  let best = minPointsToRings(ptsA, b._planar, Infinity)
  best = minPointsToRings(ptsB, a._planar, best)
  _borderCache.set(ck, best)
  return best
}

// Sınırdaş sayılma eşiği (km) — ortak sınır koordinatları çakıştığından ~0 çıkar
export const NEIGHBOR_EPS_KM = 3

/** İki il sınırdaş (komşu) mı? */
export function areNeighbors(a, b) {
  if (a.name === b.name) return false
  return borderDistanceKm(a, b) <= NEIGHBOR_EPS_KM
}

// En uzak iki ilin sınır mesafesi (Edirne <-> Hakkari ~1481km) — palet kalibrasyonu
export const MAX_BORDER_KM = 1481
